/**
 * SusunPaket — the "Susun & Kirim" packet assembler for a Kewajiban. Lists the
 * obligation's member reports with their run channel, runs every runnable one
 * (sequentially — workflow-concurrent-stall safety) and downloads each file.
 * Desk-only reports are flagged to open in the Frappe Desk. A single-ZIP bundle
 * is a fast-follow (jszip not yet available).
 */
import { useState } from "react";
import { Modal, Button, Badge } from "@sekolahpro/ui";
import { KEWAJIBAN_TU } from "../../lib/laporan/kewajiban";
import { resolveChannel, type ReportChannel } from "../../lib/laporan/reportChannel";
import { runAndSave } from "../../lib/laporan/runReport";

type RowStatus = "idle" | "running" | "done" | "error" | "skip";

const CHANNEL_LABEL: Record<ReportChannel, string> = {
  dinas: "Dinas",
  engine: "Engine",
  desk: "Buka di Desk",
};
const STATUS_LABEL: Record<RowStatus, string> = {
  idle: "—",
  running: "menjalankan…",
  done: "terunduh ✓",
  error: "gagal",
  skip: "lewati (Desk)",
};
const STATUS_TONE: Record<RowStatus, "neutral" | "warning" | "success" | "danger"> = {
  idle: "neutral",
  running: "warning",
  done: "success",
  error: "danger",
  skip: "neutral",
};

export interface SusunPaketProps {
  open: boolean;
  onClose: () => void;
  kewajibanId: string | null;
  sekolah: string;
}

export function SusunPaket({ open, onClose, kewajibanId, sekolah }: SusunPaketProps) {
  const kewajiban = KEWAJIBAN_TU.find((k) => k.id === kewajibanId);
  const [status, setStatus] = useState<Record<string, RowStatus>>({});
  const [busy, setBusy] = useState(false);

  async function runAll() {
    if (!kewajiban) return;
    setBusy(true);
    for (const ref of kewajiban.paket) {
      const channel = resolveChannel(ref.reportName);
      if (channel === "desk") {
        setStatus((s) => ({ ...s, [ref.reportName]: "skip" }));
        continue;
      }
      setStatus((s) => ({ ...s, [ref.reportName]: "running" }));
      try {
        await runAndSave(ref.reportName, channel, { sekolah, fmt: ref.defaultFmt });
        setStatus((s) => ({ ...s, [ref.reportName]: "done" }));
      } catch (_) {
        setStatus((s) => ({ ...s, [ref.reportName]: "error" }));
      }
    }
    setBusy(false);
  }

  return (
    <Modal open={open} onClose={onClose} title={`Susun: ${kewajiban?.nama ?? ""}`}>
      <div className="space-y-3">
        <p className="text-sm text-muted-fg">
          Jalankan semua laporan anggota paket ini lalu unduh masing-masing
          {kewajiban ? ` (target ${kewajiban.target})` : ""}.
        </p>
        <ul className="divide-y divide-border rounded-md border border-border">
          {kewajiban?.paket.map((ref) => {
            const channel = resolveChannel(ref.reportName);
            const st = status[ref.reportName] ?? "idle";
            return (
              <li key={ref.reportName} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="min-w-0 truncate">{ref.reportName}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge tone="neutral">{CHANNEL_LABEL[channel]}</Badge>
                  <Badge tone={STATUS_TONE[st]}>{STATUS_LABEL[st]}</Badge>
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          <Button disabled={busy || !kewajiban} onClick={runAll}>
            {busy ? "Memproses…" : "Jalankan & Unduh Semua"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
