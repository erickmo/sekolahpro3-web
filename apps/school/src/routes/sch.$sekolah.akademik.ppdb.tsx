import { useMemo, useRef } from "react";
import { createFileRoute, Outlet, useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { useResourceList } from "@sekolahpro/api-client";
import { type SearchableOption } from "@sekolahpro/ui";
import { ModuleShell } from "../components/shell/ModuleShell";
import { StripTahun } from "../components/shell/StripTahun";
import { AkademikNav } from "../components/akademik/AkademikNav";
import { useGenericRoleLabel } from "../lib/genericRole";
import { readStoredPeriode, type TahunAjaranRow } from "../lib/akademikPeriode";
import { resolveNavTa } from "../lib/akademikNav";

// `nama` is fetched for friendly switcher labels; the rest resolve the nav TA
// (continuity + past-period check).
const TA_NAV_FIELDS = ["name", "nama", "is_current", "status", "tanggal_mulai", "tanggal_selesai"];

// PPDB is not period-scoped, so its TA control is a "jump into a workspace" picker,
// not an in-place scope switch — choosing a Tahun Ajaran opens that year's Akademik
// dashboard. The note says so.
const PPDB_TA_NOTE =
  "PPDB tidak terikat satu Tahun Ajaran. Pilih Tahun Ajaran untuk membuka ruang kerja Akademik tahun tersebut.";

// PPDB module layout: ModuleShell chrome wrapping the route outlet. PPDB is NOT
// period-scoped, but the unified Akademik nav has `$ta`-scoped items, so we resolve
// a real TA (prefer the last-opened still-writable period, else the running TA, else
// "") to keep those links pointed at a live workspace instead of the hub picker.
function PpdbLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const navigate = useNavigate();
  const roleLabel = useGenericRoleLabel();
  const taQ = useResourceList<TahunAjaranRow>("Tahun Ajaran", {
    fields: TA_NAV_FIELDS,
    limit_page_length: 0,
  });
  const taList = useMemo(() => taQ.data ?? [], [taQ.data]);
  const refDate = useRef(new Date()).current;
  const ta = useMemo(
    () => resolveNavTa(readStoredPeriode(sekolah).ta, taList, refDate),
    [sekolah, taList, refDate],
  );

  // Every Tahun Ajaran is an option to jump into (value = raw `name`; the router
  // encodes the path segment once). Picking one opens that year's workspace root.
  const taOptions = useMemo<SearchableOption[]>(
    () => taList.map((t) => ({ value: t.name, label: t.nama ?? t.name })),
    [taList],
  );
  const taSwitch = taOptions.length
    ? {
        value: ta,
        options: taOptions,
        onChange: (v: string) =>
          navigate({ to: "/sch/$sekolah/akademik/$ta", params: { sekolah, ta: v } }),
      }
    : undefined;

  return (
    <ModuleShell
      navSlot={<AkademikNav sekolah={sekolah} ta={ta} pathname={pathname} />}
      pathname={pathname}
      context={
        <StripTahun
          moduleLabel="PPDB"
          {...(taSwitch ? { taSwitch } : {})}
          isPastPeriod={false}
          noActiveTa={taOptions.length === 0}
          {...(roleLabel ? { roleLabel } : {})}
          note={PPDB_TA_NOTE}
        />
      }
    >
      <Outlet />
    </ModuleShell>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/ppdb")({ component: PpdbLayout });
