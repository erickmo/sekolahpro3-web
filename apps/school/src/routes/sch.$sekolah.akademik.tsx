import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Akademik module shell — thin pass-through (period-first IA).
 *
 * The index route (sch.$sekolah.akademik.index.tsx) is the Tahun Ajaran hub; each
 * TA opens its own workspace under `$ta` (sch.$sekolah.akademik.$ta.tsx) which owns
 * the ModuleShell + period context. This layout only renders the Outlet so the hub
 * stays chrome-free and the workspace supplies its own header.
 */
function AkademikLayout() {
  return <Outlet />;
}

export const Route = createFileRoute("/sch/$sekolah/akademik")({
  component: AkademikLayout,
});
