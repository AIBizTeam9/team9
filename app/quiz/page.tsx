"use client";

import Link from "next/link";

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-pink-950/30 to-purple-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="text-sm text-pink-300/60 hover:text-pink-300 transition-colors"
          >
            ← 홈
          </Link>
          <h1 className="text-xl font-bold mt-1">
            <span className="bg-gradient-to-r from-pink-300 to-rose-300 bg-clip-text text-transparent">
              퀴즈 & 페르소나
            </span>
          </h1>
          <p className="text-xs text-pink-300/50 mt-0.5">
            나를 알아가는 질문 → 두 개의 미래 자아 생성
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        {/* Placeholder */}
        <div className="text-center py-20">
          <div className="text-6xl mb-6">🧪</div>
          <h2 className="text-2xl font-bold text-white/90 mb-3">
            지윤님의 개발 영역입니다
          </h2>
          <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed mb-8">
            이 페이지에서 퀴즈 UI와 페르소나 생성 결과 화면을 개발해주세요.
            <br />
            아래 가이드를 참고하여 바이브코딩을 시작하세요.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-pink-500/20 bg-pink-500/10 text-pink-300 text-sm">
            담당: 지윤 · 상태: 개발 대기
          </div>
        </div>

        {/* What to build */}
        <section className="rounded-2xl border border-white/5 bg-white/3 p-6 mb-6">
          <h3 className="text-lg font-bold text-pink-200 mb-4">만들어야 할 것</h3>
          <div className="space-y-3 text-sm text-white/60">
            <div className="flex gap-3">
              <span className="text-pink-400 shrink-0">1.</span>
              <div>
                <strong className="text-white/80">퀴즈 UI</strong> — 사용자의 가치관, 관심사, 강점을 파악하는 5~10개의 질문 폼.
                슬라이더, 선택지, 자유 텍스트 등 다양한 입력 방식 활용.
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-pink-400 shrink-0">2.</span>
              <div>
                <strong className="text-white/80">API 연동</strong> — 퀴즈 답변을 <code className="text-pink-300/80 bg-pink-500/10 px-1 rounded">/api/personas</code>로 보내서
                Claude API가 두 개의 페르소나를 생성하도록 연결.
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-pink-400 shrink-0">3.</span>
              <div>
                <strong className="text-white/80">결과 화면</strong> — 생성된 페르소나 A, B를 카드 형태로 보여주고,
                &ldquo;디베이트 시작&rdquo; 버튼으로 다음 단계 연결.
              </div>
            </div>
          </div>
        </section>

        {/* Vibe coding guide */}
        <section className="rounded-2xl border border-white/5 bg-white/3 p-6 mb-6">
          <h3 className="text-lg font-bold text-pink-200 mb-4">바이브코딩 시작 가이드</h3>
          <div className="space-y-4 text-sm text-white/60">
            <div>
              <h4 className="text-white/80 font-semibold mb-2">1단계: 브랜치 확인</h4>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-pink-300/80 overflow-x-auto">
{`git checkout jiyun
git pull origin jiyun`}
              </pre>
            </div>
            <div>
              <h4 className="text-white/80 font-semibold mb-2">2단계: Claude Code에 명령하기</h4>
              <p className="mb-2 text-white/50">터미널에서 <code className="text-pink-300/80 bg-pink-500/10 px-1 rounded">claude</code> 입력 후 아래처럼 요청하세요:</p>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-pink-300/80 overflow-x-auto whitespace-pre-wrap">
{`"app/quiz/page.tsx에 퀴즈 폼을 만들어줘.
5개 질문으로 사용자의 가치관, 관심사, 강점을 파악하고,
답변을 모아서 /api/personas로 POST 요청을 보내줘.
Tailwind CSS로 다크 테마에 맞게 스타일링해줘."`}
              </pre>
            </div>
            <div>
              <h4 className="text-white/80 font-semibold mb-2">3단계: API 만들기</h4>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-pink-300/80 overflow-x-auto whitespace-pre-wrap">
{`"app/api/personas/route.ts에 퀴즈 답변을 받아서
Claude API로 두 개의 페르소나를 생성하는 API를 만들어줘.
각 페르소나에는 이름, 직업, 성격, 5년 후 모습이 포함되어야 해.
Anthropic SDK를 사용하고, 데모 모드도 지원해줘."`}
              </pre>
            </div>
            <div>
              <h4 className="text-white/80 font-semibold mb-2">4단계: 확인 & 배포</h4>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-pink-300/80 overflow-x-auto">
{`npm run dev -- --port 15500     # 로컬 확인
git add . && git commit -m "feat: 퀴즈 & 페르소나 생성 구현"
git push origin jiyun           # Vercel 자동 배포`}
              </pre>
            </div>
          </div>
        </section>

        {/* Shared modules */}
        <section className="rounded-2xl border border-white/5 bg-white/3 p-6">
          <h3 className="text-lg font-bold text-pink-200 mb-4">사용 가능한 공용 모듈</h3>
          <div className="space-y-3 text-sm text-white/60">
            <div>
              <h4 className="text-white/80 font-semibold mb-1">세션 저장 (Supabase)</h4>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-pink-300/80 overflow-x-auto">
{`import { createSession, saveConversation } from "@/lib/sessions";

// 퀴즈 완료 시 세션 생성
const session = await createSession(quizAnswers, personaA, personaB);`}
              </pre>
            </div>
            <div>
              <h4 className="text-white/80 font-semibold mb-1">외부 리소스 연동 (동근)</h4>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-pink-300/80 overflow-x-auto">
{`import { fetchResources } from "@/lib/resources";
import { fetchMarketData } from "@/lib/market";`}
              </pre>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
