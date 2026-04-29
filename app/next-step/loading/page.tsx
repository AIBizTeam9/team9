'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  // Cycle through messages: fade out → swap text → fade in
  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(id);
  }, []);

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

      {/* Cycling message — single element, JS-driven fade */}
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
        {MESSAGES[msgIndex]}
      </p>
    </div>
  );
}
