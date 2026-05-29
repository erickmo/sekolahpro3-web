import { useActiveChild } from "../lib/activeChild";

/** Transient banner shown when a per-child fetch is denied (403). */
export function ChildAccessNotice() {
  const { notice, dismissNotice } = useActiveChild();
  if (!notice) return null;
  return (
    <div
      role="alert"
      className="mb-4 flex items-center justify-between rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
    >
      <span>{notice}</span>
      <button
        type="button"
        onClick={dismissNotice}
        aria-label="Tutup peringatan"
        className="text-danger/70 hover:text-danger"
      >
        ✕
      </button>
    </div>
  );
}
