"use client";

import { useState, useRef, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// ── 타입 ──
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type Phase = "exploring" | "analyzing" | "recommending";

const PHASE_LABELS: Record<Phase, { label: string; color: string; icon: string; desc: string }> = {
  exploring:    { label: "탐색 중", color: "bg-blue-100 text-blue-700 border-blue-200", icon: "🔍", desc: "관심사와 강점을 파악하고 있어요" },
  analyzing:    { label: "분석 중", color: "bg-purple-100 text-purple-700 border-purple-200", icon: "🧠", desc: "적합한 커리어 방향을 분석하고 있어요" },
  recommending: { label: "추천 완료", color: "bg-green-100 text-green-700 border-green-200", icon: "🎯", desc: "맞춤 커리어와 채용 정보를 추천해요" },
};

// ── 마크다운 간이 렌더 ──
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listKey = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-1 my-2 text-sm leading-relaxed">
          {listItems.map((li, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(li) }} />
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const inlineFormat = (s: string) => {
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">$1</a>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');
    return s;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h3 key={`h-${i}`} className="text-base font-bold mt-4 mb-2 text-foreground">
          {line.replace("## ", "")}
        </h3>
      );
    } else if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h4 key={`h4-${i}`} className="text-sm font-bold mt-3 mb-1 text-foreground">
          {line.replace("### ", "")}
        </h4>
      );
    } else if (line.match(/^[-*] /)) {
      listItems.push(line.replace(/^[-*] /, ""));
    } else if (line.match(/^\d+\. /)) {
      flushList();
      elements.push(
        <p key={`ol-${i}`} className="text-sm leading-relaxed my-1"
           dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
      );
    } else if (line.trim() === "") {
      flushList();
      elements.push(<div key={`br-${i}`} className="h-2" />);
    } else {
      flushList();
      elements.push(
        <p key={`p-${i}`} className="text-sm leading-relaxed my-1"
           dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
      );
    }
  }
  flushList();
  return elements;
}

// ── 추천 대화 시작 프롬프트 ──
const STARTER_PROMPTS = [
  "현재 취업을 준비하고 있는 대학생이에요",
  "이직을 고려하고 있는데 방향을 못 정했어요",
  "IT 분야에 관심이 있는데 어떤 직무가 맞을지 모르겠어요",
  "내 강점을 살릴 수 있는 커리어를 찾고 싶어요",
];

