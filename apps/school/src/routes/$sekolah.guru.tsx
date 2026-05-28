import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";

const TABS: { to: string; label: string; exact?: boolean }[] = [
  { to: "/guru", label: "Dashboard", exact: true },
  { to: "/guru/daftar", label: "Daftar Guru" },
  { to: "/guru/penugasan", label: "Penugasan" },
  { to: "/guru/sk-mengajar", label: "SK Mengajar" },
  { to: "/guru/sk-jabatan", label: "SK Jabatan" },
  { to: "/guru/jabatan", label: "Jabatan" },
  { to: "/guru/mapel-pengampu", label: "Mapel Pengampu" },
  { to: "/guru/berkas", label: "Berkas" },
];

function GuruLayout() {
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

export const Route = createFileRoute("/guru")({ component: GuruLayout });
