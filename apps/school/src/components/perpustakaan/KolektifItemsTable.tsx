/**
 * KolektifItemsTable — scanned-eksemplar list for a class collective loan.
 *
 * Layer: presentational. Renders the bulk-add textarea (paste newline/comma
 * codes) and the resulting items table. Holds no resolution logic: the parent
 * owns the bulk-input value, runs the async validation, and removes rows. This
 * component only renders and forwards intent via callbacks.
 */
import { Button, Textarea } from "@sekolahpro/ui";
import type { ItemRow } from "./kolektifCompute";

/** Visible rows in the bulk-paste textarea. */
const BULK_INPUT_ROWS = 3;
/** Em-dash placeholder for empty cells. */
const EMPTY_CELL = "—";
/** Example codes shown as the textarea placeholder. */
const BULK_PLACEHOLDER = "INV-001\nINV-002\nINV-003";

interface Props {
  items: ReadonlyArray<ItemRow>;
  isReadonly: boolean;
  bulkInput: string;
  bulkBusy: boolean;
  onBulkInputChange: (value: string) => void;
  onBulkAdd: () => void;
  onRemove: (idx: number) => void;
}

/**
 * Render the bulk-add control plus the scanned items table. Both the textarea
 * and the per-row "Hapus" action are hidden when the loan is read-only.
 */
export function KolektifItemsTable({
  items,
  isReadonly,
  bulkInput,
  bulkBusy,
  onBulkInputChange,
  onBulkAdd,
  onRemove,
}: Props) {
  return (
    <>
      {!isReadonly ? (
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <Textarea
            value={bulkInput}
            onChange={(e) => onBulkInputChange(e.target.value)}
            rows={BULK_INPUT_ROWS}
            placeholder={BULK_PLACEHOLDER}
            className="flex-1 font-mono text-xs"
          />
          <Button onClick={onBulkAdd} disabled={bulkBusy || !bulkInput.trim()}>
            {bulkBusy ? "Validasi..." : "Tambahkan"}
          </Button>
        </div>
      ) : null}
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-fg">
          Belum ada eksemplar.
        </div>
      ) : (
        <div className="max-h-[320px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border text-left text-xs text-muted-fg">
                <th className="px-2 py-2 w-8">#</th>
                <th className="px-2 py-2">Eksemplar</th>
                <th className="px-2 py-2">Nomor Inventaris</th>
                <th className="px-2 py-2">Judul / Buku</th>
                <th className="px-2 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={`${it.eksemplar}-${idx}`} className="border-b border-border/50">
                  <td className="px-2 py-1.5 text-xs text-muted-fg tabular-nums">{idx + 1}</td>
                  <td className="px-2 py-1.5 font-mono text-xs">{it.eksemplar}</td>
                  <td className="px-2 py-1.5 font-mono text-xs">{it.nomor_inventaris ?? EMPTY_CELL}</td>
                  <td className="px-2 py-1.5">{it.judul_buku ?? EMPTY_CELL}</td>
                  <td className="px-2 py-1.5">
                    {!isReadonly ? (
                      <button type="button" onClick={() => onRemove(idx)} className="text-xs text-rose-600 hover:underline">
                        Hapus
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
