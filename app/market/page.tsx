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

  useEffect(() => { load(); }, [load]);

  const handleSearch = () => setKeyword(searchInput.trim());
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleSearch(); };

  const colorMap: Record<string, { dot: string; soft: string; text: string }> = {
    cyan:    { dot: "var(--blue)",  soft: "var(--blue-soft)",  text: "var(--blue)" },
    blue:    { dot: "var(--blue)",  soft: "var(--blue-soft)",  text: "var(--blue)" },
    emerald: { dot: "var(--green)", soft: "var(--green-soft)", text: "var(--green)" },
    violet:  { dot: "#7c5cbf",     soft: "#f0ecf9",           text: "#7c5cbf" },
    amber:   { dot: "var(--warm)",  soft: "var(--warm-soft)",  text: "var(--warm)" },
  };

  const categoryMeta = (key: MarketCategoryKey) => MARKET_CATEGORIES.find((c) => c.key === key)!;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="max-w-[980px] mx-auto px-6 py-5">
          <h1 className="font-serif text-2xl tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
            시장 인사이트
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--ink-3)" }}>
            산업 트렌드, 연봉 데이터, 수요 스킬 — 커리어 결정에 필요한 시장 정보
          </p>
        </div>
      </header>

      <main className="max-w-[980px] mx-auto px-6 py-6">
        {/* Search */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="키워드로 검색 (예: AI, 반도체, 연봉, Python...)"
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

        {/* Category filter */}
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
          {MARKET_CATEGORIES.map((cat) => (
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

        {/* Category summary */}
        {activeCategory === "all" && !keyword && !loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {MARKET_CATEGORIES.map((cat) => {
              const count = items.filter((r) => r.category === cat.key).length;
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

        {!loading && items.length === 0 && (
          <div className="text-center py-20" style={{ color: "var(--ink-3)" }}>
            <p className="text-lg mb-2">검색 결과가 없습니다</p>
            <p className="text-[13px]">다른 키워드나 카테고리를 시도해보세요</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => {
              const meta = categoryMeta(item.category);
              const c = colorMap[meta.color];
              return (
                <a
                  key={item.id}
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl p-5 transition-all hover:shadow-lg"
                  style={{ background: "var(--bg-2)", border: "1px solid var(--line)", boxShadow: "var(--shadow)" }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{item.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: c.soft, color: c.text }}>{meta.label}</span>
                        <span className="text-[10px]" style={{ color: "var(--ink-3)" }}>{item.updatedAt}</span>
                      </div>
                      <h3 className="text-[14px] font-semibold group-hover:opacity-70 transition-opacity" style={{ color: "var(--ink)" }}>{item.title}</h3>
                      <p className="text-[12px] mt-1.5 line-clamp-2 leading-relaxed" style={{ color: "var(--ink-3)" }}>{item.summary}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-[10px]" style={{ color: "var(--ink-3)" }}>{item.source}</span>
                        <span style={{ color: "var(--line-2)" }}>|</span>
                        <div className="flex gap-1 flex-wrap">
                          {item.tags.slice(0, 3).map((tag) => (
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

        {/* Teammate guide */}
        <section className="mt-16 mb-8 rounded-2xl p-6" style={{ background: "var(--accent-2)", border: "1px solid var(--line)" }}>
          <h2 className="font-serif text-lg mb-4" style={{ color: "var(--ink)" }}>팀원 가이드: 시장 데이터 연동</h2>
          <div className="space-y-4 text-[13px]" style={{ color: "var(--ink-3)" }}>
            <div>
              <h3 className="font-semibold mb-1" style={{ color: "var(--ink-2)" }}>프론트엔드에서 사용하기</h3>
              <pre className="rounded-lg p-3 text-[12px] overflow-x-auto" style={{ background: "var(--bg-2)", border: "1px solid var(--line)", color: "var(--ink-2)" }}>
{`import { fetchMarketData, type MarketItem, MARKET_CATEGORIES } from "@/lib/market";

const all = await fetchMarketData();
const techTrends = await fetchMarketData("tech");
const aiOutlook = await fetchMarketData("outlook", "AI");`}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-1" style={{ color: "var(--ink-2)" }}>API 직접 호출</h3>
              <pre className="rounded-lg p-3 text-[12px] overflow-x-auto" style={{ background: "var(--bg-2)", border: "1px solid var(--line)", color: "var(--ink-2)" }}>
{`GET /api/market                          → 전체
GET /api/market?category=tech            → 기술 트렌드
GET /api/market?category=salary          → 연봉 정보
GET /api/market?keyword=AI               → AI 키워드`}
              </pre>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
