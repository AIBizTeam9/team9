"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, type DictKey } from "@/lib/i18n";

export default function NextStepLandingPage() {
  const { t } = useLocale();

  const features: { titleKey: DictKey; descKey: DictKey }[] = [
    {
      titleKey: "landing.feature.rationale.title",
      descKey: "landing.feature.rationale.desc",
    },
    {
      titleKey: "landing.feature.weekly.title",
      descKey: "landing.feature.weekly.desc",
    },
    {
      titleKey: "landing.feature.today.title",
      descKey: "landing.feature.today.desc",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
        {/* Eyebrow */}
        <p
          className="text-[11px] font-medium tracking-[0.1em] uppercase mb-8"
          style={{ color: "var(--ink-3)" }}
        >
          {t("landing.eyebrow")}
        </p>

        {/* Headline — maxWidth 720은 한국어 카피가 영어보다 살짝 길어 main에서 늘린 값 */}
        <h1
          className="font-serif text-center leading-[1.15] tracking-[-0.02em] mb-6"
          style={{
            color: "var(--ink)",
            fontSize: "clamp(42px, 7vw, 72px)",
            maxWidth: "720px",
          }}
        >
          {t("landing.headline.first")}
          <br />
          <span style={{ color: "var(--warm)" }}>
            {t("landing.headline.second")}
          </span>
        </h1>

        {/* Sub-copy */}
        <p
          className="text-center leading-relaxed mb-4"
          style={{
            color: "var(--ink-3)",
            fontSize: "16px",
            maxWidth: "460px",
          }}
        >
          {t("landing.subcopy")}
        </p>

        {/* Broad-engine framing (main에서 추가된 갈림길 예시) */}
        <p
          className="text-center mb-8"
          style={{
            color: "var(--ink-3)",
            fontSize: "13.5px",
            maxWidth: "460px",
          }}
        >
          {t("landing.framing")}
        </p>

        {/* Privacy reassurance — claims verified against current Supabase RLS,
            Anthropic API tier, codebase logging, and analytics deps. Collapsed
            default keeps the CTA above the fold on 1366×768. */}
        <PrivacyReassurance />

        {/* CTA */}
        <Link
          href="/next-step/quiz"
          className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-[15px] font-semibold text-white transition-opacity hover:opacity-85"
          style={{ background: "var(--warm)" }}
        >
          {t("landing.cta")}
          <span style={{ opacity: 0.7 }}>→</span>
        </Link>

        {/* Metadata row */}
        <div
          className="flex items-center gap-5 mt-10 text-[12px]"
          style={{ color: "var(--ink-3)" }}
        >
          <span>{t("landing.meta.questions")}</span>
          <span style={{ color: "var(--line-2)" }}>·</span>
          <span>{t("landing.meta.duration")}</span>
          <span style={{ color: "var(--line-2)" }}>·</span>
          <span>{t("landing.meta.poweredBy")}</span>
        </div>
      </main>

      {/* What you get section */}
      <section
        className="border-t px-6 py-16"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="max-w-[860px] mx-auto">
          <p
            className="text-[11px] font-medium tracking-[0.08em] uppercase mb-8 text-center"
            style={{ color: "var(--ink-3)" }}
          >
            {t("landing.section.whatYouGet")}
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.titleKey}
                className="rounded-2xl p-6"
                style={{
                  background: "var(--bg-2)",
                  border: "1px solid var(--line)",
                }}
              >
                <div
                  className="text-[22px] mb-3 font-serif leading-tight"
                  style={{ color: "var(--ink)" }}
                >
                  {t(f.titleKey)}
                </div>
                <p
                  className="text-[13px] leading-relaxed"
                  style={{ color: "var(--ink-3)" }}
                >
                  {t(f.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function PrivacyReassurance() {
  const [expanded, setExpanded] = useState(false);
  const bullets = [
    "저장된 플랜과 일일 저널은 본인 계정으로 로그인한 경우에만 보입니다",
    "Supabase에 저장되며, 저장된 데이터는 암호화됩니다",
    "AI 응답 생성을 위해 Anthropic API로 전달되며, Anthropic 상용 약관상 모델 학습에 사용되지 않습니다",
    "답변 본문은 서버 로그에 기록되지 않으며, 분석·광고용 외부 추적기를 사용하지 않습니다",
    "저장된 플랜은 계정 페이지에서 언제든 삭제하실 수 있습니다",
  ];

  return (
    <div
      className="w-full rounded-2xl mb-10 overflow-hidden"
      style={{
        maxWidth: "460px",
        background: "var(--warm-soft)",
        border: "1px solid var(--warm)",
        // 한국어가 단어 경계에서 깨지도록.
        wordBreak: "keep-all",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="privacy-reassurance-body"
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-opacity hover:opacity-80"
      >
        <span className="flex items-center gap-2 text-[13px] font-medium" style={{ color: "var(--ink)" }}>
          <span aria-hidden>🔒</span>
          답변은 안전하게 보관됩니다
        </span>
        <span
          className="text-[12px] shrink-0"
          style={{ color: "var(--warm)" }}
        >
          {expanded ? "접기 ↑" : "자세히 보기 →"}
        </span>
      </button>

      {expanded && (
        <div
          id="privacy-reassurance-body"
          className="px-4 pb-4 pt-1"
        >
          <p
            className="text-[12.5px] leading-relaxed mb-3"
            style={{ color: "var(--ink-2)" }}
          >
            답변이 사용자의 깊은 고민이라는 걸 알아요. 그래서:
          </p>
          <ul className="flex flex-col gap-2 mb-3">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex gap-2 text-[12.5px] leading-relaxed"
                style={{ color: "var(--ink-2)" }}
              >
                <span aria-hidden style={{ color: "var(--warm)" }}>•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <p
            className="text-[12.5px] leading-relaxed italic"
            style={{ color: "var(--ink-3)" }}
          >
            마음 편히 솔직하게 답해 주세요 — 그래야 더 잘 도와드릴 수 있어요.
          </p>
        </div>
      )}
    </div>
  );
}
