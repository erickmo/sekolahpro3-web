/**
 * StaffFormModal — create form modal for doctype "Guru" (staff includes guru + non-pengajar).
 *
 * Source of truth: doctype Guru. autoname = format:GURU-{####}.
 * Required server-side: nama_lengkap, user, nik, tanggal_lahir, jenis_kelamin, status_kepegawaian, sekolah.
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useResourceCreate, useResourceList } from "@sekolahpro/api-client";
import { Button, FormField, FormGrid, Input, Modal, Select } from "@sekolahpro/ui";

type SekolahRow = { name: string; nama_sekolah?: string };

const JK_OPTIONS = ["Laki-laki", "Perempuan"] as const;
const AGAMA_OPTIONS = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"] as const;
const STATUS_KEP_OPTIONS = ["PNS", "PPPK", "GTY", "GTT", "Honorer"] as const;
const PENDIDIKAN_OPTIONS = ["SMA", "D3", "S1", "S2", "S3"] as const;

interface StaffFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

interface FormState {
  nama_lengkap: string;
  user: string;
  nik: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  agama: string;
  no_hp: string;
  email_pribadi: string;
  nip: string;
  nuptk: string;
  status_kepegawaian: string;
  sekolah: string;
  pendidikan_terakhir: string;
  jabatan_fungsional: string;
  tmt_pertama_kerja: string;
}

const INITIAL: FormState = {
  nama_lengkap: "",
  user: "",
  nik: "",
  tanggal_lahir: "",
  jenis_kelamin: "",
  agama: "",
  no_hp: "",
  email_pribadi: "",
  nip: "",
  nuptk: "",
  status_kepegawaian: "",
  sekolah: "",
  pendidikan_terakhir: "",
  jabatan_fungsional: "",
  tmt_pertama_kerja: "",
};

export function StaffFormModal({ open, onClose, onCreated }: StaffFormModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Guru");
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
    !!form.nama_lengkap.trim() &&
    !!form.user.trim() &&
    !!form.nik.trim() &&
    form.nik.trim().length === 16 &&
    !!form.tanggal_lahir &&
    !!form.jenis_kelamin &&
    !!form.status_kepegawaian &&
    !!form.sekolah &&
    !create.isPending;

  const submit = async () => {
    setErr(null);
    try {
      const payload: Record<string, unknown> = {
        nama_lengkap: form.nama_lengkap.trim(),
        user: form.user.trim(),
        nik: form.nik.trim(),
        tanggal_lahir: form.tanggal_lahir,
        jenis_kelamin: form.jenis_kelamin,
        status_kepegawaian: form.status_kepegawaian,
        sekolah: form.sekolah,
        is_aktif: 1,
      };
      if (form.agama) payload.agama = form.agama;
      if (form.no_hp.trim()) payload.no_hp = form.no_hp.trim();
      if (form.email_pribadi.trim()) payload.email_pribadi = form.email_pribadi.trim();
      if (form.nip.trim()) payload.nip = form.nip.trim();
      if (form.nuptk.trim()) payload.nuptk = form.nuptk.trim();
      if (form.pendidikan_terakhir) payload.pendidikan_terakhir = form.pendidikan_terakhir;
      if (form.jabatan_fungsional.trim()) payload.jabatan_fungsional = form.jabatan_fungsional.trim();
      if (form.tmt_pertama_kerja) payload.tmt_pertama_kerja = form.tmt_pertama_kerja;

      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Guru"] });
      onCreated?.(created.name);
      reset();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat data staff.");
    }
  };

  const sekolahOpts = sekolahQ.data ?? [];

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Tambah Staff"
      description="Isi data staff. Tanda * wajib."
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
          <FormField label="Nama Lengkap" required>
            <Input
              value={form.nama_lengkap}
              onChange={(e) => set("nama_lengkap", e.target.value)}
              placeholder="Nama lengkap dengan gelar"
            />
          </FormField>
          <FormField label="User" required hint="Email user Frappe (login)">
            <Input
              type="email"
              value={form.user}
              onChange={(e) => set("user", e.target.value)}
              placeholder="user@sekolah.sch.id"
            />
          </FormField>
          <FormField label="NIK" required hint="16 digit">
            <Input
              value={form.nik}
              onChange={(e) => set("nik", e.target.value.replace(/\D/g, "").slice(0, 16))}
              placeholder="3201xxxxxxxxxxxx"
            />
          </FormField>
          <FormField label="Tanggal Lahir" required>
            <Input
              type="date"
              value={form.tanggal_lahir}
              onChange={(e) => set("tanggal_lahir", e.target.value)}
            />
          </FormField>
          <FormField label="Jenis Kelamin" required>
            <Select value={form.jenis_kelamin} onChange={(e) => set("jenis_kelamin", e.target.value)}>
              <option value="">— Pilih —</option>
              {JK_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
          </FormField>
          <FormField label="Agama">
            <Select value={form.agama} onChange={(e) => set("agama", e.target.value)}>
              <option value="">—</option>
              {AGAMA_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
          </FormField>
          <FormField label="No HP">
            <Input
              value={form.no_hp}
              onChange={(e) => set("no_hp", e.target.value)}
              placeholder="08xxxxxxxxxx"
            />
          </FormField>
          <FormField label="Email Pribadi">
            <Input
              type="email"
              value={form.email_pribadi}
              onChange={(e) => set("email_pribadi", e.target.value)}
            />
          </FormField>
          <FormField label="Status Kepegawaian" required>
            <Select value={form.status_kepegawaian} onChange={(e) => set("status_kepegawaian", e.target.value)}>
              <option value="">— Pilih —</option>
              {STATUS_KEP_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
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
          <FormField label="NIP" hint="Untuk PNS/PPPK">
            <Input value={form.nip} onChange={(e) => set("nip", e.target.value)} />
          </FormField>
          <FormField label="NUPTK">
            <Input value={form.nuptk} onChange={(e) => set("nuptk", e.target.value)} />
          </FormField>
          <FormField label="Pendidikan Terakhir">
            <Select value={form.pendidikan_terakhir} onChange={(e) => set("pendidikan_terakhir", e.target.value)}>
              <option value="">—</option>
              {PENDIDIKAN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
          </FormField>
          <FormField label="Jabatan Fungsional">
            <Input
              value={form.jabatan_fungsional}
              onChange={(e) => set("jabatan_fungsional", e.target.value)}
              placeholder="Guru Madya / Tata Usaha / dll"
            />
          </FormField>
          <FormField label="TMT Pertama Kerja">
            <Input
              type="date"
              value={form.tmt_pertama_kerja}
              onChange={(e) => set("tmt_pertama_kerja", e.target.value)}
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
