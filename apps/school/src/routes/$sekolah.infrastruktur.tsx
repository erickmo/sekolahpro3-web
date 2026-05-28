import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";

const TABS: { to: string; label: string; exact?: boolean }[] = [
  { to: "/infrastruktur", label: "Dashboard", exact: true },
  { to: "/infrastruktur/daftar", label: "Gedung" },
  { to: "/infrastruktur/lantai", label: "Lantai" },
  { to: "/infrastruktur/ruangan", label: "Ruangan" },
  { to: "/infrastruktur/fasilitas", label: "Fasilitas" },
  { to: "/infrastruktur/utilitas", label: "Utilitas" },
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

export const Route = createFileRoute("/infrastruktur")({ component: InfraLayout });
