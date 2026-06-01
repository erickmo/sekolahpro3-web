/**
 * Langkah 1 wizard "Buat PPDB": Gelombang. Berisi GelombangStep (orchestrator
 * langkah), GelombangExisting (pilih existing), dan GelombangNewForm (buat baru
 * inline). Diekstrak dari buatPanel.tsx tanpa perubahan perilaku.
 */

import { Alert, Button, DatePicker, SearchableSelect, SectionCard } from "@sekolahpro/ui";
import type { GelombangAktif } from "../../../lib/ppdbApi";
import { Field, ModeBtn, StepNav } from "./primitives";
import { inputCls, TINGKAT_OPTIONS, type GelombangFormState } from "./types";

// ===== Langkah 1: Gelombang =====

interface GelombangStepProps {
  tahunAjaran: string;
  onChangeTahunAjaran: (v: string) => void;
  tahunAjaranOpts: { value: string; label: string }[];
  tahunAjaranLoading: boolean;
  onNewTahunAjaran: () => void;
  mode: "existing" | "new";
  onMode: (m: "existing" | "new") => void;
  gelombangName: string;
  onGelombangName: (v: string) => void;
  gelombangOpts: GelombangAktif[];
  gelombangLoading: boolean;
  selectedGelombang: GelombangAktif | undefined;
  form: GelombangFormState;
  onForm: (patch: Partial<GelombangFormState>) => void;
  sekolahOpts: { value: string; label: string }[];
  sekolahLoading: boolean;
  gelombangErr: string | null;
  creating: boolean;
  onNext: () => void;
  onCreateInline: () => void;
}

/** Langkah pemilihan/pembuatan Gelombang PPDB di bawah tahun ajaran terpilih. */
export function GelombangStep(p: GelombangStepProps) {
  return (
    <SectionCard title="1. Gelombang" description="Pilih tahun ajaran lalu pilih atau buat gelombang.">
      <Field label="Tahun Ajaran *">
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchableSelect
              value={p.tahunAjaran}
              onChange={p.onChangeTahunAjaran}
              options={p.tahunAjaranOpts}
              placeholder={p.tahunAjaranLoading ? "Memuat..." : "Pilih tahun ajaran..."}
            />
          </div>
          <Button onClick={p.onNewTahunAjaran}>+ Baru</Button>
        </div>
      </Field>

      {!p.tahunAjaran ? (
        <Alert tone="info" title="Pilih tahun ajaran dulu" className="mt-4">
          Gelombang dan pendaftaran di-scope per tahun ajaran. Pilih dulu untuk lanjut.
        </Alert>
      ) : (
        <div className="mt-4">
          <div className="mb-4 flex gap-2">
            <ModeBtn active={p.mode === "existing"} onClick={() => p.onMode("existing")}>
              Pilih Existing
            </ModeBtn>
            <ModeBtn active={p.mode === "new"} onClick={() => p.onMode("new")}>
              Buat Baru
            </ModeBtn>
          </div>
          {p.mode === "existing" ? (
            <GelombangExisting
              loading={p.gelombangLoading}
              list={p.gelombangOpts}
              value={p.gelombangName}
              onChange={p.onGelombangName}
              selected={p.selectedGelombang}
            />
          ) : (
            <GelombangNewForm
              form={p.form}
              onForm={p.onForm}
              sekolahOpts={p.sekolahOpts}
              sekolahLoading={p.sekolahLoading}
              err={p.gelombangErr}
            />
          )}
        </div>
      )}

      {p.mode === "new" && p.tahunAjaran ? (
        <div className="mt-5 flex justify-end">
          <Button onClick={p.onCreateInline} disabled={p.creating}>
            {p.creating ? "Membuat..." : "Buat & Lanjut"}
          </Button>
        </div>
      ) : (
        <StepNav onBack={null} onNext={p.onNext} />
      )}
    </SectionCard>
  );
}

