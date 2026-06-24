// Pure mappers for a student's RELATION tabs on the Siswa detail page — the
// per-student financial (School Fee Invoice/Payment) and attendance rows.
//
// Layer: domain/mapping. No react, no IO. The fee doc shapes are reused from
// the Keuangan live layer (single source of truth for those doctypes); only
// the target row shape differs (the Siswa detail page has its own narrower
// Tagihan/Pembayaran/Absensi row types).

import type { FeeInvoiceDoc, PaymentDoc } from "../../data/keuangan-live";
import type { AbsensiRow, PembayaranRow, TagihanRow } from "../../data/siswa";

// ── Keuangan: School Fee Invoice / Payment → Siswa rows ───────────────────

/** Map the doctype invoice status onto the Siswa TagihanRow status union. */
function mapTagihanStatus(status: string): TagihanRow["status"] {
  switch (status) {
    case "Lunas": return "Lunas";
    case "Sebagian": return "Cicilan";
    default: return "Tertunda"; // Belum Dibayar / Draft / Dibatalkan
  }
}

/** Map the doctype payment method onto the Siswa PembayaranRow method union.
 *  EDC has no Siswa-side equivalent and is treated as a card Transfer. */
function mapPembayaranMetode(metode: string | undefined): PembayaranRow["metode"] {
  switch (metode) {
    case "QRIS": return "QRIS";
    case "Virtual Account": return "Virtual Account";
    case "Tunai": return "Tunai";
    default: return "Transfer"; // Transfer / EDC / unknown
  }
}

/** Map a School Fee Invoice doc → a Siswa detail TagihanRow. */
export function feeInvoiceToTagihanRow(doc: FeeInvoiceDoc): TagihanRow {
  const row: TagihanRow = {
    id: doc.name,
    judul: doc.judul,
    jatuhTempo: doc.due_date ?? doc.posting_date,
    jumlah: doc.jumlah,
    status: mapTagihanStatus(doc.status),
  };
  if (doc.dibayar !== undefined) row.dibayar = doc.dibayar;
  return row;
}

/** Map a School Fee Payment doc → a Siswa detail PembayaranRow. */
export function feePaymentToPembayaranRow(doc: PaymentDoc): PembayaranRow {
  return {
    id: doc.name,
    tanggal: doc.posting_date,
    metode: mapPembayaranMetode(doc.metode),
    jumlah: doc.jumlah,
    ref: doc.ref ?? "—",
    penerima: doc.penerima ?? "—",
  };
}

/** Outstanding balance = Σ max(0, jumlah − dibayar) over non-settled invoices. */
export function computeSaldoTagihan(tagihan: TagihanRow[]): number {
  return tagihan
    .filter((t) => t.status !== "Lunas")
    .reduce((sum, t) => sum + Math.max(0, t.jumlah - (t.dibayar ?? 0)), 0);
}

// ── Absensi: backend rows → Siswa AbsensiRow ──────────────────────────────
// The student's attendance is read via a server method (get_riwayat_absensi)
// because the per-date `tanggal` lives on the parent Absensi Harian while the
// status lives on the Detail Absensi Harian child — a join the client cannot
// do efficiently. The method returns already-joined rows in this shape.

/** Raw row as returned by sekolahpro.siswa.api.get_riwayat_absensi. */
export interface RiwayatAbsensiRow {
  tanggal: string;
  status: string;
  keterangan?: string | null;
  pencatat?: string | null;
}

/** Normalise the doctype status ("Alpha") to the Siswa UI union ("Alpa"). */
function normalizeAbsensiStatus(status: string): AbsensiRow["status"] {
  if (status === "Alpha") return "Alpa";
  if (status === "Hadir" || status === "Sakit" || status === "Izin" || status === "Terlambat") {
    return status;
  }
  return "Alpa";
}

/** Map joined attendance rows → Siswa AbsensiRow list. */
export function mapRiwayatAbsensi(rows: RiwayatAbsensiRow[]): AbsensiRow[] {
  return rows.map((r) => {
    const row: AbsensiRow = {
      tanggal: r.tanggal,
      status: normalizeAbsensiStatus(r.status),
      pencatat: r.pencatat ?? "—",
    };
    if (r.keterangan) row.keterangan = r.keterangan;
    return row;
  });
}

/** Attendance percentage = Hadir / total, rounded; 0 when there are no rows. */
export function computePersenKehadiran(absensi: AbsensiRow[]): number {
  if (absensi.length === 0) return 0;
  const hadir = absensi.filter((a) => a.status === "Hadir").length;
  return Math.round((hadir / absensi.length) * 100);
}
