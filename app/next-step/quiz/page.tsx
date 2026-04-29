'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QUESTIONS } from '@/lib/questions';
import type { Answers } from '@/lib/types';

export default function QuizPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

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

  function handleNext() {
    if (!canAdvance) return;
    if (index === total - 1) {
      sessionStorage.setItem('nextStep.answers', JSON.stringify(answers));
      router.push('/next-step/loading');
    } else {
      setIndex((i) => i + 1);
    }
  }

  function handleBack() {
    if (index > 0) setIndex((i) => i - 1);
  }

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
      `}</style>

      {/* Progress bar */}
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

      {/* Question area — key forces remount + animation on each step */}
      <div className="flex-1 flex flex-col justify-center max-w-[640px] mx-auto w-full px-6 py-10">
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
      </div>

      {/* Navigation */}
      <div className="max-w-[640px] mx-auto w-full px-6 pb-12 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={index === 0}
          className="px-5 py-2.5 rounded-full text-[13px] transition-all"
          style={{
            color: index === 0 ? 'var(--line-2)' : 'var(--ink-3)',
            border: `1px solid ${index === 0 ? 'var(--line)' : 'var(--line-2)'}`,
            cursor: index === 0 ? 'default' : 'pointer',
          }}
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!canAdvance}
          className="px-6 py-2.5 rounded-full text-[13px] font-semibold text-white transition-all"
          style={{
            background: canAdvance ? 'var(--warm)' : 'var(--line)',
            cursor: canAdvance ? 'pointer' : 'not-allowed',
          }}
        >
          {index === total - 1 ? 'Generate my plan →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
