/** Public (guest) ID-OCR client for the PPDB wizard. Requires a Turnstile token. */
import { apiCall } from "./api-client";

export type JenisDokumen = "KTP" | "KK" | "SIM";

export interface ScanResult {
  scan_id: string;
  jenis: string;
  confidence: number;
  fields: Record<string, unknown>;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Upload an ID image + run backend OCR via the guest endpoint (rate-limited + Turnstile). */
export async function scanIdentitasPublik(
  blob: Blob,
  jenis: JenisDokumen,
  turnstileToken: string,
  sekolah?: string,
): Promise<ScanResult> {
  const filedata = await blobToBase64(blob);
  return apiCall<ScanResult>("POST", "sekolahpro.ocr.api.scan_identitas_publik", {
    turnstile_token: turnstileToken,
    jenis,
    filename: `${jenis.toLowerCase()}.jpg`,
    filedata,
    mime_type: blob.type || "image/jpeg",
    sekolah,
  });
}
