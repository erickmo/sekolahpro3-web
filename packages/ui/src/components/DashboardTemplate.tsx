import type { ReactNode } from "react";
import { cn } from "../lib/cn";

interface Props {
  header: ReactNode;
  stats?: ReactNode;
  primary?: ReactNode;
  side?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function DashboardTemplate({
  header,
  stats,
  primary,
  side,
  footer,
  className,
}: Props) {
  return (
    <div className={cn("space-y-6", className)}>
      {header}
      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats}</div>
      ) : null}
      {(primary || side) && (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 space-y-6">{primary}</div>
          <div className="space-y-6">{side}</div>
        </div>
      )}
      {footer}
    </div>
  );
}
