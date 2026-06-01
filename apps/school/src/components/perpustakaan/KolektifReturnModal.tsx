/**
 * KolektifReturnModal — counter-transaction modal for returning a class loan.
 *
 * Layer: presentational + self-contained mutation. Captures the actual return
 * date plus a note, then records a `Pengembalian Kolektif Kelas` via insert→submit
 * so the backend on_submit hook runs (denda / eksemplar release / reservasi), and
 * patches the source loan header to "Selesai". Mirrors the standalone
 * {@link import("./ReturnModal").ReturnModal} pattern. PERP-GAP-25 / PERP-ADR-0007.
 */
import { useState } from "react";
import { Button, DatePicker, FormField, Textarea } from "@sekolahpro/ui";
import { updateResource } from "@sekolahpro/api-client";
import { perpToday } from "./perpFormatters";
import { insertAndSubmit } from "./circulation";

/** Source loan doctype patched to "Selesai" once the return submits. */
const PINJAM_DOCTYPE = "Pinjam Kolektif Kelas";
/** Counter-transaction doctype created on return. */
const PENGEMBALIAN_DOCTYPE = "Pengembalian Kolektif Kelas";
/** terminal_id stamped on records created from the web UI (not a kiosk). */
const TERMINAL_WEB = "WEB-UI";
/** Status the loan header transitions to after a successful return. */
const STATUS_SELESAI = "Selesai";

/** The source loan fields this modal reads to build the return payload. */
export interface KolektifLoanRef {
  name?: string;
  guru_penanggung_jawab: string;
  rombongan: string;
  items: ReadonlyArray<{ eksemplar: string }>;
}

interface Props {
  pinjam: KolektifLoanRef;
  onClose: () => void;
  onDone: () => void;
}

/**
 * Render the collective-return modal. Calls `onDone` after the return submits
 * and the header is patched; renders any failure inline.
 */
export function KolektifReturnModal({ pinjam, onClose, onDone }: Props) {
  const [tgl, setTgl] = useState(perpToday());
  const [catatan, setCatatan] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setErr(null);
    try {
      // insert→submit so on_submit runs (denda/eksemplar/reservasi). PERP-GAP-25
      await insertAndSubmit(PENGEMBALIAN_DOCTYPE, {
        pinjam_kolektif: pinjam.name,
        guru_penanggung_jawab: pinjam.guru_penanggung_jawab,
        rombongan: pinjam.rombongan,
        tanggal_kembali_aktual: tgl,
        jumlah_eksemplar_kembali: pinjam.items.length,
        terminal_id: TERMINAL_WEB,
        catatan,
      });
      // Patch pinjam header → Selesai (idempotent if the submit hook also sets it).
      await updateResource(PINJAM_DOCTYPE, pinjam.name!, { status: STATUS_SELESAI });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal proses pengembalian.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-fg">Pengembalian Kolektif</h3>
        <p className="mt-1 text-sm text-muted-fg">
          {pinjam.items.length} eksemplar akan dicatat kembali dari rombel <b>{pinjam.rombongan}</b>.
        </p>
        {err ? <div className="mt-3 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-700">{err}</div> : null}
        <div className="mt-4 space-y-3">
          <FormField label="Tanggal Kembali Aktual" htmlFor="tk" required>
            <DatePicker id="tk" value={tgl} onChange={setTgl} />
          </FormField>
          <FormField label="Catatan" htmlFor="ck">
            <Textarea id="ck" value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={2} />
          </FormField>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Memproses..." : "Submit Pengembalian"}</Button>
        </div>
      </div>
    </div>
  );
}
