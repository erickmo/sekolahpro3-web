import { createFileRoute, Outlet, useParams, useRouterState } from "@tanstack/react-router";
import { ModuleShell } from "../components/shell/ModuleShell";
import { StripTahun } from "../components/shell/StripTahun";
import { useAkademikRole, ROLE_LABEL } from "../lib/akademikRole";
import { filterJadwalNav } from "../lib/jadwalNav";
import { usePeriodeSwitcher } from "../lib/periodeSwitcher";
import { JadwalPeriodProvider } from "../lib/jadwalPeriode";

const PERIODE_NS = "jadwal";

// Layout shell for the Jadwal module. The sub-nav is role-filtered (Tata Usaha
// sees the full builder, Guru/Kepala Sekolah a slimmer set; unknown → full nav).
//
// A switchable StripTahun lets the user pick the academic year (incl. archive)
// and provides JadwalPeriodContext: TA-scoped sub-pages (e.g. daftar) filter
// their data by it and gate writes to read-only when an archived TA is selected.
// Daily/template pages (agenda, slot, override, permintaan) are date-based and
// intentionally ignore the selected TA.
function JadwalLayout() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { primary } = useAkademikRole();
  const navGroups = filterJadwalNav(primary);
  const { value, taOptions, semOptions } = usePeriodeSwitcher(sekolah, PERIODE_NS);

  return (
    <JadwalPeriodProvider value={value}>
      <ModuleShell
        navGroups={navGroups}
        pathname={pathname}
        context={
          <StripTahun
            moduleLabel="Jadwal"
            taSwitch={{ value: value.tahunAjaran, options: taOptions, onChange: value.setTahunAjaran }}
            semesterSwitch={{ value: value.semester, options: semOptions, onChange: value.setSemester }}
            isPastPeriod={value.isPastPeriod}
            noActiveTa={value.noActiveTa}
            roleLabel={ROLE_LABEL[primary]}
          />
        }
      >
        <Outlet />
      </ModuleShell>
    </JadwalPeriodProvider>
  );
}

export const Route = createFileRoute("/sch/$sekolah/jadwal")({ component: JadwalLayout });
