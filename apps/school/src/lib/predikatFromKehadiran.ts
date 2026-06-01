/**
 * Pure helper that suggests an extracurricular predikat from attendance percent.
 *
 * Parents read Sangat Baik / Baik / Cukup / Kurang on the K-13 rapor. A pembina
 * grading 30 students benefits from a sensible, editable default so 30 decisions
 * become 30 confirmations. Thresholds are named constants (no magic numbers) and
 * unit-tested at the boundaries.
 */

export const PREDIKAT_SANGAT_BAIK = "Sangat Baik";
export const PREDIKAT_BAIK = "Baik";
export const PREDIKAT_CUKUP = "Cukup";
export const PREDIKAT_KURANG = "Kurang";

export type Predikat =
  | typeof PREDIKAT_SANGAT_BAIK
  | typeof PREDIKAT_BAIK
  | typeof PREDIKAT_CUKUP
  | typeof PREDIKAT_KURANG;

export const ALL_PREDIKAT: readonly Predikat[] = [
  PREDIKAT_SANGAT_BAIK,
  PREDIKAT_BAIK,
  PREDIKAT_CUKUP,
  PREDIKAT_KURANG,
];

/** Inclusive lower bounds (percent) for each predikat band. */
const THRESHOLD_SANGAT_BAIK = 90;
const THRESHOLD_BAIK = 75;
const THRESHOLD_CUKUP = 50;

/**
 * Suggest a predikat from an attendance percentage (0..100).
 * >=90 Sangat Baik, >=75 Baik, >=50 Cukup, else Kurang. Editable by the pembina.
 */
export function predikatFromKehadiran(persentase: number): Predikat {
  if (persentase >= THRESHOLD_SANGAT_BAIK) return PREDIKAT_SANGAT_BAIK;
  if (persentase >= THRESHOLD_BAIK) return PREDIKAT_BAIK;
  if (persentase >= THRESHOLD_CUKUP) return PREDIKAT_CUKUP;
  return PREDIKAT_KURANG;
}
