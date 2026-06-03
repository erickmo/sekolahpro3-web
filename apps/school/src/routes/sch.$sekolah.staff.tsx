import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { GroupedNavTabs } from "../components/GroupedNavTabs";
import { ModuleHeader } from "../components/ModuleHeader";
import { OrangContextBar } from "../components/orang/OrangContextBar";
import { STAFF_NAV_GROUPS } from "../lib/orang/nav";

/**
 * Staff (Kepegawaian) module layout. Uses the shared ModuleHeader chrome (sticky
 * role-framing context bar + horizontal sub-nav) so it reads identically to the
 * other modules. No CTA — there is no dedicated staff/new route; intake happens
 * through the Daftar Pegawai sub-page. Navigation is single-sourced from
 * lib/orang/nav.
 */
function StaffLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="space-y-4">
      <ModuleHeader
        context={<OrangContextBar domain="staff" />}
        nav={<GroupedNavTabs groups={STAFF_NAV_GROUPS} pathname={pathname} variant="header" />}
      />
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/staff")({ component: StaffLayout });
