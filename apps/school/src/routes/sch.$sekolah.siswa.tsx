import { createFileRoute, Link, Outlet, useParams, useRouterState } from "@tanstack/react-router";
import { IconPlus } from "@sekolahpro/ui";
import { GroupedNavTabs } from "../components/GroupedNavTabs";
import { ModuleHeader } from "../components/ModuleHeader";
import { OrangContextBar } from "../components/orang/OrangContextBar";
import { SISWA_NAV_GROUPS } from "../lib/orang/nav";

/**
 * Siswa module layout. Uses the shared ModuleHeader chrome (sticky context bar +
 * horizontal sub-nav) so it reads identically to Ekstrakurikuler / Akademik /
 * Perpustakaan. The konteks row is a role-framing bar with a "Tambah Siswa" CTA;
 * navigation data is single-sourced from lib/orang/nav.
 */
function SiswaLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  // Primary action: jump straight to creating a new siswa record.
  const tambahCta = (
    <Link
      to="/sch/$sekolah/siswa/new"
      params={{ sekolah }}
      className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand/90"
    >
      <IconPlus className="h-4 w-4 shrink-0" aria-hidden />
      Tambah Siswa
    </Link>
  );

  return (
    <div className="space-y-4">
      <ModuleHeader
        context={<OrangContextBar domain="siswa" cta={tambahCta} />}
        nav={<GroupedNavTabs groups={SISWA_NAV_GROUPS} pathname={pathname} variant="header" />}
      />
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/siswa")({ component: SiswaLayout });
