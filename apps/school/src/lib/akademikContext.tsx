/**
 * Period context for the Akademik module (Tahun Ajaran + Semester).
 *
 * A thin wrapper over the shared {@link createPeriodContext} factory — the logic
 * lives there; this file only owns Akademik's distinct context identity and the
 * public names its consumers import. Filled by the akademik `$ta` layout; the
 * context bar + entri/asesmen/raport pages read the active period.
 */
import { createPeriodContext, type PeriodContextValue } from "./periodContext";

/** Value shape exposed by the akademik period context. */
export type AkademikContextValue = PeriodContextValue;

const ctx = createPeriodContext("Akademik");

export const AkademikContextProvider = ctx.Provider;

/** Read the akademik period; throws outside {@link AkademikContextProvider}. */
export const useAkademikContext = ctx.useValue;

/** Read the akademik period, or `null` when no provider is mounted above. */
export const useAkademikContextOptional = ctx.useValueOptional;
