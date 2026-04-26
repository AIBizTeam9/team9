"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchResources,
  CATEGORIES,
  type Resource,
  type CategoryKey,
} from "@/lib/resources";

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategoryKey | "all">("all");
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cat = activeCategory === "all" ? undefined : activeCategory;
      const data = await fetchResources(cat, keyword || undefined);
      setResources(data);
    } catch {
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, keyword]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = () => setKeyword(searchInput.trim());
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleSearch(); };

  const colorMap: Record<string, { dot: string; soft: string; text: string }> = {
    blue:   { dot: "var(--blue)",  soft: "var(--blue-soft)",  text: "var(--blue)" },
    green:  { dot: "var(--green)", soft: "var(--green-soft)", text: "var(--green)" },
    amber:  { dot: "var(--warm)",  soft: "var(--warm-soft)",  text: "var(--warm)" },
    purple: { dot: "#7c5cbf",     soft: "#f0ecf9",           text: "#7c5cbf" },
    rose:   { dot: "#c2456e",     soft: "#fce8ef",           text: "#c2456e" },
  };

  const categoryMeta = (key: CategoryKey) => CATEGORIES.find((c) => c.key === key)!;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="max-w-[980px] mx-auto px-6 py-5">
          <h1 className="font-serif text-2xl tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
            외부 데이터 허브
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--ink-3)" }}>
            커리어 탐색에 필요한 외부 리소스를 한곳에 모았습니다
          </p>
        </div>
      </header>

      <main className="max-w-[980px] mx-auto px-6 py-6">
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="키워드로 검색 (예: AI, 프론트엔드, 데이터 분석...)"
            className="flex-1 px-4 py-2.5 rounded-xl text-[14px] focus:outline-none transition-all"
            style={{ border: "1px solid var(--line)", background: "var(--bg-2)", color: "var(--ink)" }}
          />
          <button
            onClick={handleSearch}
            className="px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all hover:opacity-80"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            검색
          </button>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCategory("all")}
            className="shrink-0 px-4 py-2 rounded-full text-[13px] font-medium transition-all"
            style={{
              background: activeCategory === "all" ? "var(--accent)" : "var(--bg-2)",
              color: activeCategory === "all" ? "#fff" : "var(--ink-3)",
              border: activeCategory === "all" ? "none" : "1px solid var(--line)",
            }}
          >
            전체
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className="shrink-0 px-4 py-2 rounded-full text-[13px] font-medium transition-all flex items-center gap-1.5"
              style={{
                background: activeCategory === cat.key ? "var(--accent)" : "var(--bg-2)",
                color: activeCategory === cat.key ? "#fff" : "var(--ink-3)",
                border: activeCategory === cat.key ? "none" : "1px solid var(--line)",
              }}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {activeCategory === "all" && !keyword && !loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {CATEGORIES.map((cat) => {
              const count = resources.filter((r) => r.category === cat.key).length;
              const c = colorMap[cat.color];
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className="rounded-2xl p-4 text-left transition-all hover:shadow-md"
                  style={{ background: c.soft, border: "1px solid var(--line)" }}
                >
                  <div className="text-2xl mb-2">{cat.icon}</div>
                  <div className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>{cat.label}</div>
                  <div className="text-[11px] mt-1" style={{ color: "var(--ink-3)" }}>{count}건</div>
                </button>
              );
            })}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--warm)", animationDelay: `${i * 200}ms` }} />
              ))}
            </div>
          </div>
        )}

        {!loading && resources.length === 0 && (
          <div className="text-center py-20" style={{ color: "var(--ink-3)" }}>
            <p className="text-lg mb-2">검색 결과가 없습니다</p>
            <p className="text-[13px]">다른 키워드나 카테고리를 시도해보세요</p>
          </div>
        )}

        {!loading && resources.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => {
              const meta = categoryMeta(r.category);
              const c = colorMap[meta.color];
              return (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl p-4 transition-all hover:shadow-lg"
                  style={{ background: "var(--bg-2)", border: "1px solid var(--line)", boxShadow: "var(--shadow)" }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{r.icon}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[13px] font-semibold group-hover:opacity-70 transition-opacity" style={{ color: "var(--ink)" }}>{r.title}</h3>
                      <p className="text-[11px] mt-1 line-clamp-2" style={{ color: "var(--ink-3)" }}>{r.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px]" style={{ color: "var(--ink-3)" }}>{r.source}</span>
                        <span style={{ color: "var(--line-2)" }}>|</span>
                        <div className="flex gap-1 flex-wrap">
                          {r.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: c.soft, color: c.text }}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[12px] opacity-0 group-hover:opacity-100 transition-opacity mt-1" style={{ color: "var(--ink-3)" }}>→</span>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        <section className="mt-16 mb-8 rounded-2xl p-6" style={{ background: "var(--accent-2)", border: "1px solid var(--line)" }}>
          <h2 className="font-serif text-lg mb-4" style={{ color: "var(--ink)" }}>팀원 가이드: 데이터 연동 방법</h2>
          <div className="space-y-4 text-[13px]" style={{ color: "var(--ink-3)" }}>
            <div>
              <h3 className="font-semibold mb-1" style={{ color: "var(--ink-2)" }}>프론트엔드에서 사용하기</h3>
              <pre className="rounded-lg p-3 text-[12px] overflow-x-auto" style={{ background: "var(--bg-2)", border: "1px solid var(--line)", color: "var(--ink-2)" }}>
{`import { fetchResources, type Resource, CATEGORIES } from "@/lib/resources";

const all = await fetchResources();
const jobs = await fetchResources("jobs");
const aiCourses = await fetchResources("courses", "AI");`}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-1" style={{ color: "var(--ink-2)" }}>API 직접 호출</h3>
              <pre className="rounded-lg p-3 text-[12px] overflow-x-auto" style={{ background: "var(--bg-2)", border: "1px solid var(--line)", color: "var(--ink-2)" }}>
{`GET /api/resources                       → 전체
GET /api/resources?category=jobs          → 채용 정보만
GET /api/resources?keyword=AI             → AI 키워드
GET /api/resources?category=courses&keyword=프론트엔드`}
              </pre>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
