/**
 * Pure aggregation helpers for the Manajemen Aset dashboard.
 *
 * Kept free of React / data-fetching so they are unit-testable in isolation.
 * All inputs are plain row arrays (as returned by the Frappe list API) and all
 * outputs are plain numbers / records.
 */

/** Minimal Aset row shape the stats functions depend on. */
export interface AsetRow {
  name: string;
  nama?: string;
  kategori?: string;
  lokasi?: string;
  jumlah_total?: number;
  jumlah_tersedia?: number;
  kondisi?: string;
  status?: string;
}

/** Minimal borrow-request row shape. */
export interface PeminjamanRow {
  name: string;
  status?: string;
  tanggal_kembali_rencana?: string;
}

/** Aggregated inventory metrics. */
export interface AsetStats {
  totalAset: number;
  totalUnit: number;
  unitTersedia: number;
  unitDipinjam: number;
  asetRusak: number;
  asetMaintenance: number;
  asetHilang: number;
  utilisasiPct: number;
}

const KONDISI_BAIK = "Baik";
const STATUS_MAINTENANCE = "Maintenance";
const STATUS_HILANG = "Hilang";
const STATUS_DIHAPUS = "Dihapus";

/** Sum a numeric field across rows, treating null/undefined as 0. */
function sumBy(rows: AsetRow[], pick: (r: AsetRow) => number | undefined): number {
  return rows.reduce((acc, r) => acc + (pick(r) ?? 0), 0);
}

/**
 * Aggregate inventory metrics from a list of Aset rows.
 *
 * `unitDipinjam` is derived as total − available (the only authoritative source
 * of "out" units in the quantity model). Dihapus assets are excluded from unit
 * counts since they are no longer part of live inventory.
 */
export function computeAsetStats(rows: AsetRow[]): AsetStats {
  const live = rows.filter((r) => r.status !== STATUS_DIHAPUS);
  const totalUnit = sumBy(live, (r) => r.jumlah_total);
  const unitTersedia = sumBy(live, (r) => r.jumlah_tersedia);
  const unitDipinjam = Math.max(0, totalUnit - unitTersedia);
  return {
    totalAset: live.length,
    totalUnit,
    unitTersedia,
    unitDipinjam,
    asetRusak: live.filter((r) => r.kondisi && r.kondisi !== KONDISI_BAIK).length,
    asetMaintenance: live.filter((r) => r.status === STATUS_MAINTENANCE).length,
    asetHilang: rows.filter((r) => r.status === STATUS_HILANG).length,
    utilisasiPct: totalUnit > 0 ? Math.round((unitDipinjam / totalUnit) * 100) : 0,
  };
}

/** Count borrow requests by status (used for the dashboard breakdown). */
export function countByStatus(rows: PeminjamanRow[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const s = r.status ?? "—";
    out[s] = (out[s] ?? 0) + 1;
  }
  return out;
}

/**
 * Borrow requests that are overdue: status Dipinjam and planned return date
 * strictly before `todayIso`. `todayIso` is injected (not read from Date) so the
 * function stays pure and testable.
 */
export function overduePeminjaman(rows: PeminjamanRow[], todayIso: string): PeminjamanRow[] {
  return rows.filter(
    (r) =>
      r.status === "Dipinjam" &&
      !!r.tanggal_kembali_rencana &&
      r.tanggal_kembali_rencana < todayIso,
  );
}
