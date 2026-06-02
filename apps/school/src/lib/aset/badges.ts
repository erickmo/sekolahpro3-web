/**
 * Pure presentation helpers for Manajemen Aset: status/condition → badge tone,
 * and small formatters. No React, no data fetching → unit-testable.
 *
 * Tone values match the `@sekolahpro/ui` Badge `tone` union.
 */

export type BadgeTone = "success" | "warning" | "danger" | "brand" | "neutral";

/** Aset.status → badge tone. */
export function asetStatusTone(status?: string): BadgeTone {
  switch (status) {
    case "Tersedia":
      return "success";
    case "Maintenance":
      return "warning";
    case "Hilang":
    case "Dihapus":
      return "danger";
    default:
      return "neutral";
  }
}

/** Aset.kondisi → badge tone. */
export function kondisiTone(kondisi?: string): BadgeTone {
  switch (kondisi) {
    case "Baik":
      return "success";
    case "Rusak Ringan":
      return "warning";
    case "Rusak Berat":
      return "danger";
    default:
      return "neutral";
  }
}

/** Permintaan Peminjaman Aset.status → badge tone. */
export function peminjamanStatusTone(status?: string): BadgeTone {
  switch (status) {
    case "Dipinjam":
      return "brand";
    case "Dikembalikan":
      return "success";
    case "Terlambat":
      return "danger";
    case "Ditolak":
      return "neutral";
    case "Diajukan":
      return "warning";
    default:
      return "neutral";
  }
}

/** Permintaan Maintenance Aset.status → badge tone. */
export function maintenanceStatusTone(status?: string): BadgeTone {
  switch (status) {
    case "Selesai":
      return "success";
    case "Dikerjakan":
      return "brand";
    case "Dijadwalkan":
      return "warning";
    case "Dibatalkan":
      return "neutral";
    case "Dilaporkan":
      return "danger";
    default:
      return "neutral";
  }
}

/** Maintenance prioritas → badge tone. */
export function prioritasTone(prioritas?: string): BadgeTone {
  switch (prioritas) {
    case "Kritis":
      return "danger";
    case "Tinggi":
      return "warning";
    case "Sedang":
      return "brand";
    case "Rendah":
      return "neutral";
    default:
      return "neutral";
  }
}

/** Format a number as IDR (no decimals). Returns "—" for null/undefined. */
export function formatRupiah(value?: number | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Availability label e.g. "7 / 10 tersedia". */
export function stokLabel(tersedia?: number, total?: number): string {
  return `${tersedia ?? 0} / ${total ?? 0} tersedia`;
}
