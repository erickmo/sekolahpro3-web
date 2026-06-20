import {
  createContext,
  useContext,
  useMemo,
  type ReactElement,
  type ReactNode,
} from "react";
import { type SearchableOption } from "@sekolahpro/ui";

/**
 * Shared value shape for a module's period context (Tahun Ajaran + Semester).
 *
 * The `set*` callbacks + `isPastPeriod`/`noActiveTa`/`dirty` flags are filled by
 * the module layout; the context bar reads them to render the period and guard
 * switching while edits are unsaved.
 */
export interface PeriodContextValue {
  tahunAjaran: string;
  semester: string;
  setTahunAjaran: (v: string) => void;
  setSemester: (v: string) => void;
  // Keamanan periode + UX (diisi oleh layout):
  isPastPeriod: boolean;
  noActiveTa: boolean;
  // Edit belum tersimpan — halaman entri/absensi melapor lewat setDirty; bar
  // memakai untuk konfirmasi sebelum ganti periode.
  dirty: boolean;
  setDirty: (v: boolean) => void;
  // Tahun Ajaran options for the in-place switcher, filled by the akademik `$ta`
  // layout. Sub-module layouts (kelas/jadwal/ekskul/absensi) read it to render a
  // TA dropdown so the user can switch year without going back to the hub.
  // Optional: contexts built before the TA list loads simply omit the switcher.
  taOptions?: SearchableOption[];
}

/** The provider + paired hooks a single module gets from {@link createPeriodContext}. */
export interface PeriodContext {
  Provider: (props: { value: PeriodContextValue; children: ReactNode }) => ReactElement;
  useValue: () => PeriodContextValue;
  useValueOptional: () => PeriodContextValue | null;
}

/**
 * Mint a period context for one module (e.g. "Akademik", "Ekstrakurikuler").
 *
 * Each call creates a DISTINCT React context identity so a hook rendered under
 * the wrong module's provider throws instead of silently reading another
 * module's period — the isolation the per-module clones used to guarantee. The
 * `name` only flavours the strict hook's error message (`use${name}Context …
 * within ${name}ContextProvider`), keeping per-module diagnostics intact.
 */
export function createPeriodContext(name: string): PeriodContext {
  const Ctx = createContext<PeriodContextValue | null>(null);

  function PeriodContextProvider({
    value,
    children,
  }: {
    value: PeriodContextValue;
    children: ReactNode;
  }): ReactElement {
    // Deliberately memoise on the individual fields, not on `value` itself: the
    // layout passes a fresh object literal every render, so depending on `value`
    // (what exhaustive-deps wants) would defeat the memo and re-render consumers
    // on every parent render.
    const memo = useMemo(
      () => value,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [
        value.tahunAjaran,
        value.semester,
        value.isPastPeriod,
        value.noActiveTa,
        value.dirty,
        // Setters are useCallback-stable in the layout, but listing them keeps the
        // memo honest (exhaustive-deps) so a recreated setter never goes stale.
        value.setTahunAjaran,
        value.setSemester,
        value.setDirty,
        // TA options arrive async (after the TA list loads); without this dep the
        // memo would keep returning the pre-load value and the switcher would never
        // populate. Stable by reference (memoised in the layout) so no churn.
        value.taOptions,
      ],
    );
    return <Ctx.Provider value={memo}>{children}</Ctx.Provider>;
  }

  function useValue(): PeriodContextValue {
    const v = useContext(Ctx);
    if (!v) {
      throw new Error(`use${name}Context must be used within ${name}ContextProvider`);
    }
    return v;
  }

  function useValueOptional(): PeriodContextValue | null {
    return useContext(Ctx);
  }

  return { Provider: PeriodContextProvider, useValue, useValueOptional };
}
