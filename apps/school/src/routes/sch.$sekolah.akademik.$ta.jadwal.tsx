import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Outlet, useParams, useRouterState } from "@tanstack/react-router";
import { useResourceList } from "@sekolahpro/api-client";
import type { SearchableOption } from "@sekolahpro/ui";
import { ModuleShell } from "../components/shell/ModuleShell";
import { StripTahun } from "../components/shell/StripTahun";
import { useAkademikRole, ROLE_LABEL } from "../lib/akademikRole";
import { filterJadwalNav } from "../lib/jadwalNav";
import { useAkademikContext } from "../lib/akademikContext";
import { JadwalPeriodProvider } from "../lib/jadwalPeriode";
import { readStoredPeriode, writeStoredPeriode } from "../lib/akademikPeriode";

// Per-module localStorage namespace for the remembered Semester (kept distinct
// from "akademik" so auditing an archived jadwal never yanks another module).
const PERIODE_NS = "jadwal";

// Same Semester fetch shape the old usePeriodeSwitcher used: name asc, all rows.
const SEMESTER_FIELDS = ["name", "nama", "tahun_ajaran"];

/** A Semester doc — the value space jadwal pages filter/insert (docname, not label). */
interface SemesterRow {
  name: string;
  nama?: string;
  tahun_ajaran?: string;
}

/** What the jadwal layout needs from the local Semester resolver. */
interface SemesterResolver {
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
function useSemesterDoc(sekolah: string, tahunAjaran: string): SemesterResolver {
  const [picked, setPicked] = useState("");

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

// Layout shell for the Jadwal module, now living inside the per-Tahun-Ajaran
// Akademik workspace (Fase 1 single-door). The sub-nav is role-filtered (Tata
// Usaha sees the full builder, Guru/Kepala Sekolah a slimmer set; unknown → full).
//
// THE TA is fixed by the route path (`$ta`) and read from the workspace context
// (akademik.tahunAjaran / isPastPeriod). The Semester axis is DIFFERENT, though:
// jadwal pages filter/insert Semester DOCNAMES (SEM-####, a Link on Jadwal
// Pelajaran), whereas akademik.semester is a "Ganjil"/"Genap" LABEL — a separate
// value space. So we resolve Semester docs for this TA locally (useSemesterDoc)
// and feed only that docname into the provider; akademik.semester is never used
// here. The TA strip is a read-only badge (switching TA happens via the hub).
function JadwalLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const { primary } = useAkademikRole();
  const navGroups = filterJadwalNav(primary);
  const akademik = useAkademikContext();
  const { semester, setSemester, semOptions } = useSemesterDoc(sekolah, akademik.tahunAjaran);

  // Provider value: workspace period for TA/flags, LOCAL Semester docname (NOT
  // akademik.semester) + its setter for the strip dropdown. Memoised on the
  // fields the period context depends on (an object literal alone would not be
  // stable, but createPeriodContext re-memoises on individual fields downstream).
  const value = useMemo(
    () => ({ ...akademik, semester, setSemester }),
    [akademik, semester, setSemester],
  );

  return (
    <JadwalPeriodProvider value={value}>
      <ModuleShell
        navGroups={navGroups}
        pathname={pathname}
        context={
          <StripTahun
            moduleLabel="Jadwal"
            taLabel={akademik.tahunAjaran}
            semesterSwitch={{ value: semester, options: semOptions, onChange: setSemester }}
            isPastPeriod={akademik.isPastPeriod}
            noActiveTa={akademik.noActiveTa}
            roleLabel={ROLE_LABEL[primary]}
          />
        }
      >
        <Outlet />
      </ModuleShell>
    </JadwalPeriodProvider>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/$ta/jadwal")({ component: JadwalLayout });
