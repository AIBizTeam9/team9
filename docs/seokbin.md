# 석빈 — 90일 실행 플랜

## 담당 영역
- `app/plan/` — 90일 실행 플랜 타임라인 UI
- `app/api/plan/` — 플랜 생성 API

## 브랜치
```
seokbin
```

## 해야 할 것 (순서대로)

### 1단계: 타임라인 UI 만들기
app/plan/page.tsx를 수정해서 90일 실행 플랜 타임라인을 만들어줘.

요구사항:
- 30일씩 3단계 세로 타임라인
- 1단계 (1~30일): 탐색 & 학습 — 초록 계열
- 2단계 (31~60일): 실행 & 경험 — 블루 계열
- 3단계 (61~90일): 도약 & 정착 — 테라코타 계열
- 각 단계에 목표 1개, 행동 항목 3~5개 (체크박스)
- 상단에 전체 진행률 원형 차트
- "플랜 생성하기" 버튼 → /api/plan 요청
- 밝은 톤 (배경 #fafaf9, 카드 흰색)

### 2단계: 플랜 생성 API
app/api/plan/route.ts 파일을 만들어줘.

요구사항:
- POST로 디베이트 인사이트 배열을 받음
- Claude API로 90일 실행 플랜 생성
- 응답 형식:
  { phases: [{ title, days, goal, actions: [...], resources: [...] }, ...] }
- ANTHROPIC_API_KEY 환경변수 사용
- 없으면 하드코딩된 예시 플랜 반환 (데모 모드)

### 3단계: 추천 리소스 연결
플랜 각 단계에 관련 외부 리소스를 자동 추천해줘.

- lib/resources.ts의 fetchResources 사용
- lib/market.ts의 fetchMarketData 사용
- 1단계: 강의/교육 추천
- 2단계: 채용 정보, 커뮤니티 추천
- 3단계: 트렌드, 연봉 정보 추천
- 추천 리소스는 카드로 표시, 클릭 시 외부 링크

### 4단계: 로그인 사용자 — 플랜 진행률 저장 & 대시보드
로그인한 사용자가 체크박스를 체크하면 진행 상황이 DB에 저장되도록 해줘.

요구사항:
- 로그인 상태 확인 (`lib/auth.ts`의 `getUser()` 사용)
- 세션에 이미 user_id가 연결되어 있으므로, 세션의 insight 필드에 플랜 데이터와 체크 상태를 함께 저장
  - `await prisma.session.update({ where: { id: sessionId }, data: { insight: { plan, checkedItems } } })`
- 체크박스 클릭 시 자동 저장 (디바운스 적용, 매번 API 호출 방지)
- 로그인 사용자: 페이지 재방문 시 체크 상태 복원
- 비로그인 사용자: 체크는 가능하지만 브라우저 종료 시 초기화됨 → "로그인하면 진행 상황이 저장됩니다" 안내
- 플랜 페이지 상단에 "내 플랜 목록" 버튼 (로그인 시에만 표시)
  - 과거 플랜 목록: 날짜, 진행률(%), 단계별 완료 현황
  - 카드 클릭 시 해당 플랜으로 이동

### 5단계: 디자인 다듬기
90일 플랜 페이지 디자인을 다듬어줘.

- 타임라인에 세로 연결선 + 원형 마커
- 단계 펼치기 accordion 애니메이션
- 진행률 원형 차트에 숫자 카운트 업
- 체크박스 완료 시 취소선
- 모바일 반응형

### 6단계: 저장 & 배포
지금까지 만든 코드를 git에 커밋하고 push 해줘.
커밋 메시지는 "feat: 90일 실행 플랜 타임라인 구현"으로.
브랜치는 seokbin.

## DB 사용법 (Prisma)
테이블 구조는 `prisma/schema.prisma`에 정의되어 있습니다.
- 테이블을 추가/변경하려면 schema.prisma를 수정하고 `npx prisma db push` 실행
- 데이터 조회/저장은 `lib/prisma.ts`의 prisma 클라이언트 사용
- 세션 조회: `await prisma.session.findUnique({ where: { id: sessionId } })`
- 진행률 업데이트: `await prisma.session.update({ where: { id: sessionId }, data: { insight: updatedData } })`
- 사용자별 세션 목록: `await prisma.session.findMany({ where: { userId: user.id } })`

## 사용할 수 있는 공용 모듈
- `lib/prisma.ts` — Prisma DB 클라이언트 (세션, 대화 CRUD)
- `lib/auth.ts` — Google OAuth 인증 (`getUser()`, `signInWithGoogle()`, `signOut()`)
- `lib/sessions.ts` — Supabase 세션 저장/불러오기
- `lib/resources.ts` — 외부 리소스 데이터
- `lib/market.ts` — 시장 데이터
