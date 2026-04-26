"use client";

export default function DebatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-orange-950/20 to-purple-950 text-white">
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

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center py-16">
          <div className="text-6xl mb-6">💬</div>
          <h2 className="text-2xl font-bold text-white/90 mb-3">
            재림님의 개발 영역입니다
          </h2>
          <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed mb-8">
            아래 프롬프트를 순서대로 AI에게 입력하면 이 페이지가 완성됩니다.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-300 text-sm">
            담당: 재림 · 상태: 개발 대기
          </div>
        </div>

        {/* 시작 전 준비 */}
        <section className="rounded-2xl border border-white/5 bg-white/3 p-6 mb-6">
          <h3 className="text-lg font-bold text-orange-200 mb-3">시작 전 준비</h3>
          <div className="text-sm text-white/60 space-y-2">
            <p>VS Code 터미널에서 본인 브랜치로 이동하세요:</p>
            <pre className="bg-black/30 rounded-lg p-3 text-xs text-orange-300/80">
{`git checkout jaerim`}
            </pre>
            <p className="text-white/40">
              Vercel 배포 설정이 안 되어 있다면 → <code className="text-orange-300/60 bg-orange-500/10 px-1 rounded">docs/deploy-guide.html</code> 참고
            </p>
          </div>
        </section>

        {/* 프롬프트 가이드 */}
        <section className="rounded-2xl border border-orange-500/10 bg-orange-500/3 p-6 mb-6">
          <h3 className="text-lg font-bold text-orange-200 mb-2">AI에게 입력할 프롬프트</h3>
          <p className="text-xs text-white/40 mb-5">
            아래 프롬프트를 순서대로 복사해서 VS Code의 AI 채팅창에 붙여넣으세요.
            <br />
            하나씩 완성하고 결과를 확인한 뒤 다음으로 넘어가세요.
          </p>

          <div className="space-y-5">
            {/* Prompt 1 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-orange-500/30 text-orange-300 text-xs font-bold flex items-center justify-center">1</span>
                <span className="text-sm font-semibold text-white/80">대화 UI 만들기</span>
              </div>
              <pre className="bg-black/40 rounded-xl p-4 text-xs text-orange-200/90 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-orange-500/10">
{`app/debate/page.tsx 파일을 수정해서 두 페르소나의 대화 화면을 만들어줘.

요구사항:
- 채팅 형태의 대화 UI (카카오톡/iMessage 느낌)
- 페르소나 A는 왼쪽 (분홍색 계열), B는 오른쪽 (파란색 계열)
- 각 말풍선에 페르소나 이름과 프로필 아이콘 표시
- 대화가 한 턴씩 자동으로 추가되는 타이핑 애니메이션
- 상단에 페르소나 A, B의 간단한 프로필 카드 2개
- "대화 시작" 버튼을 누르면 대화가 시작됨
- 다크 테마 (bg-gradient-to-br from-slate-950 via-orange-950/20 to-purple-950)`}
              </pre>
            </div>

            {/* Prompt 2 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-orange-500/30 text-orange-300 text-xs font-bold flex items-center justify-center">2</span>
                <span className="text-sm font-semibold text-white/80">디베이트 API 만들기</span>
              </div>
              <pre className="bg-black/40 rounded-xl p-4 text-xs text-orange-200/90 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-orange-500/10">
{`app/api/debate/route.ts 파일을 만들어줘.

요구사항:
- POST 요청으로 페르소나 A, B의 프로필 정보를 받음
- Claude API (Anthropic SDK)를 사용해서 두 페르소나 간의 대화 생성
- 대화 턴 수: 5~7턴 (A→B→A→B... 번갈아 가며)
- 대화 주제: "어떤 미래가 더 가치 있는가?"
- 대화 끝나면 핵심 인사이트 3개를 JSON으로 정리
- 응답 형식: { turns: [{speaker, content}...], insights: [string...] }
- 환경변수 ANTHROPIC_API_KEY 사용
- API 키가 없으면 데모 대화 데이터 반환
- lib/sessions.ts의 saveConversation으로 각 턴을 저장`}
              </pre>
            </div>

            {/* Prompt 3 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-orange-500/30 text-orange-300 text-xs font-bold flex items-center justify-center">3</span>
                <span className="text-sm font-semibold text-white/80">인사이트 요약 화면 만들기</span>
              </div>
              <pre className="bg-black/40 rounded-xl p-4 text-xs text-orange-200/90 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-orange-500/10">
{`대화가 끝난 후 인사이트 요약 화면을 추가해줘.

요구사항:
- 대화가 모두 표시된 후 "인사이트 보기" 버튼 표시
- 버튼 클릭하면 아래에 인사이트 카드 3개가 슬라이드 업으로 등장
- 각 인사이트 카드: 아이콘 + 제목 + 설명 한 줄
- 하단에 "90일 플랜 만들기" 버튼 → /plan 페이지로 이동
- sessionId를 URL 파라미터로 전달`}
              </pre>
            </div>

            {/* Prompt 4 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-orange-500/30 text-orange-300 text-xs font-bold flex items-center justify-center">4</span>
                <span className="text-sm font-semibold text-white/80">디자인 다듬기</span>
              </div>
              <pre className="bg-black/40 rounded-xl p-4 text-xs text-orange-200/90 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-orange-500/10">
{`디베이트 페이지의 디자인을 더 다듬어줘.

수정할 것:
- 대화 턴이 추가될 때 부드러운 fade-in + slide-up 효과
- 현재 말하는 페르소나 옆에 타이핑 중... 애니메이션
- 스크롤이 자동으로 최신 대화로 이동
- 모바일에서도 말풍선 잘 보이게 반응형
- 인사이트 카드에 그라데이션 배경 효과`}
              </pre>
            </div>

            {/* Prompt 5 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center">5</span>
                <span className="text-sm font-semibold text-white/80">저장하고 배포하기</span>
              </div>
              <pre className="bg-black/40 rounded-xl p-4 text-xs text-emerald-200/90 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-emerald-500/10">
{`지금까지 만든 코드를 git에 커밋하고 push 해줘.
커밋 메시지는 "feat: 페르소나 디베이트 대화 구현"으로 해줘.
브랜치는 jaerim이야.`}
              </pre>
            </div>
          </div>
        </section>

        {/* 팁 */}
        <section className="rounded-2xl border border-white/5 bg-white/3 p-6 mb-6">
          <h3 className="text-lg font-bold text-orange-200 mb-3">바이브코딩 팁</h3>
          <div className="space-y-3 text-sm text-white/50">
            <p><strong className="text-white/70">결과가 마음에 안 들면?</strong> → &ldquo;이 부분을 ~로 바꿔줘&rdquo; 라고 추가 요청하세요.</p>
            <p><strong className="text-white/70">에러가 나면?</strong> → 에러 메시지를 그대로 복사해서 &ldquo;이 에러 고쳐줘&rdquo; 라고 보내세요.</p>
            <p><strong className="text-white/70">로컬에서 확인하려면?</strong> → &ldquo;개발 서버 실행해줘&rdquo; 라고 요청하면 됩니다.</p>
            <p><strong className="text-white/70">원하는 디자인이 있으면?</strong> → 참고 이미지 URL이나 스크린샷을 함께 보내세요.</p>
          </div>
        </section>

        {/* 공용 모듈 */}
        <section className="rounded-2xl border border-white/5 bg-white/3 p-6">
          <h3 className="text-lg font-bold text-orange-200 mb-3">이미 만들어진 공용 모듈</h3>
          <p className="text-xs text-white/40 mb-4">AI에게 &ldquo;이 모듈을 사용해서 만들어줘&rdquo; 라고 알려주면 자동으로 연결해줍니다.</p>
          <div className="space-y-2 text-sm text-white/60">
            <div className="flex gap-2 items-start">
              <span className="text-orange-400 shrink-0">*</span>
              <span><code className="text-orange-300/80 bg-orange-500/10 px-1 rounded">lib/sessions.ts</code> — Supabase 세션 저장/불러오기 (getSession, saveConversation)</span>
            </div>
            <div className="flex gap-2 items-start">
              <span className="text-orange-400 shrink-0">*</span>
              <span><code className="text-orange-300/80 bg-orange-500/10 px-1 rounded">lib/resources.ts</code> — 외부 리소스 데이터 (채용, 강의, 도서)</span>
            </div>
            <div className="flex gap-2 items-start">
              <span className="text-orange-400 shrink-0">*</span>
              <span><code className="text-orange-300/80 bg-orange-500/10 px-1 rounded">lib/market.ts</code> — 시장 데이터 (트렌드, 연봉, 스킬)</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
