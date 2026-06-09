import { useRef } from "react";
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useResourceList } from "@sekolahpro/api-client";
import { ModuleShell } from "../components/shell/ModuleShell";
import { StripTahun } from "../components/shell/StripTahun";
import { useAkademikRole, ROLE_LABEL } from "../lib/akademikRole";
import { filterJadwalNav } from "../lib/jadwalNav";
import { resolveTahunAjaran, isPastPeriod, type TahunAjaranRow } from "../lib/akademikPeriode";

const TA_FIELDS = ["name", "nama", "is_current", "status", "tanggal_mulai", "tanggal_selesai"];
// Jadwal lists are not yet TA-scoped (a later phase), so the strip must say so
// to avoid implying the lists below are filtered to the shown year.
const STRIP_NOTE = "Daftar jadwal di bawah menampilkan semua tahun ajaran.";

// Layout shell for the Jadwal module. The sub-nav is filtered by the viewer's
// role (Tata Usaha sees the full builder, Guru/Kepala Sekolah see a slimmer set
// per the tournament design); an unknown role falls back to the full nav.
//
// A read-only StripTahun surfaces the school's active Tahun Ajaran so "salah
// tahun" is visible before any action — without forcing a choice or filtering
// the lists. Per-year scoping/switching is a later phase.
function JadwalLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { primary } = useAkademikRole();
  const navGroups = filterJadwalNav(primary);

  // refDate frozen per mount so status doesn't drift across re-renders.
  const refDate = useRef(new Date()).current;
  const taQ = useResourceList<TahunAjaranRow>("Tahun Ajaran", {
    fields: TA_FIELDS,
    order_by: "`tanggal_mulai` desc",
    limit_page_length: 0,
  });
  const taList = taQ.data ?? [];
  const resolved = resolveTahunAjaran(taList, { refDate });
  const row = taList.find((t) => t.name === resolved.ta);
  const taLabel = row?.nama ?? row?.name;
  const isPast = row ? isPastPeriod(row, refDate) : false;

  // While the TA list loads, fall back to the default bar (via `label`) so the
  // strip doesn't flash a misleading status.
  const strip = taQ.isLoading ? undefined : (
    <StripTahun
      moduleLabel="Jadwal"
      {...(taLabel ? { taLabel } : {})}
      isPastPeriod={isPast}
      noActiveTa={resolved.noActiveTa ?? false}
      roleLabel={ROLE_LABEL[primary]}
      note={STRIP_NOTE}
    />
  );

  return (
    <ModuleShell label="Jadwal" context={strip} navGroups={navGroups} pathname={pathname}>
      <Outlet />
    </ModuleShell>
  );
}

export const Route = createFileRoute("/sch/$sekolah/jadwal")({ component: JadwalLayout });
