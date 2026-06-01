/**
 * OpnameSubmitConfirmModal — final confirmation before submitting an opname
 * (layer: presentational).
 *
 * Submitting is irreversible: Hilang → eksemplar non-aktif, Rusak → kondisi
 * update. This modal surfaces the impact counts and the no-revert warning, then
 * delegates the actual submit to the callback the route passes down. Renders
 * nothing when closed.
 */
import { Button, IconAlert } from "@sekolahpro/ui";
import type { OpnameStats } from "./useOpnameSession";

interface Props {
  open: boolean;
  stats: OpnameStats;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Render the submit-confirmation overlay. Clicking the backdrop cancels;
 * clicks inside the dialog are stopped from bubbling to the backdrop.
 */
export function OpnameSubmitConfirmModal({ open, stats, saving, onCancel, onConfirm }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-fg">Konfirmasi Submit Opname</h3>
        <p className="mt-2 text-sm text-muted-fg">
          {stats.hilang} eksemplar akan ditandai <b>Hilang</b> dan dinon-aktifkan.
          {stats.rusak > 0 ? ` ${stats.rusak} eksemplar akan ditandai Rusak.` : ""}
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
          <IconAlert className="h-4 w-4 shrink-0" />
          <span>Cancel tidak akan revert side-effect — koreksi harus via BA Kerusakan / opname baru.</span>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Batal</Button>
          <Button onClick={onConfirm} disabled={saving}>{saving ? "Memproses..." : "Ya, Submit"}</Button>
        </div>
      </div>
    </div>
  );
}
