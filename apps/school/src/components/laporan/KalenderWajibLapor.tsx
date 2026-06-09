/**
 * KalenderWajibLapor — a compact, glanceable strip of this month's reporting
 * deadlines (the Bulanan obligations), distinct from the hero's actionable list.
 * Each chip shows the due day + obligation, coloured by urgency.
 */
import { Badge, SectionCard } from "@sekolahpro/ui";
import { KEWAJIBAN_TU, computeDueState, type DueState } from "../../lib/laporan/kewajiban";

const STATE_TONE: Record<DueState, "danger" | "warning" | "neutral"> = {
  overdue: "danger",
  "due-soon": "warning",
  upcoming: "neutral",
};

export interface KalenderWajibLaporProps {
  /** Injectable for tests; defaults to today. */
  now?: Date;
}

export function KalenderWajibLapor({ now }: KalenderWajibLaporProps) {
  const ref = now ?? new Date();
  const monthly = KEWAJIBAN_TU.filter((k) => k.periode === "Bulanan")
    .map((k) => ({ k, ...computeDueState(k.periode, k.dueDay, ref) }))
    .sort((a, b) => a.k.dueDay - b.k.dueDay);

  if (monthly.length === 0) return null;

  return (
    <SectionCard title="Kalender Wajib Lapor" description="Tenggat pelaporan bulan ini.">
      <div className="flex flex-wrap gap-2">
        {monthly.map(({ k, state }) => (
          <span
            key={k.id}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg px-2.5 py-1.5 text-sm"
          >
            <Badge tone={STATE_TONE[state]}>Tgl {k.dueDay}</Badge>
            <span className="text-fg">{k.nama}</span>
          </span>
        ))}
      </div>
    </SectionCard>
  );
}
