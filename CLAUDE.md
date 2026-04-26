# CLAUDE.md

Claude Code가 이 프로젝트를 다룰 때 참고하는 컨텍스트 파일입니다.

## Project

**Next Step in Life** — An AI-powered A/B Test of Possible Futures

사용자의 퀴즈 답변을 받아 두 개의 대안 미래 페르소나를 LLM으로 생성하고, 두 자아의 대화를 통해 인사이트를 도출한 뒤, 개인화된 90일 실행 플랜을 제안하는 웹 서비스입니다.

프로토타입 데모: https://aibizteam9.github.io/next-step-in-life-demo/

## Class context

**AI기반 비즈니스 진화 — 전략 및 실습** (이지수 교수님) 수업의 최종 팀 프로젝트입니다.
9조: AIBizTeam9 — 지윤, 재림, 동근, 석빈.

핵심 목표:

1. 바이브코딩(vibe coding)으로 실사용 가능한 서비스를 빌드하는 것
2. Claude Code, GitHub 등 AI 개발 환경에 익숙해지는 것
3. 규칙 기반 I/O가 아닌, LLM 프롬프트 체이닝으로만 가능한 가치 창출

## Tech stack

- **Frontend:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · TypeScript
- **Backend:** FastAPI · Uvicorn · Python 3.11+
- **LLM:** Claude Sonnet 4.6 (Anthropic API)
- **Deploy:** GitHub Pages (프로토타입), Vercel + Fly.io (계획)

포트: 프론트 `15500`, 백엔드 `15501`.

## Repo layout

```text
app/         — Next.js 프론트엔드 (App Router)
backend/     — FastAPI 서버
docs/        — 팀 문서 (MANIFESTO.md 등)
.env.local   — 로컬 환경변수 (gitignored)
```

## Conventions

### Code style

- **Frontend:** TypeScript strict mode, 함수형 컴포넌트 + React hooks
- **Backend:** Python 3.11 type hints. Pydantic 모델로 request/response 스키마 명시
- **Imports:** 절대 경로 (Next.js `@/` alias)
- **Styling:** Tailwind utility classes. 커스텀 CSS는 최소화
- **주석:** 왜(why)를 설명하되, 뭘(what)을 반복하지 않음

### Git

- `main` 브랜치는 보호됨. 직접 푸시 금지, PR 필수
- 브랜치 이름: `feat/*`, `fix/*`, `docs/*`, `chore/*`
- 커밋 메시지: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- PR 템플릿(`.github/PULL_REQUEST_TEMPLATE.md`)을 꼭 채워서 올릴 것

### Secrets

- `.env.local`은 절대 커밋하지 않음
- 새 환경변수를 추가하면 `.env.example`에도 반영할 것
- API 키가 코드에 하드코딩된 걸 발견하면 먼저 경고하고 제거 제안

## Current roadmap

- [x] 프로토타입 HTML 데모 (GitHub Pages 배포)
- [x] 팀 아이디어 확정, README/CLAUDE.md 작성
- [ ] Anthropic API 연동 (Claude key 발급 대기)
- [ ] `/personas` 엔드포인트: 퀴즈 답변 → 페르소나 2개 생성
- [ ] `/debate` 엔드포인트: 페르소나 → 스트리밍 대화
- [ ] `/plan` 엔드포인트: 대화 결과 → 90일 플랜
- [ ] 프론트엔드 3단계 UI 연결
- [ ] 프로덕션 배포

## Commands Claude Code can run

```bash
# Install
npm install
cd backend && pip install -r requirements.txt

# Dev servers (two terminals)
npm run dev -- --port 15500
cd backend && uvicorn main:app --host 0.0.0.0 --port 15501 --reload

# Lint / typecheck
npm run lint
npx tsc --noEmit

# Git / PR (requires `gh auth login`)
gh pr create --web
```

## Don'ts

- 새 라이브러리 추가 전에 이미 설치된 것으로 가능한지 먼저 확인할 것
- `any`/`unknown` 타입 남발하지 말 것 — 구체적인 타입 정의 선호
- 백엔드 응답을 프론트에서 신뢰하지 않고 Zod/Pydantic으로 런타임 검증
- UI 카피를 영어로만 쓰지 말 것 — 한국어 사용자 대상이므로 한글 포함

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. The
skill has multi-step workflows, checklists, and quality gates that produce better
results than an ad-hoc answer. When in doubt, invoke the skill. A false positive is
cheaper than a false negative.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke /office-hours
- Strategy, scope, "think bigger", "what should we build" → invoke /plan-ceo-review
- Architecture, "does this design make sense" → invoke /plan-eng-review
- Design system, brand, "how should this look" → invoke /design-consultation
- Design review of a plan → invoke /plan-design-review
- Developer experience of a plan → invoke /plan-devex-review
- "Review everything", full review pipeline → invoke /autoplan
- Bugs, errors, "why is this broken", "this doesn't work" → invoke /investigate
- Test the site, find bugs, "does this work" → invoke /qa (or /qa-only for report only)
- Code review, check the diff, "look at my changes" → invoke /review
- Visual polish, design audit, "this looks off" → invoke /design-review
- Developer experience audit, try onboarding → invoke /devex-review
- Ship, deploy, create a PR, "send it" → invoke /ship
- Merge + deploy + verify → invoke /land-and-deploy
- Configure deployment → invoke /setup-deploy
- Post-deploy monitoring → invoke /canary
- Update docs after shipping → invoke /document-release
- Weekly retro, "how'd we do" → invoke /retro
- Safety mode, careful mode, lock it down → invoke /careful or /guard
- Restrict edits to a directory → invoke /freeze or /unfreeze
- Upgrade gstack → invoke /gstack-upgrade
- Save progress, "save my work" → invoke /context-save
- Resume, restore, "where was I" → invoke /context-restore
- Security audit, OWASP, "is this secure" → invoke /cso
- Make a PDF, document, publication → invoke /make-pdf
- Launch real browser for QA → invoke /open-gstack-browser
- Import cookies for authenticated testing → invoke /setup-browser-cookies
- Performance regression, page speed, benchmarks → invoke /benchmark
- Review what gstack has learned → invoke /learn
- Tune question sensitivity → invoke /plan-tune
- Code quality dashboard → invoke /health
