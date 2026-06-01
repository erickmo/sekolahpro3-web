/**
 * TerminalActivityLog — presentational recent-scan history list for the RFID
 * self-service terminal. Renders the chronological log of scan outcomes (info /
 * success / error) with timestamps.
 *
 * Layer: presentational. Owns no state; the route owns the log buffer (capped
 * at LOG_HISTORY_MAX) and passes it down as a prop.
 */
import { Badge } from "@sekolahpro/ui";

/** Locale used to render each log entry's timestamp. */
const TIME_LOCALE = "id-ID";

/** A single scan-log line: timestamp, severity kind, and message. */
export type LogEntry = {
  ts: number;
  kind: "info" | "success" | "error";
  message: string;
};

interface Props {
  log: LogEntry[];
}

/** Map a log entry kind to its Badge tone. */
function tone_for(kind: LogEntry["kind"]): "success" | "danger" | "neutral" {
  if (kind === "success") return "success";
  if (kind === "error") return "danger";
  return "neutral";
}

/**
 * Render the activity log card. Shows an empty-state hint when there are no
 * entries yet, otherwise the newest-first list.
 */
export function TerminalActivityLog({ log }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 text-sm font-medium text-fg">Log Aktivitas</div>
      {log.length === 0 ? (
        <div className="text-xs text-muted-fg">— belum ada aktivitas —</div>
      ) : (
        <ul className="space-y-1 text-xs">
          {log.map((l, i) => (
            <li key={i} className="flex items-center gap-2 font-mono">
              <span className="text-muted-fg">{new Date(l.ts).toLocaleTimeString(TIME_LOCALE)}</span>
              <Badge tone={tone_for(l.kind)} dot>
                {l.kind}
              </Badge>
              <span className="text-fg">{l.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
