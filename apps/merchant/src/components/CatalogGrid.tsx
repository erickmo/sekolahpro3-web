import type { CatalogItem } from "../lib/merchant-api";

interface Props {
  items: CatalogItem[];
  kategoriFilter: string;
  onKategoriChange: (k: string) => void;
  onAdd: (item: CatalogItem) => void;
}

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-medium transition ${
        active
          ? "bg-brand text-white"
          : "border border-border bg-bg text-muted-fg hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );
}

export function CatalogGrid({ items, kategoriFilter, onKategoriChange, onAdd }: Props) {
  const kategoriList = Array.from(new Set(items.map((i) => i.kategori_item)));
  const filtered = kategoriFilter === "ALL"
    ? items
    : items.filter((i) => i.kategori_item === kategoriFilter);
  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip active={kategoriFilter === "ALL"} label="Semua" onClick={() => onKategoriChange("ALL")} />
        {kategoriList.map((k) => (
          <Chip key={k} active={kategoriFilter === k} label={k} onClick={() => onKategoriChange(k)} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {filtered.map((it) => {
          const outOfStock = it.track_stok && (it.stok_qty ?? 0) <= 0;
          return (
            <button
              key={it.name}
              disabled={outOfStock}
              aria-label={it.nama}
              onClick={() => onAdd(it)}
              className="flex min-h-24 flex-col justify-between rounded-xl border border-border bg-bg p-3 text-left shadow-sm transition hover:border-brand hover:shadow active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
            >
              <div className="line-clamp-2 font-medium text-fg">{it.nama}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-base font-semibold tabular-nums text-brand">
                  {formatRp(it.harga)}
                </span>
                {outOfStock && (
                  <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                    Habis
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
