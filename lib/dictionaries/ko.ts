// 한국어 사전. 키는 flat dot-namespace 문자열 ("landing.headline.first" 등).
// en.ts와 EXACT 동일한 key 집합을 가져야 한다 — type system이 강제.
//
// source: a184f6c (전체 한국어화 commit)의 사용자-노출 카피.

export const ko = {
  // Nav · language toggle
  "nav.lang.en": "EN",
  "nav.lang.ko": "KO",
  "nav.lang.toggleAria": "언어 전환",

  // Landing (/next-step)
  "landing.eyebrow": "Next Step in Life",
  "landing.headline.first": "당신만의",
  "landing.headline.second": "90일 플랜",
  "landing.subcopy":
    "지금 어디에 있고 어디로 가고 싶은지 15개 질문에 답하면, Claude가 답을 토대로 일정에 맞는 주 단위 실행 플랜을 만들어줍니다.",
  "landing.framing": "예: 이직, 대학원, 창업, 이사, 관계… 인생의 갈림길 앞에서.",
  "landing.cta": "시작하기",
  "landing.meta.questions": "15개 질문",
  "landing.meta.duration": "약 5분",
  "landing.meta.poweredBy": "Claude 기반",
  "landing.section.whatYouGet": "플랜에 담기는 것",
  "landing.feature.rationale.title": "정직한 근거",
  "landing.feature.rationale.desc":
    "왜 이 플랜이 당신에게 맞는지 — 당신이 한 말을 그대로 인용하면서 설명합니다.",
  "landing.feature.weekly.title": "주 단위 실행",
  "landing.feature.weekly.desc":
    "3개월, 각 달의 테마와 일정에 맞춘 구체적인 주별 액션.",
  "landing.feature.today.title": "오늘 할 한 가지",
  "landing.feature.today.desc":
    "모든 플랜은 오늘 안에 시작할 수 있는 한 가지 첫걸음으로 끝납니다.",
} as const;
