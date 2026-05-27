import { redirect } from "next/navigation";

// Legacy 라우트 — 표준 플로우는 /next-step/plan. 북마크/외부 링크가 끊기지
// 않도록 redirect만 남긴다. 코드는 git history에 그대로 존재.
export default function LegacyPlanPage() {
  redirect("/next-step/plan");
}
