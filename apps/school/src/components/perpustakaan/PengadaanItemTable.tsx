/**
 * Editable child-table for Pengadaan Buku line items (god-file split).
 *
 * Layer: presentational + local book-lookup I/O. Renders the "Item Pengadaan"
 * card: add/remove rows, per-row book search, quantity/price/prefix editing, and
 * the totals footer. State is owned by usePengadaanSubmit; this component calls
 * setItem/addItem/removeItem. Book search RPC (`searchBuku`) is the only I/O and
 * was moved verbatim from the former route.
 */
import {
  Button,
  IconPlus,
  Input,
  SearchableSelect,
  SectionCard,
  type SearchableOption,
} from "@sekolahpro/ui";
import { listResource } from "@sekolahpro/api-client";
import { perpFormatRupiah } from "./perpFormatters";
import type { ItemRow } from "./usePengadaanSubmit";
import type { computePengadaanTotals } from "./pengadaanCompute";

/** Frappe doctype searched for the book autocomplete. */
const BUKU_DOCTYPE = "Buku";
/** Max suggestions returned by the book search. */
const SEARCH_PAGE_LENGTH = 20;
/** Locale used for thousands separators in the totals row. */
const ID_LOCALE = "id-ID";

/** Search Buku by name or judul for the row autocomplete. */
async function searchBuku(q: string): Promise<SearchableOption[]> {
  const filters = q
    ? { or_filters: [["name", "like", `%${q}%`], ["judul", "like", `%${q}%`]] as [string, string, unknown][] }
    : {};
  const rows = await listResource<{ name: string; judul?: string }>(BUKU_DOCTYPE, {
    fields: ["name", "judul"],
    ...filters,
    limit_page_length: SEARCH_PAGE_LENGTH,
    order_by: "modified desc",
  });
  return rows.map((r) => {
    const opt: SearchableOption = { value: r.name, label: r.judul ?? r.name };
    if (r.judul) opt.hint = r.name;
    return opt;
  });
}

interface RowProps {
  it: ItemRow;
  idx: number;
  isReadonly: boolean;
  rowCount: number;
  setItem: (idx: number, patch: Partial<ItemRow>) => void;
  removeItem: (idx: number) => void;
}

/** Resolve a book's label by its name, caching it onto the row state. */
function makeResolveLabel(idx: number, setItem: RowProps["setItem"]) {
  return async (v: string) => {
    try {
      const rows = await listResource<{ name: string; judul?: string }>(BUKU_DOCTYPE, {
        fields: ["name", "judul"],
        filters: { name: v },
        limit_page_length: 1,
      });
      const lbl = rows[0]?.judul ?? v;
      setItem(idx, { buku_label: lbl });
      return lbl;
    } catch {
      return v;
    }
  };
}

/** One editable acquisition line (book / qty / price / subtotal / prefix). */
function ItemTableRow({ it, idx, isReadonly, rowCount, setItem, removeItem }: RowProps) {
  const subtotal = (Number(it.jumlah_eksemplar) || 0) * (Number(it.harga_satuan) || 0);
  return (
    <tr className="border-b border-border/50">
      <td className="px-2 py-2 text-xs text-muted-fg tabular-nums">{idx + 1}</td>
      <td className="px-2 py-2">
        <SearchableSelect
          value={it.buku}
          onChange={(v) => setItem(idx, { buku: v })}
          loadOptions={searchBuku}
          resolveLabel={makeResolveLabel(idx, setItem)}
          placeholder="Cari judul buku…"
          disabled={isReadonly}
        />
      </td>
      <td className="px-2 py-2">
        <Input
          type="number"
          min={1}
          value={String(it.jumlah_eksemplar)}
          disabled={isReadonly}
          onChange={(e) => setItem(idx, { jumlah_eksemplar: Number(e.target.value) })}
          className="text-right tabular-nums"
        />
      </td>
      <td className="px-2 py-2">
        <Input
          type="number"
          min={0}
          value={String(it.harga_satuan)}
          disabled={isReadonly}
          onChange={(e) => setItem(idx, { harga_satuan: Number(e.target.value) })}
          className="text-right tabular-nums"
        />
      </td>
      <td className="px-2 py-2 text-right tabular-nums text-fg">{perpFormatRupiah(subtotal)}</td>
      <td className="px-2 py-2">
        <Input
          value={it.prefix_inventaris ?? ""}
          disabled={isReadonly}
          placeholder="INV-2026"
          onChange={(e) => setItem(idx, { prefix_inventaris: e.target.value })}
        />
      </td>
      <td className="px-2 py-2">
        {!isReadonly ? (
          <button
            type="button"
            onClick={() => removeItem(idx)}
            className="text-xs text-rose-600 hover:underline"
            disabled={rowCount <= 1}
          >
            Hapus
          </button>
        ) : null}
      </td>
    </tr>
  );
}

interface Props {
  items: ItemRow[];
  isReadonly: boolean;
  totals: ReturnType<typeof computePengadaanTotals>;
  setItem: (idx: number, patch: Partial<ItemRow>) => void;
  addItem: () => void;
  removeItem: (idx: number) => void;
}

/**
 * Renders the acquisition line-item table with an add-row action and a totals
 * footer. Each row generates N eksemplar on Submit.
 */
export function PengadaanItemTable({ items, isReadonly, totals, setItem, addItem, removeItem }: Props) {
  return (
    <SectionCard
      title="Item Pengadaan"
      description="Setiap baris akan generate N eksemplar saat Submit."
      action={
        !isReadonly ? (
          <Button variant="outline" onClick={addItem}>
            <IconPlus className="mr-1 h-4 w-4 shrink-0" />
            Tambah Baris
          </Button>
        ) : undefined
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-fg">
              <th className="px-2 py-2 w-8">#</th>
              <th className="px-2 py-2 min-w-[220px]">Buku</th>
              <th className="px-2 py-2 w-24 text-right">Jumlah</th>
              <th className="px-2 py-2 w-36 text-right">Harga Satuan</th>
              <th className="px-2 py-2 w-36 text-right">Subtotal</th>
              <th className="px-2 py-2 w-32">Prefix Inv.</th>
              <th className="px-2 py-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <ItemTableRow
                key={idx}
                it={it}
                idx={idx}
                isReadonly={isReadonly}
                rowCount={items.length}
                setItem={setItem}
                removeItem={removeItem}
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-muted/30">
              <td className="px-2 py-2"></td>
              <td className="px-2 py-2 text-right text-xs text-muted-fg" colSpan={2}>
                Total
              </td>
              <td className="px-2 py-2 text-right tabular-nums font-medium">
                {totals.totalEksemplar.toLocaleString(ID_LOCALE)} eks.
              </td>
              <td className="px-2 py-2 text-right tabular-nums font-medium" colSpan={3}>
                {perpFormatRupiah(totals.totalBiaya)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </SectionCard>
  );
}
