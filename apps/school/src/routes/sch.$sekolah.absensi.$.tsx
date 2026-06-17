import { createFileRoute } from "@tanstack/react-router";
import { workspaceStubBeforeLoad } from "../lib/legacyRedirects";

/** Splat stub: deep links like /absensi/guru or /absensi/daftar keep working
 * after the move to /akademik/$ta/absensi (Fase 2). */
export const Route = createFileRoute("/sch/$sekolah/absensi/$")({
  beforeLoad: workspaceStubBeforeLoad("absensi"),
});
