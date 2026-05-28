import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";

const TABS: { to: string; label: string; exact?: boolean }[] = [
  { to: "/$sekolah/master", label: "Dashboard", exact: true },
  { to: "/$sekolah/master/daftar", label: "Sekolah" },
  { to: "/$sekolah/master/tahun-ajaran", label: "Tahun Ajaran" },
  { to: "/$sekolah/master/semester", label: "Semester" },
  { to: "/$sekolah/master/unit-jenjang", label: "Unit Jenjang" },
  { to: "/$sekolah/master/organisasi", label: "Organisasi" },
  { to: "/$sekolah/master/modul", label: "Modul Aktif" },
  { to: "/$sekolah/master/feature-flag", label: "Feature Flag" },
  { to: "/$sekolah/master/pengguna", label: "Pengguna" },
];

function MasterLayout() {
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

export const Route = createFileRoute("/$sekolah/master")({ component: MasterLayout });
