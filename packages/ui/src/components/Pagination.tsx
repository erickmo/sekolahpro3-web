import { cn } from "../lib/cn";

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  const btn =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-border bg-bg px-2 text-sm hover:bg-muted disabled:opacity-40 disabled:pointer-events-none";

  const pages = (() => {
    const out: (number | "…")[] = [];
    const add = (n: number) => out.push(n);
    const win = 1;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - safePage) <= win) add(i);
      else if (out[out.length - 1] !== "…") out.push("…");
    }
    return out;
  })();

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-border", className)}>
      <div className="text-xs text-muted-fg tabular-nums">
        {from}-{to} dari {total.toLocaleString("id-ID")}
      </div>
      <div className="flex items-center gap-2">
        {onPageSizeChange ? (
          <label className="flex items-center gap-1.5 text-xs text-muted-fg">
            Per halaman
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-md border border-border bg-bg px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex items-center gap-1">
          <button type="button" className={btn} onClick={() => onPageChange(safePage - 1)} disabled={safePage <= 1}>‹</button>
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} className="px-1 text-muted-fg">…</span>
            ) : (
              <button
                key={p}
                type="button"
                className={cn(btn, p === safePage && "bg-brand text-white border-brand hover:bg-brand")}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            ),
          )}
          <button type="button" className={btn} onClick={() => onPageChange(safePage + 1)} disabled={safePage >= totalPages}>›</button>
        </div>
      </div>
    </div>
  );
}
