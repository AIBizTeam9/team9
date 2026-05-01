import VoiceChat from "@/components/voice-chat";

export const metadata = {
  title: "음성 대화 데모 — Next Step in Life",
  description: "미래의 나와 음성으로 대화하는 데모 페이지",
};

const SYSTEM_PROMPT = `당신은 사용자의 10년 뒤 미래 자아입니다.
지혜롭지만 잘난 척하지 않고, 친한 형/언니처럼 반말로 다정하게 말합니다.
사용자의 현재 고민을 듣고, 미래에서 본 관점으로 짧고 구체적인 조언을 줍니다.
당신은 사용자가 결정을 내리도록 돕지만 답을 강요하지 않습니다.`;

const INITIAL_MESSAGE =
  "안녕, 내가 10년 뒤의 너야. 지금 너의 머릿속에 가장 크게 자리잡고 있는 고민이 뭐야?";

export default function VoiceDemoPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <section className="max-w-[680px] mx-auto px-6 pt-16 pb-24">
        <div className="mb-8">
          <p
            className="text-[12px] font-medium tracking-[0.08em] uppercase mb-2"
            style={{ color: "var(--ink-3)" }}
          >
            Voice Chat · Demo
          </p>
          <h1
            className="font-serif text-4xl tracking-[-0.02em] mb-3"
            style={{ color: "var(--ink)" }}
          >
            미래의 나와 음성 대화
          </h1>
          <p className="text-[14px] leading-relaxed" style={{ color: "var(--ink-3)" }}>
            아래 카드의 시작 버튼을 누르면 미래의 자아가 먼저 말을 걸어옵니다. 그 다음 마이크를 눌러 답하면 됩니다. (Chrome/Edge 권장)
          </p>
        </div>

        <VoiceChat
          systemPrompt={SYSTEM_PROMPT}
          initialMessage={INITIAL_MESSAGE}
          speakerLabel="미래의 나"
          accentColor="var(--warm)"
        />

        <div className="mt-10 rounded-xl border border-[var(--line)] p-5">
          <p
            className="text-[11px] font-medium tracking-[0.08em] uppercase mb-2"
            style={{ color: "var(--ink-3)" }}
          >
            팀원 통합 가이드
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
            각자 담당 페이지에 음성 대화 기능을 붙이려면{" "}
            <code className="px-1.5 py-0.5 rounded bg-[var(--accent-2)] text-[12px]">
              docs/VOICE_INTEGRATION.md
            </code>{" "}
            파일의 프롬프트를 Claude Code에 그대로 붙여넣으세요. 페르소나 정의만 바꾸면 됩니다.
          </p>
        </div>
      </section>
    </div>
  );
}