/** Daftar gelombang aktif existing + ringkasan kuota/biaya/periode. */
function GelombangExisting({
  loading,
  list,
  value,
  onChange,
  selected,
}: {
  loading: boolean;
  list: GelombangAktif[];
  value: string;
  onChange: (v: string) => void;
  selected: GelombangAktif | undefined;
}) {
  if (loading) {
    return <div className="py-6 text-center text-sm text-muted-fg">Memuat gelombang...</div>;
  }
  if (list.length === 0) {
    return (
      <Alert tone="warning" title="Belum ada gelombang aktif untuk TA ini">
        Klik <strong>Buat Baru</strong> di atas untuk membuat gelombang inline.
      </Alert>
    );
  }
  return (
    <div className="space-y-3">
      <SearchableSelect
        value={value}
        onChange={onChange}
        options={list.map((g) => ({
          value: g.name,
          label: `${g.nama}${g.sekolah ? ` · ${g.sekolah}` : ""}${g.tingkat ? ` · Tk ${g.tingkat}` : ""}`,
        }))}
        placeholder="Pilih gelombang aktif..."
      />
      {selected && (
        <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-fg">
          <div>
            <strong>Kuota:</strong> {selected.kuota ?? "∞"}
          </div>
          <div>
            <strong>Biaya Pendaftaran:</strong> Rp{" "}
            {(selected.biaya_pendaftaran ?? 0).toLocaleString("id-ID")}
          </div>
          <div>
            <strong>Periode:</strong> {selected.tanggal_buka ?? "—"} s/d {selected.tanggal_tutup ?? "—"}
          </div>
        </div>
      )}
    </div>
  );
}

/** Form pembuatan gelombang baru inline (status otomatis Aktif). */
function GelombangNewForm({
  form,
  onForm,
  sekolahOpts,
  sekolahLoading,
  err,
}: {
  form: GelombangFormState;
  onForm: (patch: Partial<GelombangFormState>) => void;
  sekolahOpts: { value: string; label: string }[];
  sekolahLoading: boolean;
  err: string | null;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Nama Gelombang *">
        <input
          value={form.nama}
          onChange={(e) => onForm({ nama: e.target.value })}
          className={inputCls}
          placeholder="Gelombang 1 SMA 2026/2027"
        />
      </Field>
      <Field label="Sekolah">
        <SearchableSelect
          value={form.sekolah}
          onChange={(v) => onForm({ sekolah: v })}
          options={sekolahOpts}
          placeholder={sekolahLoading ? "Memuat..." : "Pilih sekolah..."}
        />
      </Field>
      <Field label="Tingkat *">
        <SearchableSelect
          value={form.tingkat}
          onChange={(v) => onForm({ tingkat: v })}
          options={TINGKAT_OPTIONS.map((t) => ({ value: t, label: t }))}
          placeholder="— pilih —"
        />
      </Field>
      <Field label="Tanggal Buka *">
        <DatePicker
          value={form.tanggal_buka}
          onChange={(v) => onForm({ tanggal_buka: v })}
          className={inputCls}
        />
      </Field>
      <Field label="Tanggal Tutup *">
        <DatePicker
          value={form.tanggal_tutup}
          onChange={(v) => onForm({ tanggal_tutup: v })}
          className={inputCls}
        />
      </Field>
      <Field label="Kuota *">
        <input
          type="number"
          value={form.kuota}
          onChange={(e) => onForm({ kuota: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Biaya Pendaftaran (Rp) *">
        <input
          type="number"
          value={form.biaya_pendaftaran}
          onChange={(e) => onForm({ biaya_pendaftaran: e.target.value })}
          className={inputCls}
        />
      </Field>
      {err && (
        <div className="sm:col-span-2">
          <Alert tone="danger" title="Gagal membuat gelombang">
            {err}
          </Alert>
        </div>
      )}
      <div className="sm:col-span-2 text-xs text-muted-fg">
        Status otomatis <strong>Aktif</strong> sehingga langsung bisa dipakai pendaftaran.
      </div>
    </div>
  );
}
