"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  fetchResources,
  CATEGORIES,
  type Resource,
  type CategoryKey,
} from "@/lib/resources";
import {
  recommend,
  recordView,
  subscribeActivityChanges,
  topInterestLabel,
  viewedIdSet,
  clearActivity,
} from "@/lib/user-activity";

const COLOR_MAP: Record<string, { fg: string; soft: string }> = {
  blue:   { fg: "var(--blue)",  soft: "var(--blue-soft)"  },
  green:  { fg: "var(--green)", soft: "var(--green-soft)" },
  amber:  { fg: "var(--warm)",  soft: "var(--warm-soft)"  },
  purple: { fg: "#7c5cbf",      soft: "#f0ecf9"           },
  rose:   { fg: "#c2456e",      soft: "#fce8ef"           },
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] =
    useState<CategoryKey | "all">("all");
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // 개인화: 클릭 누적 → 미본 항목 추천 + ✓ 표시
  const [viewed, setViewed] = useState<Set<string>>(new Set());
  const [activityVersion, setActivityVersion] = useState(0);

  useEffect(() => {
    setViewed(viewedIdSet("resources"));
    const unsub = subscribeActivityChanges("resources", () => {
      setViewed(viewedIdSet("resources"));
      setActivityVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  const recommendations = useMemo<Resource[]>(() => {
    if (allResources.length === 0) return [];
    return recommend("resources", allResources, 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allResources, activityVersion]);

  const interestLabel = useMemo<string | null>(() => {
    return topInterestLabel("resources");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityVersion]);

  useEffect(() => {
    fetchResources().then(setAllResources).catch(() => {});
  }, []);

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

  const onCardClick = useCallback((r: Resource) => {
    recordView("resources", {
      id: r.id,
      category: r.category,
      tags: r.tags,
    });
  }, []);

  const onResetActivity = useCallback(() => {
    clearActivity("resources");
  }, []);

  const handleSearch = () => setKeyword(searchInput.trim());
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };
  const clearFilters = () => {
    setActiveCategory("all");
    setKeyword("");
    setSearchInput("");
  };

  const categoryMeta = (key: CategoryKey) =>
    CATEGORIES.find((c) => c.key === key)!;
  const activeMeta =
    activeCategory !== "all" ? categoryMeta(activeCategory) : null;
  const hasFilter = activeCategory !== "all" || keyword !== "";

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
            style={{ background: "var(--blue)" }}
          />
          Toolkit · Now Build
        </div>

        <h1
          className="font-serif text-4xl sm:text-5xl tracking-[-0.03em] leading-[1.1] mb-5"
          style={{ color: "var(--ink)" }}
        >
          다음 90일을 채울
          <br />
          <span style={{ color: "var(--blue)" }}>도구 모음</span>.
        </h1>

        <p
          className="text-[15px] leading-relaxed max-w-xl"
          style={{ color: "var(--ink-3)" }}
        >
          채용 공고, 강의, 추천 도서, 커뮤니티, 트렌드 리포트 — 페르소나의
          미래로 향하기 위해 당장 손에 잡을 수 있는 자료를 모았습니다.
        </p>
      </section>

      <main className="max-w-[980px] mx-auto px-6 pb-24">
        {/* Search */}
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="키워드로 검색 — AI, 프론트엔드, 데이터 분석..."
            className="flex-1 px-4 py-3 rounded-2xl text-[14px] focus:outline-none transition-all"
            style={{
              border: "1px solid var(--line)",
              background: "var(--bg-2)",
              color: "var(--ink)",
              boxShadow: "var(--shadow)",
            }}
          />
          <button
            onClick={handleSearch}
            className="px-5 py-3 rounded-2xl text-[13px] font-medium transition-all hover:opacity-90"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            검색
          </button>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 mb-10 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCategory("all")}
            className="shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all"
            style={{
              background:
                activeCategory === "all" ? "var(--ink)" : "transparent",
              color: activeCategory === "all" ? "var(--bg)" : "var(--ink-3)",
              border:
                activeCategory === "all"
                  ? "1px solid var(--ink)"
                  : "1px solid var(--line-2)",
            }}
          >
            전체
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className="shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all flex items-center gap-1.5"
              style={{
                background:
                  activeCategory === cat.key ? "var(--ink)" : "transparent",
                color:
                  activeCategory === cat.key ? "var(--bg)" : "var(--ink-3)",
                border:
                  activeCategory === cat.key
                    ? "1px solid var(--ink)"
                    : "1px solid var(--line-2)",
              }}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* 개인화 추천 — viewed ≥ 3건이고 추천 결과가 있을 때만 노출 */}
        {!hasFilter && recommendations.length > 0 && (
          <section className="mb-12">
            <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
              <div className="min-w-0">
                <p
                  className="text-[11px] font-medium tracking-[0.08em] uppercase mb-1"
                  style={{ color: "var(--blue)" }}
                >
                  내 관심사 기반 추천
                </p>
                {interestLabel && (
                  <p
                    className="text-[12px] truncate"
                    style={{ color: "var(--ink-3)" }}
                  >
                    당신이 자주 본 <span style={{ color: "var(--ink-2)" }}>{interestLabel}</span> 와(과) 관련된 미열람 자료
                  </p>
                )}
              </div>
              <button
                onClick={onResetActivity}
                className="text-[11px] underline-offset-4 hover:underline shrink-0"
                style={{ color: "var(--ink-3)" }}
                title="이 페이지의 활동 기록을 비우고 추천을 초기화"
              >
                추천 초기화
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((r) => {
                const meta = categoryMeta(r.category);
                const c = COLOR_MAP[meta.color];
                return (
                  <a
                    key={`rec-${r.id}`}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onCardClick(r)}
                    className="group rounded-2xl p-4 transition-all hover:shadow-lg flex flex-col relative"
                    style={{
                      background: "var(--bg-2)",
                      border: "1px solid var(--blue)",
                      boxShadow: "var(--shadow)",
                    }}
                  >
                    <span
                      className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: "var(--blue-soft)",
                        color: "var(--blue)",
                      }}
                    >
                      추천
                    </span>
                    <div className="flex items-start gap-3 pr-12">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: c.soft }}
                      >
                        {r.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: c.soft, color: c.fg }}
                        >
                          {meta.label}
                        </span>
                        <h3
                          className="text-[13px] font-semibold leading-snug mt-1 group-hover:opacity-70 transition-opacity"
                          style={{ color: "var(--ink)" }}
                        >
                          {r.title}
                        </h3>
                        <p
                          className="text-[12px] leading-relaxed line-clamp-1 mt-1"
                          style={{ color: "var(--ink-3)" }}
                        >
                          {r.description}
                        </p>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Category overview */}
        {!hasFilter && (
          <section className="mb-12">
            <p
              className="text-[12px] font-medium tracking-[0.08em] uppercase mb-4"
              style={{ color: "var(--ink-3)" }}
            >
              5가지 카테고리
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((cat) => {
                const c = COLOR_MAP[cat.color];
                const count = allResources.filter(
                  (r) => r.category === cat.key,
                ).length;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className="group rounded-2xl p-5 text-left transition-all hover:shadow-lg"
                    style={{
                      background: "var(--bg-2)",
                      border: "1px solid var(--line)",
                      boxShadow: "var(--shadow)",
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: c.soft }}
                      >
                        {cat.icon}
                      </div>
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full"
                        style={{
                          background: "var(--accent-2)",
                          color: "var(--ink-3)",
                        }}
                      >
                        {count}건
                      </span>
                    </div>
                    <h3
                      className="font-serif text-[18px] tracking-[-0.01em] mb-1 group-hover:opacity-80 transition-opacity"
                      style={{ color: "var(--ink)" }}
                    >
                      {cat.label}
                    </h3>
                    <p
                      className="text-[12px] leading-relaxed"
                      style={{ color: "var(--ink-3)" }}
                    >
                      {cat.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Active filter banner */}
        {hasFilter && !loading && (
          <div
            className="flex items-center justify-between gap-3 mb-6 px-5 py-3 rounded-2xl"
            style={{
              background: "var(--accent-2)",
              border: "1px solid var(--line)",
            }}
          >
            <p className="text-[13px]" style={{ color: "var(--ink-2)" }}>
              <span className="font-semibold">{resources.length}건</span>
              {activeMeta && (
                <>
                  <span style={{ color: "var(--ink-3)" }}> · </span>
                  <span>
                    {activeMeta.icon} {activeMeta.label}
                  </span>
                </>
              )}
              {keyword && (
                <>
                  <span style={{ color: "var(--ink-3)" }}> · </span>
                  <span>키워드 “{keyword}”</span>
                </>
              )}
            </p>
            <button
              onClick={clearFilters}
              className="text-[12px] underline-offset-4 hover:underline"
              style={{ color: "var(--ink-3)" }}
            >
              필터 초기화
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-20">
            <p
              className="font-serif italic text-[20px] mb-2"
              style={{ color: "var(--ink-2)" }}
            >
              찾는 중...
            </p>
            <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>
              자료를 불러오고 있어요
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && resources.length === 0 && (
          <div className="text-center py-20">
            <p
              className="font-serif italic text-[22px] mb-2"
              style={{ color: "var(--ink-2)" }}
            >
              아직 보여드릴 게 없어요
            </p>
            <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
              다른 키워드나 카테고리를 시도해보세요
            </p>
          </div>
        )}

        {/* Result list */}
        {!loading && resources.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => {
              const meta = categoryMeta(r.category);
              const c = COLOR_MAP[meta.color];
              const isViewed = viewed.has(r.id);
              return (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onCardClick(r)}
                  className="group rounded-2xl p-5 transition-all hover:shadow-lg flex flex-col relative"
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--line)",
                    boxShadow: "var(--shadow)",
                    opacity: isViewed ? 0.7 : 1,
                  }}
                >
                  {isViewed && (
                    <span
                      className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--green-soft)",
                        color: "var(--green)",
                      }}
                      title="이미 본 항목"
                    >
                      ✓ 봄
                    </span>
                  )}
                  <div className="flex items-start gap-3 mb-3 pr-12">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: c.soft }}
                    >
                      {r.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className="inline-block text-[10px] px-2 py-0.5 rounded-full mb-1"
                        style={{ background: c.soft, color: c.fg }}
                      >
                        {meta.label}
                      </span>
                      <h3
                        className="text-[14px] font-semibold leading-snug group-hover:opacity-70 transition-opacity"
                        style={{ color: "var(--ink)" }}
                      >
                        {r.title}
                      </h3>
                    </div>
                  </div>
                  <p
                    className="text-[12px] leading-relaxed mb-3 line-clamp-2 flex-1"
                    style={{ color: "var(--ink-3)" }}
                  >
                    {r.description}
                  </p>
                  <div
                    className="flex items-center justify-between gap-2 pt-3"
                    style={{ borderTop: "1px solid var(--line)" }}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span
                        className="text-[11px] truncate"
                        style={{ color: "var(--ink-3)" }}
                      >
                        {r.source}
                      </span>
                      {r.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "var(--accent-2)",
                            color: "var(--ink-3)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span
                      className="text-[12px] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      style={{ color: "var(--ink-3)" }}
                    >
                      ↗
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* Cross-page CTA */}
        <section
          className="mt-16 rounded-2xl p-7 sm:p-8"
          style={{
            background:
              "linear-gradient(135deg, var(--blue-soft), var(--bg-2))",
            border: "1px solid var(--line)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
            <div className="min-w-0 flex-1">
              <p
                className="text-[11px] font-medium tracking-[0.08em] uppercase mb-2"
                style={{ color: "var(--blue)" }}
              >
                Now Build
              </p>
              <h3
                className="font-serif text-[22px] tracking-[-0.01em] mb-1"
                style={{ color: "var(--ink)" }}
              >
                이 자료로 90일 플랜의 액션 항목을 채워보세요
              </h3>
              <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
                강의, 채용, 커뮤니티 — 90일 플랜의 단계별 추천 리소스로 바로
                연결됩니다.
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link
                href="/plan"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "var(--accent)" }}
              >
                90일 플랜 <span className="text-[11px] opacity-70">→</span>
              </Link>
              <Link
                href="/market"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all hover:bg-[var(--accent-2)]"
                style={{
                  color: "var(--ink-2)",
                  border: "1px solid var(--line-2)",
                }}
              >
                시장 인사이트
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
