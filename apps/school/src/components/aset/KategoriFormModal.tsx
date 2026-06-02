/**
 * KategoriFormModal — create form for doctype "Kategori Aset".
 *
 * sekolah is always set to the active school from the session store (not chosen
 * manually) so the category is always scoped to the open tenant.
 */
import { useState } from "react";
import { Button, FormField, Input, Modal, Textarea } from "@sekolahpro/ui";
import { useResourceCreate } from "@sekolahpro/api-client";
import { useSessionStore } from "@sekolahpro/auth";
import { useQueryClient } from "@tanstack/react-query";
import { FormSection, FormError } from "./FormSection";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

interface FormState {
  nama_kategori: string;
  kode: string;
  deskripsi: string;
}

const INITIAL: FormState = { nama_kategori: "", kode: "", deskripsi: "" };

export function KategoriFormModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Kategori Aset");
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

  const canSubmit = !!form.nama_kategori.trim() && !!form.kode.trim() && !!sekolah && !create.isPending;

  const submit = async () => {
    setErr(null);
    if (!sekolah) {
      setErr("Sekolah aktif tidak ditemukan.");
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        nama_kategori: form.nama_kategori.trim(),
        kode: form.kode.trim(),
        sekolah,
      };
      if (form.deskripsi.trim()) payload.deskripsi = form.deskripsi.trim();
      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Kategori Aset"] });
      reset();
      if (onCreated) onCreated(created.name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat kategori.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Tambah Kategori Aset"
      description="Isi data kategori. Tanda * wajib diisi."
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
        <FormSection title="Data Kategori" description="Pengelompokan aset dalam sekolah aktif.">
          <FormField label="Nama Kategori" required>
            <Input value={form.nama_kategori} onChange={(e) => set("nama_kategori", e.target.value)} placeholder="Alat Olahraga" />
          </FormField>
          <FormField label="Kode" required hint="Dipakai untuk auto-ID: {sekolah}-{kode}">
            <Input value={form.kode} onChange={(e) => set("kode", e.target.value)} placeholder="OLR" />
          </FormField>
          <FormField label="Deskripsi">
            <Textarea value={form.deskripsi} onChange={(e) => set("deskripsi", e.target.value)} rows={2} />
          </FormField>
        </FormSection>
        <FormError message={err} />
      </div>
    </Modal>
  );
}
