"use client";

import { useState } from "react";
import type { Plan, PlanAction, PlanMonth, PlanResource } from "@/lib/types";
import type { PlanProgress, PlanProgressEntry } from "@/lib/nextstep/db";
import CalendarExportButton from "./calendar-export-button";

const EFFORT_STYLE: Record<
  PlanAction["effort"],
  { bg: string; color: string; label: string }
> = {
  small: { bg: "var(--green-soft)", color: "var(--green)", label: "가볍게" },
  medium: { bg: "var(--warm-soft)", color: "var(--warm)", label: "보통" },
  large: { bg: "var(--blue-soft)", color: "var(--blue)", label: "묵직" },
};

type Props = {
  plan: Plan;
  hideFirstStep?: boolean;
  // 진행 상황 — 주어지면 각 action에 체크박스 + 리뷰 노트 입력이 활성화됨.
  progress?: PlanProgress;
  onProgressChange?: (week: number, next: PlanProgressEntry) => void;
  // 캘린더 .ics export의 day-1 기준일. 저장된 플랜은 plan.created_at, 새로 만든
  // 플랜은 today. 누락 시 export 버튼은 숨김.
  startDate?: Date;
  // 안정적인 UID 부여용 (saved-plan view → plan.id).
  planId?: string;
};

function entryFor(progress: PlanProgress | undefined, week: number): PlanProgressEntry {
  return (
    progress?.[`week_${week}`] ?? {
      done: false,
      note: "",
      updatedAt: "",
    }
  );
}

// /next-step/plan/page.tsx와 /account/next-step/[id]/page.tsx에서 공유하는 렌더링.
export default function PlanView({
  plan,
  hideFirstStep = false,
  progress,
  onProgressChange,
  startDate,
  planId,
}: Props) {
  return (
    <>
      <h1
        className="font-serif leading-[1.15] tracking-[-0.02em] mb-5"
        style={{ color: "var(--ink)", fontSize: "clamp(28px, 4.5vw, 44px)" }}
      >
        {plan.headline}
      </h1>

      {/* 두 자아의 결론 — rationale을 "디베이트 결과"로 명시. */}
      <div className="mb-10" style={{ maxWidth: "600px" }}>
        <p
          className="text-[11px] font-medium tracking-[0.08em] uppercase mb-2"
          style={{ color: "var(--warm)" }}
        >
          두 자아의 결론
        </p>
        <p
          className="leading-relaxed"
          style={{ color: "var(--ink-2)", fontSize: "16px" }}
        >
          {plan.rationale}
        </p>
      </div>

      <div
        className="rounded-2xl p-7 mb-14"
        style={{
          background: "var(--warm-soft)",
          borderLeft: "4px solid var(--warm)",
        }}
      >
        <p
          className="text-[11px] font-medium tracking-[0.08em] uppercase mb-3"
          style={{ color: "var(--warm)" }}
        >
          핵심 통찰
        </p>
        <p
          className="font-serif leading-[1.4]"
          style={{
            color: "var(--ink)",
            fontSize: "clamp(18px, 2.5vw, 22px)",
            fontStyle: "italic",
          }}
        >
          &ldquo;{plan.coreInsight}&rdquo;
        </p>
      </div>

      <div className="flex flex-col gap-14">
        {plan.months.map((month) => (
          <MonthSection
            key={month.month}
            month={month}
            progress={progress}
            onProgressChange={onProgressChange}
          />
        ))}
      </div>

      {plan.resources && plan.resources.length > 0 && (
        <div
          className="mt-16 pt-12"
          style={{ borderTop: "1px solid var(--line)" }}
        >
          <p
            className="text-[11px] font-medium tracking-[0.08em] uppercase mb-6"
            style={{ color: "var(--ink-3)" }}
          >
            추천 자료
          </p>
          <div className="flex flex-col gap-3">
            {plan.resources.map((r) => (
              <ResourceCard key={r.url} resource={r} />
            ))}
          </div>
        </div>
      )}

      {!hideFirstStep && plan.firstStep && (
        <div
          className="mt-12 rounded-2xl p-8"
          style={{ background: "var(--ink)", color: "var(--bg)" }}
        >
          <p
            className="text-[11px] font-medium tracking-[0.08em] uppercase mb-4"
            style={{ color: "var(--warm)" }}
          >
            오늘 할 한 가지
          </p>
          <p
            className="font-serif leading-[1.4]"
            style={{ fontSize: "clamp(18px, 2.5vw, 22px)" }}
          >
            {plan.firstStep}
          </p>
        </div>
      )}

      {startDate && (
        <CalendarExportButton plan={plan} startDate={startDate} planId={planId} />
      )}
    </>
  );
}

