import Link from 'next/link';

export default function NextStepLandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
        {/* Eyebrow */}
        <p
          className="text-[11px] font-medium tracking-[0.1em] uppercase mb-8"
          style={{ color: 'var(--ink-3)' }}
        >
          Next Step in Life
        </p>

        {/* Headline */}
        <h1
          className="font-serif text-center leading-[1.15] tracking-[-0.02em] mb-6"
          style={{
            color: 'var(--ink)',
            fontSize: 'clamp(42px, 7vw, 72px)',
            maxWidth: '720px',
          }}
        >
          당신만의
          <br />
          <span style={{ color: 'var(--warm)' }}>90일 플랜</span>
        </h1>

        {/* Sub-copy */}
        <p
          className="text-center leading-relaxed mb-4"
          style={{
            color: 'var(--ink-3)',
            fontSize: '16px',
            maxWidth: '460px',
          }}
        >
          지금 어디에 있고 어디로 가고 싶은지 15개 질문에 답하면,
          Claude가 답을 토대로 일정에 맞는 주 단위 실행 플랜을 만들어줍니다.
        </p>

        {/* Broad-engine framing (focused-feeling) */}
        <p
          className="text-center mb-12"
          style={{
            color: 'var(--ink-3)',
            fontSize: '13.5px',
            maxWidth: '460px',
          }}
        >
          예: 이직, 대학원, 창업, 이사, 관계… 인생의 갈림길 앞에서.
        </p>

        {/* CTA */}
        <Link
          href="/next-step/quiz"
          className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-[15px] font-semibold text-white transition-opacity hover:opacity-85"
          style={{ background: 'var(--warm)' }}
        >
          시작하기
          <span style={{ opacity: 0.7 }}>→</span>
        </Link>

        {/* Metadata row */}
        <div
          className="flex items-center gap-5 mt-10 text-[12px]"
          style={{ color: 'var(--ink-3)' }}
        >
          <span>15개 질문</span>
          <span style={{ color: 'var(--line-2)' }}>·</span>
          <span>약 5분</span>
          <span style={{ color: 'var(--line-2)' }}>·</span>
          <span>Claude 기반</span>
        </div>
      </main>

      {/* What you get section */}
      <section
        className="border-t px-6 py-16"
        style={{ borderColor: 'var(--line)' }}
      >
        <div className="max-w-[860px] mx-auto">
          <p
            className="text-[11px] font-medium tracking-[0.08em] uppercase mb-8 text-center"
            style={{ color: 'var(--ink-3)' }}
          >
            플랜에 담기는 것
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-6"
                style={{
                  background: 'var(--bg-2)',
                  border: '1px solid var(--line)',
                }}
              >
                <div
                  className="text-[22px] mb-3 font-serif leading-tight"
                  style={{ color: 'var(--ink)' }}
                >
                  {f.title}
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--ink-3)' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const FEATURES = [
  {
    title: '정직한 근거',
    desc: '왜 이 플랜이 당신에게 맞는지 — 당신이 한 말을 그대로 인용하면서 설명합니다.',
  },
  {
    title: '주 단위 실행',
    desc: '3개월, 각 달의 테마와 일정에 맞춘 구체적인 주별 액션.',
  },
  {
    title: '오늘 할 한 가지',
    desc: '모든 플랜은 오늘 안에 시작할 수 있는 한 가지 첫걸음으로 끝납니다.',
  },
];
