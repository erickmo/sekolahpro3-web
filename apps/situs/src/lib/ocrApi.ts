/** Public (guest) ID-OCR client for the situs PPDB form. Requires a Turnstile token. */
import { frappeFetch } from "@sekolahpro/api-client";
import { ensureConfigured } from "./api";

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
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function scanIdentitasPublik(
  blob: Blob,
  jenis: JenisDokumen,
  turnstileToken: string,
  sekolah?: string,
): Promise<ScanResult> {
  ensureConfigured();
  const filedata = await blobToBase64(blob);
  return frappeFetch<ScanResult>("sekolahpro.ocr.api.scan_identitas_publik", {
    turnstile_token: turnstileToken,
    jenis,
    filename: `${jenis.toLowerCase()}.jpg`,
    filedata,
    mime_type: blob.type || "image/jpeg",
    sekolah,
  });
}
