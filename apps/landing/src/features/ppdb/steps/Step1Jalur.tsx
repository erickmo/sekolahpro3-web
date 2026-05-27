import { useFormContext } from "react-hook-form";
import type { FullPpdbInput } from "../schema";
import { useGelombangAktif } from "../api";

export function Step1Jalur() {
  const { register, formState: { errors } } = useFormContext<FullPpdbInput>();
  const { data, isLoading, error } = useGelombangAktif();

  if (isLoading) return <p>Memuat gelombang…</p>;
  if (error) return <p className="text-red-600">Gagal memuat: {(error as Error).message}</p>;
  if (!data || data.length === 0) return <p>Belum ada gelombang aktif saat ini.</p>;

  return (
    <div className="space-y-4">
      <Field label="Jalur Pendaftaran" error={errors.jalur?.message}>
        <select {...register("jalur")} className="w-full rounded border px-3 py-2">
          <option value="Reguler">Reguler</option>
          <option value="Prestasi">Prestasi</option>
          <option value="Afirmasi">Afirmasi</option>
          <option value="Mutasi">Mutasi</option>
        </select>
      </Field>

      <Field label="Gelombang" error={errors.gelombang_ppdb?.message}>
        <select {...register("gelombang_ppdb")} className="w-full rounded border px-3 py-2">
          <option value="">— Pilih gelombang —</option>
          {data.map((g) => (
            <option key={g.name} value={g.name}>
              {g.nama} ({g.tingkat}) — sisa {g.sisa_kuota ?? g.kuota} kursi
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

export function Field({
  label, error, children,
}: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
