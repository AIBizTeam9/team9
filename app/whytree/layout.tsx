import { assertExperimentalEnabled } from "@/lib/feature-flags";

// 시연 데모에선 prod에서 숨김. NEXT_PUBLIC_SHOW_LAB=1로 다시 활성화 가능.
export default function WhyTreeLayout({ children }: { children: React.ReactNode }) {
  assertExperimentalEnabled();
  return children;
}
