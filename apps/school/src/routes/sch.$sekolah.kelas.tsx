import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import type { NavTabGroup } from "../components/GroupedNavTabs";
import { ModuleShell } from "../components/shell/ModuleShell";

// Kelas sub-nav groups, rendered as the GroupedNavTabs header pill row.
const NAV_GROUPS: NavTabGroup[] = [
  {
    label: "Ringkasan",
    items: [{ to: "/sch/$sekolah/kelas", label: "Dashboard", exact: true }],
  },
  {
    label: "Kelas",
    items: [
      { to: "/sch/$sekolah/kelas/daftar", label: "Daftar Kelas" },
      { to: "/sch/$sekolah/kelas/rombel", label: "Rombongan Belajar" },
      { to: "/sch/$sekolah/kelas/anggota", label: "Anggota Rombel" },
    ],
  },
];

// Layout shell for the Kelas config module (no context bar — config-only).
function KelasLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <ModuleShell navGroups={NAV_GROUPS} pathname={pathname}>
      <Outlet />
    </ModuleShell>
  );
}

export const Route = createFileRoute("/sch/$sekolah/kelas")({ component: KelasLayout });
