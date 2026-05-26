"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import PlanView from "@/components/nextstep/plan-view";
import { getUser, onAuthChange } from "@/lib/auth";
import {
  computeStreak,
  daysSinceLastEntry,
  deletePlan,
  getJournal,
  getPlan,
  localDateKey,
  progressStats,
  updatePlanProgress,
  upsertJournalEntry,
  type Journal,
  type JournalEntry,
  type PlanProgress,
  type PlanProgressEntry,
  type SavedPlan,
} from "@/lib/nextstep/db";

function formatFull(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [progress, setProgress] = useState<PlanProgress>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [deleting, setDeleting] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const u = await getUser();
      if (!mounted) return;
      setUser(u);
      if (!u) {
        router.replace("/login");
        return;
      }
      const detail = await getPlan(u.id, id);
      if (!mounted) return;
      if (!detail) setNotFound(true);
      else {
        setPlan(detail);
        setProgress(detail.progress ?? {});
      }
      setLoading(false);
    };
    init();

    const { data } = onAuthChange((u) => {
      if (!mounted) return;
      const next = u as User | null;
      if (!next) router.replace("/login");
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [router, id]);

  const onDelete = async () => {
    if (!user || !plan) return;
    if (!confirm("이 플랜을 영구히 삭제할까요? 되돌릴 수 없습니다.")) return;
    setDeleting(true);
    try {
      await deletePlan(user.id, plan.id);
      router.replace("/account/next-step");
    } catch {
      setDeleting(false);
    }
  };

  // Action별 진행 상황 업데이트 — 600ms debounce로 한 번에 모아서 저장.
  const handleProgressChange = (week: number, entry: PlanProgressEntry) => {
    if (!user || !plan) return;
    const key = `week_${week}`;
    setProgress((prev) => {
      const next = { ...prev, [key]: entry };
      // schedule debounced save
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveState("saving");
      saveTimerRef.current = setTimeout(async () => {
        const result = await updatePlanProgress(user.id, plan.id, next);
        setSaveState(result.ok ? "saved" : "error");
        if (result.ok) {
          setTimeout(() => setSaveState("idle"), 1500);
        }
      }, 600);
      return next;
    });
  };

  // 저널 저장 — 같은 progress 컬럼의 reserved 슬롯에 들어간다. 디바운스 없이 즉시 저장
  // (사용자가 명시적으로 Save 버튼을 누르는 흐름이라 debounce 불필요).
  const handleJournalSave = async (next: { body: string; mood?: number }) => {
    if (!user || !plan) return;
    const todayISO = localDateKey();
    const updated = upsertJournalEntry(progress, todayISO, next);
    setProgress(updated);
    setSaveState("saving");
    const result = await updatePlanProgress(user.id, plan.id, updated);
    setSaveState(result.ok ? "saved" : "error");
    if (result.ok) setTimeout(() => setSaveState("idle"), 1500);
  };

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    [],
  );

  if (loading || !user) {
    return (
      <div
        className="min-h-[calc(100vh-56px)] flex items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                background: "var(--warm)",
                animationDelay: `${i * 200}ms`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !plan) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        <section className="max-w-[860px] mx-auto px-6 pt-12 pb-16">
          <div className="mb-6">
            <Link
              href="/account/next-step"
              className="text-[12px] tracking-[0.04em] uppercase"
              style={{ color: "var(--ink-3)" }}
            >
              ← 지난 플랜
            </Link>
          </div>
          <div
            className="rounded-xl p-8 text-center"
            style={{
              background: "var(--bg-2)",
              border: "1px dashed var(--line-2)",
              color: "var(--ink-3)",
            }}
          >
            <p className="text-[13px]">이 플랜을 찾을 수 없어요.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div
        style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px 96px" }}
      >
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/account/next-step"
            className="inline-flex items-center gap-1.5 text-[12px] transition-opacity hover:opacity-70"
            style={{ color: "var(--ink-3)" }}
          >
            ← 지난 플랜
          </Link>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="text-[11px] px-2 py-1 rounded-full transition-colors disabled:opacity-50"
            style={{ color: "var(--ink-3)" }}
          >
            {deleting ? "삭제 중…" : "이 플랜 삭제"}
          </button>
        </div>

        <p
          className="text-[12px] font-medium tracking-[0.08em] uppercase mb-4"
          style={{ color: "var(--ink-3)" }}
        >
          {formatFull(plan.created_at)}에 만들어진 플랜
        </p>

        {/* Progress 헤더 — streak 칩 포함 */}
        <ProgressHeader plan={plan} progress={progress} saveState={saveState} />

        {/* 일일 저널: 오늘의 한 줄 + mood + 지난 14일 sparkline + 타임라인 */}
        <JournalSection progress={progress} onSave={handleJournalSave} />

        <PlanView
          plan={plan.plan}
          progress={progress}
          onProgressChange={handleProgressChange}
          startDate={new Date(plan.created_at)}
          planId={plan.id}
        />

        {plan.personas && plan.personas.length > 0 && (
          <div
            className="mt-14 pt-10"
            style={{ borderTop: "1px solid var(--line)" }}
          >
            <p
              className="text-[11px] font-medium tracking-[0.08em] uppercase mb-5"
              style={{ color: "var(--ink-3)" }}
            >
              이 플랜을 만든 두 자아
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {plan.personas.map((p, i) => (
                <div
                  key={i}
                  className="rounded-xl p-5"
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <p
                    className="font-serif text-[16px] mb-2"
                    style={{ color: "var(--ink)" }}
                  >
                    {p.name}
                  </p>
                  <p
                    className="text-[12px] leading-relaxed mb-2"
                    style={{ color: "var(--ink-2)" }}
                  >
                    {p.coreBelief}
                  </p>
                  <p
                    className="text-[11px] italic"
                    style={{ color: "var(--ink-3)" }}
                  >
                    가장 강한 주장: {p.strongestArgument}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/next-step"
            className="text-[13px] transition-opacity hover:opacity-70"
            style={{ color: "var(--ink-3)" }}
          >
            ← 새 플랜 만들기
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProgressHeader({
  plan,
  progress,
  saveState,
}: {
  plan: SavedPlan;
  progress: PlanProgress;
  saveState: "idle" | "saving" | "saved" | "error";
}) {
  const totalActions = plan.plan.months.reduce(
    (sum, m) => sum + (m.actions?.length ?? 0),
    0,
  );
  const { doneCount, noteCount, pct } = progressStats(progress, totalActions);
  const journal = getJournal(progress);
  const streak = computeStreak(journal);

  const statusLabel =
    saveState === "saving"
      ? "저장 중…"
      : saveState === "saved"
        ? "저장됨"
        : saveState === "error"
          ? "저장 실패"
          : null;
  const statusColor =
    saveState === "error" ? "var(--warm)" : "var(--green)";

  return (
    <div
      className="rounded-2xl p-5 mb-10"
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--line)",
      }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <p
            className="text-[11px] font-medium tracking-[0.08em] uppercase mb-1"
            style={{ color: "var(--ink-3)" }}
          >
            진행 상황
          </p>
          <p
            className="font-serif text-[20px] tracking-[-0.01em]"
            style={{ color: "var(--ink)" }}
          >
            {doneCount} / {totalActions} 완료 · {pct}%
            {noteCount > 0 && (
              <span
                className="ml-2 text-[12px] font-sans"
                style={{ color: "var(--ink-3)" }}
              >
                · 리뷰 {noteCount}개
              </span>
            )}
            {streak > 0 && (
              <span
                className="ml-2 inline-flex items-center gap-1 text-[12px] font-sans px-2 py-0.5 rounded-full align-middle"
                style={{
                  background: "var(--warm-soft)",
                  color: "var(--warm)",
                }}
                title="연속 작성 일수"
              >
                ✦ {streak}일 연속
              </span>
            )}
          </p>
        </div>
        {statusLabel && (
          <span className="text-[11px]" style={{ color: statusColor }}>
            · {statusLabel}
          </span>
        )}
      </div>

      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ background: "var(--line)" }}
      >
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: pct === 100 ? "var(--green)" : "var(--warm)",
          }}
        />
      </div>

      <p
        className="text-[12px] mt-3 leading-relaxed"
        style={{ color: "var(--ink-3)" }}
      >
        매주 또는 행동 하나 완수할 때마다 체크박스를 누르고, 카드를 펼쳐 짧은 리뷰를 남기세요. 자동 저장됩니다.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Journal — 일일 체크인 + 14일 sparkline + 타임라인 + 부드러운 nudge
 * ──────────────────────────────────────────────────────────── */

function JournalSection({
  progress,
  onSave,
}: {
  progress: PlanProgress;
  onSave: (next: { body: string; mood?: number }) => Promise<void>;
}) {
  const journal = getJournal(progress);
  const todayISO = localDateKey();
  const existingToday = journal[todayISO];
  const lastGapDays = daysSinceLastEntry(journal); // null이면 한 번도 안 씀

  const [body, setBody] = useState(existingToday?.body ?? "");
  const [mood, setMood] = useState<number | undefined>(existingToday?.mood);
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // 다른 곳(예: action 노트 저장)으로 progress가 바뀌면 textarea 기준값도 맞춰준다.
  // 단, 사용자가 지금 타이핑 중이면 덮어쓰지 않도록 mount-time prefill만 신뢰.
  // → 별도 effect 없이 초기 state로 충분.

  const canSave = body.trim().length > 0 && !submitting;
  const handleClick = async () => {
    if (!canSave) return;
    setSubmitting(true);
    try {
      await onSave({ body: body.trim(), mood });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-10">
      {/* Nudge — 마지막 작성일이 2일 이상 지났을 때만 노출 */}
      {lastGapDays !== null && lastGapDays > 1 && (
        <div
          className="rounded-2xl p-4 mb-4 flex items-start gap-3"
          style={{
            background: "var(--warm-soft)",
            border: "1px solid var(--warm)",
          }}
        >
          <span
            className="font-serif text-[18px] leading-none"
            style={{ color: "var(--warm)" }}
            aria-hidden
          >
            ✦
          </span>
          <div>
            <p
              className="text-[13px] font-medium mb-0.5"
              style={{ color: "var(--ink)" }}
            >
              {lastGapDays}일째 잠잠하네요.
            </p>
            <p
              className="text-[12px] leading-relaxed"
              style={{ color: "var(--ink-2)" }}
            >
              한 줄이라도 좋아요 — 오늘 무엇을 했는지 남겨두면 연속 기록이 이어집니다.
            </p>
          </div>
        </div>
      )}

      {/* 작성 카드 */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "var(--bg-2)",
          border: "1px solid var(--line)",
        }}
      >
        <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
          <div>
            <p
              className="text-[11px] font-medium tracking-[0.08em] uppercase mb-1"
              style={{ color: "var(--ink-3)" }}
            >
              오늘의 체크인
            </p>
            <p
              className="font-serif text-[18px] tracking-[-0.01em]"
              style={{ color: "var(--ink)" }}
            >
              {existingToday ? "오늘의 기록을 다듬는 중" : "오늘 무엇을 했나요?"}
            </p>
          </div>
          <span className="text-[11px]" style={{ color: "var(--ink-3)" }}>
            {todayISO}
          </span>
        </div>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="한 줄이어도 좋아요. 무엇을 했고, 무엇을 안 했고, 어떤 기분이었는지."
          rows={4}
          className="w-full p-3 rounded-xl outline-none text-[14px] leading-relaxed resize-y"
          style={{
            background: "var(--bg)",
            border: "1px solid var(--line)",
            color: "var(--ink)",
            minHeight: 96,
          }}
        />

        <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
          <MoodPicker mood={mood} onChange={setMood} />
          <button
            type="button"
            onClick={handleClick}
            disabled={!canSave}
            className="px-4 py-1.5 rounded-full text-[12px] font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "var(--ink)", color: "var(--bg)" }}
          >
            {submitting ? "저장 중…" : existingToday ? "오늘 기록 업데이트" : "저장"}
          </button>
        </div>

        {/* 14일 sparkline */}
        <div className="mt-5 pt-4" style={{ borderTop: "1px dashed var(--line)" }}>
          <p
            className="text-[11px] font-medium tracking-[0.08em] uppercase mb-2"
            style={{ color: "var(--ink-3)" }}
          >
            지난 14일
          </p>
          <Sparkline journal={journal} todayISO={todayISO} />
        </div>
      </div>

      {/* 타임라인 — 첫 5개만 보이고, 더 있으면 펼치기 */}
      {Object.keys(journal).length > 0 && (
        <JournalTimeline journal={journal} showAll={showAll} onToggle={() => setShowAll((s) => !s)} />
      )}
    </div>
  );
}

function MoodPicker({
  mood,
  onChange,
}: {
  mood: number | undefined;
  onChange: (next: number | undefined) => void;
}) {
  const LABELS = ["😔", "😕", "😐", "🙂", "😄"];
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px]" style={{ color: "var(--ink-3)" }}>
        기분
      </span>
      {LABELS.map((label, i) => {
        const value = i + 1;
        const selected = mood === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(selected ? undefined : value)}
            aria-label={`mood ${value}`}
            className="w-7 h-7 rounded-full transition-transform text-[14px] leading-none flex items-center justify-center"
            style={{
              background: selected ? "var(--warm-soft)" : "transparent",
              border: selected ? "1px solid var(--warm)" : "1px solid var(--line)",
              transform: selected ? "scale(1.06)" : "scale(1)",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Sparkline({
  journal,
  todayISO,
}: {
  journal: Journal;
  todayISO: string;
}) {
  // 14일 슬롯, 가장 오래된 → 오늘 순. 각 날짜에 entry가 있으면 mood(없으면 1)를 막대 높이로.
  const today = new Date(`${todayISO}T00:00:00`);
  const slots: { date: string; value: number }[] = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = localDateKey(d);
    const entry = journal[key];
    slots.push({
      date: key,
      value: entry ? (entry.mood ?? 3) : 0,
    });
  }
  const max = 5;
  const barW = 10;
  const gap = 4;
  const h = 36;
  const width = slots.length * (barW + gap) - gap;
  return (
    <svg
      role="img"
      aria-label="지난 14일간의 일일 기록"
      width={width}
      height={h}
      viewBox={`0 0 ${width} ${h}`}
      style={{ display: "block" }}
    >
      {slots.map((s, i) => {
        const x = i * (barW + gap);
        const barH = s.value === 0 ? 2 : Math.max(2, Math.round((s.value / max) * h));
        const y = h - barH;
        const isToday = s.date === todayISO;
        const empty = s.value === 0;
        return (
          <rect
            key={s.date}
            x={x}
            y={y}
            width={barW}
            height={barH}
            rx={2}
            fill={empty ? "var(--line)" : "var(--warm)"}
            opacity={empty ? 0.6 : 1}
            stroke={isToday ? "var(--ink)" : "none"}
            strokeWidth={isToday ? 1 : 0}
          >
            <title>{`${s.date}${empty ? " · 기록 없음" : ` · mood ${s.value}`}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}

function JournalTimeline({
  journal,
  showAll,
  onToggle,
}: {
  journal: Journal;
  showAll: boolean;
  onToggle: () => void;
}) {
  // 최신순 정렬 (YYYY-MM-DD는 사전순 정렬 = 시간순 정렬과 일치)
  const dates = Object.keys(journal).sort().reverse();
  const visible = showAll ? dates : dates.slice(0, 5);

  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between mb-3">
        <p
          className="text-[11px] font-medium tracking-[0.08em] uppercase"
          style={{ color: "var(--ink-3)" }}
        >
          지난 기록
        </p>
        {dates.length > 5 && (
          <button
            type="button"
            onClick={onToggle}
            className="text-[12px] transition-opacity hover:opacity-70"
            style={{ color: "var(--ink-3)" }}
          >
            {showAll ? "접기" : `+${dates.length - 5}개 더 보기`}
          </button>
        )}
      </div>

      <ol className="flex flex-col gap-2">
        {visible.map((date) => {
          const entry = journal[date];
          return <JournalRow key={date} date={date} entry={entry} />;
        })}
      </ol>
    </div>
  );
}

function JournalRow({ date, entry }: { date: string; entry: JournalEntry }) {
  const MOOD_LABEL = ["", "😔", "😕", "😐", "🙂", "😄"];
  return (
    <li
      className="rounded-xl p-3 flex gap-3"
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--line)",
      }}
    >
      <div
        className="shrink-0 text-[11px] tabular-nums pt-0.5"
        style={{ color: "var(--ink-3)", minWidth: 84 }}
      >
        {date}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] leading-relaxed whitespace-pre-wrap"
          style={{ color: "var(--ink-2)" }}
        >
          {entry.body}
        </p>
      </div>
      {entry.mood && (
        <div
          className="shrink-0 text-[14px] leading-none pt-0.5"
          aria-label={`mood ${entry.mood}`}
          title={`mood ${entry.mood}`}
        >
          {MOOD_LABEL[entry.mood] ?? ""}
        </div>
      )}
    </li>
  );
}
