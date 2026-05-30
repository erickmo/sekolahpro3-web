import type { ReactNode } from "react";
import { cn } from "../lib/cn";

interface FieldProps {
  label: string;
  value?: ReactNode;
  icon?: ReactNode;
  hint?: string;
  className?: string;
}

export function InfoField({ label, value, icon, hint, className }: FieldProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-fg flex items-center gap-1.5">
        {icon ? <span className="h-3.5 w-3.5">{icon}</span> : null}
        {label}
      </div>
      <div className="mt-1 text-sm text-fg break-words">{value ?? <span className="text-muted-fg/60">—</span>}</div>
      {hint ? <div className="text-[11px] text-muted-fg mt-0.5">{hint}</div> : null}
    </div>
  );
}

interface GridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

const colsMap = {
  1: "grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
} as const;

export function InfoGrid({ children, cols = 3, className }: GridProps) {
  return (
    <div className={cn("grid gap-x-6 gap-y-5", colsMap[cols], className)}>
      {children}
    </div>
  );
}
