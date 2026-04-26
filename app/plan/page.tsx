"use client";

export default function PlanPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-yellow-950/20 to-purple-950 text-white">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">
            <span className="bg-gradient-to-r from-yellow-300 to-lime-300 bg-clip-text text-transparent">
              90일 실행 플랜
            </span>
          </h1>
          <p className="text-xs text-yellow-300/50 mt-0.5">
            디베이트 인사이트 → 개인 맞춤형 실행 계획
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        {/* Placeholder */}
        <div className="text-center py-20">
          <div className="text-6xl mb-6">📋</div>
          <h2 className="text-2xl font-bold text-white/90 mb-3">
            석빈님의 개발 영역입니다
          </h2>
          <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed mb-8">
            이 페이지에서 90일 실행 플랜 생성 및 표시 화면을 개발해주세요.
            <br />
            아래 가이드를 참고하여 바이브코딩을 시작하세요.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 text-yellow-300 text-sm">
            담당: 석빈 · 상태: 개발 대기
          </div>
        </div>

        {/* What to build */}
        <section className="rounded-2xl border border-white/5 bg-white/3 p-6 mb-6">
          <h3 className="text-lg font-bold text-yellow-200 mb-4">만들어야 할 것</h3>
          <div className="space-y-3 text-sm text-white/60">
            <div className="flex gap-3">
              <span className="text-yellow-400 shrink-0">1.</span>
              <div>
                <strong className="text-white/80">플랜 생성 화면</strong> — 디베이트 인사이트를 입력받아
                Claude API가 90일 실행 플랜을 생성하는 로딩/결과 화면.
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-yellow-400 shrink-0">2.</span>
              <div>
                <strong className="text-white/80">타임라인 UI</strong> — 30일씩 3단계로 나눈 타임라인.
                각 단계별 목표, 구체적 행동 항목, 추천 리소스를 표시.
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-yellow-400 shrink-0">3.</span>
              <div>
                <strong className="text-white/80">리소스 연결</strong> — 플랜에 맞는 강의, 채용 정보, 커뮤니티를
                동근이 만든 외부 데이터 허브에서 자동으로 추천.
              </div>
            </div>
          </div>
        </section>

        {/* Vibe coding guide */}
        <section className="rounded-2xl border border-white/5 bg-white/3 p-6 mb-6">
          <h3 className="text-lg font-bold text-yellow-200 mb-4">바이브코딩 시작 가이드</h3>
          <div className="space-y-4 text-sm text-white/60">
            <div>
              <h4 className="text-white/80 font-semibold mb-2">1단계: 브랜치 확인</h4>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-yellow-300/80 overflow-x-auto">
{`git checkout seokbin
git pull origin seokbin`}
              </pre>
            </div>
            <div>
              <h4 className="text-white/80 font-semibold mb-2">2단계: Claude Code에 명령하기</h4>
              <p className="mb-2 text-white/50">터미널에서 <code className="text-yellow-300/80 bg-yellow-500/10 px-1 rounded">claude</code> 입력 후 아래처럼 요청하세요:</p>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-yellow-300/80 overflow-x-auto whitespace-pre-wrap">
{`"app/plan/page.tsx에 90일 실행 플랜을 보여주는 타임라인 UI를 만들어줘.
30일씩 3단계로 나누고, 각 단계마다 목표와 구체적 행동 항목을 표시해줘.
/api/plan에 POST 요청으로 인사이트 데이터를 보내면 플랜이 생성되게 해줘.
Tailwind CSS로 다크 테마에 맞게 스타일링하고, 단계별로 색상을 다르게 해줘."`}
              </pre>
            </div>
            <div>
              <h4 className="text-white/80 font-semibold mb-2">3단계: API 만들기</h4>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-yellow-300/80 overflow-x-auto whitespace-pre-wrap">
{`"app/api/plan/route.ts에 디베이트 인사이트를 받아서
Claude API로 90일 실행 플랜을 생성하는 API를 만들어줘.
각 30일 구간별로 목표, 행동 항목 3~5개, 추천 리소스를 포함해줘.
데모 모드에서는 하드코딩된 예시 플랜을 반환해줘."`}
              </pre>
            </div>
            <div>
              <h4 className="text-white/80 font-semibold mb-2">4단계: 확인 & 배포</h4>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-yellow-300/80 overflow-x-auto">
{`npm run dev -- --port 15500     # 로컬 확인
git add . && git commit -m "feat: 90일 실행 플랜 타임라인 구현"
git push origin seokbin         # Vercel 자동 배포`}
              </pre>
            </div>
          </div>
        </section>

        {/* Shared modules */}
        <section className="rounded-2xl border border-white/5 bg-white/3 p-6">
          <h3 className="text-lg font-bold text-yellow-200 mb-4">사용 가능한 공용 모듈</h3>
          <div className="space-y-3 text-sm text-white/60">
            <div>
              <h4 className="text-white/80 font-semibold mb-1">세션 불러오기 (Supabase)</h4>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-yellow-300/80 overflow-x-auto">
{`import { getSession } from "@/lib/sessions";

// 디베이트 결과(인사이트) 가져오기
const session = await getSession(sessionId);
const { insight } = session;`}
              </pre>
            </div>
            <div>
              <h4 className="text-white/80 font-semibold mb-1">외부 리소스 추천 연결 (동근)</h4>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-yellow-300/80 overflow-x-auto">
{`import { fetchResources } from "@/lib/resources";
import { fetchMarketData } from "@/lib/market";

// 플랜에 맞는 강의 추천
const courses = await fetchResources("courses", "데이터분석");

// 관련 시장 정보 연결
const salaryInfo = await fetchMarketData("salary");`}
              </pre>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
