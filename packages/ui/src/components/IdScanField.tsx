import { useRef, useState } from "react";
import { Button } from "../primitives/button";

const MAX_DIM = 1600;
const JPEG_QUALITY = 0.8;

export type JenisDokumen = "KTP" | "KK" | "SIM";

export interface IdScanFieldProps {
  jenis: JenisDokumen;
  /** Upload blob + run OCR. Injected per app (each app's api client). */
  onScan: (blob: Blob, jenis: JenisDokumen) => Promise<Record<string, unknown>>;
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
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(bitmap as unknown as CanvasImageSource, 0, 0, canvas.width, canvas.height);
  }
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b ?? new Blob()), "image/jpeg", JPEG_QUALITY),
  );
}

/**
 * ID document scanner: consent gate → capture (camera/file) → OCR via injected
 * onScan → review parsed fields → apply to host form via onApply. API-agnostic.
 */
export function IdScanField({ jenis, onScan, onApply }: IdScanFieldProps) {
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState<Record<string, unknown> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const blob = await downscale(file);
      setFields(await onScan(blob, jenis));
    } finally {
      setBusy(false);
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
        <Button
          type="button"
          disabled={!consent || busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? "Memindai…" : `Pilih file ${jenis}`}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!consent || busy}
          onClick={() => fileRef.current?.click()}
        >
          Foto {jenis}
        </Button>
      </div>
      <input
        ref={fileRef}
        data-testid="id-scan-file"
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      {fields !== null && (
        <div className="space-y-2 rounded bg-slate-50 p-2 text-sm">
          <ul className="space-y-1">
            {Object.entries(fields)
              .filter(([k]) => k !== "anggota")
              .map(([k, v]) => (
                <li key={k}>
                  <span className="text-slate-500">{k}:</span> {String(v)}
                </li>
              ))}
          </ul>
          <Button type="button" onClick={() => onApply(fields)}>
            Terapkan ke formulir
          </Button>
        </div>
      )}
    </div>
  );
}
