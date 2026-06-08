/**
 * RunPanel — run a single report inline and download it (graft C1). Routes by
 * channel: 'dinas' → export_b64 (TU-gated, base64 envelope), 'engine' → generate.
 * Both return {filename, mime, content_b64} → saved via saveBase64File. 'desk'
 * reports are not run here (the catalog links them to the Frappe Desk).
 */
import { useState } from "react";
import { useFrappeMutation } from "@sekolahpro/api-client";
import { Modal, Button } from "@sekolahpro/ui";
import { saveBase64File } from "../../lib/laporan/download";
import { resolveChannel } from "../../lib/laporan/reportChannel";

const EXPORT_B64 = "sekolahpro.akademik.api.laporan_dinas.export_b64";
const GENERATE = "sekolahpro.laporan.api.generate.generate";

const PERIODE_OPTS = ["Harian", "Mingguan", "Bulanan", "Semesteran", "Tahunan"];
const FMT_OPTS = ["xlsx", "json"];

interface ExportEnvelope {
  filename?: string;
  mime?: string;
  content_b64?: string;
}

export interface RunPanelProps {
  open: boolean;
  onClose: () => void;
  report: string;
  sekolah: string;
}

export function RunPanel({ open, onClose, report, sekolah }: RunPanelProps) {
  const channel = resolveChannel(report);
  const [periode, setPeriode] = useState("Bulanan");
  const [ref, setRef] = useState(new Date().toISOString().slice(0, 10));
  const [fmt, setFmt] = useState("xlsx");
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);

  const run = useFrappeMutation<Record<string, unknown>>(
    channel === "engine" ? GENERATE : EXPORT_B64,
  );

  async function execute() {
    setError(false);
    setDone(false);
    try {
      const res = (await run.mutateAsync(
        channel === "engine"
          ? { report, periode, ref, fmt, sekolah }
          : { report_name: report, filters: JSON.stringify({ sekolah }), fmt },
      )) as ExportEnvelope;
      if (!res?.content_b64) {
        setError(true);
        return;
      }
      saveBase64File(
        res.content_b64,
        res.filename ?? `${report}.${fmt}`,
        res.mime ?? "application/octet-stream",
      );
      setDone(true);
    } catch (_) {
      setError(true);
    }
  }

  const selectCls = "rounded-md border border-border bg-bg px-2 py-1.5 text-sm";

  return (
    <Modal open={open} onClose={onClose} title={`Jalankan: ${report}`}>
      <div className="space-y-3">
        {channel === "engine" ? (
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-fg">Periode</span>
              <select value={periode} onChange={(e) => setPeriode(e.target.value)} className={selectCls}>
                {PERIODE_OPTS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-fg">Tanggal acuan</span>
              <input type="date" value={ref} onChange={(e) => setRef(e.target.value)} className={selectCls} />
            </label>
          </div>
        ) : null}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-fg">Format</span>
          <select value={fmt} onChange={(e) => setFmt(e.target.value)} className={selectCls}>
            {FMT_OPTS.map((f) => (
              <option key={f} value={f}>{f.toUpperCase()}</option>
            ))}
          </select>
        </label>

        {error ? (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-600">
            Gagal menjalankan laporan (endpoint mungkin belum live atau report butuh filter lain).
          </div>
        ) : null}
        {done ? (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700">
            Berhasil — file terunduh.
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          <Button disabled={run.isPending} onClick={execute}>
            {run.isPending ? "Menjalankan…" : "Jalankan & Unduh"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
