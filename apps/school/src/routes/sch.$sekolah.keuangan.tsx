/**
 * Keuangan hub layout.
 *
 * Hosts the unified hub navigation (Ringkasan / Operasional / Akuntansi) shared
 * with the /akuntansi route tree, then renders the active child page. The single
 * "Keuangan" sidebar entry plus this shared nav make the two route trees feel
 * like one module — see docs/keuangan-redesign.md.
 */
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { KeuanganHubNav } from "../components/keuangan";

function KeuanganLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="space-y-5">
      <KeuanganHubNav pathname={pathname} />
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/keuangan")({ component: KeuanganLayout });
