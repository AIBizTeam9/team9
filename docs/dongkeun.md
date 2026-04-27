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

## 남은 작업
- 실제 외부 API 연동 (현재는 하드코딩된 데모 데이터)
- 시장 데이터 시각화 (차트, 그래프)
- 페이지 간 데이터 연결 (퀴즈 결과 → 맞춤 시장 데이터)

## DB 사용법 (Prisma)
테이블 구조는 `prisma/schema.prisma`에 정의되어 있습니다.
- 테이블을 추가/변경하려면 schema.prisma를 수정하고 `npx prisma db push` 실행
- 데이터 조회/저장은 `lib/prisma.ts`의 prisma 클라이언트 사용
- Supabase 대시보드에 직접 들어갈 필요 없음!

## 사용할 수 있는 공용 모듈
- `lib/prisma.ts` — Prisma DB 클라이언트 (세션, 대화 CRUD)
- `lib/sessions.ts` — Supabase 세션 저장/불러오기
- `lib/auth.ts` — Google OAuth 인증
