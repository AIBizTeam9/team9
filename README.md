# Next Step in Life
> 두 개의 가능한 미래가 당신 대신 고민한다.
> AI가 만드는 인생 A/B 테스트.

**AIBizTeam9 (9조)** — *AI기반 비즈니스 진화: 전략 및 실습* (이지수 교수님), 2026

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Claude](https://img.shields.io/badge/Claude-Sonnet%204.6-d97757)](https://www.anthropic.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ecf8e)](https://supabase.com)
[![License](https://img.shields.io/badge/license-class--project-lightgrey)](#license)

**Live:** https://next-step-in-life.vercel.app/next-step

---

## ✦ 한 줄 소개
사용자의 현재 삶과 고민을 바탕으로, Claude가 **두 개의 대안 미래를 시뮬레이션**하고 그 둘이
직접 논쟁하게 한 뒤, 지금 당장 해야 할 **구체적인 다음 스텝**과 **90일 실행 플랜**을 제안하는
웹 서비스입니다.

퀴즈 → AI가 두 페르소나 생성 → 페르소나끼리 논쟁 → 최종 추천 + 90일 플랜 → 진행 상황 추적.

---

## ✦ 왜 그냥 ChatGPT/Claude와 대화하는 것과 다른가
이 서비스의 차별점은 더 좋은 *모델*이 아니라, 모델을 감싼 더 좋은 *제품*에 있습니다. 챗봇과의
한 번의 대화로는 구조적으로 어려운 것들을 제공합니다:

- **잊지 않는다** — 생성된 플랜을 저장하고, 진행 상황을 추적하며, 사용자가 실제로 실행했는지
  돌아봅니다. (대화창은 탭을 닫으면 사라집니다.)
- **지속 가능한 산출물** — 결과는 한 번 읽고 마는 텍스트가 아니라, 날짜가 매겨진 실행 플랜입니다.
- **근거 있는 추천** — 추천 리소스는 검증된 라이브러리에서 선별되어, 실제로 클릭되는 링크입니다.

---

## ✦ 주요 기능 / Features
- 🪞 **퀴즈** — 나이, 직업, 고민, 강점/약점, 꿈 등 실제 삶의 맥락 수집
- 🎭 **두 개의 페르소나** — 서로 다른 미래를 보여주는 캐릭터 카드 (DiceBear `notionists` 일러스트)
- 💬 **페르소나 간 논쟁** — 대화형 채팅 UI로 인사이트 도출
- 📊 **근거 기반 추천** — 검증된 리소스 라이브러리에서 선별
- 🗓 **90일 실행 플랜** — 월별 테마 + 주차별 액션 + 첫 걸음
- ✅ **진행 상황 추적** — 저장된 플랜에 대해 액션 체크 및 회고 기록 (로그인 시)

---

## ✦ 작동 원리 / How it works
```
[사용자 퀴즈 답변]
        ↓  POST /api/personas
[Claude — 페르소나 생성 → 두 명의 대안 자아 (A, B)]
        ↓  POST /api/persona-debate
[멀티턴 논쟁 — 두 페르소나가 서로에게 질문]
        ↓  POST /api/generate-plan  (월1·월2·월3 + framing + resources 병렬 생성)
[Claude — 90일 플랜 + 추천 리소스]
        ↓
[결과 렌더링 → 로그인 시 Supabase에 저장 → 진행 추적]
```

---

## ✦ 기술 스택 / Tech Stack
| Layer | Tech |
| --- | --- |
| Framework | Next.js 16 (App Router) · React 19 · TypeScript |
| Styling | Tailwind CSS 4 · Instrument Serif / Inter |
| LLM | **Claude Sonnet 4.6** (Anthropic API) |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase (Postgres) · Prisma |
| 아바타 | DiceBear (`notionists`) |
| 배포 | Vercel |

> **왜 Claude인가?** 수업 테마인 Claude Code와의 일관성, 그리고 멀티 페르소나 프롬프트 체이닝에
> Claude Sonnet 4.6가 강점이 있기 때문입니다.

---

## ✦ 프로젝트 구조 / Project Structure
```
team9/
├── app/
│   ├── next-step/              # 핵심 플로우 (quiz → personas → loading → plan)
│   ├── account/                # 저장된 플랜 + 진행 추적
│   ├── api/                    # personas · persona-debate · generate-plan · resources …
│   ├── auth/ · login/          # Supabase 인증
│   └── layout.tsx
├── components/                 # UI 컴포넌트 (plan-view, auth-button, nextstep/…)
├── lib/                        # supabase, auth, types, nextstep/ (db, 라이브러리)
├── prisma/                     # schema
└── README.md
```

---

## ✦ 시작하기 / Getting Started
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
```
브라우저에서 http://localhost:3000/next-step 접속.

---

## ✦ 주요 API 엔드포인트
| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/personas` | 퀴즈 답변 → 페르소나 |
| POST | `/api/persona-debate` | 페르소나 2개 → 논쟁 turns |
| POST | `/api/generate-plan` | 답변 + 페르소나 → 90일 플랜 (스트리밍) |
| GET  | `/api/resources` | 검증된 리소스 라이브러리 (카테고리/키워드 필터) |
| GET  | `/api/health` | 헬스체크 |

---

## ✦ 팀 / Team
이동근 / 강석빈 / 이재림 / 유지윤

---

## ✦ 기여 가이드 / Contributing
브랜치: `main`(보호) ← `feat/*` · `fix/*` · `docs/*` · `chore/*`. PR로만 머지.
[Conventional Commits](https://www.conventionalcommits.org/) 사용.

**PR 체크리스트**
- [ ] `npm run lint` 통과
- [ ] `npm run build` 통과
- [ ] `.env` / 시크릿이 diff에 없음
- [ ] `main` 최신 상태와 동기화

---

## License
수업 과제로 개발된 프로젝트입니다. 팀의 동의 없이 상업적 용도로 사용될 수 없습니다.
