# Code Health Report — 2026-05-23

## 메타

- **Project:** Next Step in Life (team9)
- **Branch:** `dongkeun`
- **Run by:** `/health` (gstack skill)
- **History entry:** `~/.gstack/projects/AIBizTeam9-team9/health-history.jsonl`

## Dashboard

| Category    | Tool             | Score   | Status   | Duration | Details                                  |
| ----------- | ---------------- | ------- | -------- | -------- | ---------------------------------------- |
| Type check  | `tsc --noEmit`   | 10/10   | CLEAN    | 7s       | 0 errors                                 |
| Lint        | `npm run lint`   | SKIP    | BROKEN   | 8s       | ESLint config circular ref               |
| Tests       | (none)           | SKIP    | N/A      | —        | `package.json`에 `test` 스크립트 없음    |
| Dead code   | (none)           | SKIP    | N/A      | —        | knip 미설치                              |
| Shell lint  | (none)           | SKIP    | N/A      | —        | 프로젝트에 `.sh` 없음 (whytree 별개)     |
| GBrain      | (none)           | SKIP    | N/A      | —        | gbrain 미설치                            |

**Composite: 10.0 / 10** — typecheck 단독 점수 (가중치 100% 재분배). 5개 축 중 1개만 가용하므로 점수의 신뢰도는 낮다.

## 핵심 발견: Lint가 사실상 안 돌고 있음

`npm run lint` 실행 시 ESLint가 검사를 시작도 못 하고 죽는다:

```
TypeError: Converting circular structure to JSON
  property 'react' closes the circle
  at file:///D:/Edev/team9/node_modules/@eslint/eslintrc/lib/shared/config-validator.js:308:45
```

원인 추정: ESLint 9.39.4 + `eslint-config-next` 16.2.1 + 옛 config 호환 레이어(`@eslint/eslintrc`의 `FlatCompat`) 사이의 호환 문제. `eslint.config.mjs:13`의 다음 줄에서 발생:

```ts
...compat.extends("next/core-web-vitals", "next/typescript")
```

함정: `npm run lint`의 exit code는 0으로 끝나서 CI가 통과한 것처럼 보일 수 있음. **실제로는 한 줄도 검사하지 않은 무통과.**

## Vercel 환경 분석 — 이게 production에 영향 있나?

**없다.** 이유:

1. **`vercel-build` = `node scripts/migrate.mjs && next build`** — lint 호출 없음.
2. **`next.config.ts`에 lint 관련 설정 없음** → Next.js 기본 동작 사용.
3. **Next.js 15부터 `next build`는 ESLint 자동 실행을 중단**했고, Next.js 16에서는 `next lint` 명령 자체가 제거됨.
4. **TypeScript는 깨끗** — `next build`가 타입 체크를 돌리고 ([next.config.ts](next.config.ts)에 `typescript.ignoreBuildErrors` 없음), 우리 typecheck도 EXIT 0.

→ lint가 깨져 있어도 Vercel 배포 경로엔 영향 0.

## 권고 재평가

| 권고             | gstack 원래 우선순위 | 재평가             | 이유                                                                  |
| ---------------- | -------------------- | ------------------ | --------------------------------------------------------------------- |
| Lint 살리기      | HIGH                 | **LOW**            | Vercel이 lint를 안 봄. 로컬 코드 품질 확인용으로만 영향.              |
| 테스트 추가      | MED                  | **거의 필요 없음** | 학교 팀플 + LLM 응답 중심. 테스트할 결정적 로직이 적음.               |
| Dead code 검사   | LOW                  | **잠재 노이즈**    | [spec의 Out of scope](spec-next-step-90-day-plan.md) 메뉴는 의도적으로 남겨둔 거라 false positive 많을 듯. |

## 만약 굳이 한 가지를 고친다면

[eslint.config.mjs](eslint.config.mjs)의 `FlatCompat` 우회를 빼고 native flat config로 이전. 예시 방향:

```ts
// eslint.config.mjs (native flat 예시 — 검증 필요)
import nextPlugin from "@next/eslint-plugin-next";

export default [
  {
    plugins: { "@next/next": nextPlugin },
    rules: { ...nextPlugin.configs.recommended.rules },
  },
];
```

**다만 발표/제출 전엔 굳이 안 해도 됨.** 시간 더 가치 있게 쓸 곳 많음 (예: [spec의 Open questions](spec-next-step-90-day-plan.md)).

## 결론

- **지금 아무것도 안 해도 production은 안전.**
- `/health`가 빨간불을 들었지만, 빨간 카테고리는 모두 Vercel 배포 경로에 영향 없는 것들이다.
- PR 머지 직전 충돌 잡기용 자동 lint 게이트가 필요해질 시점이 오면 그때 5분 들여 처리. 그전엔 typecheck 하나로 충분.

## 다음 health 체크

같은 명령 (`/health`)을 다시 돌리면 위 history 파일과 비교해서 trend가 표시됨. 변화를 추적하고 싶을 때만 다시 돌리면 됨.
