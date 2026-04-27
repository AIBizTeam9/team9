/**
 * 시장/산업 데이터 모듈 (동근 담당)
 *
 * 팀원 사용법:
 *   import { fetchMarketData, type MarketItem, MARKET_CATEGORIES } from "@/lib/market";
 *   const techTrends = await fetchMarketData("tech");
 *   const all = await fetchMarketData();
 */

export type MarketCategoryKey =
  | "tech"
  | "industry"
  | "salary"
  | "skills"
  | "outlook";

export interface MarketItem {
  id: string;
  category: MarketCategoryKey;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  tags: string[];
  updatedAt: string;
  icon: string;
}

export interface MarketCategoryMeta {
  key: MarketCategoryKey;
  label: string;
  icon: string;
  description: string;
  color: string;
}

export const MARKET_CATEGORIES: MarketCategoryMeta[] = [
  { key: "tech", label: "기술 트렌드", icon: "🚀", description: "AI, 클라우드 등 기술 동향", color: "cyan" },
  { key: "industry", label: "산업 동향", icon: "🏭", description: "주요 산업별 시장 변화", color: "blue" },
  { key: "salary", label: "연봉 정보", icon: "💰", description: "직무별 연봉 데이터", color: "emerald" },
  { key: "skills", label: "수요 스킬", icon: "📈", description: "채용 시장에서 요구하는 핵심 역량", color: "violet" },
  { key: "outlook", label: "직업 전망", icon: "🔮", description: "유망 직종 및 고용 전망", color: "amber" },
];

export function getMarketCategoryMeta(key: MarketCategoryKey): MarketCategoryMeta {
  return MARKET_CATEGORIES.find((c) => c.key === key)!;
}

export async function fetchMarketData(
  category?: MarketCategoryKey,
  keyword?: string,
): Promise<MarketItem[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (keyword) params.set("keyword", keyword);

  const qs = params.toString();
  const url = `/api/market${qs ? `?${qs}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`시장 데이터 로드 실패: ${res.status}`);

  const data: { items: MarketItem[] } = await res.json();
  return data.items;
}
