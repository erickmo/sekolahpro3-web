import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";

const TABS: { to: string; label: string; exact?: boolean }[] = [
  { to: "/akademik", label: "Dashboard", exact: true },
  { to: "/akademik/daftar", label: "Daftar Mapel" },
  { to: "/akademik/kurikulum", label: "Kurikulum" },
  { to: "/akademik/kkm", label: "KKM" },
  { to: "/akademik/komponen-nilai", label: "Komponen Nilai" },
  { to: "/akademik/entri-nilai", label: "Entri Nilai" },
  { to: "/akademik/raport", label: "Raport" },
  { to: "/akademik/konfigurasi", label: "Konfigurasi" },
];

function AkademikLayout() {
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

export const Route = createFileRoute("/akademik")({ component: AkademikLayout });
