/**
 * SkJabatanFormModal — create form for doctype "SK Jabatan".
 * Required: guru, jenis_jabatan, tanggal_sk, tanggal_mulai_berlaku.
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useResourceCreate, useResourceList } from "@sekolahpro/api-client";
import { Button, FormField, FormGrid, Input, Modal, Select, Textarea } from "@sekolahpro/ui";

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
  const guruQ = useResourceList<GuruRow>("Guru", {
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
            <Select
              value={form.guru}
              onChange={(e) => set("guru", e.target.value)}
              disabled={guruQ.isLoading}
            >
              <option value="">
                {guruQ.isLoading ? "Memuat..." : "— Pilih Staff —"}
              </option>
              {(guruQ.data ?? []).map((g) => (
                <option key={g.name} value={g.name}>
                  {g.nama_lengkap ?? g.name}{g.nip ? ` — NIP ${g.nip}` : ""}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Jenis Jabatan" required>
            <Select
              value={form.jenis_jabatan}
              onChange={(e) => set("jenis_jabatan", e.target.value)}
              disabled={jenisQ.isLoading}
            >
              <option value="">
                {jenisQ.isLoading ? "Memuat..." : "— Pilih Jenis —"}
              </option>
              {(jenisQ.data ?? []).map((j) => (
                <option key={j.name} value={j.name}>
                  {j.nama_jabatan ?? j.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
          </FormField>
          <FormField label="Tanggal SK" required>
            <Input
              type="date"
              value={form.tanggal_sk}
              onChange={(e) => set("tanggal_sk", e.target.value)}
            />
          </FormField>
          <FormField label="Tahun Ajaran">
            <Select
              value={form.tahun_ajaran}
              onChange={(e) => set("tahun_ajaran", e.target.value)}
              disabled={tahunQ.isLoading}
            >
              <option value="">— Opsional —</option>
              {(tahunQ.data ?? []).map((t) => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Tanggal Mulai Berlaku" required>
            <Input
              type="date"
              value={form.tanggal_mulai_berlaku}
              onChange={(e) => set("tanggal_mulai_berlaku", e.target.value)}
            />
          </FormField>
          <FormField label="Tanggal Berakhir">
            <Input
              type="date"
              value={form.tanggal_berakhir}
              onChange={(e) => set("tanggal_berakhir", e.target.value)}
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
