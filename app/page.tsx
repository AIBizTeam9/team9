import Link from "next/link";

const PIPELINE_STEPS = [
  { num: 1, label: "퀴즈", desc: "나를 알아가는 질문", owner: "지윤", color: "from-pink-500 to-rose-500" },
  { num: 2, label: "페르소나", desc: "두 개의 미래 자아 생성", owner: "지윤", color: "from-rose-500 to-orange-500" },
  { num: 3, label: "디베이트", desc: "두 자아의 대화", owner: "재림", color: "from-orange-500 to-amber-500" },
  { num: 4, label: "인사이트", desc: "대화에서 핵심 발견", owner: "재림", color: "from-amber-500 to-yellow-500" },
  { num: 5, label: "90일 플랜", desc: "실행 가능한 로드맵", owner: "석빈", color: "from-yellow-500 to-lime-500" },
];

const FEATURE_CARDS = [
  {
    href: "/quiz",
    icon: "🧪",
    title: "퀴즈 & 페르소나",
    desc: "사용자의 가치관, 관심사, 강점을 파악하는 퀴즈를 통해 두 개의 대안 미래 페르소나를 생성합니다.",
    owner: "지윤",
    status: "개발 대기",
    statusColor: "bg-gray-500/20 text-gray-300",
    borderColor: "border-pink-500/20 hover:border-pink-500/40",
    gradient: "from-pink-500/10 to-rose-500/10",
  },
  {
    href: "/debate",
    icon: "💬",
    title: "페르소나 디베이트",
    desc: "생성된 두 페르소나가 서로 대화하며, 각 미래의 장단점과 인사이트를 도출합니다.",
    owner: "재림",
    status: "개발 대기",
    statusColor: "bg-gray-500/20 text-gray-300",
    borderColor: "border-orange-500/20 hover:border-orange-500/40",
    gradient: "from-orange-500/10 to-amber-500/10",
  },
  {
    href: "/plan",
    icon: "📋",
    title: "90일 실행 플랜",
    desc: "디베이트 결과를 바탕으로 개인 맞춤형 90일 커리어 실행 계획을 생성합니다.",
    owner: "석빈",
    status: "개발 대기",
    statusColor: "bg-gray-500/20 text-gray-300",
    borderColor: "border-yellow-500/20 hover:border-yellow-500/40",
    gradient: "from-yellow-500/10 to-lime-500/10",
  },
  {
    href: "/market",
    icon: "📊",
    title: "시장 인사이트",
    desc: "기술 트렌드, 산업 동향, 연봉 데이터, 수요 스킬 등 커리어 결정에 필요한 시장 정보.",
    owner: "동근",
    status: "개발 완료",
    statusColor: "bg-emerald-500/20 text-emerald-300",
    borderColor: "border-cyan-500/20 hover:border-cyan-500/40",
    gradient: "from-cyan-500/10 to-blue-500/10",
  },
  {
    href: "/resources",
    icon: "🔗",
    title: "외부 데이터 허브",
    desc: "채용 정보, 강의, 추천 도서, 커뮤니티, 트렌드 리포트를 한곳에 모은 리소스 허브.",
    owner: "동근",
    status: "개발 완료",
    statusColor: "bg-emerald-500/20 text-emerald-300",
    borderColor: "border-indigo-500/20 hover:border-indigo-500/40",
    gradient: "from-indigo-500/10 to-purple-500/10",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 text-xs mb-6">
            AIBizTeam9 — AI 기반 비즈니스 진화
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Next Step in Life
            </span>
          </h1>
          <p className="mt-4 text-lg text-indigo-200/60 max-w-2xl mx-auto leading-relaxed">
            AI가 만들어주는 두 개의 미래 — 나의 가능성을 A/B 테스트하고,
            <br className="hidden sm:block" />
            90일 실행 플랜으로 첫 걸음을 시작하세요.
          </p>
        </div>
      </header>

      {/* Pipeline */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between gap-0 overflow-x-auto pb-2">
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step.num} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center text-center flex-shrink-0 w-16 sm:w-20">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-sm shadow-lg`}
                >
                  {step.num}
                </div>
                <span className="text-[11px] font-semibold text-white/80 mt-1.5">
                  {step.label}
                </span>
                <span className="text-[9px] text-white/30 mt-0.5 hidden sm:block">
                  {step.owner}
                </span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-white/5 mx-1" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Feature Cards */}
      <main className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-sm font-semibold text-indigo-300/50 uppercase tracking-widest mb-6">
          서비스 모듈
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className={`group rounded-2xl border p-5 transition-all bg-gradient-to-br ${card.gradient} ${card.borderColor} hover:scale-[1.02]`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{card.icon}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${card.statusColor}`}
                >
                  {card.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-white/90 group-hover:text-white transition-colors">
                {card.title}
              </h3>
              <p className="text-xs text-white/40 mt-2 leading-relaxed line-clamp-3">
                {card.desc}
              </p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                <span className="text-[10px] text-white/30">담당: {card.owner}</span>
                <svg
                  className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Tech stack */}
        <div className="mt-12 text-center">
          <p className="text-[11px] text-white/20">
            Next.js 16 · React 19 · Tailwind CSS 4 · Claude API · Supabase · Vercel
          </p>
        </div>
      </main>
    </div>
  );
}
