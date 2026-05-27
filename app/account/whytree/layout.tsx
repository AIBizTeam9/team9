import { assertExperimentalEnabled } from "@/lib/feature-flags";

// /whytree와 짝 — 같은 flag로 동시에 활성/비활성.
export default function AccountWhyTreeLayout({ children }: { children: React.ReactNode }) {
  assertExperimentalEnabled();
  return children;
}
