/**
 * 북마크 저장소 — 로컬 우선, 나중에 Supabase 영속화로 확장 가능한 인터페이스.
 *
 * 설계 의도:
 * - 비로그인 사용자도 북마크 가능해야 함 (마찰 최소화)
 * - localStorage에 저장하되, 나중에 로그인 시 서버로 sync할 수 있도록 단순한 키 구조 유지
 * - 카테고리(시장 / 리소스) + 원본 ID를 합쳐서 유일성 보장
 */

export type BookmarkKind = "market" | "resource";

export interface Bookmark {
  kind: BookmarkKind;
  itemId: string;
  // UI에서 즉시 렌더링할 수 있도록 핵심 메타데이터를 함께 저장
  title: string;
  summary: string;
  url: string;
  source: string;
  icon: string;
  category: string;
  savedAt: string; // ISO timestamp
}

const STORAGE_KEY = "nsil:bookmarks:v1";

function read(): Bookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isBookmark);
  } catch {
    return [];
  }
}

function write(items: Bookmark[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  // 같은 페이지의 다른 컴포넌트에 변경 알림
  window.dispatchEvent(new CustomEvent("bookmarks:changed"));
}

function isBookmark(value: unknown): value is Bookmark {
  if (!value || typeof value !== "object") return false;
  const b = value as Record<string, unknown>;
  return (
    (b.kind === "market" || b.kind === "resource") &&
    typeof b.itemId === "string" &&
    typeof b.title === "string"
  );
}

function key(kind: BookmarkKind, itemId: string) {
  return `${kind}:${itemId}`;
}

export function listBookmarks(): Bookmark[] {
  return read().sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function isBookmarked(kind: BookmarkKind, itemId: string): boolean {
  return read().some((b) => key(b.kind, b.itemId) === key(kind, itemId));
}

export function addBookmark(input: Omit<Bookmark, "savedAt">): void {
  const items = read();
  const exists = items.some(
    (b) => key(b.kind, b.itemId) === key(input.kind, input.itemId),
  );
  if (exists) return;
  items.push({ ...input, savedAt: new Date().toISOString() });
  write(items);
}

export function removeBookmark(kind: BookmarkKind, itemId: string): void {
  const items = read().filter(
    (b) => key(b.kind, b.itemId) !== key(kind, itemId),
  );
  write(items);
}

export function toggleBookmark(input: Omit<Bookmark, "savedAt">): boolean {
  if (isBookmarked(input.kind, input.itemId)) {
    removeBookmark(input.kind, input.itemId);
    return false;
  }
  addBookmark(input);
  return true;
}

/** React 훅에서 사용 — bookmarks:changed 이벤트와 storage 이벤트 둘 다 구독. */
export function subscribeBookmarkChanges(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener("bookmarks:changed", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("bookmarks:changed", handler);
    window.removeEventListener("storage", handler);
  };
}
