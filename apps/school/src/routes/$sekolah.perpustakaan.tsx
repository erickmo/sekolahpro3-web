import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";

const TABS: { to: string; label: string; exact?: boolean }[] = [
  { to: "/$sekolah/perpustakaan", label: "Dashboard", exact: true },
  { to: "/$sekolah/perpustakaan/daftar", label: "Katalog Buku" },
  { to: "/$sekolah/perpustakaan/kategori", label: "Kategori" },
  { to: "/$sekolah/perpustakaan/peminjaman", label: "Peminjaman" },
  { to: "/$sekolah/perpustakaan/reservasi", label: "Reservasi" },
  { to: "/$sekolah/perpustakaan/pengadaan", label: "Pengadaan" },
  { to: "/$sekolah/perpustakaan/inventaris", label: "Inventaris" },
  { to: "/$sekolah/perpustakaan/anggota", label: "Anggota" },
  { to: "/$sekolah/perpustakaan/terminal", label: "Terminal" },
  { to: "/$sekolah/perpustakaan/laporan", label: "Laporan" },
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

export const Route = createFileRoute("/$sekolah/perpustakaan")({ component: PerpustakaanLayout });
