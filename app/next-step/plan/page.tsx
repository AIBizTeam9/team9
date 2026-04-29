'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Plan, PlanMonth, PlanAction, PlanResource } from '@/lib/types';

const EFFORT_STYLE: Record<PlanAction['effort'], { bg: string; color: string; label: string }> = {
  small:  { bg: 'var(--green-soft)',  color: 'var(--green)',  label: 'small' },
  medium: { bg: 'var(--warm-soft)',   color: 'var(--warm)',   label: 'medium' },
  large:  { bg: 'var(--blue-soft)',   color: 'var(--blue)',   label: 'large' },
};

export default function PlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('nextStep.plan');
    if (!raw) { router.replace('/next-step'); return; }
    try {
      setPlan(JSON.parse(raw) as Plan);
    } catch {
      router.replace('/next-step');
    }
  }, [router]);

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div
          className="w-8 h-8 rounded-full"
          style={{
            border: '2px solid var(--line)',
            borderTopColor: 'var(--warm)',
            animation: 'spin 0.9s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px 96px' }}>

        {/* Back link */}
        <Link
          href="/next-step/quiz"
          className="inline-flex items-center gap-1.5 text-[12px] mb-12 transition-opacity hover:opacity-70"
          style={{ color: 'var(--ink-3)' }}
        >
          ← Retake quiz
        </Link>

        {/* ── Hero ─────────────────────────────────── */}
        <h1
          className="font-serif leading-[1.15] tracking-[-0.02em] mb-5"
          style={{ color: 'var(--ink)', fontSize: 'clamp(32px, 5vw, 52px)' }}
        >
          {plan.headline}
        </h1>

        <p
          className="leading-relaxed mb-12"
          style={{ color: 'var(--ink-3)', fontSize: '16px', maxWidth: '600px' }}
        >
          {plan.rationale}
        </p>

        {/* ── Core insight ─────────────────────────── */}
        <div
          className="rounded-2xl p-7 mb-16"
          style={{
            background: 'var(--warm-soft)',
            borderLeft: '4px solid var(--warm)',
          }}
        >
          <p
            className="text-[11px] font-medium tracking-[0.08em] uppercase mb-3"
            style={{ color: 'var(--warm)' }}
          >
            Core insight
          </p>
          <p
            className="font-serif leading-[1.4]"
            style={{ color: 'var(--ink)', fontSize: 'clamp(18px, 2.5vw, 22px)', fontStyle: 'italic' }}
          >
            "{plan.coreInsight}"
          </p>
        </div>

        {/* ── Months ───────────────────────────────── */}
        <div className="flex flex-col gap-14">
          {plan.months.map((month) => (
            <MonthSection key={month.month} month={month} />
          ))}
        </div>

        {/* ── Resources ────────────────────────────── */}
        <div
          className="mt-16 pt-12"
          style={{ borderTop: '1px solid var(--line)' }}
        >
          <p
            className="text-[11px] font-medium tracking-[0.08em] uppercase mb-6"
            style={{ color: 'var(--ink-3)' }}
          >
            Recommended resources
          </p>
          <div className="flex flex-col gap-3">
            {plan.resources.map((r) => (
              <ResourceCard key={r.url} resource={r} />
            ))}
          </div>
        </div>

        {/* ── First step callout ───────────────────── */}
        <div
          className="mt-12 rounded-2xl p-8"
          style={{
            background: 'var(--ink)',
            color: 'var(--bg)',
          }}
        >
          <p
            className="text-[11px] font-medium tracking-[0.08em] uppercase mb-4"
            style={{ color: 'var(--warm)' }}
          >
            Do this today
          </p>
          <p
            className="font-serif leading-[1.4]"
            style={{ fontSize: 'clamp(18px, 2.5vw, 22px)' }}
          >
            {plan.firstStep}
          </p>
        </div>

        {/* Start over */}
        <div className="mt-10 text-center">
          <Link
            href="/next-step/quiz"
            className="text-[13px] transition-opacity hover:opacity-70"
            style={{ color: 'var(--ink-3)' }}
          >
            ← Start over with new answers
          </Link>
        </div>

      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────── */

function MonthSection({ month }: { month: PlanMonth }) {
  return (
    <div>
      {/* Month header */}
      <div className="flex items-baseline gap-3 mb-5">
        <span
          className="text-[11px] font-medium tracking-[0.08em] uppercase shrink-0"
          style={{ color: 'var(--ink-3)' }}
        >
          Month {month.month}
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
      </div>
      <h2
        className="font-serif leading-[1.2] tracking-[-0.01em] mb-6"
        style={{ color: 'var(--ink)', fontSize: 'clamp(20px, 3vw, 26px)' }}
      >
        {month.theme}
      </h2>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {month.actions.map((action) => (
          <ActionCard key={action.week} action={action} />
        ))}
      </div>
    </div>
  );
}

function ActionCard({ action }: { action: PlanAction }) {
  const ef = EFFORT_STYLE[action.effort] ?? EFFORT_STYLE.medium;
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--line)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-[11px] font-medium tabular-nums"
          style={{ color: 'var(--ink-3)' }}
        >
          Week {action.week}
        </span>
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ background: ef.bg, color: ef.color }}
        >
          {ef.label}
        </span>
      </div>
      <p
        className="text-[15px] font-medium mb-1.5 leading-snug"
        style={{ color: 'var(--ink)' }}
      >
        {action.title}
      </p>
      <p className="text-[13px] leading-relaxed" style={{ color: 'var(--ink-3)' }}>
        {action.why}
      </p>
    </div>
  );
}

function ResourceCard({ resource }: { resource: PlanResource }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl p-5 transition-all hover:shadow-md"
      style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--line)',
        textDecoration: 'none',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p
            className="text-[14px] font-medium mb-1 leading-snug"
            style={{ color: 'var(--ink)' }}
          >
            {resource.title}
          </p>
          <p className="text-[12px] mb-2 truncate" style={{ color: 'var(--warm)' }}>
            {resource.url}
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--ink-3)' }}>
            {resource.why}
          </p>
        </div>
        <span className="text-[14px] shrink-0 mt-0.5" style={{ color: 'var(--line-2)' }}>↗</span>
      </div>
    </a>
  );
}
