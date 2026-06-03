import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { ModuleShell } from "../components/shell/ModuleShell";
import { useGenericRoleLabel } from "../lib/genericRole";
import { SISWA_NAV_GROUPS } from "../lib/orang/nav";

/**
 * Siswa module layout: header-variant ModuleShell wrapping the nested route
 * outlet, with role-based context framing for the many Siswa sub-pages.
 */
function SiswaLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <ModuleShell
      label="Siswa"
      framing="Kelola data, penerimaan, kelulusan, dan administrasi siswa."
      roleLabel={useGenericRoleLabel()}
      navGroups={SISWA_NAV_GROUPS}
      pathname={pathname}
    >
      <Outlet />
    </ModuleShell>
  );
}

export const Route = createFileRoute("/sch/$sekolah/siswa")({ component: SiswaLayout });
