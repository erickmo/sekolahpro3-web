import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";

const TABS: { to: string; label: string; exact?: boolean }[] = [
  { to: "/$sekolah/jadwal", label: "Dashboard", exact: true },
  { to: "/$sekolah/jadwal/daftar", label: "Jadwal Pelajaran" },
  { to: "/$sekolah/jadwal/slot", label: "Slot Jadwal" },
  { to: "/$sekolah/jadwal/override", label: "Jadwal Override" },
  { to: "/$sekolah/jadwal/slot-override", label: "Slot Override" },
];

function JadwalLayout() {
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

export const Route = createFileRoute("/$sekolah/jadwal")({ component: JadwalLayout });
