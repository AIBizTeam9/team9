"use client";

import { useState } from "react";
import Link from "next/link";
import { signInWithGoogle } from "@/lib/auth";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch {
      setError("로그인 중 문제가 발생했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--ink), var(--warm))" }}>
            <span className="w-[7px] h-[7px] rounded-full bg-white" />
          </div>
          <h1 className="font-serif text-2xl tracking-[-0.02em] mb-1" style={{ color: "var(--ink)" }}>
            Next Step in Life
          </h1>
          <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
            AI가 만들어주는 두 개의 미래를 만나보세요
          </p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "var(--bg-2)", border: "1px solid var(--line)", boxShadow: "var(--shadow)" }}>
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--bg)", border: "1px solid var(--line-2)", color: "var(--ink)" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {loading ? "로그인 중..." : "Google 계정으로 시작하기"}
          </button>

          {error && (
            <p className="mt-3 text-center text-[12px]" style={{ color: "var(--warm)" }}>
              {error}
            </p>
          )}

          <p className="mt-4 text-center text-[11px] leading-relaxed" style={{ color: "var(--ink-3)" }}>
            계속 진행하면{" "}
            <span style={{ color: "var(--ink-2)" }}>서비스 이용약관</span>에 동의하는 것으로 간주됩니다.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-[13px] hover:underline" style={{ color: "var(--ink-3)" }}>
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
