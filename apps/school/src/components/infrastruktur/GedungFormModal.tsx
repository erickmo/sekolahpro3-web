/**
 * GedungFormModal — create form modal untuk doctype "Gedung".
 *
 * Source of truth (fields): doctype Gedung di backend Frappe.
 * autoname = format:{sekolah}-{kode} (name auto-generated).
 * sekolah selalu di-set ke sekolah aktif (dari session store) — bukan dipilih
 * manual, supaya gedung selalu ter-scope ke tenant yang sedang dibuka.
 */

import { useState } from "react";
import { Button, FormField, FormGrid, Input, Modal } from "@sekolahpro/ui";
import { useResourceCreate } from "@sekolahpro/api-client";
import { useSessionStore } from "@sekolahpro/auth";
import { useQueryClient } from "@tanstack/react-query";

interface GedungFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

interface FormState {
  nama: string;
  kode: string;
  tahun_dibangun: string;
}

const INITIAL: FormState = {
  nama: "",
  kode: "",
  tahun_dibangun: "",
};

export function GedungFormModal({ open, onClose, onCreated }: GedungFormModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Gedung");
  const sekolah = useSessionStore((s) => s.activeSekolah?.name);

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
    !!sekolah &&
    !create.isPending;

  const submit = async () => {
    setErr(null);
    if (!sekolah) {
      setErr("Sekolah aktif tidak ditemukan.");
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        nama: form.nama.trim(),
        kode: form.kode.trim(),
        sekolah,
      };
      if (form.tahun_dibangun.trim()) payload.tahun_dibangun = Number(form.tahun_dibangun);

      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Gedung"] });
      reset();
      if (onCreated) onCreated(created.name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat gedung.");
    }
  };

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
          <FormField label="Tahun Dibangun">
            <Input
              type="number"
              min={0}
              value={form.tahun_dibangun}
              onChange={(e) => set("tahun_dibangun", e.target.value)}
              placeholder="2020"
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
