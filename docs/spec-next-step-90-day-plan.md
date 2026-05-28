# Spec: Next Step in Life — Single-Flow 90-Day Plan

## Goal

사용자가 15문항에 답하면 Claude가 두 개의 대안 미래 페르소나를 만들고, 사용자가 그중 하나를 골라 자신의 일정에 맞는 주별 90일 실행 플랜을 받는다. 이전에 흩어져 있던 여러 메뉴(시장 인사이트, 디베이트, 외부 리소스 등)는 비활성화하고, **한 줄짜리 단일 플로우**만 사용자에게 노출한다.

## Design Principles

1. **One door, one promise.** 랜딩(`/`)은 즉시 `/next-step`로 리다이렉트한다. 메뉴 선택 화면을 보여주지 않는다.
2. **Quiz + clarify.** 추상적·일반적인 텍스트 답변에는 LLM이 즉석에서 follow-up 1회만 던진다. 무한 캐묻기 금지.
3. **Plan, not advice.** 결과물은 "포기하지 마세요" 같은 조언이 아니라, 주(week) 단위로 쪼개진 구체적 액션 + 오늘 당장 할 한 가지여야 한다.
4. **Anonymous-first, persistent-second.** 비로그인 사용자도 끝까지 사용 가능 (sessionStorage). 로그인 사용자는 Supabase에 영구 저장.
5. **Korean-first copy.** 랜딩 헤드라인은 영문 디자인 톤을 유지하되, 본문/UI는 한국어 사용자가 1차 타깃.

## Active surface (현재 살아있는 메뉴)

```
/                       → redirect → /next-step
/next-step              랜딩 페이지 (Start the quiz CTA)
/next-step/quiz         15문항 퀴즈 (+ clarify follow-up)
/next-step/loading      페르소나 생성 대기
/next-step/personas     두 페르소나 카드 → 1개 선택
/next-step/plan         90일 플랜 결과
/login                  Supabase 매직링크 로그인
/account                내 정보
/account/next-step      과거 플랜 목록
/account/next-step/[id] 개별 플랜 + 진행률 기록
```

## User Flow

```
[ 랜딩 ]
   │  "Start the quiz →"
   ▼
[ /next-step/quiz ]  ───── 15문항 (text / textarea / number / choice)
   │   ▲
   │   │  추상적인 textarea 답변 6종(stuck, desiredChange, tried,
   │   │  strengths, struggles, feelsAlive)일 때만
   │   │  POST /api/clarify  →  needsFollowUp ? follow-up 1회 :  pass
   │   │
   ▼  sessionStorage["nextStep.answers"]
[ /next-step/loading ]
   │  POST /api/personas { answers }
   ▼  sessionStorage["nextStep.personas"]
[ /next-step/personas ]  → 카드 2장 중 선택
   │  sessionStorage["nextStep.selectedPersonas"]
   │  POST /api/plan { answers, persona }
   ▼  sessionStorage["nextStep.plan"]
[ /next-step/plan ]  → 결과 표시
   │
   │  (로그인 상태라면) Supabase next_step_plans INSERT
   ▼
[ /account/next-step/[id] ]  → 주별 진행률 기록
```

## API Contracts

| Method | Path                  | Purpose                                          | Owner |
| ------ | --------------------- | ------------------------------------------------ | ----- |
| POST   | `/api/clarify`        | textarea 답변 1회 follow-up 판단                 | 지윤  |
| POST   | `/api/personas`       | 답변 → 페르소나 2개 생성                         | 지윤  |
| POST   | `/api/plan`           | 답변 + 선택 페르소나 → 90일 플랜                 | 석빈  |
| GET    | `/api/health`         | 헬스체크 (Vercel/Fly 모니터링용)                 | 공용  |

### `POST /api/clarify`
```json
// req
{ "questionKey": "stuck", "questionText": "지금 무엇이 막혀 있나요?", "userAnswer": "그냥 좀 답답해요" }
// res
{ "needsFollowUp": true, "reason": "조금만 더 구체적으로 알려주시면…", "followUpQuestion": "구체적으로 어떤 상황에서 답답함을 느끼시나요?" }
```

### `POST /api/personas`
```json
// req
{ "answers": { "age": "29", "stuck": "…", … } }
// res
{ "personas": [ { "title": "…", "summary": "…", "dayInLife": "…", "tradeoffs": [...] }, { … } ] }
```

