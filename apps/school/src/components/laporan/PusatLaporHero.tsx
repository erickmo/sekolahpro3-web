/**
 * PusatLaporHero — the deadline-first hero of the Report Center (winner C4).
 * Shows the TU's reporting obligations (Kewajiban) sorted by urgency: overdue
 * shout at the top, then due-soon, then upcoming. Each obligation lists its
 * member reports with a run-channel badge (so a "Buka di Desk" report is never
 * a silent dead end). "Susun" hands off to the packet assembler (Phase 2).
 */
import { SectionCard, Badge, Button } from "@sekolahpro/ui";
import {
  sortKewajibanByUrgency,
  KEWAJIBAN_TU,
  type DueState,
} from "../../lib/laporan/kewajiban";
import { resolveChannel, type ReportChannel } from "../../lib/laporan/reportChannel";

const STATE_TONE: Record<DueState, "danger" | "warning" | "neutral"> = {
  overdue: "danger",
  "due-soon": "warning",
  upcoming: "neutral",
};
const STATE_LABEL: Record<DueState, string> = {
  overdue: "Terlambat",
  "due-soon": "Jatuh tempo",
  upcoming: "Mendatang",
};
const CHANNEL_LABEL: Record<ReportChannel, string> = {
  dinas: "Dinas",
  engine: "Engine",
  desk: "Buka di Desk",
};
const CHANNEL_TONE: Record<ReportChannel, "success" | "brand" | "neutral"> = {
  dinas: "success",
  engine: "brand",
  desk: "neutral",
};

export interface PusatLaporHeroProps {
  /** Injectable for tests; defaults to today. */
  now?: Date;
  /** Hand off to the packet assembler (Phase 2). */
  onSusun?: (kewajibanId: string) => void;
}

export function PusatLaporHero({ now, onSusun }: PusatLaporHeroProps) {
  const ref = now ?? new Date();
  const items = sortKewajibanByUrgency(KEWAJIBAN_TU, ref);
  const overdueCount = items.filter((i) => i.state === "overdue").length;

  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          <span>Kewajiban Lapor</span>
          {overdueCount > 0 ? (
            <Badge tone="danger">{overdueCount} terlambat</Badge>
          ) : (
            <Badge tone="success">Tidak ada yang terlambat</Badge>
          )}
        </span>
      }
      description="Obligasi pelaporan Anda, urut paling mendesak."
    >
      <ul className="space-y-2">
        {items.map(({ kewajiban, dueDate, state }) => (
          <li
            key={kewajiban.id}
            className="rounded-lg border border-border bg-bg px-4 py-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-fg">{kewajiban.nama}</span>
                  <Badge tone="neutral">{kewajiban.target}</Badge>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-fg">
                  <Badge tone={STATE_TONE[state]}>{STATE_LABEL[state]}</Badge>
                  {dueDate ? <span>jatuh tempo {dueDate}</span> : <span>{kewajiban.periode}</span>}
                </div>
              </div>
              <Button size="sm" onClick={() => onSusun?.(kewajiban.id)}>
                Susun
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {kewajiban.paket.map((ref2) => {
                const ch = resolveChannel(ref2.reportName);
                return (
                  <span key={ref2.reportName} className="inline-flex items-center gap-1">
                    <span className="text-xs text-muted-fg">{ref2.reportName}</span>
                    <Badge tone={CHANNEL_TONE[ch]}>{CHANNEL_LABEL[ch]}</Badge>
                  </span>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
