import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { ModuleShell } from "../components/shell/ModuleShell";
import type { NavTabGroup } from "../components/GroupedNavTabs";

// Sub-navigation for the Pengaturan module (config-only, no context row).
const NAV_GROUPS: NavTabGroup[] = [
  {
    label: "Pengaturan",
    items: [
      { to: "/sch/$sekolah/pengaturan", label: "Umum", exact: true },
      { to: "/sch/$sekolah/pengaturan/modul", label: "Modul Aktif" },
      { to: "/sch/$sekolah/pengaturan/feature-flag", label: "Feature Flag" },
    ],
  },
];

// Layout shell for the Pengaturan module: header nav + page outlet.
function PengaturanLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <ModuleShell navGroups={NAV_GROUPS} pathname={pathname}>
      <Outlet />
    </ModuleShell>
  );
}

export const Route = createFileRoute("/sch/$sekolah/pengaturan")({ component: PengaturanLayout });
