import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";

const TABS: { to: string; label: string; exact?: boolean }[] = [
  { to: "/sch/$sekolah/siswa", label: "Dashboard", exact: true },
  { to: "/sch/$sekolah/siswa/daftar", label: "Daftar Siswa" },
  { to: "/sch/$sekolah/siswa/wali", label: "Wali Siswa" },
  { to: "/sch/$sekolah/siswa/rombel", label: "Anggota Rombel" },
  { to: "/sch/$sekolah/siswa/mutasi", label: "Mutasi" },
  { to: "/sch/$sekolah/siswa/kelulusan", label: "Kelulusan" },
];

function SiswaLayout() {
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

export const Route = createFileRoute("/sch/$sekolah/siswa")({ component: SiswaLayout });
