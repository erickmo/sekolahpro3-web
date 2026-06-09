// kelasPeriode — period (Tahun Ajaran) context for the Kelas module.
//
// Built on the shared createPeriodContext factory; the Kelas layout provides the
// value via usePeriodeSwitcher, and TA-scoped surfaces (Papan Kelas board, the
// rombel/daftar lists) read it to filter data and gate writes when an archived
// year is selected. Note: Rombongan Belajar has no semester axis, so the Kelas
// strip switches Tahun Ajaran only.
import { createPeriodContext } from "./periodContext";

const ctx = createPeriodContext("Kelas");

export const KelasPeriodProvider = ctx.Provider;
/** Read the Kelas period; throws outside KelasPeriodProvider. */
export const useKelasPeriode = ctx.useValue;
/** Read the Kelas period, or `null` when no provider is mounted above. */
export const useKelasPeriodeOptional = ctx.useValueOptional;

/** Reason surfaced when Kelas writes are disabled for a past/archived TA. */
export const KELAS_READ_ONLY_REASON =
  "Periode lampau — dibuka untuk audit; perubahan kelas dinonaktifkan.";

/** Read-only gate decision for the active Kelas period. */
export interface KelasReadOnly {
  readOnly: boolean;
  reason?: string;
}

/**
 * Whether Kelas edits should be gated to read-only for the active period.
 *
 * True ONLY for a past/closed TA (auditing an archive). A school with no active
 * TA can still build the upcoming year's rombel, so `noActiveTa` does not gate.
 * FRONTEND guidance only — there is no backend write-lock yet (separate-repo
 * follow-up); the reason copy is worded as guidance, not a lock.
 */
export function useKelasReadOnly(): KelasReadOnly {
  const { isPastPeriod } = useKelasPeriode();
  return isPastPeriod ? { readOnly: true, reason: KELAS_READ_ONLY_REASON } : { readOnly: false };
}
