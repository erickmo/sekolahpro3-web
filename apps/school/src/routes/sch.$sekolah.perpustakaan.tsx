import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";

const TABS: { to: string; label: string; exact?: boolean }[] = [
  { to: "/sch/$sekolah/perpustakaan", label: "Dashboard", exact: true },
  { to: "/sch/$sekolah/perpustakaan/daftar", label: "Katalog Buku" },
  { to: "/sch/$sekolah/perpustakaan/kategori", label: "Kategori" },
  { to: "/sch/$sekolah/perpustakaan/peminjaman", label: "Peminjaman" },
  { to: "/sch/$sekolah/perpustakaan/reservasi", label: "Reservasi" },
  { to: "/sch/$sekolah/perpustakaan/pengadaan", label: "Pengadaan" },
  { to: "/sch/$sekolah/perpustakaan/inventaris", label: "Inventaris" },
  { to: "/sch/$sekolah/perpustakaan/anggota", label: "Anggota" },
  { to: "/sch/$sekolah/perpustakaan/terminal", label: "Terminal" },
  { to: "/sch/$sekolah/perpustakaan/laporan", label: "Laporan" },
];

function PerpustakaanLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items: TabItem[] = TABS.map((t) => ({
    key: t.to,
    label: t.label,
    active: t.exact ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + "/"),
    render: ({ className, children }) => (
      <Link to={t.to} className={className}>{children}</Link>
    ),
  }));
  return (
    <div className="space-y-4">
      <Tabs items={items} />
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/perpustakaan")({ component: PerpustakaanLayout });
