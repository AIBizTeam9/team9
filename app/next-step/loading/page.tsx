'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const PERSONA_MESSAGES = [
  '당신의 이야기를 듣는 중...',
  '두 미래 페르소나 만드는 중...',
  'Almost there...',
];

const PLAN_MESSAGES = [
  '두 미래가 토론하는 중...',
  '90일 플랜 만드는 중...',
  'Almost there...',
];

export default function LoadingPage() {
  const router = useRouter();
  const called = useRef(false);
  const [messages, setMessages] = useState(PERSONA_MESSAGES);
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, personas: selectedPersonas }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(body.error ?? `HTTP ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          sessionStorage.setItem('nextStep.plan', JSON.stringify(data));
          router.replace('/next-step/plan');
        })
        .catch((err) => {
          console.error('[loading] generate-plan failed:', err);
          const msg = err instanceof Error ? err.message : 'unknown';
          setErrorMsg(msg);
        });
    }
  }, [router]);

  if (errorMsg) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: 'var(--bg)' }}
      >
        <div className="max-w-[480px] text-center">
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
          <p
            className="text-[11px] mb-6 font-mono break-all"
            style={{ color: 'var(--ink-3)' }}
          >
            {errorMsg}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                called.current = false;
                setErrorMsg(null);
                // 페르소나가 이미 골라져 있으니 generate-plan만 재시도
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

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--bg)' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Spinner */}
      <div
        className="w-9 h-9 rounded-full mb-10"
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
        }}
      >
        {messages[msgIndex]}
      </p>
    </div>
  );
}
