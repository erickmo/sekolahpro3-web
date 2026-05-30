import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface TabItem {
  key: string;
  label: string;
  icon?: ReactNode | undefined;
  count?: number | string | undefined;
  active?: boolean | undefined;
  render: (props: { className: string; children: ReactNode }) => ReactNode;
}

interface Props {
  items: TabItem[];
  className?: string;
}

export function Tabs({ items, className }: Props) {
  return (
    <div className={cn("border-b border-border", className)}>
      <nav className="flex items-center gap-1 overflow-x-auto -mb-px">
        {items.map((it) => {
          const cls = cn(
            "inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
            it.active
              ? "border-brand text-brand font-semibold bg-brand/10 rounded-t-md"
              : "border-transparent text-muted-fg hover:text-fg hover:border-border",
          );
          return it.render({
            className: cls,
            children: (
              <>
                {it.icon ? (
                  <span className="h-4 w-4 shrink-0">{it.icon}</span>
                ) : null}
                <span>{it.label}</span>
                {it.count !== undefined ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      it.active ? "bg-brand/15 text-brand" : "bg-muted text-muted-fg",
                    )}
                  >
                    {it.count}
                  </span>
                ) : null}
              </>
            ),
          });
        })}
      </nav>
    </div>
  );
}
