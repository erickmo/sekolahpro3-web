import { createFileRoute } from "@tanstack/react-router";
import { hubGoStubBeforeLoad } from "../lib/legacyRedirects";

/** Permanent redirect stub — Anggota Rombel now lives at
 * /akademik/$ta/kelas/anggota (Fase 2 single-door); the old /siswa/rombel page
 * was a duplicate of that surface. Routes through the hub so the running Tahun
 * Ajaran is resolved before landing. */
export const Route = createFileRoute("/sch/$sekolah/siswa/rombel")({
  beforeLoad: hubGoStubBeforeLoad("kelas/anggota"),
});
