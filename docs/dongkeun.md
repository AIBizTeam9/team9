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

## 남은 작업
- 실제 외부 API 연동 (현재는 하드코딩된 데모 데이터)
- 시장 데이터 시각화 (차트, 그래프)
- 페이지 간 데이터 연결 (퀴즈 결과 → 맞춤 시장 데이터)
- 로그인 사용자 북마크 기능

### 로그인 사용자 — 북마크 & 맞춤 추천
로그인한 사용자가 시장 인사이트와 리소스를 북마크하고, 퀴즈 결과 기반으로 맞춤 추천을 받을 수 있게 해줘.

요구사항:
- 로그인 상태 확인 (`lib/auth.ts`의 `getUser()` 사용)
- prisma/schema.prisma에 Bookmark 모델 추가:
  ```
  model Bookmark {
    id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
    userId     String   @map("user_id")
    itemType   String   @map("item_type")   // "market" 또는 "resource"
    itemId     String   @map("item_id")
    createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz
    @@unique([userId, itemType, itemId])
    @@index([userId])
    @@map("bookmarks")
  }
  ```
- 시장 인사이트, 리소스 카드마다 북마크 아이콘(하트 또는 별) 추가
  - 로그인 시: 클릭하면 DB에 저장/삭제 토글
  - 비로그인 시: 클릭하면 "로그인하면 북마크할 수 있습니다" 안내
- "내 북마크" 탭 또는 필터 추가 (로그인 시에만 표시)
  - 북마크한 시장 인사이트와 리소스를 한 곳에서 보기
- 맞춤 추천: 로그인 사용자의 최신 퀴즈 결과(세션)를 조회해서 관련 카테고리의 시장 데이터/리소스를 상단에 "추천" 배지로 표시
  - `await prisma.session.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } })`

## DB 사용법 (Prisma)
테이블 구조는 `prisma/schema.prisma`에 정의되어 있습니다.
- 테이블을 추가/변경하려면 schema.prisma를 수정하고 `npx prisma db push` 실행
- 데이터 조회/저장은 `lib/prisma.ts`의 prisma 클라이언트 사용
- Supabase 대시보드에 직접 들어갈 필요 없음!

## 사용할 수 있는 공용 모듈
- `lib/prisma.ts` — Prisma DB 클라이언트 (세션, 대화 CRUD)
- `lib/auth.ts` — Google OAuth 인증 (`getUser()`, `signInWithGoogle()`, `signOut()`)
- `lib/sessions.ts` — Supabase 세션 저장/불러오기
