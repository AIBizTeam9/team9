"use client";

import { useEffect, useState } from "react";

type DeliveryWindow = "30d" | "90d" | "180d" | "365d";

const WINDOWS: { key: DeliveryWindow; label: string; days: number }[] = [
  { key: "30d", label: "30일 후", days: 30 },
  { key: "90d", label: "90일 후", days: 90 },
  { key: "180d", label: "6개월 후", days: 180 },
  { key: "365d", label: "1년 후", days: 365 },
];

type Letter = {
  id: string;
  title: string;
  content: string;
  deliveryWindow: DeliveryWindow;
  createdAt: string;
  deliverAt: string;
};

const STORAGE_KEY = "team9.letters.v1";

function loadLetters(): Letter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((l): l is Letter => {
      if (typeof l !== "object" || l === null) return false;
      const obj = l as Record<string, unknown>;
      return (
        typeof obj.id === "string" &&
        typeof obj.title === "string" &&
        typeof obj.content === "string" &&
        typeof obj.deliveryWindow === "string" &&
        typeof obj.createdAt === "string" &&
        typeof obj.deliverAt === "string"
      );
    });
  } catch {
    return [];
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function LetterPage() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [windowKey, setWindowKey] = useState<DeliveryWindow>("90d");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setLetters(loadLetters());
  }, []);

  const handleSubmit = async () => {
    if (!content.trim()) {
      setNotice("편지 내용을 적어주세요.");
      return;
    }
    setSubmitting(true);
    setNotice(null);

    const days = WINDOWS.find((w) => w.key === windowKey)?.days ?? 90;
    const now = new Date();
    const deliverAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const letter: Letter = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim() || "(제목 없음)",
      content: content.trim(),
      deliveryWindow: windowKey,
      createdAt: now.toISOString(),
      deliverAt: deliverAt.toISOString(),
    };

    try {
      // API stub — 실제 DB 저장 + 발송 스케줄링은 추후
      await fetch("/api/letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(letter),
      }).catch(() => {});
    } finally {
      const next = [letter, ...letters];
      setLetters(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage 실패는 무시
      }
      setTitle("");
      setContent("");
      setNotice(
        `편지가 보관됐어요. ${formatDate(deliverAt.toISOString())}에 미래의 본인이 받게 됩니다.`,
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="max-w-[980px] mx-auto px-4 sm:px-6 py-5">
          <h1
            className="font-serif text-2xl tracking-[-0.01em]"
            style={{ color: "var(--ink)" }}
          >
            미래의 나에게
          </h1>
          <p
            className="text-[13px] mt-0.5"
            style={{ color: "var(--ink-3)" }}
          >
            오늘의 내가 미래의 나에게 보내는 편지 — 90일 플랜 너머의 약속
          </p>
        </div>
      </header>

      <main className="max-w-[700px] mx-auto px-4 sm:px-6 py-12">
        {/* 작성 폼 */}
        <section
          className="rounded-2xl p-5 sm:p-6 mb-10"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--line)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div className="mb-5">
            <p
              className="text-[11px] uppercase tracking-[0.08em] mb-2.5"
              style={{ color: "var(--ink-3)" }}
            >
              언제 받을까요?
            </p>
            <div className="flex flex-wrap gap-2">
              {WINDOWS.map((w) => {
                const active = windowKey === w.key;
                return (
                  <button
                    key={w.key}
                    type="button"
                    onClick={() => setWindowKey(w.key)}
                    className="px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all"
                    style={{
                      background: active ? "var(--warm)" : "var(--bg)",
                      color: active ? "var(--bg-2)" : "var(--ink-2)",
                      border: `1px solid ${active ? "var(--warm)" : "var(--line-2)"}`,
                    }}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <label
              className="text-[11px] uppercase tracking-[0.08em] block mb-2"
              style={{ color: "var(--ink-3)" }}
            >
              제목 <span style={{ color: "var(--line-2)" }}>(선택)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 첫 90일을 끝낸 너에게"
              maxLength={80}
              className="w-full px-4 py-2.5 rounded-xl text-[14px] outline-none transition-colors"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--line-2)",
                color: "var(--ink)",
              }}
            />
          </div>

          <div className="mb-5">
            <label
              className="text-[11px] uppercase tracking-[0.08em] block mb-2"
              style={{ color: "var(--ink-3)" }}
            >
              본문
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="지금 이 순간의 너에게, 그리고 도착할 그날의 너에게 — 어떤 다짐을, 어떤 위로를, 어떤 질문을 남기고 싶나요?"
              rows={10}
              className="w-full px-4 py-3 rounded-xl text-[14px] leading-relaxed outline-none resize-y font-serif"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--line-2)",
                color: "var(--ink)",
                minHeight: 180,
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <p
              className="text-[12px]"
              style={{ color: "var(--ink-3)" }}
            >
              {notice ?? `${content.length}자 작성 중`}
            </p>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-medium text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--warm)" }}
            >
              {submitting ? "보관 중..." : "편지 보관하기"}
              <span className="text-[11px] opacity-70">→</span>
            </button>
          </div>
        </section>

        {/* 보관된 편지 리스트 */}
        <section>
          <p
            className="text-[11px] uppercase tracking-[0.08em] mb-3"
            style={{ color: "var(--ink-3)" }}
          >
            보관된 편지 · {letters.length}통
          </p>

          {letters.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{
                background: "var(--bg-2)",
                border: "1px dashed var(--line-2)",
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl"
                style={{ background: "var(--warm-soft)" }}
              >
                ✉️
              </div>
              <p
                className="text-[13px] mb-1"
                style={{ color: "var(--ink-2)" }}
              >
                아직 보관된 편지가 없어요
              </p>
              <p
                className="text-[12px]"
                style={{ color: "var(--ink-3)" }}
              >
                위에서 첫 편지를 써보세요.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {letters.map((l) => {
                const windowMeta = WINDOWS.find((w) => w.key === l.deliveryWindow);
                return (
                  <li
                    key={l.id}
                    className="rounded-2xl p-5"
                    style={{
                      background: "var(--bg-2)",
                      border: "1px solid var(--line)",
                      boxShadow: "var(--shadow)",
                    }}
                  >
                    <div className="flex items-baseline justify-between gap-3 mb-2">
                      <h3
                        className="font-serif text-[18px] tracking-[-0.01em] truncate"
                        style={{ color: "var(--ink)" }}
                      >
                        {l.title}
                      </h3>
                      <span
                        className="text-[11px] px-2.5 py-1 rounded-full flex-shrink-0"
                        style={{
                          background: "var(--warm-soft)",
                          color: "var(--warm)",
                        }}
                      >
                        {windowMeta?.label ?? l.deliveryWindow}
                      </span>
                    </div>
                    <p
                      className="text-[13px] leading-relaxed line-clamp-3 mb-3"
                      style={{ color: "var(--ink-2)" }}
                    >
                      {l.content}
                    </p>
                    <div
                      className="flex items-center justify-between text-[11px]"
                      style={{ color: "var(--ink-3)" }}
                    >
                      <span>
                        쓴 날 · {formatDate(l.createdAt)}
                      </span>
                      <span style={{ color: "var(--warm)" }}>
                        받을 날 · {formatDate(l.deliverAt)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p
          className="text-[11px] mt-10 text-center"
          style={{ color: "var(--ink-3)" }}
        >
          현재는 편지가 본인 브라우저에만 보관됩니다. 실제 발송 (이메일/알림)
          연동은 추후.
        </p>
      </main>
    </div>
  );
}
