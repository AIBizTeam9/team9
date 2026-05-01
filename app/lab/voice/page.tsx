"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import VoiceChat from "@/components/voice-chat";
import type { ServerVoiceId } from "@/lib/voice";

type Preset = {
  id: string;
  label: string;
  speakerLabel: string;
  accentColor: string;
  systemPrompt: string;
  initialMessage: string;
  ownerHint: string;
  voice: ServerVoiceId;
};

const VOICE_OPTIONS: { id: ServerVoiceId; desc: string }[] = [
  { id: "nova", desc: "여성 · 따뜻함 (기본)" },
  { id: "shimmer", desc: "여성 · 부드러움" },
  { id: "coral", desc: "여성 · 밝음" },
  { id: "sage", desc: "여성 · 차분" },
  { id: "alloy", desc: "중성 · 균형" },
  { id: "ballad", desc: "남성 · 차분" },
  { id: "echo", desc: "남성 · 또렷함" },
  { id: "onyx", desc: "남성 · 깊고 묵직" },
  { id: "ash", desc: "남성 · 단단함" },
  { id: "fable", desc: "영국식 · 동화 톤" },
];

const PRESETS: Preset[] = [
  {
    id: "future-self",
    label: "미래의 나",
    speakerLabel: "10년 뒤의 나",
    accentColor: "var(--warm)",
    ownerHint: "공통 / 데모",
    voice: "nova",
    systemPrompt: `당신은 사용자의 10년 뒤 미래 자아입니다.
지혜롭지만 잘난 척하지 않고, 친한 형/언니처럼 반말로 다정하게 말합니다.
사용자의 현재 고민을 듣고 미래에서 본 관점으로 짧고 구체적인 조언을 줍니다.
답을 강요하지 않고 사용자가 스스로 결정하도록 돕습니다.`,
    initialMessage:
      "안녕, 내가 10년 뒤의 너야. 지금 너의 머릿속에 가장 크게 자리잡고 있는 고민이 뭐야?",
  },
  {
    id: "plan-coach",
    label: "플랜 코치",
    speakerLabel: "90일 플랜 코치",
    accentColor: "var(--green)",
    ownerHint: "석빈 / /plan",
    voice: "sage",
    systemPrompt: `당신은 사용자의 90일 플랜을 같이 다듬는 실용적인 코치입니다.
비현실적인 항목을 짚어주고, 더 작은 첫 행동을 제안합니다.
반말로 다정하지만 단호하게 말합니다. 칭찬보다 다음 행동에 초점을 둡니다.`,
    initialMessage:
      "오늘 너의 플랜 한번 같이 봐볼까? 가장 자신 없는 항목 하나만 말해줘.",
  },
  {
    id: "rolemodel-mentor",
    label: "롤모델 멘토",
    speakerLabel: "롤모델 — 가상 멘토",
    accentColor: "var(--blue)",
    ownerHint: "재림 / /rolemodel",
    voice: "onyx",
    systemPrompt: `당신은 사용자가 선택한 롤모델의 정신을 빌린 가상의 멘토입니다.
그 인물의 철학과 말투를 흉내 내되, 사용자에게는 반말로 친근하게 말합니다.
당시 그 인물이 비슷한 갈림길에서 어떻게 생각했는지 짧은 일화로 답합니다.`,
    initialMessage:
      "그래, 너의 다음 갈림길이 뭐야? 내가 그 시기에 뭘 봤는지 한번 들려줄게.",
  },
  {
    id: "debate-a",
    label: "디베이트 — 안정 자아",
    speakerLabel: "안정을 택한 나",
    accentColor: "var(--blue)",
    ownerHint: "재림 / /debate",
    voice: "shimmer",
    systemPrompt: `당신은 사용자가 '안정적인 길'을 택했을 때의 미래 자아입니다.
그 선택의 장점과 후회를 솔직하게 말합니다. 거짓 위안을 주지 않고, 다른 선택지의 자아도 존중합니다.
반말로 침착하게 말합니다.`,
    initialMessage:
      "나는 너가 안정을 택했을 때의 너야. 그 길에서 내가 본 걸 들려줄게 — 뭐가 가장 궁금해?",
  },
  {
    id: "debate-b",
    label: "디베이트 — 도전 자아",
    speakerLabel: "도전을 택한 나",
    accentColor: "var(--warm)",
    ownerHint: "재림 / /debate",
    voice: "coral",
    systemPrompt: `당신은 사용자가 '도전적인 길'을 택했을 때의 미래 자아입니다.
그 선택의 짜릿함과 대가를 솔직하게 말합니다. 무모함을 미화하지 않고, 다른 선택지의 자아도 존중합니다.
반말로 에너지 있게 말합니다.`,
    initialMessage:
      "나는 너가 도전을 택했을 때의 너야. 그 길은 안 편했어. 근데 후회는 없어. 뭐가 제일 망설여져?",
  },
];

const CUSTOM_ID = "__custom__";

