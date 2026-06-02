import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useSite } from "../../SiteContext";
import { usePpdbInfo } from "../../lib/ppdb";
import { ppdbSchema, type PpdbFormValues } from "./schema";
import { useSubmitPendaftaran } from "./api";

function Row({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium" style={{ color: "var(--situs-ink)" }}>{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

/** Per-school PPDB registration form. Scoped to the resolved school's waves. */
export function PpdbForm() {
  const site = useSite();
  const navigate = useNavigate();
  const { data: info } = usePpdbInfo(site.sekolah);
  const submit = useSubmitPendaftaran(site.sekolah);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PpdbFormValues>({ resolver: zodResolver(ppdbSchema), defaultValues: { nisn: "", email: "" } });

  const jalurOptions = info?.jalur ?? ["Reguler"];
  const gelombangOptions = info?.gelombang ?? [];

  const onSubmit = (values: PpdbFormValues) => {
    submit.mutate(values, {
      onSuccess: (res) => navigate(`/ppdb/sukses?no=${encodeURIComponent(res.nomor_pendaftaran)}`),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      <fieldset className="situs-card situs-round-lg space-y-4 p-5">
        <legend className="px-1 text-sm font-semibold" style={{ color: "var(--situs-brand)" }}>1 · Jalur & Gelombang</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Row label="Jalur Pendaftaran" error={errors.jalur?.message}>
            <select {...register("jalur")} className="situs-input" aria-label="Jalur">
              <option value="">Pilih jalur…</option>
              {jalurOptions.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </Row>
          <Row label="Gelombang" error={errors.gelombang?.message}>
            <select {...register("gelombang")} className="situs-input" aria-label="Gelombang">
              <option value="">Pilih gelombang…</option>
              {gelombangOptions.map((g) => <option key={g.name} value={g.name}>{g.nama} (Tingkat {g.tingkat})</option>)}
            </select>
          </Row>
        </div>
      </fieldset>

      <fieldset className="situs-card situs-round-lg space-y-4 p-5">
        <legend className="px-1 text-sm font-semibold" style={{ color: "var(--situs-brand)" }}>2 · Data Calon Siswa</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Row label="Nama Lengkap" error={errors.nama_lengkap?.message}>
            <input {...register("nama_lengkap")} className="situs-input" aria-label="Nama Lengkap" />
          </Row>
          <Row label="NISN (opsional)" error={errors.nisn?.message}>
            <input {...register("nisn")} className="situs-input" aria-label="NISN" inputMode="numeric" />
          </Row>
          <Row label="NIK" error={errors.nik?.message}>
            <input {...register("nik")} className="situs-input" aria-label="NIK" inputMode="numeric" />
          </Row>
          <Row label="Jenis Kelamin" error={errors.jenis_kelamin?.message}>
            <select {...register("jenis_kelamin")} className="situs-input" aria-label="Jenis Kelamin">
              <option value="">Pilih…</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </Row>
          <Row label="Tempat Lahir" error={errors.tempat_lahir?.message}>
            <input {...register("tempat_lahir")} className="situs-input" aria-label="Tempat Lahir" />
          </Row>
          <Row label="Tanggal Lahir" error={errors.tanggal_lahir?.message}>
            <input type="date" {...register("tanggal_lahir")} className="situs-input" aria-label="Tanggal Lahir" />
          </Row>
          <Row label="Asal Sekolah" error={errors.asal_sekolah?.message}>
            <input {...register("asal_sekolah")} className="situs-input" aria-label="Asal Sekolah" />
          </Row>
          <Row label="No. HP" error={errors.no_hp?.message}>
            <input {...register("no_hp")} className="situs-input" aria-label="No HP" inputMode="tel" />
          </Row>
          <Row label="Email (opsional)" error={errors.email?.message}>
            <input {...register("email")} type="email" className="situs-input" aria-label="Email" />
          </Row>
          <Row label="Alamat" error={errors.alamat?.message}>
            <input {...register("alamat")} className="situs-input" aria-label="Alamat" />
          </Row>
        </div>
      </fieldset>

      <fieldset className="situs-card situs-round-lg space-y-4 p-5">
        <legend className="px-1 text-sm font-semibold" style={{ color: "var(--situs-brand)" }}>3 · Data Orang Tua</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Row label="Nama Ayah" error={errors.nama_ayah?.message}>
            <input {...register("nama_ayah")} className="situs-input" aria-label="Nama Ayah" />
          </Row>
          <Row label="No. HP Ayah">
            <input {...register("no_hp_ayah")} className="situs-input" aria-label="No HP Ayah" inputMode="tel" />
          </Row>
          <Row label="Nama Ibu" error={errors.nama_ibu?.message}>
            <input {...register("nama_ibu")} className="situs-input" aria-label="Nama Ibu" />
          </Row>
          <Row label="No. HP Ibu">
            <input {...register("no_hp_ibu")} className="situs-input" aria-label="No HP Ibu" inputMode="tel" />
          </Row>
        </div>
      </fieldset>

      <label className="flex items-start gap-3 text-sm" style={{ color: "var(--situs-muted)" }}>
        <input type="checkbox" {...register("consent")} className="mt-1" aria-label="Persetujuan" />
        <span>
          Saya menyetujui pemrosesan data pribadi sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi untuk
          keperluan pendaftaran peserta didik baru di {site.nama}.
        </span>
      </label>
      {errors.consent?.message ? <p className="text-xs text-red-600">{errors.consent.message}</p> : null}
      {submit.isError ? <p className="text-sm text-red-600">Gagal mengirim pendaftaran. Coba lagi.</p> : null}

      <button type="submit" disabled={submit.isPending} className="situs-brand-bg situs-round px-8 py-3 text-sm font-bold disabled:opacity-60">
        {submit.isPending ? "Mengirim…" : "Kirim Pendaftaran"}
      </button>
    </form>
  );
}
