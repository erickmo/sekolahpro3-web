import type { CatalogItem } from "../lib/merchant-api";

interface Props {
  items: CatalogItem[];
  kategoriFilter: string;
  onKategoriChange: (k: string) => void;
  onAdd: (item: CatalogItem) => void;
}

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export function CatalogGrid({ items, kategoriFilter, onKategoriChange, onAdd }: Props) {
  const kategoriList = Array.from(new Set(items.map((i) => i.kategori_item)));
  const filtered = kategoriFilter === "ALL"
    ? items
    : items.filter((i) => i.kategori_item === kategoriFilter);
  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex gap-2 overflow-x-auto">
        <button className={kategoriFilter === "ALL" ? "font-bold" : ""} onClick={() => onKategoriChange("ALL")}>Semua</button>
        {kategoriList.map((k) => (
          <button key={k} className={kategoriFilter === k ? "font-bold" : ""} onClick={() => onKategoriChange(k)}>{k}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {filtered.map((it) => {
          const outOfStock = it.track_stok && (it.stok_qty ?? 0) <= 0;
          return (
            <button
              key={it.name}
              disabled={outOfStock}
              aria-label={it.nama}
              onClick={() => onAdd(it)}
              className="rounded-lg border p-3 text-left disabled:opacity-50"
            >
              <div className="font-medium">{it.nama}</div>
              <div className="text-sm tabular-nums">{formatRp(it.harga)}</div>
              {outOfStock && <div className="text-xs text-red-600">Stok habis</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
