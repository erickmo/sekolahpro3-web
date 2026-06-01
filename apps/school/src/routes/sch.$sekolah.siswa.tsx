import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { GroupedNavTabs } from "../components/GroupedNavTabs";
import { SISWA_NAV_GROUPS } from "../lib/orang/nav";

/**
 * Siswa module layout: grouped sub-navigation (stacked, role-oriented groups)
 * above the nested route outlet. Replaces the previous flat single-row Tabs so
 * the many Siswa sub-pages stay discoverable for new operators.
 */
function SiswaLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="space-y-4">
      <GroupedNavTabs groups={SISWA_NAV_GROUPS} pathname={pathname} variant="stacked" />
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/siswa")({ component: SiswaLayout });
