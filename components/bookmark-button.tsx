"use client";

import { useEffect, useState } from "react";
import {
  isBookmarked,
  toggleBookmark,
  subscribeBookmarkChanges,
  type Bookmark,
} from "@/lib/bookmarks";

type Props = {
  payload: Omit<Bookmark, "savedAt">;
  // 카드 우상단에 절대배치할 때 사용
  variant?: "inline" | "floating";
};

export default function BookmarkButton({ payload, variant = "inline" }: Props) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(isBookmarked(payload.kind, payload.itemId));
    sync();
    return subscribeBookmarkChanges(sync);
  }, [payload.kind, payload.itemId]);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(payload);
  };

  const base =
    "inline-flex items-center justify-center transition-all hover:opacity-80";
  const sizing =
    variant === "floating"
      ? "absolute top-3 right-3 w-8 h-8 rounded-full"
      : "w-7 h-7 rounded-full";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={saved ? "북마크 제거" : "북마크 저장"}
      title={saved ? "북마크 해제" : "북마크 저장"}
      className={`${base} ${sizing}`}
      style={{
        background: saved ? "var(--warm-soft)" : "var(--bg-2)",
        border: `1px solid ${saved ? "var(--warm)" : "var(--line)"}`,
        color: saved ? "var(--warm)" : "var(--ink-3)",
      }}
    >
      {saved ? (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          <path
            d="M3 1.5h8v11l-4-2.5-4 2.5z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          <path
            d="M3 1.5h8v11l-4-2.5-4 2.5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
