import { useFormContext } from "react-hook-form";
import type { FullPpdbInput } from "../schema";
import { Field } from "./Step1Jalur";

export function Step3Ortu() {
  const { register, formState: { errors } } = useFormContext<FullPpdbInput>();
  const e = errors.ortu;

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 font-semibold">Ayah</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Nama Ayah" error={e?.nama_ayah?.message}>
            <input {...register("ortu.nama_ayah")} className="w-full rounded border px-3 py-2" />
          </Field>
          <Field label="Pekerjaan">
            <input {...register("ortu.pekerjaan_ayah")} className="w-full rounded border px-3 py-2" />
          </Field>
          <Field label="No HP" error={e?.no_hp_ayah?.message}>
            <input {...register("ortu.no_hp_ayah")} className="w-full rounded border px-3 py-2" />
          </Field>
        </div>
      </section>
      <section>
        <h3 className="mb-3 font-semibold">Ibu</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Nama Ibu" error={e?.nama_ibu?.message}>
            <input {...register("ortu.nama_ibu")} className="w-full rounded border px-3 py-2" />
          </Field>
          <Field label="Pekerjaan">
            <input {...register("ortu.pekerjaan_ibu")} className="w-full rounded border px-3 py-2" />
          </Field>
          <Field label="No HP" error={e?.no_hp_ibu?.message}>
            <input {...register("ortu.no_hp_ibu")} className="w-full rounded border px-3 py-2" />
          </Field>
        </div>
      </section>
      <section>
        <h3 className="mb-3 font-semibold">Wali (opsional)</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Nama Wali">
            <input {...register("ortu.nama_wali")} className="w-full rounded border px-3 py-2" />
          </Field>
          <Field label="No HP Wali" error={e?.no_hp_wali?.message}>
            <input {...register("ortu.no_hp_wali")} className="w-full rounded border px-3 py-2" />
          </Field>
        </div>
      </section>
    </div>
  );
}
