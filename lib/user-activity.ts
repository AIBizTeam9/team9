/**
 * 사용자 활동 추적 — 클라이언트 localStorage 기반
 *
 * 로그인 여부와 무관하게 동작. 사용자가 클릭한 카드 id·카테고리·태그를
 * 누적해 카테고리·태그 가중치를 계산하고, 미본 항목 중 가중치 높은
 * 카드를 "내 관심사 추천"으로 노출하는 데 사용한다.
 *
 * - 페이지 namespace: "market" | "resources" (확장 가능)
 * - 저장 한도: 페이지당 최근 50건 (LRU)
 * - 추천 임계: 본 카드 ≥ 3건일 때만 의미 있는 추천 가능
 *
 * Server-side에서 호출되면 안 됨 — 모든 함수가 typeof window 가드를 갖는다.
 */

const STORAGE_PREFIX = "nsl:viewed:";
const MAX_HISTORY = 50;
const MIN_VIEWS_FOR_RECOMMEND = 3;

export type ActivityPage = "market" | "resources";

export interface ViewEvent {
  id: string;
  category: string;
  tags: string[];
  ts: number;
}

interface RecommendableItem {
  id: string;
  category: string;
  tags: string[];
}

function storageKey(page: ActivityPage): string {
  return `${STORAGE_PREFIX}${page}`;
}

/** 안전하게 localStorage에서 ViewEvent[] 읽기. */
export function loadHistory(page: ActivityPage): ViewEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(page));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is ViewEvent =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as ViewEvent).id === "string" &&
        typeof (e as ViewEvent).category === "string" &&
        Array.isArray((e as ViewEvent).tags) &&
        typeof (e as ViewEvent).ts === "number",
    );
  } catch {
    return [];
  }
}

/** 카드 click을 기록. 동일 id가 이미 있으면 ts만 갱신해 LRU에서 살아남게 함. */
export function recordView(
  page: ActivityPage,
  item: RecommendableItem,
): void {
  if (typeof window === "undefined") return;
  try {
    const history = loadHistory(page);
    const filtered = history.filter((e) => e.id !== item.id);
    const next: ViewEvent[] = [
      {
        id: item.id,
        category: item.category,
        tags: item.tags.slice(0, 5),
        ts: Date.now(),
      },
      ...filtered,
    ].slice(0, MAX_HISTORY);
    window.localStorage.setItem(storageKey(page), JSON.stringify(next));
    // 다른 컴포넌트가 listening할 수 있도록 storage event 강제 발행 (same-tab).
    window.dispatchEvent(
      new CustomEvent("user-activity:changed", { detail: { page } }),
    );
  } catch {
    // localStorage 가용성 문제 — 무시
  }
}

/** 본 카드 ID Set (시각적 ✓ 표시용). */
export function viewedIdSet(page: ActivityPage): Set<string> {
  return new Set(loadHistory(page).map((e) => e.id));
}

/**
 * 카테고리·태그 가중치 계산.
 * - 더 최근에 본 카드일수록 가중치 큼 (1/(rank+1))
 * - 카테고리: 1.0, 태그: 0.4 비중
 */
export function affinityScores(
  page: ActivityPage,
): {
  byCategory: Map<string, number>;
  byTag: Map<string, number>;
} {
  const history = loadHistory(page);
  const byCategory = new Map<string, number>();
  const byTag = new Map<string, number>();

  history.forEach((e, rank) => {
    const recencyWeight = 1 / (rank + 1);
    byCategory.set(
      e.category,
      (byCategory.get(e.category) ?? 0) + recencyWeight,
    );
    e.tags.forEach((t) => {
      const norm = t.trim().toLowerCase();
      if (!norm) return;
      byTag.set(norm, (byTag.get(norm) ?? 0) + recencyWeight * 0.4);
    });
  });

  return { byCategory, byTag };
}

/**
 * 미본 항목 중 가중치 높은 top N 추천.
 * - 본 카드 부족(< 3)이면 빈 배열 (의미 없는 추천 방지)
 * - 같은 점수면 입력 순서 유지
 */
export function recommend<T extends RecommendableItem>(
  page: ActivityPage,
  items: T[],
  limit = 4,
): T[] {
  if (typeof window === "undefined") return [];
  const history = loadHistory(page);
  if (history.length < MIN_VIEWS_FOR_RECOMMEND) return [];

  const viewed = new Set(history.map((e) => e.id));
  const { byCategory, byTag } = affinityScores(page);

  const scored = items
    .filter((it) => !viewed.has(it.id))
    .map((it) => {
      const catScore = byCategory.get(it.category) ?? 0;
      const tagScore = it.tags
        .map((t) => byTag.get(t.trim().toLowerCase()) ?? 0)
        .reduce((a, b) => a + b, 0);
      return { item: it, score: catScore + tagScore };
    })
    .filter((x) => x.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.item);
}

/** 사용자가 추천에서 빠르게 무엇 때문에 추천됐는지 알 수 있게 한 줄 요약. */
export function topInterestLabel(page: ActivityPage): string | null {
  const { byCategory, byTag } = affinityScores(page);
  const topCat = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0];
  const topTags = [...byTag.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([t]) => t);
  if (!topCat) return null;
  if (topTags.length === 0) return topCat[0];
  return `${topCat[0]} · ${topTags.join(", ")}`;
}

/** 모든 활동 기록 삭제 (디버그/리셋용). */
export function clearActivity(page: ActivityPage): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(page));
    window.dispatchEvent(
      new CustomEvent("user-activity:changed", { detail: { page } }),
    );
  } catch {
    // ignore
  }
}

/**
 * 활동 변경 구독 (same-tab + cross-tab).
 * 컴포넌트가 추천 목록을 즉시 리렌더하기 위해 사용.
 */
export function subscribeActivityChanges(
  page: ActivityPage,
  callback: () => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent<{ page: ActivityPage }>).detail;
    if (detail.page === page) callback();
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === storageKey(page)) callback();
  };

  window.addEventListener("user-activity:changed", onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("user-activity:changed", onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