function MonthSection({
  month,
  progress,
  onProgressChange,
}: {
  month: PlanMonth;
  progress?: PlanProgress;
  onProgressChange?: (week: number, next: PlanProgressEntry) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-5">
        <span
          className="text-[11px] font-medium tracking-[0.08em] uppercase shrink-0"
          style={{ color: "var(--ink-3)" }}
        >
          {month.month}개월차
        </span>
        <div
          className="flex-1 h-px"
          style={{ background: "var(--line)" }}
        />
      </div>
      <h2
        className="font-serif leading-[1.2] tracking-[-0.01em] mb-6"
        style={{ color: "var(--ink)", fontSize: "clamp(20px, 3vw, 26px)" }}
      >
        {month.theme}
      </h2>
      <div className="flex flex-col gap-3">
        {month.actions.map((action) => (
          <ActionCard
            key={action.week}
            action={action}
            entry={entryFor(progress, action.week)}
            onChange={
              onProgressChange
                ? (next) => onProgressChange(action.week, next)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

function ActionCard({
  action,
  entry,
  onChange,
}: {
  action: PlanAction;
  entry: PlanProgressEntry;
  onChange?: (next: PlanProgressEntry) => void;
}) {
  const ef = EFFORT_STYLE[action.effort] ?? EFFORT_STYLE.medium;
  const interactive = !!onChange;
  const [showNote, setShowNote] = useState(entry.note.length > 0);

  const setDone = (done: boolean) => {
    onChange?.({ ...entry, done, updatedAt: new Date().toISOString() });
  };
  const setNote = (note: string) => {
    onChange?.({ ...entry, note, updatedAt: new Date().toISOString() });
  };

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: entry.done ? "var(--green-soft)" : "var(--bg-2)",
        border: `1px solid ${entry.done ? "var(--green)" : "var(--line)"}`,
        transition: "background 200ms, border 200ms",
      }}
    >
      <div className="flex items-start gap-3">
        {interactive && (
          <button
            type="button"
            onClick={() => setDone(!entry.done)}
            aria-pressed={entry.done}
            aria-label={entry.done ? "완료 취소" : "완료 표시"}
            className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all"
            style={{
              background: entry.done ? "var(--green)" : "transparent",
              border: `1.5px solid ${entry.done ? "var(--green)" : "var(--line-2)"}`,
            }}
          >
            {entry.done && (
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                <path
                  d="M1 4.5L4 7.5L10 1.5"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[11px] font-medium tabular-nums"
              style={{ color: "var(--ink-3)" }}
            >
              {action.week}주차
            </span>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: ef.bg, color: ef.color }}
            >
              {ef.label}
            </span>
            {entry.done && (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full ml-auto"
                style={{ background: "var(--green)", color: "white" }}
              >
                ✓ 완료
              </span>
            )}
          </div>
          <p
            className="text-[15px] font-medium mb-1.5 leading-snug"
            style={{
              color: "var(--ink)",
              textDecoration: entry.done ? "line-through" : "none",
              opacity: entry.done ? 0.7 : 1,
            }}
          >
            {action.title}
          </p>
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: "var(--ink-3)" }}
          >
            {action.why}
          </p>

          {/* 난이도 3단계 — 모델이 채웠을 때만 노출. 사용자가 자신의 에너지에 맞는 버전을
              스스로 고를 수 있게. */}
          {action.tiers && (
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {(
                [
                  { key: "low", label: "오늘 한 가지", color: "var(--green)", bg: "var(--green-soft)" },
                  { key: "medium", label: "이번 주", color: "var(--warm)", bg: "var(--warm-soft)" },
                  { key: "high", label: "이번 달 도약", color: "var(--blue)", bg: "var(--blue-soft)" },
                ] as const
              ).map((tier) => {
                const text = action.tiers?.[tier.key];
                if (!text) return null;
                return (
                  <div
                    key={tier.key}
                    className="rounded-lg p-3"
                    style={{
                      background: tier.bg,
                      border: `1px solid ${tier.color}`,
                    }}
                  >
                    <p
                      className="text-[10px] font-medium tracking-[0.04em] uppercase mb-1.5"
                      style={{ color: tier.color }}
                    >
                      {tier.label}
                    </p>
                    <p className="text-[12px] leading-relaxed" style={{ color: "var(--ink)" }}>
                      {text}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {interactive && (
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--line)" }}>
              {!showNote && entry.note.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setShowNote(true)}
                  className="text-[12px] hover:underline"
                  style={{ color: "var(--ink-3)" }}
                >
                  + 리뷰 적기
                </button>
              ) : (
                <div>
                  <label
                    className="block text-[10px] uppercase tracking-[0.08em] mb-1.5"
                    style={{ color: "var(--ink-3)" }}
                  >
                    리뷰 · 회고
                  </label>
                  <textarea
                    value={entry.note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="이번 행동에서 배운 것, 느낀 점, 다음에 다르게 할 것을 적어보세요."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg text-[13px] leading-relaxed resize-y"
                    style={{
                      background: "var(--bg)",
                      border: "1px solid var(--line)",
                      color: "var(--ink-2)",
                      minHeight: "60px",
                    }}
                  />
                  {entry.updatedAt && (
                    <p
                      className="text-[10px] mt-1.5"
                      style={{ color: "var(--ink-3)" }}
                    >
                      마지막 저장 {formatRelative(entry.updatedAt)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

function ResourceCard({ resource }: { resource: PlanResource }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl p-5 transition-all hover:shadow-md"
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--line)",
        textDecoration: "none",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p
            className="text-[14px] font-medium mb-1 leading-snug"
            style={{ color: "var(--ink)" }}
          >
            {resource.title}
          </p>
          <p
            className="text-[12px] mb-2 truncate"
            style={{ color: "var(--warm)" }}
          >
            {resource.url}
          </p>
          {resource.source && (
            <p className="text-[11px] mb-2" style={{ color: "var(--ink-3)" }}>
              출처: {resource.source}
            </p>
          )}
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: "var(--ink-3)" }}
          >
            {resource.why}
          </p>
        </div>
        <span
          className="text-[14px] shrink-0 mt-0.5"
          style={{ color: "var(--line-2)" }}
        >
          ↗
        </span>
      </div>
    </a>
  );
}
