'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Plan, PlanMonth, PlanAction, PlanResource, Answers, Persona } from '@/lib/types';
import { getUser } from '@/lib/auth';
import { savePlan } from '@/lib/nextstep/db';
import CalendarExportButton from '@/components/nextstep/calendar-export-button';

const EFFORT_STYLE: Record<PlanAction['effort'], { bg: string; color: string; label: string }> = {
  small:  { bg: 'var(--green-soft)',  color: 'var(--green)',  label: '가볍게' },
  medium: { bg: 'var(--warm-soft)',   color: 'var(--warm)',   label: '보통' },
  large:  { bg: 'var(--blue-soft)',   color: 'var(--blue)',   label: '묵직' },
};

export default function PlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('nextStep.plan');
    if (!raw) { router.replace('/next-step'); return; }
    try {
      setPlan(JSON.parse(raw) as Plan);
    } catch {
      router.replace('/next-step');
    }
  }, [router]);

  // 로그인 사용자면 결과를 DB에 자동 저장 (한 번만). 이전에 저장된 플랜이면 그 id로 표식.
  useEffect(() => {
    if (!plan) return;
    let cancelled = false;
    (async () => {
      const user = await getUser();
      if (cancelled) return;
      if (!user) {
        setLoginPrompt(true);
        return;
      }
      const existing = sessionStorage.getItem('nextStep.plan.savedId');
      if (existing) {
        setSavedId(existing);
        return;
      }
      const rawAnswers = sessionStorage.getItem('nextStep.answers');
      const rawPersonas = sessionStorage.getItem('nextStep.selectedPersonas');
      let answers: Answers = {};
      let personas: Persona[] = [];
      try {
        if (rawAnswers) answers = JSON.parse(rawAnswers) as Answers;
        if (rawPersonas) personas = JSON.parse(rawPersonas) as Persona[];
      } catch {
        // 일부 입력이 깨졌어도 plan 본문은 저장
      }
      const result = await savePlan(user.id, { answers, personas, plan });
      if (cancelled) return;
      if (result.ok) {
        sessionStorage.setItem('nextStep.plan.savedId', result.id);
        setSavedId(result.id);
        setSaveError(null);
      } else {
        console.error('[plan] save failed:', result.error);
        setSaveError(result.error);
      }
    })();
    return () => { cancelled = true; };
  }, [plan]);

  const handleRetrySave = async () => {
    if (!plan || retrying) return;
    setRetrying(true);
    setSaveError(null);
    try {
      const user = await getUser();
      if (!user) {
        setLoginPrompt(true);
        return;
      }
      const rawAnswers = sessionStorage.getItem('nextStep.answers');
      const rawPersonas = sessionStorage.getItem('nextStep.selectedPersonas');
      let answers: Answers = {};
      let personas: Persona[] = [];
      try {
        if (rawAnswers) answers = JSON.parse(rawAnswers) as Answers;
        if (rawPersonas) personas = JSON.parse(rawPersonas) as Persona[];
      } catch {}
      const result = await savePlan(user.id, { answers, personas, plan });
      if (result.ok) {
        sessionStorage.setItem('nextStep.plan.savedId', result.id);
        setSavedId(result.id);
      } else {
        setSaveError(result.error);
      }
    } finally {
      setRetrying(false);
    }
  };

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
          ← 다시 답하기
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
            핵심 통찰
          </p>
          <p
            className="font-serif leading-[1.4]"
            style={{ color: 'var(--ink)', fontSize: 'clamp(18px, 2.5vw, 22px)', fontStyle: 'italic' }}
          >
            &ldquo;{plan.coreInsight}&rdquo;
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
            추천 자료
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
            오늘 할 한 가지
          </p>
          <p
            className="font-serif leading-[1.4]"
            style={{ fontSize: 'clamp(18px, 2.5vw, 22px)' }}
          >
            {plan.firstStep}
          </p>
        </div>

        {/* ── Calendar export — day-1 = today (fresh result) ── */}
        <CalendarExportButton plan={plan} startDate={new Date()} />

        {/* Save status */}
        {savedId && (
          <div className="mt-10 text-center">
            <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>
              이 플랜은 내 정보에 저장됐어요. 언제든{' '}
              <Link
                href="/account/next-step"
                className="underline"
                style={{ color: 'var(--ink-2)' }}
              >
                지난 플랜
              </Link>
              에서 다시 볼 수 있어요.
            </p>
          </div>
        )}
        {saveError && !savedId && (
          <div
            className="mt-10 rounded-xl p-4"
            style={{
              background: 'var(--warm-soft)',
              border: '1px solid var(--warm)',
            }}
          >
            <p
              className="text-[12px] font-semibold mb-1"
              style={{ color: 'var(--warm)' }}
            >
              저장에 실패했어요
            </p>
            <p
              className="text-[12px] mb-3"
              style={{ color: 'var(--ink-2)' }}
            >
              {saveError}
            </p>
            <button
              onClick={handleRetrySave}
              disabled={retrying}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-full text-white disabled:opacity-50"
              style={{ background: 'var(--warm)' }}
            >
              {retrying ? '다시 저장 중…' : '다시 저장 시도'}
            </button>
          </div>
        )}
        {loginPrompt && !savedId && (
          <div
            className="mt-10 rounded-xl p-4 text-center"
            style={{ background: 'var(--accent-2)', border: '1px solid var(--line)' }}
          >
            <p className="text-[13px] mb-2" style={{ color: 'var(--ink-2)' }}>
              지금 본 플랜을 나중에 다시 보려면 — 구글 한 번 누르면 끝이에요.
            </p>
            <Link
              href="/login?next=/next-step/plan"
              className="inline-block text-[12px] font-semibold underline"
              style={{ color: 'var(--ink)' }}
            >
              구글로 시작 →
            </Link>
          </div>
        )}

        {/* Start over */}
        <div className="mt-10 text-center">
          <Link
            href="/next-step/quiz"
            className="text-[13px] transition-opacity hover:opacity-70"
            style={{ color: 'var(--ink-3)' }}
          >
            ← 새로 답하고 다시 만들기
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
          {month.month}개월차
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
          {action.week}주차
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
          {resource.source && (
            <p className="text-[11px] mb-2" style={{ color: 'var(--ink-3)' }}>
              출처: {resource.source}
            </p>
          )}
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--ink-3)' }}>
            {resource.why}
          </p>
        </div>
        <span className="text-[14px] shrink-0 mt-0.5" style={{ color: 'var(--line-2)' }}>↗</span>
      </div>
    </a>
  );
}
