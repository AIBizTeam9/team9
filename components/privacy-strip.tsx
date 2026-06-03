// Persistent privacy reassurance at viewport bottom. Scoped to next-step
// flow + saved-plans via the layout files that import this. Claims are the
// short-form of the audit-verified bullets on the /next-step landing card.
// On <640px viewports the tracker clause hides to prevent awkward wrap.
export default function PrivacyStrip() {
  return (
    <div
      role="contentinfo"
      aria-label="privacy"
      className="fixed inset-x-0 bottom-0"
      style={{
        zIndex: 30,
        background: "var(--bg-2)",
        borderTop: "1px solid var(--line)",
      }}
    >
      <p
        className="text-center px-3 py-1.5 text-[11.5px] leading-tight"
        style={{ color: "var(--ink-3)", wordBreak: "keep-all" }}
      >
        <span aria-hidden>🔒</span>{" "}
        답변은 암호화되어 안전하게 보관됩니다
        <span className="hidden sm:inline">
          {" · "}외부 추적기를 사용하지 않습니다
        </span>
      </p>
    </div>
  );
}
