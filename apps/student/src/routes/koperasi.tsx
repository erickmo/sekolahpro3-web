import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";

const MEMBERS = [
  { to: "/koperasi", label: "Ringkasan" },
  { to: "/koperasi/mutasi", label: "Mutasi" },
  { to: "/koperasi/pembiayaan", label: "Pembiayaan" },
];

function KoperasiLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items: TabItem[] = MEMBERS.map((m) => ({
    key: m.to,
    label: m.label,
    active: pathname === m.to,
    render: ({ className, children }) => (
      <Link to={m.to} className={className}>{children}</Link>
    ),
  }));
  return (
    <div className="space-y-4">
      <Tabs items={items} />
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/koperasi")({ component: KoperasiLayout });
