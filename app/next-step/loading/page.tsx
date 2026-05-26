'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Persona } from '@/lib/types';

const PERSONA_MESSAGES = [
  '당신의 이야기를 듣는 중...',
  '두 미래 페르소나 만드는 중...',
  'Almost there...',
];

const PLAN_MESSAGES = [
  '두 미래가 토론하는 중...',
  '두 자아의 결론을 90일 플랜으로 옮기는 중...',
  'Almost there...',
];

type DebateTurn = { speaker: string; content: string };

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span style={{ color: 'var(--ink-3)' }}>{label}</span>
      <span style={{ color: 'var(--ink-2)' }}>{value}</span>
    </div>
  );
}

const PERSONA_ACCENTS = ['var(--warm)', 'var(--blue)'] as const;
const PERSONA_BGS = ['var(--warm-soft)', 'var(--blue-soft)'] as const;

export default function LoadingPage() {
  const router = useRouter();
  const called = useRef(false);
  const [messages, setMessages] = useState(PERSONA_MESSAGES);
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorDebug, setErrorDebug] = useState<{
    httpStatus: number;
    bytesReceived: number;
    eventsParsed: number;
    sectionsDone: number;
    timestamp: string;
  } | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [selectedPersonasState, setSelectedPersonasState] = useState<Persona[] | null>(null);
  const [debateTurns, setDebateTurns] = useState<DebateTurn[]>([]);
  const [visibleTurns, setVisibleTurns] = useState(0);

  // Cycle through messages: fade out → swap text → fade in.
  // Restarts when messages array switches (persona → plan phase).
  useEffect(() => {
    setMsgIndex(0);
    setVisible(true);
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % messages.length);
        setVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(id);
  }, [messages]);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const rawAnswers = sessionStorage.getItem('nextStep.answers');
    if (!rawAnswers) {
      router.replace('/next-step/quiz');
      return;
    }

    let answers: unknown;
    try {
      answers = JSON.parse(rawAnswers);
    } catch {
      router.replace('/next-step/quiz');
      return;
    }

    const rawSelectedPersonas = sessionStorage.getItem('nextStep.selectedPersonas');

    if (!rawSelectedPersonas) {
      // First pass: generate 4 personas from quiz answers
      setMessages(PERSONA_MESSAGES);
      fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          sessionStorage.setItem('nextStep.personas', JSON.stringify(data.personas));
          router.replace('/next-step/personas');
        })
        .catch(() => {
          router.replace('/next-step/quiz?error=1');
        });
    } else {
      // Second pass: generate plan from selected personas
      let selectedPersonas: unknown;
      try {
        selectedPersonas = JSON.parse(rawSelectedPersonas);
      } catch {
        router.replace('/next-step/quiz?error=1');
        return;
      }
      setMessages(PLAN_MESSAGES);
      setSelectedPersonasState(selectedPersonas as Persona[]);

      // 두 비동기 작업이 모두 끝나야 plan 페이지로 이동.
      //   1) generate-plan 응답이 도착 (plan 객체)
      //   2) 토론 버블이 마지막까지 노출 완료
      let planObjLocal: unknown = null;
      let debateDone = false;
      const tryNavigate = () => {
        if (planObjLocal && debateDone) {
          sessionStorage.setItem('nextStep.plan', JSON.stringify(planObjLocal));
          router.replace('/next-step/plan');
        }
      };

      // 로딩 중 16턴 토론을 LLM(Haiku)로 받아 1.4초 간격으로 흘려보냄. ~22초.
      // 실패해도 폴백을 받아 흐름은 깨지지 않음.
      fetch('/api/persona-debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personas: selectedPersonas, userContext: answers }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { turns?: DebateTurn[] } | null) => {
          if (!data?.turns || data.turns.length === 0) {
            // 토론 못 받으면 즉시 debateDone 처리
            debateDone = true;
            tryNavigate();
            return;
          }
          setDebateTurns(data.turns);
          let i = 0;
          setVisibleTurns(1);
          const interval = setInterval(() => {
            i += 1;
            if (i >= data.turns!.length) {
              clearInterval(interval);
              debateDone = true;
              tryNavigate();
              return;
            }
            setVisibleTurns(i + 1);
          }, 1400);
        })
        .catch(() => {
          debateDone = true;
          tryNavigate();
        });

      (async () => {
        let httpStatus = 0;
        let bytesReceived = 0;
        let eventsParsed = 0;
        let sectionsDone = 0;
        let planObj: unknown = null;

        try {
          const res = await fetch('/api/generate-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers, personas: selectedPersonas }),
          });
          httpStatus = res.status;
          if (!res.ok || !res.body) {
            const body = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(body.error ?? `HTTP ${res.status}`);
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let lineBuf = '';
          let serverError: string | null = null;
          let doneEvent = false;

          const processLine = (rawLine: string) => {
            if (!rawLine.startsWith('data: ')) return;
            const payload = rawLine.slice(6).trim();
            if (!payload) return;
            try {
              const evt = JSON.parse(payload) as
                | { type: 'progress'; section: string; phase: 'start' | 'done' }
                | { type: 'plan'; plan: unknown }
                | { type: 'done' }
                | { type: 'error'; message: string };
              eventsParsed += 1;
              if (evt.type === 'progress' && evt.phase === 'done') {
                sectionsDone += 1;
              } else if (evt.type === 'plan') {
                planObj = evt.plan;
              } else if (evt.type === 'done') {
                doneEvent = true;
              } else if (evt.type === 'error') {
                serverError = evt.message;
              }
            } catch {
              /* 부분 SSE — 다음 청크/flush에서 다시 시도 */
            }
          };

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            bytesReceived += value?.byteLength ?? 0;
            lineBuf += decoder.decode(value, { stream: true });
            const lines = lineBuf.split('\n');
            lineBuf = lines.pop() ?? '';
            for (const line of lines) processLine(line);
          }
          lineBuf += decoder.decode();
          if (lineBuf.trim()) processLine(lineBuf);

          if (serverError) throw new Error(serverError);
          if (!planObj) {
            throw new Error(
              `플랜 데이터를 받지 못했어요. (수신 ${bytesReceived} bytes, 이벤트 ${eventsParsed}, 섹션 완료 ${sectionsDone}/5)`,
            );
          }
          if (!doneEvent) {
            console.warn('[loading] plan received but done event missing — proceeding anyway');
          }

          // 플랜 준비 완료 — 토론이 끝났으면 즉시 이동, 아니면 토론 끝날 때까지 대기.
          planObjLocal = planObj;
          tryNavigate();
        } catch (err) {
          console.error('[loading] generate-plan failed:', {
            err,
            httpStatus,
            bytesReceived,
            eventsParsed,
            sectionsDone,
          });
          const msg = err instanceof Error ? err.message : 'unknown';
          setErrorMsg(msg);
          setErrorDebug({
            httpStatus,
            bytesReceived,
            eventsParsed,
            sectionsDone,
            timestamp: new Date().toISOString(),
          });
        }
      })();
    }
  }, [router]);

  if (errorMsg) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
        style={{ background: 'var(--bg)' }}
      >
        <div className="max-w-[560px] w-full text-center">
          <p
            className="text-[11px] font-medium tracking-[0.08em] uppercase mb-3"
            style={{ color: 'var(--warm)' }}
          >
            잠시 오류가 발생했어요
          </p>
          <p
            className="font-serif text-[20px] mb-3"
            style={{ color: 'var(--ink)' }}
          >
            플랜 생성에 실패했어요
          </p>
          <p
            className="text-[13px] mb-6 leading-relaxed"
            style={{ color: 'var(--ink-3)' }}
          >
            네트워크나 모델 응답 문제일 수 있어요. 다시 시도하면 보통 됩니다.
          </p>

          {/* 사용자에게 보이는 에러 메시지 */}
          <div
            className="rounded-xl p-4 mb-4 text-left"
            style={{
              background: 'var(--warm-soft)',
              border: '1px solid var(--warm)',
            }}
          >
            <p
              className="text-[10px] font-medium tracking-[0.08em] uppercase mb-1"
              style={{ color: 'var(--warm)' }}
            >
              에러 메시지
            </p>
            <p
              className="text-[12px] font-mono break-all leading-relaxed"
              style={{ color: 'var(--ink)' }}
            >
              {errorMsg}
            </p>
          </div>

          {/* 진단 정보 토글 */}
          {errorDebug && (
            <div
              className="rounded-xl p-4 mb-4 text-left"
              style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--line)',
              }}
            >
              <button
                onClick={() => setShowDebug((v) => !v)}
                className="text-[11px] font-semibold flex items-center gap-1 mb-2"
                style={{ color: 'var(--ink-2)' }}
              >
                <span>{showDebug ? '▼' : '▶'}</span>
                <span>진단 정보 (개발/디버깅용)</span>
              </button>
              {showDebug && (
                <dl
                  className="text-[11px] font-mono space-y-1"
                  style={{ color: 'var(--ink-3)' }}
                >
                  <DebugRow label="HTTP status" value={String(errorDebug.httpStatus)} />
                  <DebugRow label="bytes received" value={String(errorDebug.bytesReceived)} />
                  <DebugRow label="events parsed" value={String(errorDebug.eventsParsed)} />
                  <DebugRow label="sections done" value={`${errorDebug.sectionsDone} / 5`} />
                  <DebugRow label="timestamp" value={errorDebug.timestamp} />
                  <p
                    className="mt-3 pt-3 leading-relaxed"
                    style={{ borderTop: '1px solid var(--line)', color: 'var(--ink-3)' }}
                  >
                    더 자세한 로그는 Vercel → Deployments → 해당 배포 →
                    Functions → /api/generate-plan 에서 <code>[generate-plan]</code>로 시작하는 라인을 확인하세요.
                  </p>
                </dl>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                called.current = false;
                setErrorMsg(null);
                setErrorDebug(null);
                router.replace('/next-step/loading');
              }}
              className="px-4 py-2 rounded-full text-[13px] font-semibold text-white"
              style={{ background: 'var(--accent)' }}
            >
              다시 시도
            </button>
            <button
              onClick={() => router.replace('/next-step/personas')}
              className="px-4 py-2 rounded-full text-[13px]"
              style={{
                color: 'var(--ink-2)',
                border: '1px solid var(--line-2)',
              }}
            >
              페르소나 다시 선택
            </button>
          </div>
        </div>
      </div>
    );
  }

  const personaIndex = (speaker: string): number => {
    if (!selectedPersonasState) return 0;
    return selectedPersonasState.findIndex((p) => p.name === speaker) === -1
      ? 0
      : selectedPersonasState.findIndex((p) => p.name === speaker);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'var(--bg)' }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bubbleIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Spinner */}
      <div
        className="w-9 h-9 rounded-full mb-6"
        style={{
          border: '2.5px solid var(--line)',
          borderTopColor: 'var(--warm)',
          animation: 'spin 0.9s linear infinite',
        }}
      />

      {/* Cycling message — JS-driven fade */}
      <p
        style={{
          color: 'var(--ink-3)',
          fontSize: '14px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 300ms ease, transform 300ms ease',
          minWidth: '220px',
          textAlign: 'center',
          marginBottom: debateTurns.length > 0 ? '32px' : 0,
        }}
      >
        {messages[msgIndex]}
      </p>

      {/* Debate bubbles — shown progressively while plan generates */}
      {debateTurns.length > 0 && (
        <div
          className="w-full max-w-[520px] flex flex-col gap-3"
          style={{ animation: 'bubbleIn 400ms ease' }}
        >
          {debateTurns.slice(0, visibleTurns).map((turn, i) => {
            const idx = personaIndex(turn.speaker);
            const isLeft = idx === 0;
            return (
              <div
                key={i}
                className={`flex ${isLeft ? 'justify-start' : 'justify-end'}`}
                style={{ animation: 'bubbleIn 400ms ease' }}
              >
                <div className="max-w-[78%]">
                  <p
                    className="text-[10px] mb-1 px-2"
                    style={{
                      color: PERSONA_ACCENTS[idx % 2],
                      textAlign: isLeft ? 'left' : 'right',
                    }}
                  >
                    {turn.speaker}
                  </p>
                  <div
                    className="rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed"
                    style={{
                      background: PERSONA_BGS[idx % 2],
                      color: 'var(--ink)',
                    }}
                  >
                    {turn.content}
                  </div>
                </div>
              </div>
            );
          })}
          {/* '입력 중' 인디케이터 — 다음 차례 페르소나 표시 */}
          {visibleTurns < debateTurns.length && (
            <div
              className={`flex ${
                personaIndex(debateTurns[visibleTurns].speaker) === 0
                  ? 'justify-start'
                  : 'justify-end'
              }`}
            >
              <div
                className="rounded-full px-3 py-2 text-[12px] flex gap-1"
                style={{
                  background:
                    PERSONA_BGS[
                      personaIndex(debateTurns[visibleTurns].speaker) % 2
                    ],
                  color: 'var(--ink-3)',
                }}
              >
                <span className="animate-pulse">·</span>
                <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>·</span>
                <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>·</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
