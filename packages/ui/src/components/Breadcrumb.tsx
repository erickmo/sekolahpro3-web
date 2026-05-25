import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface CrumbItem {
  label: string;
  render?: (props: { className: string; children: ReactNode }) => ReactNode;
}

interface Props {
  items: CrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: Props) {
  return (
    <nav className={cn("flex items-center gap-1.5 text-xs text-muted-fg", className)}>
      {items.map((it, i) => {
        const isLast = i === items.length - 1;
        const cls = cn(
          "transition-colors",
          isLast ? "text-fg font-medium" : "hover:text-fg",
        );
        return (
          <span key={i} className="flex items-center gap-1.5">
            {it.render && !isLast ? (
              it.render({ className: cls, children: it.label })
            ) : (
              <span className={cls}>{it.label}</span>
            )}
            {!isLast ? <span className="text-muted-fg/50">/</span> : null}
          </span>
        );
      })}
    </nav>
  );
}
