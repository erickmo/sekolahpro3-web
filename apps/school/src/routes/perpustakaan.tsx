import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";

const TABS: { to: string; label: string; exact?: boolean }[] = [
  { to: "/perpustakaan", label: "Dashboard", exact: true },
  { to: "/perpustakaan/daftar", label: "Katalog Buku" },
  { to: "/perpustakaan/kategori", label: "Kategori" },
  { to: "/perpustakaan/peminjaman", label: "Peminjaman" },
  { to: "/perpustakaan/reservasi", label: "Reservasi" },
  { to: "/perpustakaan/anggota", label: "Anggota" },
  { to: "/perpustakaan/laporan", label: "Laporan" },
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

export const Route = createFileRoute("/perpustakaan")({ component: PerpustakaanLayout });
