// semesterDoc — resolves the active Semester DOCNAME for a period workspace.
//
// Shared by every module whose pages filter/insert Semester DOCNAMES (SEM-####,
// a required Link such as Jadwal Pelajaran.semester or Sesi Ekstrakurikuler.
// semester) rather than the akademik "Ganjil"/"Genap" LABEL — those are two
// different value spaces, so feeding akademik.semester into these queries would
// throw a LinkValidationError. Each consumer passes its own localStorage
// namespace (e.g. "jadwal", "ekskul") so auditing one archived module never
// yanks the remembered pick of another.
//
// Extracted from a route layout so the selection-chain logic is testable in
// isolation (cf. lib/periodeSwitcher.ts, lib/kelasPeriode.ts).
import { useEffect, useMemo, useState } from "react";
import { useResourceList } from "@sekolahpro/api-client";
import type { SearchableOption } from "@sekolahpro/ui";
import { readStoredPeriode, writeStoredPeriode } from "./akademikPeriode";

// Same Semester fetch shape the old usePeriodeSwitcher used: name asc, all rows.
export const SEMESTER_FIELDS = ["name", "nama", "tahun_ajaran"];

/** A Semester doc — the value space these pages filter/insert (docname, not label). */
export interface SemesterRow {
  name: string;
  nama?: string;
  tahun_ajaran?: string;
}

/** What a period layout needs from the local Semester resolver. */
export interface SemesterResolver {
  semester: string;
  setSemester: (v: string) => void;
  semOptions: SearchableOption[];
}

/**
 * Resolve the active Semester DOCNAME for the workspace Tahun Ajaran.
 *
 * Preserves usePeriodeSwitcher's default-pick chain: an explicit pick still in
 * the list wins, else the remembered docname (for the given namespace) if still
 * valid, else the first row (Semester list is ordered by `name asc`). Returns
 * the resolved docname plus the dropdown options + a setter for the explicit
 * pick.
 *
 * @param sekolah - School slug, for the namespaced localStorage key.
 * @param tahunAjaran - Workspace TA docname; scopes the Semester query.
 * @param ns - Per-module localStorage namespace (e.g. "jadwal", "ekskul"); kept
 *   distinct from "akademik" so auditing an archived module never yanks another.
 */
export function useSemesterDoc(sekolah: string, tahunAjaran: string, ns: string): SemesterResolver {
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
    const stored = readStoredPeriode(sekolah, ns).semester;
    if (stored && semList.some((s) => s.name === stored)) return stored;
    return semList[0]?.name ?? "";
  }, [picked, semList, sekolah, ns]);

  // Persist the resolved {ta, semester} so the next visit reopens the same pick.
  useEffect(() => {
    if (tahunAjaran && semester) writeStoredPeriode(sekolah, { ta: tahunAjaran, semester }, ns);
  }, [sekolah, tahunAjaran, semester, ns]);

  const semOptions: SearchableOption[] = semList.map((s) => ({ value: s.name, label: s.nama ?? s.name }));
  return { semester, setSemester: setPicked, semOptions };
}
