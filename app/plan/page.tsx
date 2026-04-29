"use client";

import { useState } from "react";

type Action = { id: string; text: string; done: boolean };
type Phase = {
  id: string;
  title: string;
  days: string;
  goal: string;
  color: string;
  softColor: string;
  actions: Action[];
};

type ApiPhase = {
  title?: string;
  days?: string;
  goal?: string;
  actions?: string[];
};
type ApiResponse = { phases?: ApiPhase[] };

const INITIAL_PHASES: Phase[] = [
  {
    id: "p1",
    title: "탐색 & 학습",
    days: "1~30일",
    goal: "새로운 분야의 기초를 다지고, 가능성을 검증할 자료를 모은다",
    color: "var(--green)",
    softColor: "var(--green-soft)",
    actions: [
      { id: "p1a1", text: "관련 분야 입문서 / 강의 1개 완주", done: false },
      { id: "p1a2", text: "현직자 또는 전문가 5명 인터뷰", done: false },
      { id: "p1a3", text: "매주 2시간 정리 노트 작성", done: false },
      { id: "p1a4", text: "관심 키워드로 정보 채널 5개 구독", done: false },
    ],
  },
  {
    id: "p2",
    title: "실행 & 경험",
    days: "31~60일",
    goal: "작은 실험을 통해 시장과 본인의 적합성을 검증한다",
    color: "var(--blue)",
    softColor: "var(--blue-soft)",
    actions: [
      { id: "p2a1", text: "사이드 프로젝트 / 포트폴리오 1개 착수", done: false },
      { id: "p2a2", text: "관련 커뮤니티 또는 모임 2곳 참여", done: false },
      { id: "p2a3", text: "멘토 또는 동료 1명 확보", done: false },
      { id: "p2a4", text: "첫 결과물 공개 (블로그 / SNS)", done: false },
    ],
  },
  {
    id: "p3",
    title: "도약 & 정착",
    days: "61~90일",
    goal: "본격적인 활동으로 전환하고, 다음 90일 계획을 세운다",
    color: "var(--warm)",
    softColor: "var(--warm-soft)",
    actions: [
      { id: "p3a1", text: "정기 발행 / 결과물 루틴 확립 (주 1회)", done: false },
      { id: "p3a2", text: "이직 또는 부수입 옵션 검토", done: false },
      { id: "p3a3", text: "네트워크 확장 — 새로운 사람 10명", done: false },
      { id: "p3a4", text: "90일 회고 + 다음 90일 플랜 작성", done: false },
    ],
  },
];

