"use client";

import { useState } from "react";
import type { Plan } from "@/lib/types";
import { planToICS } from "@/lib/nextstep/ics";
import { downloadICS } from "@/lib/nextstep/download";

type Props = {
  plan: Plan;
  startDate: Date;
  planId?: string;     // saved-plan view에서 안정적인 UID를 위해 넘겨준다
  filename?: string;   // 기본: next-step-90-day-plan.ics
};

// 캘린더 .ics 내보내기 — 완전 클라이언트 사이드.
// Apple Calendar / Google Calendar / Outlook 모두 같은 파일 한 번에 import 가능.
export default function CalendarExportButton({
  plan,
  startDate,
  planId,
  filename = "next-step-90-day-plan.ics",
}: Props) {
  const [done, setDone] = useState(false);
  const hasActions =
    (plan.months ?? []).reduce((sum, m) => sum + (m.actions?.length ?? 0), 0) > 0;

  const onClick = () => {
    const ics = planToICS(plan, startDate, { planId });
    downloadICS(filename, ics);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  };

  return (
    <div className="mt-6 flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={!hasActions}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: "transparent",
          color: "var(--ink)",
          border: "1px solid var(--ink)",
        }}
        aria-label="이 플랜을 캘린더 파일(.ics)로 내보내기"
      >
        <CalendarIcon />
        {done ? "다운로드 시작됨 ✓" : "캘린더에 추가 (.ics)"}
      </button>
      <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>
        Apple Calendar · Google Calendar · Outlook에서 열 수 있어요.
        {" "}
        {Math.max(0, (plan.months ?? []).reduce((s, m) => s + (m.actions?.length ?? 0), 0))}개 일정 +
        첫 걸음 1개.
      </p>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="3" width="12" height="11" rx="2" />
      <path d="M2 6h12" />
      <path d="M5.5 2v2" />
      <path d="M10.5 2v2" />
    </svg>
  );
}
