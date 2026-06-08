/**
 * Pure aggregation of a day's Absensi Harian detail into the "Hadir Hari Ini"
 * strip for the Wali Kelas cockpit. Reads the existing Detail Absensi Harian
 * child rows (status ∈ Hadir/Izin/Sakit/Alpha/Terlambat) — no new backend.
 *
 * An empty input means attendance has not been taken yet; the cockpit shows a
 * "belum diabsen" nudge rather than fabricated zeros (honest empty-state).
 */

/** One Detail Absensi Harian row. */
export interface AbsensiDetailRow {
  siswa: string;
  status?: string;
  keterangan?: string;
}

export interface PresenceSummary {
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
  terlambat: number;
  total: number;
  /** Names (siswa ids) marked Alpha — the genuinely absent. */
  absent: string[];
}

const STATUS = {
  HADIR: "Hadir",
  IZIN: "Izin",
  SAKIT: "Sakit",
  ALPHA: "Alpha",
  TERLAMBAT: "Terlambat",
} as const;

/** Aggregate detail rows into per-status counts + the Alpha (absent) name list. */
export function aggregatePresence(detail: readonly AbsensiDetailRow[]): PresenceSummary {
  const summary: PresenceSummary = {
    hadir: 0,
    izin: 0,
    sakit: 0,
    alpha: 0,
    terlambat: 0,
    total: detail.length,
    absent: [],
  };
  for (const row of detail) {
    switch (row.status) {
      case STATUS.HADIR:
        summary.hadir += 1;
        break;
      case STATUS.IZIN:
        summary.izin += 1;
        break;
      case STATUS.SAKIT:
        summary.sakit += 1;
        break;
      case STATUS.ALPHA:
        summary.alpha += 1;
        summary.absent.push(row.siswa);
        break;
      case STATUS.TERLAMBAT:
        summary.terlambat += 1;
        break;
      default:
        break;
    }
  }
  return summary;
}
