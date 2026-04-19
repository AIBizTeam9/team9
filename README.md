# Next Step in Life

> 두 개의 가능한 미래가 당신 대신 고민한다.
> AI가 만드는 인생 A/B 테스트.

**AIBizTeam9 (9조)** — *AI기반 비즈니스 진화: 전략 및 실습* (이지수 교수님), 2026

[![Built with Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Claude API](https://img.shields.io/badge/Claude-Sonnet%204.6-d97757)](https://www.anthropic.com)
[![License](https://img.shields.io/badge/license-class--project-lightgrey)](#license)

🔗 **프로토타입 데모:** https://aibizteam9.github.io/next-step-in-life-demo/

---

## ✦ 한 줄 소개

사용자의 현재 삶과 고민을 바탕으로, LLM이 **두 개의 대안 미래를 시뮬레이션**하고 그 둘이 직접 대화하게 만든 뒤, 사용자에게 지금 당장 해야 할 **구체적인 다음 스텝**을 제안하는 웹 서비스입니다.

간단한 퀴즈 → AI가 두 개의 지브리풍 페르소나 생성 → 페르소나끼리 논쟁 → 최종 추천과 90일 실행 플랜.

---

## ✦ 이 아이디어를 선택한 이유 / Why this idea

팀 내부에서 여러 아이디어를 검토했습니다:

- HR 데이터베이스를 활용한 프로젝트 매니저 추천 시스템
- 소개팅 앱 데이터를 활용한 3:3 미팅 매칭
- 그 외 다수

그러나 위 아이디어들은 모두 **규칙 기반 input-output 프로젝트**로, 사실상 고급 엑셀 기법이나 SQL만으로도 구현이 가능하다는 결론에 도달했습니다. "AI를 활용한다"는 수업의 목적에 완전히 부합하지 않는다고 판단했습니다.

저희는 이 수업의 목표를 다음과 같이 이해했습니다:

1. **바이브코딩(vibe coding)을 활용해서 사람들이 실제로 사용 가능한 서비스를 만드는 것**이 가장 큰 목적이다.
2. 그 과정에서 **AI와 더 친해지고, AI를 활용해서 빌드하는 경험**을 쌓는 것이 중요하다.
3. 따라서 rule-based 데이터 입/출력으로 가능한 프로젝트가 아닌, 요즘 가장 화두인 **LLM 프롬프트를 여러 개 결합하여 고객에게 최적화된 결과값을 출력**해주는 것이 시의성에 더 맞다.

**Next Step in Life**는 이 기준을 모두 충족합니다:

| 기준 | 충족 여부 |
| --- | --- |
| LLM이 없으면 아예 불가능한 프로젝트인가? | ✅ 두 자아 시뮬레이션 + 대화 + 웹 리서치는 프롬프트 체이닝의 결과물 |
| 사용자가 실제로 쓸 만한가? | ✅ 인생 고민은 누구에게나 있음 → 공유·바이럴 요소 내재 |
| 바이브코딩 연습이 되는가? | ✅ Claude Code + GitHub + API 통합을 풀스택으로 경험 |
| 수업 기간(약 4주) 내 완성 가능한가? | ✅ 프로토타입은 이미 작동 중 |

---

## ✦ 주요 기능 / Features

- 🪞 **15문항 퀴즈** — 나이, 직업, 고민, 강점/약점, 꿈 등 실제 삶의 맥락 수집
- 🎭 **두 개의 지브리풍 페르소나** — 서로 다른 미래를 시각적으로 보여주는 캐릭터 카드
- 💬 **페르소나 간 실시간 논쟁** — 약 20개 메시지의 대화로 인사이트 도출
- 📊 **근거 기반 추천** — 웹 리서치로 뒷받침된 통계 + 구체적 답
- 🗓 **90일 실행 플랜** — 실제로 클릭 가능한 링크와 타임라인 제공

---

## ✦ 작동 원리 / How it works

```text
[사용자 퀴즈 답변 15개]
        ↓
[Claude Sonnet 4.6 — 페르소나 생성 프롬프트]
        ↓
[두 명의 대안 자아 생성 (Persona A, B)]
        ↓
[멀티턴 대화 루프 — 두 페르소나가 서로에게 질문]
        ↓
[Claude — 대화에서 핵심 인사이트 추출]
        ↓
[웹 리서치 툴 호출 — 근거 통계 수집]
        ↓
[90일 플랜 생성 프롬프트]
        ↓
[사용자에게 시각적 결과 렌더링]
```

---

## ✦ 기술 스택 / Tech Stack

| Layer | Tech |
| --- | --- |
| Frontend | Next.js 16 · React 19 · Tailwind CSS 4 |
| Backend | FastAPI · Uvicorn |
| LLM | **Claude Sonnet 4.6** (Anthropic API) |
| 이미지 생성 | Stable Diffusion XL + Ghibli LoRA *(옵션)* |
| Font | Inter · Instrument Serif |
| 배포 | GitHub Pages *(프로토타입)* · Vercel + Fly.io *(예정)* |

**왜 Claude인가?** 수업의 테마인 Claude Code와 일관성을 유지하고, 본 프로젝트의 핵심인 멀티 페르소나 프롬프트 체이닝에 Claude Sonnet 4.6가 특히 강점이 있기 때문입니다.

---

## ✦ 프로젝트 구조 / Project Structure

```text
team9/
├── app/                      # Next.js 16 프론트엔드 (App Router)
│   ├── page.tsx              # 메인 퀴즈/결과 UI
│   ├── layout.tsx            # 공통 레이아웃
│   └── globals.css           # Tailwind + 전역 스타일
├── backend/
│   ├── main.py               # FastAPI 서버 (Claude API 프록시 + 프롬프트 관리)
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

- **Node.js** 20.x 이상 ([nvm](https://github.com/nvm-sh/nvm) 추천)
- **Python** 3.11 이상
- **Anthropic API Key** — *아직 발급 전. 백엔드 LLM 연동 단계에서 [console.anthropic.com](https://console.anthropic.com)에서 발급 예정*

### 1. Repo 클론

```bash
git clone https://github.com/AIBizTeam9/team9.git
cd team9
```

### 2. 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성 (이 파일은 gitignore에 포함되어 있으며 **절대 커밋 금지**):

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_API_URL=http://localhost:15501
```

API 키가 준비되기 전까지는 프론트엔드를 백엔드 Mock 응답과 함께 단독 실행 가능합니다.

### 3. 백엔드 실행 (port 15501)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 15501 --reload
```

API 문서: `http://localhost:15501/docs`

### 4. 프론트엔드 실행 (port 15500)

새 터미널에서:

```bash
npm install
npm run dev -- --port 15500
```

브라우저에서 [http://localhost:15500](http://localhost:15500) 접속.

---

## ✦ API 엔드포인트

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/personas` | 퀴즈 답변 → 두 페르소나 JSON 반환 |
| `POST` | `/debate` | 페르소나 2개 → 스트리밍 대화 생성 |
| `POST` | `/plan` | 대화 결과 → 추천 + 90일 플랜 |
| `GET` | `/health` | 헬스체크 |

*(백엔드 구현에 따라 업데이트 예정)*

---

## ✦ 팀 / Team

이동근 / 강석빈 / 이재림 / 유지윤


---

## ✦ 기여 가이드 / Contributing

### 브랜치 전략

- `main` — 보호됨. PR 통해서만 머지
- `feat/*` — 신규 기능 (예: `feat/persona-generation`)
- `fix/*` — 버그 픽스
- `docs/*` — 문서 변경
- `chore/*` — 도구·리팩토링·의존성 업데이트

### PR 체크리스트

- [ ] `npm run lint` 통과
- [ ] 백엔드 임포트 정상 (`python -c "import main"`)
- [ ] `.env` 또는 시크릿이 diff에 없음
- [ ] `main` 최신 상태와 동기화
- [ ] PR 설명에 *무엇* 뿐 아니라 *왜* 포함

### 커밋 메시지 규칙

[Conventional Commits](https://www.conventionalcommits.org/) 사용:

```
feat: 두 페르소나 생성 프롬프트 추가
fix: 빈 메시지 전송 방지
docs: 백엔드 셋업 단계 보완
chore: next 버전 16.0.2로 업데이트
```

---

## ✦ 로드맵

- [x] 프로토타입 HTML 데모 (GitHub Pages 배포 완료)
- [x] 팀 합의 및 아이디어 확정
- [x] 기본 Next.js + FastAPI 스캐폴딩
- [ ] Anthropic API 연동 (Claude key 발급 후)
- [ ] 페르소나 생성 프롬프트 확정
- [ ] 멀티턴 대화 루프 구현
- [ ] 웹 리서치 툴 호출 연동
- [ ] 90일 플랜 생성 프롬프트
- [ ] 프로덕션 URL 배포
- [ ] 최종 발표 자료

[Projects 탭](https://github.com/AIBizTeam9/team9/projects)에서 실시간 진행 상황 확인.

---

## ✦ 수업 정보 / Class Info

이 레포는 **AI기반 비즈니스 진화 — 전략 및 실습** 수업(이지수 교수님)의 최종 팀 프로젝트입니다.

---

## License

수업 과제로 개발된 프로젝트입니다. 팀의 동의 없이 상업적 용도로 사용될 수 없습니다.
