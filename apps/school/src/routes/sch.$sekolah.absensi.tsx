import { createFileRoute, Outlet, useParams, useRouterState } from "@tanstack/react-router";
import { ModuleShell } from "../components/shell/ModuleShell";
import { StripTahun } from "../components/shell/StripTahun";
import { TahunChip } from "../components/shell/TahunChip";
import type { NavTabGroup } from "../components/GroupedNavTabs";
import { useGenericRoleLabel } from "../lib/genericRole";
import { usePeriodeSwitcher } from "../lib/periodeSwitcher";
import { AbsensiPeriodProvider } from "../lib/absensiPeriode";

// Grouped nav for the Absensi module shell; preserves all original tab routes/labels.
const NAV_GROUPS: NavTabGroup[] = [
  {
    label: "Ringkasan",
    items: [{ to: "/sch/$sekolah/absensi", label: "Dashboard", exact: true }],
  },
  {
    label: "Kehadiran",
    items: [
      { to: "/sch/$sekolah/absensi/daftar", label: "Harian Siswa" },
      { to: "/sch/$sekolah/absensi/pelajaran", label: "Per Pelajaran" },
      { to: "/sch/$sekolah/absensi/guru", label: "Absensi Guru" },
    ],
  },
];

const PERIODE_NS = "absensi";
const CHIP_HINT = "otomatis ikut tanggal";

// Layout shell for the Absensi module. Provides AbsensiPeriodContext (Tahun
// Ajaran only). Only ONE surface is genuinely TA-keyed — Absensi Guru — so only
// the /guru route gets a switchable StripTahun. The date-driven daily surfaces
// (dashboard, Harian, Pelajaran) get a PASSIVE TahunChip instead: it makes the
// active year visible without a control that competes with the mark-present
// action (debate critic #1). Daily doctypes have no tahun_ajaran, so nothing is
// scoped/gated there.
function AbsensiLayout() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const roleLabel = useGenericRoleLabel();
  const { value, taOptions } = usePeriodeSwitcher(sekolah, PERIODE_NS);

  const taLabel = taOptions.find((o) => o.value === value.tahunAjaran)?.label ?? value.tahunAjaran;
  const onGuru = pathname.endsWith("/guru");

  const context = onGuru ? (
    <StripTahun
      moduleLabel="Absensi"
      taSwitch={{ value: value.tahunAjaran, options: taOptions, onChange: value.setTahunAjaran }}
      isPastPeriod={value.isPastPeriod}
      noActiveTa={value.noActiveTa}
      {...(roleLabel ? { roleLabel } : {})}
    />
  ) : taLabel ? (
    <TahunChip label={taLabel} hint={CHIP_HINT} {...(roleLabel ? { roleLabel } : {})} />
  ) : undefined;

  return (
    <AbsensiPeriodProvider value={value}>
      <ModuleShell navGroups={NAV_GROUPS} pathname={pathname} {...(context ? { context } : {})}>
        <Outlet />
      </ModuleShell>
    </AbsensiPeriodProvider>
  );
}

export const Route = createFileRoute("/sch/$sekolah/absensi")({ component: AbsensiLayout });
