/**
 * Pure derivations for the Beranda dashboard data layer.
 *
 * Extracted from the hook module (scope.ts) so the date/scoping math is
 * unit-testable without renderHook / API mocks (per the gate review). No React,
 * no I/O — every function is a deterministic transform.
 */
import type { TagihanRow } from "../../data/keuangan";

/** WIB is UTC+7; the app's "today" is the Jakarta calendar day. */
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const MS_PER_DAY = 86_400_000;

/** Invoice statuses that are no longer outstanding. */
const TAGIHAN_DONE = new Set(["Lunas", "Dibatalkan"]);

/** Schedule weekday names (Slot Jadwal.hari Select); index 0 (Minggu) is absent. */
const HARI_NAMES = [null, "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

/** A minimal Rombongan Belajar row for wali-kelas derivations. */
export interface RombelRow {
  name: string;
  wali_kelas?: string;
}

/** The ISO yyyy-mm-dd of the WIB calendar day for the given instant. */
export function berandaTodayISO(now: Date): string {
  return new Date(now.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * The Indonesian weekday name for the WIB calendar day, or null on Sunday
 * (Minggu is not a Slot Jadwal option, so guru has no slots that day).
 */
export function weekdayHariName(now: Date): string | null {
  const wibDay = new Date(now.getTime() + WIB_OFFSET_MS).getUTCDay();
  return HARI_NAMES[wibDay] ?? null;
}

/** Count rombels whose wali_kelas link is missing/blank. */
export function countRombelTanpaWali(rombels: readonly RombelRow[]): number {
  return rombels.filter((r) => !r.wali_kelas).length;
}

/**
 * Count rombels with NO daily-attendance record today.
 * `rombelsWithAttendanceToday` is the set of rombel names that already have an
 * Absensi Harian row for today; the missing count is the remainder.
 */
export function countMissingAbsensiHarian(
  allRombelNames: readonly string[],
  rombelsWithAttendanceToday: readonly string[],
): number {
  const done = new Set(rombelsWithAttendanceToday);
  return Math.max(0, allRombelNames.filter((name) => !done.has(name)).length);
}

/** Whole days from `dueISO` to `todayISO` (positive = overdue). */
function overdueDays(todayISO: string, dueISO: string): number {
  const today = new Date(`${todayISO}T00:00:00Z`).getTime();
  const due = new Date(`${dueISO.slice(0, 10)}T00:00:00Z`).getTime();
  return Math.round((today - due) / MS_PER_DAY);
}

/**
 * Outstanding-arrears roll-up for the kepala "tunggakan besar" decision:
 * sum of the unpaid remainder across overdue, not-yet-settled invoices, plus
 * the count of distinct students affected.
 */
export function computeTunggakanBesar(
  tagihan: readonly TagihanRow[],
  todayISO: string,
): { count: number; total: number } {
  const students = new Set<string>();
  let total = 0;
  for (const t of tagihan) {
    if (TAGIHAN_DONE.has(t.status)) continue;
    const sisa = t.jumlah - t.dibayar;
    if (sisa <= 0) continue;
    if (overdueDays(todayISO, t.jatuhTempo) <= 0) continue; // only overdue counts
    students.add(t.siswa);
    total += sisa;
  }
  return { count: students.size, total };
}
