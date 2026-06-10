import { createFileRoute, Outlet, useParams, useRouterState } from "@tanstack/react-router";
import type { NavTabGroup } from "../components/GroupedNavTabs";
import { ModuleShell } from "../components/shell/ModuleShell";
import { StripTahun } from "../components/shell/StripTahun";
import { useKelasRole, KELAS_ROLE_LABEL } from "../lib/kelasRole";
import { usePeriodeSwitcher } from "../lib/periodeSwitcher";
import { KelasPeriodProvider } from "../lib/kelasPeriode";

// Kelas sub-nav groups, rendered as the GroupedNavTabs header pill row.
const NAV_GROUPS: NavTabGroup[] = [
  {
    label: "Ringkasan",
    items: [{ to: "/sch/$sekolah/kelas", label: "Dashboard", exact: true }],
  },
  {
    label: "Kelas",
    items: [
      { to: "/sch/$sekolah/kelas/daftar", label: "Daftar Kelas" },
      { to: "/sch/$sekolah/kelas/rombel", label: "Rombongan Belajar" },
      { to: "/sch/$sekolah/kelas/anggota", label: "Anggota Rombel" },
    ],
  },
];

const PERIODE_NS = "kelas";
const LIST_SUFFIXES = ["/daftar", "/rombel", "/anggota"];

// Layout shell for the Kelas module. Provides KelasPeriodContext (Tahun Ajaran
// only — Rombongan Belajar has no semester) so the TU board + rombel/daftar/
// anggota surfaces can scope by year and gate writes in archive.
//
// The period strip is shown ONLY where the TA actually scopes the surface: the
// TU board (index) + the three lists. The wali cockpit (/saya), the kepsek
// approval queue (index, cross-TA), and the read-only detail drilldown ignore
// the period, so the selector stays hidden there — they remain provider children
// but never read the context.
function KelasLayout() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { primary } = useKelasRole();
  const { value, taOptions } = usePeriodeSwitcher(sekolah, PERIODE_NS);

  const onList = LIST_SUFFIXES.some((p) => pathname.endsWith(p));
  const onBoard = primary === "tu" && /\/kelas\/?$/.test(pathname);
  const showStrip = onList || onBoard;

  return (
    <KelasPeriodProvider value={value}>
      <ModuleShell
        navGroups={NAV_GROUPS}
        pathname={pathname}
        {...(showStrip
          ? {
              context: (
                <StripTahun
                  moduleLabel="Kelas"
                  taSwitch={{
                    value: value.tahunAjaran,
                    options: taOptions,
                    onChange: value.setTahunAjaran,
                  }}
                  isPastPeriod={value.isPastPeriod}
                  noActiveTa={value.noActiveTa}
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

export const Route = createFileRoute("/sch/$sekolah/kelas")({ component: KelasLayout });
