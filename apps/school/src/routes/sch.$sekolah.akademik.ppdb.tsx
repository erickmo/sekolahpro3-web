import { createFileRoute, Outlet, useParams, useRouterState } from "@tanstack/react-router";
import { ModuleShell } from "../components/shell/ModuleShell";
import { AkademikNav } from "../components/akademik/AkademikNav";
import { useGenericRoleLabel } from "../lib/genericRole";
import { readStoredPeriode } from "../lib/akademikPeriode";

// PPDB module layout: role-framed ModuleShell chrome wrapping the route outlet.
// PPDB is NOT period-scoped, but the unified Akademik nav has `$ta`-scoped items;
// resolve a TA from the last-opened periode so those links target a real workspace
// (AkademikNav falls back to the hub picker when none is stored).
function PpdbLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const ta = readStoredPeriode(sekolah).ta ?? "";
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
