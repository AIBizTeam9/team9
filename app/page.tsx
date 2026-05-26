import { redirect } from "next/navigation";

// 첫 랜딩 페이지는 바로 90일 플랜 시작 화면으로.
export default function HomePage() {
  redirect("/next-step");
}
