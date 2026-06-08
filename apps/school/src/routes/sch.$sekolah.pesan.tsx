/**
 * Pesan module layout — thin ModuleShell chrome (role context bar + role-filtered
 * sub-nav) wrapping the route Outlet. Mirrors sch.$sekolah.aset.tsx.
 *
 * The per-role surface is chosen by the index (sch.$sekolah.pesan.index.tsx); this file
 * only supplies the shared shell, so it is edited once and never re-touched as persona
 * phases add surfaces.
 */
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { ModuleShell } from "../components/shell/ModuleShell";
import { usePesanRole, PESAN_ROLE_LABEL } from "../lib/pesanRole";
import { filterPesanNav } from "../lib/pesanNav";

function PesanLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { primary } = usePesanRole();
  return (
    <ModuleShell
      label="Pusat Pesan"
      roleLabel={PESAN_ROLE_LABEL[primary]}
      navGroups={filterPesanNav(primary)}
      pathname={pathname}
    >
      <Outlet />
    </ModuleShell>
  );
}

export const Route = createFileRoute("/sch/$sekolah/pesan")({ component: PesanLayout });
