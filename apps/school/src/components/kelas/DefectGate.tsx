/**
 * DefectGate — the non-dismissable "defects must hit 0" completion signal for
 * the Papan Kelas (audit graft from C4). Purely visual in v1 (no persisted
 * "year finalized" state): it tells the TU whether the class structure is
 * "siap" (zero defects) or how many items still need fixing.
 *
 * `defectCount` = rombel-tanpa-wali + over-capacity + orphan students
 * (see {@link totalDefects}). `penuh` is intentionally NOT a defect.
 */
import { Badge } from "@sekolahpro/ui";

export interface DefectGateProps {
  defectCount: number;
}

export function DefectGate({ defectCount }: DefectGateProps) {
  const ready = defectCount === 0;
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
        ready
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-amber-500/30 bg-amber-500/5"
      }`}
    >
      <Badge tone={ready ? "success" : "warning"} dot>
        {ready ? "Tahun siap" : `${defectCount} perlu dibereskan`}
      </Badge>
      <span className="text-sm text-muted-fg">
        {ready
          ? "Semua rombel punya wali, tidak ada over-kapasitas, tidak ada siswa belum berkelas."
          : "Bereskan semua tray sampai nol sebelum tahun ajaran dianggap siap."}
      </span>
    </div>
  );
}