### `POST /api/plan`
```json
// req
{ "answers": {...}, "persona": { "title": "…", "summary": "…", ... } }
// res
{
  "rationale": "…",                              // 왜 이 플랜인지
  "months": [
    { "theme": "…", "weeks": [ { "actions": [...] }, ... ] },
    { ... }, { ... }
  ],
  "oneThingToday": "…"
}
```

## Data Model

### Client (sessionStorage)
| Key                                 | When set                  | When cleared                  |
| ----------------------------------- | ------------------------- | ----------------------------- |
| `nextStep.answers`                  | 마지막 퀴즈 답변 직후     | 새 퀴즈 시작 시               |
| `nextStep.personas`                 | `/api/personas` 응답      | 새 퀴즈 시작 시               |
| `nextStep.selectedPersonas`         | 페르소나 선택 시          | 새 퀴즈 시작 시               |
| `nextStep.plan`                     | `/api/plan` 응답          | 새 퀴즈 시작 시               |

### Server (Supabase — 로그인 사용자만)
```sql
next_step_plans (
  id          uuid pk,
  user_id     uuid fk → auth.users,
  answers     jsonb,         -- 퀴즈 응답 전체
  persona     jsonb,         -- 선택된 페르소나
  plan        jsonb,         -- /api/plan 응답
  progress    jsonb null,    -- 주별 체크/메모. 컬럼 없어도 동작해야 함.
  created_at  timestamptz default now()
)
```

## Quiz schema

- 총 15문항, 정의는 [lib/questions.ts](lib/questions.ts)
- 타입: `text | textarea | number | choice`
- `quickPicks`: text/textarea에 옵션 칩(단일/다중 선택) 부착
- `clarify` 대상 키: `stuck, desiredChange, tried, strengths, struggles, feelsAlive`
- 진행률 바는 `index` 기준 — follow-up이 떠도 막대는 안 움직임 (사용자 인식 일관성)

## Tech stack

- **Frontend:** Next.js 16 App Router · React 19 · Tailwind 4 · TypeScript strict
- **Backend:** Next.js Route Handlers (FastAPI 백엔드는 lab/voice 용도로만 유지)
- **LLM:** Anthropic Claude Sonnet 4.6
- **Auth/DB:** Supabase (magic link)
- **Ports:** dev 15500, backend 15501

## Out of scope (의도적으로 닫힌 메뉴)

다음 라우트는 코드는 존재하지만 네비게이션에서 제거되어 있고, 신규 트래픽을 보내지 않는다. 실험·아카이브 용도.

| Path                  | Status               | Note                                  |
| --------------------- | -------------------- | ------------------------------------- |
| `/quiz`, `/plan`      | Legacy               | next-step 도입 전 구버전              |
| `/debate`             | Archived             | 페르소나 디베이트 — 단일 플로우로 축소 |
| `/market`, `/resources` | Archived           | 시장 인사이트 / 외부 데이터 허브       |
| `/letter`, `/rolemodel` | Experimental       | 미래자아 편지 / 롤모델 매칭            |
| `/whytree`            | External tool        | 별도 서브프로젝트                      |
| `/lab/voice`          | Experimental         | 음성 챗 — FastAPI 백엔드 사용         |

## Open questions

1. **Follow-up 답변을 페르소나 생성에 포함시킬지** — 현재 키는 `${q.k}_followup`로 저장만 됨. 페르소나/플랜 프롬프트에 합칠지 미정.
2. **익명 사용자 플랜 보존** — 현재 비로그인은 새로고침하면 날아감. URL 공유 토큰으로 살릴지?
3. **다시 받기 UX** — 같은 답변으로 다른 페르소나/플랜을 재생성하는 동선이 없음. 추가할지?
4. **Mobile** — 퀴즈 textarea는 모바일에서 키보드 가림 이슈 잠재. 따로 검증 필요.

## Success criteria

- 첫 방문자가 랜딩 → 플랜까지 5분 안에 끝낸다 (랜딩 카피의 약속).
- 플랜 결과에 사용자가 한 표현이 1회 이상 그대로 인용된다 ("Honest rationale" 약속).
- 90일 끝에 사용자가 "이 플랜대로 했더니 X가 됐다"고 말할 수 있다 — 추상 조언이 아니라 액션.
