/**
 * Footer actions + submit confirmation for Pengadaan Buku detail (god-file split).
 *
 * Layer: presentational. Renders either the editable action bar (Kembali / Simpan
 * Draft / Submit) or the submitted read-only banner, plus the submit-confirmation
 * dialog. All state and callbacks come from usePengadaanSubmit; markup moved
 * verbatim from the route.
 */
import { Badge, Button, IconCheck } from "@sekolahpro/ui";

interface ActionBarProps {
  saving: boolean;
  isReadonly: boolean;
  totalEksemplar: number;
  onBack: () => void;
  onSaveDraft: () => void;
  onRequestSubmit: () => void;
}

/**
 * Bottom action area: editable buttons when the doc is a draft, or a success
 * banner once submitted (showing how many eksemplar were created).
 */
export function PengadaanActionBar({
  saving,
  isReadonly,
  totalEksemplar,
  onBack,
  onSaveDraft,
  onRequestSubmit,
}: ActionBarProps) {
  if (!isReadonly) {
    return (
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onBack} disabled={saving}>
          Kembali
        </Button>
        <Button variant="outline" onClick={onSaveDraft} disabled={saving}>
          Simpan Draft
        </Button>
        <Button onClick={onRequestSubmit} disabled={saving || totalEksemplar === 0}>
          <IconCheck className="mr-1 h-4 w-4 shrink-0" />
          Submit
        </Button>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-emerald-700">
        <IconCheck className="h-4 w-4 shrink-0" />
        Pengadaan disubmit — <Badge tone="success" dot>{totalEksemplar} eksemplar</Badge> sudah dibuat.
      </div>
      <Button variant="outline" onClick={onBack}>
        Kembali
      </Button>
    </div>
  );
}

interface ConfirmProps {
  saving: boolean;
  totalEksemplar: number;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Modal confirming an irreversible Submit — generating N permanent eksemplar.
 * Backdrop click cancels; the inner card stops propagation.
 */
export function PengadaanSubmitConfirm({ saving, totalEksemplar, onCancel, onConfirm }: ConfirmProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-fg">Konfirmasi Submit</h3>
        <p className="mt-2 text-sm text-muted-fg">
          <b>{totalEksemplar} eksemplar</b> akan di-generate secara permanen.
          Tindakan ini tidak bisa dibatalkan (cancel tidak menghapus eksemplar).
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Batal
          </Button>
          <Button onClick={onConfirm} disabled={saving}>
            {saving ? "Memproses..." : "Ya, Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
