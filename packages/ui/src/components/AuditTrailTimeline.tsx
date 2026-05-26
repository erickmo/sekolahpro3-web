import { useState } from "react";
import { cn } from "../lib/cn";

export type AuditTone = "neutral" | "brand" | "success" | "warning" | "danger";

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  tone?: AuditTone;
  comment?: string;
  /** Restricted info shown only when showRestricted=true (e.g., IP, role). */
  meta?: string;
}

interface Props {
  entries: AuditEntry[];
  /** Show restricted meta (IP, role). True for Kepsek/BK roles. */
  showRestricted?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

const dotMap: Record<AuditTone, string> = {
  neutral: "bg-muted-fg/40",
  brand: "bg-brand",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-danger",
};

export function AuditTrailTimeline({
  entries,
  showRestricted = false,
  defaultOpen = false,
  className,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  if (entries.length === 0) {
    return (
      <div className={cn("text-sm text-muted-fg", className)}>Belum ada riwayat aktivitas.</div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-fg hover:bg-muted/60"
      >
        <span className="font-medium">
          Audit Trail <span className="text-muted-fg">({entries.length})</span>
        </span>
        <span aria-hidden className="text-xs text-muted-fg">
          {open ? "▲ Sembunyikan" : "▼ Tampilkan"}
        </span>
      </button>
      {open ? (
        <ol className="mt-3 space-y-3 border-l border-border pl-4">
          {entries.map((e) => {
            const tone: AuditTone = e.tone ?? "neutral";
            return (
              <li key={e.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-bg",
                    dotMap[tone],
                  )}
                  aria-hidden
                />
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-fg">{e.actor}</span>
                  <span className="text-xs text-muted-fg">{e.timestamp}</span>
                </div>
                <div className="text-sm text-fg/90">{e.action}</div>
                {e.comment ? (
                  <div className="mt-1 rounded-md bg-muted/40 px-2 py-1 text-xs text-fg/80">
                    {e.comment}
                  </div>
                ) : null}
                {showRestricted && e.meta ? (
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-fg">
                    {e.meta}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}
