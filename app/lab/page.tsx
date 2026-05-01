import Link from "next/link";

export const metadata = {
  title: "실험실 — Next Step in Life",
  description: "프로덕션 합류 전 새 기능을 테스트하는 비공개 실험 공간",
  robots: { index: false, follow: false },
};

const EXPERIMENTS = [
  {
    href: "/lab/voice",
    title: "음성 대화 (TTS + STT)",
    desc: "미래의 자아·코치·롤모델 등 페르소나와 음성으로 대화. 프리셋 + 커스텀 프롬프트 빌더 포함.",
    owner: "동근",
    status: "테스트 중",
    color: "var(--warm)",
  },
];

export default function LabPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <section className="max-w-[860px] mx-auto px-6 pt-16 pb-24">
        <div className="mb-10">
          <p
            className="text-[12px] font-medium tracking-[0.08em] uppercase mb-2"
            style={{ color: "var(--ink-3)" }}
          >
            Lab · Internal
          </p>
          <h1
            className="font-serif text-4xl tracking-[-0.02em] mb-3"
            style={{ color: "var(--ink)" }}
          >
            실험실
          </h1>
          <p className="text-[14px] leading-relaxed" style={{ color: "var(--ink-3)" }}>
            네비게이션에 없는 비공개 경로. 프로덕션 합류 전 기능을 시연·디버깅하는 공간입니다.
            팀원들에게 공유해도 되지만 사용자에게는 노출하지 마세요.
          </p>
        </div>

        <div className="grid gap-3">
          {EXPERIMENTS.map((exp) => (
            <Link
              key={exp.href}
              href={exp.href}
              className="group rounded-2xl p-5 transition-all hover:shadow-lg"
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--line)",
                boxShadow: "var(--shadow)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: exp.color }}
                    />
                    <span
                      className="text-[10px] uppercase tracking-[0.06em] px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--accent-2)",
                        color: "var(--ink-3)",
                      }}
                    >
                      {exp.status}
                    </span>
                  </div>
                  <h3
                    className="font-serif text-[20px] tracking-[-0.01em] mb-1"
                    style={{ color: "var(--ink)" }}
                  >
                    {exp.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink-3)" }}>
                    {exp.desc}
                  </p>
                  <p className="text-[11px] mt-3" style={{ color: "var(--ink-3)" }}>
                    담당: {exp.owner}
                  </p>
                </div>
                <span
                  className="text-[14px] opacity-0 group-hover:opacity-100 transition-opacity self-center"
                  style={{ color: "var(--ink-3)" }}
                >
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
