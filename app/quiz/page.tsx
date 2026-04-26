"use client";

export default function QuizPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="max-w-[980px] mx-auto px-6 py-5">
          <h1 className="font-serif text-2xl tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
            퀴즈 & 페르소나
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--ink-3)" }}>
            나를 알아가는 질문 → 두 개의 미래 자아 생성
          </p>
        </div>
      </header>

      <main className="max-w-[700px] mx-auto px-6 py-12">
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl" style={{ background: "var(--warm-soft)" }}>🧪</div>
          <h2 className="font-serif text-3xl tracking-[-0.02em] mb-3" style={{ color: "var(--ink)" }}>
            지윤님의 개발 영역
          </h2>
          <p className="text-[14px] max-w-md mx-auto leading-relaxed mb-6" style={{ color: "var(--ink-3)" }}>
            아래 프롬프트를 순서대로 AI에게 입력하면 이 페이지가 완성됩니다.
          </p>
          <span className="inline-flex px-4 py-1.5 rounded-full text-[12px]" style={{ background: "var(--warm-soft)", color: "var(--warm)", border: "1px solid var(--line)" }}>
            담당: 지윤 · 개발 대기
          </span>
        </div>

        {/* 시작 전 준비 */}
        <section className="rounded-2xl p-5 mb-5" style={{ background: "var(--bg-2)", border: "1px solid var(--line)", boxShadow: "var(--shadow)" }}>
          <h3 className="font-serif text-lg mb-2" style={{ color: "var(--ink)" }}>시작 전 준비</h3>
          <p className="text-[13px] mb-2" style={{ color: "var(--ink-3)" }}>VS Code 터미널에서 본인 브랜치로 이동하세요:</p>
          <pre className="rounded-lg p-3 text-[12px]" style={{ background: "var(--accent-2)", color: "var(--ink-2)" }}>git checkout jiyun</pre>
          <p className="text-[12px] mt-2" style={{ color: "var(--ink-3)" }}>Vercel 배포 설정 → docs/deploy-guide.html 참고</p>
        </section>

        {/* 프롬프트 */}
        <section className="rounded-2xl p-5 mb-5" style={{ background: "var(--bg-2)", border: "1px solid var(--line)", boxShadow: "var(--shadow)" }}>
          <h3 className="font-serif text-lg mb-1" style={{ color: "var(--ink)" }}>AI에게 입력할 프롬프트</h3>
          <p className="text-[12px] mb-5" style={{ color: "var(--ink-3)" }}>순서대로 복사해서 VS Code AI 채팅창에 붙여넣으세요.</p>

          {[
            { n: 1, title: "퀴즈 화면 만들기", prompt: `app/quiz/page.tsx 파일을 수정해서 퀴즈 페이지를 만들어줘.

요구사항:
- 사용자의 가치관, 관심사, 강점을 파악하는 질문 5~7개
- 질문 유형: 객관식(4개 보기), 슬라이더(1~10), 자유 텍스트
- 한 번에 한 문제씩 보여주고, 진행률 바가 상단에 표시
- "다음" 버튼을 누르면 다음 질문으로 넘어감
- 마지막 질문 후 "결과 보기" 버튼
- 밝은 톤의 디자인 (배경 #fafaf9, 카드 흰색, 테라코타 강조색 #d97757)` },
            { n: 2, title: "페르소나 생성 API", prompt: `app/api/personas/route.ts 파일을 만들어줘.

요구사항:
- POST 요청으로 퀴즈 답변 배열을 받음
- Claude API (Anthropic SDK)를 사용해서 두 개의 페르소나 생성
- 각 페르소나: 이름, 나이, 직업, 성격 요약, 5년 후 모습, 장점과 리스크
- 응답: { persona_a: {...}, persona_b: {...} }
- 환경변수 ANTHROPIC_API_KEY 사용
- API 키 없으면 데모 데이터 반환
- lib/sessions.ts의 createSession으로 Supabase에 저장` },
            { n: 3, title: "결과 화면 연결", prompt: `퀴즈 완료 후 페르소나 결과 화면을 만들어줘.

요구사항:
- "결과 보기" 누르면 /api/personas에 POST 요청
- 로딩 중: "두 개의 미래를 만들고 있어요..." 애니메이션
- 페르소나 A(테라코타)와 B(블루) 카드 2장 나란히 표시
- 각 카드: 이름, 직업, 성격, 5년 후 모습
- 하단에 "이 두 사람의 대화를 들어볼래요?" → /debate 이동` },
            { n: 4, title: "디자인 다듬기", prompt: `퀴즈 페이지 디자인을 다듬어줘.

- 질문 전환 시 fade-in 애니메이션
- 선택된 보기에 체크 표시와 색상 강조
- 진행률 바에 그라데이션
- 모바일 반응형
- 페르소나 카드에 부드러운 그림자` },
            { n: 5, title: "저장하고 배포", prompt: `지금까지 만든 코드를 git에 커밋하고 push 해줘.
커밋 메시지는 "feat: 퀴즈 & 페르소나 생성 구현"으로.
브랜치는 jiyun.`, green: true },
          ].map((item) => (
            <div key={item.n} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: item.green ? "var(--green)" : "var(--warm)" }}>{item.n}</span>
                <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>{item.title}</span>
              </div>
              <pre className="rounded-xl p-4 text-[12px] overflow-x-auto whitespace-pre-wrap leading-relaxed" style={{ background: "var(--accent-2)", color: "var(--ink-2)", border: "1px solid var(--line)" }}>{item.prompt}</pre>
            </div>
          ))}
        </section>

        {/* 팁 */}
        <section className="rounded-2xl p-5 mb-5" style={{ background: "var(--bg-2)", border: "1px solid var(--line)", boxShadow: "var(--shadow)" }}>
          <h3 className="font-serif text-lg mb-3" style={{ color: "var(--ink)" }}>바이브코딩 팁</h3>
          <div className="space-y-2 text-[13px]" style={{ color: "var(--ink-3)" }}>
            <p><strong style={{ color: "var(--ink-2)" }}>마음에 안 들면?</strong> → &ldquo;이 부분을 ~로 바꿔줘&rdquo;</p>
            <p><strong style={{ color: "var(--ink-2)" }}>에러가 나면?</strong> → 에러 메시지 복사해서 &ldquo;이 에러 고쳐줘&rdquo;</p>
            <p><strong style={{ color: "var(--ink-2)" }}>로컬 확인?</strong> → &ldquo;개발 서버 실행해줘&rdquo;</p>
            <p><strong style={{ color: "var(--ink-2)" }}>참고 디자인?</strong> → 이미지나 URL을 함께 보내세요</p>
          </div>
        </section>

        {/* 공용 모듈 */}
        <section className="rounded-2xl p-5" style={{ background: "var(--accent-2)", border: "1px solid var(--line)" }}>
          <h3 className="font-serif text-lg mb-2" style={{ color: "var(--ink)" }}>이미 만들어진 공용 모듈</h3>
          <p className="text-[12px] mb-3" style={{ color: "var(--ink-3)" }}>AI에게 &ldquo;이 모듈을 사용해서 만들어줘&rdquo;라고 알려주세요.</p>
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
