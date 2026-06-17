import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { ModuleShell } from "../components/shell/ModuleShell";
import { StripTahun } from "../components/shell/StripTahun";
import { TahunChip } from "../components/shell/TahunChip";
import type { NavTabGroup } from "../components/GroupedNavTabs";
import { useGenericRoleLabel } from "../lib/genericRole";
import { useAkademikContext } from "../lib/akademikContext";
import { AbsensiPeriodProvider } from "../lib/absensiPeriode";

// Grouped nav for the Absensi module shell; every `to` carries the `$ta` segment
// (TanStack inherits the active `ta` param, like `$sekolah`), so the pill bar
// stays on the same Tahun Ajaran while switching surfaces.
const NAV_GROUPS: NavTabGroup[] = [
  {
    label: "Ringkasan",
    items: [{ to: "/sch/$sekolah/akademik/$ta/absensi", label: "Dashboard", exact: true }],
  },
  {
    label: "Kehadiran",
    items: [
      { to: "/sch/$sekolah/akademik/$ta/absensi/daftar", label: "Harian Siswa" },
      { to: "/sch/$sekolah/akademik/$ta/absensi/pelajaran", label: "Per Pelajaran" },
      { to: "/sch/$sekolah/akademik/$ta/absensi/guru", label: "Absensi Guru" },
    ],
  },
];

const CHIP_HINT = "otomatis ikut tanggal";

// Layout shell for Absensi, now a sub-module inside the per-Tahun-Ajaran Akademik
// workspace (Fase 2 single-door). The Tahun Ajaran is fixed by the route `$ta`
// and passes through the akademik context to AbsensiPeriodProvider, so Absensi
// Guru still scopes its list and gates creation in an archived year. Only Absensi
// Guru is TA-keyed; the date-driven daily surfaces (dashboard, Harian, Pelajaran)
// show a PASSIVE TahunChip — daily doctypes have no tahun_ajaran. Switching TA now
// happens via the Akademik hub/breadcrumb, so the strip is a read-only badge.
function AbsensiLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const roleLabel = useGenericRoleLabel();
  const akademik = useAkademikContext();
  const onGuru = pathname.endsWith("/guru");

  const context = onGuru ? (
    <StripTahun
      moduleLabel="Absensi"
      taLabel={akademik.tahunAjaran}
      isPastPeriod={akademik.isPastPeriod}
      noActiveTa={akademik.noActiveTa}
      {...(roleLabel ? { roleLabel } : {})}
    />
  ) : akademik.tahunAjaran ? (
    <TahunChip label={akademik.tahunAjaran} hint={CHIP_HINT} {...(roleLabel ? { roleLabel } : {})} />
  ) : undefined;

  return (
    <AbsensiPeriodProvider value={akademik}>
      <ModuleShell navGroups={NAV_GROUPS} pathname={pathname} {...(context ? { context } : {})}>
        <Outlet />
      </ModuleShell>
    </AbsensiPeriodProvider>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/$ta/absensi")({ component: AbsensiLayout });
