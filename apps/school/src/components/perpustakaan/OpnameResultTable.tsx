/**
 * OpnameResultTable — scrollable table of scanned eksemplar rows
 * (layer: presentational).
 *
 * Renders the "Hasil Scan" card: newest-first list of scanned items with
 * editable status / lokasi / catatan (read-only badge once submitted) plus a
 * remove action. All mutations are delegated to the callbacks the route passes
 * down from {@link useOpnameSession}.
 */
import { Badge, Input, SearchableSelect, SectionCard } from "@sekolahpro/ui";
import type { ScanRow } from "./useOpnameSession";

/** Per-row status options (matches the scan input bar). */
const STATUS_OPTIONS: { value: ScanRow["status_temuan"]; label: string }[] = [
  { value: "Hadir", label: "Hadir" },
  { value: "Hilang", label: "Hilang" },
  { value: "Rusak", label: "Rusak" },
];

/** Map a temuan status to its Badge tone for the read-only view. */
function statusTone(status: ScanRow["status_temuan"]): "success" | "danger" | "warning" {
  if (status === "Hadir") return "success";
  if (status === "Hilang") return "danger";
  return "warning";
}

interface RowProps {
  it: ScanRow;
  idx: number;
  isReadonly: boolean;
  onUpdateRow: (idx: number, patch: Partial<ScanRow>) => void;
  onRemoveRow: (idx: number) => void;
}

/** Render a single scanned-eksemplar table row. */
function OpnameResultRow({ it, idx, isReadonly, onUpdateRow, onRemoveRow }: RowProps) {
  return (
    <tr className="border-b border-border/50">
      <td className="px-2 py-1.5 text-xs text-muted-fg tabular-nums">{idx + 1}</td>
      <td className="px-2 py-1.5 font-mono text-xs">{it.eksemplar}</td>
      <td className="px-2 py-1.5">
        {isReadonly ? (
          <Badge tone={statusTone(it.status_temuan)} dot>
            {it.status_temuan}
          </Badge>
        ) : (
          <SearchableSelect
            value={it.status_temuan}
            onChange={(v) => onUpdateRow(idx, { status_temuan: v as ScanRow["status_temuan"] })}
            options={STATUS_OPTIONS}
          />
        )}
      </td>
      <td className="px-2 py-1.5">
        <Input
          value={it.lokasi_rak_aktual ?? ""}
          disabled={isReadonly}
          onChange={(e) => onUpdateRow(idx, { lokasi_rak_aktual: e.target.value })}
          placeholder="—"
        />
      </td>
      <td className="px-2 py-1.5">
        <Input
          value={it.catatan ?? ""}
          disabled={isReadonly}
          onChange={(e) => onUpdateRow(idx, { catatan: e.target.value })}
        />
      </td>
      <td className="px-2 py-1.5">
        {!isReadonly ? (
          <button type="button" onClick={() => onRemoveRow(idx)} className="text-xs text-rose-600 hover:underline">
            Hapus
          </button>
        ) : null}
      </td>
    </tr>
  );
}

interface Props {
  items: ScanRow[];
  isReadonly: boolean;
  saving: boolean;
  lastSaved: Date | null;
  onUpdateRow: (idx: number, patch: Partial<ScanRow>) => void;
  onRemoveRow: (idx: number) => void;
}

/** Save-state label shown in the card action slot. */
function savedLabel(saving: boolean, lastSaved: Date | null): string {
  if (saving) return "Menyimpan...";
  if (lastSaved) return `Tersimpan ${lastSaved.toLocaleTimeString("id-ID")}`;
  return "Belum tersimpan";
}

/**
 * Render the "Hasil Scan" card with an empty state or a sticky-header table.
 * Rows are displayed newest-first; the real index is recovered for callbacks.
 */
export function OpnameResultTable({
  items,
  isReadonly,
  saving,
  lastSaved,
  onUpdateRow,
  onRemoveRow,
}: Props) {
  return (
    <SectionCard
      title="Hasil Scan"
      description={`${items.length} eksemplar`}
      action={<span className="text-xs text-muted-fg">{savedLabel(saving, lastSaved)}</span>}
    >
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-fg">
          Belum ada scan. Mulai scan eksemplar di atas.
        </div>
      ) : (
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border text-left text-xs text-muted-fg">
                <th className="px-2 py-2 w-8">#</th>
                <th className="px-2 py-2">Eksemplar</th>
                <th className="px-2 py-2 w-32">Status</th>
                <th className="px-2 py-2 w-40">Lokasi Aktual</th>
                <th className="px-2 py-2">Catatan</th>
                <th className="px-2 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {[...items].reverse().map((it, revIdx) => {
                const idx = items.length - 1 - revIdx;
                return (
                  <OpnameResultRow
                    key={`${it.eksemplar}-${idx}`}
                    it={it}
                    idx={idx}
                    isReadonly={isReadonly}
                    onUpdateRow={onUpdateRow}
                    onRemoveRow={onRemoveRow}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
