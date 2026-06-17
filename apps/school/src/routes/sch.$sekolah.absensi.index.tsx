import { createFileRoute } from "@tanstack/react-router";
import { workspaceStubBeforeLoad } from "../lib/legacyRedirects";

/** Permanent redirect stub — Absensi moved under /akademik/$ta/absensi (Fase 2
 * single-door). Routes through the hub so the running Tahun Ajaran is resolved
 * before landing. */
export const Route = createFileRoute("/sch/$sekolah/absensi/")({
  beforeLoad: workspaceStubBeforeLoad("absensi"),
});
