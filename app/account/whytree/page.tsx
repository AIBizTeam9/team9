"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import WhyTreeView from "@/components/whytree/tree-view";
import { getUser, onAuthChange } from "@/lib/auth";
import { loadMessagesDB, loadTreeDB } from "@/lib/whytree/db";
import { newTree } from "@/lib/whytree/tree-ops";
import type { ChatMessage, WhyTree } from "@/lib/whytree/types";

function formatDateTime(iso: string): string {
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

function sameDayKey(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD
}

export default function WhyTreeHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tree, setTree] = useState<WhyTree>(() => newTree());
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
      const [t, m] = await Promise.all([loadTreeDB(u.id), loadMessagesDB(u.id)]);
      if (!mounted) return;
      setTree(t);
      setMessages(m);
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

  // 메시지를 날짜별로 그룹화
  const groupedByDay = new Map<string, ChatMessage[]>();
  for (const m of messages) {
    const key = sameDayKey(m.ts);
    if (!groupedByDay.has(key)) groupedByDay.set(key, []);
    groupedByDay.get(key)!.push(m);
  }
  const dayKeys = [...groupedByDay.keys()];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <section className="max-w-[1100px] mx-auto px-6 pt-12 pb-16">
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
            Why Tree · 대화 기록
          </p>
          <h1
            className="font-serif text-4xl tracking-[-0.02em] mb-3"
            style={{ color: "var(--ink)" }}
          >
            지나간 대화들
          </h1>
          <p
            className="text-[14px] leading-relaxed max-w-[640px]"
            style={{ color: "var(--ink-3)" }}
          >
            {messages.length === 0
              ? "아직 기록이 없어요. 대화를 시작하면 여기에 쌓입니다."
              : `대화 ${messages.length}개 · 노드 ${
                  Object.keys(tree.nodes).length
                }개. 발견한 것들이 트리로 자라고 있어요.`}
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              href="/whytree"
              className="px-4 py-2 rounded-full text-[13px] font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              대화 이어가기
            </Link>
          </div>
        </div>

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
              대화 타임라인
            </p>

            {messages.length === 0 ? (
              <div
                className="rounded-xl p-5 text-center"
                style={{
                  background: "var(--bg)",
                  border: "1px dashed var(--line-2)",
                  color: "var(--ink-3)",
                }}
              >
                <p className="text-[13px]">아직 저장된 대화가 없어요.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {dayKeys.map((day) => (
                  <div key={day}>
                    <div
                      className="flex items-center gap-3 mb-3"
                      style={{ color: "var(--ink-3)" }}
                    >
                      <span
                        className="text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-full"
                        style={{ background: "var(--accent-2)" }}
                      >
                        {day}
                      </span>
                      <div
                        className="flex-1 h-px"
                        style={{ background: "var(--line)" }}
                      />
                    </div>
                    <div className="space-y-3">
                      {groupedByDay.get(day)!.map((m, i) => (
                        <HistoryBubble key={`${day}-${i}`} message={m} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 우: 현재 트리 */}
          <div className="space-y-3">
            <WhyTreeView tree={tree} />
            <p
              className="text-[11px] leading-relaxed"
              style={{ color: "var(--ink-3)" }}
            >
              현재 트리의 모습. 새 대화에서 어떤 가지가 자라거나 어떤 노드가
              실험으로 바뀌는지 여기서 확인하세요.
            </p>
          </div>
        </div>
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
          {isUser ? "나" : "상담자"} · {formatDateTime(message.ts)}
        </p>
        <div
          className="rounded-2xl px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap"
          style={{
            background: isUser ? "var(--accent)" : "var(--bg-2)",
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
