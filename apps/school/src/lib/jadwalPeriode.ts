// jadwalPeriode — period (Tahun Ajaran + Semester) context for the Jadwal module.
//
// Built on the shared createPeriodContext factory; the Jadwal layout provides
// the value via usePeriodeSwitcher, and TA-scoped sub-pages read it to filter
// data and gate writes when an archived year is selected.
import { createPeriodContext } from "./periodContext";

const ctx = createPeriodContext("Jadwal");

export const JadwalPeriodProvider = ctx.Provider;
/** Read the Jadwal period; throws outside JadwalPeriodProvider. */
export const useJadwalPeriode = ctx.useValue;
/** Read the Jadwal period, or `null` when no provider is mounted above. */
export const useJadwalPeriodeOptional = ctx.useValueOptional;

/** Reason surfaced when Jadwal writes are disabled for a past/archived TA. */
export const JADWAL_READ_ONLY_REASON =
  "Periode lampau — dibuka untuk audit & cetak ulang; perubahan dinonaktifkan.";

/** Read-only gate decision for the active Jadwal period. */
export interface JadwalReadOnly {
  readOnly: boolean;
  reason?: string;
}

/**
 * Whether Jadwal edits should be gated to read-only for the active period.
 *
 * True ONLY for a past/closed TA (auditing an archive). A school with no active
 * TA can still build the upcoming year, so `noActiveTa` does not gate. This is
 * FRONTEND guidance only — there is no backend write-lock yet (separate-repo
 * follow-up); the reason copy is worded as guidance, not a lock.
 */
export function useJadwalReadOnly(): JadwalReadOnly {
  const { isPastPeriod } = useJadwalPeriode();
  return isPastPeriod ? { readOnly: true, reason: JADWAL_READ_ONLY_REASON } : { readOnly: false };
}
