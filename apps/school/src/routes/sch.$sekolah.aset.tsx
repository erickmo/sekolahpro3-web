import { createFileRoute, Link, Outlet, useParams, useRouterState } from "@tanstack/react-router";
import { Tabs, type TabItem } from "@sekolahpro/ui";
import { ASET_TABS, isTabActive } from "../lib/aset/nav";
import { AsetContextBar } from "../components/aset/AsetContextBar";

/** Layout route for the Manajemen Aset module: role context bar + tab subnav. */
function AsetLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { sekolah } = useParams({ from: "/sch/$sekolah/aset" });
  const items: TabItem[] = ASET_TABS.map((t) => ({
    key: t.to,
    label: t.label,
    active: isTabActive(t.to, sekolah, pathname, t.exact),
    render: ({ className, children }) => (
      <Link to={t.to} className={className}>{children}</Link>
    ),
  }));
  return (
    <div className="space-y-4">
      <AsetContextBar />
      <Tabs items={items} />
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/aset")({ component: AsetLayout });
