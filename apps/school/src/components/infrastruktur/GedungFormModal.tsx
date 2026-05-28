/**
 * GedungFormModal — create form modal untuk doctype "Gedung".
 *
 * Source of truth (fields): doctype Gedung di backend Frappe.
 * autoname = format:{sekolah}-{kode} (name auto-generated).
 */

import { useState } from "react";
import { Button, FormField, FormGrid, Input, Modal, SearchableSelect } from "@sekolahpro/ui";
import { useResourceCreate, useResourceList } from "@sekolahpro/api-client";
import { useQueryClient } from "@tanstack/react-query";

type SekolahRow = { name: string; nama_sekolah?: string };

const JENIS_OPTIONS = ["Kelas", "Asrama", "Masjid", "Lab", "Kantor", "Serbaguna", "Lainnya"] as const;
const KONDISI_OPTIONS = ["Baik", "Rusak Ringan", "Rusak Berat"] as const;
const STATUS_OPTIONS = ["Aktif", "Nonaktif"] as const;

interface GedungFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

interface FormState {
  nama: string;
  kode: string;
  sekolah: string;
  jenis: string;
  jumlah_lantai: string;
  tahun_dibangun: string;
  kondisi: string;
  status: string;
}

const INITIAL: FormState = {
  nama: "",
  kode: "",
  sekolah: "",
  jenis: "",
  jumlah_lantai: "",
  tahun_dibangun: "",
  kondisi: "",
  status: "Aktif",
};

export function GedungFormModal({ open, onClose, onCreated }: GedungFormModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Gedung");
  const sekolahQ = useResourceList<SekolahRow>("Sekolah", {
    fields: ["name", "nama_sekolah"],
    limit_page_length: 0,
  });

  const set = <K extends keyof FormState>(k: K, v: string) =>
    setForm((cur) => ({ ...cur, [k]: v }));

  const reset = () => {
    setForm(INITIAL);
    setErr(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const canSubmit =
    !!form.nama.trim() &&
    !!form.kode.trim() &&
    !!form.sekolah &&
    !!form.jenis &&
    !!form.status &&
    !create.isPending;

  const submit = async () => {
    setErr(null);
    try {
      const payload: Record<string, unknown> = {
        nama: form.nama.trim(),
        kode: form.kode.trim(),
        sekolah: form.sekolah,
        jenis: form.jenis,
        status: form.status,
      };
      if (form.jumlah_lantai.trim()) payload.jumlah_lantai = Number(form.jumlah_lantai);
      if (form.tahun_dibangun.trim()) payload.tahun_dibangun = Number(form.tahun_dibangun);
      if (form.kondisi) payload.kondisi = form.kondisi;

      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Gedung"] });
      reset();
      if (onCreated) onCreated(created.name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat gedung.");
    }
  };

  const sekolahOpts = sekolahQ.data ?? [];

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Tambah Gedung"
      description="Isi data gedung. Tanda * wajib."
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
          <FormField label="Nama Gedung" required>
            <Input
              value={form.nama}
              onChange={(e) => set("nama", e.target.value)}
              placeholder="Gedung A"
            />
          </FormField>
          <FormField label="Kode" required hint="Dipakai untuk auto-ID: {sekolah}-{kode}">
            <Input
              value={form.kode}
              onChange={(e) => set("kode", e.target.value)}
              placeholder="GA"
            />
          </FormField>
          <FormField label="Sekolah" required>
            <SearchableSelect
              value={form.sekolah}
              onChange={(v) => set("sekolah", v)}
              disabled={sekolahQ.isLoading}
              options={sekolahOpts.map((s) => ({
                value: s.name,
                label: s.nama_sekolah ?? s.name,
              }))}
              placeholder={sekolahQ.isLoading ? "Memuat..." : "— Pilih Sekolah —"}
            />
          </FormField>
          <FormField label="Jenis" required>
            <SearchableSelect
              value={form.jenis}
              onChange={(v) => set("jenis", v)}
              options={JENIS_OPTIONS.map((o) => ({ value: o, label: o }))}
              placeholder="— Pilih Jenis —"
            />
          </FormField>
          <FormField label="Jumlah Lantai">
            <Input
              type="number"
              min={0}
              value={form.jumlah_lantai}
              onChange={(e) => set("jumlah_lantai", e.target.value)}
            />
          </FormField>
          <FormField label="Tahun Dibangun">
            <Input
              type="number"
              min={0}
              value={form.tahun_dibangun}
              onChange={(e) => set("tahun_dibangun", e.target.value)}
              placeholder="2020"
            />
          </FormField>
          <FormField label="Kondisi">
            <SearchableSelect
              value={form.kondisi}
              onChange={(v) => set("kondisi", v)}
              options={KONDISI_OPTIONS.map((o) => ({ value: o, label: o }))}
              placeholder="—"
            />
          </FormField>
          <FormField label="Status" required>
            <SearchableSelect
              value={form.status}
              onChange={(v) => set("status", v)}
              options={STATUS_OPTIONS.map((o) => ({ value: o, label: o }))}
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
