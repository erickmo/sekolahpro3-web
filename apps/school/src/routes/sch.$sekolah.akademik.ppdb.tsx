import { useMemo, useRef } from "react";
import { createFileRoute, Outlet, useParams, useRouterState } from "@tanstack/react-router";
import { useResourceList } from "@sekolahpro/api-client";
import { ModuleShell } from "../components/shell/ModuleShell";
import { AkademikNav } from "../components/akademik/AkademikNav";
import { useGenericRoleLabel } from "../lib/genericRole";
import { readStoredPeriode, type TahunAjaranRow } from "../lib/akademikPeriode";
import { resolveNavTa } from "../lib/akademikNav";

// Minimal TA fields needed to resolve the nav TA (continuity + past-period check).
const TA_NAV_FIELDS = ["name", "is_current", "status", "tanggal_mulai", "tanggal_selesai"];

// PPDB module layout: role-framed ModuleShell chrome wrapping the route outlet.
// PPDB is NOT period-scoped, but the unified Akademik nav has `$ta`-scoped items.
// Resolve a real TA so those links target a live workspace instead of all
// collapsing to the hub picker: prefer the last-opened (still-writable) period,
// else the running TA, else "" (AkademikNav then falls back to the hub).
function PpdbLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const taQ = useResourceList<TahunAjaranRow>("Tahun Ajaran", {
    fields: TA_NAV_FIELDS,
    limit_page_length: 0,
  });
  const refDate = useRef(new Date()).current;
  const ta = useMemo(
    () => resolveNavTa(readStoredPeriode(sekolah).ta, taQ.data ?? [], refDate),
    [sekolah, taQ.data, refDate],
  );
  return (
    <ModuleShell
      label="PPDB"
      framing="Kelola penerimaan peserta didik baru dari pendaftaran sampai daftar ulang."
      roleLabel={useGenericRoleLabel()}
      navSlot={<AkademikNav sekolah={sekolah} ta={ta} pathname={pathname} />}
      pathname={pathname}
    >
      <Outlet />
    </ModuleShell>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/ppdb")({ component: PpdbLayout });
