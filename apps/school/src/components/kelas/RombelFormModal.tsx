/**
 * RombelFormModal — create form modal untuk doctype "Rombongan Belajar".
 *
 * Source of truth (fields): doctype Rombongan Belajar di backend Frappe.
 * autoname = format:{tahun_ajaran}-{nama_rombel} (name auto-generated).
 */

import { useState } from "react";
import { Button, FormField, FormGrid, Input, Modal, SearchableSelect } from "@sekolahpro/ui";
import { useResourceCreate, useResourceList } from "@sekolahpro/api-client";
import { useQueryClient } from "@tanstack/react-query";

type NameRow = { name: string };
type SekolahRow = { name: string; nama_sekolah?: string };
type UserRow = { name: string; full_name?: string };
type RuanganRow = { name: string; nama?: string };

const STATUS_OPTIONS = ["Aktif", "Ditutup"] as const;

interface RombelFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

interface FormState {
  nama_rombel: string;
  tahun_ajaran: string;
  jenjang: string;
  tingkat: string;
  sekolah: string;
  wali_kelas: string;
  kapasitas: string;
  ruangan: string;
  status: string;
}

const INITIAL: FormState = {
  nama_rombel: "",
  tahun_ajaran: "",
  jenjang: "",
  tingkat: "",
  sekolah: "",
  wali_kelas: "",
  kapasitas: "",
  ruangan: "",
  status: "Aktif",
};

export function RombelFormModal({ open, onClose, onCreated }: RombelFormModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Rombongan Belajar");

  const tahunAjaranQ = useResourceList<NameRow>("Tahun Ajaran", {
    fields: ["name"],
    limit_page_length: 0,
  });
  const jenjangQ = useResourceList<NameRow>("Unit Jenjang", {
    fields: ["name"],
    limit_page_length: 0,
  });
  const sekolahQ = useResourceList<SekolahRow>("Sekolah", {
    fields: ["name", "nama_sekolah"],
    limit_page_length: 0,
  });
  const userQ = useResourceList<UserRow>("User", {
    fields: ["name", "full_name"],
    limit_page_length: 0,
  });
  const ruanganQ = useResourceList<RuanganRow>("Ruangan", {
    fields: ["name", "nama"],
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
    !!form.nama_rombel.trim() &&
    !!form.tahun_ajaran &&
    !!form.jenjang &&
    !!form.tingkat.trim() &&
    !!form.sekolah &&
    !!form.status &&
    !create.isPending;

  const submit = async () => {
    setErr(null);
    try {
      const payload: Record<string, unknown> = {
        nama_rombel: form.nama_rombel.trim(),
        tahun_ajaran: form.tahun_ajaran,
        jenjang: form.jenjang,
        tingkat: Number(form.tingkat),
        sekolah: form.sekolah,
        status: form.status,
      };
      if (form.wali_kelas) payload.wali_kelas = form.wali_kelas;
      if (form.kapasitas.trim()) payload.kapasitas = Number(form.kapasitas);
      if (form.ruangan) payload.ruangan = form.ruangan;

      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Rombongan Belajar"] });
      reset();
      if (onCreated) onCreated(created.name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat rombongan belajar.");
    }
  };

  const tahunAjaranOpts = tahunAjaranQ.data ?? [];
  const jenjangOpts = jenjangQ.data ?? [];
  const sekolahOpts = sekolahQ.data ?? [];
  const userOpts = userQ.data ?? [];
  const ruanganOpts = ruanganQ.data ?? [];

  return (
    <Modal
      open={open}
      onClose={close}
      size="xl"
      title="Tambah Rombongan Belajar"
      description="Isi data rombongan belajar. Tanda * wajib."
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
          <FormField label="Nama Rombel" required hint="Dipakai untuk auto-ID: {tahun_ajaran}-{nama_rombel}">
            <Input
              value={form.nama_rombel}
              onChange={(e) => set("nama_rombel", e.target.value)}
              placeholder="VII-A"
            />
          </FormField>
          <FormField label="Tahun Ajaran" required>
            <SearchableSelect
              value={form.tahun_ajaran}
              onChange={(v) => set("tahun_ajaran", v)}
              disabled={tahunAjaranQ.isLoading}
              options={tahunAjaranOpts.map((t) => ({ value: t.name, label: t.name }))}
              placeholder={tahunAjaranQ.isLoading ? "Memuat..." : "— Pilih Tahun Ajaran —"}
            />
          </FormField>
          <FormField label="Jenjang" required>
            <SearchableSelect
              value={form.jenjang}
              onChange={(v) => set("jenjang", v)}
              disabled={jenjangQ.isLoading}
              options={jenjangOpts.map((j) => ({ value: j.name, label: j.name }))}
              placeholder={jenjangQ.isLoading ? "Memuat..." : "— Pilih Jenjang —"}
            />
          </FormField>
          <FormField label="Tingkat" required>
            <Input
              type="number"
              min={0}
              value={form.tingkat}
              onChange={(e) => set("tingkat", e.target.value)}
              placeholder="7"
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
          <FormField label="Wali Kelas">
            <SearchableSelect
              value={form.wali_kelas}
              onChange={(v) => set("wali_kelas", v)}
              disabled={userQ.isLoading}
              options={userOpts.map((u) => ({
                value: u.name,
                label: u.full_name ? `${u.full_name} (${u.name})` : u.name,
              }))}
              placeholder={userQ.isLoading ? "Memuat..." : "— Pilih Wali Kelas —"}
            />
          </FormField>
          <FormField label="Kapasitas">
            <Input
              type="number"
              min={0}
              value={form.kapasitas}
              onChange={(e) => set("kapasitas", e.target.value)}
              placeholder="32"
            />
          </FormField>
          <FormField label="Ruangan">
            <SearchableSelect
              value={form.ruangan}
              onChange={(v) => set("ruangan", v)}
              disabled={ruanganQ.isLoading}
              options={ruanganOpts.map((r) => ({
                value: r.name,
                label: r.nama ?? r.name,
              }))}
              placeholder={ruanganQ.isLoading ? "Memuat..." : "— Pilih Ruangan —"}
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
