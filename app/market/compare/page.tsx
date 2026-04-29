"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchMarketData,
  MARKET_CATEGORIES,
  type MarketCategoryKey,
  type MarketItem,
} from "@/lib/market";
import BookmarkButton from "@/components/bookmark-button";

const COLOR_MAP: Record<string, { fg: string; soft: string }> = {
  cyan: { fg: "var(--blue)", soft: "var(--blue-soft)" },
  blue: { fg: "var(--blue)", soft: "var(--blue-soft)" },
  emerald: { fg: "var(--green)", soft: "var(--green-soft)" },
  violet: { fg: "#7c5cbf", soft: "#f0ecf9" },
  amber: { fg: "var(--warm)", soft: "var(--warm-soft)" },
};

type Side = "a" | "b";

type ResultsByCategory = Record<MarketCategoryKey, MarketItem[]>;

const emptyResults = (): ResultsByCategory => ({
  tech: [],
  industry: [],
  salary: [],
  skills: [],
  outlook: [],
});

const SUGGESTED_PAIRS: Array<{ a: string; b: string; tag: string }> = [
  { a: "AI", b: "반도체", tag: "기술 vs 제조" },
  { a: "데이터", b: "디자인", tag: "분석 vs 창작" },
  { a: "스타트업", b: "대기업", tag: "조직 형태" },
  { a: "Python", b: "TypeScript", tag: "언어 선택" },
];

// 한 번의 fetch로 키워드 전체 매치를 받아온 뒤 카테고리별로 그룹핑한다.
// 카테고리당 한 번씩 호출하면 같은 데이터셋을 5번 받아오게 된다.
async function fetchGroupedByCategory(
  keyword: string,
): Promise<ResultsByCategory> {
  const trimmed = keyword.trim();
  const grouped = emptyResults();
  if (!trimmed) return grouped;

  let items: MarketItem[] = [];
  try {
    items = await fetchMarketData(undefined, trimmed);
  } catch {
    return grouped;
  }

  for (const item of items) {
    const key = item.category as MarketCategoryKey;
    if (key in grouped) grouped[key].push(item);
  }
  return grouped;
}

function CompareInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialA = searchParams.get("a") ?? "";
  const initialB = searchParams.get("b") ?? "";

  const [inputA, setInputA] = useState(initialA);
  const [inputB, setInputB] = useState(initialB);
  const [keywordA, setKeywordA] = useState(initialA);
  const [keywordB, setKeywordB] = useState(initialB);

  const [resultsA, setResultsA] = useState<ResultsByCategory>(emptyResults);
  const [resultsB, setResultsB] = useState<ResultsByCategory>(emptyResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 백/포워드 또는 외부 router.push 등으로 URL이 바뀌면 입력/키워드를 동기화한다.
  // submit() → router.replace() 후에는 URL과 state가 이미 같으므로 no-op.
  const urlA = searchParams.get("a") ?? "";
  const urlB = searchParams.get("b") ?? "";
  useEffect(() => {
    if (urlA !== keywordA) {
      setInputA(urlA);
      setKeywordA(urlA);
    }
    if (urlB !== keywordB) {
      setInputB(urlB);
      setKeywordB(urlB);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlA, urlB]);

  const hasBoth = keywordA.trim() !== "" && keywordB.trim() !== "";

  // 빠른 연속 호출 시 stale 결과가 fresh 결과를 덮어쓰지 않도록 request id를 검사한다.
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    if (!hasBoth) {
      setResultsA(emptyResults());
      setResultsB(emptyResults());
      setError(null);
      return;
    }
    const myId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const [a, b] = await Promise.all([
        fetchGroupedByCategory(keywordA),
        fetchGroupedByCategory(keywordB),
      ]);
      if (myId !== requestIdRef.current) return; // 더 새로운 요청이 들어왔다.
      setResultsA(a);
      setResultsB(b);
    } catch {
      if (myId !== requestIdRef.current) return;
      setError("시장 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      setResultsA(emptyResults());
      setResultsB(emptyResults());
    } finally {
      if (myId === requestIdRef.current) setLoading(false);
    }
  }, [hasBoth, keywordA, keywordB]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const sumA = MARKET_CATEGORIES.reduce(
      (acc, cat) => acc + resultsA[cat.key].length,
      0,
    );
    const sumB = MARKET_CATEGORIES.reduce(
      (acc, cat) => acc + resultsB[cat.key].length,
      0,
    );
    const tagsA = new Set<string>();
    const tagsB = new Set<string>();
    const norm = (t: string) => t.trim().toLowerCase();
    for (const cat of MARKET_CATEGORIES) {
      for (const item of resultsA[cat.key]) item.tags.forEach((t) => tagsA.add(norm(t)));
      for (const item of resultsB[cat.key]) item.tags.forEach((t) => tagsB.add(norm(t)));
    }
    const shared = [...tagsA].filter((t) => tagsB.has(t));
    return { sumA, sumB, shared };
  }, [resultsA, resultsB]);

  const submit = (a: string, b: string) => {
    const ta = a.trim();
    const tb = b.trim();
    setKeywordA(ta);
    setKeywordB(tb);
    const params = new URLSearchParams();
    if (ta) params.set("a", ta);
    if (tb) params.set("b", tb);
    const qs = params.toString();
    router.replace(qs ? `/market/compare?${qs}` : "/market/compare");
  };

  const onCompare = () => submit(inputA, inputB);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onCompare();
  };

  const applySuggestion = (a: string, b: string) => {
    setInputA(a);
    setInputB(b);
    submit(a, b);
  };

  const swap = () => {
    if (!inputA.trim() || !inputB.trim()) return;
    setInputA(inputB);
    setInputB(inputA);
    submit(inputB, inputA);
  };

  const reset = () => {
    setInputA("");
    setInputB("");
    submit("", "");
  };

  const winnerOf = (side: Side, key: MarketCategoryKey) => {
    const a = resultsA[key].length;
    const b = resultsB[key].length;
    if (a === b) return "tie";
    if (side === "a") return a > b ? "lead" : "trail";
    return b > a ? "lead" : "trail";
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <section className="max-w-[980px] mx-auto px-6 pt-14 pb-8">
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
          Compare · Two Possible Futures
        </div>

        <h1
          className="font-serif text-4xl sm:text-5xl tracking-[-0.03em] leading-[1.1] mb-5"
          style={{ color: "var(--ink)" }}
        >
          두 미래를 <span style={{ color: "var(--blue)" }}>나란히</span>.
          <br />
          시장은 무엇을 말하나.
        </h1>

        <p
          className="text-[15px] leading-relaxed max-w-xl"
          style={{ color: "var(--ink-3)" }}
        >
          서로 다른 두 길을 키워드로 입력하면, 5가지 시장 축에서 무엇이 다르고
          무엇이 겹치는지 한 화면에 펼쳐서 보여드려요.
        </p>
      </section>

      <main className="max-w-[980px] mx-auto px-6 pb-24">
        <div
          className="rounded-2xl p-5 sm:p-6 mb-6"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--line)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] items-stretch">
            <label className="block">
              <span
                className="text-[11px] font-medium tracking-[0.08em] uppercase mb-1.5 block"
                style={{ color: "var(--blue)" }}
              >
                Path A
              </span>
              <input
                type="text"
                value={inputA}
                onChange={(e) => setInputA(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="예: AI 엔지니어"
                className="w-full px-4 py-3 rounded-xl text-[14px] focus:outline-none transition-all"
                style={{
                  border: "1px solid var(--line)",
                  background: "var(--bg)",
                  color: "var(--ink)",
                }}
              />
            </label>

            <button
              type="button"
              onClick={swap}
              disabled={!inputA.trim() || !inputB.trim()}
              aria-label="두 키워드 교환"
              title="두 키워드 교환"
              className="hidden sm:inline-flex self-end h-[46px] px-3 rounded-xl text-[13px] items-center justify-center transition-all hover:bg-[var(--accent-2)] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                color: "var(--ink-3)",
                border: "1px solid var(--line-2)",
              }}
            >
              ⇄
            </button>

            <label className="block">
              <span
                className="text-[11px] font-medium tracking-[0.08em] uppercase mb-1.5 block"
                style={{ color: "var(--warm)" }}
              >
                Path B
              </span>
              <input
                type="text"
                value={inputB}
                onChange={(e) => setInputB(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="예: 콘텐츠 크리에이터"
                className="w-full px-4 py-3 rounded-xl text-[14px] focus:outline-none transition-all"
                style={{
                  border: "1px solid var(--line)",
                  background: "var(--bg)",
                  color: "var(--ink)",
                }}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <button
              onClick={onCompare}
              disabled={!inputA.trim() || !inputB.trim()}
              className="px-5 py-2.5 rounded-full text-[13px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--accent)" }}
            >
              비교하기 →
            </button>
            {(keywordA || keywordB) && (
              <button
                onClick={reset}
                className="text-[12px] underline-offset-4 hover:underline"
                style={{ color: "var(--ink-3)" }}
              >
                초기화
              </button>
            )}
            <span
              className="text-[11px] ml-auto"
              style={{ color: "var(--ink-3)" }}
            >
              두 키워드를 모두 입력한 뒤 비교 버튼을 눌러주세요
            </span>
          </div>

          {!keywordA && !keywordB && (
            <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--line)" }}>
              <p
                className="text-[11px] font-medium tracking-[0.08em] uppercase mb-2"
                style={{ color: "var(--ink-3)" }}
              >
                예시 비교
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PAIRS.map((p) => (
                  <button
                    key={`${p.a}-${p.b}`}
                    onClick={() => applySuggestion(p.a, p.b)}
                    className="px-3 py-1.5 rounded-full text-[12px] transition-all hover:bg-[var(--accent-2)]"
                    style={{
                      border: "1px solid var(--line-2)",
                      color: "var(--ink-2)",
                    }}
                  >
                    <span style={{ color: "var(--blue)" }}>{p.a}</span>
                    <span
                      className="mx-1.5"
                      style={{ color: "var(--ink-3)" }}
                    >
                      vs
                    </span>
                    <span style={{ color: "var(--warm)" }}>{p.b}</span>
                    <span
                      className="ml-2 text-[10px]"
                      style={{ color: "var(--ink-3)" }}
                    >
                      · {p.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {hasBoth && (
          <div
            className="flex flex-wrap items-center gap-3 mb-8 px-5 py-4 rounded-2xl"
            style={{
              background: "var(--accent-2)",
              border: "1px solid var(--line)",
            }}
          >
            <span
              className="text-[12px] font-medium tracking-[0.08em] uppercase"
              style={{ color: "var(--ink-3)" }}
            >
              요약
            </span>
            <span
              className="px-2.5 py-1 rounded-full text-[12px] font-medium"
              style={{ background: "var(--blue-soft)", color: "var(--blue)" }}
            >
              {keywordA} · {totals.sumA}건
            </span>
            <span style={{ color: "var(--ink-3)" }}>vs</span>
            <span
              className="px-2.5 py-1 rounded-full text-[12px] font-medium"
              style={{ background: "var(--warm-soft)", color: "var(--warm)" }}
            >
              {keywordB} · {totals.sumB}건
            </span>
            <span
              className="px-2.5 py-1 rounded-full text-[12px]"
              style={{
                background: "var(--bg-2)",
                color: "var(--ink-3)",
                border: "1px solid var(--line)",
              }}
            >
              공통 태그 {totals.shared.length}개
            </span>
            {totals.shared.length > 0 && (
              <span
                className="text-[11px] truncate max-w-full"
                style={{ color: "var(--ink-3)" }}
              >
                {totals.shared.slice(0, 5).join(" · ")}
              </span>
            )}
          </div>
        )}

        {loading && (
          <div className="text-center py-16">
            <p
              className="font-serif italic text-[20px] mb-2"
              style={{ color: "var(--ink-2)" }}
            >
              두 미래를 펼치는 중...
            </p>
            <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>
              5개 축에서 시장 데이터를 모으고 있어요
            </p>
          </div>
        )}

        {!loading && error && (
          <div
            className="rounded-2xl px-5 py-4 mb-6 text-[13px]"
            style={{
              background: "var(--warm-soft)",
              border: "1px solid var(--warm)",
              color: "var(--ink-2)",
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading && hasBoth && (
          <div className="space-y-8">
            {MARKET_CATEGORIES.map((cat) => {
              const c = COLOR_MAP[cat.color];
              const itemsA = resultsA[cat.key];
              const itemsB = resultsB[cat.key];
              return (
                <section
                  key={cat.key}
                  className="rounded-2xl p-5 sm:p-6"
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--line)",
                    boxShadow: "var(--shadow)",
                  }}
                >
                  <header className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: c.soft }}
                    >
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2
                        className="font-serif text-[20px] tracking-[-0.01em] leading-tight"
                        style={{ color: "var(--ink)" }}
                      >
                        {cat.label}
                      </h2>
                      <p
                        className="text-[12px]"
                        style={{ color: "var(--ink-3)" }}
                      >
                        {cat.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span
                        className="px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: "var(--blue-soft)",
                          color: "var(--blue)",
                        }}
                      >
                        A {itemsA.length}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: "var(--warm-soft)",
                          color: "var(--warm)",
                        }}
                      >
                        B {itemsB.length}
                      </span>
                    </div>
                  </header>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Column
                      side="a"
                      label={keywordA}
                      items={itemsA}
                      categoryLabel={cat.label}
                      categoryColor={c}
                      lead={winnerOf("a", cat.key)}
                    />
                    <Column
                      side="b"
                      label={keywordB}
                      items={itemsB}
                      categoryLabel={cat.label}
                      categoryColor={c}
                      lead={winnerOf("b", cat.key)}
                    />
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {!loading && !hasBoth && (keywordA || keywordB) && (
          <div className="text-center py-16">
            <p
              className="font-serif italic text-[22px] mb-2"
              style={{ color: "var(--ink-2)" }}
            >
              두 키워드가 모두 필요해요
            </p>
            <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
              비교는 두 길을 나란히 둘 때 가장 잘 보입니다
            </p>
          </div>
        )}

        <section
          className="mt-16 rounded-2xl p-7 sm:p-8"
          style={{
            background:
              "linear-gradient(135deg, var(--blue-soft), var(--warm-soft))",
            border: "1px solid var(--line)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
            <div className="min-w-0 flex-1">
              <p
                className="text-[11px] font-medium tracking-[0.08em] uppercase mb-2"
                style={{ color: "var(--ink-3)" }}
              >
                Coming Soon
              </p>
              <h3
                className="font-serif text-[22px] tracking-[-0.01em] mb-1"
                style={{ color: "var(--ink)" }}
              >
                AI에게 두 길의 차이를 한 문장으로 묻기
              </h3>
              <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
                Claude API가 연결되면, 위 데이터를 한 줄 인사이트로 요약해
                드립니다.
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link
                href="/quiz"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "var(--accent)" }}
              >
                내 페르소나 만들기 →
              </Link>
              <Link
                href="/market"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all hover:bg-[var(--accent-2)]"
                style={{
                  color: "var(--ink-2)",
                  border: "1px solid var(--line-2)",
                  background: "var(--bg-2)",
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

function Column({
  side,
  label,
  items,
  categoryLabel,
  categoryColor,
  lead,
}: {
  side: Side;
  label: string;
  items: MarketItem[];
  categoryLabel: string;
  categoryColor: { fg: string; soft: string };
  lead: "lead" | "trail" | "tie";
}) {
  const accent = side === "a" ? "var(--blue)" : "var(--warm)";
  const accentSoft = side === "a" ? "var(--blue-soft)" : "var(--warm-soft)";

  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-2"
      style={{
        background: "var(--bg)",
        border: "1px solid var(--line)",
      }}
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <span
          className="text-[12px] font-semibold truncate"
          style={{ color: accent }}
        >
          {label}
        </span>
        {lead === "lead" && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full"
            style={{ background: accentSoft, color: accent }}
          >
매치 더 많음
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div
          className="text-[12px] py-4 px-2 text-center"
          style={{ color: "var(--ink-3)" }}
        >
          이 축에서는 매치된 데이터가 없어요
        </div>
      ) : (
        items.map((item) => (
          <a
            key={item.id}
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-lg p-3 transition-all hover:shadow-md relative block"
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--line)",
            }}
          >
            <BookmarkButton
              variant="floating"
              payload={{
                kind: "market",
                itemId: item.id,
                title: item.title,
                summary: item.summary,
                url: item.sourceUrl,
                source: item.source,
                icon: item.icon,
                category: categoryLabel,
              }}
            />
            <div className="flex items-start gap-2 mb-1.5 pr-8">
              <span
                className="w-7 h-7 rounded-md flex items-center justify-center text-[15px] flex-shrink-0"
                style={{ background: categoryColor.soft }}
              >
                {item.icon}
              </span>
              <h4
                className="text-[13px] font-semibold leading-snug group-hover:opacity-70 transition-opacity"
                style={{ color: "var(--ink)" }}
              >
                {item.title}
              </h4>
            </div>
            <p
              className="text-[11px] leading-relaxed line-clamp-2 mb-2"
              style={{ color: "var(--ink-3)" }}
            >
              {item.summary}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {item.tags.slice(0, 2).map((tag) => (
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
              <span
                className="text-[10px] ml-auto"
                style={{ color: "var(--ink-3)" }}
              >
                {item.source}
              </span>
            </div>
          </a>
        ))
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "var(--bg)" }}
        >
          <p
            className="font-serif italic text-[20px]"
            style={{ color: "var(--ink-2)" }}
          >
            준비 중...
          </p>
        </div>
      }
    >
      <CompareInner />
    </Suspense>
  );
}
