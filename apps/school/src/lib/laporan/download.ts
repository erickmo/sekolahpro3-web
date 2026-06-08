/**
 * Save a base64 export payload (from generate() / laporan_dinas export) as a file.
 * The Report Center is the first web consumer of the report-generation APIs, so
 * this is the shared base64→file helper (mirrors the stub.ts downloadCsv pattern).
 */

/** Decode a base64 string to bytes and trigger a browser download. */
export function saveBase64File(contentB64: string, filename: string, mime: string): void {
  const bytes = Uint8Array.from(atob(contentB64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
