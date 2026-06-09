import {
  createFileRoute,
  Outlet,
  useParams,
  useRouterState,
} from "@tanstack/react-router";
import { Badge, SearchableSelect } from "@sekolahpro/ui";
import { EkskulContextProvider } from "../lib/ekskulContext";
import type { NavTabGroup } from "../components/GroupedNavTabs";
import { ModuleShell } from "../components/shell/ModuleShell";
import { useEkskulRole, ROLE_LABEL } from "../lib/ekskulRole";
import { usePeriodeSwitcher } from "../lib/periodeSwitcher";

const PERIODE_NS = "ekskul";

// Sub-navigation groups for the ekstrakurikuler module shell.
const NAV_GROUPS: NavTabGroup[] = [
  {
    label: "Ringkasan",
    items: [{ to: "/sch/$sekolah/ekstrakurikuler", label: "Dashboard", exact: true }],
  },
  {
    label: "Kegiatan",
    items: [
      { to: "/sch/$sekolah/ekstrakurikuler/sesi", label: "Sesi & Kehadiran" },
      { to: "/sch/$sekolah/ekstrakurikuler/raport", label: "Raport" },
    ],
  },
  {
    label: "Kelola",
    items: [
      { to: "/sch/$sekolah/ekstrakurikuler/program", label: "Program" },
      { to: "/sch/$sekolah/ekstrakurikuler/pendaftaran", label: "Pendaftaran" },
      { to: "/sch/$sekolah/ekstrakurikuler/mitra", label: "Mitra" },
    ],
  },
];

// Ekstrakurikuler module layout: resolves TA/Semester period context (via the
// shared usePeriodeSwitcher) and wraps the outlet in ModuleShell with a custom
// period context bar.
function EkskulLayout() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { primary } = useEkskulRole();
  const { value, taOptions, semOptions } = usePeriodeSwitcher(sekolah, PERIODE_NS);

  return (
    <EkskulContextProvider value={value}>
      <ModuleShell
        navGroups={NAV_GROUPS}
        pathname={pathname}
        context={
          <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-fg shrink-0">
              Konteks Ekstrakurikuler
            </span>
            {value.isPastPeriod ? (
              <Badge tone="warning" dot>
                Periode lampau
              </Badge>
            ) : (
              <Badge tone="success" dot>
                Periode berjalan
              </Badge>
            )}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-fg shrink-0" htmlFor="ek-ta">
                Tahun Ajaran
              </label>
              <SearchableSelect
                id="ek-ta"
                value={value.tahunAjaran}
                onChange={value.setTahunAjaran}
                options={taOptions}
                placeholder="Pilih TA…"
                className="w-48"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-fg shrink-0" htmlFor="ek-sem">
                Semester
              </label>
              <SearchableSelect
                id="ek-sem"
                value={value.semester}
                onChange={value.setSemester}
                options={semOptions}
                placeholder="Pilih semester…"
                className="w-44"
              />
            </div>
            <span className="ml-auto">
              <Badge tone="brand">{ROLE_LABEL[primary]}</Badge>
            </span>
          </div>
        }
      >
        <Outlet />
      </ModuleShell>
    </EkskulContextProvider>
  );
}

export const Route = createFileRoute("/sch/$sekolah/ekstrakurikuler")({
  component: EkskulLayout,
});
