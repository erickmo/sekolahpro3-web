import type { ReactNode } from "react";
import { Skeleton } from "@sekolahpro/ui";

/**
 * One actionable tile in the supervisor "Tugas Hari Ini" worklist.
 *
 * Shows a derived count, a plain-language hint, and a CTA that links to the
 * screen that clears the task. Has an explicit loading skeleton and a calm
 * zero-state so an empty queue reads as "nothing to do" — never a dead number.
 */

export type WorklistTone = "neutral" | "critical" | "warning" | "success";

const TONE_RING: Record<WorklistTone, string> = {
  neutral: "border-border",
  critical: "border-rose-500/40 bg-rose-500/5",
  warning: "border-amber-500/40 bg-amber-500/5",
  success: "border-emerald-500/30",
};

const TONE_TEXT: Record<WorklistTone, string> = {
  neutral: "text-fg",
  critical: "text-rose-600",
  warning: "text-amber-600",
  success: "text-emerald-600",
};

export interface WorklistCardProps {
  title: string;
  /** Pre-formatted count (e.g. capLabel output). */
  value: number | string;
  /** Whether the count represents something needing action (drives tone/empty copy). */
  attention: boolean;
  hint?: string;
  /** Tone applied only when attention is true. */
  tone?: WorklistTone;
  loading?: boolean;
  isError?: boolean;
  zeroLabel?: string;
  icon?: ReactNode;
  /** CTA, typically a router Link. */
  action?: ReactNode;
}

export function WorklistCard(props: WorklistCardProps) {
  const {
    title,
    value,
    attention,
    hint,
    tone = "neutral",
    loading,
    isError,
    zeroLabel = "Tidak ada yang perlu ditindak",
    icon,
    action,
  } = props;

  const ring = attention ? TONE_RING[tone] : TONE_RING.neutral;

  return (
    <div className={`flex flex-col rounded-lg border p-4 ${ring}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-medium text-fg">{title}</div>
        {icon ? <span className="h-4 w-4 shrink-0 text-muted-fg">{icon}</span> : null}
      </div>

      {loading ? (
        <Skeleton className="mt-2 h-8 w-16" aria-label={`Memuat ${title}`} />
      ) : isError ? (
        <div className="mt-2 text-sm text-danger">Gagal memuat</div>
      ) : (
        <div className={`mt-1 text-2xl font-bold tabular-nums ${attention ? TONE_TEXT[tone] : "text-muted-fg"}`}>
          {value}
        </div>
      )}

      <div className="mt-1 flex-1 text-xs text-muted-fg">
        {loading || isError ? null : attention ? hint : zeroLabel}
      </div>

      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
