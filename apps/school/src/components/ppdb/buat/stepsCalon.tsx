/**
 * Langkah 2 wizard "Buat PPDB": Calon Siswa. Berisi CalonStep (orchestrator
 * langkah) dan CalonNewForm (buat calon baru inline). Diekstrak dari
 * buatPanel.tsx tanpa perubahan perilaku.
 */

import { SearchableSelect, SectionCard } from "@sekolahpro/ui";
import { Field, ModeBtn, StepNav } from "./primitives";
import { inputCls, type CalonFormState } from "./types";

// ===== Langkah 2: Calon Siswa =====

/** Langkah pemilihan/pembuatan Calon Siswa. */
export function CalonStep({
  mode,
  onMode,
  calonName,
  onCalonName,
  calonOpts,
  calonLoading,
  form,
  onForm,
  onBack,
  onNext,
}: {
  mode: "existing" | "new";
  onMode: (m: "existing" | "new") => void;
  calonName: string;
  onCalonName: (v: string) => void;
  calonOpts: { value: string; label: string }[];
  calonLoading: boolean;
  form: CalonFormState;
  onForm: (patch: Partial<CalonFormState>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <SectionCard title="2. Calon Siswa" description="Pilih calon yang sudah ada atau buat baru.">
      <div className="mb-4 flex gap-2">
        <ModeBtn active={mode === "existing"} onClick={() => onMode("existing")}>
          Pilih Existing
        </ModeBtn>
        <ModeBtn active={mode === "new"} onClick={() => onMode("new")}>
          Buat Baru
        </ModeBtn>
      </div>
      {mode === "existing" ? (
        <SearchableSelect
          value={calonName}
          onChange={onCalonName}
          options={calonOpts}
          placeholder={calonLoading ? "Memuat..." : "Cari nama atau NISN..."}
        />
      ) : (
        <CalonNewForm form={form} onForm={onForm} />
      )}
      <StepNav onBack={onBack} onNext={onNext} />
    </SectionCard>
  );
}

/** Form pembuatan calon siswa baru inline. */
function CalonNewForm({
  form,
  onForm,
}: {
  form: CalonFormState;
  onForm: (patch: Partial<CalonFormState>) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Nama Lengkap *">
        <input
          value={form.nama_lengkap}
          onChange={(e) => onForm({ nama_lengkap: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Jenis Kelamin *">
        <SearchableSelect
          value={form.jenis_kelamin}
          onChange={(v) => onForm({ jenis_kelamin: v })}
          options={[
            { value: "Laki-laki", label: "Laki-laki" },
            { value: "Perempuan", label: "Perempuan" },
          ]}
          placeholder="— pilih —"
        />
      </Field>
      <Field label="NISN">
        <input value={form.nisn} onChange={(e) => onForm({ nisn: e.target.value })} className={inputCls} />
      </Field>
      <Field label="NIK">
        <input value={form.nik} onChange={(e) => onForm({ nik: e.target.value })} className={inputCls} />
      </Field>
      <Field label="No. HP">
        <input value={form.no_hp} onChange={(e) => onForm({ no_hp: e.target.value })} className={inputCls} />
      </Field>
      <Field label="Email">
        <input
          type="email"
          value={form.email}
          onChange={(e) => onForm({ email: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Asal Sekolah" cols={2}>
        <input
          value={form.asal_sekolah}
          onChange={(e) => onForm({ asal_sekolah: e.target.value })}
          className={inputCls}
        />
      </Field>
    </div>
  );
}
