import { assertExperimentalEnabled } from "@/lib/feature-flags";

export default function LetterLayout({ children }: { children: React.ReactNode }) {
  assertExperimentalEnabled();
  return children;
}
