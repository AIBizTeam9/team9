"use client";

import { useState } from "react";

interface RoleModelResponse {
  roleModel: string;
  profession: string;
  situation: string;
  choice: string;
  reasoning: string;
  lessons: string[];
}

export default function RoleModelPage() {
  const [situation, setSituation] = useState("");
  const [goals, setGoals] = useState("");
  const [decision, setDecision] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RoleModelResponse | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/rolemodel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          situation: situation.trim(),
          goals: goals.trim(),
          decision: decision.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "요청 처리 중 오류가 발생했습니다.");
      }

      const data = (await response.json()) as RoleModelResponse;
      setResult(data);
      setSituation("");
      setGoals("");
      setDecision("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="max-w-[980px] mx-auto px-6 py-5">
          <h1 className="font-serif text-2xl tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
            나의 롤모델 찾기
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--ink-3)" }}>
            당신의 상황과 결정에 대한 지혜로운 선례를 찾아드립니다
          </p>
        </div>
      </header>

      <main className="max-w-[700px] mx-auto px-6 py-12">
        {!result ? (
          <>
            {/* Form Section */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 현재 생활 상황 */}
              <div
                className="rounded-2xl p-6"
                style={{
                  background: "var(--bg-2)",
                  border: "1px solid var(--line)",
                  boxShadow: "var(--shadow)",
                }}
              >
                <label
                  htmlFor="situation"
                  className="block text-[14px] font-medium mb-2"
                  style={{ color: "var(--ink)" }}
                >
                  📍 당신의 현재 생활 상황은?
                </label>
                <p className="text-[12px] mb-3" style={{ color: "var(--ink-3)" }}>
                  직업, 나이대, 주변 환경, 현재의 어려움 등을 구체적으로 설명해주세요.
                </p>
                <textarea
                  id="situation"
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  placeholder="예: 30대 초반 대기업 직원이지만 창의적인 일을 하고 싶고, 안정성과 꿈 사이에서 갈등 중입니다..."
                  className="w-full rounded-lg p-3 text-[14px] border"
                  style={{
                    background: "var(--bg)",
                    borderColor: "var(--line)",
                    color: "var(--ink)",
                  }}
                  rows={4}
                />
              </div>

              {/* 목표 및 꿈 */}
              <div
                className="rounded-2xl p-6"
                style={{
                  background: "var(--bg-2)",
                  border: "1px solid var(--line)",
                  boxShadow: "var(--shadow)",
                }}
              >
                <label
                  htmlFor="goals"
                  className="block text-[14px] font-medium mb-2"
                  style={{ color: "var(--ink)" }}
                >
                  🎯 당신의 목표와 꿈은?
                </label>
                <p className="text-[12px] mb-3" style={{ color: "var(--ink-3)" }}>
                  5년 후, 10년 후 자신의 모습은 어떻게 되고 싶으신가요?
                </p>
                <textarea
                  id="goals"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="예: 나만의 창의적인 작업으로 가치를 만들고, 자유로운 삶을 살고 싶습니다..."
                  className="w-full rounded-lg p-3 text-[14px] border"
                  style={{
                    background: "var(--bg)",
                    borderColor: "var(--line)",
                    color: "var(--ink)",
                  }}
                  rows={4}
                />
              </div>

              {/* 직면한 주요 결정 */}
              <div
                className="rounded-2xl p-6"
                style={{
                  background: "var(--bg-2)",
                  border: "1px solid var(--line)",
                  boxShadow: "var(--shadow)",
                }}
              >
                <label
                  htmlFor="decision"
                  className="block text-[14px] font-medium mb-2"
                  style={{ color: "var(--ink)" }}
                >
                  🤔 지금 직면한 주요 결정은?
                </label>
                <p className="text-[12px] mb-3" style={{ color: "var(--ink-3)" }}>
                  커리어 선택, 진로 전환, 창업, 취미 등 현재 고민 중인 결정을 구체적으로 설명해주세요.
                </p>
                <textarea
                  id="decision"
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  placeholder="예: 현재 회사를 나가고 스타트업을 시작할지, 아니면 계속 다닐지 고민 중입니다..."
                  className="w-full rounded-lg p-3 text-[14px] border"
                  style={{
                    background: "var(--bg)",
                    borderColor: "var(--line)",
                    color: "var(--ink)",
                  }}
                  rows={4}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div
                  className="rounded-lg p-3 text-[13px]"
                  style={{
                    background: "var(--warm-soft)",
                    color: "var(--warm)",
                    border: "1px solid var(--line)",
                  }}
                >
                  ⚠️ {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !situation.trim() || !goals.trim() || !decision.trim()}
                className="w-full py-3 rounded-lg font-medium text-[14px] transition-all disabled:opacity-50"
                style={{
                  background: loading ? "var(--ink-2)" : "var(--warm)",
                  color: "white",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "롤모델을 찾는 중..." : "나를 닮은 롤모델 찾기"}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Result Section */}
            <div className="space-y-6">
              {/* Role Model Card */}
              <div
                className="rounded-2xl p-8"
                style={{
                  background: "var(--bg-2)",
                  border: "2px solid var(--warm)",
                  boxShadow: "var(--shadow)",
                }}
              >
                <div className="text-center mb-6">
                  <p className="text-[12px] uppercase tracking-widest" style={{ color: "var(--warm)" }}>
                    당신의 롤모델
                  </p>
                  <h2
                    className="font-serif text-4xl tracking-[-0.02em] mt-2"
                    style={{ color: "var(--ink)" }}
                  >
                    {result.roleModel}
                  </h2>
                  <p className="text-[14px] mt-2" style={{ color: "var(--ink-2)" }}>
                    {result.profession}
                  </p>
                </div>

                <div
                  className="w-16 h-1 mx-auto mb-6"
                  style={{ background: "var(--warm)" }}
                />

                {/* Situation */}
                <div className="mb-6">
                  <p
                    className="text-[12px] font-medium uppercase tracking-widest mb-2"
                    style={{ color: "var(--warm)" }}
                  >
                    📍 유사한 상황
                  </p>
                  <p className="text-[14px] leading-relaxed" style={{ color: "var(--ink)" }}>
                    {result.situation}
                  </p>
                </div>

                {/* Choice */}
                <div className="mb-6">
                  <p
                    className="text-[12px] font-medium uppercase tracking-widest mb-2"
                    style={{ color: "var(--warm)" }}
                  >
                    ✨ 그가 내린 선택
                  </p>
                  <p className="text-[14px] leading-relaxed" style={{ color: "var(--ink)" }}>
                    {result.choice}
                  </p>
                </div>

                {/* Reasoning */}
                <div className="mb-6">
                  <p
                    className="text-[12px] font-medium uppercase tracking-widest mb-2"
                    style={{ color: "var(--warm)" }}
                  >
                    💭 선택의 이유와 철학
                  </p>
                  <p className="text-[14px] leading-relaxed" style={{ color: "var(--ink)" }}>
                    {result.reasoning}
                  </p>
                </div>

                {/* Lessons */}
                <div>
                  <p
                    className="text-[12px] font-medium uppercase tracking-widest mb-3"
                    style={{ color: "var(--warm)" }}
                  >
                    🎓 당신이 배울 수 있는 점
                  </p>
                  <ul className="space-y-2">
                    {result.lessons.map((lesson, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span
                          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[12px]"
                          style={{ background: "var(--warm)", color: "white" }}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-[14px] pt-0.5" style={{ color: "var(--ink)" }}>
                          {lesson}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setResult(null)}
                  className="flex-1 py-3 rounded-lg font-medium text-[14px] transition-all"
                  style={{
                    background: "var(--bg-2)",
                    color: "var(--ink)",
                    border: "1px solid var(--line)",
                  }}
                >
                  다른 롤모델 찾기
                </button>
                <button
                  onClick={() => {
                    /* Navigate to next section if needed */
                  }}
                  className="flex-1 py-3 rounded-lg font-medium text-[14px] transition-all"
                  style={{
                    background: "var(--warm)",
                    color: "white",
                  }}
                >
                  계획 세우러 가기 →
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
