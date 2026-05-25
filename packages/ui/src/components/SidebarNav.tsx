import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface SidebarNavItem {
  label: string;
  icon?: ReactNode;
  active?: boolean;
  badge?: string | number | undefined;
  render: (props: {
    className: string;
    children: ReactNode;
  }) => ReactNode;
}

export interface SidebarNavSection {
  title?: string;
  items: SidebarNavItem[];
}

interface Props {
  sections: SidebarNavSection[];
  footer?: ReactNode;
}

export function SidebarNav({ sections, footer }: Props) {
  return (
    <nav className="flex h-full flex-col px-3">
      <div className="flex-1 space-y-6">
        {sections.map((s, i) => (
          <div key={i}>
            {s.title ? (
              <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
                {s.title}
              </div>
            ) : null}
            <ul className="space-y-0.5">
              {s.items.map((it, j) => {
                const className = cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  it.active
                    ? "bg-brand/10 text-brand"
                    : "text-fg/70 hover:bg-muted hover:text-fg",
                );
                return (
                  <li key={j}>
                    {it.render({
                      className,
                      children: (
                        <>
                          {it.icon ? (
                            <span
                              className={cn(
                                "shrink-0 h-4 w-4",
                                it.active ? "text-brand" : "text-muted-fg group-hover:text-fg",
                              )}
                            >
                              {it.icon}
                            </span>
                          ) : null}
                          <span className="flex-1 truncate">{it.label}</span>
                          {it.badge !== undefined ? (
                            <span className="rounded-full bg-brand/15 text-brand text-[10px] font-semibold px-1.5 py-0.5">
                              {it.badge}
                            </span>
                          ) : null}
                        </>
                      ),
                    })}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {footer ? <div className="mt-4 border-t border-border pt-4">{footer}</div> : null}
    </nav>
  );
}
