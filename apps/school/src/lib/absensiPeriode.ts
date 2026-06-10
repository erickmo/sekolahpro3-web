// absensiPeriode — period (Tahun Ajaran) context for the Absensi module.
//
// Built on the shared createPeriodContext factory. Most Absensi surfaces are
// date-driven (Absensi Harian / Pelajaran have no tahun_ajaran) and only show a
// passive TahunChip; the one TA-keyed surface, Absensi Guru, reads this context
// to scope its list and gate creation in an archived year.
import { createPeriodContext } from "./periodContext";

const ctx = createPeriodContext("Absensi");

export const AbsensiPeriodProvider = ctx.Provider;
/** Read the Absensi period; throws outside AbsensiPeriodProvider. */
export const useAbsensiPeriode = ctx.useValue;
/** Read the Absensi period, or `null` when no provider is mounted above. */
export const useAbsensiPeriodeOptional = ctx.useValueOptional;
