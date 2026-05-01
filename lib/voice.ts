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

  // 1) 서버 TTS 시도 (OpenAI). 503/실패 시 폴백.
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voice: opts.serverVoice ?? "nova",
        speed: opts.speed ?? 1.0,
      }),
    });
    if (res.ok) {
      const blob = await res.blob();
      await playBlob(blob);
      return;
    }
    // 503 = 키 미구성, 폴백으로 진행
  } catch {
    // 네트워크 오류도 폴백으로
  }

  // 2) Web Speech API 폴백
  await speakWithWebSpeech(text, opts.fallbackVoice ?? pickKoreanVoice());
}

function playBlob(blob: Blob): Promise<void> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    const cleanup = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      resolve();
    };
    audio.onended = cleanup;
    audio.onerror = cleanup;
    audio.onpause = () => {
      // 사용자가 cancelSpeak로 중단한 경우에도 resolve.
      if (audio.currentTime > 0 && !audio.ended) cleanup();
    };
    audio.play().catch(cleanup);
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
