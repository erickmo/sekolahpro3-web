import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { GroupedNavTabs } from "../components/GroupedNavTabs";
import { STAFF_NAV_GROUPS } from "../lib/orang/nav";

/**
 * Staff (Kepegawaian) module layout. Renders the grouped sub-navigation above
 * the nested route outlet. Navigation data lives in lib/orang/nav so the menu
 * stays single-sourced and every target is a verified existing route file.
 */
function StaffLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="space-y-4">
      <GroupedNavTabs groups={STAFF_NAV_GROUPS} pathname={pathname} variant="stacked" />
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/staff")({ component: StaffLayout });
