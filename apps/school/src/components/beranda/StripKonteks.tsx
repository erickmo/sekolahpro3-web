/**
 * "Konteks" — the demoted KPI strip of the role-adaptive Beranda.
 *
 * The old KPI wall, now a context footnote. Pure presentational. Rendered only
 * for oversight personas (kepala expanded, bendahara expanded, tu_operator
 * collapsed); teaching personas hide it entirely (handled by <BerandaView>).
 */
import type { ReactNode } from "react";
import { StatCard } from "@sekolahpro/ui";
import type { KonteksMetric } from "../../lib/beranda/scope";
import type { KonteksMode } from "../../lib/berandaLayout";

export interface StripKonteksProps {
  metrics: KonteksMetric[];
  mode: KonteksMode;
}

export function StripKonteks({ metrics, mode }: StripKonteksProps): ReactNode {
  if (mode === "hidden" || metrics.length === 0) return null;

  if (mode === "collapsed") {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-muted/30 px-4 py-2 text-xs text-muted-fg">
        {metrics.map((m) => (
          <span key={m.label}>
            <span className="font-medium text-fg">{m.value}</span> {m.label.toLowerCase()}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
      {metrics.map((m) => (
        <StatCard key={m.label} label={m.label} value={m.value} {...(m.hint ? { hint: m.hint } : {})} />
      ))}
    </div>
  );
}
