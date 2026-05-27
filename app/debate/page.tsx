import { redirect } from "next/navigation";

// Legacy 라우트 — 디베이트는 이제 /next-step/loading 안에서 채팅 카드로
// 렌더된다. 단독 페이지가 없으므로 funnel 진입점으로 redirect.
export default function LegacyDebatePage() {
  redirect("/next-step");
}
