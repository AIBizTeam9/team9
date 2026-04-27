# 지윤 — 퀴즈 & 페르소나 생성

## 담당 영역
- `app/quiz/` — 퀴즈 폼 + 페르소나 결과 화면
- `app/api/personas/` — 퀴즈 답변 → 페르소나 2개 생성 API

## 브랜치
```
jiyun
```

## 해야 할 것 (순서대로)

### 1단계: 퀴즈 화면 만들기
app/quiz/page.tsx를 수정해서 퀴즈 페이지를 만들어줘.

요구사항:
- 사용자의 가치관, 관심사, 강점을 파악하는 질문 5~7개
- 질문 유형: 객관식(4개 보기), 슬라이더(1~10), 자유 텍스트
- 한 번에 한 문제씩 보여주고, 진행률 바가 상단에 표시
- "다음" 버튼으로 다음 질문 이동
- 마지막 질문 후 "결과 보기" 버튼
- 밝은 톤 디자인 (배경 #fafaf9, 카드 흰색, 테라코타 강조색 #d97757)

### 2단계: 페르소나 생성 API
app/api/personas/route.ts 파일을 만들어줘.

요구사항:
- POST 요청으로 퀴즈 답변 배열을 받음
- Claude API (Anthropic SDK)로 두 개의 페르소나 생성
- 각 페르소나: 이름, 나이, 직업, 성격 요약, 5년 후 모습, 장점과 리스크
- 응답: { persona_a: {...}, persona_b: {...} }
- 환경변수 ANTHROPIC_API_KEY 사용
- API 키 없으면 데모 데이터 반환
- lib/sessions.ts의 createSession으로 Supabase에 저장

### 3단계: 결과 화면 연결
퀴즈 완료 후 페르소나 결과 화면을 만들어줘.

요구사항:
- "결과 보기" 누르면 /api/personas에 POST 요청
- 로딩 중: "두 개의 미래를 만들고 있어요..." 애니메이션
- 페르소나 A(테라코타)와 B(블루) 카드 2장 나란히 표시
- 각 카드: 이름, 직업, 성격, 5년 후 모습
- 하단에 "이 두 사람의 대화를 들어볼래요?" → /debate 이동

### 4단계: 로그인 사용자 — 내 퀴즈 히스토리
로그인한 사용자의 퀴즈 기록을 저장하고 다시 볼 수 있게 해줘.

요구사항:
- 퀴즈 결과 저장 시 로그인 상태를 확인 (`lib/auth.ts`의 `getUser()` 사용)
- 로그인된 사용자면 세션에 user_id를 함께 저장
  - sessions 테이블에 user_id 컬럼이 있음 (Prisma 스키마 확인: `prisma/schema.prisma`)
  - `await prisma.session.create({ data: { quizAnswers, personaA, personaB, userId: user.id } })`
- 퀴즈 페이지 상단에 "내 기록" 버튼 추가 (로그인 시에만 표시)
- "내 기록" 클릭 시 과거 퀴즈 결과 목록을 카드로 표시:
  - 날짜, 페르소나 A 이름/직업, 페르소나 B 이름/직업
  - 카드 클릭 시 해당 결과 상세 화면으로 이동
- 비로그인 사용자도 퀴즈는 가능하지만 기록이 저장되지 않음 → "로그인하면 기록이 저장됩니다" 안내 메시지

### 5단계: 디자인 다듬기
퀴즈 페이지 디자인을 다듬어줘.

- 질문 전환 시 fade-in 애니메이션
- 선택된 보기에 체크 표시와 색상 강조
- 진행률 바에 그라데이션
- 모바일 반응형
- 페르소나 카드에 부드러운 그림자

### 6단계: 저장 & 배포
지금까지 만든 코드를 git에 커밋하고 push 해줘.
커밋 메시지는 "feat: 퀴즈 & 페르소나 생성 구현"으로.
브랜치는 jiyun.

## DB 사용법 (Prisma)
테이블 구조는 `prisma/schema.prisma`에 정의되어 있습니다.
- 테이블을 추가/변경하려면 schema.prisma를 수정하고 `npx prisma db push` 실행
- 데이터 조회/저장은 `lib/prisma.ts`의 prisma 클라이언트 사용
- 예시: `await prisma.session.create({ data: { quizAnswers: answers } })`
- 로그인 사용자 조회: `await prisma.session.findMany({ where: { userId: user.id } })`

## 사용할 수 있는 공용 모듈
- `lib/prisma.ts` — Prisma DB 클라이언트 (세션, 대화 CRUD)
- `lib/auth.ts` — Google OAuth 인증 (`getUser()`, `signInWithGoogle()`, `signOut()`)
- `lib/sessions.ts` — Supabase 세션 저장/불러오기
- `lib/resources.ts` — 외부 리소스 데이터
- `lib/market.ts` — 시장 데이터
