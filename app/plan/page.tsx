"use client";

export default function PlanPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="max-w-[980px] mx-auto px-6 py-5">
          <h1 className="font-serif text-2xl tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
            90일 실행 플랜
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--ink-3)" }}>
            디베이트 인사이트 → 개인 맞춤형 실행 계획
          </p>
        </div>
      </header>

      <main className="max-w-[700px] mx-auto px-6 py-12">
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl" style={{ background: "var(--green-soft)" }}>📋</div>
          <h2 className="font-serif text-3xl tracking-[-0.02em] mb-3" style={{ color: "var(--ink)" }}>
            석빈님의 개발 영역
          </h2>
          <p className="text-[14px] max-w-md mx-auto leading-relaxed mb-6" style={{ color: "var(--ink-3)" }}>
            아래 프롬프트를 순서대로 AI에게 입력하면 이 페이지가 완성됩니다.
          </p>
          <span className="inline-flex px-4 py-1.5 rounded-full text-[12px]" style={{ background: "var(--green-soft)", color: "var(--green)", border: "1px solid var(--line)" }}>
            담당: 석빈 · 개발 대기
          </span>
        </div>

        <section className="rounded-2xl p-5 mb-5" style={{ background: "var(--bg-2)", border: "1px solid var(--line)", boxShadow: "var(--shadow)" }}>
          <h3 className="font-serif text-lg mb-2" style={{ color: "var(--ink)" }}>시작 전 준비</h3>
          <pre className="rounded-lg p-3 text-[12px]" style={{ background: "var(--accent-2)", color: "var(--ink-2)" }}>git checkout seokbin</pre>
        </section>

        <section className="rounded-2xl p-5 mb-5" style={{ background: "var(--bg-2)", border: "1px solid var(--line)", boxShadow: "var(--shadow)" }}>
          <h3 className="font-serif text-lg mb-1" style={{ color: "var(--ink)" }}>AI에게 입력할 프롬프트</h3>
          <p className="text-[12px] mb-5" style={{ color: "var(--ink-3)" }}>순서대로 복사해서 VS Code AI 채팅창에 붙여넣으세요.</p>

          {[
            { n: 1, title: "타임라인 UI 만들기", prompt: `app/plan/page.tsx를 수정해서 90일 실행 플랜 타임라인을 만들어줘.

요구사항:
- 30일씩 3단계 세로 타임라인
- 1단계 (1~30일): 탐색 & 학습 — 초록 계열
- 2단계 (31~60일): 실행 & 경험 — 블루 계열
- 3단계 (61~90일): 도약 & 정착 — 테라코타 계열
- 각 단계에 목표 1개, 행동 항목 3~5개 (체크박스)
- 상단에 전체 진행률 원형 차트
- "플랜 생성하기" 버튼 → /api/plan 요청
- 밝은 톤 (배경 #fafaf9, 카드 흰색)` },
            { n: 2, title: "플랜 생성 API", prompt: `app/api/plan/route.ts 파일을 만들어줘.

요구사항:
- POST로 디베이트 인사이트 배열을 받음
- Claude API로 90일 실행 플랜 생성
- 응답 형식:
  { phases: [{ title, days, goal, actions: [...], resources: [...] }, ...] }
- ANTHROPIC_API_KEY 환경변수 사용
- 없으면 하드코딩된 예시 플랜 반환 (데모 모드)` },
            { n: 3, title: "추천 리소스 연결", prompt: `플랜 각 단계에 관련 외부 리소스를 자동 추천해줘.

- lib/resources.ts의 fetchResources 사용
- lib/market.ts의 fetchMarketData 사용
- 1단계: 강의/교육 추천
- 2단계: 채용 정보, 커뮤니티 추천
- 3단계: 트렌드, 연봉 정보 추천
- 추천 리소스는 카드로 표시, 클릭 시 외부 링크` },
            { n: 4, title: "디자인 다듬기", prompt: `90일 플랜 페이지 디자인을 다듬어줘.

- 타임라인에 세로 연결선 + 원형 마커
- 단계 펼치기 accordion 애니메이션
- 진행률 원형 차트에 숫자 카운트 업
- 체크박스 완료 시 취소선
- 모바일 반응형` },
            { n: 5, title: "저장하고 배포", prompt: `지금까지 만든 코드를 git에 커밋하고 push 해줘.
커밋 메시지는 "feat: 90일 실행 플랜 타임라인 구현"으로.
브랜치는 seokbin.`, green: true },
          ].map((item) => (
            <div key={item.n} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: item.green ? "var(--green)" : "var(--green)" }}>{item.n}</span>
                <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>{item.title}</span>
              </div>
              <pre className="rounded-xl p-4 text-[12px] overflow-x-auto whitespace-pre-wrap leading-relaxed" style={{ background: "var(--accent-2)", color: "var(--ink-2)", border: "1px solid var(--line)" }}>{item.prompt}</pre>
            </div>
          ))}
        </section>

        <section className="rounded-2xl p-5 mb-5" style={{ background: "var(--bg-2)", border: "1px solid var(--line)", boxShadow: "var(--shadow)" }}>
          <h3 className="font-serif text-lg mb-3" style={{ color: "var(--ink)" }}>바이브코딩 팁</h3>
          <div className="space-y-2 text-[13px]" style={{ color: "var(--ink-3)" }}>
            <p><strong style={{ color: "var(--ink-2)" }}>마음에 안 들면?</strong> → &ldquo;이 부분을 ~로 바꿔줘&rdquo;</p>
            <p><strong style={{ color: "var(--ink-2)" }}>에러가 나면?</strong> → 에러 메시지 복사해서 &ldquo;이 에러 고쳐줘&rdquo;</p>
            <p><strong style={{ color: "var(--ink-2)" }}>로컬 확인?</strong> → &ldquo;개발 서버 실행해줘&rdquo;</p>
          </div>
        </section>

        <section className="rounded-2xl p-5" style={{ background: "var(--accent-2)", border: "1px solid var(--line)" }}>
          <h3 className="font-serif text-lg mb-2" style={{ color: "var(--ink)" }}>이미 만들어진 공용 모듈</h3>
          <div className="space-y-1.5 text-[13px]" style={{ color: "var(--ink-2)" }}>
            <p><code className="px-1 rounded text-[12px]" style={{ background: "var(--bg-2)" }}>lib/sessions.ts</code> — Supabase 세션 저장/불러오기</p>
            <p><code className="px-1 rounded text-[12px]" style={{ background: "var(--bg-2)" }}>lib/resources.ts</code> — 외부 리소스 데이터</p>
            <p><code className="px-1 rounded text-[12px]" style={{ background: "var(--bg-2)" }}>lib/market.ts</code> — 시장 데이터</p>
          </div>
        </section>
      </main>
    </div>
  );
}
