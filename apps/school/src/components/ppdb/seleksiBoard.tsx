/**
 * seleksiBoard — kolom & sel papan skor seleksi PPDB (backend "Seleksi PPDB").
 *
 * Murni presentational/config: route Seleksi menyuntik handler + state lalu
 * memakai {@link buildSeleksiColumns} untuk DataTable yang dapat di-edit inline
 * (input nilai) dan menetapkan hasil (Lulus / Tidak Lulus). Logika mutasi tetap
 * di lapisan halaman; file ini hanya merakit konfigurasi kolom + sel.
 *
 * Hanya diimpor oleh route Seleksi PPDB (dan re-export via seleksiPanel).
 */

import type { ReactNode } from "react";
import { Badge, Button, type Column } from "@sekolahpro/ui";

/** Baris board seleksi dari backend, plus nomor rank opsional. */
export type SeleksiBoardRow = {
  name: string;
  pendaftaran_ppdb?: string;
  calon_siswa?: string;
  gelombang_ppdb?: string;
  nilai?: number;
  hasil?: string;
  _rank?: number;
};

/** Handler + state yang ditutup oleh kolom board (disuntik dari route). */
export interface SeleksiColumnHandlers {
  editingNilai: Record<string, string>;
  setEditingNilai: (
    updater: (cur: Record<string, string>) => Record<string, string>,
  ) => void;
  onSaveNilai: (row: SeleksiBoardRow) => void;
  onSetHasil: (row: SeleksiBoardRow, hasil: "Lulus" | "Tidak Lulus") => void;
  isPending: boolean;
}

const HASIL_LULUS = "Lulus";
const HASIL_TIDAK_LULUS = "Tidak Lulus";
const PLACEHOLDER_DASH = "—";

/** Map hasil seleksi ke tone badge (success/danger/neutral). */
function hasilTone(hasil: string | undefined): "success" | "danger" | "neutral" {
  if (hasil === HASIL_LULUS) return "success";
  if (hasil === HASIL_TIDAK_LULUS) return "danger";
  return "neutral";
}

/** Sel input nilai inline — edit lokal lalu simpan via handler. */
function NilaiCell({ row, h }: { row: SeleksiBoardRow; h: SeleksiColumnHandlers }): ReactNode {
  const editing = h.editingNilai[row.name];
  const isEditing = editing !== undefined;
  return (
    <div className="flex items-center justify-end gap-1.5">
      <input
        type="number"
        step="0.01"
        value={isEditing ? editing : (row.nilai ?? "")}
        onChange={(e) => h.setEditingNilai((cur) => ({ ...cur, [row.name]: e.target.value }))}
        className="h-7 w-20 rounded-md border border-border bg-bg px-2 text-right text-sm tabular-nums focus:border-brand focus:outline-none"
      />
      {isEditing && (
        <Button size="sm" variant="outline" onClick={() => h.onSaveNilai(row)}>
          ✓
        </Button>
      )}
    </div>
  );
}

/** Sel aksi Lulus / Tidak Lulus — memicu mutasi set_hasil_seleksi. */
function AksiCell({ row, h }: { row: SeleksiBoardRow; h: SeleksiColumnHandlers }): ReactNode {
  return (
    <div className="flex justify-end gap-1.5">
      <Button
        size="sm"
        variant={row.hasil === HASIL_LULUS ? "default" : "outline"}
        onClick={() => h.onSetHasil(row, HASIL_LULUS)}
        disabled={h.isPending}
        className={row.hasil === HASIL_LULUS ? "!bg-emerald-600 !text-white" : ""}
      >
        {HASIL_LULUS}
      </Button>
      <Button
        size="sm"
        variant={row.hasil === HASIL_TIDAK_LULUS ? "default" : "outline"}
        onClick={() => h.onSetHasil(row, HASIL_TIDAK_LULUS)}
        disabled={h.isPending}
        className={row.hasil === HASIL_TIDAK_LULUS ? "!bg-rose-600 !text-white" : ""}
      >
        {HASIL_TIDAK_LULUS}
      </Button>
    </div>
  );
}

/**
 * Bangun kolom board seleksi (rank, calon, pendaftaran, nilai, hasil, aksi).
 * Kolom yang interaktif menutup handler/state yang disuntik dari route, agar
 * logika mutasi tetap di lapisan halaman.
 */
export function buildSeleksiColumns(h: SeleksiColumnHandlers): Column<SeleksiBoardRow>[] {
  return [
    {
      key: "_rank",
      header: "#",
      align: "right",
      width: "60px",
      cell: (r) =>
        r._rank !== undefined ? (
          <span className="tabular-nums text-muted-fg">{r._rank}</span>
        ) : (
          PLACEHOLDER_DASH
        ),
    },
    {
      key: "calon_siswa",
      header: "Calon Siswa",
      cell: (r) => <span className="font-medium">{r.calon_siswa ?? r.name}</span>,
    },
    {
      key: "pendaftaran_ppdb",
      header: "Pendaftaran",
      cell: (r) => (
        <span className="font-mono text-xs text-muted-fg">{r.pendaftaran_ppdb ?? PLACEHOLDER_DASH}</span>
      ),
    },
    { key: "nilai", header: "Nilai", align: "right", width: "140px", cell: (r) => <NilaiCell row={r} h={h} /> },
    {
      key: "hasil",
      header: "Hasil",
      cell: (r) => (
        <Badge tone={hasilTone(r.hasil)} dot>
          {r.hasil ?? "Belum"}
        </Badge>
      ),
    },
    { key: "aksi", header: "Aksi", align: "right", cell: (r) => <AksiCell row={r} h={h} /> },
  ];
}

// Warna teks angka per tone — token tema, bukan warna mentah.
const MINI_TONE_CLASS: Record<"success" | "danger" | "brand" | "neutral", string> = {
  success: "text-emerald-700",
  danger: "text-rose-700",
  brand: "text-brand",
  neutral: "text-fg",
};

/** Kartu statistik ringkas (label + angka besar ter-tone) pada strip gelombang. */
export function SeleksiMiniStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "success" | "danger" | "brand" | "neutral";
}): ReactNode {
  return (
    <div>
      <div className="text-xs text-muted-fg">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${MINI_TONE_CLASS[tone]}`}>
        {value.toLocaleString("id-ID")}
      </div>
    </div>
  );
}
