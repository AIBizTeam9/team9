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
            maxWidth: '700px',
          }}
        >
          Your personalised
          <br />
          <span style={{ color: 'var(--warm)' }}>90-day plan</span>
        </h1>

        {/* Sub-copy */}
        <p
          className="text-center leading-relaxed mb-12"
          style={{
            color: 'var(--ink-3)',
            fontSize: '16px',
            maxWidth: '440px',
          }}
        >
          Answer 15 questions about where you are and where you want to go.
          Claude turns your answers into a concrete, week-by-week plan that
          fits your actual schedule.
        </p>

        {/* CTA */}
        <Link
          href="/next-step/quiz"
          className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-[15px] font-semibold text-white transition-opacity hover:opacity-85"
          style={{ background: 'var(--warm)' }}
        >
          Start the quiz
          <span style={{ opacity: 0.7 }}>→</span>
        </Link>

        {/* Metadata row */}
        <div
          className="flex items-center gap-5 mt-10 text-[12px]"
          style={{ color: 'var(--ink-3)' }}
        >
          <span>15 questions</span>
          <span style={{ color: 'var(--line-2)' }}>·</span>
          <span>~5 minutes</span>
          <span style={{ color: 'var(--line-2)' }}>·</span>
          <span>Powered by Claude</span>
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
            What you get
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
    title: 'Honest rationale',
    desc: 'Claude explains exactly why it built this plan for you — citing your own words back.',
  },
  {
    title: 'Week-by-week actions',
    desc: 'Three months, each with a theme and concrete weekly actions sized to your schedule.',
  },
  {
    title: 'One thing to do today',
    desc: 'Every plan ends with a single first step you can take before the day is over.',
  },
];
