import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { ModuleShell } from "../components/shell/ModuleShell";
import { useGenericRoleLabel } from "../lib/genericRole";
import { STAFF_NAV_GROUPS } from "../lib/orang/nav";

/**
 * Staff (Kepegawaian) module layout. Wraps the nested route outlet in the shared
 * ModuleShell (header-variant nav + role context bar). Navigation data lives in
 * lib/orang/nav so the menu stays single-sourced and every target is a verified
 * existing route file.
 */
function StaffLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <ModuleShell
      label="Guru & Staf"
      framing="Kelola data kepegawaian, penugasan mengajar, dan administrasi staf."
      roleLabel={useGenericRoleLabel()}
      navGroups={STAFF_NAV_GROUPS}
      pathname={pathname}
    >
      <Outlet />
    </ModuleShell>
  );
}

export const Route = createFileRoute("/sch/$sekolah/staff")({ component: StaffLayout });
