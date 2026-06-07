/**
 * Meja Persetujuan Kelas — the Kepala Sekolah surface of the role-sliced Kelas
 * module (rendered by the /kelas index when the primary role is `kepsek`).
 *
 * STUB (Phase 1): renders the shared Papan Kelas board so the headmaster keeps a
 * working surface with no regression. Phase 2 replaces the body with the
 * two-pane approval desk (destructive-only Mutasi queue + Kartu Tinjau +
 * Dampak Struktur guardrails + Sertifikat Kepatuhan strip).
 */
import { Badge } from "@sekolahpro/ui";
import { PapanKelas } from "./PapanKelas";

export function MejaPersetujuanKelas() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge tone="neutral">Meja Persetujuan — segera</Badge>
        <span className="text-xs text-muted-fg">
          Antrean persetujuan Kepala Sekolah sedang disiapkan.
        </span>
      </div>
      <PapanKelas />
    </div>
  );
}
