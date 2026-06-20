import { createFileRoute, Outlet, useParams, useRouterState } from "@tanstack/react-router";
import { ModuleShell } from "../components/shell/ModuleShell";
import { StripTahun } from "../components/shell/StripTahun";
import { AkademikNav } from "../components/akademik/AkademikNav";
import { useGenericRoleLabel } from "../lib/genericRole";
import { useAkademikContext } from "../lib/akademikContext";
import { buildTaSwitch } from "../lib/akademikTaSwitch";
import { AbsensiPeriodProvider } from "../lib/absensiPeriode";

// Daily attendance (Harian/Pelajaran) is date-driven — its doctypes carry no
// tahun_ajaran — so the TA there only scopes the roster/archive; the note says so.
const DAILY_NOTE =
  "Absensi harian mengikuti tanggal; Tahun Ajaran di sini hanya menentukan konteks roster & arsip.";

// Layout shell for Absensi, now a sub-module inside the per-Tahun-Ajaran Akademik
// workspace (Fase 2 single-door). The Tahun Ajaran is fixed by the route `$ta` and
// passes through the akademik context to AbsensiPeriodProvider, so Absensi Guru
// still scopes its list and gates creation in an archived year. Every surface now
// carries an in-place TA switcher (buildTaSwitch) so the user can change year
// without leaving Absensi; the daily surfaces add a note that they are date-driven.
function AbsensiLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const roleLabel = useGenericRoleLabel();
  const akademik = useAkademikContext();
  const taSwitch = buildTaSwitch(akademik);
  const onGuru = pathname.endsWith("/guru");

  const context = (
    <StripTahun
      moduleLabel="Absensi"
      {...(taSwitch ? { taSwitch } : { taLabel: akademik.tahunAjaran })}
      isPastPeriod={akademik.isPastPeriod}
      noActiveTa={akademik.noActiveTa}
      {...(roleLabel ? { roleLabel } : {})}
      {...(onGuru ? {} : { note: DAILY_NOTE })}
    />
  );

  return (
    <AbsensiPeriodProvider value={akademik}>
      <ModuleShell navSlot={<AkademikNav sekolah={sekolah} ta={akademik.tahunAjaran} pathname={pathname} />} pathname={pathname} context={context}>
        <Outlet />
      </ModuleShell>
    </AbsensiPeriodProvider>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/$ta/absensi")({ component: AbsensiLayout });
