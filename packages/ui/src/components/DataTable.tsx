import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string | undefined;
  headerClassName?: string | undefined;
  width?: string | undefined;
  align?: "left" | "right" | "center" | undefined;
  sortable?: boolean | undefined;
}

export interface SortState {
  key: string;
  dir: "asc" | "desc";
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: ((row: T) => void) | undefined;
  empty?: ReactNode | undefined;
  className?: string | undefined;
  selectable?: boolean | undefined;
  selected?: Set<string> | undefined;
  onToggleRow?: ((key: string) => void) | undefined;
  onToggleAll?: (() => void) | undefined;
  sort?: SortState | undefined;
  onSortChange?: ((next: SortState) => void) | undefined;
  footer?: ReactNode | undefined;
}

const alignMap = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

export function DataTable<T>({
  data,
  columns,
  rowKey,
  onRowClick,
  empty,
  className,
  selectable,
  selected,
  onToggleRow,
  onToggleAll,
  sort,
  onSortChange,
  footer,
}: Props<T>) {
  const allSelected =
    selectable && data.length > 0 && selected && data.every((r) => selected.has(rowKey(r)));

  const handleSort = (key: string) => {
    if (!onSortChange) return;
    if (sort?.key === key) {
      onSortChange({ key, dir: sort.dir === "asc" ? "desc" : "asc" });
    } else {
      onSortChange({ key, dir: "asc" });
    }
  };

  return (
    <div className={cn("overflow-hidden", className)}>
     <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted-fg">
            {selectable ? (
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={!!allSelected}
                  onChange={onToggleAll}
                  className="rounded border-border"
                />
              </th>
            ) : null}
            {columns.map((c) => {
              const isSorted = sort?.key === c.key;
              const arrow = isSorted ? (sort.dir === "asc" ? "▲" : "▼") : "";
              return (
                <th
                  key={c.key}
                  className={cn(
                    "px-4 py-3 font-semibold",
                    c.align ? alignMap[c.align] : "text-left",
                    c.sortable && onSortChange ? "cursor-pointer select-none hover:text-fg" : "",
                    c.headerClassName,
                  )}
                  style={c.width ? { width: c.width } : undefined}
                  onClick={c.sortable && onSortChange ? () => handleSort(c.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {c.sortable ? (
                      <span className={cn("text-[10px]", isSorted ? "text-brand" : "text-muted-fg/50")}>
                        {arrow || "↕"}
                      </span>
                    ) : null}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-4 py-10 text-center text-muted-fg"
              >
                {empty ?? "Tidak ada data"}
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const key = rowKey(row);
              const isSel = selected?.has(key);
              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "transition-colors",
                    onRowClick ? "cursor-pointer hover:bg-muted/30" : "",
                    isSel ? "bg-brand/5" : "",
                  )}
                >
                  {selectable ? (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={!!isSel}
                        onChange={() => onToggleRow?.(key)}
                        className="rounded border-border"
                      />
                    </td>
                  ) : null}
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "px-4 py-3 align-middle",
                        c.align ? alignMap[c.align] : "",
                        c.className,
                      )}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      </div>
      {footer}
    </div>
  );
}
