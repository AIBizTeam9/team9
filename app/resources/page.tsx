"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = () => {
    setKeyword(searchInput.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const colorMap: Record<string, string> = {
    blue:   "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10",
    green:  "border-green-500/30 bg-green-500/5 hover:bg-green-500/10",
    amber:  "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10",
    purple: "border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10",
    rose:   "border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10",
  };

  const tagColorMap: Record<string, string> = {
    blue:   "bg-blue-500/20 text-blue-300",
    green:  "bg-green-500/20 text-green-300",
    amber:  "bg-amber-500/20 text-amber-300",
    purple: "bg-purple-500/20 text-purple-300",
    rose:   "bg-rose-500/20 text-rose-300",
  };

  const categoryMeta = (key: CategoryKey) => CATEGORIES.find((c) => c.key === key)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-indigo-300/60 hover:text-indigo-300 transition-colors">
              ← 홈
            </Link>
            <h1 className="text-xl font-bold mt-1">
              <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                외부 데이터 허브
              </span>
            </h1>
            <p className="text-xs text-indigo-300/50 mt-0.5">
              커리어 탐색에 필요한 외부 리소스를 한곳에 모았습니다
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="키워드로 검색 (예: AI, 프론트엔드, 데이터 분석...)"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-indigo-400/50 transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-5 py-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium hover:bg-indigo-500/30 transition-all"
          >
            검색
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === "all"
                ? "bg-indigo-500 text-white"
                : "bg-white/5 border border-white/10 text-indigo-300/70 hover:bg-white/10"
            }`}
          >
            전체
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeCategory === cat.key
                  ? "bg-indigo-500 text-white"
                  : "bg-white/5 border border-white/10 text-indigo-300/70 hover:bg-white/10"
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Category summary cards (when "all") */}
        {activeCategory === "all" && !keyword && !loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {CATEGORIES.map((cat) => {
              const count = resources.filter((r) => r.category === cat.key).length;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`rounded-xl border p-4 text-left transition-all ${colorMap[cat.color]}`}
                >
                  <div className="text-2xl mb-2">{cat.icon}</div>
                  <div className="text-sm font-semibold text-white/90">{cat.label}</div>
                  <div className="text-xs text-white/40 mt-1">{count}건</div>
                </button>
              );
            })}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 200}ms` }} />
              ))}
            </div>
          </div>
        )}

        {/* Resource cards */}
        {!loading && resources.length === 0 && (
          <div className="text-center py-20 text-indigo-300/40">
            <p className="text-lg mb-2">검색 결과가 없습니다</p>
            <p className="text-sm">다른 키워드나 카테고리를 시도해보세요</p>
          </div>
        )}

        {!loading && resources.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => {
              const meta = categoryMeta(r.category);
              return (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group rounded-xl border p-4 transition-all block ${colorMap[meta.color]}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{r.icon}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors truncate">
                        {r.title}
                      </h3>
                      <p className="text-xs text-white/50 mt-1 line-clamp-2">{r.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-white/30">{r.source}</span>
                        <span className="text-white/10">|</span>
                        <div className="flex gap-1 flex-wrap">
                          {r.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full ${tagColorMap[meta.color]}`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-white/20 group-hover:text-white/50 shrink-0 mt-1 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* Usage guide for teammates */}
        <section className="mt-16 mb-8 rounded-2xl border border-white/5 bg-white/3 p-6">
          <h2 className="text-lg font-bold text-indigo-200 mb-4">
            팀원 가이드: 데이터 연동 방법
          </h2>
          <div className="space-y-4 text-sm text-white/60">
            <div>
              <h3 className="text-white/80 font-semibold mb-1">프론트엔드에서 사용하기</h3>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-indigo-300/80 overflow-x-auto">
{`import { fetchResources, type Resource, CATEGORIES } from "@/lib/resources";

// 전체 데이터
const all = await fetchResources();

// 카테고리 필터
const jobs = await fetchResources("jobs");

// 카테고리 + 키워드
const aiCourses = await fetchResources("courses", "AI");`}
              </pre>
            </div>
            <div>
              <h3 className="text-white/80 font-semibold mb-1">API 직접 호출</h3>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-indigo-300/80 overflow-x-auto">
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
