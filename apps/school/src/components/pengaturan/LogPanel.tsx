/**
 * LogPanel — the "Log Konfigurasi" tab of the Pengaturan page.
 *
 * Pure view extracted verbatim from the old god-file route (LogTab). Renders the
 * configuration-change audit trail as an avatar list inside a SectionCard.
 *
 * UI strings are Bahasa Indonesia; code comments are English (house rule).
 */
import { Avatar, Badge, IconClock, SectionCard } from "@sekolahpro/ui";
import type { LogEntry } from "../../data/pengaturan";

/** Props for {@link LogPanel}. */
export interface LogPanelProps {
  /** Configuration-change audit entries, newest first. */
  list: LogEntry[];
}

/**
 * The "Log Konfigurasi" tab: a read-only list of recent config changes.
 *
 * @param props see {@link LogPanelProps}.
 * @returns the configuration-log panel.
 */
export function LogPanel({ list }: LogPanelProps) {
  return (
    <SectionCard title="Riwayat Perubahan Konfigurasi" description={`${list.length} perubahan terakhir`} padded={false}>
      <ul className="divide-y divide-border">
        {list.map((a, i) => (
          <li key={i} className="flex items-start gap-3 px-5 py-3">
            <Avatar name={a.aktor} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-sm text-fg"><span className="font-medium">{a.aktor}</span> <span className="text-muted-fg">{a.aksi}</span></div>
              <div className="text-xs text-muted-fg mt-0.5 inline-flex items-center gap-1">
                <span className="h-3 w-3"><IconClock /></span>{a.waktu}
              </div>
            </div>
            <Badge tone={a.tone} dot>·</Badge>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
