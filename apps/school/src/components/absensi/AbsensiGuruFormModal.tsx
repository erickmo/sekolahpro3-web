/**
 * AbsensiGuruFormModal — create form modal untuk doctype "Absensi Guru".
 *
 * Header-only create. Detail kehadiran guru ditambahkan di halaman detail.
 * Source of truth: doctype Absensi Guru (akademik).
 */

import { useState } from "react";
import { Button, DatePicker, FormField, FormGrid, Modal, SearchableSelect } from "@sekolahpro/ui";
import { useResourceCreate, useResourceList } from "@sekolahpro/api-client";
import { useQueryClient } from "@tanstack/react-query";

type SekolahRow = { name: string; nama_sekolah?: string };
type TahunAjaranRow = { name: string; tahun?: string };

const SEMESTER_OPTIONS = ["Ganjil", "Genap"] as const;
const SUMBER_OPTIONS = ["Manual", "Sync"] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

interface FormState {
  tanggal: string;
  tahun_ajaran: string;
  sekolah: string;
  semester: string;
  sumber_input: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const initial = (): FormState => ({
  tanggal: todayISO(),
  tahun_ajaran: "",
  sekolah: "",
  semester: "",
  sumber_input: "Manual",
});

export function AbsensiGuruFormModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(initial);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Absensi Guru");
  const sekolahQ = useResourceList<SekolahRow>("Sekolah", {
    fields: ["name", "nama_sekolah"],
    limit_page_length: 0,
  });
  const tahunQ = useResourceList<TahunAjaranRow>("Tahun Ajaran", {
    fields: ["name", "tahun"],
    limit_page_length: 0,
  });

  const set = <K extends keyof FormState>(k: K, v: string) =>
    setForm((cur) => ({ ...cur, [k]: v }));

  const reset = () => {
    setForm(initial());
    setErr(null);
  };

  const close = () => {
    if (create.isPending) return;
    reset();
    onClose();
  };

  const canSubmit =
    !!form.tanggal &&
    !!form.tahun_ajaran &&
    !!form.sekolah &&
    !!form.semester &&
    !create.isPending;

  const submit = async () => {
    setErr(null);
    try {
      const payload: Record<string, unknown> = {
        tanggal: form.tanggal,
        tahun_ajaran: form.tahun_ajaran,
        sekolah: form.sekolah,
        semester: form.semester,
      };
      if (form.sumber_input) payload.sumber_input = form.sumber_input;

      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Absensi Guru"] });
      reset();
      if (onCreated) onCreated(created.name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat absensi guru.");
    }
  };

  const sekolahOpts = sekolahQ.data ?? [];
  const tahunOpts = tahunQ.data ?? [];

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Tambah Absensi Guru"
      description="Isi data header presensi guru. Tanda * wajib."
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close} disabled={create.isPending}>Batal</Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {create.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormGrid cols={2}>
          <FormField label="Tanggal" required>
            <DatePicker
              value={form.tanggal}
              onChange={(v) => set("tanggal", v)}
            />
          </FormField>
          <FormField label="Tahun Ajaran" required>
            <SearchableSelect
              value={form.tahun_ajaran}
              onChange={(v) => set("tahun_ajaran", v)}
              disabled={tahunQ.isLoading}
              options={tahunOpts.map((t) => ({ value: t.name, label: t.tahun ?? t.name }))}
              placeholder={tahunQ.isLoading ? "Memuat..." : "— Pilih Tahun Ajaran —"}
            />
          </FormField>
          <FormField label="Sekolah" required>
            <SearchableSelect
              value={form.sekolah}
              onChange={(v) => set("sekolah", v)}
              disabled={sekolahQ.isLoading}
              options={sekolahOpts.map((s) => ({ value: s.name, label: s.nama_sekolah ?? s.name }))}
              placeholder={sekolahQ.isLoading ? "Memuat..." : "— Pilih Sekolah —"}
            />
          </FormField>
          <FormField label="Semester" required>
            <SearchableSelect
              value={form.semester}
              onChange={(v) => set("semester", v)}
              options={SEMESTER_OPTIONS.map((o) => ({ value: o, label: o }))}
              placeholder="— Pilih Semester —"
            />
          </FormField>
          <FormField label="Sumber Input">
            <SearchableSelect
              value={form.sumber_input}
              onChange={(v) => set("sumber_input", v)}
              options={SUMBER_OPTIONS.map((o) => ({ value: o, label: o }))}
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
