import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";

// Lantai / Ruangan / Utilitas dipindah ke dalam halaman detail gedung
// (daftar-gedung/$gedungId). Tab bar hanya menyisakan entry utama.
const TABS: { to: string; label: string; exact?: boolean }[] = [
  { to: "/$sekolah/infrastruktur", label: "Dashboard", exact: true },
  { to: "/$sekolah/infrastruktur/daftar-gedung", label: "Gedung" },
  { to: "/$sekolah/infrastruktur/fasilitas", label: "Fasilitas" },
];

function InfraLayout() {
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

export const Route = createFileRoute("/$sekolah/infrastruktur")({ component: InfraLayout });
