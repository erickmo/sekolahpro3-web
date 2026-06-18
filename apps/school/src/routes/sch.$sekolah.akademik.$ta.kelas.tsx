import { createFileRoute, Outlet, useParams, useRouterState } from "@tanstack/react-router";
import { ModuleShell } from "../components/shell/ModuleShell";
import { StripTahun } from "../components/shell/StripTahun";
import { AkademikNav } from "../components/akademik/AkademikNav";
import { useKelasRole, KELAS_ROLE_LABEL } from "../lib/kelasRole";
import { useAkademikContext } from "../lib/akademikContext";
import { KelasPeriodProvider } from "../lib/kelasPeriode";

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
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const { primary } = useKelasRole();
  const akademik = useAkademikContext();

  const onList = LIST_SUFFIXES.some((p) => pathname.endsWith(p));
  const onBoard = primary === "tu" && /\/kelas\/?$/.test(pathname);
  const showStrip = onList || onBoard;

  return (
    <KelasPeriodProvider value={akademik}>
      <ModuleShell
        navSlot={<AkademikNav sekolah={sekolah} ta={akademik.tahunAjaran} pathname={pathname} />}
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
