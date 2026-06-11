import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import type { NavTabGroup } from "../components/GroupedNavTabs";
import { ModuleShell } from "../components/shell/ModuleShell";
import { StripTahun } from "../components/shell/StripTahun";
import { useKelasRole, KELAS_ROLE_LABEL } from "../lib/kelasRole";
import { useAkademikContext } from "../lib/akademikContext";
import { KelasPeriodProvider } from "../lib/kelasPeriode";

// Kelas sub-nav groups, rendered as the GroupedNavTabs header pill row. Every
// `to` carries the `$ta` segment; TanStack inherits the active `ta` param (as it
// does `$sekolah`), so the pill bar stays on the same Tahun Ajaran while
// switching feature pages.
const NAV_GROUPS: NavTabGroup[] = [
  {
    label: "Ringkasan",
    items: [{ to: "/sch/$sekolah/akademik/$ta/kelas", label: "Dashboard", exact: true }],
  },
  {
    label: "Kelas",
    items: [
      { to: "/sch/$sekolah/akademik/$ta/kelas/daftar", label: "Daftar Kelas" },
      { to: "/sch/$sekolah/akademik/$ta/kelas/rombel", label: "Rombongan Belajar" },
      { to: "/sch/$sekolah/akademik/$ta/kelas/anggota", label: "Anggota Rombel" },
    ],
  },
];

const LIST_SUFFIXES = ["/daftar", "/rombel", "/anggota"];

// Layout shell for the Kelas module, now living inside the per-Tahun-Ajaran
// Akademik workspace (Fase 1 single-door). The Tahun Ajaran is fixed by the
// route path (`$ta`) and provided by the workspace; Kelas has no semester axis,
// so the akademik context value passes through to KelasPeriodProvider untouched
// (TU board + rombel/daftar/anggota scope by year and gate writes in archive).
//
// The period strip is shown ONLY where the TA actually scopes the surface: the
// TU board (index) + the three lists. The wali cockpit (/saya), the kepsek
// approval queue (index, cross-TA), and the read-only detail drilldown ignore
// the period, so the strip stays hidden there — they remain provider children
// but never read the context. Switching TA now happens via the Akademik hub /
// breadcrumb, so the strip renders the active TA as a read-only badge.
function KelasLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { primary } = useKelasRole();
  const akademik = useAkademikContext();

  const onList = LIST_SUFFIXES.some((p) => pathname.endsWith(p));
  const onBoard = primary === "tu" && /\/kelas\/?$/.test(pathname);
  const showStrip = onList || onBoard;

  return (
    <KelasPeriodProvider value={akademik}>
      <ModuleShell
        navGroups={NAV_GROUPS}
        pathname={pathname}
        {...(showStrip
          ? {
              context: (
                <StripTahun
                  moduleLabel="Kelas"
                  taLabel={akademik.tahunAjaran}
                  isPastPeriod={akademik.isPastPeriod}
                  noActiveTa={akademik.noActiveTa}
                  roleLabel={KELAS_ROLE_LABEL[primary]}
                />
              ),
            }
          : {})}
      >
        <Outlet />
      </ModuleShell>
    </KelasPeriodProvider>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/$ta/kelas")({ component: KelasLayout });
