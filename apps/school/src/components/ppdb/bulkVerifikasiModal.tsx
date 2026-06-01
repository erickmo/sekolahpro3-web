/**
 * Bulk-verification modal for the Pendaftaran PPDB list page.
 *
 * Extracted from pendaftaranPanel.tsx so both files stay under the 300-line
 * Vernon budget. Re-exported through pendaftaranPanel so the route keeps a
 * single import surface. ONLY pendaftaranPanel.tsx imports this module.
 */

import type { ReactNode } from "react";
import { Button, Modal } from "@sekolahpro/ui";
import type { VerifikasiStatus } from "../../lib/ppdbApi";

// Target statuses offered by the bulk-verifikasi modal (whitelisted endpoint).
const VERIFIKASI_OPTIONS: VerifikasiStatus[] = [
  "Diverifikasi",
  "Seleksi",
  "Diterima",
  "Ditolak",
];

export interface BulkVerifikasiModalProps {
  open: boolean;
  count: number;
  target: VerifikasiStatus;
  pending: boolean;
  onSelect: (status: VerifikasiStatus) => void;
  onConfirm: () => void;
  onClose: () => void;
}

/** Target-status chip — toggled selected styling, no magic class strings. */
function TargetChip({
  status, active, onClick,
}: { status: VerifikasiStatus; active: boolean; onClick: () => void }): ReactNode {
  const base = "rounded-md border px-3 py-1.5 text-xs font-medium transition ";
  const variant = active
    ? "border-brand bg-brand text-white"
    : "border-border bg-card hover:border-brand";
  return (
    <button type="button" onClick={onClick} className={base + variant}>
      {status}
    </button>
  );
}

/** Modal letting a manager pick the target status for a bulk verification. */
export function BulkVerifikasiModal({
  open, count, target, pending, onSelect, onConfirm, onClose,
}: BulkVerifikasiModalProps): ReactNode {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Verifikasi ${count} Pendaftaran`}
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={onConfirm} disabled={pending}>
            {pending ? "Memproses..." : "Konfirmasi"}
          </Button>
        </div>
      }
    >
      <div>
        <label className="mb-2 block text-xs font-medium text-muted-fg">Status Tujuan</label>
        <div className="flex flex-wrap gap-2">
          {VERIFIKASI_OPTIONS.map((s) => (
            <TargetChip key={s} status={s} active={target === s} onClick={() => onSelect(s)} />
          ))}
        </div>
      </div>
    </Modal>
  );
}
