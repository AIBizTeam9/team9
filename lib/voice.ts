// Voice helpers: 자연스러운 음성을 위해 OpenAI TTS를 우선 사용하고,
// 키가 없거나 실패하면 브라우저 Web Speech API로 폴백합니다.
// 브라우저 전용 — client component 안에서만 임포트할 것.

export type VoiceMessage = {
  role: "assistant" | "user";
  content: string;
};

export type VoiceChatPayload = {
  systemPrompt: string;
  messages: VoiceMessage[];
};

export type VoiceChatResponse = {
  reply: string;
};

export type ServerVoiceId =
  | "alloy"
  | "ash"
  | "ballad"
  | "coral"
  | "echo"
  | "fable"
  | "nova"
  | "onyx"
  | "sage"
  | "shimmer";

export type SpeakOptions = {
  // 서버 TTS용 보이스. 미지정 시 nova(따뜻한 여성).
  serverVoice?: ServerVoiceId;
  // 재생 속도 (서버 TTS에서만 적용).
  speed?: number;
  // 폴백 시 사용할 Web Speech voice (자동 선택을 무시하고 강제할 때).
  fallbackVoice?: SpeechSynthesisVoice | null;
};

// 브라우저 SpeechRecognition 타입 (lib.dom.d.ts에 표준화 안 됨)
type SpeechRecognitionResult = {
  isFinal: boolean;
  0: { transcript: string };
};
type SpeechRecognitionEvent = {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechRecognitionResult };
};
export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export function getSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = "ko-KR";
  rec.continuous = false;
  rec.interimResults = false;
  return rec;
}

// 한국어 보이스 우선 선택 — Microsoft Online(Natural) > Google > 그 외 ko-KR > 기본.
export function pickKoreanVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const ko = voices.filter((v) => v.lang === "ko-KR" || v.lang.startsWith("ko"));
  if (ko.length === 0) return null;

  // 1) Microsoft Edge의 Neural 보이스 ("Microsoft SunHi Online (Natural) - Korean (Korea)")
  const msNatural = ko.find(
    (v) => /microsoft/i.test(v.name) && /natural|online/i.test(v.name),
  );
  if (msNatural) return msNatural;

  // 2) Google Korean (Chrome) — 비교적 자연스러움
  const google = ko.find((v) => /google/i.test(v.name));
  if (google) return google;

  // 3) 그 외 — Apple SiriVoice 같은 OS별 고품질 보이스
  const siri = ko.find((v) => /siri|premium|enhanced/i.test(v.name));
  if (siri) return siri;

  // 4) 기본
  return ko[0];
}

// 현재 재생 중인 서버 오디오. cancelSpeak()에서 정지.
let currentAudio: HTMLAudioElement | null = null;

export async function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  if (typeof window === "undefined") return;
  cancelSpeak();

  // 1) 서버 TTS — Audio 엘리먼트가 progressive download로 첫 청크부터 즉시 재생.
  //    fetch()로 받아서 blob로 만드는 방식은 전체 다운로드를 기다려야 했음 → 제거.
  const params = new URLSearchParams({
    text,
    voice: opts.serverVoice ?? "nova",
    speed: String(opts.speed ?? 1.0),
  });
  const url = `/api/tts?${params.toString()}`;

  const playedFromServer = await tryStreamingPlayback(url);
  if (playedFromServer) return;

  // 2) Web Speech API 폴백
  await speakWithWebSpeech(text, opts.fallbackVoice ?? pickKoreanVoice());
}

function tryStreamingPlayback(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = url;
    currentAudio = audio;

    let started = false;
    let settled = false;

    const cleanup = () => {
      if (currentAudio === audio) currentAudio = null;
    };
    const settle = (ok: boolean) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(ok);
    };

    audio.addEventListener("playing", () => {
      started = true;
    });
    audio.addEventListener("ended", () => settle(true));
    // 재생 중 사용자가 cancelSpeak로 끊으면 pause + currentAudio 해제.
    audio.addEventListener("pause", () => {
      if (started) settle(true);
    });
    audio.addEventListener("error", () => {
      // 첫 재생 전 실패 = 서버 503/네트워크 오류 → 폴백 신호. 재생 중 실패는 그냥 끝낸 것으로 처리.
      settle(started);
    });

    audio.play().catch(() => settle(started));
  });
}

