/**
 * BerkasGuruFormModal — create form for doctype "Berkas Guru".
 * Required: guru, nama_berkas, file (Attach URL).
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useResourceCreate, useResourceList } from "@sekolahpro/api-client";
import { Button, DatePicker, FormField, FormGrid, Input, Modal, SearchableSelect, Textarea } from "@sekolahpro/ui";

interface BerkasGuruFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

type GuruRow = { name: string; nama_lengkap?: string; nip?: string };

const JENIS_BERKAS = [
  "Ijazah", "Sertifikat", "KTP", "KK", "NPWP",
  "SK CPNS", "SK PNS", "SK Berkala", "SK Pangkat", "SK Mutasi",
  "Karpeg", "Karis/Karsu", "Taspen", "BPJS", "NUPTK Card",
  "Akta Nikah", "Sertifikat Diklat", "PAK", "Lainnya",
] as const;

interface FormState {
  guru: string;
  nama_berkas: string;
  jenis_berkas: string;
  file: string;
  nomor_dokumen: string;
  tanggal_upload: string;
  tanggal_berlaku: string;
  tanggal_kadaluarsa: string;
  keterangan: string;
}

const INITIAL: FormState = {
  guru: "",
  nama_berkas: "",
  jenis_berkas: "",
  file: "",
  nomor_dokumen: "",
  tanggal_upload: "",
  tanggal_berlaku: "",
  tanggal_kadaluarsa: "",
  keterangan: "",
};

export function BerkasGuruFormModal({ open, onClose, onCreated }: BerkasGuruFormModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Berkas Guru");
  const guruQ = useResourceList<GuruRow>("Guru", {
    fields: ["name", "nama_lengkap", "nip"],
    limit_page_length: 0,
  });

  const set = <K extends keyof FormState>(k: K, v: string) =>
    setForm((cur) => ({ ...cur, [k]: v }));

  const reset = () => { setForm(INITIAL); setErr(null); };
  const close = () => { reset(); onClose(); };

  const canSubmit =
    !!form.guru &&
    !!form.nama_berkas.trim() &&
    !!form.file.trim() &&
    !create.isPending;

  const submit = async () => {
    setErr(null);
    try {
      const payload: Record<string, unknown> = {
        guru: form.guru,
        nama_berkas: form.nama_berkas.trim(),
        file: form.file.trim(),
      };
      if (form.jenis_berkas) payload.jenis_berkas = form.jenis_berkas;
      if (form.nomor_dokumen.trim()) payload.nomor_dokumen = form.nomor_dokumen.trim();
      if (form.tanggal_upload) payload.tanggal_upload = form.tanggal_upload;
      if (form.tanggal_berlaku) payload.tanggal_berlaku = form.tanggal_berlaku;
      if (form.tanggal_kadaluarsa) payload.tanggal_kadaluarsa = form.tanggal_kadaluarsa;
      if (form.keterangan.trim()) payload.keterangan = form.keterangan.trim();

      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Berkas Guru"] });
      onCreated?.(created.name);
      reset();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal menyimpan berkas.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Unggah Berkas Staff"
      description="Isi data berkas. Tanda * wajib."
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
          <FormField label="Nama Berkas" required>
            <Input
              value={form.nama_berkas}
              onChange={(e) => set("nama_berkas", e.target.value)}
              placeholder="Ijazah S1"
            />
          </FormField>
          <FormField label="Jenis Berkas">
            <SearchableSelect
              value={form.jenis_berkas}
              onChange={(v) => set("jenis_berkas", v)}
              options={JENIS_BERKAS.map((o) => ({ value: o, label: o }))}
              placeholder="—"
            />
          </FormField>
          <FormField label="URL File" required hint="Unggah dulu via Frappe Desk lalu salin URL-nya (/files/...)" className="sm:col-span-2">
            <Input
              value={form.file}
              onChange={(e) => set("file", e.target.value)}
              placeholder="/files/ijazah.pdf"
            />
          </FormField>
          <FormField label="Nomor Dokumen">
            <Input
              value={form.nomor_dokumen}
              onChange={(e) => set("nomor_dokumen", e.target.value)}
            />
          </FormField>
          <FormField label="Tanggal Upload">
            <DatePicker
              value={form.tanggal_upload}
              onChange={(v) => set("tanggal_upload", v)}
            />
          </FormField>
          <FormField label="Tanggal Berlaku">
            <DatePicker
              value={form.tanggal_berlaku}
              onChange={(v) => set("tanggal_berlaku", v)}
            />
          </FormField>
          <FormField label="Tanggal Kadaluarsa">
            <DatePicker
              value={form.tanggal_kadaluarsa}
              onChange={(v) => set("tanggal_kadaluarsa", v)}
            />
          </FormField>
          <FormField label="Keterangan" className="sm:col-span-2">
            <Textarea
              rows={3}
              value={form.keterangan}
              onChange={(e) => set("keterangan", e.target.value)}
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
