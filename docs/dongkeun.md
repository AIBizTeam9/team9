# 동근 — 시장 인사이트 & 외부 리소스

## 담당 영역
- `app/market/` — 시장 인사이트 페이지
- `app/resources/` — 외부 데이터 허브 페이지
- `app/api/market/` — 시장 데이터 API
- `app/api/resources/` — 외부 리소스 API
- `lib/market.ts` — 시장 데이터 타입/유틸
- `lib/resources.ts` — 외부 리소스 타입/유틸

## 브랜치
```
dongkeun
```

## 현재 완료된 것
- 시장 인사이트 페이지 (app/market/) — 5개 카테고리, 검색/필터링
- 외부 리소스 페이지 (app/resources/) — 5개 카테고리
- 시장 데이터 API (app/api/market/) — 20개 항목, 카테고리/키워드 필터
- 외부 리소스 API (app/api/resources/) — 27개 리소스
- 공용 모듈 (lib/market.ts, lib/resources.ts)
- Google OAuth 로그인 기능
- 전체 디자인 시스템, 네비게이션, 개발가이드
- Prisma ORM 설정 (DB 스키마 코드 관리)

## 해야 할 것 (순서대로)

### 1단계: 시장 데이터 시각화
app/market/page.tsx에 시장 데이터를 차트/그래프로 시각화해줘.

요구사항:
- 카테고리별 항목 수를 막대 차트 또는 도넛 차트로 표시
- 트렌드 데이터가 있으면 시계열 라인 차트
- CSS만으로 간단한 차트 구현 (별도 차트 라이브러리 설치 불필요)
- 차트 위에 핵심 수치 카드 (총 항목 수, 카테고리 수, 최신 업데이트 날짜)
- 밝은 톤 (배경 #fafaf9, 카드 흰색, 테라코타 강조색 #d97757)

### 2단계: 페이지 간 데이터 연결
퀴즈 결과를 기반으로 시장 인사이트와 리소스를 맞춤 정렬해줘.

요구사항:
- URL 파라미터 `?sessionId=xxx`로 세션 ID를 받음
- 세션의 퀴즈 답변/페르소나에서 키워드 추출
- 해당 키워드와 관련된 시장 데이터를 상단에 "맞춤 추천" 배지와 함께 표시
- 세션 없으면 기본 정렬 유지
- 디베이트 페이지, 플랜 페이지에서 "관련 시장 데이터 보기" 링크로 연결

### 3단계: 로그인 사용자 — 북마크 기능
로그인한 사용자가 시장 인사이트와 리소스를 북마크할 수 있게 해줘.

요구사항:
- 로그인 상태 확인 (`lib/auth.ts`의 `getUser()` 사용)
- Bookmark 테이블은 이미 prisma/schema.prisma에 정의되어 있음:
  ```
  model Bookmark {
    id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
    userId    String   @map("user_id")
    itemType  String   @map("item_type")   // "market" 또는 "resource"
    itemId    String   @map("item_id")
    createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
    @@unique([userId, itemType, itemId])
    @@index([userId])
    @@map("bookmarks")
  }
  ```
- 북마크 API 만들기: `app/api/bookmarks/route.ts`
  - POST: 북마크 추가 `{ itemType, itemId }`
  - DELETE: 북마크 삭제 `{ itemType, itemId }`
  - GET: 내 북마크 목록 조회
- 시장 인사이트, 리소스 카드마다 북마크 아이콘(별 ☆/★) 추가
  - 로그인 시: 클릭하면 DB에 저장/삭제 토글
  - 비로그인 시: 클릭하면 "로그인하면 북마크할 수 있습니다" 안내
- "내 북마크" 탭 또는 필터 추가 (로그인 시에만 표시)
  - 북마크한 시장 인사이트와 리소스를 한 곳에서 보기

### 4단계: 로그인 사용자 — 맞춤 추천
로그인 사용자의 퀴즈 결과를 기반으로 관련 시장 데이터/리소스를 자동 추천해줘.

요구사항:
- 로그인 사용자의 최신 세션 조회:
  `await prisma.session.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } })`
- 세션의 페르소나 직업/키워드에 매칭되는 카테고리의 데이터를 상단에 "추천" 배지로 표시
- 추천 섹션: "OO님을 위한 추천" 카드 영역을 페이지 최상단에 배치
- 추천이 없으면 (퀴즈 미완료) "퀴즈를 먼저 해보세요" → /quiz 링크

### 5단계: 디자인 다듬기
시장 인사이트와 리소스 페이지 디자인을 다듬어줘.

- 차트에 hover 시 수치 툴팁
- 카드 hover 시 부드러운 그림자 확대
- 북마크 아이콘 클릭 시 채워지는 애니메이션
- 추천 배지에 반짝이는 효과
- 모바일 반응형

### 6단계: 저장 & 배포
지금까지 만든 코드를 git에 커밋하고 push 해줘.
커밋 메시지는 "feat: 시장 인사이트 시각화 & 북마크 & 맞춤추천 구현"으로.
브랜치는 dongkeun.

## DB 사용법 (Prisma)
테이블 구조는 `prisma/schema.prisma`에 정의되어 있습니다.
- 테이블을 추가/변경하려면 schema.prisma를 수정하고 `npx prisma db push` 실행
- 데이터 조회/저장은 `lib/prisma.ts`의 prisma 클라이언트 사용
- 북마크 추가: `await prisma.bookmark.create({ data: { userId, itemType: 'market', itemId } })`
- 북마크 삭제: `await prisma.bookmark.delete({ where: { userId_itemType_itemId: { userId, itemType, itemId } } })`
- 내 북마크 조회: `await prisma.bookmark.findMany({ where: { userId } })`
- 사용자별 최신 세션: `await prisma.session.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } })`
- Supabase 대시보드에 직접 들어갈 필요 없음!

## 사용할 수 있는 공용 모듈
- `lib/prisma.ts` — Prisma DB 클라이언트 (세션, 대화, 북마크 CRUD)
- `lib/auth.ts` — Google OAuth 인증 (`getUser()`, `signInWithGoogle()`, `signOut()`)
- `lib/sessions.ts` — Supabase 세션 저장/불러오기
