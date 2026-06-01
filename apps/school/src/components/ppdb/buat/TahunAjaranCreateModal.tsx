/**
 * Modal pembuatan Tahun Ajaran cepat dari langkah Gelombang wizard "Buat PPDB".
 * Diekstrak dari buatPanel.tsx tanpa perubahan perilaku.
 */

import { useState } from "react";
import { Alert, Button, DatePicker, Modal, SearchableSelect } from "@sekolahpro/ui";
import { useResourceCreate } from "@sekolahpro/api-client";
import { Field } from "./primitives";
import { inputCls } from "./types";

/** Modal pembuatan Tahun Ajaran cepat dari langkah Gelombang. */
export function TahunAjaranCreateModal({
  open,
  onClose,
  onCreated,
  sekolahOpts,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (name: string) => void;
  sekolahOpts: { value: string; label: string }[];
}) {
  const [form, setForm] = useState({
    nama: "",
    sekolah: "",
    tanggal_mulai: "",
    tanggal_selesai: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const create = useResourceCreate<{ name: string }>("Tahun Ajaran");

  const reset = () => {
    setForm({ nama: "", sekolah: "", tanggal_mulai: "", tanggal_selesai: "" });
    setErr(null);
  };

  const canSubmit =
    !!form.nama && !!form.sekolah && !!form.tanggal_mulai && !!form.tanggal_selesai;

  const submit = async () => {
    setErr(null);
    try {
      const r = await create.mutateAsync({
        nama: form.nama,
        sekolah: form.sekolah,
        tanggal_mulai: form.tanggal_mulai,
        tanggal_selesai: form.tanggal_selesai,
        status: "Aktif",
      });
      reset();
      onCreated(r.name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat tahun ajaran.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Buat Tahun Ajaran"
      description="Nama akan digabung dengan kode sekolah secara otomatis."
      size="md"
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Batal
          </Button>
          <Button onClick={submit} disabled={!canSubmit || create.isPending}>
            {create.isPending ? "Membuat..." : "Buat"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nama *" cols={2}>
          <input
            value={form.nama}
            onChange={(e) => setForm((s) => ({ ...s, nama: e.target.value }))}
            className={inputCls}
            placeholder="2026-2027"
          />
        </Field>
        <Field label="Sekolah *" cols={2}>
          <SearchableSelect
            value={form.sekolah}
            onChange={(v) => setForm((s) => ({ ...s, sekolah: v }))}
            options={sekolahOpts}
            placeholder="Pilih sekolah..."
          />
        </Field>
        <Field label="Tanggal Mulai *">
          <DatePicker
            value={form.tanggal_mulai}
            onChange={(v) => setForm((s) => ({ ...s, tanggal_mulai: v }))}
            className={inputCls}
          />
        </Field>
        <Field label="Tanggal Selesai *">
          <DatePicker
            value={form.tanggal_selesai}
            onChange={(v) => setForm((s) => ({ ...s, tanggal_selesai: v }))}
            className={inputCls}
          />
        </Field>
      </div>
      {err && (
        <div className="mt-3">
          <Alert tone="danger" title="Gagal">
            {err}
          </Alert>
        </div>
      )}
    </Modal>
  );
}
