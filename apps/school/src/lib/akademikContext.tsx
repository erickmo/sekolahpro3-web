import { createContext, useContext, useMemo, type ReactNode } from "react";

export interface AkademikContextValue {
  tahunAjaran: string;
  semester: string;
  setTahunAjaran: (v: string) => void;
  setSemester: (v: string) => void;
  // Keamanan periode + UX (diisi oleh layout):
  isPastPeriod: boolean;
  noActiveTa: boolean;
  // Edit belum tersimpan — halaman entri melapor lewat setDirty; bar memakai
  // untuk konfirmasi sebelum ganti periode.
  dirty: boolean;
  setDirty: (v: boolean) => void;
}

const Ctx = createContext<AkademikContextValue | null>(null);

interface ProviderProps {
  value: AkademikContextValue;
  children: ReactNode;
}

export function AkademikContextProvider({ value, children }: ProviderProps) {
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
    ],
  );
  return <Ctx.Provider value={memo}>{children}</Ctx.Provider>;
}

export function useAkademikContext(): AkademikContextValue {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error("useAkademikContext must be used within AkademikContextProvider");
  }
  return v;
}

export function useAkademikContextOptional(): AkademikContextValue | null {
  return useContext(Ctx);
}