export default function PlanPage() {
  const [phases, setPhases] = useState<Phase[]>(INITIAL_PHASES);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const totalActions = phases.reduce((sum, p) => sum + p.actions.length, 0);
  const doneActions = phases.reduce(
    (sum, p) => sum + p.actions.filter((a) => a.done).length,
    0,
  );
  const pct =
    totalActions === 0 ? 0 : Math.round((doneActions / totalActions) * 100);

  const toggleAction = (phaseId: string, actionId: string) => {
    setPhases((prev) =>
      prev.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              actions: p.actions.map((a) =>
                a.id === actionId ? { ...a, done: !a.done } : a,
              ),
            }
          : p,
      ),
    );
  };

  const generatePlan = async () => {
    setGenerating(true);
    setNotice(null);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insights: [] }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as ApiResponse;
      if (Array.isArray(data.phases) && data.phases.length === 3) {
        const incoming: Phase[] = data.phases.map((p, i) => ({
          id: `p${i + 1}`,
          title: p.title ?? INITIAL_PHASES[i].title,
          days: p.days ?? INITIAL_PHASES[i].days,
          goal: p.goal ?? INITIAL_PHASES[i].goal,
          color: INITIAL_PHASES[i].color,
          softColor: INITIAL_PHASES[i].softColor,
          actions: (p.actions ?? []).map((text, j) => ({
            id: `p${i + 1}a${j + 1}`,
            text,
            done: false,
          })),
        }));
        setPhases(incoming);
        setNotice("새 플랜을 생성했어요.");
      }
    } catch {
      setNotice("API가 아직 준비되지 않았어요. (2단계에서 구현 예정)");
    } finally {
      setGenerating(false);
    }
  };

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="max-w-[980px] mx-auto px-6 py-5">
          <h1
            className="font-serif text-2xl tracking-[-0.01em]"
            style={{ color: "var(--ink)" }}
          >
            90일 실행 플랜
          </h1>
          <p
            className="text-[13px] mt-0.5"
            style={{ color: "var(--ink-3)" }}
          >
            디베이트 인사이트 → 개인 맞춤형 실행 계획
          </p>
        </div>
      </header>

      <main className="max-w-[700px] mx-auto px-6 py-12">
        {/* 상단: 진행률 + 플랜 생성 버튼 */}
        <section
          className="rounded-2xl p-6 mb-10 flex items-center gap-6"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--line)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div
            className="relative flex-shrink-0"
            style={{ width: 96, height: 96 }}
          >
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r={radius}
                fill="none"
                stroke="var(--line)"
                strokeWidth="6"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                fill="none"
                stroke="var(--ink)"
                strokeWidth="6"
                strokeDasharray={`${dash} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(-90 48 48)"
                style={{ transition: "stroke-dasharray 0.4s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="font-serif text-[24px] tracking-[-0.02em]"
                style={{ color: "var(--ink)" }}
              >
                {pct}%
              </span>
            </div>
          </div>

          <div className="flex-1">
            <p
              className="text-[11px] uppercase tracking-[0.08em] mb-1.5"
              style={{ color: "var(--ink-3)" }}
            >
              전체 진행률
            </p>
            <p className="mb-3" style={{ color: "var(--ink-2)" }}>
              <span
                className="font-serif text-[22px] tracking-[-0.01em]"
                style={{ color: "var(--ink)" }}
              >
                {doneActions}
              </span>
              <span
                className="text-[14px]"
                style={{ color: "var(--ink-3)" }}
              >
                {" "}
                / {totalActions} 행동 완료
              </span>
            </p>
            <button
              onClick={generatePlan}
              disabled={generating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--accent)" }}
            >
              {generating ? "생성 중..." : "플랜 생성하기"}
              <span className="text-[11px] opacity-70">→</span>
            </button>
            {notice && (
              <p
                className="text-[12px] mt-2"
                style={{ color: "var(--ink-3)" }}
              >
                {notice}
              </p>
            )}
          </div>
        </section>

        {/* 타임라인 */}
        <div className="relative pl-12">
          <div
            className="absolute left-[18px] top-3 bottom-3 w-px"
            style={{ background: "var(--line-2)" }}
          />

          {phases.map((phase, i) => {
            const phaseDone = phase.actions.filter((a) => a.done).length;
            const phaseTotal = phase.actions.length;
            return (
              <section key={phase.id} className="relative mb-6 last:mb-0">
                <div
                  className="absolute -left-12 top-3 w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold"
                  style={{
                    background: phase.color,
                    color: "var(--bg-2)",
                    boxShadow: "0 0 0 4px var(--bg)",
                  }}
                >
                  {i + 1}
                </div>

                <article
                  className="rounded-2xl p-5"
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--line)",
                    boxShadow: "var(--shadow)",
                  }}
                >
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <span
                        className="text-[11px] uppercase tracking-[0.08em]"
                        style={{ color: phase.color }}
                      >
                        {phase.days}
                      </span>
                      <h3
                        className="font-serif text-[22px] tracking-[-0.01em] mt-0.5"
                        style={{ color: "var(--ink)" }}
                      >
                        {phase.title}
                      </h3>
                    </div>
                    <span
                      className="text-[11px] px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{
                        background: phase.softColor,
                        color: phase.color,
                      }}
                    >
                      {phaseDone} / {phaseTotal}
                    </span>
                  </div>

                  <p
                    className="text-[13px] mb-4 pl-3 border-l-2 leading-relaxed"
                    style={{
                      color: "var(--ink-2)",
                      borderColor: phase.color,
                    }}
                  >
                    <span
                      className="text-[11px] uppercase tracking-[0.06em] mr-1.5"
                      style={{ color: "var(--ink-3)" }}
                    >
                      목표
                    </span>
                    {phase.goal}
                  </p>

                  <ul className="space-y-2.5">
                    {phase.actions.map((action) => (
                      <li key={action.id}>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={action.done}
                            onChange={() => toggleAction(phase.id, action.id)}
                            className="sr-only"
                          />
                          <span
                            className="mt-[3px] w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors"
                            style={{
                              background: action.done
                                ? phase.color
                                : "var(--bg-2)",
                              border: `1px solid ${
                                action.done ? phase.color : "var(--line-2)"
                              }`,
                            }}
                          >
                            {action.done && (
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                fill="none"
                              >
                                <path
                                  d="M2 5l2 2 4-4"
                                  stroke="white"
                                  strokeWidth="1.6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </span>
                          <span
                            className="text-[13px] leading-snug transition-all"
                            style={{
                              color: action.done
                                ? "var(--ink-3)"
                                : "var(--ink-2)",
                              textDecoration: action.done
                                ? "line-through"
                                : "none",
                            }}
                          >
                            {action.text}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </article>
              </section>
            );
          })}
        </div>

        <p
          className="text-[11px] mt-10 text-center"
          style={{ color: "var(--ink-3)" }}
        >
          체크박스를 눌러 진행 상황을 기록하세요. &ldquo;플랜 생성하기&rdquo;를 누르면 디베이트 인사이트 기반 맞춤형 플랜이 생성됩니다.
        </p>
      </main>
    </div>
  );
}
