/**
 * "Saat Ini Penting" — a conditional fiscal-deadline strip on the hub.
 *
 * Presentational: takes pre-computed {@link Deadline}s (see lib/keuanganCalendar)
 * and renders an urgency-coloured row of deep-link chips. COLLAPSES to nothing
 * when there is nothing due, so it never adds noise on a quiet day.
 */
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { scopedLinkProps } from "../../lib/scoped";
import type { Deadline, DeadlineSeverity } from "../../lib/keuanganCalendar";

export interface DeadlineStripProps {
  deadlines: Deadline[];
  sekolah: string;
  /** Only show deadlines within this many days (others are not yet pressing). */
  withinDays?: number;
}

const SEVERITY_CHIP: Record<DeadlineSeverity, string> = {
  red: "border-rose-300 bg-rose-50 text-rose-700",
  amber: "border-amber-300 bg-amber-50 text-amber-700",
  emerald: "border-emerald-300 bg-emerald-50 text-emerald-700",
};

const DEFAULT_WITHIN_DAYS = 14;

function bareRoute(to: string): string {
  return to.replace("/sch/$sekolah", "").split("?")[0] ?? "";
}

/** Countdown copy for a deadline. */
function countdown(daysLeft: number): string {
  if (daysLeft < 0) return `telat ${-daysLeft} hari`;
  if (daysLeft === 0) return "hari ini";
  return `H-${daysLeft}`;
}

/** Render the deadline strip, or nothing when nothing is pressing. */
export function DeadlineStrip({ deadlines, sekolah, withinDays = DEFAULT_WITHIN_DAYS }: DeadlineStripProps): ReactNode {
  const pressing = deadlines.filter((d) => d.daysLeft <= withinDays);
  if (pressing.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
      <span className="text-xs font-semibold text-muted-fg">Saat Ini Penting:</span>
      {pressing.map((d) => (
        <Link
          key={d.id}
          {...scopedLinkProps(sekolah, bareRoute(d.to))}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80 ${SEVERITY_CHIP[d.severity]}`}
        >
          <span className="truncate">{d.title}</span>
          <span className="font-bold tabular-nums">{countdown(d.daysLeft)}</span>
        </Link>
      ))}
    </div>
  );
}
