import { useMemo } from "react";
import { createFileRoute, Outlet, useParams, useRouterState } from "@tanstack/react-router";
import { ModuleShell } from "../components/shell/ModuleShell";
import { StripTahun } from "../components/shell/StripTahun";
import { AkademikNav } from "../components/akademik/AkademikNav";
import { EkskulContextProvider } from "../lib/ekskulContext";
import { useEkskulRole, ROLE_LABEL } from "../lib/ekskulRole";
import { useAkademikContext } from "../lib/akademikContext";
import { useSemesterDoc } from "../lib/semesterDoc";

// Per-module localStorage namespace for the remembered Semester docname.
const PERIODE_NS = "ekskul";

// Layout shell for the Ekstrakurikuler module, now living inside the per-Tahun-
// Ajaran Akademik workspace (Fase 1 single-door).
//
// The TA is fixed by the route path (`$ta`) and read from the workspace context
// (akademik.tahunAjaran / isPastPeriod / noActiveTa). The Semester axis is
// DIFFERENT, though: ekskul pages filter/insert Semester DOCNAMES (SEM-####, a
// required Link on Sesi Ekstrakurikuler) — creating a Sesi with the "Ganjil"/
// "Genap" label akademik.semester carries would throw a LinkValidationError. So
// we resolve Semester docs for this TA locally (useSemesterDoc, "ekskul" ns) and
// feed ONLY that docname into the provider; akademik.semester is never used here.
// The TA strip is a read-only badge (switching TA happens via the hub).
function EkskulLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const { primary } = useEkskulRole();
  const akademik = useAkademikContext();
  const { semester, setSemester, semOptions } = useSemesterDoc(sekolah, akademik.tahunAjaran, PERIODE_NS);

  // Provider value: workspace period for TA/flags, LOCAL Semester docname (NOT
  // akademik.semester) + its setter for the strip dropdown. Memoised on the
  // fields the period context depends on (createPeriodContext re-memoises on the
  // individual fields downstream, so an object literal alone is fine).
  const value = useMemo(
    () => ({ ...akademik, semester, setSemester }),
    [akademik, semester, setSemester],
  );

  return (
    <EkskulContextProvider value={value}>
      <ModuleShell
        navSlot={<AkademikNav sekolah={sekolah} ta={akademik.tahunAjaran} pathname={pathname} />}
        pathname={pathname}
        context={
          <StripTahun
            moduleLabel="Ekstrakurikuler"
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
    </EkskulContextProvider>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/$ta/ekskul")({ component: EkskulLayout });
