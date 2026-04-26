/**
 * 외부 연동 데이터 공용 모듈
 *
 * 팀원 사용법:
 *   import { fetchResources, type Resource, CATEGORIES } from "@/lib/resources";
 *   const jobs = await fetchResources("jobs");
 *   const all  = await fetchResources();               // 전체
 *   const filtered = await fetchResources("courses", "AI"); // 카테고리 + 키워드
 */

// ── 타입 정의 ──

export type CategoryKey = "jobs" | "courses" | "books" | "communities" | "trends";

export interface Resource {
  id: string;
  category: CategoryKey;
  title: string;
  description: string;
  url: string;
  source: string;
  tags: string[];
  icon: string;
}

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  icon: string;
  description: string;
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: "jobs",        label: "채용 정보",  icon: "💼", description: "직무별 채용 공고 검색 링크",       color: "blue" },
  { key: "courses",     label: "강의/교육",  icon: "📚", description: "온라인 강의 및 교육 플랫폼",      color: "green" },
  { key: "books",       label: "추천 도서",  icon: "📖", description: "커리어/자기계발 추천 도서",        color: "amber" },
  { key: "communities", label: "커뮤니티",   icon: "👥", description: "네트워킹 및 커뮤니티 모임",       color: "purple" },
  { key: "trends",      label: "트렌드",     icon: "📊", description: "산업 트렌드 및 인사이트 리포트",   color: "rose" },
];

export function getCategoryMeta(key: CategoryKey): CategoryMeta {
  return CATEGORIES.find((c) => c.key === key)!;
}

// ── 데이터 fetch ──

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export async function fetchResources(
  category?: CategoryKey,
  keyword?: string,
): Promise<Resource[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (keyword) params.set("keyword", keyword);

  const qs = params.toString();
  const url = `${API_BASE}/api/resources${qs ? `?${qs}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`리소스 로드 실패: ${res.status}`);

  const data: { resources: Resource[] } = await res.json();
  return data.resources;
}
