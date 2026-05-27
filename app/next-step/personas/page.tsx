'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Persona } from '@/lib/types';

// 페르소나 카드의 캐릭터 아바타 — DiceBear notionists 스타일.
// 페르소나 이름을 시드로 deterministic하게 일러스트 캐릭터 생성됨.
const AVATAR_BG = ['fbe5d6', 'd6e8fb', 'd6fbe5', 'f0ecf9']; // warm/blue/green/violet soft
const AVATAR_RING = ['var(--warm)', 'var(--blue)', 'var(--green)', '#9b86c5'];

function avatarUrl(seed: string, bgHex: string): string {
  const params = new URLSearchParams({
    seed,
    backgroundColor: bgHex,
    radius: '50',
  });
  return `https://api.dicebear.com/9.x/notionists/svg?${params.toString()}`;
}

export default function PersonasPage() {
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[] | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [shakingIndex, setShakingIndex] = useState<number | null>(null);

  useEffect(() => {
    try {
      const rawPersonas = sessionStorage.getItem('nextStep.personas');
      const rawAnswers = sessionStorage.getItem('nextStep.answers');

      if (!rawPersonas || !rawAnswers) {
        router.replace('/next-step/quiz');
        return;
      }

      const parsed = JSON.parse(rawPersonas);
      if (!Array.isArray(parsed) || parsed.length !== 4) {
        router.replace('/next-step/quiz');
        return;
      }

      setPersonas(parsed as Persona[]);
    } catch {
      router.replace('/next-step/quiz');
    }
  }, [router]);

  function handleCardClick(i: number) {
    if (selectedIndices.includes(i)) {
      setSelectedIndices((prev) => prev.filter((x) => x !== i));
    } else if (selectedIndices.length < 2) {
      setSelectedIndices((prev) => [...prev, i]);
    } else {
      // 2 already selected — shake to signal rejection
      setShakingIndex(i);
      setTimeout(() => setShakingIndex(null), 400);
    }
  }

  function handleBuild() {
    if (selectedIndices.length !== 2 || !personas) return;
    const chosen = selectedIndices.map((i) => personas[i]);
    sessionStorage.setItem('nextStep.selectedPersonas', JSON.stringify(chosen));
    router.push('/next-step/loading');
  }

  // Avoid flash of empty content while sessionStorage resolves
  if (personas === null) return null;

  const selectedCount = selectedIndices.length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%   { transform: translateX(0); }
          20%  { transform: translateX(-6px); }
          40%  { transform: translateX(6px); }
          60%  { transform: translateX(-4px); }
          80%  { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }
        .page-enter { animation: fadeUp 300ms ease forwards; }
        .persona-card {
          transition: transform 200ms ease, border-color 200ms ease, background 200ms ease;
        }
        .persona-card:hover { transform: translateY(-2px); }
        .persona-card.shaking { animation: shake 380ms ease; }
      `}</style>

      <main className="flex-1 flex flex-col items-center px-6 py-16 page-enter">

        {/* Header */}
        <div className="w-full max-w-[720px] text-center mb-12">
          <h1
            className="font-serif leading-[1.1] tracking-[-0.02em] mb-5"
            style={{
              color: 'var(--ink)',
              fontSize: 'clamp(40px, 6vw, 66px)',
            }}
          >
            어떤 두 미래가 당신을 위해 논쟁할까요?
          </h1>
          <p
            className="leading-relaxed mx-auto"
            style={{
              color: 'var(--ink-2)',
              fontSize: '16px',
              maxWidth: '520px',
            }}
          >
            아래는 3년 뒤 당신이 될 수 있는 네 가지 모습이에요.
            두 개를 골라보세요 — 그 둘이 서로 논쟁하면서 당신의 90일 플랜을 만들어줍니다.
          </p>
        </div>

        {/* 2×2 Card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[860px]">
          {personas.map((persona, i) => {
            const selected = selectedIndices.includes(i);
            const shaking = shakingIndex === i;

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleCardClick(i)}
                className={`persona-card text-left rounded-2xl relative outline-none focus-visible:ring-2${shaking ? ' shaking' : ''}`}
                style={{
                  padding: '32px',
                  background: selected ? 'var(--warm-soft)' : 'var(--bg-2)',
                  border: selected ? '2px solid var(--warm)' : '1px solid var(--line)',
                  cursor: 'pointer',
                }}
              >
                {/* Coral checkmark dot — visible when selected */}
                {selected && (
                  <span
                    className="absolute top-4 right-4 flex items-center justify-center w-5 h-5 rounded-full z-10"
                    style={{ background: 'var(--warm)' }}
                    aria-hidden="true"
                  >
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4l2.5 2.5L9 1"
                        stroke="white"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}

                {/* Avatar — Dicebear fun-emoji 캐릭터 (페르소나 이름 시드) */}
                <div className="mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarUrl(persona.name, AVATAR_BG[i % AVATAR_BG.length])}
                    alt=""
                    width={96}
                    height={96}
                    className="rounded-full"
                    style={{
                      display: 'block',
                      border: `3px solid ${AVATAR_RING[i % AVATAR_RING.length]}`,
                      background: `#${AVATAR_BG[i % AVATAR_BG.length]}`,
                    }}
                  />
                </div>

                {/* Name */}
                <h2
                  className="font-serif leading-tight mb-3"
                  style={{
                    color: 'var(--ink)',
                    fontSize: 'clamp(24px, 3vw, 30px)',
                  }}
                >
                  {persona.name}
                </h2>

                {/* Core belief */}
                <p
                  className="leading-relaxed mb-4"
                  style={{ color: 'var(--ink-2)', fontSize: '15px' }}
                >
                  {persona.coreBelief}
                </p>

                {/* Key fear */}
                <p
                  className="italic leading-relaxed"
                  style={{ color: 'var(--ink-3)', fontSize: '14px' }}
                >
                  <span className="not-italic font-medium" style={{ color: 'var(--ink-3)' }}>
                    두려워하는 것:{' '}
                  </span>
                  {persona.keyFear}
                </p>
              </button>
            );
          })}
        </div>

        {/* Counter + CTA */}
        <div className="flex flex-col items-center gap-4 mt-10">
          <p className="text-[13px]" style={{ color: 'var(--ink-3)' }}>
            2개 중 {selectedCount}개 선택됨
          </p>

          <button
            type="button"
            onClick={handleBuild}
            disabled={selectedCount !== 2}
            className="px-8 py-4 rounded-full text-[15px] font-semibold text-white transition-opacity"
            style={{
              background: 'var(--warm)',
              opacity: selectedCount === 2 ? 1 : 0.4,
              cursor: selectedCount === 2 ? 'pointer' : 'not-allowed',
            }}
          >
            이 두 미래로 플랜 만들기 →
          </button>
        </div>
      </main>

      {/* Back link */}
      <div className="flex justify-center pb-12">
        <Link
          href="/next-step/quiz"
          className="text-[13px] hover:underline transition-all"
          style={{ color: 'var(--ink-3)', textDecorationLine: 'none' }}
        >
          ← 이전
        </Link>
      </div>
    </div>
  );
}
