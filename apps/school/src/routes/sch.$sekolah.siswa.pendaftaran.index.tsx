import { createFileRoute } from "@tanstack/react-router";
import { workspaceStubBeforeLoad } from "../lib/legacyRedirects";

/** Permanent redirect stub — Pendaftaran Siswa moved to
 * /akademik/$ta/pendaftaran (Fase 2 single-door). Routes through the hub so the
 * running Tahun Ajaran is resolved before landing. */
export const Route = createFileRoute("/sch/$sekolah/siswa/pendaftaran/")({
  beforeLoad: workspaceStubBeforeLoad("pendaftaran"),
});
