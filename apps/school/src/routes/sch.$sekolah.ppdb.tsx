import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { ModuleShell } from "../components/shell/ModuleShell";
import type { NavTabGroup } from "../components/GroupedNavTabs";
import { useGenericRoleLabel } from "../lib/genericRole";

// Grouped sub-nav for the PPDB module: 9 destinations bucketed into 4 themed
// header-pill groups (summary → intake → process → admin).
const NAV_GROUPS: NavTabGroup[] = [
  {
    label: "Ringkasan",
    items: [{ to: "/sch/$sekolah/ppdb", label: "Dashboard", exact: true }],
  },
  {
    label: "Pendaftaran",
    items: [
      { to: "/sch/$sekolah/ppdb/buat", label: "Buat PPDB" },
      { to: "/sch/$sekolah/ppdb/daftar", label: "Pendaftaran" },
      { to: "/sch/$sekolah/ppdb/calon-siswa", label: "Calon Siswa" },
      { to: "/sch/$sekolah/ppdb/gelombang", label: "Gelombang" },
    ],
  },
  {
    label: "Proses",
    items: [
      { to: "/sch/$sekolah/ppdb/seleksi", label: "Seleksi" },
      { to: "/sch/$sekolah/ppdb/pembayaran", label: "Pembayaran" },
      { to: "/sch/$sekolah/ppdb/daftar-ulang", label: "Daftar Ulang" },
    ],
  },
  {
    label: "Kelola",
    items: [{ to: "/sch/$sekolah/ppdb/pengaturan", label: "Pengaturan" }],
  },
];

// PPDB module layout: role-framed ModuleShell chrome wrapping the route outlet.
function PpdbLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <ModuleShell
      label="PPDB"
      framing="Kelola penerimaan peserta didik baru dari pendaftaran sampai daftar ulang."
      roleLabel={useGenericRoleLabel()}
      navGroups={NAV_GROUPS}
      pathname={pathname}
    >
      <Outlet />
    </ModuleShell>
  );
}

export const Route = createFileRoute("/sch/$sekolah/ppdb")({ component: PpdbLayout });
