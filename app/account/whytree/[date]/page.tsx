"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import WhyTreeView from "@/components/whytree/tree-view";
import { getUser, onAuthChange } from "@/lib/auth";
import { loadDailyDetail } from "@/lib/whytree/db";
import { newTree } from "@/lib/whytree/tree-ops";
import type { ChatMessage, WhyTree } from "@/lib/whytree/types";

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

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export default function WhyTreeDateDetailPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tree, setTree] = useState<WhyTree>(() => newTree(`${date} 트리`));
  const [messages, setMessages] = useState<ChatMessage[]>([]);

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
      const detail = await loadDailyDetail(u.id, date);
      if (!mounted) return;
      if (!detail) {
        setNotFound(true);
      } else {
        setTree(detail.tree);
        setMessages(detail.messages);
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
  }, [router, date]);

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
      <section className="max-w-[1100px] mx-auto px-6 pt-12 pb-16">
        <div className="mb-3">
          <Link
            href="/account/whytree"
            className="text-[12px] tracking-[0.04em] uppercase"
            style={{ color: "var(--ink-3)" }}
          >
            ← 일자별 기록
          </Link>
        </div>

        <div className="mb-8">
          <p
            className="text-[12px] font-medium tracking-[0.08em] uppercase mb-2"
            style={{ color: "var(--ink-3)" }}
          >
            {formatDateLabel(date)}
          </p>
          <h1
            className="font-serif text-4xl tracking-[-0.02em] mb-3"
            style={{ color: "var(--ink)" }}
          >
            그날의 트리
          </h1>
        </div>

        {notFound ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{
              background: "var(--bg-2)",
              border: "1px dashed var(--line-2)",
              color: "var(--ink-3)",
            }}
          >
            <p className="text-[13px]">이 날짜에는 트리가 없어요.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_minmax(320px,420px)]">
            {/* 좌: 대화 로그 */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--line)",
                boxShadow: "var(--shadow)",
              }}
            >
              <p
                className="text-[11px] font-medium tracking-[0.08em] uppercase mb-5"
                style={{ color: "var(--ink-3)" }}
              >
                그날의 대화
              </p>
              {messages.length === 0 ? (
                <p
                  className="text-[13px] text-center py-8"
                  style={{ color: "var(--ink-3)" }}
                >
                  대화 기록이 없는 트리예요.
                </p>
              ) : (
                <div className="space-y-3">
                  {messages.map((m, i) => (
                    <HistoryBubble key={i} message={m} />
                  ))}
                </div>
              )}
            </div>

            {/* 우: 트리 */}
            <div className="space-y-3">
              <WhyTreeView tree={tree} />
              {tree.lastExperimentId && tree.nodes[tree.lastExperimentId] && (
                <p
                  className="text-[11px] leading-relaxed"
                  style={{ color: "var(--ink-3)" }}
                >
                  이날의 실험 — 다음 세션에서 어떻게 됐는지 짚어보세요.
                </p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function HistoryBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[85%]">
        <p
          className="text-[10px] mb-1 px-2"
          style={{ color: "var(--ink-3)" }}
        >
          {isUser ? "나" : "상담자"} · {formatTime(message.ts)}
        </p>
        <div
          className="rounded-2xl px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap"
          style={{
            background: isUser ? "var(--accent)" : "var(--bg)",
            color: isUser ? "white" : "var(--ink)",
            border: isUser ? "none" : "1px solid var(--line)",
          }}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
