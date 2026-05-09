"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { getUser, onAuthChange } from "@/lib/auth";
import { listDailySummaries, type DailySummary } from "@/lib/whytree/db";

function formatDateLabel(date: string): string {
  const [y, m, d] = date.split("-").map((s) => parseInt(s, 10));
  if (!y || !m || !d) return date;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function relativeFromUpdated(iso: string): string {
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

export default function WhyTreeHistoryListPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);

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
      const list = await listDailySummaries(u.id);
      if (!mounted) return;
      setSummaries(list);
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
            Why Tree · 일자별 기록
          </p>
          <h1
            className="font-serif text-4xl tracking-[-0.02em] mb-3"
            style={{ color: "var(--ink)" }}
          >
            지나간 트리들
          </h1>
          <p
            className="text-[14px] leading-relaxed max-w-[600px]"
            style={{ color: "var(--ink-3)" }}
          >
            매일의 트리는 그날의 발견을 담고 있어요. 카드를 클릭하면 그날의
            대화와 트리를 다시 볼 수 있습니다.
          </p>
          <div className="mt-4">
            <Link
              href="/whytree"
              className="px-4 py-2 rounded-full text-[13px] font-semibold text-white transition-all hover:opacity-90 inline-block"
              style={{ background: "var(--accent)" }}
            >
              오늘의 트리로 가기 →
            </Link>
          </div>
        </div>

        {summaries.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{
              background: "var(--bg-2)",
              border: "1px dashed var(--line-2)",
              color: "var(--ink-3)",
            }}
          >
            <p className="text-[13px] mb-3">
              아직 기록된 트리가 없어요.
            </p>
            <Link
              href="/whytree"
              className="text-[13px] font-semibold underline"
              style={{ color: "var(--ink-2)" }}
            >
              첫 트리 시작하기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {summaries.map((s) => (
              <Link
                key={s.id}
                href={`/account/whytree/${s.date}`}
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
                      className="font-serif text-[18px] tracking-[-0.01em]"
                      style={{ color: "var(--ink)" }}
                    >
                      {formatDateLabel(s.date)}
                    </p>
                    <p
                      className="text-[11px] mt-0.5"
                      style={{ color: "var(--ink-3)" }}
                    >
                      마지막 갱신 {relativeFromUpdated(s.updatedAt)} · 노드{" "}
                      {s.nodeCount}개 · 대화 {s.messageCount}개
                    </p>
                  </div>
                  <span
                    className="text-[12px] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "var(--ink-3)" }}
                  >
                    →
                  </span>
                </div>

                {(s.purpose || s.experimentLabel) && (
                  <dl
                    className="grid gap-1.5 mt-3 pt-3 text-[12px]"
                    style={{ borderTop: "1px solid var(--line)" }}
                  >
                    {s.purpose && (
                      <div className="flex gap-3">
                        <dt
                          className="w-[48px] flex-shrink-0 text-[10px] uppercase tracking-[0.06em]"
                          style={{ color: "var(--ink-3)" }}
                        >
                          목적
                        </dt>
                        <dd
                          className="flex-1 font-serif"
                          style={{ color: "var(--ink)" }}
                        >
                          {s.purpose}
                        </dd>
                      </div>
                    )}
                    {s.experimentLabel && (
                      <div className="flex gap-3">
                        <dt
                          className="w-[48px] flex-shrink-0 text-[10px] uppercase tracking-[0.06em]"
                          style={{ color: "var(--green)" }}
                        >
                          실험
                        </dt>
                        <dd
                          className="flex-1"
                          style={{ color: "var(--ink-2)" }}
                        >
                          {s.experimentLabel}
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
