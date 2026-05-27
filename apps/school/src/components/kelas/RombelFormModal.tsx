/**
 * RombelFormModal — create form modal untuk doctype "Rombongan Belajar".
 *
 * Source of truth (fields): doctype Rombongan Belajar di backend Frappe.
 * autoname = format:{tahun_ajaran}-{nama_rombel} (name auto-generated).
 */

import { useState } from "react";
import { Button, FormField, FormGrid, Input, Modal, Select } from "@sekolahpro/ui";
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
            <Select
              value={form.tahun_ajaran}
              onChange={(e) => set("tahun_ajaran", e.target.value)}
              disabled={tahunAjaranQ.isLoading}
            >
              <option value="">
                {tahunAjaranQ.isLoading ? "Memuat..." : "— Pilih Tahun Ajaran —"}
              </option>
              {tahunAjaranOpts.map((t) => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Jenjang" required>
            <Select
              value={form.jenjang}
              onChange={(e) => set("jenjang", e.target.value)}
              disabled={jenjangQ.isLoading}
            >
              <option value="">
                {jenjangQ.isLoading ? "Memuat..." : "— Pilih Jenjang —"}
              </option>
              {jenjangOpts.map((j) => (
                <option key={j.name} value={j.name}>{j.name}</option>
              ))}
            </Select>
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
            <Select
              value={form.sekolah}
              onChange={(e) => set("sekolah", e.target.value)}
              disabled={sekolahQ.isLoading}
            >
              <option value="">
                {sekolahQ.isLoading ? "Memuat..." : "— Pilih Sekolah —"}
              </option>
              {sekolahOpts.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.nama_sekolah ?? s.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Wali Kelas">
            <Select
              value={form.wali_kelas}
              onChange={(e) => set("wali_kelas", e.target.value)}
              disabled={userQ.isLoading}
            >
              <option value="">
                {userQ.isLoading ? "Memuat..." : "— Pilih Wali Kelas —"}
              </option>
              {userOpts.map((u) => (
                <option key={u.name} value={u.name}>
                  {u.full_name ? `${u.full_name} (${u.name})` : u.name}
                </option>
              ))}
            </Select>
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
            <Select
              value={form.ruangan}
              onChange={(e) => set("ruangan", e.target.value)}
              disabled={ruanganQ.isLoading}
            >
              <option value="">
                {ruanganQ.isLoading ? "Memuat..." : "— Pilih Ruangan —"}
              </option>
              {ruanganOpts.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.nama ?? r.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Status" required>
            <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </Select>
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
