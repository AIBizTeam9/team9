"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { getUser, onAuthChange, signOut } from "@/lib/auth";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getUser().then((u) => {
      setUser(u);
      setLoading(false);
    });

    const { data } = onAuthChange((u) => {
      setUser(u as User | null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: "var(--accent-2)" }} />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all"
        style={{ background: "var(--ink)", color: "var(--bg)" }}
      >
        로그인
      </Link>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url;
  const name = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "사용자";

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg transition-all hover:bg-[var(--accent-2)]"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: "var(--warm)" }}>
            {name[0]}
          </div>
        )}
        <span className="text-[13px] max-w-[100px] truncate hidden sm:block" style={{ color: "var(--ink-2)" }}>
          {name}
        </span>
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-48 rounded-xl py-1.5 z-50"
            style={{ background: "var(--bg-2)", border: "1px solid var(--line)", boxShadow: "var(--shadow)" }}
          >
            <div className="px-3 py-2 border-b" style={{ borderColor: "var(--line)" }}>
              <p className="text-[12px] font-medium truncate" style={{ color: "var(--ink)" }}>{name}</p>
              <p className="text-[11px] truncate" style={{ color: "var(--ink-3)" }}>{user.email}</p>
            </div>
            <Link
              href="/account"
              onClick={() => setMenuOpen(false)}
              className="block w-full text-left px-3 py-2 text-[13px] transition-colors hover:bg-[var(--accent-2)]"
              style={{ color: "var(--ink-2)" }}
            >
              내 정보
            </Link>
            <div className="my-1 border-t" style={{ borderColor: "var(--line)" }} />
            <button
              onClick={async () => {
                await signOut();
                setMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-[13px] transition-colors hover:bg-[var(--accent-2)]"
              style={{ color: "var(--warm)" }}
            >
              로그아웃
            </button>
          </div>
        </>
      )}
    </div>
  );
}
