"use client";

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

        {/* Headline */}
        <h1
          className="font-serif text-center leading-[1.15] tracking-[-0.02em] mb-6"
          style={{
            color: "var(--ink)",
            fontSize: "clamp(42px, 7vw, 72px)",
            maxWidth: "700px",
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
          className="text-center leading-relaxed mb-12"
          style={{
            color: "var(--ink-3)",
            fontSize: "16px",
            maxWidth: "460px",
          }}
        >
          {t("landing.subcopy")}
        </p>

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
