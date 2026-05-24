'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DebateTurn, Persona, Plan } from '@/lib/types';

const PERSONA_MESSAGES = [
  '당신의 이야기를 듣는 중...',
  '두 미래 페르소나 만드는 중...',
  'Almost there...',
];

const REVEAL_INTERVAL_MS = 1400;
const FAST_REVEAL_MS = 120;

type Phase = 'personas' | 'debate';

function readJSON<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function initialPhase(): Phase {
  return readJSON<Persona[]>('nextStep.selectedPersonas') ? 'debate' : 'personas';
}

export default function LoadingPage() {
  const router = useRouter();
  const [phase] = useState<Phase>(initialPhase);

  if (phase === 'personas') {
    return <PersonaLoader router={router} />;
  }
  return <DebateLoader router={router} />;
}

/* ──────────────────────────────────────────────────────────────
 * Phase 1: generating the 4 personas (kept as a simple spinner)
 * ─────────────────────────────────────────────────────────── */

type RouterLike = ReturnType<typeof useRouter>;

function PersonaLoader({ router }: { router: RouterLike }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const called = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % PERSONA_MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const answers = readJSON<unknown>('nextStep.answers');
    if (!answers) {
      router.replace('/next-step/quiz');
      return;
    }

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
  }, [router]);

  return <Spinner message={PERSONA_MESSAGES[msgIndex]} visible={visible} />;
}

/* ──────────────────────────────────────────────────────────────
 * Phase 2: plan + debate in parallel. The chat card is the hero.
 * Navigate to /next-step/plan only once BOTH finish.
 * ─────────────────────────────────────────────────────────── */

