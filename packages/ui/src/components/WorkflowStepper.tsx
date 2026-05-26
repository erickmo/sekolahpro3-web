import { cn } from "../lib/cn";

export type WorkflowStepStatus = "done" | "current" | "pending" | "rejected";

export interface WorkflowStep {
  key: string;
  label: string;
  status: WorkflowStepStatus;
  hint?: string;
}

interface Props {
  steps: WorkflowStep[];
  className?: string;
}

const dotClass: Record<WorkflowStepStatus, string> = {
  done: "bg-emerald-500 text-white",
  current: "bg-amber-500 text-white ring-4 ring-amber-500/20 animate-pulse",
  pending: "bg-muted text-muted-fg border border-border",
  rejected: "bg-danger text-white",
};

const lineClass: Record<WorkflowStepStatus, string> = {
  done: "bg-emerald-500",
  current: "bg-gradient-to-r from-emerald-500 to-muted",
  pending: "bg-muted",
  rejected: "bg-danger",
};

const labelClass: Record<WorkflowStepStatus, string> = {
  done: "text-fg",
  current: "text-fg font-semibold",
  pending: "text-muted-fg",
  rejected: "text-danger font-semibold",
};

function glyph(status: WorkflowStepStatus, idx: number): string {
  if (status === "done") return "✓";
  if (status === "rejected") return "✕";
  return String(idx + 1);
}

export function WorkflowStepper({ steps, className }: Props) {
  return (
    <ol className={cn("flex w-full items-start gap-0", className)} aria-label="Status workflow">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        return (
          <li key={step.key} className={cn("flex flex-col items-center", isLast ? "" : "flex-1")}>
            <div className="flex w-full items-center">
              <div
                className={cn(
                  "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  dotClass[step.status],
                )}
              >
                {glyph(step.status, idx)}
              </div>
              {!isLast ? <div className={cn("h-0.5 flex-1", lineClass[step.status])} /> : null}
            </div>
            <div className="mt-2 px-2 text-center">
              <div className={cn("text-xs", labelClass[step.status])}>{step.label}</div>
              {step.hint ? <div className="mt-0.5 text-[10px] text-muted-fg">{step.hint}</div> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
