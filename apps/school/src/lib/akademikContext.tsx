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
  const memo = useMemo(
    () => value,
    [value.tahunAjaran, value.semester, value.isPastPeriod, value.noActiveTa, value.dirty],
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
