import { useFormContext } from "react-hook-form";
import type { FullPpdbInput } from "../schema";
import { JENIS_DOKUMEN, type JenisDokumen } from "../schema";
import { useUploadDokumen } from "../api";
import { Field } from "./Step1Jalur";

export function Step4Dokumen() {
  const { setValue, watch, formState: { errors } } = useFormContext<FullPpdbInput>();
  const upload = useUploadDokumen();
  const current = watch("dokumen") ?? [];

  async function handleFile(jenis: JenisDokumen, file: File) {
    const res = await upload.mutateAsync({
      turnstile_token: watch("turnstile_token") || "dev",
      jenis,
      file,
    });
    const next = current.filter((d) => d.jenis !== jenis);
    next.push({ jenis, file_url: res.file_url });
    setValue("dokumen", next, { shouldValidate: true });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Format: JPG/PNG/PDF, maksimum 5 MB per file.
      </p>
      {JENIS_DOKUMEN.map((jenis) => {
        const uploaded = current.find((d) => d.jenis === jenis);
        return (
          <Field key={jenis} label={jenis}>
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(jenis, f);
              }}
              className="block"
            />
            {uploaded && <p className="text-xs text-green-700">✓ Terupload</p>}
          </Field>
        );
      })}
      {upload.isError && (
        <p className="text-sm text-red-600">{(upload.error as Error).message}</p>
      )}
      {errors.dokumen && (
        <p className="text-sm text-red-600">Lengkapi semua 4 dokumen sebelum lanjut</p>
      )}
    </div>
  );
}
