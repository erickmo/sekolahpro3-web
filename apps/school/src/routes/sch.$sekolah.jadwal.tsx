import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { ModuleShell } from "../components/shell/ModuleShell";
import { useAkademikRole } from "../lib/akademikRole";
import { filterJadwalNav } from "../lib/jadwalNav";

// Layout shell for the Jadwal module. The sub-nav is filtered by the viewer's
// role (Tata Usaha sees the full builder, Guru/Kepala Sekolah see a slimmer set
// per the tournament design); an unknown role falls back to the full nav.
function JadwalLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { primary } = useAkademikRole();
  const navGroups = filterJadwalNav(primary);
  return (
    <ModuleShell label="Jadwal" navGroups={navGroups} pathname={pathname}>
      <Outlet />
    </ModuleShell>
  );
}

export const Route = createFileRoute("/sch/$sekolah/jadwal")({ component: JadwalLayout });
