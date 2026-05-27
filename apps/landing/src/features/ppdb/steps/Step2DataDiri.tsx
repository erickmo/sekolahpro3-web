import { useFormContext } from "react-hook-form";
import type { FullPpdbInput } from "../schema";
import { Field } from "./Step1Jalur";

export function Step2DataDiri() {
  const { register, formState: { errors } } = useFormContext<FullPpdbInput>();
  const e = errors.calon;

  return (
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
        <input type="date" {...register("calon.tanggal_lahir")} className="w-full rounded border px-3 py-2" />
      </Field>
      <Field label="Asal Sekolah" error={e?.asal_sekolah?.message}>
        <input {...register("calon.asal_sekolah")} className="w-full rounded border px-3 py-2" />
      </Field>
      <Field label="No HP" error={e?.no_hp?.message}>
        <input {...register("calon.no_hp")} className="w-full rounded border px-3 py-2" />
      </Field>
      <Field label="Email" error={e?.email?.message}>
        <input type="email" {...register("calon.email")} className="w-full rounded border px-3 py-2" />
      </Field>
      <div className="md:col-span-2">
        <Field label="Alamat" error={e?.alamat?.message}>
          <textarea {...register("calon.alamat")} rows={3} className="w-full rounded border px-3 py-2" />
        </Field>
      </div>
    </div>
  );
}
