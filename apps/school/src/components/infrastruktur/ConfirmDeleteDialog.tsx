/** Dialog konfirmasi hapus generik (tone rose). */
import { Button, Modal } from "@sekolahpro/ui";

interface ConfirmDeleteDialogProps {
  open: boolean;
  label: string;
  error?: string | null;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDeleteDialog({ open, label, error, pending, onConfirm, onClose }: ConfirmDeleteDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      tone="rose"
      title="Hapus data?"
      description={`"${label}" akan dihapus permanen.`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={onConfirm} disabled={pending}>{pending ? "Menghapus..." : "Hapus"}</Button>
        </div>
      }
    >
      {error ? (
        <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</div>
      ) : (
        <p className="text-sm text-muted-fg">Tindakan ini tidak bisa dibatalkan.</p>
      )}
    </Modal>
  );
}
