import { useFormContext } from "react-hook-form";
import type { FullPpdbInput } from "../schema";
import { Turnstile } from "../turnstile";

export function Step5Review() {
  const { watch, register, setValue, formState: { errors } } = useFormContext<FullPpdbInput>();
  const v = watch();

  return (
    <div className="space-y-6">
      <section className="rounded border p-4">
        <h3 className="font-semibold">Ringkasan</h3>
        <dl className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          <Row k="Jalur" val={v.jalur} />
          <Row k="Gelombang" val={v.gelombang_ppdb} />
          <Row k="Nama" val={v.calon?.nama_lengkap} />
          <Row k="NIK" val={v.calon?.nik} />
          <Row k="NISN" val={v.calon?.nisn} />
          <Row k="No HP" val={v.calon?.no_hp} />
          <Row k="Email" val={v.calon?.email} />
          <Row k="Asal Sekolah" val={v.calon?.asal_sekolah} />
          <Row k="Ayah" val={v.ortu?.nama_ayah} />
          <Row k="Ibu" val={v.ortu?.nama_ibu} />
          <Row k="Dokumen Upload" val={`${(v.dokumen ?? []).length} / 4`} />
        </dl>
      </section>

      <section>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" {...register("consent")} className="mt-1" />
          <span>
            Saya menyetujui pemrosesan data pribadi sesuai UU No. 27/2022 tentang
            Pelindungan Data Pribadi. Data digunakan untuk proses PPDB dan dapat
            ditarik kembali melalui menu portal calon siswa.
          </span>
        </label>
        {errors.consent && (
          <p className="text-xs text-red-600">{errors.consent.message}</p>
        )}
      </section>

      <section>
        <Turnstile onToken={(t) => setValue("turnstile_token", t, { shouldValidate: true })} />
        {errors.turnstile_token && (
          <p className="text-xs text-red-600">{errors.turnstile_token.message}</p>
        )}
      </section>
    </div>
  );
}

function Row({ k, val }: { k: string; val?: string | number }) {
  return (
    <div>
      <dt className="text-gray-500">{k}</dt>
      <dd className="font-medium">{val || "-"}</dd>
    </div>
  );
}
