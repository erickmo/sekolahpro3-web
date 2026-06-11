/**
 * Kelas module index — a THIN role switch (edited once; persona phases add
 * components, never re-touch this file). Renders a different surface per the
 * session's primary kelas role:
 *   kepsek     → Meja Persetujuan (approval desk)
 *   wali_kelas → redirect to the Kelasku cockpit (/saya)
 *   tu (else)  → Papan Kelas (TU structure board, the permissive default)
 *
 * The decision is driven entirely by the tested {@link useKelasRole}; all
 * data-fetching and rendering live in the surface components.
 */
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { useKelasRole } from "../lib/kelasRole";
import { PapanKelas } from "../components/kelas/PapanKelas";
import { MejaPersetujuanKelas } from "../components/kelas/MejaPersetujuanKelas";

function KelasIndexPage() {
  const { sekolah, ta } = useParams({ from: "/sch/$sekolah/akademik/$ta/kelas" });
  const { primary } = useKelasRole();

  if (primary === "kepsek") return <MejaPersetujuanKelas />;
  if (primary === "wali_kelas") {
    return <Navigate to="/sch/$sekolah/akademik/$ta/kelas/saya" params={{ sekolah, ta }} />;
  }
  return <PapanKelas />;
}

export const Route = createFileRoute("/sch/$sekolah/akademik/$ta/kelas/")({
  component: KelasIndexPage,
});
