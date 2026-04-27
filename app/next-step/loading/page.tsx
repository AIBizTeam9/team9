'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const MESSAGES = [
  'Reading your answers…',
  'Identifying the patterns…',
  'Building your 90-day arc…',
  'Writing week-by-week actions…',
  'Almost there…',
];

export default function LoadingPage() {
  const router = useRouter();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const raw = sessionStorage.getItem('nextStep.answers');
    if (!raw) {
      router.replace('/next-step/quiz');
      return;
    }

    let answers: unknown;
    try {
      answers = JSON.parse(raw);
    } catch {
      router.replace('/next-step/quiz');
      return;
    }

    fetch('/api/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((plan) => {
        sessionStorage.setItem('nextStep.plan', JSON.stringify(plan));
        router.replace('/next-step/plan');
      })
      .catch(() => {
        router.replace('/next-step/quiz?error=1');
      });
  }, [router]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--bg)' }}
    >
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes msgFade {
          0%   { opacity: 0; transform: translateY(6px); }
          15%  { opacity: 1; transform: translateY(0); }
          80%  { opacity: 1; }
          100% { opacity: 0; }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
        .msg-cycle span {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: msgFade ${MESSAGES.length * 2}s ease-in-out infinite;
        }
        ${MESSAGES.map((_, i) => `.msg-cycle span:nth-child(${i + 1}) { animation-delay: ${i * 2}s; }`).join('\n')}
      `}</style>

      {/* Spinner */}
      <div
        className="spinner w-9 h-9 rounded-full mb-10"
        style={{
          border: '2.5px solid var(--line)',
          borderTopColor: 'var(--warm)',
        }}
      />

      {/* Cycling message */}
      <div
        className="msg-cycle relative h-6 w-[260px]"
        style={{ color: 'var(--ink-3)', fontSize: '14px' }}
      >
        {MESSAGES.map((msg) => (
          <span key={msg}>{msg}</span>
        ))}
      </div>
    </div>
  );
}
