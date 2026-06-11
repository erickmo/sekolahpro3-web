// jadwalSemester — resolves the active Semester DOCNAME for the Jadwal workspace.
//
// Extracted from the Jadwal layout route so the selection-chain logic is
// testable in isolation (cf. lib/periodeSwitcher.ts, lib/kelasPeriode.ts).
import { useEffect, useMemo, useState } from "react";
import { useResourceList } from "@sekolahpro/api-client";
import type { SearchableOption } from "@sekolahpro/ui";
import { readStoredPeriode, writeStoredPeriode } from "./akademikPeriode";

// Per-module localStorage namespace for the remembered Semester (kept distinct
// from "akademik" so auditing an archived jadwal never yanks another module).
export const PERIODE_NS = "jadwal";

// Same Semester fetch shape the old usePeriodeSwitcher used: name asc, all rows.
export const SEMESTER_FIELDS = ["name", "nama", "tahun_ajaran"];

/** A Semester doc — the value space jadwal pages filter/insert (docname, not label). */
export interface SemesterRow {
  name: string;
  nama?: string;
  tahun_ajaran?: string;
}

/** What the jadwal layout needs from the local Semester resolver. */
export interface SemesterResolver {
  semester: string;
  setSemester: (v: string) => void;
  semOptions: SearchableOption[];
}

/**
 * Resolve the active Semester DOCNAME for the workspace Tahun Ajaran.
 *
 * Preserves usePeriodeSwitcher's default-pick chain: an explicit pick still in
 * the list wins, else the remembered docname (jadwal ns) if still valid, else
 * the first row (Semester list is ordered by `name asc`). Returns the resolved
 * docname plus the dropdown options + a setter for the explicit pick.
 *
 * @param sekolah - School slug, for the namespaced localStorage key.
 * @param tahunAjaran - Workspace TA docname; scopes the Semester query.
 */
export function useSemesterDoc(sekolah: string, tahunAjaran: string): SemesterResolver {
  const [picked, setPicked] = useState("");

  // Reset any explicit pick when the workspace TA changes — the membership
  // guard already neutralises stale picks, but only under the current
  // no-keepPreviousData query config; make the invariant explicit.
  useEffect(() => {
    setPicked("");
  }, [tahunAjaran]);

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

  // Selection chain: explicit pick (still in list) → stored (still in list) → first.
  const semester = useMemo(() => {
    if (picked && semList.some((s) => s.name === picked)) return picked;
    const stored = readStoredPeriode(sekolah, PERIODE_NS).semester;
    if (stored && semList.some((s) => s.name === stored)) return stored;
    return semList[0]?.name ?? "";
  }, [picked, semList, sekolah]);

  // Persist the resolved {ta, semester} so the next visit reopens the same pick.
  useEffect(() => {
    if (tahunAjaran && semester) writeStoredPeriode(sekolah, { ta: tahunAjaran, semester }, PERIODE_NS);
  }, [sekolah, tahunAjaran, semester]);

  const semOptions: SearchableOption[] = semList.map((s) => ({ value: s.name, label: s.nama ?? s.name }));
  return { semester, setSemester: setPicked, semOptions };
}
