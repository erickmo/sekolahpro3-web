/**
 * BeritaAcaraPhotoCapture — incident-photo capture for BA Kerusakan Buku.
 *
 * Layer: presentational component (perpustakaan domain). Owns the file pick,
 * client-side downscale (toBlob guard), upload-to-Frappe call, and the
 * preview / clear markup. Parent owns the persisted `foto` URL + error sink.
 */
import { useState } from "react";

/** Above this size the photo is downscaled before upload. */
const MAX_FOTO_BYTES = 1024 * 1024;
/** JPEG quality used when re-encoding oversized incident photos. */
const FOTO_JPEG_QUALITY = 0.8;

async function uploadFoto(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("is_private", "0");
  fd.append("folder", "Home/Attachments");
  const res = await fetch("/api/method/upload_file", { method: "POST", body: fd, credentials: "include" });
  if (!res.ok) throw new Error(`Upload gagal (${res.status})`);
  const json = (await res.json()) as { message?: { file_url?: string } };
  const url = json?.message?.file_url;
  if (!url) throw new Error("Upload gagal: respons tidak valid.");
  return url;
}

async function compressImage(file: File): Promise<File> {
  if (file.size <= MAX_FOTO_BYTES) return file;
  const bitmap = await createImageBitmap(file);
  const ratio = Math.sqrt(MAX_FOTO_BYTES / file.size);
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  // toBlob may yield null (e.g. canvas too large); fall back to the original
  // file rather than uploading a corrupt empty blob. PERP-GAP-21
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", FOTO_JPEG_QUALITY));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
}

interface Props {
  /** Persisted file URL of the uploaded photo, or empty when none. */
  foto: string;
  /** When true (BA submitted) the input/clear controls are hidden. */
  is_readonly: boolean;
  /** When true the field shows a required asterisk. */
  photo_required: boolean;
  /** Called with the uploaded file URL once compress + upload succeed. */
  on_uploaded: (url: string) => void;
  /** Called when the user clears the current photo. */
  on_clear: () => void;
  /** Surfaces upload errors to the parent's error banner. */
  on_error: (message: string) => void;
}

/**
 * Renders the "Foto Bukti" field: preview + clear when a photo exists, a file
 * input otherwise, or an em-dash placeholder when readonly. On pick it
 * downscales (PERP-GAP-21 toBlob guard) and uploads, reporting URL/errors up.
 */
export function BeritaAcaraPhotoCapture({
  foto,
  is_readonly,
  photo_required,
  on_uploaded,
  on_clear,
  on_error,
}: Props) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    on_error("");
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const url = await uploadFoto(compressed);
      on_uploaded(url);
    } catch (e) {
      on_error(e instanceof Error ? e.message : "Upload gagal.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-4">
      <label className="mb-1 block text-xs text-muted-fg">
        Foto Bukti {photo_required ? <span className="text-rose-600">*</span> : null}
      </label>
      {foto ? (
        <div className="flex items-start gap-3">
          <img src={foto} alt="Bukti" className="h-32 w-32 rounded-md border border-border object-cover" />
          {!is_readonly ? (
            <button type="button" onClick={on_clear}
              className="text-xs text-rose-600 hover:underline">
              Hapus foto
            </button>
          ) : null}
        </div>
      ) : !is_readonly ? (
        <input
          type="file"
          accept="image/*"
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
          disabled={uploading}
          className="block w-full text-sm text-fg file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-2 file:text-white"
        />
      ) : (
        <span className="text-xs text-muted-fg">— tidak ada foto —</span>
      )}
      {uploading ? <div className="mt-1 text-xs text-muted-fg">Mengunggah...</div> : null}
    </div>
  );
}