export default function CareerPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>("exploring");
  const [started, setStarted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const sendMessage = async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading) return;

    if (!started) setStarted(true);
    setInput("");

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`${API_BASE}/api/career/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `Error ${res.status}`);
      }

      const data = await res.json();

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages([...newMessages, assistantMsg]);
      setPhase(data.phase);
    } catch (e) {
      const errMsg: Message = {
        id: `e-${Date.now()}`,
        role: "assistant",
        content: `오류가 발생했습니다: ${(e as Error).message}`,
        timestamp: new Date(),
      };
      setMessages([...newMessages, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([]);
    setPhase("exploring");
    setStarted(false);
    setInput("");
  };

  const phaseInfo = PHASE_LABELS[phase];
  const userMsgCount = messages.filter(m => m.role === "user").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex flex-col">
      {/* ── 헤더 ── */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              AI Career Explorer
              <span className="text-xs font-normal bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 py-0.5 rounded-full">
                Beta
              </span>
            </h1>
            <p className="text-xs text-muted">
              대화를 통해 나에게 맞는 커리어를 탐색하세요
            </p>
          </div>

          <div className="flex items-center gap-2">
            {started && (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${phaseInfo.color}`}>
                <span>{phaseInfo.icon}</span>
                <span>{phaseInfo.label}</span>
              </div>
            )}

            {started && (
              <button
                onClick={resetChat}
                className="text-xs text-muted hover:text-foreground px-3 py-1.5 rounded-lg border border-border hover:bg-gray-50 transition-colors"
              >
                새 대화
              </button>
            )}
          </div>
        </div>

        {started && (
          <div className="max-w-3xl mx-auto px-4 pb-2">
            <div className="flex items-center gap-2">
              {(["exploring", "analyzing", "recommending"] as Phase[]).map((p, idx) => (
                <div key={p} className="flex items-center gap-2 flex-1">
                  <div className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${
                    p === phase ? "bg-primary" :
                    (["exploring", "analyzing", "recommending"].indexOf(phase) > idx) ? "bg-primary/60" :
                    "bg-gray-200"
                  }`} />
                  {idx < 2 && <div className="w-1" />}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted mt-1">{phaseInfo.desc}</p>
          </div>
        )}
      </header>

      {/* ── 대화 영역 ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {!started && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                <span className="text-4xl">🧭</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                나에게 맞는 커리어를 찾아보세요
              </h2>
              <p className="text-muted text-sm max-w-md mb-8 leading-relaxed">
                AI 커리어 코치와 대화하면서 관심사, 강점, 가치관을 탐색하고<br />
                맞춤형 커리어 방향과 실제 채용 정보를 추천받으세요.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {STARTER_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="text-left px-4 py-3 rounded-xl border border-border bg-white hover:bg-blue-50/50 hover:border-blue-200 transition-all text-sm text-foreground shadow-sm hover:shadow-md group"
                  >
                    <span className="text-muted group-hover:text-primary mr-2">
                      {["💬", "🔄", "💻", "💪"][i]}
                    </span>
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg">
                {[
                  { icon: "🔍", title: "관심사 탐색", desc: "대화를 통해 숨겨진 흥미와 강점 발견" },
                  { icon: "🧠", title: "AI 분석", desc: "관심사×강점 교차 분석으로 커리어 매칭" },
                  { icon: "🎯", title: "실행 연결", desc: "맞춤 채용공고 링크와 준비 가이드 제공" },
                ].map((f, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <div className="text-xs font-semibold text-foreground mb-1">{f.title}</div>
                    <div className="text-[11px] text-muted leading-tight">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex mb-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-3 mt-1 shrink-0 shadow-sm">
                  <span className="text-white text-sm">AI</span>
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-white border border-border/50 shadow-sm rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose-sm">{renderMarkdown(msg.content)}</div>
                ) : (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                )}
                <div className={`text-[10px] mt-2 ${msg.role === "user" ? "text-white/60" : "text-muted/60"}`}>
                  {msg.timestamp.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center ml-3 mt-1 shrink-0">
                  <span className="text-sm">👤</span>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex mb-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-3 mt-1 shrink-0 shadow-sm">
                <span className="text-white text-sm">AI</span>
              </div>
              <div className="bg-white border border-border/50 shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs text-muted">
                    {userMsgCount <= 2 ? "당신을 알아가는 중..." : userMsgCount <= 4 ? "분석 중..." : "추천 준비 중..."}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </main>

      {/* ── 입력 영역 ── */}
      <footer className="sticky bottom-0 bg-white/80 backdrop-blur-sm border-t border-border/50">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  !started
                    ? "자유롭게 대화를 시작해보세요..."
                    : phase === "exploring"
                    ? "관심사, 경험, 강점 등을 자유롭게 이야기해보세요..."
                    : phase === "analyzing"
                    ? "더 궁금한 점이나 추가 정보를 알려주세요..."
                    : "추천된 직무에 대해 더 알고 싶은 점을 물어보세요..."
                }
                className="w-full resize-none rounded-xl border border-border bg-white px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                rows={1}
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="absolute right-2 bottom-2 w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-muted">
              Shift+Enter로 줄바꿈 | AI 응답은 참고용이며, 최종 결정은 본인이 하세요
            </p>
            {started && (
              <p className="text-[10px] text-muted">
                대화 {messages.length}건 | {phaseInfo.icon} {phaseInfo.label}
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
