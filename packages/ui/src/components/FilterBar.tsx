import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { IconSearch } from "../icons";

export interface SelectFilter {
  key: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (next: string) => void;
}

interface Props {
  search?: {
    value: string;
    placeholder?: string;
    onChange: (v: string) => void;
  };
  filters?: SelectFilter[];
  actions?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}

export function FilterBar({ search, filters, actions, trailing, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border border-border bg-bg p-3 shadow-sm",
        className,
      )}
    >
      {search ? (
        <div className="relative flex-1 min-w-[220px]">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-fg">
            <IconSearch />
          </span>
          <input
            type="search"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder ?? "Cari..."}
            className="h-9 w-full rounded-md border border-border bg-bg pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
      ) : null}

      {filters?.map((f) => (
        <label key={f.key} className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-fg">{f.label}</span>
          <select
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="h-9 rounded-md border border-border bg-bg px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          >
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}

      {trailing}
      {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
