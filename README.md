# AI Career Explorer

AI 커리어 코치와 대화하며 나에게 맞는 커리어를 탐색하는 서비스.

## 구조

```
career-explorer/
├── app/                  # Next.js 프론트엔드
│   ├── page.tsx          # 메인 채팅 UI
│   ├── layout.tsx        # 레이아웃
│   └── globals.css       # 스타일
├── backend/
│   ├── main.py           # FastAPI 서버
│   └── requirements.txt  # Python 의존성
```

## 실행

```bash
# 환경변수
export OPENAI_API_KEY=sk-...

# Backend (포트 15501)
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 15501 --reload

# Frontend (포트 15500)
npm install
npm run dev
```

## 기술 스택

- **Frontend**: Next.js 16 + React 19 + Tailwind CSS 4
- **Backend**: FastAPI + OpenAI GPT-4o-mini
- **Font**: Inter
