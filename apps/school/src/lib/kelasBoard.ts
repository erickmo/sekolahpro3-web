/**
 * Pure aggregation for the Tata Usaha "Papan Kelas" board: defect detection
 * over Rombongan Belajar + orphan detection over Siswa/Anggota Rombel.
 *
 * The board's three fix-it trays (Tanpa Wali / Over-Penuh / Belum Berkelas) and
 * the non-dismissable DefectGate read these. Kept pure + unit-tested so the
 * correctness rules (audit C5/C7: orphan = active Siswa with no Aktif anggota;
 * C9: counts) live in one tested place, independent of fetching/rendering.
 *
 * Callers MUST pass rows already scoped to the selected tahun ajaran.
 */

/** A Rombongan Belajar row as the board consumes it. */
export interface BoardRombelRow {
  name: string;
  nama_rombel?: string;
  tingkat?: number | string;
  jumlah_siswa?: number;
  wali_kelas?: string;
  kapasitas?: number;
  status?: string;
  tahun_ajaran?: string;
}

/** A Siswa row for orphan detection. */
export interface BoardSiswaRow {
  name: string;
  nama_lengkap?: string;
  status?: string;
}

/** An Anggota Rombel row (child) for orphan detection. */
export interface BoardAnggotaRow {
  siswa: string;
  status?: string;
}

const STATUS_AKTIF = "Aktif";

/** Defect groups + their counts over a TA-scoped set of rombel. */
export interface DefectSummary {
  /** Rombel with no wali_kelas assigned. */
  tanpaWali: BoardRombelRow[];
  /** Rombel where jumlah_siswa exceeds kapasitas (kapasitas > 0). */
  overKapasitas: BoardRombelRow[];
  /** Active rombel at or above capacity (a warning, not a hard defect). */
  penuh: BoardRombelRow[];
  counts: { tanpaWali: number; overKapasitas: number; penuh: number; total: number };
}

function hasNoWali(r: BoardRombelRow): boolean {
  return !r.wali_kelas || String(r.wali_kelas).trim() === "";
}

function isOverCapacity(r: BoardRombelRow): boolean {
  const isi = r.jumlah_siswa ?? 0;
  const cap = r.kapasitas ?? 0;
  return cap > 0 && isi > cap;
}

function isPenuh(r: BoardRombelRow): boolean {
  const isi = r.jumlah_siswa ?? 0;
  const cap = r.kapasitas ?? 0;
  return cap > 0 && isi >= cap && r.status === STATUS_AKTIF;
}

/** Group rombel rows into defect buckets with counts. */
export function computeDefects(rows: BoardRombelRow[]): DefectSummary {
  const tanpaWali = rows.filter(hasNoWali);
  const overKapasitas = rows.filter(isOverCapacity);
  const penuh = rows.filter(isPenuh);
  return {
    tanpaWali,
    overKapasitas,
    penuh,
    counts: {
      tanpaWali: tanpaWali.length,
      overKapasitas: overKapasitas.length,
      penuh: penuh.length,
      total: rows.length,
    },
  };
}

/**
 * Orphan students = active Siswa with NO Aktif Anggota Rombel row (audit C5/C7).
 * A student left as `Keluar` only, or with no row at all, is an orphan; a
 * non-active Siswa (Lulus/Pindah/DO) is never an orphan.
 */
export function computeOrphans(
  siswa: BoardSiswaRow[],
  anggota: BoardAnggotaRow[],
): BoardSiswaRow[] {
  const placed = new Set<string>();
  for (const a of anggota) {
    if (a.status === STATUS_AKTIF) placed.add(a.siswa);
  }
  return siswa.filter((s) => s.status === STATUS_AKTIF && !placed.has(s.name));
}

/**
 * The DefectGate total: rombel-tanpa-wali + over-capacity + orphan students.
 * `penuh` (exactly at capacity) is a warning, not a blocking defect, so it is
 * excluded. The board is "siap" only when this hits zero.
 */
export function totalDefects(defects: DefectSummary, orphanCount: number): number {
  return defects.counts.tanpaWali + defects.counts.overKapasitas + orphanCount;
}
