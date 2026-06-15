/**
 * Modal: pick a period, preview (dry-run) the affected students + total per
 * component, then confirm to create the invoices. `onGenerate` is injected so
 * the component is pure-testable; the route wires it to runGenerate (which
 * fans out one run_doc_method call per active component, then merges).
 */
import { useState } from "react";
import { Modal, Button } from "@sekolahpro/ui";
import { summarizePreview, type GenerateSummary } from "../../data/fee-structure";

interface GenerateArgsLite {
  periode: string;
  dry_run: 0 | 1;
}

interface Props {
  open: boolean;
  periode: string;
  onClose: () => void;
  onGenerate: (args: GenerateArgsLite) => Promise<GenerateSummary>;
  onConfirmed: (summary: GenerateSummary) => void;
}

const RUPIAH = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function GenerateTagihanModal({ open, periode, onClose, onGenerate, onConfirmed }: Props) {
  const [preview, setPreview] = useState<GenerateSummary | null>(null);
  const [busy, setBusy] = useState(false);

  // dry=1 previews (no insert); dry=0 creates and bubbles the result up.
  async function run(dry: 0 | 1) {
    setBusy(true);
    try {
      const summary = await onGenerate({ periode, dry_run: dry });
      setPreview(summary);
      if (dry === 0) onConfirmed(summary);
    } finally {
      setBusy(false);
    }
  }

  const p = preview ? summarizePreview(preview) : null;

  return (
    <Modal open={open} onClose={onClose} title={`Generate Tagihan — ${periode}`}>
      <div className="space-y-4">
        {p && (
          <div className="rounded-lg border border-border p-3 text-sm">
            <p className="font-medium">
              {p.totalSiswa} siswa · {RUPIAH.format(p.totalRupiah)}
            </p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {p.lines.map((l) => (
                <li key={l.nama}>
                  {l.nama}: {l.count} siswa · {RUPIAH.format(l.amount)}
                </li>
              ))}
            </ul>
            {preview!.warnings.length > 0 && (
              <ul className="mt-2 text-warning">
                {preview!.warnings.map((w) => (
                  <li key={w}>⚠ {w}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => void run(1)} disabled={busy}>
            Pratinjau
          </Button>
          <Button onClick={() => void run(0)} disabled={busy || !preview}>
            Buat Tagihan
          </Button>
        </div>
      </div>
    </Modal>
  );
}
