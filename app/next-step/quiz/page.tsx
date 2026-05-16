'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QUESTIONS } from '@/lib/questions';
import type { Answers } from '@/lib/types';

type Phase = 'main' | 'loading' | 'followup';

type FollowUpData = {
  reason: string;
  followUpQuestion: string;
};

// Only these textarea keys go through /api/clarify
const CLARIFY_KEYS = new Set(['stuck', 'desiredChange', 'tried', 'strengths', 'struggles', 'feelsAlive']);

export default function QuizPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [phase, setPhase] = useState<Phase>('main');
  const [followUpData, setFollowUpData] = useState<FollowUpData | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState('');

  const q = QUESTIONS[index];
  const total = QUESTIONS.length;
  const currentValue = String(answers[q.k] ?? '');

  function setAnswer(v: string) {
    setAnswers((prev) => ({ ...prev, [q.k]: v }));
  }

  const canAdvance = (() => {
    const v = currentValue.trim();
    if (!v) return false;
    if (q.type === 'number') return !isNaN(Number(v)) && Number(v) > 0;
    return true;
  })();

  // Accept optional pre-computed answers to avoid stale-closure issues on
  // the sessionStorage write when setAnswers hasn't flushed yet.
  function advance(latestAnswers?: Answers) {
    const toSave = latestAnswers ?? answers;
    if (index === total - 1) {
      sessionStorage.setItem('nextStep.answers', JSON.stringify(toSave));
      router.push('/next-step/loading');
    } else {
      setIndex((i) => i + 1);
    }
  }

  async function handleNext() {
    if (!canAdvance) return;

    if (q.type === 'textarea' && CLARIFY_KEYS.has(q.k)) {
      setPhase('loading');
      try {
        const res = await fetch('/api/clarify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionKey: q.k, questionText: q.t, userAnswer: currentValue }),
        });
        const data = await res.json();
        if (data.needsFollowUp) {
          setFollowUpData({ reason: data.reason, followUpQuestion: data.followUpQuestion });
          setFollowUpAnswer('');
          setPhase('followup');
        } else {
          setPhase('main');
          advance();
        }
      } catch {
        // Network error — don't block the user, just advance
        setPhase('main');
        advance();
      }
    } else {
      advance();
    }
  }

  function handleFollowUpNext() {
    const trimmed = followUpAnswer.trim();
    if (!trimmed) return;
    // Build updated answers synchronously so advance() writes the right value
    const newAnswers = { ...answers, [`${q.k}_followup`]: trimmed };
    setAnswers(newAnswers);
    setFollowUpData(null);
    setFollowUpAnswer('');
    setPhase('main');
    advance(newAnswers);
  }

  function handleBack() {
    if (phase === 'followup') {
      // Return to main question — original answer is preserved in state
      setFollowUpData(null);
      setFollowUpAnswer('');
      setPhase('main');
      return;
    }
    if (index > 0) setIndex((i) => i - 1);
  }

  const backDisabled = phase === 'loading' || (phase === 'main' && index === 0);
  const followUpCanAdvance = followUpAnswer.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .q-enter { animation: fadeUp 200ms ease forwards; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        .choice-btn:hover { opacity: 0.85; }
        .q-input:focus { border-color: var(--warm) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { animation: spin 700ms linear infinite; }
      `}</style>

      {/* Progress bar — index-based, does not advance during follow-up */}
      <div className="h-[3px] w-full" style={{ background: 'var(--line)' }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${((index + 1) / total) * 100}%`, background: 'var(--warm)' }}
        />
      </div>

      {/* Counter */}
      <div className="max-w-[640px] mx-auto w-full px-6 pt-8 pb-0">
        <span className="text-[12px] tabular-nums" style={{ color: 'var(--ink-3)' }}>
          {index + 1} / {total}
        </span>
      </div>

      {/* Question area */}
      <div className="flex-1 flex flex-col justify-center max-w-[640px] mx-auto w-full px-6 py-10">

        {/* ── Loading ── */}
        {phase === 'loading' && (
          <div className="q-enter flex flex-col items-center gap-4 py-16">
            <div
              className="spinner w-5 h-5 rounded-full"
              style={{
                border: '2px solid var(--line-2)',
                borderTopColor: 'var(--warm)',
              }}
            />
            <p className="text-[14px]" style={{ color: 'var(--ink-3)' }}>
              Reading your answer…
            </p>
          </div>
        )}

        {/* ── Main question ── */}
        {phase === 'main' && (
          <div key={q.k} className="q-enter">
            <h2
              className="font-serif leading-[1.2] tracking-[-0.01em] mb-3"
              style={{ color: 'var(--ink)', fontSize: 'clamp(24px, 4vw, 34px)' }}
            >
              {q.t}
            </h2>

            {q.h ? (
              <p className="text-[14px] mb-7 leading-relaxed" style={{ color: 'var(--ink-3)' }}>
                {q.h}
              </p>
            ) : (
              <div className="mb-7" />
            )}

            {/* text / number */}
            {(q.type === 'text' || q.type === 'number') && (
              <input
                type={q.type}
                value={currentValue}
                placeholder={q.ph}
                autoFocus
                className="q-input w-full px-4 py-3 rounded-xl text-[15px] outline-none transition-all"
                style={{
                  background: 'var(--bg-2)',
                  border: '1px solid var(--line-2)',
                  color: 'var(--ink)',
                }}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleNext(); }}
              />
            )}

            {/* textarea */}
            {q.type === 'textarea' && (
              <textarea
                value={currentValue}
                placeholder={q.ph}
                rows={4}
                autoFocus
                className="q-input w-full px-4 py-3 rounded-xl text-[15px] outline-none transition-all resize-none"
                style={{
                  background: 'var(--bg-2)',
                  border: '1px solid var(--line-2)',
                  color: 'var(--ink)',
                }}
                onChange={(e) => setAnswer(e.target.value)}
              />
            )}

            {/* choice */}
            {q.type === 'choice' && (
              <div className="flex flex-col gap-2">
                {q.o!.map((option) => {
                  const selected = currentValue === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAnswer(option)}
                      className="choice-btn text-left px-4 py-3 rounded-xl text-[14px] transition-all"
                      style={{
                        background: selected ? 'var(--warm-soft)' : 'var(--bg-2)',
                        border: `1px solid ${selected ? 'var(--warm)' : 'var(--line-2)'}`,
                        color: selected ? 'var(--warm)' : 'var(--ink-2)',
                        fontWeight: selected ? 500 : 400,
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Follow-up ── */}
        {phase === 'followup' && followUpData && (
          <div className="q-enter flex flex-col gap-6">

            {/* Original answer — read-only, muted */}
            <div>
              <p
                className="text-[11px] uppercase tracking-widest mb-2"
                style={{ color: 'var(--ink-3)', letterSpacing: '0.08em' }}
              >
                You wrote
              </p>
              <p
                className="text-[14px] leading-relaxed px-4 py-3 rounded-xl"
                style={{
                  color: 'var(--ink-3)',
                  background: 'var(--bg-2)',
                  border: '1px solid var(--line)',
                }}
              >
                {currentValue}
              </p>
              <p className="text-[12px] italic mt-2" style={{ color: 'var(--ink-3)' }}>
                {followUpData.reason}
              </p>
            </div>

            {/* Follow-up question + fresh input */}
            <div>
              <h2
                className="font-serif leading-[1.2] tracking-[-0.01em] mb-7"
                style={{ color: 'var(--ink)', fontSize: 'clamp(20px, 3.5vw, 28px)' }}
              >
                {followUpData.followUpQuestion}
              </h2>
              <textarea
                value={followUpAnswer}
                rows={4}
                autoFocus
                className="q-input w-full px-4 py-3 rounded-xl text-[15px] outline-none transition-all resize-none"
                style={{
                  background: 'var(--bg-2)',
                  border: '1px solid var(--line-2)',
                  color: 'var(--ink)',
                }}
                onChange={(e) => setFollowUpAnswer(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="max-w-[640px] mx-auto w-full px-6 pb-12 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={backDisabled}
          className="px-5 py-2.5 rounded-full text-[13px] transition-all"
          style={{
            color: backDisabled ? 'var(--line-2)' : 'var(--ink-3)',
            border: `1px solid ${backDisabled ? 'var(--line)' : 'var(--line-2)'}`,
            cursor: backDisabled ? 'default' : 'pointer',
          }}
        >
          ← Back
        </button>

        {phase === 'followup' ? (
          <button
            type="button"
            onClick={handleFollowUpNext}
            disabled={!followUpCanAdvance}
            className="px-6 py-2.5 rounded-full text-[13px] font-semibold text-white transition-all"
            style={{
              background: followUpCanAdvance ? 'var(--warm)' : 'var(--line)',
              cursor: followUpCanAdvance ? 'pointer' : 'not-allowed',
            }}
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={phase === 'loading' || !canAdvance}
            className="px-6 py-2.5 rounded-full text-[13px] font-semibold text-white transition-all"
            style={{
              background: phase !== 'loading' && canAdvance ? 'var(--warm)' : 'var(--line)',
              cursor: phase !== 'loading' && canAdvance ? 'pointer' : 'not-allowed',
            }}
          >
            {index === total - 1 ? 'Generate my plan →' : 'Next →'}
          </button>
        )}
      </div>
    </div>
  );
}
