import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";

const TABS: { to: string; label: string; exact?: boolean }[] = [
  { to: "/sch/$sekolah/ppdb", label: "Dashboard", exact: true },
  { to: "/sch/$sekolah/ppdb/buat", label: "Buat PPDB" },
  { to: "/sch/$sekolah/ppdb/daftar", label: "Pendaftaran" },
  { to: "/sch/$sekolah/ppdb/calon-siswa", label: "Calon Siswa" },
  { to: "/sch/$sekolah/ppdb/gelombang", label: "Gelombang" },
  { to: "/sch/$sekolah/ppdb/seleksi", label: "Seleksi" },
  { to: "/sch/$sekolah/ppdb/pembayaran", label: "Pembayaran" },
  { to: "/sch/$sekolah/ppdb/daftar-ulang", label: "Daftar Ulang" },
  { to: "/sch/$sekolah/ppdb/pengaturan", label: "Pengaturan" },
];

function PpdbLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items: TabItem[] = TABS.map((t) => ({
    key: t.to,
    label: t.label,
    active: t.exact ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + "/"),
    render: ({ className, children }) => <Link to={t.to} className={className}>{children}</Link>,
  }));
  return (
    <div className="space-y-4">
      <Tabs items={items} />
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/ppdb")({ component: PpdbLayout });
