import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import type { NavTabGroup } from "../components/GroupedNavTabs";
import { ModuleShell } from "../components/shell/ModuleShell";

// Jadwal sub-nav groups, rendered as the GroupedNavTabs header pill row.
const NAV_GROUPS: NavTabGroup[] = [
  {
    label: "Ringkasan",
    items: [{ to: "/sch/$sekolah/jadwal", label: "Dashboard", exact: true }],
  },
  {
    label: "Jadwal",
    items: [
      { to: "/sch/$sekolah/jadwal/daftar", label: "Jadwal Pelajaran" },
      { to: "/sch/$sekolah/jadwal/slot", label: "Slot Jadwal" },
    ],
  },
  {
    label: "Override",
    items: [
      { to: "/sch/$sekolah/jadwal/override", label: "Jadwal Override" },
      { to: "/sch/$sekolah/jadwal/slot-override", label: "Slot Override" },
    ],
  },
];

// Layout shell for the Jadwal config module (no context bar — config-only).
function JadwalLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <ModuleShell navGroups={NAV_GROUPS} pathname={pathname}>
      <Outlet />
    </ModuleShell>
  );
}

export const Route = createFileRoute("/sch/$sekolah/jadwal")({ component: JadwalLayout });
