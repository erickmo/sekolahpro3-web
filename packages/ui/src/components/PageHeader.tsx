import type { ReactNode } from "react";
import { cn } from "../lib/cn";

interface Props {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, eyebrow, actions, className }: Props) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <div className="text-xs font-semibold uppercase tracking-wider text-brand mb-1">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-fg">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-fg mt-1">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex gap-2 shrink-0">{actions}</div> : null}
    </div>
  );
}
