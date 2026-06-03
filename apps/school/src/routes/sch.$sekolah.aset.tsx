import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import type { NavTabGroup } from "../components/GroupedNavTabs";
import { ModuleShell } from "../components/shell/ModuleShell";
import { useAsetRole } from "../lib/aset/role";

/** Grouped sub-navigation for the Manajemen Aset module (all 8 tabs preserved). */
const NAV_GROUPS: NavTabGroup[] = [
  {
    label: "Ringkasan",
    items: [{ to: "/sch/$sekolah/aset", label: "Dashboard", exact: true }],
  },
  {
    label: "Operasi",
    items: [
      { to: "/sch/$sekolah/aset/daftar", label: "Daftar Aset" },
      { to: "/sch/$sekolah/aset/peminjaman", label: "Peminjaman" },
      { to: "/sch/$sekolah/aset/maintenance", label: "Maintenance" },
      { to: "/sch/$sekolah/aset/transfer", label: "Transfer" },
    ],
  },
  {
    label: "Kelola",
    items: [
      { to: "/sch/$sekolah/aset/kategori", label: "Kategori" },
      { to: "/sch/$sekolah/aset/lokasi", label: "Lokasi" },
    ],
  },
  {
    label: "Laporan",
    items: [{ to: "/sch/$sekolah/aset/laporan", label: "Laporan" }],
  },
];

/** Layout route for the Manajemen Aset module: ModuleShell with role context bar. */
function AsetLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const aset = useAsetRole();
  return (
    <ModuleShell
      label="Aset"
      framing={aset.framing}
      roleLabel={aset.label}
      navGroups={NAV_GROUPS}
      pathname={pathname}
    >
      <Outlet />
    </ModuleShell>
  );
}

export const Route = createFileRoute("/sch/$sekolah/aset")({ component: AsetLayout });
