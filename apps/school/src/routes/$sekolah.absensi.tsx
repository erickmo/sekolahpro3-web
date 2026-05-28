import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";

const TABS: { to: string; label: string; exact?: boolean }[] = [
  { to: "/$sekolah/absensi", label: "Dashboard", exact: true },
  { to: "/$sekolah/absensi/daftar", label: "Harian Siswa" },
  { to: "/$sekolah/absensi/pelajaran", label: "Per Pelajaran" },
  { to: "/$sekolah/absensi/guru", label: "Absensi Guru" },
];

function AbsensiLayout() {
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

export const Route = createFileRoute("/$sekolah/absensi")({ component: AbsensiLayout });
