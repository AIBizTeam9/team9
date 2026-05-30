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

// 사용자 끼어들기 한도 + 응답 길이.
const MAX_INJECTIONS = 3;
const INJECT_TEXT_CAP = 100;
const CONTINUE_LENGTH = 4;

export default function LoadingPage() {
  const router = useRouter();
  const called = useRef(false);
  // 시작 시점에 어느 phase인지 한 번만 결정 (selectedPersonas 유무로). 이후 변경 X →
  // setMessages를 effect 안에서 호출할 필요 없음.
  const [messages] = useState<readonly string[]>(() => {
    if (typeof window === 'undefined') return PERSONA_MESSAGES;
    return sessionStorage.getItem('nextStep.selectedPersonas') ? PLAN_MESSAGES : PERSONA_MESSAGES;
  });
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
  // 선택된 페르소나는 mount 시 sessionStorage에서 1회 결정 — effect 안 setState 회피.
  const [selectedPersonasState] = useState<Persona[] | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('nextStep.selectedPersonas');
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return null;
      return parsed as Persona[];
    } catch {
      return null;
    }
  });
  const [debateTurns, setDebateTurns] = useState<DebateTurn[]>([]);
  const [visibleTurns, setVisibleTurns] = useState(0);
  const [paused, setPaused] = useState(false);
  // debateLoaded: fetch가 끝났음(성공/실패/빈 응답 무관). 마지막 버블 노출 시점은 visibleTurns로 계산.
  const [debateLoaded, setDebateLoaded] = useState(false);
  const [planResult, setPlanResult] = useState<unknown>(null);
  // debateDone은 derived — set-state-in-effect 위반 회피 + 단일 진실 소스.
  const debateDone = debateLoaded && visibleTurns >= debateTurns.length;

  // 사용자 끼어들기 상태. userInjectedIndices는 debateTurns 인덱스 중 사용자가 적은 것.
  // 와이어 포맷에 source 필드 안 더하고 클라이언트 전용 Set으로 관리.
  // isInjecting은 race guard — fetch 진행 중 다시 보내기 클릭 무효화.
  // 기본 injectAs는 'A'로 고정 — 브리프의 "마지막 발화자로 default" 부분은 v1에서 생략 (사용자가 토글).
  const [userInjectedIndices, setUserInjectedIndices] = useState<Set<number>>(new Set());
  const [injectionCount, setInjectionCount] = useState(0);
  const [isInjecting, setIsInjecting] = useState(false);
  const [injectAs, setInjectAs] = useState<'A' | 'B'>('A');
  const [injectText, setInjectText] = useState('');
  const [injectError, setInjectError] = useState<string | null>(null);

  // Cycle through messages: fade out → swap text → fade in.
  // messages는 mount 시 1회 결정되어 변하지 않으므로 reset 로직은 불필요.
  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % messages.length);
        setVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(id);
  }, [messages]);

  // 토론 버블을 1.4초 간격으로 하나씩 노출. paused면 setTimeout 자체를 안 잡고,
  // resume 시 dep 변화로 effect가 다시 돌면서 이어감. 마지막 버블에 도달하면
  // 새 timeout을 안 잡고 끝남(debateDone은 derived라 자동으로 true가 됨).
  // 주의: 마지막 '입력 중' 점(animate-pulse)은 CSS 애니메이션이라 paused와 무관하게 계속 뜀.
  useEffect(() => {
    if (debateTurns.length === 0) return;
    if (visibleTurns >= debateTurns.length) return;
    if (paused) return;
    const id = setTimeout(() => {
      setVisibleTurns((n) => n + 1);
    }, 1400);
    return () => clearTimeout(id);
  }, [visibleTurns, debateTurns.length, paused]);

  // Auto-navigate 제거됨 — 토론 끝나는 순간 페이지가 튕기던 UX 문제 때문.
  // 플랜이 준비되면 아래 "플랜 보기 →" 버튼이 표시되어 사용자가 명시적으로 이동.
  // sessionStorage 저장은 onClick에서 처리한다 (한 번만 쓰면 충분).

  // 사용자 끼어들기 핸들러. 가드는 입력 카드 게이트와 동일 — 더블클릭 등 race에서도
  // isInjecting을 함수 진입에서 한 번 더 체크해서 중복 호출 차단.
  // 실패 시 사용자 turn까지 rollback해서 retry가 깔끔하게 같은 상태에서 시작.
  async function handleInject() {
    if (isInjecting) return;
    if (!paused || debateDone) return;
    if (injectionCount >= MAX_INJECTIONS) return;
    if (!selectedPersonasState || selectedPersonasState.length < 2) return;
    const text = injectText.trim();
    if (!text) return;

    const personaA = selectedPersonasState[0];
    const personaB = selectedPersonasState[1];
    const speakerName = injectAs === 'A' ? personaA.name : personaB.name;

    // mid-debate 끼어들기면 노출 안 된 미래 턴은 더 이상 분기와 일치 X — 잘라낸다.
    const preInjectTurns = debateTurns.slice(0, visibleTurns);
    const userTurn = { speaker: speakerName, content: text };
    const turnsAfterInject = [...preInjectTurns, userTurn];
    const userTurnIndex = preInjectTurns.length;

    // 옵티미스틱 append — 사용자 발언을 즉시 노출. API 결과는 fetch 끝나면 추가.
    setDebateTurns(turnsAfterInject);
    setUserInjectedIndices((prev) => new Set([...prev, userTurnIndex]));
    setVisibleTurns(userTurnIndex + 1);
    setIsInjecting(true);
    setInjectError(null);

    let answersForApi: Record<string, unknown> = {};
    try {
      const raw = sessionStorage.getItem('nextStep.answers');
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          answersForApi = parsed as Record<string, unknown>;
        }
      }
    } catch {
      /* answers 없어도 API는 받아줌 */
    }

    const rollback = () => {
      setDebateTurns(preInjectTurns);
      setUserInjectedIndices((prev) => {
        const next = new Set(prev);
        next.delete(userTurnIndex);
        return next;
      });
      setVisibleTurns(userTurnIndex);
    };

    try {
      const res = await fetch('/api/persona-debate-continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaA,
          personaB,
          answers: answersForApi,
          turnsSoFar: turnsAfterInject,
          userSpokeAs: injectAs,
          continueLength: CONTINUE_LENGTH,
        }),
      });

      if (!res.ok) {
        // 502는 strict-drift gate 발화 — 모델이 잘못 응답해서 우리가 거절. 재시도 가능.
        // 429는 rate limit. 그 외는 일반 네트워크 에러.
        if (res.status === 502) {
          setInjectError('응답을 생성하지 못했어요 — 다시 시도해 주세요');
        } else if (res.status === 429) {
          const body = (await res.json().catch(() => ({}))) as { retryAfterSec?: number };
          setInjectError(`요청이 너무 많아요 — 약 ${body.retryAfterSec ?? 60}초 후 다시 시도`);
        } else {
          setInjectError('네트워크 오류 — 다시 시도해 주세요');
        }
        rollback();
        return;
      }

      const data = (await res.json()) as { turns: { speaker: string; content: string }[] };
      // 성공 시: API 응답 turns를 debateTurns에 append. visibleTurns는 그대로 둬서
      // 사용자가 재생 누를 때 reveal effect가 turns를 하나씩 노출.
      setDebateTurns([...turnsAfterInject, ...data.turns]);
      setInjectionCount((c) => c + 1);
      setInjectText('');
    } catch {
      setInjectError('네트워크 오류 — 다시 시도해 주세요');
      rollback();
    } finally {
      setIsInjecting(false);
    }
  }

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
      // First pass: generate 4 personas from quiz answers (messages는 lazy init에서 결정됨)
      fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
        .then(async (res) => {
          if (res.status === 429) {
            const body = (await res.json().catch(() => ({}))) as { retryAfterSec?: number };
            throw new Error(
              `잠시 후 다시 시도해 주세요. (요청이 너무 많습니다 — 약 ${
                body.retryAfterSec ?? 600
              }초 뒤에 다시 시도 가능)`,
            );
          }
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          sessionStorage.setItem('nextStep.personas', JSON.stringify(data.personas));
          router.replace('/next-step/personas');
        })
        .catch((err) => {
          // 429는 사용자에게 친절히 안내, 그 외는 종전대로 quiz로 보낸다.
          const msg = err instanceof Error ? err.message : '';
          if (msg.startsWith('잠시 후')) {
            setErrorMsg(msg);
          } else {
            router.replace('/next-step/quiz?error=1');
          }
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
      // messages, selectedPersonasState 모두 lazy init에서 결정됨

      // 두 비동기 작업이 모두 끝나야 plan 페이지로 이동:
      //   1) generate-plan 응답 도착 → setPlanResult(plan)
      //   2) debateLoaded=true && 마지막 버블 노출 → derived debateDone=true
      // 두 조건을 합치는 건 위쪽 navigation effect 담당. paused 중이면 보류.

      // 로딩 중 16턴 토론을 LLM(Haiku)로 받아 reveal effect가 1.4초 간격으로 흘려보냄. ~22초.
      // 실패/빈 응답은 debateLoaded만 true로 둬서 buble 없이도 navigation은 진행되게 함.
      fetch('/api/persona-debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personas: selectedPersonas, userContext: answers }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { turns?: DebateTurn[] } | null) => {
          if (!data?.turns || data.turns.length === 0) {
            setDebateLoaded(true);
            return;
          }
          // 첫 버블만 즉시 노출. 나머지는 위쪽 reveal effect가 paused 봐가며 진행.
          setDebateTurns(data.turns);
          setVisibleTurns(1);
          setDebateLoaded(true);
        })
        .catch(() => {
          setDebateLoaded(true);
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
          if (res.status === 429) {
            const body = (await res.json().catch(() => ({}))) as { retryAfterSec?: number };
            throw new Error(
              `잠시 후 다시 시도해 주세요. (요청이 너무 많습니다 — 약 ${
                body.retryAfterSec ?? 600
              }초 뒤에 다시 시도 가능)`,
            );
          }
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

          // 플랜 준비 완료 — navigation effect가 debateDone && !paused 시점에 이동.
          setPlanResult(planObj);
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

      {/* Debate playback control — pause/resume + plan-ready hint */}
      {debateTurns.length > 0 && (
        <div className="w-full max-w-[520px] flex flex-col items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            disabled={debateDone}
            className="px-3 py-1 rounded-full text-[12px] transition-all"
            style={{
              background: paused ? 'var(--warm-soft)' : 'var(--bg-2)',
              border: `1px solid ${paused ? 'var(--warm)' : 'var(--line-2)'}`,
              color: debateDone ? 'var(--ink-3)' : paused ? 'var(--warm)' : 'var(--ink-2)',
              fontWeight: paused ? 600 : 400,
              opacity: debateDone ? 0.5 : 1,
              cursor: debateDone ? 'default' : 'pointer',
            }}
          >
            {paused ? '▶ 재생' : '⏸ 일시정지'}
          </button>
          {/* "플랜 준비됐어요" 힌트 제거 — 아래 "플랜 보기 →" 버튼이 같은 역할을 대체. */}
        </div>
      )}

      {/* Injection card — paused + 진행 중 + cap 미달 + 전송 중 X 일 때만. */}
      {debateTurns.length > 0 &&
        paused &&
        !debateDone &&
        injectionCount < MAX_INJECTIONS &&
        !isInjecting &&
        selectedPersonasState &&
        selectedPersonasState.length >= 2 && (
          <div
            className="w-full max-w-[520px] rounded-2xl p-4 mb-3"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--line-2)' }}
          >
            <p
              className="text-[11px] font-medium tracking-[0.08em] uppercase mb-3"
              style={{ color: 'var(--ink-3)' }}
            >
              이 토론에 끼어들기
            </p>

            {/* A/B 토글 — 사용자가 어느 페르소나로 발화할지 선택. */}
            <div className="flex gap-2 mb-3">
              {([0, 1] as const).map((i) => {
                const persona = selectedPersonasState[i];
                const value: 'A' | 'B' = i === 0 ? 'A' : 'B';
                const selected = injectAs === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setInjectAs(value)}
                    className="flex-1 px-3 py-2 rounded-xl text-[12px] transition-all"
                    style={{
                      background: selected ? PERSONA_BGS[i] : 'var(--bg)',
                      border: `1px solid ${selected ? PERSONA_ACCENTS[i] : 'var(--line-2)'}`,
                      color: selected ? PERSONA_ACCENTS[i] : 'var(--ink-2)',
                      fontWeight: selected ? 600 : 400,
                    }}
                  >
                    {persona.name}
                  </button>
                );
              })}
            </div>

            <textarea
              value={injectText}
              onChange={(e) => setInjectText(e.target.value.slice(0, INJECT_TEXT_CAP))}
              placeholder="여기에 끼어들어 보세요…"
              rows={2}
              className="w-full px-3 py-2 rounded-xl text-[13px] resize-none outline-none mb-2"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--line-2)',
                color: 'var(--ink)',
              }}
            />

            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
                {injectText.length} / {INJECT_TEXT_CAP} · {injectionCount} / {MAX_INJECTIONS}
              </span>
              <button
                type="button"
                onClick={handleInject}
                disabled={injectText.trim().length === 0}
                className="px-3 py-1.5 rounded-full text-[12px] font-semibold text-white transition-all"
                style={{
                  background: injectText.trim().length > 0 ? 'var(--accent)' : 'var(--line)',
                  cursor: injectText.trim().length > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                보내기
              </button>
            </div>

            {injectError && (
              <p className="text-[11px] mt-2" style={{ color: 'var(--warm)' }}>
                {injectError}
              </p>
            )}
          </div>
        )}

      {/* Cap 도달 — 카드 자리에 작은 캡션. */}
      {debateTurns.length > 0 && paused && !debateDone && injectionCount >= MAX_INJECTIONS && (
        <p className="text-[11px] mb-3" style={{ color: 'var(--ink-3)' }}>
          최대 {MAX_INJECTIONS}번까지 참여할 수 있어요
        </p>
      )}

      {/* Debate bubbles — shown progressively while plan generates */}
      {debateTurns.length > 0 && (
        <div
          className="w-full max-w-[520px] flex flex-col gap-3"
          style={{ animation: 'bubbleIn 400ms ease' }}
        >
          {debateTurns.slice(0, visibleTurns).map((turn, i) => {
            const idx = personaIndex(turn.speaker);
            const isLeft = idx === 0;
            const isUserInjected = userInjectedIndices.has(i);
            return (
              <div
                key={i}
                className={`flex ${isLeft ? 'justify-start' : 'justify-end'}`}
                style={{ animation: 'bubbleIn 400ms ease' }}
              >
                <div className="max-w-[78%]">
                  <p
                    className="text-[10px] mb-1 px-2 flex items-center gap-1.5"
                    style={{
                      color: PERSONA_ACCENTS[idx % 2],
                      justifyContent: isLeft ? 'flex-start' : 'flex-end',
                    }}
                  >
                    <span>{turn.speaker}</span>
                    {isUserInjected && (
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[9px]"
                        style={{ background: 'var(--accent-2)', color: 'var(--ink-2)' }}
                      >
                        당신
                      </span>
                    )}
                  </p>
                  <div
                    className="rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed"
                    style={{
                      background: PERSONA_BGS[idx % 2],
                      color: 'var(--ink)',
                      border: isUserInjected
                        ? `1.5px dashed ${PERSONA_ACCENTS[idx % 2]}`
                        : 'none',
                    }}
                  >
                    {turn.content}
                  </div>
                </div>
              </div>
            );
          })}
          {/* '입력 중' 인디케이터 — reveal 대기 중인 다음 페르소나 OR 사용자 끼어들기 응답 중 OTHER 페르소나. */}
          {(isInjecting || visibleTurns < debateTurns.length) && (() => {
            let nextSpeaker = '';
            if (isInjecting && selectedPersonasState && selectedPersonasState.length >= 2) {
              // 사용자가 A로 발화 → B가 응답 중 (반대 페르소나가 thinking).
              nextSpeaker =
                injectAs === 'A'
                  ? selectedPersonasState[1].name
                  : selectedPersonasState[0].name;
            } else if (debateTurns[visibleTurns]) {
              nextSpeaker = debateTurns[visibleTurns].speaker;
            }
            const idx = personaIndex(nextSpeaker);
            return (
              <div className={`flex ${idx === 0 ? 'justify-start' : 'justify-end'}`}>
                <div
                  className="rounded-full px-3 py-2 text-[12px] flex gap-1"
                  style={{
                    background: PERSONA_BGS[idx % 2],
                    color: 'var(--ink-3)',
                  }}
                >
                  <span className="animate-pulse">·</span>
                  <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>·</span>
                  <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>·</span>
                </div>
              </div>
            );
          })()}

          {/* 플랜 보기 — 명시적 진입. paused/끝남 + planResult 있을 때만. */}
          {planResult != null && (debateDone || paused) && (
            <div className="flex justify-center mt-4">
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem(
                    'nextStep.plan',
                    JSON.stringify(planResult),
                  );
                  router.replace('/next-step/plan');
                }}
                className="px-5 py-2 rounded-full text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--warm)' }}
              >
                플랜 보기 →
              </button>
            </div>
          )}

          {/* 토론은 끝났지만 plan fetch가 아직 — 사용자가 빈 화면이라고 오해하지 않도록. */}
          {planResult == null && debateDone && (
            <p
              className="text-[11px] text-center mt-4"
              style={{ color: 'var(--ink-3)' }}
            >
              플랜을 준비하고 있어요…
            </p>
          )}
        </div>
      )}
    </div>
  );
}
