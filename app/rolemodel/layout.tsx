import { assertExperimentalEnabled } from "@/lib/feature-flags";

export default function RoleModelLayout({ children }: { children: React.ReactNode }) {
  assertExperimentalEnabled();
  return children;
}
