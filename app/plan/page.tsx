"use client";

export default function PlanPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-yellow-950/20 to-purple-950 text-white">
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

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center py-16">
          <div className="text-6xl mb-6">📋</div>
          <h2 className="text-2xl font-bold text-white/90 mb-3">
            석빈님의 개발 영역입니다
          </h2>
          <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed mb-8">
            아래 프롬프트를 순서대로 AI에게 입력하면 이 페이지가 완성됩니다.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 text-yellow-300 text-sm">
            담당: 석빈 · 상태: 개발 대기
          </div>
        </div>

        {/* 시작 전 준비 */}
        <section className="rounded-2xl border border-white/5 bg-white/3 p-6 mb-6">
          <h3 className="text-lg font-bold text-yellow-200 mb-3">시작 전 준비</h3>
          <div className="text-sm text-white/60 space-y-2">
            <p>VS Code 터미널에서 본인 브랜치로 이동하세요:</p>
            <pre className="bg-black/30 rounded-lg p-3 text-xs text-yellow-300/80">
{`git checkout seokbin`}
            </pre>
            <p className="text-white/40">
              Vercel 배포 설정이 안 되어 있다면 → <code className="text-yellow-300/60 bg-yellow-500/10 px-1 rounded">docs/deploy-guide.html</code> 참고
            </p>
          </div>
        </section>

        {/* 프롬프트 가이드 */}
        <section className="rounded-2xl border border-yellow-500/10 bg-yellow-500/3 p-6 mb-6">
          <h3 className="text-lg font-bold text-yellow-200 mb-2">AI에게 입력할 프롬프트</h3>
          <p className="text-xs text-white/40 mb-5">
            아래 프롬프트를 순서대로 복사해서 VS Code의 AI 채팅창에 붙여넣으세요.
            <br />
            하나씩 완성하고 결과를 확인한 뒤 다음으로 넘어가세요.
          </p>

          <div className="space-y-5">
            {/* Prompt 1 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-yellow-500/30 text-yellow-300 text-xs font-bold flex items-center justify-center">1</span>
                <span className="text-sm font-semibold text-white/80">타임라인 UI 만들기</span>
              </div>
              <pre className="bg-black/40 rounded-xl p-4 text-xs text-yellow-200/90 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-yellow-500/10">
{`app/plan/page.tsx 파일을 수정해서 90일 실행 플랜 타임라인을 만들어줘.

요구사항:
- 30일씩 3단계로 나눈 세로 타임라인 UI
- 1단계 (1~30일): 탐색 & 학습 — 초록색 계열
- 2단계 (31~60일): 실행 & 경험 — 파란색 계열
- 3단계 (61~90일): 도약 & 정착 — 보라색 계열
- 각 단계에 목표 1개, 구체적 행동 항목 3~5개 표시
- 각 행동 항목은 체크박스로 완료 표시 가능
- 상단에 전체 진행률 원형 차트
- "플랜 생성하기" 버튼을 누르면 /api/plan에 요청
- 다크 테마 (bg-gradient-to-br from-slate-950 via-yellow-950/20 to-purple-950)`}
              </pre>
            </div>

            {/* Prompt 2 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-yellow-500/30 text-yellow-300 text-xs font-bold flex items-center justify-center">2</span>
                <span className="text-sm font-semibold text-white/80">플랜 생성 API 만들기</span>
              </div>
              <pre className="bg-black/40 rounded-xl p-4 text-xs text-yellow-200/90 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-yellow-500/10">
{`app/api/plan/route.ts 파일을 만들어줘.

요구사항:
- POST 요청으로 디베이트 인사이트 배열을 받음
- Claude API (Anthropic SDK)를 사용해서 90일 실행 플랜 생성
- 응답 형식:
  {
    phases: [
      {
        title: "탐색 & 학습",
        days: "1~30일",
        goal: "목표 문장",
        actions: ["행동 1", "행동 2", ...],
        resources: ["추천 리소스 제목"]
      },
      ... (3개 단계)
    ]
  }
- 환경변수 ANTHROPIC_API_KEY 사용
- API 키가 없으면 하드코딩된 예시 플랜 반환 (데모 모드)`}
              </pre>
            </div>

            {/* Prompt 3 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-yellow-500/30 text-yellow-300 text-xs font-bold flex items-center justify-center">3</span>
                <span className="text-sm font-semibold text-white/80">추천 리소스 연결하기</span>
              </div>
              <pre className="bg-black/40 rounded-xl p-4 text-xs text-yellow-200/90 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-yellow-500/10">
{`플랜의 각 단계에 관련 외부 리소스를 자동으로 추천해줘.

요구사항:
- lib/resources.ts의 fetchResources 함수를 사용해서 추천 리소스 표시
- lib/market.ts의 fetchMarketData로 관련 시장 정보도 연결
- 1단계(학습)에는 강의/교육 리소스 추천
- 2단계(실행)에는 채용 정보, 커뮤니티 추천
- 3단계(도약)에는 트렌드, 연봉 정보 추천
- 각 추천 리소스는 카드로 표시하고 클릭하면 외부 링크로 이동`}
              </pre>
            </div>

            {/* Prompt 4 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-yellow-500/30 text-yellow-300 text-xs font-bold flex items-center justify-center">4</span>
                <span className="text-sm font-semibold text-white/80">디자인 다듬기</span>
              </div>
              <pre className="bg-black/40 rounded-xl p-4 text-xs text-yellow-200/90 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-yellow-500/10">
{`90일 플랜 페이지의 디자인을 더 다듬어줘.

수정할 것:
- 타임라인에 세로 연결선 + 각 단계에 원형 마커
- 단계가 펼쳐질 때 부드러운 accordion 애니메이션
- 진행률 원형 차트에 숫자 카운트 업 효과
- 체크박스 완료 시 라인 그어지는 효과
- 모바일에서도 타임라인 잘 보이게 반응형`}
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
커밋 메시지는 "feat: 90일 실행 플랜 타임라인 구현"으로 해줘.
브랜치는 seokbin이야.`}
              </pre>
            </div>
          </div>
        </section>

        {/* 팁 */}
        <section className="rounded-2xl border border-white/5 bg-white/3 p-6 mb-6">
          <h3 className="text-lg font-bold text-yellow-200 mb-3">바이브코딩 팁</h3>
          <div className="space-y-3 text-sm text-white/50">
            <p><strong className="text-white/70">결과가 마음에 안 들면?</strong> → &ldquo;이 부분을 ~로 바꿔줘&rdquo; 라고 추가 요청하세요.</p>
            <p><strong className="text-white/70">에러가 나면?</strong> → 에러 메시지를 그대로 복사해서 &ldquo;이 에러 고쳐줘&rdquo; 라고 보내세요.</p>
            <p><strong className="text-white/70">로컬에서 확인하려면?</strong> → &ldquo;개발 서버 실행해줘&rdquo; 라고 요청하면 됩니다.</p>
            <p><strong className="text-white/70">원하는 디자인이 있으면?</strong> → 참고 이미지 URL이나 스크린샷을 함께 보내세요.</p>
          </div>
        </section>

        {/* 공용 모듈 */}
        <section className="rounded-2xl border border-white/5 bg-white/3 p-6">
          <h3 className="text-lg font-bold text-yellow-200 mb-3">이미 만들어진 공용 모듈</h3>
          <p className="text-xs text-white/40 mb-4">AI에게 &ldquo;이 모듈을 사용해서 만들어줘&rdquo; 라고 알려주면 자동으로 연결해줍니다.</p>
          <div className="space-y-2 text-sm text-white/60">
            <div className="flex gap-2 items-start">
              <span className="text-yellow-400 shrink-0">*</span>
              <span><code className="text-yellow-300/80 bg-yellow-500/10 px-1 rounded">lib/sessions.ts</code> — Supabase 세션 저장/불러오기 (getSession)</span>
            </div>
            <div className="flex gap-2 items-start">
              <span className="text-yellow-400 shrink-0">*</span>
              <span><code className="text-yellow-300/80 bg-yellow-500/10 px-1 rounded">lib/resources.ts</code> — 외부 리소스 데이터 (채용, 강의, 도서, 커뮤니티)</span>
            </div>
            <div className="flex gap-2 items-start">
              <span className="text-yellow-400 shrink-0">*</span>
              <span><code className="text-yellow-300/80 bg-yellow-500/10 px-1 rounded">lib/market.ts</code> — 시장 데이터 (트렌드, 연봉, 스킬, 직업 전망)</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
