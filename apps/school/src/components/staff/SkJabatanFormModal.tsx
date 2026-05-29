/**
 * SkJabatanFormModal — create form for doctype "SK Jabatan".
 * Required: guru, jenis_jabatan, tanggal_sk, tanggal_mulai_berlaku.
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useResourceCreate, useResourceList } from "@sekolahpro/api-client";
import { Button, DatePicker, FormField, FormGrid, Input, Modal, SearchableSelect, Textarea } from "@sekolahpro/ui";

interface SkJabatanFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

type GuruRow = { name: string; nama_lengkap?: string; nip?: string };
type JenisJabatanRow = { name: string; nama_jabatan?: string };
type TahunAjaranRow = { name: string };

interface FormState {
  guru: string;
  jenis_jabatan: string;
  tanggal_sk: string;
  tanggal_mulai_berlaku: string;
  tanggal_berakhir: string;
  tahun_ajaran: string;
  keterangan_tugas: string;
  nomor_sk_manual: string;
  status: string;
}

const INITIAL: FormState = {
  guru: "",
  jenis_jabatan: "",
  tanggal_sk: "",
  tanggal_mulai_berlaku: "",
  tanggal_berakhir: "",
  tahun_ajaran: "",
  keterangan_tugas: "",
  nomor_sk_manual: "",
  status: "Draft",
};

const STATUS_OPTIONS = ["Draft", "Diajukan", "Disetujui Kepsek", "Diterbitkan", "Dicabut"] as const;

export function SkJabatanFormModal({ open, onClose, onCreated }: SkJabatanFormModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("SK Jabatan");
  const guruQ = useResourceList<GuruRow>("Pegawai", {
    fields: ["name", "nama_lengkap", "nip"],
    limit_page_length: 0,
  });
  const jenisQ = useResourceList<JenisJabatanRow>("Jenis Jabatan", {
    fields: ["name", "nama_jabatan"],
    filters: [["aktif", "=", 1]],
    limit_page_length: 0,
  });
  const tahunQ = useResourceList<TahunAjaranRow>("Tahun Ajaran", {
    fields: ["name"],
    limit_page_length: 0,
  });

  const set = <K extends keyof FormState>(k: K, v: string) =>
    setForm((cur) => ({ ...cur, [k]: v }));

  const reset = () => { setForm(INITIAL); setErr(null); };
  const close = () => { reset(); onClose(); };

  const canSubmit =
    !!form.guru &&
    !!form.jenis_jabatan &&
    !!form.tanggal_sk &&
    !!form.tanggal_mulai_berlaku &&
    !create.isPending;

  const submit = async () => {
    setErr(null);
    try {
      const payload: Record<string, unknown> = {
        guru: form.guru,
        jenis_jabatan: form.jenis_jabatan,
        tanggal_sk: form.tanggal_sk,
        tanggal_mulai_berlaku: form.tanggal_mulai_berlaku,
        status: form.status,
      };
      if (form.tanggal_berakhir) payload.tanggal_berakhir = form.tanggal_berakhir;
      if (form.tahun_ajaran) payload.tahun_ajaran = form.tahun_ajaran;
      if (form.keterangan_tugas.trim()) payload.keterangan_tugas = form.keterangan_tugas.trim();
      if (form.nomor_sk_manual.trim()) payload.nomor_sk_manual = form.nomor_sk_manual.trim();

      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "SK Jabatan"] });
      onCreated?.(created.name);
      reset();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat SK Jabatan.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Terbitkan SK Jabatan"
      description="Isi data SK Jabatan. Tanda * wajib."
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close}>Batal</Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {create.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormGrid cols={2}>
          <FormField label="Staff" required className="sm:col-span-2">
            <SearchableSelect
              value={form.guru}
              onChange={(v) => set("guru", v)}
              disabled={guruQ.isLoading}
              options={(guruQ.data ?? []).map((g) => ({
                value: g.name,
                label: `${g.nama_lengkap ?? g.name}${g.nip ? ` — NIP ${g.nip}` : ""}`,
              }))}
              placeholder={guruQ.isLoading ? "Memuat..." : "— Pilih Staff —"}
            />
          </FormField>
          <FormField label="Jenis Jabatan" required>
            <SearchableSelect
              value={form.jenis_jabatan}
              onChange={(v) => set("jenis_jabatan", v)}
              disabled={jenisQ.isLoading}
              options={(jenisQ.data ?? []).map((j) => ({
                value: j.name,
                label: j.nama_jabatan ?? j.name,
              }))}
              placeholder={jenisQ.isLoading ? "Memuat..." : "— Pilih Jenis —"}
            />
          </FormField>
          <FormField label="Status">
            <SearchableSelect
              value={form.status}
              onChange={(v) => set("status", v)}
              options={STATUS_OPTIONS.map((o) => ({ value: o, label: o }))}
            />
          </FormField>
          <FormField label="Tanggal SK" required>
            <DatePicker
              value={form.tanggal_sk}
              onChange={(v) => set("tanggal_sk", v)}
            />
          </FormField>
          <FormField label="Tahun Ajaran">
            <SearchableSelect
              value={form.tahun_ajaran}
              onChange={(v) => set("tahun_ajaran", v)}
              disabled={tahunQ.isLoading}
              options={(tahunQ.data ?? []).map((t) => ({ value: t.name, label: t.name }))}
              placeholder="— Opsional —"
            />
          </FormField>
          <FormField label="Tanggal Mulai Berlaku" required>
            <DatePicker
              value={form.tanggal_mulai_berlaku}
              onChange={(v) => set("tanggal_mulai_berlaku", v)}
            />
          </FormField>
          <FormField label="Tanggal Berakhir">
            <DatePicker
              value={form.tanggal_berakhir}
              onChange={(v) => set("tanggal_berakhir", v)}
            />
          </FormField>
          <FormField label="Nomor SK (Resmi)" className="sm:col-span-2">
            <Input
              value={form.nomor_sk_manual}
              onChange={(e) => set("nomor_sk_manual", e.target.value)}
              placeholder="800/SK/.../2026"
            />
          </FormField>
          <FormField label="Keterangan Tugas" className="sm:col-span-2">
            <Textarea
              rows={3}
              value={form.keterangan_tugas}
              onChange={(e) => set("keterangan_tugas", e.target.value)}
            />
          </FormField>
        </FormGrid>
        {err && (
          <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {err}
          </div>
        )}
      </div>
    </Modal>
  );
}
