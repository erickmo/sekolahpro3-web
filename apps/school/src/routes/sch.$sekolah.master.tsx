import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import type { NavTabGroup } from "../components/GroupedNavTabs";
import { ModuleShell } from "../components/shell/ModuleShell";

// Master Data sub-nav groups, rendered as the GroupedNavTabs header pill row.
// Grup "Akademik" menampung master akademik yang dipindah dari modul Akademik
// (Tahun Ajaran, Kurikulum, Mapel, dll).
const NAV_GROUPS: NavTabGroup[] = [
  {
    label: "Umum",
    items: [
      { to: "/sch/$sekolah/master", label: "Dashboard", exact: true },
      { to: "/sch/$sekolah/master/unit-jenjang", label: "Unit Jenjang" },
      { to: "/sch/$sekolah/master/pengguna", label: "Pengguna" },
    ],
  },
  {
    label: "Akademik",
    items: [
      { to: "/sch/$sekolah/master/tahun-ajaran", label: "Tahun Ajaran" },
      { to: "/sch/$sekolah/master/kurikulum", label: "Kurikulum" },
      { to: "/sch/$sekolah/master/mapel", label: "Mata Pelajaran" },
      { to: "/sch/$sekolah/master/komponen-nilai", label: "Komponen Nilai" },
      { to: "/sch/$sekolah/master/kkm", label: "KKM" },
      { to: "/sch/$sekolah/master/konfigurasi", label: "Konfigurasi" },
    ],
  },
];

// Layout shell for the Master Data config module (no context bar — config-only).
function MasterLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <ModuleShell navGroups={NAV_GROUPS} pathname={pathname}>
      <Outlet />
    </ModuleShell>
  );
}

export const Route = createFileRoute("/sch/$sekolah/master")({ component: MasterLayout });
