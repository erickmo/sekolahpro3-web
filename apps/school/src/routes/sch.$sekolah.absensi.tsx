import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { ModuleShell } from "../components/shell/ModuleShell";
import type { NavTabGroup } from "../components/GroupedNavTabs";
import { useGenericRoleLabel } from "../lib/genericRole";

// Grouped nav for the Absensi module shell; preserves all original tab routes/labels.
const NAV_GROUPS: NavTabGroup[] = [
  {
    label: "Ringkasan",
    items: [{ to: "/sch/$sekolah/absensi", label: "Dashboard", exact: true }],
  },
  {
    label: "Kehadiran",
    items: [
      { to: "/sch/$sekolah/absensi/daftar", label: "Harian Siswa" },
      { to: "/sch/$sekolah/absensi/pelajaran", label: "Per Pelajaran" },
      { to: "/sch/$sekolah/absensi/guru", label: "Absensi Guru" },
    ],
  },
];

// Layout shell for the Absensi module; renders grouped nav + role context bar.
function AbsensiLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <ModuleShell
      label="Absensi"
      framing="Pantau dan catat kehadiran harian siswa dan guru."
      roleLabel={useGenericRoleLabel()}
      navGroups={NAV_GROUPS}
      pathname={pathname}
    >
      <Outlet />
    </ModuleShell>
  );
}

export const Route = createFileRoute("/sch/$sekolah/absensi")({ component: AbsensiLayout });
