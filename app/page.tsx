import Link from "next/link";

const PIPELINE_STEPS = [
  { num: 1, label: "퀴즈", owner: "지윤" },
  { num: 2, label: "페르소나", owner: "지윤" },
  { num: 3, label: "디베이트", owner: "재림" },
  { num: 4, label: "인사이트", owner: "재림" },
  { num: 5, label: "90일 플랜", owner: "석빈" },
];

const FEATURE_CARDS = [
  {
    href: "/quiz",
    title: "퀴즈 & 페르소나",
    desc: "가치관, 관심사, 강점을 파악하는 퀴즈를 통해 두 개의 대안 미래 페르소나를 생성합니다.",
    owner: "지윤",
    status: "개발 대기",
    ready: false,
    color: "var(--warm)",
    softColor: "var(--warm-soft)",
  },
  {
    href: "/debate",
    title: "페르소나 디베이트",
    desc: "생성된 두 페르소나가 서로 대화하며, 각 미래의 장단점과 인사이트를 도출합니다.",
    owner: "재림",
    status: "개발 대기",
    ready: false,
    color: "var(--blue)",
    softColor: "var(--blue-soft)",
  },
  {
    href: "/plan",
    title: "90일 실행 플랜",
    desc: "디베이트 결과를 바탕으로 개인 맞춤형 90일 커리어 실행 계획을 생성합니다.",
    owner: "석빈",
    status: "개발 대기",
    ready: false,
    color: "var(--green)",
    softColor: "var(--green-soft)",
  },
  {
    href: "/market",
    title: "시장 인사이트",
    desc: "기술 트렌드, 산업 동향, 연봉 데이터, 수요 스킬 등 커리어 결정에 필요한 시장 정보.",
    owner: "동근",
    status: "완료",
    ready: true,
    color: "var(--warm)",
    softColor: "var(--warm-soft)",
  },
  {
    href: "/resources",
    title: "외부 데이터 허브",
    desc: "채용 정보, 강의, 추천 도서, 커뮤니티, 트렌드 리포트를 한곳에 모은 리소스 허브.",
    owner: "동근",
    status: "완료",
    ready: true,
    color: "var(--blue)",
    softColor: "var(--blue-soft)",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Hero */}
      <section className="max-w-[980px] mx-auto px-6 pt-20 pb-16 text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] tracking-[0.04em] uppercase mb-8"
          style={{
            background: "var(--accent-2)",
            color: "var(--ink-3)",
            border: "1px solid var(--line)",
          }}
        >
          <span
            className="w-[6px] h-[6px] rounded-full"
            style={{ background: "var(--green)" }}
          />
          An AI-powered A/B Test of Possible Futures
        </div>

        <h1
          className="font-serif text-5xl sm:text-6xl tracking-[-0.03em] leading-[1.1] mb-6"
          style={{ color: "var(--ink)" }}
        >
          나의 가능성을
          <br />
          <span style={{ color: "var(--warm)" }}>A/B 테스트</span>
          하세요
        </h1>

        <p
          className="text-[16px] leading-relaxed max-w-lg mx-auto mb-10"
          style={{ color: "var(--ink-3)" }}
        >
          AI가 만들어주는 두 개의 미래 — 퀴즈로 나를 발견하고,
          <br />
          두 자아의 대화에서 인사이트를 얻고, 90일 플랜으로 시작하세요.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/quiz"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            시작하기
            <span className="text-[12px] opacity-60">→</span>
          </Link>
          <Link
            href="/market"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-medium transition-all hover:bg-[var(--accent-2)]"
            style={{
              color: "var(--ink-2)",
              border: "1px solid var(--line-2)",
            }}
          >
            시장 인사이트 둘러보기
          </Link>
        </div>
      </section>

      {/* Pipeline */}
      <section className="max-w-[700px] mx-auto px-6 pb-16">
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--line)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div className="flex items-center justify-between">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center text-center flex-shrink-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold"
                    style={{
                      background:
                        i < 2
                          ? "var(--warm-soft)"
                          : i < 4
                            ? "var(--blue-soft)"
                            : "var(--green-soft)",
                      color:
                        i < 2
                          ? "var(--warm)"
                          : i < 4
                            ? "var(--blue)"
                            : "var(--green)",
                    }}
                  >
                    {step.num}
                  </div>
                  <span
                    className="text-[11px] font-medium mt-1.5"
                    style={{ color: "var(--ink-2)" }}
                  >
                    {step.label}
                  </span>
                  <span
                    className="text-[9px] mt-0.5"
                    style={{ color: "var(--ink-3)" }}
                  >
                    {step.owner}
                  </span>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div
                    className="flex-1 h-px mx-2"
                    style={{ background: "var(--line)" }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-[980px] mx-auto px-6 pb-24">
        <p
          className="text-[12px] font-medium tracking-[0.08em] uppercase mb-5"
          style={{ color: "var(--ink-3)" }}
        >
          서비스 모듈
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl p-5 transition-all hover:shadow-lg"
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--line)",
                boxShadow: "var(--shadow)",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-2 h-2 rounded-full mt-1"
                  style={{ background: card.color }}
                />
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full"
                  style={{
                    background: card.ready
                      ? "var(--green-soft)"
                      : "var(--accent-2)",
                    color: card.ready ? "var(--green)" : "var(--ink-3)",
                  }}
                >
                  {card.status}
                </span>
              </div>

              <h3
                className="font-serif text-[20px] tracking-[-0.01em] group-hover:opacity-80 transition-opacity"
                style={{ color: "var(--ink)" }}
              >
                {card.title}
              </h3>

              <p
                className="text-[13px] mt-2 leading-relaxed line-clamp-3"
                style={{ color: "var(--ink-3)" }}
              >
                {card.desc}
              </p>

              <div
                className="flex items-center justify-between mt-4 pt-3"
                style={{ borderTop: "1px solid var(--line)" }}
              >
                <span className="text-[11px]" style={{ color: "var(--ink-3)" }}>
                  담당: {card.owner}
                </span>
                <span
                  className="text-[12px] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--ink-3)" }}
                >
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-[11px]" style={{ color: "var(--line-2)" }}>
            Next.js 16 · React 19 · Tailwind CSS 4 · Claude API · Supabase ·
            Vercel
          </p>
        </div>
      </section>
    </div>
  );
}
