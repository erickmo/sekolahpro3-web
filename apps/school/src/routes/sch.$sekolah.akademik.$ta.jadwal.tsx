import { useMemo } from "react";
import { createFileRoute, Outlet, useParams, useRouterState } from "@tanstack/react-router";
import { ModuleShell } from "../components/shell/ModuleShell";
import { StripTahun } from "../components/shell/StripTahun";
import { useAkademikRole, ROLE_LABEL } from "../lib/akademikRole";
import { filterJadwalNav } from "../lib/jadwalNav";
import { useAkademikContext } from "../lib/akademikContext";
import { JadwalPeriodProvider } from "../lib/jadwalPeriode";
import { useSemesterDoc } from "../lib/semesterDoc";

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
  const { semester, setSemester, semOptions } = useSemesterDoc(sekolah, akademik.tahunAjaran, "jadwal");

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
