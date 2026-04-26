"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchMarketData,
  MARKET_CATEGORIES,
  type MarketItem,
  type MarketCategoryKey,
} from "@/lib/market";

export default function MarketPage() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<MarketCategoryKey | "all">("all");
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cat = activeCategory === "all" ? undefined : activeCategory;
      const data = await fetchMarketData(cat, keyword || undefined);
      setItems(data);
    } catch {
      setItems([]);
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
    cyan: "border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10",
    blue: "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10",
    emerald: "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10",
    violet: "border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10",
    amber: "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10",
  };

  const tagColorMap: Record<string, string> = {
    cyan: "bg-cyan-500/20 text-cyan-300",
    blue: "bg-blue-500/20 text-blue-300",
    emerald: "bg-emerald-500/20 text-emerald-300",
    violet: "bg-violet-500/20 text-violet-300",
    amber: "bg-amber-500/20 text-amber-300",
  };

  const badgeColorMap: Record<string, string> = {
    cyan: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    blue: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    emerald: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    violet: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    amber: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  };

  const categoryMeta = (key: MarketCategoryKey) =>
    MARKET_CATEGORIES.find((c) => c.key === key)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">
            <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
              시장 인사이트
            </span>
          </h1>
          <p className="text-xs text-cyan-300/50 mt-0.5">
            산업 트렌드, 연봉 데이터, 수요 스킬 — 커리어 결정에 필요한 시장 정보
          </p>
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
              placeholder="키워드로 검색 (예: AI, 반도체, 연봉, Python...)"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-cyan-400/50 transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-5 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-sm font-medium hover:bg-cyan-500/30 transition-all"
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
                ? "bg-cyan-500 text-white"
                : "bg-white/5 border border-white/10 text-cyan-300/70 hover:bg-white/10"
            }`}
          >
            전체
          </button>
          {MARKET_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeCategory === cat.key
                  ? "bg-cyan-500 text-white"
                  : "bg-white/5 border border-white/10 text-cyan-300/70 hover:bg-white/10"
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Category summary cards */}
        {activeCategory === "all" && !keyword && !loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {MARKET_CATEGORIES.map((cat) => {
              const count = items.filter((r) => r.category === cat.key).length;
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
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div className="text-center py-20 text-cyan-300/40">
            <p className="text-lg mb-2">검색 결과가 없습니다</p>
            <p className="text-sm">다른 키워드나 카테고리를 시도해보세요</p>
          </div>
        )}

        {/* Market data cards */}
        {!loading && items.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => {
              const meta = categoryMeta(item.category);
              return (
                <a
                  key={item.id}
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group rounded-xl border p-5 transition-all block ${colorMap[meta.color]}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{item.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${badgeColorMap[meta.color]}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-white/30">
                          {item.updatedAt}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-white/50 mt-1.5 line-clamp-2 leading-relaxed">
                        {item.summary}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-[10px] text-white/30">
                          {item.source}
                        </span>
                        <span className="text-white/10">|</span>
                        <div className="flex gap-1 flex-wrap">
                          {item.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className={`text-[10px] px-1.5 py-0.5 rounded-full ${tagColorMap[meta.color]}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <svg
                      className="w-4 h-4 text-white/20 group-hover:text-white/50 shrink-0 mt-1 transition-colors"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* Teammate usage guide */}
        <section className="mt-16 mb-8 rounded-2xl border border-white/5 bg-white/3 p-6">
          <h2 className="text-lg font-bold text-cyan-200 mb-4">
            팀원 가이드: 시장 데이터 연동
          </h2>
          <div className="space-y-4 text-sm text-white/60">
            <div>
              <h3 className="text-white/80 font-semibold mb-1">
                프론트엔드에서 사용하기
              </h3>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-cyan-300/80 overflow-x-auto">
{`import { fetchMarketData, type MarketItem, MARKET_CATEGORIES } from "@/lib/market";

// 전체 시장 데이터
const all = await fetchMarketData();

// 카테고리별 조회
const techTrends = await fetchMarketData("tech");
const salaryInfo = await fetchMarketData("salary");

// 카테고리 + 키워드
const aiOutlook = await fetchMarketData("outlook", "AI");`}
              </pre>
            </div>
            <div>
              <h3 className="text-white/80 font-semibold mb-1">API 직접 호출</h3>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-cyan-300/80 overflow-x-auto">
{`GET /api/market                          → 전체
GET /api/market?category=tech            → 기술 트렌드
GET /api/market?category=salary          → 연봉 정보
GET /api/market?keyword=AI               → AI 키워드
GET /api/market?category=skills&keyword=Python`}
              </pre>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
