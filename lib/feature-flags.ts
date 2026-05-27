// 시연 데모용 feature gate. 핵심 플로우(/next-step)는 그대로 두고, 반쯤 만든
// 실험 라우트는 production에선 기본 숨김. 환경변수로 다시 켤 수 있다.
//
// 사용법:
//   import { assertExperimentalEnabled } from "@/lib/feature-flags";
//   assertExperimentalEnabled(); // 비활성 환경이면 notFound()로 즉시 404
//
// 활성화: NEXT_PUBLIC_SHOW_LAB=1 (배포 환경변수에 추가).
// 코드는 그대로 git history에 남아 있어 언제든 복구 가능 — 삭제가 아닌 hide.

import { notFound } from "next/navigation";

export function experimentalEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_LAB === "1";
}

export function assertExperimentalEnabled(): void {
  if (!experimentalEnabled()) notFound();
}
