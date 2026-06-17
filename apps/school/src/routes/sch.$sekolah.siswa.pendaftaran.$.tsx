import { createFileRoute } from "@tanstack/react-router";
import { workspaceStubBeforeLoad } from "../lib/legacyRedirects";

/** Splat stub: deep links like /siswa/pendaftaran/new or /siswa/pendaftaran/<id>
 * keep working after the move to /akademik/$ta/pendaftaran (Fase 2). */
export const Route = createFileRoute("/sch/$sekolah/siswa/pendaftaran/$")({
  beforeLoad: workspaceStubBeforeLoad("pendaftaran"),
});
