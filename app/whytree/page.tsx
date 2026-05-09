"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import WhyTreeView from "@/components/whytree/tree-view";
import { getUser, onAuthChange } from "@/lib/auth";
import {
  appendMessageDB,
  clearWhyTreeDB,
  loadMessagesDB,
  loadTreeDB,
  saveTreeDB,
} from "@/lib/whytree/db";
import {
  clearAll as clearLocal,
  loadMessages as loadLocalMessages,
  loadTree as loadLocalTree,
  saveMessages as saveLocalMessages,
  saveTree as saveLocalTree,
} from "@/lib/whytree/storage";
import { newTree } from "@/lib/whytree/tree-ops";
import type { ChatMessage, WhyTree } from "@/lib/whytree/types";

export default function WhyTreePage() {
  const [tree, setTree] = useState<WhyTree>(() => newTree());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 로그인 상태 + 데이터 hydrate
  useEffect(() => {
    let active = true;

    const init = async () => {
      const u = await getUser();
      if (!active) return;
      setUser(u);

      if (u) {
        // DB에서 로드 (실패하면 빈 트리)
        const [t, m] = await Promise.all([
          loadTreeDB(u.id),
          loadMessagesDB(u.id),
        ]);
        if (!active) return;
        setTree(t);
        setMessages(m);
      } else {
        // 비로그인: localStorage 폴백
        setTree(loadLocalTree());
        setMessages(loadLocalMessages());
      }
      setHydrated(true);
    };

    init();

    const { data } = onAuthChange((u) => {
      if (!active) return;
      const next = u as User | null;
      setUser(next);
      // 로그인/로그아웃 시 데이터 다시 로드
      if (next) {
        Promise.all([loadTreeDB(next.id), loadMessagesDB(next.id)]).then(
          ([t, m]) => {
            if (!active) return;
            setTree(t);
            setMessages(m);
          },
        );
      } else {
        setTree(loadLocalTree());
        setMessages(loadLocalMessages());
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  // 비로그인 사용자만 localStorage 동기화
  useEffect(() => {
    if (!hydrated || user) return;
    saveLocalTree(tree);
  }, [tree, hydrated, user]);

  useEffect(() => {
    if (!hydrated || user) return;
    saveLocalMessages(messages);
  }, [messages, hydrated, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamingText]);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

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

      // 로그인 사용자: 사용자 메시지를 즉시 DB에 저장
      if (user) {
        appendMessageDB(user.id, userMsg).catch(() => {
          // 저장 실패해도 진행 — 다음 페이지 로드 시 누락은 가능
        });
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

        // 로그인 사용자: 어시스턴트 메시지 + 최종 트리 저장
        if (user) {
          await Promise.all([
            assistantMsg ? appendMessageDB(user.id, assistantMsg) : null,
            finalTree ? saveTreeDB(user.id, finalTree) : null,
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
    [messages, streaming, tree, user],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const handleReset = useCallback(async () => {
    if (
      !confirm(
        user
          ? "정말 초기화할까요? 트리와 대화 기록이 영구 삭제됩니다."
          : "정말 초기화할까요? 트리와 대화가 모두 사라집니다.",
      )
    )
      return;

    if (user) {
      await clearWhyTreeDB(user.id);
    } else {
      clearLocal();
    }
    setTree(newTree());
    setMessages([]);
    setStreamingText("");
    setError(null);
  }, [user]);

  const handleStart = useCallback(() => {
    handleSend("안녕하세요. 시작할 준비가 됐어요.");
  }, [handleSend]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <section className="max-w-[1100px] mx-auto px-6 pt-12 pb-16">
        <div className="mb-8">
          <p
            className="text-[12px] font-medium tracking-[0.08em] uppercase mb-2"
            style={{ color: "var(--ink-3)" }}
          >
            Why Tree · web edition
          </p>
          <h1
            className="font-serif text-4xl tracking-[-0.02em] mb-3"
            style={{ color: "var(--ink)" }}
          >
            내 삶의 의미는 뭘까
          </h1>
          <p
            className="text-[14px] leading-relaxed max-w-[640px]"
            style={{ color: "var(--ink-3)" }}
          >
            답은 바깥에 있지 않아요 — 내 안에 있습니다. 솔직하게 답하다 보면
            트리가 자라고, 마지막엔 오늘 시도해볼 작은 실험 한 가지가 남습니다.
          </p>
          {user ? (
            <p className="text-[12px] mt-2" style={{ color: "var(--ink-3)" }}>
              로그인 상태 — 대화와 트리는{" "}
              <Link
                href="/account"
                className="underline"
                style={{ color: "var(--ink-2)" }}
              >
                내 정보
              </Link>
              에서 다시 볼 수 있어요.
            </p>
          ) : (
            <p className="text-[12px] mt-2" style={{ color: "var(--ink-3)" }}>
              비로그인 상태 — 이 브라우저에만 임시 저장됩니다.{" "}
              <Link
                href="/login"
                className="underline"
                style={{ color: "var(--ink-2)" }}
              >
                로그인
              </Link>
              하면 대화 기록을 다시 볼 수 있어요.
            </p>
          )}
        </div>

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
                세션 초기화
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
                    세션 시작
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
              트리 = 발견한 것들의 구조. 진짜 경험은 평소 말로 만들지 못했던 것을
              직접 말로 만드는 그 순간입니다. 트리는 그걸 잊지 않게 해주는 도구일
              뿐.
            </p>
          </div>
        </div>
      </section>
    </div>
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
