import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { Path } from "react-hook-form";
import type { FullPpdbInput } from "../schema";
import { IdScanField } from "@sekolahpro/ui";
import { scanIdentitasPublik } from "../../../lib/ocrApi";
import { mapKtpToCalon } from "../ocrMapping";
import { Turnstile } from "../turnstile";
import { Field } from "./Step1Jalur";

export function Step2DataDiri() {
  const { register, setValue, watch, formState: { errors } } = useFormContext<FullPpdbInput>();
  const e = errors.calon;
  const [tsReset, setTsReset] = useState(0);

  return (
    <div className="space-y-6">
      {/* ── KTP auto-fill (optional) ── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">
          Isi otomatis dari KTP (opsional)
        </h3>
        <IdScanField
          jenis="KTP"
          onScan={(blob, jenis) =>
            scanIdentitasPublik(blob, jenis, watch("turnstile_token") || "")
              .then((r) => ({ fields: r.fields, confidence: r.confidence }))
              .finally(() => setTsReset((n) => n + 1))
          }
          onApply={(fields) => {
            const mapped = mapKtpToCalon(fields);
            Object.entries(mapped).forEach(([path, val]) =>
              setValue(path as Path<FullPpdbInput>, val as never, { shouldValidate: true }),
            );
          }}
        />
        <p className="text-xs text-slate-500">Verifikasi untuk memindai dokumen</p>
        <Turnstile
          onToken={(t) => setValue("turnstile_token", t, { shouldValidate: false })}
          resetSignal={tsReset}
        />
      </section>

      {/* ── Manual fields ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="NISN" error={e?.nisn?.message}>
          <input {...register("calon.nisn")} className="w-full rounded border px-3 py-2" />
        </Field>
        <Field label="NIK" error={e?.nik?.message}>
          <input {...register("calon.nik")} className="w-full rounded border px-3 py-2" />
        </Field>
        <Field label="Nama Lengkap" error={e?.nama_lengkap?.message}>
          <input {...register("calon.nama_lengkap")} className="w-full rounded border px-3 py-2" />
        </Field>
        <Field label="Jenis Kelamin" error={e?.jenis_kelamin?.message}>
          <select {...register("calon.jenis_kelamin")} className="w-full rounded border px-3 py-2">
            <option value="">— Pilih —</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </Field>
        <Field label="Tempat Lahir" error={e?.tempat_lahir?.message}>
          <input {...register("calon.tempat_lahir")} className="w-full rounded border px-3 py-2" />
        </Field>
        <Field label="Tanggal Lahir" error={e?.tanggal_lahir?.message}>
          <input
            type="date"
            {...register("calon.tanggal_lahir")}
            className="w-full rounded border px-3 py-2"
          />
        </Field>
        <Field label="Asal Sekolah" error={e?.asal_sekolah?.message}>
          <input {...register("calon.asal_sekolah")} className="w-full rounded border px-3 py-2" />
        </Field>
        <Field label="No HP" error={e?.no_hp?.message}>
          <input {...register("calon.no_hp")} className="w-full rounded border px-3 py-2" />
        </Field>
        <Field label="Email" error={e?.email?.message}>
          <input
            type="email"
            {...register("calon.email")}
            className="w-full rounded border px-3 py-2"
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Alamat" error={e?.alamat?.message}>
            <textarea
              {...register("calon.alamat")}
              rows={3}
              className="w-full rounded border px-3 py-2"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
