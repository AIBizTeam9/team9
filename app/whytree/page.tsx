"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import WhyTreeView from "@/components/whytree/tree-view";
import { getUser, onAuthChange, signInWithGoogle } from "@/lib/auth";
import {
  appendMessageDB,
  deleteTreeForDate,
  ensureTreeForDate,
  loadTodayBundle,
  saveTreeForDate,
  todayDateString,
} from "@/lib/whytree/db";
import { newTree } from "@/lib/whytree/tree-ops";
import type { ChatMessage, WhyTree } from "@/lib/whytree/types";

export default function WhyTreePage() {
  const [date] = useState<string>(() => todayDateString());
  const [tree, setTree] = useState<WhyTree>(() => newTree(`${date} 트리`));
  const [treeId, setTreeId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let active = true;

    const init = async () => {
      const u = await getUser();
      if (!active) return;
      setUser(u);

      if (u) {
        try {
          const bundle = await loadTodayBundle(u.id);
          if (!active) return;
          setTree(bundle.tree);
          setTreeId(bundle.treeId);
          setMessages(bundle.messages);
        } catch (e) {
          console.error("DB load failed", e);
        }
      }
      // 비로그인 사용자는 데이터를 로드하지 않음 — 로그인 게이트가 보이고 채팅 자체가 비활성.
      setHydrated(true);
    };
    init();

    const { data } = onAuthChange((u) => {
      if (!active) return;
      const next = u as User | null;
      setUser(next);
      if (next) {
        loadTodayBundle(next.id).then((bundle) => {
          if (!active) return;
          setTree(bundle.tree);
          setTreeId(bundle.treeId);
          setMessages(bundle.messages);
        });
      } else {
        setTree(newTree(`${date} 트리`));
        setTreeId(null);
        setMessages([]);
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [date]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamingText]);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      // 비로그인 가드 — UI에서도 게이트로 막혀 있지만 안전장치.
      if (!user) return;

      setError(null);
      const userMsg: ChatMessage = {
        role: "user",
        content: trimmed,
        ts: new Date().toISOString(),
      };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput("");
      setStreaming(true);
      setStreamingText("");

      // 로그인 사용자: 오늘 트리 row가 없으면 생성 후 사용자 메시지 즉시 저장.
      let activeTreeId = treeId;
      if (user) {
        try {
          if (!activeTreeId) {
            const rec = await ensureTreeForDate(user.id, date);
            activeTreeId = rec.id;
            setTreeId(rec.id);
          }
          appendMessageDB(user.id, activeTreeId, userMsg).catch(() => {});
        } catch (e) {
          console.error("ensureTree failed", e);
        }
      }

      try {
        const res = await fetch("/api/whytree", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages, tree }),
        });
        if (!res.ok || !res.body) {
          const errBody = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(errBody.error ?? `요청 실패 (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let lineBuf = "";
        let assistantText = "";
        let finalTree: WhyTree | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          lineBuf += decoder.decode(value, { stream: true });
          const lines = lineBuf.split("\n");
          lineBuf = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const evt = JSON.parse(payload) as {
                type: string;
                delta?: string;
                tree?: WhyTree;
                message?: string;
              };
              if (evt.type === "text" && evt.delta) {
                assistantText += evt.delta;
                setStreamingText(assistantText);
              } else if (evt.type === "tree" && evt.tree) {
                finalTree = evt.tree;
                setTree(evt.tree);
              } else if (evt.type === "error" && evt.message) {
                throw new Error(evt.message);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }

        const assistantMsg: ChatMessage | null = assistantText.trim()
          ? {
              role: "assistant",
              content: assistantText.trim(),
              ts: new Date().toISOString(),
            }
          : null;
        if (assistantMsg) {
          setMessages((prev) => [...prev, assistantMsg]);
        }
        setStreamingText("");

        if (user && activeTreeId) {
          await Promise.all([
            assistantMsg
              ? appendMessageDB(user.id, activeTreeId, assistantMsg)
              : null,
            finalTree ? saveTreeForDate(user.id, date, finalTree) : null,
          ]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "응답을 가져오지 못했습니다.",
        );
        setStreamingText("");
      } finally {
        setStreaming(false);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    },
    [messages, streaming, tree, user, date, treeId],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const handleReset = useCallback(async () => {
    if (!user) return;
    if (
      !confirm(
        "오늘의 트리와 대화 기록을 지웁니다. 다른 날짜의 트리는 그대로 남아요.",
      )
    )
      return;
    await deleteTreeForDate(user.id, date);
    setTree(newTree(`${date} 트리`));
    setTreeId(null);
    setMessages([]);
    setStreamingText("");
    setError(null);
  }, [user, date]);

  const handleStart = useCallback(() => {
    handleSend("안녕하세요. 시작할 준비가 됐어요.");
  }, [handleSend]);

  const dateLabel = formatDateLabel(date);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <section className="max-w-[1100px] mx-auto px-6 pt-12 pb-16">
        <div className="mb-6">
          <p
            className="text-[12px] font-medium tracking-[0.08em] uppercase mb-2"
            style={{ color: "var(--ink-3)" }}
          >
            Why Tree · {dateLabel}
          </p>
          <h1
            className="font-serif text-4xl tracking-[-0.02em] mb-3"
            style={{ color: "var(--ink)" }}
          >
            오늘의 트리
          </h1>
          <p
            className="text-[14px] leading-relaxed max-w-[640px]"
            style={{ color: "var(--ink-3)" }}
          >
            매일 새 트리가 자랍니다. 솔직하게 답하다 보면 오늘 시도해볼 작은
            실험 한 가지가 남습니다.
          </p>
        </div>

        {/* 비로그인 — 게이트만 보여주고 채팅 영역은 렌더하지 않음 */}
        {hydrated && !user && <LoginGate />}

        {/* 로그인 사용자 — 지난 기록 빠른 링크 */}
        {hydrated && user && (
          <div
            className="mb-6 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
            style={{
              background: "var(--accent-2)",
              border: "1px solid var(--line)",
            }}
          >
            <p className="text-[12px]" style={{ color: "var(--ink-2)" }}>
              어제 트리가 궁금해요?
            </p>
            <Link
              href="/account/whytree"
              className="text-[12px] font-medium px-3 py-1 rounded-full"
              style={{
                background: "var(--bg-2)",
                color: "var(--ink-2)",
                border: "1px solid var(--line)",
              }}
            >
              지난 기록 보기 →
            </Link>
          </div>
        )}

        {hydrated && user && (
        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(320px,420px)]">
          <div
            className="rounded-2xl p-6 flex flex-col"
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--line)",
              boxShadow: "var(--shadow)",
              minHeight: "60vh",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <p
                className="text-[11px] font-medium tracking-[0.08em] uppercase"
                style={{ color: "var(--ink-3)" }}
              >
                상담자와의 대화
              </p>
              <button
                onClick={handleReset}
                className="text-[11px] px-2 py-1 rounded-full hover:bg-[var(--accent-2)] transition-colors"
                style={{ color: "var(--ink-3)" }}
                disabled={streaming}
              >
                오늘 트리 초기화
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4">
              {messages.length === 0 && !streaming && (
                <div
                  className="rounded-xl p-5 text-center"
                  style={{
                    background: "var(--bg)",
                    border: "1px dashed var(--line-2)",
                  }}
                >
                  <p
                    className="text-[13px] mb-3 leading-relaxed"
                    style={{ color: "var(--ink-2)" }}
                  >
                    상담자가 첫 질문을 던져 줄 거예요.
                    <br />
                    준비됐을 때 시작 버튼을 누르세요.
                  </p>
                  <button
                    onClick={handleStart}
                    className="px-4 py-2 rounded-full text-[13px] font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: "var(--accent)" }}
                  >
                    오늘 세션 시작
                  </button>
                </div>
              )}

              {messages.map((m, i) => (
                <ChatBubble key={i} role={m.role} text={m.content} />
              ))}

              {streamingText && (
                <ChatBubble role="assistant" text={streamingText} streaming />
              )}

              {streaming && !streamingText && (
                <div
                  className="text-[12px] italic"
                  style={{ color: "var(--ink-3)" }}
                >
                  ··· 듣고 있어요
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            <div className="space-y-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                disabled={streaming}
                placeholder="솔직하게 답해 보세요. (Enter로 보내기, Shift+Enter 줄바꿈)"
                className="w-full px-4 py-3 rounded-xl text-[14px] leading-relaxed resize-none disabled:opacity-50"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--line)",
                  color: "var(--ink)",
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>
                  Claude Sonnet 4.6 · 도구 사용으로 트리를 갱신합니다.
                </p>
                <button
                  onClick={() => handleSend(input)}
                  disabled={streaming || !input.trim()}
                  className="px-4 py-2 rounded-full text-[13px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: "var(--accent)" }}
                >
                  보내기
                </button>
              </div>
              {error && (
                <p className="text-[12px]" style={{ color: "var(--warm)" }}>
                  {error}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <WhyTreeView tree={tree} />
            <p
              className="text-[11px] leading-relaxed"
              style={{ color: "var(--ink-3)" }}
            >
              매일의 트리는 그날의 기록입니다. 어제의 트리가 궁금하면{" "}
              <Link
                href="/account/whytree"
                className="underline"
                style={{ color: "var(--ink-2)" }}
              >
                지난 기록
              </Link>
              으로.
            </p>
          </div>
        </div>
        )}
      </section>
    </div>
  );
}

function LoginGate() {
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onGoogle = async () => {
    setPending(true);
    setErr(null);
    try {
      await signInWithGoogle();
      // 리다이렉트되므로 setPending(false) 도달 안 함
    } catch (e) {
      setPending(false);
      setErr(
        e instanceof Error ? e.message : "구글 로그인 시작에 실패했어요.",
      );
    }
  };

  return (
    <div
      className="rounded-2xl p-7 sm:p-8 max-w-[680px]"
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow)",
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🌱</span>
        <p
          className="font-serif text-[20px] tracking-[-0.01em]"
          style={{ color: "var(--ink)" }}
        >
          오늘 트리를 시작하려면 로그인 한 번만요
        </p>
      </div>

      <p
        className="text-[13px] leading-relaxed mb-5"
        style={{ color: "var(--ink-2)" }}
      >
        구글 계정 한 번 누르면 끝이에요. 비밀번호 만들 필요 없고, 추가 정보
        입력도 없습니다.
      </p>

      <ul className="space-y-2.5 mb-6">
        <ReassureRow
          icon="🔒"
          title="내가 쓴 답은 나만 봐요"
          desc="다른 사람·팀원·운영자 누구도 못 봅니다. DB에서도 본인 행만 열람되도록 잠겨 있어요."
        />
        <ReassureRow
          icon="📅"
          title="다음에 와도 이어서 할 수 있어요"
          desc="매일의 대화가 자동으로 정리돼서, 어제 트리를 보거나 오늘 트리에 한 줄 더 적기 좋아요."
        />
        <ReassureRow
          icon="🗑️"
          title="언제든 한 번에 지울 수 있어요"
          desc="오늘 트리는 '오늘 초기화' 버튼으로, 모두 지우려면 로그아웃 후 계정 삭제로 한 번에."
        />
      </ul>

      <button
        onClick={onGoogle}
        disabled={pending}
        className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-full text-[14px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
        style={{ background: "var(--ink)" }}
      >
        <GoogleG />
        {pending ? "구글로 이동 중…" : "구글 계정으로 시작"}
      </button>

      <p
        className="text-[11px] mt-3"
        style={{ color: "var(--ink-3)" }}
      >
        한 번 클릭으로 시작 · 추가 정보 입력 없음 · 비공개
      </p>

      {err && (
        <p className="text-[12px] mt-3" style={{ color: "var(--warm)" }}>
          {err}
        </p>
      )}
    </div>
  );
}

function ReassureRow({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="text-[16px] flex-shrink-0 leading-relaxed">{icon}</span>
      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-semibold leading-snug"
          style={{ color: "var(--ink)" }}
        >
          {title}
        </p>
        <p
          className="text-[12px] leading-relaxed mt-0.5"
          style={{ color: "var(--ink-3)" }}
        >
          {desc}
        </p>
      </div>
    </li>
  );
}

function GoogleG() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fill="#EA4335"
        d="M9 3.48c1.69 0 2.85.73 3.5 1.34l2.55-2.49C13.46 1 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.96 2.3C4.65 5.07 6.66 3.48 9 3.48z"
      />
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.74-.07-1.44-.18-2.13H9v4.02h4.84c-.21 1.13-.84 2.09-1.78 2.74v2.27h2.88c1.69-1.55 2.7-3.84 2.7-6.9z"
      />
      <path
        fill="#FBBC05"
        d="M3.92 10.74c-.18-.55-.28-1.13-.28-1.74s.1-1.19.27-1.74V4.96H.96A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.96-2.3z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.88-2.27c-.8.54-1.83.86-3.08.86-2.34 0-4.35-1.59-5.07-3.78L.96 13.04C2.44 15.98 5.48 18 9 18z"
      />
    </svg>
  );
}

function ChatBubble({
  role,
  text,
  streaming,
}: {
  role: "user" | "assistant";
  text: string;
  streaming?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap"
        style={{
          background: isUser ? "var(--accent)" : "var(--bg)",
          color: isUser ? "white" : "var(--ink)",
          border: isUser ? "none" : "1px solid var(--line)",
        }}
      >
        {text}
        {streaming && (
          <span
            className="inline-block w-1.5 h-3 ml-0.5 align-middle animate-pulse"
            style={{ background: "currentColor", opacity: 0.5 }}
          />
        )}
      </div>
    </div>
  );
}

function formatDateLabel(date: string): string {
  // YYYY-MM-DD → "2026년 5월 10일 (토)"
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
