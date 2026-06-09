// usePeriodeSwitcher — shared resolve/switch/persist of a module's Tahun Ajaran
// + Semester period. Extracted from the ekstrakurikuler layout so every module
// with a switchable period bar (ekskul, jadwal, …) drives it the same way.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useResourceList } from "@sekolahpro/api-client";
import type { SearchableOption } from "@sekolahpro/ui";
import type { PeriodContextValue } from "./periodContext";
import {
  resolveTahunAjaran,
  isPastPeriod,
  readStoredPeriode,
  writeStoredPeriode,
  type TahunAjaranRow,
} from "./akademikPeriode";

interface SemesterRow {
  name: string;
  nama?: string;
  tahun_ajaran?: string;
}

const TA_FIELDS = ["name", "nama", "is_current", "status", "tanggal_mulai", "tanggal_selesai"];
const SEMESTER_FIELDS = ["name", "nama", "tahun_ajaran"];

/** What a switchable period bar needs: the context value + dropdown options. */
export interface PeriodeSwitcher {
  value: PeriodContextValue;
  taOptions: SearchableOption[];
  semOptions: SearchableOption[];
}

/**
 * Resolve + switch + persist a module's period. Selection chain: explicit pick →
 * localStorage (namespaced by `ns`) → {@link resolveTahunAjaran} default. `ns`
 * keeps each module's remembered year separate. Returns the {@link PeriodContextValue}
 * to feed the module's provider plus the TA/Semester dropdown options.
 */
export function usePeriodeSwitcher(sekolah: string, ns: string): PeriodeSwitcher {
  const refDate = useRef(new Date()).current;
  const [taSel, setTaSel] = useState("");
  const [semSel, setSemSel] = useState("");
  const [dirty, setDirty] = useState(false);

  const taQ = useResourceList<TahunAjaranRow>("Tahun Ajaran", {
    fields: TA_FIELDS,
    order_by: "`tanggal_mulai` desc",
    limit_page_length: 0,
  });
  const taList = useMemo(() => taQ.data ?? [], [taQ.data]);

  const tahunAjaran = useMemo(() => {
    if (taSel) return taSel;
    if (taList.length === 0) return "";
    const stored = readStoredPeriode(sekolah, ns).ta;
    const { ta } = resolveTahunAjaran(taList, { refDate, ...(stored ? { storedTa: stored } : {}) });
    return ta;
  }, [taSel, taList, sekolah, ns, refDate]);

  const semQ = useResourceList<SemesterRow>(
    "Semester",
    {
      fields: SEMESTER_FIELDS,
      filters: tahunAjaran ? [["tahun_ajaran", "=", tahunAjaran]] : [],
      order_by: "`name` asc",
      limit_page_length: 0,
    },
    { enabled: !!tahunAjaran },
  );
  const semList = useMemo(() => semQ.data ?? [], [semQ.data]);

  const semester = useMemo(() => {
    if (semSel && semList.some((s) => s.name === semSel)) return semSel;
    const stored = readStoredPeriode(sekolah, ns).semester;
    if (stored && semList.some((s) => s.name === stored)) return stored;
    return semList[0]?.name ?? "";
  }, [semSel, semList, sekolah, ns]);

  // Persist the resolved period so the next visit reopens it (per ns).
  useEffect(() => {
    if (tahunAjaran && semester) writeStoredPeriode(sekolah, { ta: tahunAjaran, semester }, ns);
  }, [sekolah, ns, tahunAjaran, semester]);

  // Switching TA clears the semester pick so it re-resolves within the new year.
  const setTahunAjaran = useCallback((v: string) => {
    setTaSel(v);
    setSemSel("");
  }, []);
  const setSemester = useCallback((v: string) => setSemSel(v), []);

  const taRow = taList.find((t) => t.name === tahunAjaran);
  const value: PeriodContextValue = {
    tahunAjaran,
    semester,
    setTahunAjaran,
    setSemester,
    isPastPeriod: isPastPeriod(taRow, refDate),
    noActiveTa: taList.length > 0 && !taList.some((t) => t.is_current === 1),
    dirty,
    setDirty,
  };

  const taOptions: SearchableOption[] = taList.map((t) => ({
    value: t.name,
    label: t.nama ?? t.name,
    ...(t.is_current ? { hint: "Berjalan" } : {}),
  }));
  const semOptions: SearchableOption[] = semList.map((s) => ({ value: s.name, label: s.nama ?? s.name }));

  return { value, taOptions, semOptions };
}
