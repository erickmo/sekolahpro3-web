import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";

const TABS: { to: string; label: string; exact?: boolean }[] = [
  { to: "/$sekolah/akuntansi", label: "Dashboard", exact: true },
  { to: "/$sekolah/akuntansi/buku-besar", label: "Buku Besar" },
  { to: "/$sekolah/akuntansi/anggaran", label: "Anggaran" },
  { to: "/$sekolah/akuntansi/pajak", label: "Pajak" },
  { to: "/$sekolah/akuntansi/referensi", label: "Referensi" },
];

function AkuntansiLayout() {
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

export const Route = createFileRoute("/$sekolah/akuntansi")({ component: AkuntansiLayout });
