"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listBookmarks,
  removeBookmark,
  subscribeBookmarkChanges,
  type Bookmark,
  type BookmarkKind,
} from "@/lib/bookmarks";

const KIND_META: Record<
  BookmarkKind,
  { label: string; href: string; color: string; soft: string }
> = {
  market: {
    label: "시장 인사이트",
    href: "/market",
    color: "var(--warm)",
    soft: "var(--warm-soft)",
  },
  resource: {
    label: "리소스",
    href: "/resources",
    color: "var(--blue)",
    soft: "var(--blue-soft)",
  },
};

export default function BookmarksPage() {
  const [items, setItems] = useState<Bookmark[]>([]);
  const [filter, setFilter] = useState<BookmarkKind | "all">("all");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setItems(listBookmarks());
    sync();
    setHydrated(true);
    return subscribeBookmarkChanges(sync);
  }, []);

  const visible =
    filter === "all" ? items : items.filter((b) => b.kind === filter);

  const counts = {
    all: items.length,
    market: items.filter((b) => b.kind === "market").length,
    resource: items.filter((b) => b.kind === "resource").length,
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Hero */}
      <section className="max-w-[980px] mx-auto px-6 pt-14 pb-10">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] tracking-[0.04em] uppercase mb-6"
          style={{
            background: "var(--accent-2)",
            color: "var(--ink-3)",
            border: "1px solid var(--line)",
          }}
        >
          <span
            className="w-[6px] h-[6px] rounded-full"
            style={{ background: "var(--green)" }}
          />
          Saved · For Later
        </div>

        <h1
          className="font-serif text-4xl sm:text-5xl tracking-[-0.03em] leading-[1.1] mb-5"
          style={{ color: "var(--ink)" }}
        >
          내가 모아둔
          <br />
          <span style={{ color: "var(--green)" }}>다음 단계</span>의 재료들.
        </h1>

        <p
          className="text-[15px] leading-relaxed max-w-xl"
          style={{ color: "var(--ink-3)" }}
        >
          시장 인사이트와 리소스에서 북마크한 항목이 한곳에 모입니다. 90일
          플랜의 액션을 채울 때 다시 꺼내 쓰세요.
        </p>
      </section>

      <main className="max-w-[980px] mx-auto px-6 pb-24">
        {/* 필터 pills */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {(
            [
              { key: "all" as const, label: `전체 ${counts.all}` },
              { key: "market" as const, label: `시장 ${counts.market}` },
              { key: "resource" as const, label: `리소스 ${counts.resource}` },
            ]
          ).map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all"
                style={{
                  background: active ? "var(--ink)" : "transparent",
                  color: active ? "var(--bg)" : "var(--ink-3)",
                  border: active
                    ? "1px solid var(--ink)"
                    : "1px solid var(--line-2)",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* 빈 상태 (hydration 후에만 표시 — SSR/CSR 깜빡임 방지) */}
        {hydrated && visible.length === 0 && (
          <div className="text-center py-20">
            <p
              className="font-serif italic text-[22px] mb-3"
              style={{ color: "var(--ink-2)" }}
            >
              아직 저장한 항목이 없어요
            </p>
            <p className="text-[13px] mb-6" style={{ color: "var(--ink-3)" }}>
              시장 인사이트나 리소스에서 ⌘ 표시를 눌러 저장해보세요
            </p>
            <div className="flex items-center justify-center gap-2">
              <Link
                href="/market"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all hover:bg-[var(--accent-2)]"
                style={{
                  color: "var(--ink-2)",
                  border: "1px solid var(--line-2)",
                }}
              >
                시장 인사이트로 이동
              </Link>
              <Link
                href="/resources"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all hover:bg-[var(--accent-2)]"
                style={{
                  color: "var(--ink-2)",
                  border: "1px solid var(--line-2)",
                }}
              >
                리소스로 이동
              </Link>
            </div>
          </div>
        )}

        {/* 카드 그리드 */}
        {hydrated && visible.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((b) => {
              const k = KIND_META[b.kind];
              return (
                <article
                  key={`${b.kind}:${b.itemId}`}
                  className="rounded-2xl p-5 flex flex-col"
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--line)",
                    boxShadow: "var(--shadow)",
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: k.soft }}
                    >
                      {b.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className="inline-block text-[10px] px-2 py-0.5 rounded-full mb-1"
                        style={{ background: k.soft, color: k.color }}
                      >
                        {k.label} · {b.category}
                      </span>
                      <h3
                        className="text-[14px] font-semibold leading-snug"
                        style={{ color: "var(--ink)" }}
                      >
                        {b.title}
                      </h3>
                    </div>
                  </div>
                  <p
                    className="text-[12px] leading-relaxed mb-4 line-clamp-3 flex-1"
                    style={{ color: "var(--ink-3)" }}
                  >
                    {b.summary}
                  </p>
                  <div
                    className="flex items-center justify-between gap-2 pt-3"
                    style={{ borderTop: "1px solid var(--line)" }}
                  >
                    <span className="text-[11px]" style={{ color: "var(--ink-3)" }}>
                      {b.source} · {new Date(b.savedAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeBookmark(b.kind, b.itemId)}
                        className="text-[11px] underline-offset-4 hover:underline"
                        style={{ color: "var(--ink-3)" }}
                      >
                        제거
                      </button>
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-medium underline-offset-4 hover:underline"
                        style={{ color: k.color }}
                      >
                        열기 ↗
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
