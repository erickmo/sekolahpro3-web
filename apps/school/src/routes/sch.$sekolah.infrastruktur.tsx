import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import type { NavTabGroup } from "../components/GroupedNavTabs";
import { ModuleShell } from "../components/shell/ModuleShell";

// Infrastruktur sub-nav groups, rendered as the GroupedNavTabs header pill row.
// Lantai / Ruangan / Utilitas dipindah ke dalam halaman detail gedung
// (daftar-gedung/$gedungId), jadi nav hanya menyisakan entry utama.
const NAV_GROUPS: NavTabGroup[] = [
  {
    label: "Ringkasan",
    items: [{ to: "/sch/$sekolah/infrastruktur", label: "Dashboard", exact: true }],
  },
  {
    label: "Data",
    items: [{ to: "/sch/$sekolah/infrastruktur/daftar-gedung", label: "Gedung" }],
  },
];

// Layout shell for the Infrastruktur config module (no context bar — config-only).
function InfraLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <ModuleShell navGroups={NAV_GROUPS} pathname={pathname}>
      <Outlet />
    </ModuleShell>
  );
}

export const Route = createFileRoute("/sch/$sekolah/infrastruktur")({ component: InfraLayout });
