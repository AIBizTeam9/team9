import PrivacyStrip from "@/components/privacy-strip";

// Scoped layout: only the next-step flow (landing, quiz, personas, loading,
// plan) gets the persistent privacy strip — login/auth/marketing routes do
// not. Padding-bottom on the wrapper guarantees normal-flow content can't be
// covered by the fixed strip (~28-30px tall).
export default function NextStepLayout({
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
