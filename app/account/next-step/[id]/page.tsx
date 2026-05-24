"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import PlanView from "@/components/nextstep/plan-view";
import { getUser, onAuthChange } from "@/lib/auth";
import {
  deletePlan,
  getPlan,
  progressStats,
  updatePlanProgress,
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

        {/* Progress 헤더 */}
        <ProgressHeader plan={plan} progress={progress} saveState={saveState} />

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
