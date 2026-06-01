/**
 * OpnameScanInputBar — barcode/RFID scan input + default-status picker
 * (layer: presentational).
 *
 * Pure UI: the actual scan logic, dedupe guard and state live in
 * {@link useOpnameSession}. This card just wires the input + select to the
 * callbacks the route passes down. Only shown while the session is editable.
 */
import { Input, SearchableSelect, SectionCard } from "@sekolahpro/ui";
import type { ScanRow } from "./useOpnameSession";

/** Status options offered for the default-status dropdown. */
const STATUS_OPTIONS: { value: ScanRow["status_temuan"]; label: string }[] = [
  { value: "Hadir", label: "Hadir" },
  { value: "Hilang", label: "Hilang" },
  { value: "Rusak", label: "Rusak" },
];

interface Props {
  scanRef: React.RefObject<HTMLInputElement>;
  scanInput: string;
  onScanInputChange: (value: string) => void;
  onScan: (raw: string) => void;
  scanStatus: ScanRow["status_temuan"];
  onScanStatusChange: (value: ScanRow["status_temuan"]) => void;
}

/**
 * Render the "Scan Eksemplar" card: a wide barcode input (Enter submits) and a
 * narrow default-status select applied to each new scan.
 */
export function OpnameScanInputBar({
  scanRef,
  scanInput,
  onScanInputChange,
  onScan,
  scanStatus,
  onScanStatusChange,
}: Props) {
  return (
    <SectionCard
      title="Scan Eksemplar"
      description="Tempatkan kursor di input lalu scan barcode / RFID. Status default dapat diubah di kanan."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="scan" className="mb-1 block text-xs text-muted-fg">Kode Eksemplar</label>
          <Input
            id="scan"
            ref={scanRef}
            autoFocus
            value={scanInput}
            onChange={(e) => onScanInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onScan(scanInput);
              }
            }}
            placeholder="Scan atau ketik kode eksemplar lalu Enter"
            className="text-lg tabular-nums"
          />
        </div>
        <div>
          <label htmlFor="scan-status" className="mb-1 block text-xs text-muted-fg">Status Default</label>
          <SearchableSelect
            id="scan-status"
            value={scanStatus}
            onChange={(v) => onScanStatusChange(v as ScanRow["status_temuan"])}
            className="min-w-[140px]"
            options={STATUS_OPTIONS}
          />
        </div>
      </div>
    </SectionCard>
  );
}
