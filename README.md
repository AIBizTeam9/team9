# Next Step in Life
> 두 개의 가능한 미래가 당신 대신 고민한다.
> AI가 만드는 인생 A/B 테스트.

**AIBizTeam9 (9조)** — *AI기반 비즈니스 진화: 전략 및 실습* (이지수 교수님), 2026

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Claude](https://img.shields.io/badge/Claude-Sonnet%204.6-d97757)](https://www.anthropic.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ecf8e)](https://supabase.com)
[![Tests](https://img.shields.io/badge/tests-157%20passing-2c8a3e)](#)
[![License](https://img.shields.io/badge/license-class--project-lightgrey)](#license)

**Live:** [next-step-in-life.vercel.app/next-step](https://next-step-in-life.vercel.app/next-step) · **Repo:** [github.com/AIBizTeam9/team9](https://github.com/AIBizTeam9/team9)

---

## ✦ 한 줄 소개
사용자의 현재 삶과 고민을 바탕으로 Claude가 **두 개의 대안 미래**를 시뮬레이션하고,
그 둘이 직접 **논쟁**하게 한 뒤, **90일 실행 플랜**으로 마무리하는 웹 서비스입니다.
사용자는 논쟁 중간에 **직접 끼어들어** 두 미래 중 한쪽으로서 자기 의견을 던질 수 있고,
다른 쪽 페르소나는 그 말에 실제로 반응합니다.

퀴즈 → 두 페르소나 생성 → 논쟁 (+ 사용자 참여) → 90일 플랜 → 진행 추적.

---

## ✦ 차별점 — ChatGPT 한 번의 대화와 무엇이 다른가
이 서비스의 차별점은 더 좋은 *모델*이 아니라, 모델을 감싼 더 좋은 *제품*에 있습니다.

| ChatGPT와의 대화 | Next Step in Life |
| --- | --- |
| 조언하는 하나의 목소리 | 두 미래 자아의 논쟁 |
| 사용자가 묻고 AI가 답함 | 사용자가 **두 자아 중 하나로 직접 발언 가능** — 상대 자아가 그 말에 반응 |
| 탭을 닫으면 사라짐 | 플랜 저장 · 진행 추적 · 캘린더 내보내기 |
| 환각될 수 있는 추천 링크 | 검증된 한국어 자료 라이브러리에서 큐레이션 |

---

## ✦ 사용자 피드백 → 출시된 코드
Week 11 이후 동료 49명이 남긴 피드백을 클러스터링하여 48시간 안에 8개의 PR로 출시했습니다.
모든 PR은 공개 추적 가능합니다.

| 피드백 주제 | 출시된 PR | 변경 사항 |
| --- | --- | --- |
| "디베이트가 쓱 지나간다" (#29) | PR [#44](https://github.com/AIBizTeam9/team9/pull/44) · PR [interactive-debate](https://github.com/AIBizTeam9/team9/pull/45) | 일시정지 / 빨리감기 / **사용자 끼어들기** 기능 |
| "일회성 도구 같다, 돌아올 이유가 없다" (#48) | PR [#27](https://github.com/AIBizTeam9/team9/pull/27) · [#28](https://github.com/AIBizTeam9/team9/pull/28) | 진행 트래커 (저널 · 연속 기록) + 캘린더(.ics) 내보내기 |
| "추천 URL 신뢰도?" (#9) | PR [#30](https://github.com/AIBizTeam9/team9/pull/30) | 환각 URL 제거 · 검증된 한국어 자료 30개로 큐레이션 |
| 시각적 완성도 / 안정성 | PR [#25](https://github.com/AIBizTeam9/team9/pull/25), [#26](https://github.com/AIBizTeam9/team9/pull/26), [#31](https://github.com/AIBizTeam9/team9/pull/31), [#43](https://github.com/AIBizTeam9/team9/pull/43) | 디베이트 채팅 UI · 페르소나 아바타 · API 레이트 리밋 · 한국어 출력 토큰 잘림 핫픽스 |

---

## ✦ 엔지니어링 — 측정된 품질 루프
`gstack /health` 감사를 세 번 측정한 실제 트렌드:

| 차수 | 점수 | 조치 |
| --- | --- | --- |
| 1차 (기준선) | **7.3** | 자동화 테스트 0개 · lint 4개 에러 발견 |
| 2차 (테스트 인프라 구축 후) | **8.4** | vitest 65개 추가 (.ics RFC-5545, 자료 라이브러리 보안 불변식, 연속 기록 수학) |
| 3차 (lint 정리 후) | **9.2** | 머지에서 사라졌던 수정 복원 · 7개 에러 → 0 |

현재 테스트 157개 / 157개 통과. PR [#34](https://github.com/AIBizTeam9/team9/pull/34) 의 테스트
인프라 추가로 회귀를 0.2초 안에 잡을 수 있게 되었습니다.

**규율 — 코드 품질을 어떻게 유지했나:**
- **진단 우선** — 프로덕션 버그 발생 시 코드 재작성 전에 실패 원인 진단 (예: PR [#43](https://github.com/AIBizTeam9/team9/pull/43) — `max_tokens` 두 줄 변경으로 해결)
- **종료 조건이 있는 루프** — `oh-my-claudecode` 의 `/ralph` 워크플로우로 머지 전 아키텍트 리뷰 강제
- **엄격한 응답 검증** — `/api/persona-debate-continue` 는 Claude가 잘못된 페르소나로 응답하면 502 반환 (테스트 20개로 게이트 검증)

---

## ✦ 주요 기능
- 🪞 **퀴즈** — 나이, 직업, 고민, 강점/약점, 꿈 등 실제 삶의 맥락 수집
- 🎭 **두 개의 페르소나** — 서로 다른 미래를 보여주는 캐릭터 카드 (DiceBear `notionists`)
- 💬 **페르소나 간 논쟁** — 대화형 채팅 UI · 일시정지 / 빨리감기 / **사용자 끼어들기**
- 📊 **근거 기반 추천** — 검증된 한국어 자료 라이브러리에서 큐레이션
- 🗓 **90일 실행 플랜** — 월별 테마 + 주차별 액션 + 난이도 티어 (오늘 한 가지 / 이번 주 / 이번 달 도약)
- ✅ **진행 추적** — 일일 저널 + 연속 기록 + 캘린더 내보내기 (로그인 시)

---

## ✦ 작동 원리
```
[사용자 퀴즈 답변]
        ↓  POST /api/personas
[Claude — 페르소나 생성 → 네 명의 대안 자아 (사용자가 2명 선택)]
        ↓  POST /api/persona-debate
[멀티턴 논쟁 — 두 페르소나가 사용자의 목소리로 직접 대화]
        ↓  (선택) POST /api/persona-debate-continue
[사용자 끼어들기 — 다른 페르소나가 사용자 발언에 응답하는 짧은 분기 생성]
        ↓  POST /api/generate-plan  (월1·월2·월3 + framing + resources 병렬 SSE 스트리밍)
[Claude — 90일 플랜 + 추천 리소스]
        ↓
[결과 렌더링 → 로그인 시 Supabase 저장 → 진행 추적]
```

---

## ✦ 기술 스택
| Layer | Tech |
| --- | --- |
| Framework | Next.js 16 (App Router) · React 19 · TypeScript |
| Styling | Tailwind CSS 4 · Instrument Serif / Inter / Noto Sans KR |
| LLM | **Claude Sonnet 4.6** (페르소나·플랜 생성) + **Claude Haiku 4.5** (사용자 끼어들기 응답) |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase (Postgres) · Prisma |
| Testing | vitest (157 tests) |
| 배포 | Vercel |

---

## ✦ 팀
이동근 · 강석빈 · 이재림 · 유지윤

---

<details>
<summary><strong>📦 개발자용 — 로컬 실행 / 프로젝트 구조 / 기여</strong></summary>

### Prerequisites
- **Node.js** 20.x 이상
- **Supabase** 프로젝트 (URL + anon key)
- **Anthropic API Key**

### 1. 클론 & 설치
```bash
git clone https://github.com/AIBizTeam9/team9.git
cd team9
npm install
```

### 2. 환경변수 (`.env.local` — **절대 커밋 금지**)
```bash
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

### 3. 실행
```bash
npx prisma generate
npm run dev
npm test           # vitest (157 tests)
```
브라우저에서 http://localhost:3000/next-step 접속.

### 프로젝트 구조
```
team9/
├── app/
│   ├── next-step/              # 핵심 플로우 (quiz → personas → loading → plan)
│   ├── account/                # 저장된 플랜 + 진행 추적
│   ├── api/                    # personas · persona-debate · persona-debate-continue · generate-plan · resources …
│   ├── auth/ · login/          # Supabase 인증
│   └── layout.tsx
├── components/                 # UI 컴포넌트 (plan-view, auth-button, nextstep/…)
├── lib/                        # supabase, auth, types, nextstep/ (db, 라이브러리)
├── prisma/                     # schema
└── README.md
```

### 주요 API 엔드포인트
| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/personas` | 퀴즈 답변 → 네 명의 페르소나 |
| POST | `/api/persona-debate` | 페르소나 2개 → 16턴 논쟁 |
| POST | `/api/persona-debate-continue` | 사용자 끼어들기 → 4턴 분기 (strict-drift gate) |
| POST | `/api/generate-plan` | 답변 + 페르소나 → 90일 플랜 (SSE 스트리밍) |
| GET  | `/api/resources` | 검증된 자료 라이브러리 (카테고리/키워드 필터) |
| GET  | `/api/health` | 헬스체크 |

### 기여 가이드
브랜치: `main`(보호) ← `feat/*` · `fix/*` · `docs/*` · `chore/*`. PR로만 머지.
[Conventional Commits](https://www.conventionalcommits.org/) 사용.

**PR 체크리스트**
- [ ] `npm run lint` 통과
- [ ] `npm run build` 통과
- [ ] `npm test` 통과 (157 tests)
- [ ] `.env` / 시크릿이 diff에 없음
- [ ] `main` 최신 상태와 동기화

</details>

---

## License
수업 과제로 개발된 프로젝트입니다. 팀의 동의 없이 상업적 용도로 사용될 수 없습니다.
