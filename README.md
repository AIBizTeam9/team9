# Next Step in Life

> 두 개의 가능한 미래가 당신 대신 고민한다.
> AI가 만드는 인생 A/B 테스트.

**AIBizTeam9 (9조)** — *AI기반 비즈니스 진화: 전략 및 실습* (이지수 교수님), 2026

[![Built with Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Claude API](https://img.shields.io/badge/Claude-Sonnet%204.6-d97757)](https://www.anthropic.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black)](https://next-step-in-life.vercel.app)
[![License](https://img.shields.io/badge/license-class--project-lightgrey)](#license)

🔗 **라이브 사이트:** https://next-step-in-life.vercel.app/

---

## ✦ 한 줄 소개

사용자의 현재 삶과 고민을 바탕으로, LLM이 **두 개의 대안 미래를 시뮬레이션**하고 그 둘이 직접 대화하게 만든 뒤, 사용자에게 지금 당장 해야 할 **구체적인 다음 스텝**을 제안하는 웹 서비스입니다.

세 개의 메뉴로 구성됩니다:
1. **90일 플랜** (`/next-step`) — 15문항 퀴즈에서 두 미래 페르소나를 시뮬레이션하고 90일 액션 플랜을 생성
2. **미래의 나에게 편지** (`/letter`) — 미래의 자신에게 편지를 쓰고 AI 응답을 받음 *(개발 중)*
3. **세 번째 메뉴** — 멘토 매칭 컨셉이 스코프 초과로 재설계 중

---

## ✦ 이 아이디어를 선택한 이유 / Why this idea

팀 내부에서 여러 아이디어를 검토했는데 대부분이 모두 **규칙 기반 input-output 프로젝트**로, 사실상 고급 엑셀 기법이나 SQL만으로도 구현이 가능하다는 결론에 도달했습니다. 
"AI를 활용한다"는 수업의 목적에 완전히 부합하지 않는다고 판단했습니다.

저희는 이 수업의 목표를 다음과 같이 이해했습니다:

1. **바이브코딩(vibe coding)을 활용해서 사람들이 실제로 사용 가능한 서비스를 만드는 것**이 가장 큰 목적이다.
2. 그 과정에서 **AI와 더 친해지고, AI를 활용해서 빌드하는 경험**을 쌓는 것이 중요하다.
3. 따라서 rule-based 데이터 입/출력으로 가능한 프로젝트가 아닌, 요즘 가장 화두인 **LLM 프롬프트를 여러 개 결합하여 고객에게 최적화된 결과값을 출력**해주는 것이 시의성에 더 맞다.

**Next Step in Life**는 이 기준을 모두 충족합니다:

| 기준 | 충족 여부 |
| --- | --- |
| LLM이 없으면 아예 불가능한 프로젝트인가? | ✅ 두 자아 시뮬레이션 + 프롬프트 체이닝의 결과물 |
| 사용자가 실제로 쓸 만한가? | ✅ 인생 고민은 누구에게나 있음 → 공유·바이럴 요소 내재 |
| 바이브코딩 연습이 되는가? | ✅ Claude Code + GitHub + API 통합을 풀스택으로 경험 |
| 수업 기간(약 4주) 내 완성 가능한가? | ✅ 메뉴 1 라이브 배포 완료 |

---

## ✦ 메뉴 / Menus

### 1. 90일 플랜 — `/next-step`
**담당:** 유지윤 (`jiyun`) · **상태:** 라이브 배포 완료

15문항 퀴즈에 답하면 Claude가 두 미래 페르소나(Future A: 현재 경로 / Future B: 갈망의 경로)를 내부적으로 시뮬레이션하고, 그 토론에서 emerged한 사용자 맞춤 90일 액션 플랜(3 month × 4 week × actions, resources, first step)을 생성합니다.

흐름:
- `/next-step` — 진입 화면
- `/next-step/quiz` — 한 화면에 한 질문씩, 15문항 (진행률 바)
- `/next-step/loading` — Anthropic API 호출 + 로딩 메시지 cycling
- `/next-step/plan` — 생성된 플랜 렌더링 (headline · rationale · coreInsight · monthly themes · weekly actions · resources · first step)

핵심 파일: `app/next-step/`, `app/api/generate-plan/route.ts`, `lib/questions.ts`, `lib/types.ts`, `scripts/test-plan.ts`

### 2. 미래의 나에게 편지 — `/letter`
**담당:** 강석빈 (`seokbin`) · **상태:** 개발 중

[석빈이 직접 작성 예정]

### 3. 세 번째 메뉴 — TBD
**담당:** 이재림 (`jaerim`) · **상태:** 메뉴 재설계 중

원래 멘토 매칭 컨셉이었으나 스코프 초과로 다른 방향 모색 중. 
우선 롤모델 매칭하는 기능을 구현해볼 예정. 

---

## ✦ 작동 원리 / How it works (90일 플랜 기준)

```text
[사용자 퀴즈 답변 15개]
        ↓
[Claude Sonnet 4.6 — 시스템 프롬프트가 두 미래 페르소나를 내부적으로 시뮬레이션]
        ↓
[페르소나 토론이 prose 필드(rationale · coreInsight)에 녹아듦]
        ↓
[Plan JSON 생성 — headline · rationale · coreInsight · 3 months × 4 weeks · resources · firstStep]
        ↓
[클라이언트에서 sessionStorage로 받아 시각화]
```

JSON 스키마는 `lib/types.ts:Plan` 참고.

---

## ✦ 기술 스택 / Tech Stack

| Layer | Tech |
| --- | --- |
| Frontend | Next.js 16 · React 19 · Tailwind CSS 4 |
| Backend | Next.js API Routes (서버 컴포넌트) |
| LLM | **Claude Sonnet 4.6** (Anthropic API · `@anthropic-ai/sdk`) |
| 데이터 | sessionStorage (현재) · Supabase (예정) |
| Font | Inter · Instrument Serif |
| 배포 | **Vercel** ([next-step-in-life.vercel.app](https://next-step-in-life.vercel.app)) |

**왜 Claude인가?** 수업의 테마인 Claude Code와 일관성을 유지하고, 본 프로젝트의 핵심인 멀티 페르소나 프롬프트 체이닝에 Claude Sonnet 4.6가 특히 강점이 있기 때문입니다.

---

## ✦ 프로젝트 구조 / Project Structure

```text
team9/
├── app/
│   ├── next-step/                    # 메뉴 1: 90일 플랜 (jiyun)
│   │   ├── page.tsx
│   │   ├── quiz/page.tsx
│   │   ├── loading/page.tsx
│   │   └── plan/page.tsx
│   ├── letter/                       # 메뉴 2: 미래의 나에게 (seokbin)
│   ├── api/
│   │   └── generate-plan/route.ts    # 90일 플랜 API
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── questions.ts                  # 15문항 정의
│   └── types.ts                      # Plan, Answers, PlanMonth 등 타입
├── scripts/
│   └── test-plan.ts                  # 90일 플랜 API 테스트 스크립트
├── docs/
│   └── jiyun.md                      # 90일 플랜 spec
├── middleware.ts
├── .env.example
├── package.json
└── README.md
```

---

## ✦ 시작하기 / Getting Started

### Prerequisites
- **Node.js** 20.x 이상 ([nvm](https://github.com/nvm-sh/nvm) 추천)
- **Anthropic API Key** — [console.anthropic.com](https://console.anthropic.com)에서 발급. 팀 내부 채널에서 .env 공유 받기.

### 1. Repo 클론 & 설치
```bash
git clone https://github.com/AIBizTeam9/team9.git
cd team9
npm install
```

### 2. 환경변수 설정
프로젝트 루트에 `.env.local` 파일 생성 (gitignore 포함, **절대 커밋 금지**):

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

`.env.example`을 템플릿으로 참고.

### 3. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

### 4. 90일 플랜 API 단독 테스트 (선택)
```bash
npx tsx scripts/test-plan.ts
```

Sarah Kim 테스트 데이터로 Anthropic API를 호출하고 Plan JSON을 출력합니다.

---

## ✦ API 엔드포인트

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/generate-plan` | 90일 플랜 — `Answers` JSON → `Plan` JSON |

(메뉴 2, 3의 API 엔드포인트는 각자 추가)

---

## ✦ 팀 / Team

| 이름 | 담당 | 브랜치 |
| --- | --- | --- |
| 이동근 | 환경 셋업 · Vercel 배포 · 인프라 | `dongkeun` |
| 강석빈 | 메뉴 2: 미래의 나에게 | `seokbin` |
| 이재림 | 메뉴 3: TBD | `jaerim` |
| 유지윤 | 메뉴 1: 90일 플랜 | `jiyun` |

---

## ✦ 기여 가이드 / Contributing

### 브랜치 전략
- `main` — 보호됨. PR을 통해서만 머지
- 각 팀원은 자신의 이름을 브랜치명으로 사용 (`jiyun`, `seokbin`, `jaerim`, `dongkeun`)
- PR 머지 전 팀 리뷰 필수

### PR 체크리스트
- [ ] `npm run lint` 통과
- [ ] `npx tsc --noEmit` — 타입 에러 없음
- [ ] `.env.local` 또는 시크릿이 diff에 없음
- [ ] `main` 최신 상태와 동기화
- [ ] PR 설명에 *무엇* 뿐 아니라 *왜* 포함

### 커밋 메시지 규칙
[Conventional Commits](https://www.conventionalcommits.org/) 사용. 한국어 본문 OK:

---

## ✦ 로드맵

- [x] 프로토타입 HTML 데모 (GitHub Pages)
- [x] 팀 합의 및 아이디어 확정
- [x] Next.js + Tailwind 스캐폴딩
- [x] Anthropic API 연동
- [x] **메뉴 1: 90일 플랜** — 퀴즈 + API + 플랜 렌더링 + 두 미래 페르소나 시뮬레이션
- [x] **Vercel 프로덕션 배포** ([next-step-in-life.vercel.app](https://next-step-in-life.vercel.app))
- [ ] 메뉴 2: 미래의 나에게 편지
- [ ] 메뉴 3: 세 번째 메뉴 결정 + 구현
- [ ] 90일 플랜 Approach B: 페르소나 공개 페이지 + 토론 시각화
- [ ] 최종 발표 자료

[Projects 탭](https://github.com/AIBizTeam9/team9/projects)에서 실시간 진행 상황 확인.

---

## ✦ 수업 정보 / Class Info

이 레포는 **AI기반 비즈니스 진화 — 전략 및 실습** 수업(이지수 교수님)의 최종 팀 프로젝트입니다.

---

## License

수업 과제로 개발된 프로젝트입니다. 팀의 동의 없이 상업적 용도로 사용될 수 없습니다.

---

## ✦ CI/CD 파이프라인

1. **개발 및 배포 파이프라인** : [VS Code] (개발) ── git push ──> [GitHub] (저장) ── Webhook ──> [Vercel] (배포)
2. **서비스 연동 및 인증** : [Vercel] (App) <──> [Supabase] (DB/Auth) <──> [Google Auth] (Social Login)
