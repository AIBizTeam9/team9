"use client";

export default function DebatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-orange-950/20 to-purple-950 text-white">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">
            <span className="bg-gradient-to-r from-orange-300 to-amber-300 bg-clip-text text-transparent">
              페르소나 디베이트
            </span>
          </h1>
          <p className="text-xs text-orange-300/50 mt-0.5">
            두 미래 자아의 대화 → 인사이트 도출
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        {/* Placeholder */}
        <div className="text-center py-20">
          <div className="text-6xl mb-6">💬</div>
          <h2 className="text-2xl font-bold text-white/90 mb-3">
            재림님의 개발 영역입니다
          </h2>
          <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed mb-8">
            이 페이지에서 두 페르소나의 대화 UI와 인사이트 추출 화면을 개발해주세요.
            <br />
            아래 가이드를 참고하여 바이브코딩을 시작하세요.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-300 text-sm">
            담당: 재림 · 상태: 개발 대기
          </div>
        </div>

        {/* What to build */}
        <section className="rounded-2xl border border-white/5 bg-white/3 p-6 mb-6">
          <h3 className="text-lg font-bold text-orange-200 mb-4">만들어야 할 것</h3>
          <div className="space-y-3 text-sm text-white/60">
            <div className="flex gap-3">
              <span className="text-orange-400 shrink-0">1.</span>
              <div>
                <strong className="text-white/80">대화 UI</strong> — 페르소나 A와 B가 번갈아 대화하는 채팅 인터페이스.
                왼쪽/오른쪽으로 구분된 말풍선, 실시간 스트리밍 효과.
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-orange-400 shrink-0">2.</span>
              <div>
                <strong className="text-white/80">API 연동</strong> — 퀴즈에서 생성된 두 페르소나를 받아
                <code className="text-orange-300/80 bg-orange-500/10 px-1 rounded">/api/debate</code>로 보내고,
                Claude API가 대화를 생성하도록 연결.
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-orange-400 shrink-0">3.</span>
              <div>
                <strong className="text-white/80">인사이트 요약</strong> — 대화가 끝나면 핵심 인사이트를 정리하여
                카드 형태로 표시하고, &ldquo;90일 플랜 만들기&rdquo; 버튼으로 다음 단계 연결.
              </div>
            </div>
          </div>
        </section>

        {/* Vibe coding guide */}
        <section className="rounded-2xl border border-white/5 bg-white/3 p-6 mb-6">
          <h3 className="text-lg font-bold text-orange-200 mb-4">바이브코딩 시작 가이드</h3>
          <div className="space-y-4 text-sm text-white/60">
            <div>
              <h4 className="text-white/80 font-semibold mb-2">1단계: 브랜치 확인</h4>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-orange-300/80 overflow-x-auto">
{`git checkout jaerim
git pull origin jaerim`}
              </pre>
            </div>
            <div>
              <h4 className="text-white/80 font-semibold mb-2">2단계: Claude Code에 명령하기</h4>
              <p className="mb-2 text-white/50">터미널에서 <code className="text-orange-300/80 bg-orange-500/10 px-1 rounded">claude</code> 입력 후 아래처럼 요청하세요:</p>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-orange-300/80 overflow-x-auto whitespace-pre-wrap">
{`"app/debate/page.tsx에 두 페르소나가 대화하는 채팅 UI를 만들어줘.
페르소나 A는 왼쪽, B는 오른쪽에 말풍선으로 표시하고,
대화가 한 턴씩 추가되는 애니메이션 효과를 넣어줘.
/api/debate에 POST 요청으로 대화를 생성해줘."`}
              </pre>
            </div>
            <div>
              <h4 className="text-white/80 font-semibold mb-2">3단계: API 만들기</h4>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-orange-300/80 overflow-x-auto whitespace-pre-wrap">
{`"app/api/debate/route.ts에 두 페르소나 정보를 받아서
Claude API로 대화를 생성하는 API를 만들어줘.
5~7턴의 대화를 만들고, 마지막에 핵심 인사이트 3개를 정리해줘.
스트리밍 응답으로 만들어서 실시간으로 보여줄 수 있게 해줘."`}
              </pre>
            </div>
            <div>
              <h4 className="text-white/80 font-semibold mb-2">4단계: 확인 & 배포</h4>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-orange-300/80 overflow-x-auto">
{`npm run dev -- --port 15500     # 로컬 확인
git add . && git commit -m "feat: 페르소나 디베이트 대화 구현"
git push origin jaerim          # Vercel 자동 배포`}
              </pre>
            </div>
          </div>
        </section>

        {/* Shared modules */}
        <section className="rounded-2xl border border-white/5 bg-white/3 p-6">
          <h3 className="text-lg font-bold text-orange-200 mb-4">사용 가능한 공용 모듈</h3>
          <div className="space-y-3 text-sm text-white/60">
            <div>
              <h4 className="text-white/80 font-semibold mb-1">세션 불러오기 (Supabase)</h4>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-orange-300/80 overflow-x-auto">
{`import { getSession, saveConversation } from "@/lib/sessions";

// 퀴즈에서 저장된 세션의 페르소나 가져오기
const session = await getSession(sessionId);
const { persona_a, persona_b } = session;

// 대화 턴 저장
await saveConversation(sessionId, "persona_a", content, turnOrder);`}
              </pre>
            </div>
            <div>
              <h4 className="text-white/80 font-semibold mb-1">시장 데이터 참조 (동근)</h4>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-orange-300/80 overflow-x-auto">
{`import { fetchMarketData } from "@/lib/market";

// 디베이트 중 시장 데이터를 프롬프트에 포함할 때
const trends = await fetchMarketData("tech", "AI");`}
              </pre>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
