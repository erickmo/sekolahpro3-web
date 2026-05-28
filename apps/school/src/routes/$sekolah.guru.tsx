import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";

const TABS: { to: string; label: string; exact?: boolean }[] = [
  { to: "/$sekolah/guru", label: "Dashboard", exact: true },
  { to: "/$sekolah/guru/daftar", label: "Daftar Guru" },
  { to: "/$sekolah/guru/penugasan", label: "Penugasan" },
  { to: "/$sekolah/guru/sk-mengajar", label: "SK Mengajar" },
  { to: "/$sekolah/guru/sk-jabatan", label: "SK Jabatan" },
  { to: "/$sekolah/guru/jabatan", label: "Jabatan" },
  { to: "/$sekolah/guru/mapel-pengampu", label: "Mapel Pengampu" },
  { to: "/$sekolah/guru/berkas", label: "Berkas" },
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

export const Route = createFileRoute("/$sekolah/guru")({ component: GuruLayout });
