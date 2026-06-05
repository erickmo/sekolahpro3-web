// ocrApi — school-app HTTP client for the backend ID-OCR endpoint.
//
// Layer: Infrastructure (external service call; no domain logic here).
// Delegates to sekolahpro.ocr.api.scan_identitas via the shared frappeFetch
// helper so auth cookies and CSRF tokens are handled automatically.
import { frappeFetch } from "@sekolahpro/api-client";

/** Supported identity-document types for OCR scanning. */
export type JenisDokumen = "KTP" | "KK" | "SIM";

/** Shape of the unwrapped response from the backend OCR endpoint. */
export interface ScanResult {
  scan_id: string;
  jenis: string;
  confidence: number;
  fields: Record<string, unknown>;
}

/**
 * Read a Blob as a raw base64 string (no `data:` prefix).
 * Used internally to serialise the image for JSON transport.
 *
 * Uses FileReader so this works in both real browsers and jsdom (which does not
 * implement Blob.prototype.arrayBuffer). Strips the leading `data:*;base64,`
 * prefix that readAsDataURL produces.
 *
 * @param blob - Image blob from camera/file input.
 * @returns Base64-encoded string of the blob bytes.
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Strip the "data:<mime>;base64," prefix to get the raw base64.
      const base64 = dataUrl.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Upload an identity-document image and run backend OCR.
 *
 * Encodes the blob to base64 then POSTs to the whitelisted Frappe method
 * `sekolahpro.ocr.api.scan_identitas`. The backend persists a Scan Identitas
 * doc and returns the parsed field dict.
 *
 * @param blob     - Image blob (JPEG / PNG).
 * @param jenis    - Document type: "KTP" | "KK" | "SIM".
 * @param sekolah  - Optional sekolah doc name for scoping (omit for SaaS/admin context).
 * @returns Parsed ScanResult with `fields` dict ready for form mapping.
 */
export async function scanIdentitas(
  blob: Blob,
  jenis: JenisDokumen,
  sekolah?: string,
): Promise<ScanResult> {
  const filedata = await blobToBase64(blob);
  return frappeFetch<ScanResult>("sekolahpro.ocr.api.scan_identitas", {
    jenis,
    filename: `${jenis.toLowerCase()}.jpg`,
    filedata,
    mime_type: blob.type || "image/jpeg",
    sekolah,
  });
}
