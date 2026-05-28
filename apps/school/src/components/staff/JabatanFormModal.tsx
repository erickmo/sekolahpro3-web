import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useResourceCreate } from "@sekolahpro/api-client";
import { Button, FormField, FormGrid, Input, Modal, SearchableSelect, Textarea } from "@sekolahpro/ui";

interface JabatanFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

interface FormState {
  nama_jabatan: string;
  keterangan: string;
  aktif: string;
}

const INITIAL: FormState = { nama_jabatan: "", keterangan: "", aktif: "1" };

export function JabatanFormModal({ open, onClose, onCreated }: JabatanFormModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Jenis Jabatan");

  const set = <K extends keyof FormState>(k: K, v: string) =>
    setForm((cur) => ({ ...cur, [k]: v }));

  const reset = () => { setForm(INITIAL); setErr(null); };
  const close = () => { reset(); onClose(); };

  const canSubmit = !!form.nama_jabatan.trim() && !create.isPending;

  const submit = async () => {
    setErr(null);
    try {
      const payload: Record<string, unknown> = {
        nama_jabatan: form.nama_jabatan.trim(),
        aktif: form.aktif === "1" ? 1 : 0,
      };
      if (form.keterangan.trim()) payload.keterangan = form.keterangan.trim();

      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Jenis Jabatan"] });
      onCreated?.(created.name);
      reset();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat jenis jabatan.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="md"
      title="Tambah Jenis Jabatan"
      description="Isi data jenis jabatan. Tanda * wajib."
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
      <div className="space-y-4">
        <FormGrid cols={2}>
          <FormField label="Nama Jabatan" required className="sm:col-span-2">
            <Input
              value={form.nama_jabatan}
              onChange={(e) => set("nama_jabatan", e.target.value)}
              placeholder="Wakil Kepala Sekolah Kurikulum"
            />
          </FormField>
          <FormField label="Aktif">
            <SearchableSelect
              value={form.aktif}
              onChange={(v) => set("aktif", v)}
              options={[
                { value: "1", label: "Aktif" },
                { value: "0", label: "Tidak Aktif" },
              ]}
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
