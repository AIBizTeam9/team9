"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { getUser, onAuthChange } from "@/lib/auth";
import { listPlans, type PlanSummary } from "@/lib/nextstep/db";

function formatDate(iso: string): string {
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

function relative(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}

export default function NextStepPlansListPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PlanSummary[]>([]);

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
      const list = await listPlans(u.id);
      if (!mounted) return;
      setPlans(list);
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
  }, [router]);

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

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <section className="max-w-[860px] mx-auto px-6 pt-12 pb-16">
        <div className="mb-3">
          <Link
            href="/account"
            className="text-[12px] tracking-[0.04em] uppercase"
            style={{ color: "var(--ink-3)" }}
          >
            ← 내 정보
          </Link>
        </div>

        <div className="mb-8">
          <p
            className="text-[12px] font-medium tracking-[0.08em] uppercase mb-2"
            style={{ color: "var(--ink-3)" }}
          >
            Next Step · 저장된 90일 플랜
          </p>
          <h1
            className="font-serif text-4xl tracking-[-0.02em] mb-3"
            style={{ color: "var(--ink)" }}
          >
            지난 플랜들
          </h1>
          <p
            className="text-[14px] leading-relaxed max-w-[600px]"
            style={{ color: "var(--ink-3)" }}
          >
            퀴즈와 페르소나 선택을 거쳐 만들어진 플랜이 여기 모입니다. 카드를
            클릭하면 그 플랜을 다시 볼 수 있어요.
          </p>
          <div className="mt-4">
            <Link
              href="/next-step"
              className="inline-block px-4 py-2 rounded-full text-[13px] font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              새 플랜 만들기 →
            </Link>
          </div>
        </div>

        {plans.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{
              background: "var(--bg-2)",
              border: "1px dashed var(--line-2)",
              color: "var(--ink-3)",
            }}
          >
            <p className="text-[13px] mb-3">아직 저장된 플랜이 없어요.</p>
            <Link
              href="/next-step"
              className="text-[13px] font-semibold underline"
              style={{ color: "var(--ink-2)" }}
            >
              첫 플랜 시작하기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map((p) => (
              <Link
                key={p.id}
                href={`/account/next-step/${p.id}`}
                className="group block rounded-2xl p-5 transition-all hover:shadow-lg"
                style={{
                  background: "var(--bg-2)",
                  border: "1px solid var(--line)",
                  boxShadow: "var(--shadow)",
                }}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-serif text-[18px] tracking-[-0.01em] leading-snug"
                      style={{ color: "var(--ink)" }}
                    >
                      {p.headline}
                    </p>
                    <p
                      className="text-[11px] mt-1"
                      style={{ color: "var(--ink-3)" }}
                    >
                      {relative(p.created_at)} · {formatDate(p.created_at)}
                    </p>
                  </div>
                  <span
                    className="text-[12px] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "var(--ink-3)" }}
                  >
                    →
                  </span>
                </div>

                <p
                  className="text-[13px] leading-relaxed mt-2 line-clamp-2 font-serif italic"
                  style={{ color: "var(--ink-2)" }}
                >
                  &ldquo;{p.coreInsight}&rdquo;
                </p>

                {(p.personaNames.length > 0 || p.firstStep) && (
                  <dl
                    className="grid gap-1.5 mt-3 pt-3 text-[12px]"
                    style={{ borderTop: "1px solid var(--line)" }}
                  >
                    {p.personaNames.length > 0 && (
                      <div className="flex gap-3">
                        <dt
                          className="w-[64px] flex-shrink-0 text-[10px] uppercase tracking-[0.06em]"
                          style={{ color: "var(--ink-3)" }}
                        >
                          두 자아
                        </dt>
                        <dd
                          className="flex-1"
                          style={{ color: "var(--ink-2)" }}
                        >
                          {p.personaNames.join(" · ")}
                        </dd>
                      </div>
                    )}
                    {p.firstStep && (
                      <div className="flex gap-3">
                        <dt
                          className="w-[64px] flex-shrink-0 text-[10px] uppercase tracking-[0.06em]"
                          style={{ color: "var(--warm)" }}
                        >
                          첫 행동
                        </dt>
                        <dd
                          className="flex-1 line-clamp-2"
                          style={{ color: "var(--ink-2)" }}
                        >
                          {p.firstStep}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
