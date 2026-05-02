import Link from "next/link";

const FEATURE_CARDS = [
  {
    href: "/next-step",
    title: "90일 실행 플랜",
    desc: "나의 다음 단계를 위한 개인 맞춤형 90일 커리어 실행 계획을 생성합니다.",
    owner: "지윤",
    color: "var(--green)",
    softColor: "var(--green-soft)",
  },
  {
    href: "/letter",
    title: "미래의 나에게",
    desc: "오늘의 내가 미래의 나에게 보내는 편지. 매주 켜고 인생을 끌고 가는 commitment device.",
    owner: "석빈",
    color: "var(--warm)",
    softColor: "var(--warm-soft)",
  },
  {
    href: "/rolemodel",
    title: "롤모델",
    desc: "내 커리어 방향에 맞는 롤모델을 찾고, 그들의 발자취에서 다음 행동을 끌어냅니다.",
    owner: "재림",
    color: "var(--blue)",
    softColor: "var(--blue-soft)",
  },
  {
    href: "/market",
    title: "시장 인사이트",
    desc: "기술 트렌드, 산업 동향, 연봉 데이터, 수요 스킬 등 커리어 결정에 필요한 시장 정보.",
    owner: "동근",
    color: "var(--warm)",
    softColor: "var(--warm-soft)",
  },
  {
    href: "/resources",
    title: "외부 데이터 허브",
    desc: "채용 정보, 강의, 추천 도서, 커뮤니티, 트렌드 리포트를 한곳에 모은 리소스 허브.",
    owner: "동근",
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
          AI-powered career companion
        </div>

        <h1
          className="font-serif text-5xl sm:text-6xl tracking-[-0.03em] leading-[1.1] mb-6"
          style={{ color: "var(--ink)" }}
        >
          나의 다음 단계를
          <br />
          <span style={{ color: "var(--warm)" }}>지금 시작</span>
          하세요
        </h1>

        <p
          className="text-[16px] leading-relaxed max-w-lg mx-auto mb-10"
          style={{ color: "var(--ink-3)" }}
        >
          AI가 만들어주는 90일 실행 플랜과 시장 인사이트로
          <br />
          오늘부터 커리어를 한 걸음 앞으로.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/next-step"
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
