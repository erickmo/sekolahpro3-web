import { createFileRoute, Outlet, useParams, useRouterState } from "@tanstack/react-router";
import { ModuleShell } from "../components/shell/ModuleShell";
import { StripTahun } from "../components/shell/StripTahun";
import { TahunChip } from "../components/shell/TahunChip";
import { AkademikNav } from "../components/akademik/AkademikNav";
import { useGenericRoleLabel } from "../lib/genericRole";
import { useAkademikContext } from "../lib/akademikContext";
import { AbsensiPeriodProvider } from "../lib/absensiPeriode";

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
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
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
      <ModuleShell navSlot={<AkademikNav sekolah={sekolah} ta={akademik.tahunAjaran} pathname={pathname} />} pathname={pathname} {...(context ? { context } : {})}>
        <Outlet />
      </ModuleShell>
    </AbsensiPeriodProvider>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/$ta/absensi")({ component: AbsensiLayout });
