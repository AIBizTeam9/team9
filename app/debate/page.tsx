"use client";

export default function DebatePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="max-w-[980px] mx-auto px-6 py-5">
          <h1 className="font-serif text-2xl tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
            페르소나 디베이트
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--ink-3)" }}>
            두 미래 자아의 대화 → 인사이트 도출
          </p>
        </div>
      </header>

      <main className="max-w-[700px] mx-auto px-6 py-12">
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl" style={{ background: "var(--blue-soft)" }}>💬</div>
          <h2 className="font-serif text-3xl tracking-[-0.02em] mb-3" style={{ color: "var(--ink)" }}>
            재림님의 개발 영역
          </h2>
          <p className="text-[14px] max-w-md mx-auto leading-relaxed mb-6" style={{ color: "var(--ink-3)" }}>
            아래 프롬프트를 순서대로 AI에게 입력하면 이 페이지가 완성됩니다.
          </p>
          <span className="inline-flex px-4 py-1.5 rounded-full text-[12px]" style={{ background: "var(--blue-soft)", color: "var(--blue)", border: "1px solid var(--line)" }}>
            담당: 재림 · 개발 대기
          </span>
        </div>

        <section className="rounded-2xl p-5 mb-5" style={{ background: "var(--bg-2)", border: "1px solid var(--line)", boxShadow: "var(--shadow)" }}>
          <h3 className="font-serif text-lg mb-2" style={{ color: "var(--ink)" }}>시작 전 준비</h3>
          <pre className="rounded-lg p-3 text-[12px]" style={{ background: "var(--accent-2)", color: "var(--ink-2)" }}>git checkout jaerim</pre>
        </section>

        <section className="rounded-2xl p-5 mb-5" style={{ background: "var(--bg-2)", border: "1px solid var(--line)", boxShadow: "var(--shadow)" }}>
          <h3 className="font-serif text-lg mb-1" style={{ color: "var(--ink)" }}>AI에게 입력할 프롬프트</h3>
          <p className="text-[12px] mb-5" style={{ color: "var(--ink-3)" }}>순서대로 복사해서 VS Code AI 채팅창에 붙여넣으세요.</p>

          {[
            { n: 1, title: "대화 UI 만들기", prompt: `app/debate/page.tsx를 수정해서 두 페르소나의 대화 화면을 만들어줘.

요구사항:
- 채팅 형태의 대화 UI (카카오톡/iMessage 느낌)
- 페르소나 A는 왼쪽 (테라코타 #d97757), B는 오른쪽 (블루 #3e6ea9)
- 각 말풍선에 페르소나 이름과 프로필 아이콘
- 대화가 한 턴씩 자동 추가되는 타이핑 애니메이션
- 상단에 페르소나 A, B 프로필 카드 2개
- "대화 시작" 버튼을 누르면 대화 시작
- 밝은 톤 (배경 #fafaf9, 카드 흰색)` },
            { n: 2, title: "디베이트 API", prompt: `app/api/debate/route.ts 파일을 만들어줘.

요구사항:
- POST로 페르소나 A, B 프로필 정보를 받음
- Claude API로 두 페르소나 간 5~7턴 대화 생성
- 대화 주제: "어떤 미래가 더 가치 있는가?"
- 대화 끝나면 핵심 인사이트 3개 정리
- 응답: { turns: [{speaker, content}...], insights: [string...] }
- ANTHROPIC_API_KEY 환경변수 사용, 없으면 데모 데이터 반환` },
            { n: 3, title: "인사이트 요약 화면", prompt: `대화 끝난 후 인사이트 요약 화면을 추가해줘.

- "인사이트 보기" 버튼 → 카드 3개 슬라이드 업으로 등장
- 각 인사이트 카드: 아이콘 + 제목 + 설명
- 하단에 "90일 플랜 만들기" → /plan 이동
- sessionId를 URL 파라미터로 전달` },
            { n: 4, title: "디자인 다듬기", prompt: `디베이트 페이지 디자인을 다듬어줘.

- 대화 턴 추가 시 fade-in + slide-up
- 타이핑 중... 애니메이션
- 자동 스크롤
- 모바일 반응형
- 인사이트 카드에 부드러운 그림자` },
            { n: 5, title: "저장하고 배포", prompt: `지금까지 만든 코드를 git에 커밋하고 push 해줘.
커밋 메시지는 "feat: 페르소나 디베이트 대화 구현"으로.
브랜치는 jaerim.`, green: true },
          ].map((item) => (
            <div key={item.n} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: item.green ? "var(--green)" : "var(--blue)" }}>{item.n}</span>
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
