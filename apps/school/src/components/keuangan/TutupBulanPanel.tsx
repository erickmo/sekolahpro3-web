/**
 * "Tutup Bulan" month-end close checklist (read-only).
 *
 * Presentational: renders the close sequence as an ordered checklist with a
 * derived status chip per step and a deep-link to the page that resolves it.
 * It performs NO posting/closing itself — each step routes to its existing page
 * where the real (guarded) action lives. This fixes the buried-period-close
 * weakness without introducing a new mutation surface.
 */
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SectionCard } from "@sekolahpro/ui";
import { scopedLinkProps } from "../../lib/scoped";

/** Status of a single close step. */
export type CloseStatus = "todo" | "warn" | "done";

/** One step in the month-end close checklist. */
export interface CloseStep {
  label: string;
  hint: string;
  /** Bare or scoped route to resolve this step. */
  to: string;
  status: CloseStatus;
  /** Short status caption (e.g. "3 belum diposting"). */
  statusLabel: string;
}

export interface TutupBulanPanelProps {
  steps: CloseStep[];
  sekolah: string;
}

const STATUS_CHIP: Record<CloseStatus, string> = {
  todo: "border-border bg-muted text-muted-fg",
  warn: "border-amber-300 bg-amber-50 text-amber-700",
  done: "border-emerald-300 bg-emerald-50 text-emerald-700",
};

function bareRoute(to: string): string {
  return to.replace("/sch/$sekolah", "").split("?")[0] ?? "";
}

/** Render the ordered close checklist. */
export function TutupBulanPanel({ steps, sekolah }: TutupBulanPanelProps): ReactNode {
  return (
    <SectionCard
      title="Tutup Bulan"
      description="Urutan tutup buku akhir bulan — kerjakan dari atas ke bawah"
      padded={false}
    >
      <ol className="divide-y divide-border">
        {steps.map((step, i) => (
          <li key={step.label}>
            <Link
              {...scopedLinkProps(sekolah, bareRoute(step.to))}
              className="flex items-center gap-3 px-5 py-3 hover:bg-muted/60 transition-colors"
            >
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold tabular-nums text-muted-fg">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-fg">{step.label}</div>
                <div className="truncate text-xs text-muted-fg">{step.hint}</div>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_CHIP[step.status]}`}>
                {step.statusLabel}
              </span>
              <span className="shrink-0 text-xs text-brand">Buka →</span>
            </Link>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}
