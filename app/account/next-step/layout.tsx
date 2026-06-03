import PrivacyStrip from "@/components/privacy-strip";

// Saved-plans surface (list + detail). Same strip as the live next-step
// flow so the reassurance is continuous across the experience.
export default function AccountNextStepLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div style={{ paddingBottom: 40 }}>{children}</div>
      <PrivacyStrip />
    </>
  );
}
