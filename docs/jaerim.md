# 재림 — 페르소나 디베이트

## 담당 영역
- `app/debate/` — 두 페르소나의 대화 화면 + 인사이트 요약
- `app/api/debate/` — 페르소나 대화 생성 API

## 브랜치
```
jaerim
```

## 해야 할 것 (순서대로)

### 1단계: 대화 UI 만들기
app/debate/page.tsx를 수정해서 두 페르소나의 대화 화면을 만들어줘.

요구사항:
- 채팅 형태의 대화 UI (카카오톡/iMessage 느낌)
- 페르소나 A는 왼쪽 (테라코타 #d97757), B는 오른쪽 (블루 #3e6ea9)
- 각 말풍선에 페르소나 이름과 프로필 아이콘
- 대화가 한 턴씩 자동 추가되는 타이핑 애니메이션
- 상단에 페르소나 A, B 프로필 카드 2개
- "대화 시작" 버튼을 누르면 대화 시작
- 밝은 톤 (배경 #fafaf9, 카드 흰색)

### 2단계: 디베이트 API
app/api/debate/route.ts 파일을 만들어줘.

요구사항:
- POST로 페르소나 A, B 프로필 정보를 받음
- Claude API로 두 페르소나 간 5~7턴 대화 생성
- 대화 주제: "어떤 미래가 더 가치 있는가?"
- 대화 끝나면 핵심 인사이트 3개 정리
- 응답: { turns: [{speaker, content}...], insights: [string...] }
- ANTHROPIC_API_KEY 환경변수 사용, 없으면 데모 데이터 반환

### 3단계: 인사이트 요약 화면
대화 끝난 후 인사이트 요약 화면을 추가해줘.

- "인사이트 보기" 버튼 → 카드 3개 슬라이드 업으로 등장
- 각 인사이트 카드: 아이콘 + 제목 + 설명
- 하단에 "90일 플랜 만들기" → /plan 이동
- sessionId를 URL 파라미터로 전달

### 4단계: 로그인 사용자 — 내 디베이트 기록 & 공유
로그인한 사용자의 디베이트 기록을 볼 수 있고, 결과를 공유할 수 있게 해줘.

요구사항:
- 디베이트 결과를 DB에 저장할 때 로그인 상태 확인 (`lib/auth.ts`의 `getUser()` 사용)
- 로그인된 사용자면 conversations 저장 시 해당 세션의 user_id가 이미 연결되어 있음
  - 세션 조회: `await prisma.session.findMany({ where: { userId: user.id }, include: { conversations: true } })`
- 디베이트 페이지 상단에 "내 디베이트 기록" 버튼 추가 (로그인 시에만 표시)
- 기록 목록: 날짜, 페르소나 A vs B 이름, 대화 턴 수
- 카드 클릭 시 해당 디베이트 대화를 다시 재생 (읽기 전용)
- 공유 기능: "결과 공유" 버튼 → 세션 ID 기반 공유 URL 생성
  - `/debate?sessionId=xxx` 형태로 다른 사람도 디베이트 결과를 볼 수 있게
- 비로그인 사용자도 디베이트는 가능하지만 기록이 남지 않음

### 5단계: 디자인 다듬기
디베이트 페이지 디자인을 다듬어줘.

- 대화 턴 추가 시 fade-in + slide-up
- 타이핑 중... 애니메이션
- 자동 스크롤
- 모바일 반응형
- 인사이트 카드에 부드러운 그림자

### 6단계: 저장 & 배포
지금까지 만든 코드를 git에 커밋하고 push 해줘.
커밋 메시지는 "feat: 페르소나 디베이트 대화 구현"으로.
브랜치는 jaerim.

## DB 사용법 (Prisma)
테이블 구조는 `prisma/schema.prisma`에 정의되어 있습니다.
- 테이블을 추가/변경하려면 schema.prisma를 수정하고 `npx prisma db push` 실행
- 데이터 조회/저장은 `lib/prisma.ts`의 prisma 클라이언트 사용
- 대화 저장: `await prisma.conversation.create({ data: { sessionId, speaker: 'A', content, turnOrder: 1 } })`
- 사용자별 세션+대화 조회: `await prisma.session.findMany({ where: { userId: user.id }, include: { conversations: true } })`

## 사용할 수 있는 공용 모듈
- `lib/prisma.ts` — Prisma DB 클라이언트 (세션, 대화 CRUD)
- `lib/auth.ts` — Google OAuth 인증 (`getUser()`, `signInWithGoogle()`, `signOut()`)
- `lib/sessions.ts` — Supabase 세션 저장/불러오기
- `lib/resources.ts` — 외부 리소스 데이터
- `lib/market.ts` — 시장 데이터
