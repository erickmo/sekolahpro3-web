import { createContext, useContext, useMemo, type ReactNode } from "react";

/**
 * Period context for the Ekstrakurikuler module (Tahun Ajaran + Semester).
 * Cloned from akademikContext so ekskul owns its own provider identity. Filled by
 * the ekskul layout; the context bar / Sesi auto-create read the active period.
 */
export interface EkskulContextValue {
  tahunAjaran: string;
  semester: string;
  setTahunAjaran: (v: string) => void;
  setSemester: (v: string) => void;
  // Keamanan periode + UX (diisi oleh layout):
  isPastPeriod: boolean;
  noActiveTa: boolean;
  // Edit belum tersimpan — layar absensi melapor lewat setDirty; bar memakai
  // untuk konfirmasi sebelum ganti periode.
  dirty: boolean;
  setDirty: (v: boolean) => void;
}

const Ctx = createContext<EkskulContextValue | null>(null);

interface ProviderProps {
  value: EkskulContextValue;
  children: ReactNode;
}

export function EkskulContextProvider({ value, children }: ProviderProps) {
  // Memoise on individual fields (layout passes a fresh object every render).
  const memo = useMemo(
    () => value,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      value.tahunAjaran,
      value.semester,
      value.isPastPeriod,
      value.noActiveTa,
      value.dirty,
      value.setTahunAjaran,
      value.setSemester,
      value.setDirty,
    ],
  );
  return <Ctx.Provider value={memo}>{children}</Ctx.Provider>;
}

export function useEkskulContext(): EkskulContextValue {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error("useEkskulContext must be used within EkskulContextProvider");
  }
  return v;
}

export function useEkskulContextOptional(): EkskulContextValue | null {
  return useContext(Ctx);
}
