import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";

const SUBTABS: { to: string; label: string; exact?: boolean }[] = [
  { to: "/$sekolah/akuntansi/anggaran", label: "Budget", exact: true },
  { to: "/$sekolah/akuntansi/anggaran/amandemen", label: "Amandemen" },
  { to: "/$sekolah/akuntansi/anggaran/cost-center", label: "Cost Center" },
  { to: "/$sekolah/akuntansi/anggaran/dimensi", label: "Dimensi" },
];

function AnggaranLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items: TabItem[] = SUBTABS.map((t) => ({
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

export const Route = createFileRoute("/$sekolah/akuntansi/anggaran")({ component: AnggaranLayout });