function DebateLoader({ router }: { router: RouterLike }) {
  const called = useRef(false);
  const [personas] = useState<Persona[] | null>(() =>
    readJSON<Persona[]>('nextStep.selectedPersonas'),
  );
  const [turns, setTurns] = useState<DebateTurn[]>([]);
  const [visibleTurns, setVisibleTurns] = useState(0);
  const [typingFor, setTypingFor] = useState<number | null>(null); // index of next turn being typed
  const [planReady, setPlanReady] = useState(false);
  const [errored, setErrored] = useState(false);
  const [fastMode, setFastMode] = useState(false);

  // Kick off both fetches once on mount.
  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const answers = readJSON<unknown>('nextStep.answers');
    const selected = personas;
    if (!answers || !selected || selected.length !== 2) {
      router.replace('/next-step/quiz?error=1');
      return;
    }

    fetch('/api/persona-debate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, personas: selected }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data?.turns)) throw new Error('no turns');
        setTurns(data.turns as DebateTurn[]);
      })
      .catch(() => setErrored(true));

    fetch('/api/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, personas: selected }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Plan) => {
        sessionStorage.setItem('nextStep.plan', JSON.stringify(data));
        setPlanReady(true);
      })
      .catch(() => setErrored(true));
  }, [router, personas]);

  // Reveal one turn at a time. Typing indicator is shown for the *next* speaker
  // for the first half of each tick, then the bubble lands.
  // setTimeout(_, 0) defers the typing-on toggle out of the effect's synchronous
  // body so react-hooks/set-state-in-effect stays quiet.
  useEffect(() => {
    if (turns.length === 0) return;
    if (visibleTurns >= turns.length) return;

    const tick = fastMode ? FAST_REVEAL_MS : REVEAL_INTERVAL_MS;
    const typingMs = Math.round(tick * 0.55);

    const showId = setTimeout(() => setTypingFor(visibleTurns), 0);
    const hideId = setTimeout(() => setTypingFor(null), typingMs);
    const revealId = setTimeout(() => {
      setVisibleTurns((n) => n + 1);
    }, tick);

    return () => {
      clearTimeout(showId);
      clearTimeout(hideId);
      clearTimeout(revealId);
    };
  }, [visibleTurns, turns.length, fastMode]);

  const debateDone = turns.length > 0 && visibleTurns >= turns.length;

  // Navigate once BOTH the plan is ready AND the debate has finished revealing.
  useEffect(() => {
    if (planReady && debateDone) {
      router.replace('/next-step/plan');
    }
  }, [planReady, debateDone, router]);

  // Bail out on errors back to the quiz.
  useEffect(() => {
    if (errored) router.replace('/next-step/quiz?error=1');
  }, [errored, router]);

  // Auto-scroll the chat log as new bubbles arrive.
  const logRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visibleTurns, typingFor]);

  const handleFastForward = () => setFastMode(true);

  if (!personas) {
    return <Spinner message="추천 준비 중…" visible={true} />;
  }

  const [pa, pb] = personas;
  const sideFor = (speaker: string): 'a' | 'b' => (speaker === pb.name ? 'b' : 'a');
  const initialA = pa.name.charAt(0).toUpperCase() || 'A';
  const initialB = pb.name.charAt(0).toUpperCase() || 'B';

  return (
    <div
      className="min-h-screen px-6 py-12"
      style={{ background: 'var(--bg)' }}
    >
      <style>{CHAT_CSS}</style>

      <div className="debate-head">
        <span className="kicker">✦ 두 미래가 논쟁하는 중</span>
        <h2>A conversation between your two futures.</h2>
        <p>당신이 혼자서는 보지 못한 진실에 닿을 때까지 두 사람이 이야기합니다.</p>
      </div>

      {turns.length === 0 ? (
        <div className="chat" aria-busy="true">
          <div className="head">
            <div className="head-left">
              <div className="avatar a">{initialA}</div>
              <div className="avatar b" style={{ marginLeft: -10 }}>{initialB}</div>
              <div className="head-title">{pa.name} × {pb.name}</div>
            </div>
            <div className="counter">0 / —</div>
          </div>
          <div className="chat-empty">
            <span className="empty-dot" /> 두 미래가 이야기를 시작합니다…
          </div>
        </div>
      ) : (
        <div className="chat">
          <div className="head">
            <div className="head-left">
              <div className="avatar a">{initialA}</div>
              <div className="avatar b" style={{ marginLeft: -10 }}>{initialB}</div>
              <div className="head-title">{pa.name} × {pb.name}</div>
            </div>
            <div className="counter">{visibleTurns} / {turns.length}</div>
          </div>
          <div className="chat-log" ref={logRef}>
            {turns.slice(0, visibleTurns).map((t, i) => {
              const side = sideFor(t.speaker);
              const right = side === 'b';
              return (
                <div key={i} className={`msg ${side}${right ? ' right' : ''}`}>
                  <div className={`avatar ${side}`}>
                    {(side === 'a' ? initialA : initialB)}
                  </div>
                  <div>
                    <div className="who">{t.speaker}</div>
                    <div className="bubble">{t.message}</div>
                  </div>
                </div>
              );
            })}
            {typingFor !== null && turns[typingFor] && (() => {
              const t = turns[typingFor];
              const side = sideFor(t.speaker);
              const right = side === 'b';
              return (
                <div className={`msg ${side}${right ? ' right' : ''}`}>
                  <div className={`avatar ${side}`}>
                    {(side === 'a' ? initialA : initialB)}
                  </div>
                  <div>
                    <div className="who">{t.speaker}</div>
                    <div className="typing">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <div className="debate-foot">
        <button
          type="button"
          className="skip"
          onClick={handleFastForward}
          disabled={debateDone || fastMode}
        >
          ⏭ fast-forward
        </button>
        <span className="hint">
          {planReady && debateDone
            ? '플랜으로 이동합니다…'
            : planReady
              ? '플랜 준비 완료 — 대화 끝나면 이동합니다.'
              : '추천 플랜 준비 중…'}
        </span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Shared bits
 * ─────────────────────────────────────────────────────────── */

function Spinner({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--bg)' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div
        className="w-9 h-9 rounded-full mb-10"
        style={{
          border: '2.5px solid var(--line)',
          borderTopColor: 'var(--warm)',
          animation: 'spin 0.9s linear infinite',
        }}
      />
      <p
        style={{
          color: 'var(--ink-3)',
          fontSize: '14px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 300ms ease, transform 300ms ease',
          minWidth: '220px',
          textAlign: 'center',
        }}
      >
        {message}
      </p>
    </div>
  );
}

const CHAT_CSS = `
  .debate-head { text-align: center; max-width: 640px; margin: 0 auto 24px; }
  .debate-head .kicker {
    color: var(--warm); font-size: 13px; font-weight: 600;
    letter-spacing: .08em; text-transform: uppercase;
  }
  .debate-head h2 {
    font-family: var(--font-instrument-serif), 'Instrument Serif', serif;
    font-weight: 400; font-size: clamp(32px, 5vw, 44px);
    margin: 8px 0 8px; letter-spacing: -.02em; color: var(--ink);
  }
  .debate-head p { color: var(--ink-2); font-size: 15px; margin: 0; }

  .chat {
    max-width: 680px; margin: 0 auto;
    background: var(--bg-2); border: 1px solid var(--line);
    border-radius: 16px; padding: 20px;
    box-shadow: var(--shadow); min-height: 400px;
  }
  .chat .head {
    display: flex; justify-content: space-between; align-items: center;
    padding-bottom: 12px; margin-bottom: 12px;
    border-bottom: 1px solid var(--line);
  }
  .chat .head-left { display: flex; gap: 8px; align-items: center; }
  .chat .head-title { margin-left: 6px; font-size: 13.5px; font-weight: 500; color: var(--ink); }
  .chat .counter { font-size: 12px; color: var(--ink-3); font-variant-numeric: tabular-nums; }
  .chat-log { max-height: 60vh; overflow-y: auto; padding-right: 4px; }
  .chat-empty {
    color: var(--ink-3); font-size: 13px;
    display: flex; align-items: center; gap: 8px;
    padding: 24px 4px;
  }
  .empty-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--warm); display: inline-block;
    animation: pulse 1.2s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }

  .msg { display: flex; gap: 10px; margin: 10px 0; animation: pop .35s ease; }
  .msg.right { flex-direction: row-reverse; }
  @keyframes pop {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: none; }
  }
  .avatar {
    width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-instrument-serif), 'Instrument Serif', serif;
    font-size: 16px; color: #fff;
  }
  .avatar.a { background: linear-gradient(135deg, #e8a27a, #d97757); }
  .avatar.b { background: linear-gradient(135deg, #7a9dcf, #3e6ea9); }
  .bubble {
    max-width: 74%; padding: 10px 14px; border-radius: 14px;
    font-size: 14px; line-height: 1.55;
    white-space: pre-wrap; word-wrap: break-word;
  }
  .msg.a .bubble { background: var(--warm-soft); color: #3a2318; border-top-left-radius: 4px; }
  .msg.b .bubble { background: var(--blue-soft); color: #1b2f4a; border-top-right-radius: 4px; }
  .msg .who { font-size: 11px; color: var(--ink-3); margin-bottom: 2px; font-weight: 500; }
  .msg.right .who { text-align: right; }

  .typing {
    display: inline-flex; gap: 3px; padding: 10px 14px;
    background: var(--bg); border: 1px solid var(--line);
    border-radius: 14px;
  }
  .typing span {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--ink-3); animation: type 1.2s infinite;
  }
  .typing span:nth-child(2) { animation-delay: .2s; }
  .typing span:nth-child(3) { animation-delay: .4s; }
  @keyframes type {
    0%, 60%, 100% { opacity: .3; transform: translateY(0); }
    30%           { opacity: 1;  transform: translateY(-3px); }
  }

  .debate-foot {
    display: flex; justify-content: space-between; align-items: center;
    max-width: 680px; margin: 16px auto 0; gap: 12px;
  }
  .debate-foot .skip {
    color: var(--ink-3); font-size: 13px; background: none;
    border: none; cursor: pointer; font-family: inherit; padding: 4px 0;
  }
  .debate-foot .skip:hover:not(:disabled) { color: var(--ink); }
  .debate-foot .skip:disabled { opacity: .4; cursor: default; }
  .debate-foot .hint { color: var(--ink-3); font-size: 12px; }
`;
