"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  cancelSpeak,
  getSpeechRecognition,
  pickKoreanVoice,
  speak,
  type SpeechRecognitionLike,
  type VoiceChatResponse,
  type VoiceMessage,
} from "@/lib/voice";

type Status = "idle" | "speaking" | "listening" | "thinking" | "error";

export type VoiceChatProps = {
  // 페르소나/역할 정의. 페이지마다 다르게.
  systemPrompt: string;
  // 대화를 여는 첫 메시지 (assistant 발화). 마운트 시 자동 재생되지는 않음 — 사용자가 시작 버튼 누르면 재생.
  initialMessage: string;
  // 화면에 표시할 라벨 (예: "미래의 나", "롤모델 — 일론 머스크")
  speakerLabel?: string;
  // 추가 톤 표시(선택)
  accentColor?: string;
};

export default function VoiceChat({
  systemPrompt,
  initialMessage,
  speakerLabel = "미래의 나",
  accentColor = "var(--warm)",
}: VoiceChatProps) {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [supported, setSupported] = useState<{ tts: boolean; stt: boolean }>({
    tts: false,
    stt: false,
  });
  const [started, setStarted] = useState(false);

  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const tts = typeof window !== "undefined" && !!window.speechSynthesis;
    const stt = !!getSpeechRecognition();
    setSupported({ tts, stt });

    if (tts) {
      const apply = () => {
        voiceRef.current = pickKoreanVoice();
      };
      apply();
      window.speechSynthesis.onvoiceschanged = apply;
    }

    return () => {
      cancelSpeak();
      recRef.current?.stop();
    };
  }, []);

  const sayAndAppend = useCallback(async (text: string) => {
    setMessages((prev) => [...prev, { role: "assistant", content: text }]);
    setStatus("speaking");
    await speak(text, voiceRef.current);
    setStatus("idle");
  }, []);

  const handleStart = useCallback(async () => {
    setStarted(true);
    setErrorMsg(null);
    await sayAndAppend(initialMessage);
  }, [initialMessage, sayAndAppend]);

  const handleListen = useCallback(() => {
    setErrorMsg(null);
    const rec = getSpeechRecognition();
    if (!rec) {
      setErrorMsg("이 브라우저는 음성 인식을 지원하지 않습니다. (Chrome 권장)");
      setStatus("error");
      return;
    }
    recRef.current = rec;
    setStatus("listening");

    rec.onresult = async (e) => {
      const last = e.results[e.results.length - 1];
      const transcript = last[0]?.transcript?.trim();
      if (!transcript) return;

      const userMsg: VoiceMessage = { role: "user", content: transcript };
      const next = [...messages, userMsg];
      setMessages(next);
      setStatus("thinking");

      try {
        const res = await fetch("/api/voice-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ systemPrompt, messages: next }),
        });
        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(errBody.error ?? `요청 실패 (${res.status})`);
        }
        const data = (await res.json()) as VoiceChatResponse;
        await sayAndAppend(data.reply);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "응답을 가져오지 못했습니다.");
        setStatus("error");
      }
    };

    rec.onerror = (e) => {
      setErrorMsg(`음성 인식 오류: ${e.error}`);
      setStatus("error");
    };

    rec.onend = () => {
      setStatus((s) => (s === "listening" ? "idle" : s));
    };

    try {
      rec.start();
    } catch {
      // already started — ignore
    }
  }, [messages, systemPrompt, sayAndAppend]);

  const handleStop = useCallback(() => {
    recRef.current?.stop();
    cancelSpeak();
    setStatus("idle");
  }, []);

  if (!supported.tts) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-[13px] text-[var(--ink-3)]">
        이 브라우저는 음성 합성을 지원하지 않습니다. Chrome 또는 Edge에서 열어주세요.
      </div>
    );
  }

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
        <StatusPill status={status} />
      </div>

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
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleListen}
              disabled={status === "listening" || status === "thinking" || status === "speaking"}
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
                    ? "말하는 중…"
                    : supported.stt
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

          {!supported.stt && (
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
