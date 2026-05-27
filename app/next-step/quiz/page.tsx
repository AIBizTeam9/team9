'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QUESTIONS, SCREENS, screenIndexForQuestion, type Question } from '@/lib/questions';
import type { Answers } from '@/lib/types';

type Phase = 'main' | 'loading' | 'followup';

type FollowUpData = {
  reason: string;
  followUpQuestion: string;
};

// Only these textarea keys go through /api/clarify
const CLARIFY_KEYS = new Set(['stuck', 'desiredChange', 'tried', 'strengths', 'struggles', 'feelsAlive']);

function questionAnswered(q: Question, raw: unknown): boolean {
  const v = String(raw ?? '').trim();
  if (!v) return false;
  if (q.type === 'number') return !isNaN(Number(v)) && Number(v) > 0;
  return true;
}

export default function QuizPage() {
  const router = useRouter();
  // `index`는 항상 현재 screen의 시작 question index를 가리킨다 (group의 첫 질문).
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [phase, setPhase] = useState<Phase>('main');
  const [followUpData, setFollowUpData] = useState<FollowUpData | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState('');

  // 현재 screen — 같은 group의 연속 질문들. textarea처럼 group이 없는 건 단일 질문 screen.
  const screenIdx = screenIndexForQuestion(index);
  const screen = SCREENS[screenIdx];
  const screenQuestions = screen.questions;
  const totalScreens = SCREENS.length;
  const isSingleScreen = screenQuestions.length === 1;
  // 단일 질문 screen일 때만 /api/clarify follow-up 흐름을 적용 — 그룹 screen은 textarea 없음.
  const q = screenQuestions[0];
  const currentValue = String(answers[q.k] ?? '');

  function setAnswerFor(key: string, v: string) {
    setAnswers((prev) => ({ ...prev, [key]: v }));
  }
  function setAnswer(v: string) {
    setAnswerFor(q.k, v);
  }

  const canAdvance = screenQuestions.every((qq) => questionAnswered(qq, answers[qq.k]));

  function advance(latestAnswers?: Answers) {
    const toSave = latestAnswers ?? answers;
    const nextIdx = screen.end + 1;
    if (nextIdx >= QUESTIONS.length) {
      sessionStorage.removeItem('nextStep.personas');
      sessionStorage.removeItem('nextStep.selectedPersonas');
      sessionStorage.removeItem('nextStep.plan');
      sessionStorage.setItem('nextStep.answers', JSON.stringify(toSave));
      router.push('/next-step/loading');
    } else {
      setIndex(nextIdx);
    }
  }

  async function handleNext() {
    if (!canAdvance) return;

    // /api/clarify는 단일 질문 textarea screen에서만 동작. 그룹 screen은 textarea를 안 묶음.
    if (isSingleScreen && q.type === 'textarea' && CLARIFY_KEYS.has(q.k)) {
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
    // 이전 screen의 첫 question으로 이동.
    if (screenIdx > 0) {
      setIndex(SCREENS[screenIdx - 1].start);
    }
  }

  const backDisabled = phase === 'loading' || (phase === 'main' && screenIdx === 0);
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

      {/* Progress bar — screen-based, does not advance during follow-up */}
      <div className="h-[3px] w-full" style={{ background: 'var(--line)' }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${((screenIdx + 1) / totalScreens) * 100}%`, background: 'var(--warm)' }}
        />
      </div>

      {/* Counter + time estimate (feedback #15/#29/#32 — set expectations) */}
      <div className="max-w-[640px] mx-auto w-full px-6 pt-8 pb-0 flex items-center justify-between">
        <span className="text-[12px] tabular-nums" style={{ color: 'var(--ink-3)' }}>
          {screenIdx + 1} / {totalScreens}
        </span>
        <span className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
          약 5분 · {QUESTIONS.length}개 질문
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
              답변을 읽고 있어요…
            </p>
          </div>
        )}

        {/* ── Main question(s) — single OR grouped ── */}
        {phase === 'main' && (
          <div key={`screen-${screenIdx}`} className="q-enter flex flex-col gap-10">
            {screenQuestions.map((qq, qi) => {
              const valueForQ = String(answers[qq.k] ?? '');
              const isFirst = qi === 0;
              // 그룹 screen은 첫 질문은 큰 헤딩, 나머지는 좀 더 작은 헤딩.
              const titleSize = isSingleScreen
                ? 'clamp(24px, 4vw, 34px)'
                : isFirst
                  ? 'clamp(22px, 3.5vw, 28px)'
                  : 'clamp(18px, 2.8vw, 22px)';
              return (
                <div key={qq.k}>
                  <h2
                    className="font-serif leading-[1.2] tracking-[-0.01em] mb-3"
                    style={{ color: 'var(--ink)', fontSize: titleSize }}
                  >
                    {qq.t}
                  </h2>
                  {qq.h ? (
                    <p className="text-[14px] mb-5 leading-relaxed" style={{ color: 'var(--ink-3)' }}>
                      {qq.h}
                    </p>
                  ) : (
                    <div className="mb-5" />
                  )}

                  {/* text / number */}
                  {(qq.type === 'text' || qq.type === 'number') && (
                    <>
                      {qq.type === 'text' && qq.quickPicks && qq.quickPicks.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {qq.quickPicks.map((pick) => {
                            const selected = valueForQ.trim() === pick;
                            return (
                              <button
                                key={pick}
                                type="button"
                                onClick={() => setAnswerFor(qq.k, pick)}
                                className="choice-btn px-3 py-1.5 rounded-full text-[13px] transition-all"
                                style={{
                                  background: selected ? 'var(--warm-soft)' : 'var(--bg-2)',
                                  border: `1px solid ${selected ? 'var(--warm)' : 'var(--line-2)'}`,
                                  color: selected ? 'var(--warm)' : 'var(--ink-2)',
                                  fontWeight: selected ? 500 : 400,
                                }}
                              >
                                {pick}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <input
                        type={qq.type}
                        value={valueForQ}
                        placeholder={qq.ph}
                        autoFocus={isFirst}
                        className="q-input w-full px-4 py-3 rounded-xl text-[15px] outline-none transition-all"
                        style={{
                          background: 'var(--bg-2)',
                          border: '1px solid var(--line-2)',
                          color: 'var(--ink)',
                        }}
                        onChange={(e) => setAnswerFor(qq.k, e.target.value)}
                        onKeyDown={(e) => {
                          // 단일 textarea screen에서만 Enter로 진행 (그룹에선 다음 필드 탐색에 방해돼 끔)
                          if (e.key === 'Enter' && isSingleScreen) handleNext();
                        }}
                      />
                      {qq.type === 'text' && qq.quickPicks && qq.quickPicks.length > 0 && (
                        <p className="text-[11px] mt-2" style={{ color: 'var(--ink-3)' }}>
                          위에서 골라도 되고, 직접 적어도 됩니다.
                        </p>
                      )}
                    </>
                  )}

                  {/* textarea — group에는 들어가지 않음 (clarify 흐름 유지) */}
                  {qq.type === 'textarea' && (
                    <>
                      {qq.quickPicks && qq.quickPicks.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {qq.quickPicks.map((pick) => {
                            const parts = valueForQ.split(',').map((s) => s.trim()).filter(Boolean);
                            const selected = parts.includes(pick);
                            return (
                              <button
                                key={pick}
                                type="button"
                                onClick={() => {
                                  const next = selected
                                    ? parts.filter((p) => p !== pick).join(', ')
                                    : [...parts, pick].join(', ');
                                  setAnswerFor(qq.k, next);
                                }}
                                className="choice-btn px-3 py-1.5 rounded-full text-[13px] transition-all"
                                style={{
                                  background: selected ? 'var(--warm-soft)' : 'var(--bg-2)',
                                  border: `1px solid ${selected ? 'var(--warm)' : 'var(--line-2)'}`,
                                  color: selected ? 'var(--warm)' : 'var(--ink-2)',
                                  fontWeight: selected ? 500 : 400,
                                }}
                              >
                                {pick}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <textarea
                        value={valueForQ}
                        placeholder={qq.ph}
                        rows={4}
                        autoFocus={isFirst}
                        className="q-input w-full px-4 py-3 rounded-xl text-[15px] outline-none transition-all resize-none"
                        style={{
                          background: 'var(--bg-2)',
                          border: '1px solid var(--line-2)',
                          color: 'var(--ink)',
                        }}
                        onChange={(e) => setAnswerFor(qq.k, e.target.value)}
                      />
                      {qq.quickPicks && qq.quickPicks.length > 0 && (
                        <p className="text-[11px] mt-2" style={{ color: 'var(--ink-3)' }}>
                          위 항목을 클릭해 선택하거나, 직접 풀어 적어도 됩니다. 구체적일수록 좋은 플랜이 나와요.
                        </p>
                      )}
                    </>
                  )}

                  {/* choice */}
                  {qq.type === 'choice' && (
                    <div className="flex flex-col gap-2">
                      {qq.o!.map((option) => {
                        const selected = valueForQ === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setAnswerFor(qq.k, option)}
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
                );
            })}
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
                내가 쓴 답변
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
          ← 이전
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
            다음 →
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
            {screenIdx === totalScreens - 1 ? '내 플랜 만들기 →' : '다음 →'}
          </button>
        )}
      </div>
    </div>
  );
}
