/**
 * Period context for the Ekstrakurikuler module (Tahun Ajaran + Semester).
 *
 * A thin wrapper over the shared {@link createPeriodContext} factory. Ekskul
 * keeps its OWN context identity (a separate factory call) so an ekskul hook
 * never resolves akademik's provider and vice-versa. Filled by the ekskul
 * layout; the context bar / Sesi auto-create read the active period.
 */
import { createPeriodContext, type PeriodContextValue } from "./periodContext";

/** Value shape exposed by the ekskul period context. */
export type EkskulContextValue = PeriodContextValue;

const ctx = createPeriodContext("Ekskul");

export const EkskulContextProvider = ctx.Provider;

/** Read the ekskul period; throws outside {@link EkskulContextProvider}. */
export const useEkskulContext = ctx.useValue;

/** Read the ekskul period, or `null` when no provider is mounted above. */
export const useEkskulContextOptional = ctx.useValueOptional;
