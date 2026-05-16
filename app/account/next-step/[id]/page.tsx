"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import PlanView from "@/components/nextstep/plan-view";
import { getUser, onAuthChange } from "@/lib/auth";
import { deletePlan, getPlan, type SavedPlan } from "@/lib/nextstep/db";

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
  const [deleting, setDeleting] = useState(false);

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
      else setPlan(detail);
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

        <PlanView plan={plan.plan} />

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
