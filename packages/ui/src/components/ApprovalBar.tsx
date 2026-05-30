import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Button } from "../primitives/button";

interface Props {
  /** Label aksi approve, e.g. "Setujui sebagai Ka-TU" */
  approveLabel: string;
  rejectLabel?: string;
  /** Disabled when user role does not match required approver level. */
  canApprove: boolean;
  /** Why approve is blocked (shown when canApprove=false). */
  blockReason?: string | undefined;
  onApprove: () => void;
  onReject: () => void;
  pending?: boolean;
  /** Optional left-side hint or secondary content. */
  hint?: ReactNode;
  className?: string;
}

export function ApprovalBar({
  approveLabel,
  rejectLabel = "Tolak",
  canApprove,
  blockReason,
  onApprove,
  onReject,
  pending = false,
  hint,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 -mx-6 mt-6 flex items-center gap-3 border-t border-border bg-bg/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-bg/80",
        className,
      )}
      role="region"
      aria-label="Aksi persetujuan"
    >
      <div className="min-w-0 flex-1 text-xs text-muted-fg">
        {hint}
        {!canApprove && blockReason ? (
          <div className="mt-0.5 text-amber-600">{blockReason}</div>
        ) : null}
      </div>
      <Button variant="outline" onClick={onReject} disabled={pending}>
        {rejectLabel}
      </Button>
      <Button
        onClick={onApprove}
        disabled={!canApprove || pending}
        title={!canApprove ? blockReason : undefined}
      >
        {pending ? "Memproses…" : approveLabel}
      </Button>
    </div>
  );
}
