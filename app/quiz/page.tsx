"use client";

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-pink-950/30 to-purple-950 text-white">
      <header className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">
            <span className="bg-gradient-to-r from-pink-300 to-rose-300 bg-clip-text text-transparent">
              퀴즈 & 페르소나
            </span>
          </h1>
          <p className="text-xs text-pink-300/50 mt-0.5">
            나를 알아가는 질문 → 두 개의 미래 자아 생성
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center py-16">
          <div className="text-6xl mb-6">🧪</div>
          <h2 className="text-2xl font-bold text-white/90 mb-3">
            지윤님의 개발 영역입니다
          </h2>
          <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed mb-8">
            아래 프롬프트를 순서대로 AI에게 입력하면 이 페이지가 완성됩니다.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-pink-500/20 bg-pink-500/10 text-pink-300 text-sm">
            담당: 지윤 · 상태: 개발 대기
          </div>
        </div>

        {/* 시작 전 준비 */}
        <section className="rounded-2xl border border-white/5 bg-white/3 p-6 mb-6">
          <h3 className="text-lg font-bold text-pink-200 mb-3">시작 전 준비</h3>
          <div className="text-sm text-white/60 space-y-2">
            <p>VS Code 터미널에서 본인 브랜치로 이동하세요:</p>
            <pre className="bg-black/30 rounded-lg p-3 text-xs text-pink-300/80">
{`git checkout jiyun`}
            </pre>
            <p className="text-white/40">
              Vercel 배포 설정이 안 되어 있다면 → <code className="text-pink-300/60 bg-pink-500/10 px-1 rounded">docs/deploy-guide.html</code> 참고
            </p>
          </div>
        </section>

        {/* 프롬프트 가이드 */}
        <section className="rounded-2xl border border-pink-500/10 bg-pink-500/3 p-6 mb-6">
          <h3 className="text-lg font-bold text-pink-200 mb-2">AI에게 입력할 프롬프트</h3>
          <p className="text-xs text-white/40 mb-5">
            아래 프롬프트를 순서대로 복사해서 VS Code의 AI 채팅창에 붙여넣으세요.
            <br />
            하나씩 완성하고 결과를 확인한 뒤 다음으로 넘어가세요.
          </p>

          <div className="space-y-5">
            {/* Prompt 1 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-pink-500/30 text-pink-300 text-xs font-bold flex items-center justify-center">1</span>
                <span className="text-sm font-semibold text-white/80">퀴즈 화면 만들기</span>
              </div>
              <pre className="bg-black/40 rounded-xl p-4 text-xs text-pink-200/90 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-pink-500/10">
{`app/quiz/page.tsx 파일을 수정해서 퀴즈 페이지를 만들어줘.

요구사항:
- 사용자의 가치관, 관심사, 강점을 파악하는 질문 5~7개
- 질문 유형: 객관식(4개 보기), 슬라이더(1~10), 자유 텍스트
- 한 번에 한 문제씩 보여주고, 진행률 바가 상단에 표시
- "다음" 버튼을 누르면 다음 질문으로 넘어감
- 마지막 질문 후 "결과 보기" 버튼
- 다크 테마 (bg-gradient-to-br from-slate-950 via-pink-950/30 to-purple-950)
- Tailwind CSS로 스타일링, 애니메이션 부드럽게`}
              </pre>
            </div>

            {/* Prompt 2 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-pink-500/30 text-pink-300 text-xs font-bold flex items-center justify-center">2</span>
                <span className="text-sm font-semibold text-white/80">페르소나 생성 API 만들기</span>
              </div>
              <pre className="bg-black/40 rounded-xl p-4 text-xs text-pink-200/90 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-pink-500/10">
{`app/api/personas/route.ts 파일을 만들어줘.

요구사항:
- POST 요청으로 퀴즈 답변 배열을 받음
- Claude API (Anthropic SDK)를 사용해서 두 개의 페르소나 생성
- 각 페르소나에 포함할 것: 이름, 나이, 직업, 성격 요약, 5년 후 모습, 장점과 리스크
- 응답 형식: { persona_a: {...}, persona_b: {...} }
- 환경변수 ANTHROPIC_API_KEY를 사용
- API 키가 없으면 하드코딩된 데모 데이터를 반환하는 데모 모드 지원
- lib/sessions.ts의 createSession으로 결과를 Supabase에 저장`}
              </pre>
            </div>

            {/* Prompt 3 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-pink-500/30 text-pink-300 text-xs font-bold flex items-center justify-center">3</span>
                <span className="text-sm font-semibold text-white/80">결과 화면 연결하기</span>
              </div>
              <pre className="bg-black/40 rounded-xl p-4 text-xs text-pink-200/90 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-pink-500/10">
{`퀴즈 완료 후 페르소나 결과 화면을 만들어줘.

요구사항:
- 퀴즈 마지막에 "결과 보기"를 누르면 /api/personas에 POST 요청
- 로딩 중에는 "두 개의 미래를 만들고 있어요..." 애니메이션
- 페르소나 A와 B를 카드 2장으로 나란히 표시
- 각 카드: 이름, 직업, 성격, 5년 후 모습
- 하단에 "이 두 사람의 대화를 들어볼래요?" 버튼 → /debate 페이지로 이동
- sessionId를 URL 파라미터로 전달`}
              </pre>
            </div>

            {/* Prompt 4 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-pink-500/30 text-pink-300 text-xs font-bold flex items-center justify-center">4</span>
                <span className="text-sm font-semibold text-white/80">디자인 다듬기</span>
              </div>
              <pre className="bg-black/40 rounded-xl p-4 text-xs text-pink-200/90 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-pink-500/10">
{`퀴즈 페이지의 디자인을 더 예쁘게 다듬어줘.

수정할 것:
- 질문 전환 시 fade-in 애니메이션 추가
- 선택된 보기에 체크 표시와 색상 강조
- 진행률 바에 그라데이션 효과
- 모바일에서도 잘 보이게 반응형 적용
- 페르소나 카드에 그라데이션 테두리 효과`}
              </pre>
            </div>

            {/* Prompt 5 - 저장 & 배포 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center">5</span>
                <span className="text-sm font-semibold text-white/80">저장하고 배포하기</span>
              </div>
              <pre className="bg-black/40 rounded-xl p-4 text-xs text-emerald-200/90 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-emerald-500/10">
{`지금까지 만든 코드를 git에 커밋하고 push 해줘.
커밋 메시지는 "feat: 퀴즈 & 페르소나 생성 구현"으로 해줘.
브랜치는 jiyun이야.`}
              </pre>
            </div>
          </div>
        </section>

        {/* 팁 */}
        <section className="rounded-2xl border border-white/5 bg-white/3 p-6 mb-6">
          <h3 className="text-lg font-bold text-pink-200 mb-3">바이브코딩 팁</h3>
          <div className="space-y-3 text-sm text-white/50">
            <p><strong className="text-white/70">결과가 마음에 안 들면?</strong> → &ldquo;이 부분을 ~로 바꿔줘&rdquo; 라고 추가 요청하세요.</p>
            <p><strong className="text-white/70">에러가 나면?</strong> → 에러 메시지를 그대로 복사해서 &ldquo;이 에러 고쳐줘&rdquo; 라고 보내세요.</p>
            <p><strong className="text-white/70">로컬에서 확인하려면?</strong> → &ldquo;개발 서버 실행해줘&rdquo; 라고 요청하면 됩니다.</p>
            <p><strong className="text-white/70">원하는 디자인이 있으면?</strong> → 참고 이미지 URL이나 스크린샷을 함께 보내세요.</p>
          </div>
        </section>

        {/* 공용 모듈 */}
        <section className="rounded-2xl border border-white/5 bg-white/3 p-6">
          <h3 className="text-lg font-bold text-pink-200 mb-3">이미 만들어진 공용 모듈</h3>
          <p className="text-xs text-white/40 mb-4">AI에게 &ldquo;이 모듈을 사용해서 만들어줘&rdquo; 라고 알려주면 자동으로 연결해줍니다.</p>
          <div className="space-y-2 text-sm text-white/60">
            <div className="flex gap-2 items-start">
              <span className="text-pink-400 shrink-0">*</span>
              <span><code className="text-pink-300/80 bg-pink-500/10 px-1 rounded">lib/sessions.ts</code> — Supabase 세션 저장/불러오기 (createSession, getSession)</span>
            </div>
            <div className="flex gap-2 items-start">
              <span className="text-pink-400 shrink-0">*</span>
              <span><code className="text-pink-300/80 bg-pink-500/10 px-1 rounded">lib/resources.ts</code> — 외부 리소스 데이터 (채용, 강의, 도서)</span>
            </div>
            <div className="flex gap-2 items-start">
              <span className="text-pink-400 shrink-0">*</span>
              <span><code className="text-pink-300/80 bg-pink-500/10 px-1 rounded">lib/market.ts</code> — 시장 데이터 (트렌드, 연봉, 스킬)</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
