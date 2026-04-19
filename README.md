# Next Step in Life: 

> AI와 대화하며 나에게 맞는 커리어를 탐색하는 서비스.
> A conversational AI career coach that helps you explore paths that actually fit who you are.

**AIBizTeam9** — *AI기반 비즈니스 진화: 전략 및 실습* (Prof. Jisoo Yi), 2026

[![Built with Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.11+-blue)](https://www.python.org)
[![License](https://img.shields.io/badge/license-class--project-lightgrey)](#license)

---

## ✦ 개요 / Overview

**AI Career Explorer**는 사용자가 자신의 강점, 가치관, 현재 상황을 AI 코치와 대화하면서 탐색하고, 그에 맞는 커리어 방향을 제안받을 수 있는 웹 서비스입니다.

A web service where users have an open conversation with an AI coach about their strengths, values, and current situation — and receive tailored career direction based on the conversation, not a static quiz.

**Why this, not another career quiz?** Most career tools ask 20 multiple-choice questions and spit out a label. Our hypothesis is that the *conversation itself* — the unexpected questions the AI asks, the things the user says out loud — is where the insight lives. GPT-4o lets us do that cheaply and at scale.

🔗 **Live prototype demo:** https://aibizteam9.github.io/next-step-in-life-demo/
📄 **Project manifesto:** [`docs/MANIFESTO.md`](docs/MANIFESTO.md)

---

## ✦ 주요 기능 / Features

- 💬 **Open-ended AI coaching chat** — no fixed question tree; the model adapts to what the user says
- 🎯 **Personalized career suggestions** — distilled from the conversation, not selected from a pre-defined list
- 🇰🇷 **Korean + English bilingual** — users can respond in either language
- ⚡ **Streaming responses** — feels like a real conversation, not a form submission
- 🔐 **Privacy-first** — no conversation storage by default

*(Features expand as we ship — see the project board for WIP items.)*

---

## ✦ 프로젝트 구조 / Project Structure

```text
team9/
├── app/                      # Next.js 16 프론트엔드 (App Router)
│   ├── page.tsx              # 메인 채팅 UI
│   ├── layout.tsx            # 공통 레이아웃
│   └── globals.css           # Tailwind + global styles
├── backend/
│   ├── main.py               # FastAPI 서버 (OpenAI proxy + prompt 관리)
│   └── requirements.txt      # Python 의존성
├── docs/
│   └── MANIFESTO.md          # 팀 원칙과 비전
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```

---

## ✦ 시작하기 / Getting Started

### Prerequisites

- **Node.js** 20.x or later ([nvm](https://github.com/nvm-sh/nvm) 추천)
- **Python** 3.11 or later
- **OpenAI API key** — *not required yet; will be needed once the LLM backend is wired up. Request one at [platform.openai.com](https://platform.openai.com/api-keys) when the time comes.*

### 1. Clone the repo

```bash
git clone https://github.com/AIBizTeam9/team9.git
cd team9
```

### 2. 환경변수 설정 / Environment variables

Once an OpenAI key is available, create a `.env.local` file in the project root (this file is gitignored — **never commit it**):

```bash
# .env.local
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_API_URL=http://localhost:15501
```

Until then, the frontend can run standalone against mocked backend responses.

### 3. Backend 실행 (port 15501)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 15501 --reload
```

Backend should now be running at `http://localhost:15501`. Visit `http://localhost:15501/docs` for the FastAPI interactive API docs.

### 4. Frontend 실행 (port 15500)

열린 새 터미널에서:

```bash
npm install
npm run dev -- --port 15500
```

Open [http://localhost:15500](http://localhost:15500) and start chatting.

---

## ✦ API 엔드포인트 / API Endpoints

| Method | Path        | Description                                        |
| ------ | ----------- | -------------------------------------------------- |
| `POST` | `/chat`     | Send a message, receive a streamed reply           |
| `POST` | `/summary`  | Distill the conversation into career suggestions   |
| `GET`  | `/health`   | Healthcheck                                        |

*(Update this table as the backend evolves.)*

---

## ✦ 기술 스택 / Tech Stack

| Layer       | Tech                                    |
| ----------- | --------------------------------------- |
| Frontend    | Next.js 16 · React 19 · Tailwind CSS 4  |
| Backend     | FastAPI · Uvicorn                       |
| LLM         | OpenAI GPT-4o-mini *(once keys active)* |
| Font        | Inter                                   |
| Deployment  | GitHub Pages *(prototype)* · Vercel + Fly.io *(planned)* |

---

## ✦ 팀 / Team

Jiyun Yoo, Dongkeun Yi, Jaerim Lee, Seokbin Kang

---

## ✦ 기여 가이드 / Contributing

### Branch 전략

- `main` — protected; only merges via PR
- `feat/*` — new features (e.g. `feat/streaming-chat`)
- `fix/*` — bug fixes
- `docs/*` — documentation-only changes
- `chore/*` — tooling, refactors, dependency bumps

### PR 체크리스트

Before opening a PR, make sure:

- [ ] `npm run lint` passes (frontend)
- [ ] Backend imports cleanly (`python -c "import main"` from `/backend`)
- [ ] No secrets or `.env` files in the diff
- [ ] Your branch is up to date with `main`
- [ ] The PR description explains *why*, not just *what*

### Commit message convention

We loosely follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add streaming response handling
fix: prevent empty message submission
docs: clarify backend setup steps
chore: bump next to 16.0.2
```

---

## ✦ 로드맵 / Roadmap

- [x] Basic chat UI (Next.js App Router)
- [x] FastAPI backend skeleton
- [x] Prototype demo deployed to GitHub Pages
- [ ] OpenAI API integration (awaiting key)
- [ ] Streaming responses
- [ ] Session summary → career recommendation output
- [ ] Final deployment (public production URL)
- [ ] User-facing landing page

See the [Projects tab](https://github.com/AIBizTeam9/team9/projects) for the live board.

---

## ✦ 수업 정보 / Class Info

This repo is the final team project for **AI기반 비즈니스 진화 — 전략 및 실습**, a master's course taught by **Prof. Jisoo Yi (이지수 교수님)**.

---

## License

This project is developed as coursework. Not licensed for production or commercial use without team consent.

