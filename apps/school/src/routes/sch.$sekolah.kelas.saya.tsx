/**
 * Kelasku — the Wali Kelas cockpit route (/kelas/saya). The /kelas index
 * redirects a homeroom teacher here.
 *
 * STUB (Phase 1): renders the shared Papan Kelas board so the wali keeps a
 * working surface with no regression. Phase 3 replaces the body with the
 * self-routing "Kelasku" people-cards cockpit (today's presence strip,
 * at-risk shortlist, seat-ordered roster, Catatan Wali quick-notes).
 */
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@sekolahpro/ui";
import { PapanKelas } from "../components/kelas/PapanKelas";

function KelaskuPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge tone="neutral">Kelasku — segera</Badge>
        <span className="text-xs text-muted-fg">Cockpit wali kelas sedang disiapkan.</span>
      </div>
      <PapanKelas />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/kelas/saya")({
  component: KelaskuPage,
});
