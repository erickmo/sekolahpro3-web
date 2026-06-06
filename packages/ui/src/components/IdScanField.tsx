import { useRef, useState } from "react";
import { Button } from "../primitives/button";

const MAX_DIM = 1600;
const JPEG_QUALITY = 0.8;

export type JenisDokumen = "KTP" | "KK" | "SIM";

export interface ScanOutcome {
  fields: Record<string, unknown>;
  confidence?: number; // 0-100
}

export interface IdScanFieldProps {
  jenis: JenisDokumen;
  /** Upload blob + run OCR. Injected per app (each app's api client). */
  onScan: (blob: Blob, jenis: JenisDokumen) => Promise<ScanOutcome>;
  /** Receive reviewed fields to map into host form. */
  onApply: (fields: Record<string, unknown>) => void;
}

/** Downscale image File to JPEG Blob under MAX_DIM (preserves aspect ratio). */
async function downscale(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  // FIX M1: fail loudly on null canvas context
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung di peramban ini");
  ctx.drawImage(bitmap as unknown as CanvasImageSource, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b ?? new Blob()), "image/jpeg", JPEG_QUALITY),
  );
}

/**
 * ID document scanner: consent gate → capture (camera/file) → OCR via injected
 * onScan → review parsed fields → apply to host form via onApply. API-agnostic.
 */
const CONFIDENCE_HIGH = 80;
const CONFIDENCE_MID = 60;

function confidenceBadgeClass(confidence: number): string {
  if (confidence >= CONFIDENCE_HIGH) return "bg-green-100 text-green-800";
  if (confidence >= CONFIDENCE_MID) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export function IdScanField({ jenis, onScan, onApply }: IdScanFieldProps) {
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  // FIX I1: error state to surface scan failures
  const [scanError, setScanError] = useState<string | null>(null);
  // FIX C1: separate refs for file-picker and camera inputs
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    // FIX M2: capture input reference before any await so reset works even after yield
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    setBusy(true);
    // FIX I1: clear previous error on new scan attempt
    setScanError(null);
    try {
      const blob = await downscale(file);
      setOutcome(await onScan(blob, jenis));
    } catch (err) {
      // FIX I1: surface error to user
      setScanError(err instanceof Error ? err.message : "Gagal memindai dokumen");
    } finally {
      setBusy(false);
      // FIX M2: reset so selecting the same file again re-fires onChange
      input.value = "";
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 p-3">
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>Saya setuju dokumen identitas dipindai untuk mengisi formulir ini.</span>
      </label>
      <div className="flex gap-2">
        {/* FIX C1: file-picker button triggers fileRef (no capture) */}
        <Button
          type="button"
          disabled={!consent || busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? "Memindai…" : `📁 Pilih file ${jenis}`}
        </Button>
        {/* FIX C1: camera button triggers cameraRef (capture="environment") */}
        <Button
          type="button"
          variant="outline"
          disabled={!consent || busy}
          onClick={() => cameraRef.current?.click()}
        >
          📷 Foto {jenis}
        </Button>
      </div>
      {/* FIX C1: file-picker input — no capture, keeps data-testid="id-scan-file" */}
      <input
        ref={fileRef}
        data-testid="id-scan-file"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      {/* FIX C1: camera input — capture="environment", new data-testid */}
      <input
        ref={cameraRef}
        data-testid="id-scan-camera"
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      {/* FIX I1: render scan error */}
      {scanError && <p className="text-sm text-red-600">{scanError}</p>}
      {outcome !== null && (
        <div className="space-y-2 rounded bg-slate-50 p-2 text-sm">
          {outcome.confidence !== undefined && (
            <span
              className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${confidenceBadgeClass(outcome.confidence)}`}
            >
              Keyakinan OCR: {Math.round(outcome.confidence)}%
            </span>
          )}
          <ul className="space-y-1">
            {Object.entries(outcome.fields)
              .filter(([k]) => k !== "anggota")
              .map(([k, v]) => (
                <li key={k}>
                  <span className="text-slate-500">{k}:</span> {String(v)}
                </li>
              ))}
          </ul>
          <Button type="button" onClick={() => onApply(outcome.fields)}>
            Terapkan ke formulir
          </Button>
        </div>
      )}
    </div>
  );
}
