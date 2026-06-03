/**
 * Keuangan hub layout.
 *
 * Hosts the unified hub navigation (Ringkasan / Operasional / Akuntansi) shared
 * with the /akuntansi route tree, then renders the active child page. The single
 * "Keuangan" sidebar entry plus this shared nav make the two route trees feel
 * like one module — see docs/keuangan-redesign.md.
 */
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { ModuleShell } from "../components/shell/ModuleShell";
import { useGenericRoleLabel } from "../lib/genericRole";
import { KEUANGAN_NAV_GROUPS } from "../lib/keuanganHub";

/** Module shell for the Keuangan route tree (role context mode). */
function KeuanganLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <ModuleShell
      label="Keuangan"
      framing="Kelola operasional kas, tagihan, dan pembayaran sekolah."
      roleLabel={useGenericRoleLabel()}
      navGroups={KEUANGAN_NAV_GROUPS}
      pathname={pathname}
    >
      <Outlet />
    </ModuleShell>
  );
}

export const Route = createFileRoute("/sch/$sekolah/keuangan")({ component: KeuanganLayout });
