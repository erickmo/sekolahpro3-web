/**
 * Save a base64 export payload (from generate() / laporan_dinas export) as a file.
 * The Report Center is the first web consumer of the report-generation APIs, so
 * this is the shared base64→file helper (mirrors the stub.ts downloadCsv pattern).
 */

/** Decode a base64 string to bytes. */
export function base64ToBytes(contentB64: string): Uint8Array {
  return Uint8Array.from(atob(contentB64), (c) => c.charCodeAt(0));
}

/** Trigger a browser download of raw bytes. */
export function saveBlob(bytes: Uint8Array, filename: string, mime: string): void {
  const blob = new Blob([bytes as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Decode a base64 string to bytes and trigger a browser download. */
export function saveBase64File(contentB64: string, filename: string, mime: string): void {
  saveBlob(base64ToBytes(contentB64), filename, mime);
}
