// 우상단 EN | KO 토글. 클라이언트 컴포넌트로 cookie/state 즉시 반영.

"use client";

import { useLocale, type Locale } from "@/lib/i18n";

export default function LangToggle() {
  const { locale, setLocale, t } = useLocale();

  const isEn = locale === "en";

  return (
    <div
      role="group"
      aria-label={t("nav.lang.toggleAria")}
      className="flex items-center text-[12px] tabular-nums"
      style={{ color: "var(--ink-3)" }}
    >
      <button
        type="button"
        onClick={() => setLocale("en" as Locale)}
        aria-pressed={isEn}
        className="px-1.5 py-0.5 rounded transition-opacity hover:opacity-100"
        style={{
          color: isEn ? "var(--ink)" : "var(--ink-3)",
          fontWeight: isEn ? 600 : 400,
          opacity: isEn ? 1 : 0.6,
        }}
      >
        {t("nav.lang.en")}
      </button>
      <span aria-hidden="true" style={{ color: "var(--line-2)" }}>
        |
      </span>
      <button
        type="button"
        onClick={() => setLocale("ko" as Locale)}
        aria-pressed={!isEn}
        className="px-1.5 py-0.5 rounded transition-opacity hover:opacity-100"
        style={{
          color: !isEn ? "var(--ink)" : "var(--ink-3)",
          fontWeight: !isEn ? 600 : 400,
          opacity: !isEn ? 1 : 0.6,
        }}
      >
        {t("nav.lang.ko")}
      </button>
    </div>
  );
}
