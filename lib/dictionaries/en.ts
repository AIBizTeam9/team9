// English dictionary. Mirror of ko.ts — must keep EXACT same keys.
//
// source: current dongkeun (pre-Korean-migration) UI copy. Where a184f6c added
// a Korean-only line (e.g. landing.framing), an English equivalent is provided.

import type { ko } from "./ko";

// 타입 강제: en은 ko와 같은 key 집합 + string 값을 가져야 한다.
export const en: { [K in keyof typeof ko]: string } = {
  // Nav · language toggle
  "nav.lang.en": "EN",
  "nav.lang.ko": "KO",
  "nav.lang.toggleAria": "Switch language",

  // Landing (/next-step)
  "landing.eyebrow": "Next Step in Life",
  "landing.headline.first": "Your personalised",
  "landing.headline.second": "90-day plan",
  "landing.subcopy":
    "Answer 15 questions about where you are and where you want to go. Claude turns your answers into a concrete, week-by-week plan that fits your actual schedule.",
  "landing.framing":
    "For crossroads: a new job, grad school, starting up, moving, relationships.",
  "landing.cta": "Start the quiz",
  "landing.meta.questions": "15 questions",
  "landing.meta.duration": "~5 minutes",
  "landing.meta.poweredBy": "Powered by Claude",
  "landing.section.whatYouGet": "What you get",
  "landing.feature.rationale.title": "Honest rationale",
  "landing.feature.rationale.desc":
    "Claude explains exactly why it built this plan for you — citing your own words back.",
  "landing.feature.weekly.title": "Week-by-week actions",
  "landing.feature.weekly.desc":
    "Three months, each with a theme and concrete weekly actions sized to your schedule.",
  "landing.feature.today.title": "One thing to do today",
  "landing.feature.today.desc":
    "Every plan ends with a single first step you can take before the day is over.",
};
