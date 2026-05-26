"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  cancelSpeak,
  getSpeechRecognition,
  SentenceBuffer,
  TTSQueue,
  type ServerVoiceId,
  type SpeechRecognitionLike,
  type VoiceMessage,
} from "@/lib/voice";
import VoiceWaveform from "./voice-waveform";

type Status = "idle" | "speaking" | "listening" | "thinking" | "error";

export type VoiceChatProps = {
  systemPrompt: string;
  initialMessage: string;
  speakerLabel?: string;
  accentColor?: string;
  serverVoice?: ServerVoiceId;
  speed?: number;
  // barge-in (AI 발화 중 사용자가 말하면 자동 끊고 듣기). 기본 on.
  bargeIn?: boolean;
};

// Barge-in 임계값 — 마이크 평균 byte freq amplitude(0~255).
// 너무 낮으면 잡음에 끊기고, 너무 높으면 작은 목소리에 반응 안 함.
const BARGE_IN_THRESHOLD = 28;
const BARGE_IN_REQUIRED_FRAMES = 6; // ~100ms @ 60fps

export default function VoiceChat({
  systemPrompt,
  initialMessage,
  speakerLabel = "미래의 나",
  accentColor = "var(--warm)",
  serverVoice = "nova",
  speed = 1.4,
  bargeIn = true,
}: VoiceChatProps) {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [streamingText, setStreamingText] = useState<string>(""); // 현재 스트리밍 중인 어시스턴트 텍스트
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [activeAnalyser, setActiveAnalyser] =
    useState<AnalyserNode | null>(null);

  // refs (이벤트 핸들러에서 최신 값 접근하려고)
  const statusRef = useRef<Status>("idle");
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  const messagesRef = useRef<VoiceMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const ttsQueueRef = useRef<TTSQueue | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const vadRafRef = useRef<number | null>(null);
  const sttSupportedRef = useRef<boolean>(false);

  useEffect(() => {
    sttSupportedRef.current = !!getSpeechRecognition();
    return () => {
      cleanupAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanupAll = useCallback(() => {
    if (vadRafRef.current !== null) {
      cancelAnimationFrame(vadRafRef.current);
      vadRafRef.current = null;
    }
    ttsQueueRef.current?.cancel();
    cancelSpeak();
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (micStreamRef.current) {
      for (const track of micStreamRef.current.getTracks()) track.stop();
      micStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  // ---------- core LLM streaming ----------
  const streamLLM = useCallback(
    async (userMessages: VoiceMessage[]) => {
      const sentenceBuf = new SentenceBuffer();
      let fullText = "";
      setStreamingText("");
      setStatus("thinking");
      setActiveAnalyser(outputAnalyserRef.current);

      try {
        const res = await fetch("/api/voice-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ systemPrompt, messages: userMessages }),
        });
        if (!res.ok || !res.body) {
          const errBody = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(errBody.error ?? `요청 실패 (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let lineBuf = "";

        const dispatchSentences = (sentences: string[]) => {
          if (sentences.length === 0) return;
          if (statusRef.current !== "speaking") setStatus("speaking");
          for (const s of sentences) ttsQueueRef.current?.enqueue(s);
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          lineBuf += decoder.decode(value, { stream: true });
          const lines = lineBuf.split("\n");
          lineBuf = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (!payload) continue;
            if (payload === "[DONE]") continue;
            try {
              const data = JSON.parse(payload) as {
                delta?: string;
                error?: string;
              };
              if (data.error) throw new Error(data.error);
              if (data.delta) {
                fullText += data.delta;
                setStreamingText(fullText);
                dispatchSentences(sentenceBuf.push(data.delta));
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue; // 부분 SSE
              throw e;
            }
          }
        }

        dispatchSentences(sentenceBuf.flush());

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: fullText },
        ]);
        setStreamingText("");
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : "응답을 가져오지 못했습니다.",
        );
        setStatus("error");
        setStreamingText("");
      }
    },
    [systemPrompt],
  );

  // ---------- listening (STT) ----------
  const handleListen = useCallback(() => {
    setErrorMsg(null);
    const rec = getSpeechRecognition();
    if (!rec) {
      setErrorMsg("이 브라우저는 음성 인식을 지원하지 않습니다. (Chrome 권장)");
      setStatus("error");
      return;
    }
    recognitionRef.current = rec;
    setStatus("listening");
    setActiveAnalyser(micAnalyserRef.current);

    rec.onresult = async (e) => {
      const last = e.results[e.results.length - 1];
      const transcript = last[0]?.transcript?.trim();
      if (!transcript) return;

      const userMsg: VoiceMessage = { role: "user", content: transcript };
      const next = [...messagesRef.current, userMsg];
      setMessages(next);
      await streamLLM(next);
    };
    rec.onerror = (e) => {
      // "no-speech"는 정상적인 침묵 종료 — 에러로 표시 안 함
      if (e.error !== "no-speech" && e.error !== "aborted") {
        setErrorMsg(`음성 인식 오류: ${e.error}`);
        setStatus("error");
      } else if (statusRef.current === "listening") {
        setStatus("idle");
      }
    };
    rec.onend = () => {
      if (statusRef.current === "listening") setStatus("idle");
    };

    try {
      rec.start();
    } catch {
      // 이미 시작됨
    }
  }, [streamLLM]);

  // ---------- barge-in: VAD loop ----------
  const startVAD = useCallback(() => {
    const analyser = micAnalyserRef.current;
    if (!analyser) return;
    const buffer = new Uint8Array(analyser.frequencyBinCount);
    let loudFrames = 0;

    const tick = () => {
      analyser.getByteFrequencyData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) sum += buffer[i];
      const avg = sum / buffer.length;

      if (
        bargeIn &&
        statusRef.current === "speaking" &&
        avg > BARGE_IN_THRESHOLD
      ) {
        loudFrames++;
        if (loudFrames >= BARGE_IN_REQUIRED_FRAMES) {
          loudFrames = 0;
          ttsQueueRef.current?.cancel();
          if (sttSupportedRef.current) {
            handleListen();
          } else {
            setStatus("idle");
          }
          // 한 번 트리거되면 다음 speaking까지 쉼
        }
      } else {
        loudFrames = 0;
      }

      vadRafRef.current = requestAnimationFrame(tick);
    };
    vadRafRef.current = requestAnimationFrame(tick);
  }, [bargeIn, handleListen]);

  // ---------- start ----------
  const handleStart = useCallback(async () => {
    setErrorMsg(null);
    try {
      // 1) AudioContext + mic stream
      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();

      // mic permission (echoCancellation으로 스피커 → 마이크 leak 줄임)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      const micSource = ctx.createMediaStreamSource(stream);
      const micAnalyser = ctx.createAnalyser();
      micAnalyser.fftSize = 256;
      micAnalyser.smoothingTimeConstant = 0.6;
      micSource.connect(micAnalyser);
      micAnalyserRef.current = micAnalyser;

      const outputAnalyser = ctx.createAnalyser();
      outputAnalyser.fftSize = 256;
      outputAnalyser.smoothingTimeConstant = 0.7;
      outputAnalyserRef.current = outputAnalyser;

      // 2) TTS queue
      ttsQueueRef.current = new TTSQueue({
        audioCtx: ctx,
        analyser: outputAnalyser,
        voice: serverVoice,
        speed,
        onSpeakingChange: (speaking) => {
          if (!speaking && statusRef.current === "speaking") {
            setStatus("idle");
          }
        },
      });

      // 3) VAD loop
      startVAD();

      // 4) initial message
      setStarted(true);
      const initialMsg: VoiceMessage = {
        role: "assistant",
        content: initialMessage,
      };
      setMessages([initialMsg]);
      setStatus("speaking");
      setActiveAnalyser(outputAnalyser);
      ttsQueueRef.current.enqueue(initialMessage);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? `시작 실패: ${err.message}`
          : "마이크 권한이 필요합니다.",
      );
      setStatus("error");
    }
  }, [initialMessage, serverVoice, speed, startVAD]);

  const handleStop = useCallback(() => {
    ttsQueueRef.current?.cancel();
    recognitionRef.current?.stop();
    setStatus("idle");
  }, []);

  // status가 변할 때 active analyser도 같이 바꿈
  useEffect(() => {
    if (status === "speaking") setActiveAnalyser(outputAnalyserRef.current);
    else if (status === "listening") setActiveAnalyser(micAnalyserRef.current);
    else if (status === "idle") setActiveAnalyser(null);
  }, [status]);

  return (
    <div
      className="rounded-2xl border border-[var(--line)] bg-[var(--bg-2)] p-6"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: accentColor }}
          />
          <span className="text-[13px] font-semibold text-[var(--ink)]">
            {speakerLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {bargeIn && started && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.06em]"
              style={{
                background: "var(--accent-2)",
                color: "var(--ink-3)",
              }}
              title="AI가 말하는 중에도 사용자가 말하면 자동으로 끊고 들음"
            >
              barge-in
            </span>
          )}
          <StatusPill status={status} />
        </div>
      </div>

      {/* Waveform */}
      {started && (
        <div
          className="mb-4 rounded-lg p-2"
          style={{
            background: "var(--bg)",
            border: "1px solid var(--line)",
          }}
        >
          <VoiceWaveform
            analyser={activeAnalyser}
            active={
              status === "speaking" ||
              status === "listening" ||
              status === "thinking"
            }
            color={
              status === "listening"
                ? "var(--blue)"
                : status === "thinking"
                  ? "var(--green)"
                  : accentColor
            }
          />
        </div>
      )}

      {!started ? (
        <button
          onClick={handleStart}
          className="w-full px-4 py-3 rounded-full text-[14px] font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "var(--accent)" }}
        >
          음성 대화 시작
        </button>
      ) : (
        <>
          <div className="space-y-3 mb-4 max-h-[280px] overflow-y-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className="text-[13px] leading-relaxed"
                style={{
                  color: m.role === "assistant" ? "var(--ink)" : "var(--ink-3)",
                }}
              >
                <span className="text-[11px] uppercase tracking-[0.06em] mr-2 opacity-60">
                  {m.role === "assistant" ? speakerLabel : "나"}
                </span>
                {m.content}
              </div>
            ))}
            {streamingText && (
              <div
                className="text-[13px] leading-relaxed"
                style={{ color: "var(--ink)" }}
              >
                <span className="text-[11px] uppercase tracking-[0.06em] mr-2 opacity-60">
                  {speakerLabel}
                </span>
                {streamingText}
                <span className="inline-block w-1.5 h-3 ml-0.5 bg-current opacity-50 animate-pulse align-middle" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleListen}
              disabled={
                status === "listening" ||
                status === "thinking" ||
                status === "speaking"
              }
              className="flex-1 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all disabled:opacity-40"
              style={{
                background: status === "listening" ? accentColor : "var(--accent)",
                color: "white",
              }}
            >
              {status === "listening"
                ? "듣는 중…"
                : status === "thinking"
                  ? "생각 중…"
                  : status === "speaking"
                    ? bargeIn
                      ? "말하는 중… (말 걸어 끊을 수 있음)"
                      : "말하는 중…"
                    : sttSupportedRef.current
                      ? "🎤 말하기"
                      : "음성 인식 미지원"}
            </button>
            <button
              onClick={handleStop}
              className="px-4 py-2.5 rounded-full text-[13px] font-medium transition-all hover:bg-[var(--accent-2)]"
              style={{
                color: "var(--ink-2)",
                border: "1px solid var(--line-2)",
              }}
            >
              정지
            </button>
          </div>

          {!sttSupportedRef.current && (
            <p className="text-[11px] mt-2 text-[var(--ink-3)]">
              음성 인식 미지원 브라우저입니다. Chrome 또는 Edge에서 마이크 입력이 가능합니다.
            </p>
          )}
        </>
      )}

      {errorMsg && (
        <div className="mt-3 text-[12px] text-[var(--warm)]">{errorMsg}</div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, { label: string; bg: string; fg: string }> = {
    idle: { label: "대기", bg: "var(--accent-2)", fg: "var(--ink-3)" },
    speaking: { label: "발화", bg: "var(--warm-soft)", fg: "var(--warm)" },
    listening: { label: "수음", bg: "var(--blue-soft)", fg: "var(--blue)" },
    thinking: { label: "사고", bg: "var(--green-soft)", fg: "var(--green)" },
    error: { label: "오류", bg: "var(--warm-soft)", fg: "var(--warm)" },
  };
  const s = map[status];
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.06em]"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}
