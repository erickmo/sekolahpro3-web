/**
 * The 5-stage money-flow pipeline ribbon on the hub landing.
 *
 * Presentational: each stage card shows one live KPI + a "waiting" badge count
 * and deep-links to that stage's first page. The stage matching the user's
 * primary role is visually elevated. Counts come from already-loaded live hooks
 * (passed in) — the ribbon never fetches.
 */
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { scopedLinkProps } from "../../lib/scoped";

/** One stage card's data. */
export interface RibbonStage {
  key: string;
  label: string;
  /** Scoped or bare route; the literal prefix is stripped before linking. */
  to: string;
  /** Pre-formatted KPI value (e.g. "Rp 12.000.000" or "8"). */
  kpi: string;
  /** Caption under the KPI. */
  kpiLabel: string;
  /** Items waiting in this stage (shown as a badge when > 0). */
  count: number;
  /** Highlight this stage (user's primary role). */
  emphasized?: boolean;
}

export interface PipelineRibbonProps {
  stages: RibbonStage[];
  sekolah: string;
}

function bareRoute(to: string): string {
  return to.replace("/sch/$sekolah", "").split("?")[0] ?? "";
}

/** Render the horizontal pipeline of stage cards. */
export function PipelineRibbon({ stages, sekolah }: PipelineRibbonProps): ReactNode {
  return (
    <nav aria-label="Alur uang" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stages.map((s, i) => (
        <Link
          key={s.key}
          {...scopedLinkProps(sekolah, bareRoute(s.to))}
          className={`relative flex flex-col gap-1 rounded-lg border p-3 transition-colors hover:bg-muted/60 ${
            s.emphasized ? "border-brand ring-1 ring-brand bg-brand/5" : "border-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-fg">
              {i + 1}. {s.label}
            </span>
            {s.count > 0 ? (
              <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white tabular-nums">
                {s.count}
              </span>
            ) : null}
          </div>
          <span className="truncate text-sm font-semibold text-fg tabular-nums">{s.kpi}</span>
          <span className="truncate text-[11px] text-muted-fg">{s.kpiLabel}</span>
        </Link>
      ))}
    </nav>
  );
}