function speakWithWebSpeech(
  text: string,
  voice: SpeechSynthesisVoice | null,
): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve();
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.rate = 1.0;
    u.pitch = 1.0;
    if (voice) u.voice = voice;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

export function cancelSpeak(): void {
  if (typeof window === "undefined") return;
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.src = "";
    } catch {
      // ignore
    }
    currentAudio = null;
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// ----------------------------------------------------------------------
// 문장 단위 LLM→TTS 파이프라인을 위한 유틸리티들

// 들어오는 텍스트 청크를 버퍼링했다가 문장 경계가 완성되면 뱉는다.
// 한국어 종결어미(.!?) 또는 줄바꿈 기준. 종결 부호 뒤에 공백/끝이 있어야 진짜 경계.
export class SentenceBuffer {
  private buf = "";

  push(chunk: string): string[] {
    this.buf += chunk;
    return this.drain(false);
  }

  flush(): string[] {
    return this.drain(true);
  }

  private drain(final: boolean): string[] {
    const out: string[] = [];
    while (true) {
      const idx = this.findBoundary();
      if (idx === -1) break;
      const sentence = this.buf.slice(0, idx + 1).trim();
      this.buf = this.buf.slice(idx + 1);
      if (sentence.length > 0) out.push(sentence);
    }
    if (final) {
      const remainder = this.buf.trim();
      this.buf = "";
      if (remainder.length > 0) out.push(remainder);
    }
    return out;
  }

  private findBoundary(): number {
    for (let i = 0; i < this.buf.length; i++) {
      const c = this.buf[i];
      if (c === "." || c === "!" || c === "?" || c === "\n") {
        const next = this.buf[i + 1];
        if (next === undefined || /\s/.test(next)) return i;
      }
    }
    return -1;
  }
}

// 여러 문장의 TTS를 병렬 prefetch하면서 순서대로 재생.
// AudioContext + AnalyserNode가 주어지면 출력을 거기로 라우팅 (파형 시각화용).
export type TTSQueueOptions = {
  audioCtx?: AudioContext | null;
  analyser?: AnalyserNode | null;
  voice: ServerVoiceId;
  speed: number;
  onSpeakingChange?: (speaking: boolean) => void;
};

export class TTSQueue {
  private items: HTMLAudioElement[] = [];
  private current: HTMLAudioElement | null = null;
  private opts: TTSQueueOptions;
  private cancelled = false;

  constructor(opts: TTSQueueOptions) {
    this.opts = opts;
  }

  enqueue(text: string): void {
    if (!text.trim()) return;
    this.cancelled = false;

    const params = new URLSearchParams({
      text,
      voice: this.opts.voice,
      speed: String(this.opts.speed),
    });
    const url = `/api/tts?${params.toString()}`;

    const audio = new Audio();
    audio.preload = "auto";
    audio.src = url; // 즉시 다운로드 시작 (병렬 prefetch)

    if (this.opts.audioCtx && this.opts.analyser) {
      try {
        const source = this.opts.audioCtx.createMediaElementSource(audio);
        source.connect(this.opts.analyser);
        source.connect(this.opts.audioCtx.destination);
      } catch {
        // 이미 연결된 element — 무시
      }
    }

    this.items.push(audio);
    this.tryPlay();
  }

  private tryPlay(): void {
    if (this.cancelled || this.current || this.items.length === 0) return;
    const next = this.items.shift()!;
    this.current = next;
    this.opts.onSpeakingChange?.(true);

    const advance = () => {
      if (this.current === next) this.current = null;
      if (this.items.length > 0 && !this.cancelled) {
        this.tryPlay();
      } else {
        this.opts.onSpeakingChange?.(false);
      }
    };

    next.onended = advance;
    next.onerror = advance;
    next.play().catch(advance);
  }

  cancel(): void {
    this.cancelled = true;
    if (this.current) {
      try {
        this.current.pause();
      } catch {
        // ignore
      }
      this.current = null;
    }
    for (const a of this.items) {
      try {
        a.pause();
        a.src = "";
      } catch {
        // ignore
      }
    }
    this.items = [];
    this.opts.onSpeakingChange?.(false);
  }

  isActive(): boolean {
    return !this.cancelled && (this.current !== null || this.items.length > 0);
  }
}