export default function LabVoicePage() {
  const [selectedId, setSelectedId] = useState<string>(PRESETS[0].id);
  const [customLabel, setCustomLabel] = useState("커스텀 페르소나");
  const [customSystem, setCustomSystem] = useState("");
  const [customInitial, setCustomInitial] = useState("");
  const [customAccent, setCustomAccent] = useState("var(--warm)");
  const [voiceOverride, setVoiceOverride] = useState<ServerVoiceId | "preset">("preset");
  const [speed, setSpeed] = useState<number>(1.0);
  const [resetKey, setResetKey] = useState(0);

  const active = useMemo(() => {
    const presetVoice =
      selectedId === CUSTOM_ID
        ? "nova"
        : (PRESETS.find((x) => x.id === selectedId) ?? PRESETS[0]).voice;
    const voice: ServerVoiceId =
      voiceOverride === "preset" ? presetVoice : voiceOverride;

    if (selectedId === CUSTOM_ID) {
      return {
        systemPrompt: customSystem.trim(),
        initialMessage: customInitial.trim(),
        speakerLabel: customLabel.trim() || "커스텀 페르소나",
        accentColor: customAccent,
        voice,
      };
    }
    const p = PRESETS.find((x) => x.id === selectedId) ?? PRESETS[0];
    return {
      systemPrompt: p.systemPrompt,
      initialMessage: p.initialMessage,
      speakerLabel: p.speakerLabel,
      accentColor: p.accentColor,
      voice,
    };
  }, [
    selectedId,
    customSystem,
    customInitial,
    customLabel,
    customAccent,
    voiceOverride,
  ]);

  const customReady = customSystem.trim().length > 20 && customInitial.trim().length > 0;
  const canRender = selectedId !== CUSTOM_ID || customReady;

  const handleSwitch = (id: string) => {
    setSelectedId(id);
    setResetKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <section className="max-w-[860px] mx-auto px-6 pt-12 pb-24">
        <div className="mb-6">
          <Link
            href="/lab"
            className="text-[12px] tracking-[0.04em] uppercase"
            style={{ color: "var(--ink-3)" }}
          >
            ← Lab
          </Link>
        </div>

        <div className="mb-8">
          <h1
            className="font-serif text-4xl tracking-[-0.02em] mb-3"
            style={{ color: "var(--ink)" }}
          >
            음성 대화 테스트 환경
          </h1>
          <p className="text-[14px] leading-relaxed" style={{ color: "var(--ink-3)" }}>
            프리셋 페르소나를 골라 즉시 시연하거나, 커스텀 프롬프트를 작성해 본인 페이지 통합 전에 검증하세요. (Chrome / Edge 권장)
          </p>
        </div>

        {/* Preset chooser */}
        <div className="mb-5">
          <p
            className="text-[11px] font-medium tracking-[0.08em] uppercase mb-3"
            style={{ color: "var(--ink-3)" }}
          >
            프리셋 페르소나
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const selected = selectedId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSwitch(p.id)}
                  className="px-3 py-2 rounded-full text-[12px] transition-all"
                  style={{
                    background: selected ? p.accentColor : "var(--bg-2)",
                    color: selected ? "white" : "var(--ink-2)",
                    border: `1px solid ${selected ? p.accentColor : "var(--line)"}`,
                  }}
                  title={p.ownerHint}
                >
                  {p.label}
                  <span
                    className="ml-2 text-[10px] opacity-70"
                    style={{ color: selected ? "white" : "var(--ink-3)" }}
                  >
                    {p.ownerHint}
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => handleSwitch(CUSTOM_ID)}
              className="px-3 py-2 rounded-full text-[12px] transition-all"
              style={{
                background: selectedId === CUSTOM_ID ? "var(--ink)" : "var(--bg-2)",
                color: selectedId === CUSTOM_ID ? "white" : "var(--ink-2)",
                border: `1px solid ${selectedId === CUSTOM_ID ? "var(--ink)" : "var(--line)"}`,
              }}
            >
              + 커스텀 작성
            </button>
          </div>
        </div>

        {/* Custom builder */}
        {selectedId === CUSTOM_ID && (
          <div
            className="mb-5 rounded-2xl p-5 space-y-3"
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--line)",
            }}
          >
            <p
              className="text-[11px] font-medium tracking-[0.08em] uppercase"
              style={{ color: "var(--ink-3)" }}
            >
              커스텀 프롬프트 빌더
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="화자 이름 (speakerLabel)">
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-[13px] bg-[var(--bg)]"
                  style={{ border: "1px solid var(--line)", color: "var(--ink)" }}
                  placeholder="예: 미래의 나"
                />
              </Field>
              <Field label="강조색 (accentColor)">
                <select
                  value={customAccent}
                  onChange={(e) => setCustomAccent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-[13px] bg-[var(--bg)]"
                  style={{ border: "1px solid var(--line)", color: "var(--ink)" }}
                >
                  <option value="var(--warm)">warm (오렌지)</option>
                  <option value="var(--blue)">blue</option>
                  <option value="var(--green)">green</option>
                </select>
              </Field>
            </div>

            <Field label="systemPrompt — 페르소나 정의">
              <textarea
                value={customSystem}
                onChange={(e) => setCustomSystem(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 rounded-lg text-[13px] bg-[var(--bg)] font-mono leading-relaxed"
                style={{ border: "1px solid var(--line)", color: "var(--ink)" }}
                placeholder="당신은 ~ 입니다.&#10;말투: 반말 / 다정 / 단호&#10;목표: 사용자가 다음 한 가지 행동을 결정하도록 돕는다."
              />
            </Field>

            <Field label="initialMessage — 첫 발화">
              <textarea
                value={customInitial}
                onChange={(e) => setCustomInitial(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg text-[13px] bg-[var(--bg)] leading-relaxed"
                style={{ border: "1px solid var(--line)", color: "var(--ink)" }}
                placeholder="안녕, 오늘 가장 마음에 걸리는 건 뭐야?"
              />
            </Field>

            {!customReady && (
              <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>
                systemPrompt(20자 이상)와 initialMessage를 채우면 아래에 음성 카드가 활성화됩니다.
              </p>
            )}
          </div>
        )}

        {/* Voice tuning */}
        <div
          className="mb-5 rounded-2xl p-5 grid gap-3 sm:grid-cols-2"
          style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}
        >
          <Field label="목소리 (OpenAI TTS)">
            <select
              value={voiceOverride}
              onChange={(e) =>
                setVoiceOverride(e.target.value as ServerVoiceId | "preset")
              }
              className="w-full px-3 py-2 rounded-lg text-[13px] bg-[var(--bg)]"
              style={{ border: "1px solid var(--line)", color: "var(--ink)" }}
            >
              <option value="preset">프리셋 기본 사용</option>
              {VOICE_OPTIONS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.id} — {v.desc}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`발화 속도 (${speed.toFixed(2)}x)`}>
            <input
              type="range"
              min={0.7}
              max={1.3}
              step={0.05}
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
          </Field>
          <p
            className="sm:col-span-2 text-[11px]"
            style={{ color: "var(--ink-3)" }}
          >
            OpenAI TTS가 있으면 자연스러운 음성으로, 키가 없으면 브라우저 Web Speech로 자동 폴백됩니다.
          </p>
        </div>

        {/* Voice chat */}
        {canRender ? (
          <VoiceChat
            key={`${selectedId}-${voiceOverride}-${speed}-${resetKey}`}
            systemPrompt={active.systemPrompt}
            initialMessage={active.initialMessage}
            speakerLabel={active.speakerLabel}
            accentColor={active.accentColor}
            serverVoice={active.voice}
            speed={speed}
          />
        ) : (
          <div
            className="rounded-2xl p-6 text-[13px]"
            style={{
              background: "var(--bg-2)",
              border: "1px dashed var(--line-2)",
              color: "var(--ink-3)",
            }}
          >
            커스텀 프롬프트를 채우면 여기에 대화 카드가 나타납니다.
          </div>
        )}

        <button
          onClick={() => setResetKey((k) => k + 1)}
          className="mt-3 px-3 py-1.5 rounded-full text-[12px]"
          style={{
            background: "var(--bg-2)",
            color: "var(--ink-3)",
            border: "1px solid var(--line)",
          }}
        >
          대화 초기화
        </button>

        {/* Snippet */}
        <div
          className="mt-10 rounded-2xl p-5"
          style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}
        >
          <p
            className="text-[11px] font-medium tracking-[0.08em] uppercase mb-3"
            style={{ color: "var(--ink-3)" }}
          >
            본인 페이지에 박을 코드 스니펫
          </p>
          <pre
            className="text-[12px] leading-relaxed overflow-x-auto p-3 rounded-lg"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--line)",
              color: "var(--ink-2)",
            }}
          >
{`import VoiceChat from "@/components/voice-chat";

<VoiceChat
  systemPrompt={\`${escapeBackticks(active.systemPrompt)}\`}
  initialMessage="${active.initialMessage.replace(/"/g, '\\"')}"
  speakerLabel="${active.speakerLabel}"
  accentColor="${active.accentColor}"
  serverVoice="${active.voice}"
  speed={${speed.toFixed(2)}}
/>`}
          </pre>
          <p className="text-[11px] mt-3" style={{ color: "var(--ink-3)" }}>
            전체 통합 가이드는{" "}
            <code className="px-1.5 py-0.5 rounded bg-[var(--accent-2)]">
              docs/VOICE_INTEGRATION.md
            </code>
            .
          </p>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span
        className="block text-[11px] font-medium tracking-[0.06em] uppercase mb-1.5"
        style={{ color: "var(--ink-3)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function escapeBackticks(s: string): string {
  return s.replace(/`/g, "\\`").replace(/\$/g, "\\$");
}
