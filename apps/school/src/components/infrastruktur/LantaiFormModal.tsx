import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useResourceCreate, useResourceList } from "@sekolahpro/api-client";
import { Modal, Button, FormField, FormGrid, Input, Select } from "@sekolahpro/ui";

interface LantaiFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

type GedungRow = { name: string; nama?: string };

export function LantaiFormModal({ open, onClose, onCreated }: LantaiFormModalProps) {
  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Lantai");
  const gedungQ = useResourceList<GedungRow>("Gedung", {
    fields: ["name", "nama"],
    limit_page_length: 0,
  });

  const [nama, setNama] = useState("");
  const [nomorLantai, setNomorLantai] = useState("");
  const [gedung, setGedung] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const reset = () => {
    setNama("");
    setNomorLantai("");
    setGedung("");
    setErr(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const canSubmit =
    nama.trim().length > 0 &&
    nomorLantai.trim().length > 0 &&
    gedung.trim().length > 0 &&
    !create.isPending;

  const submit = async () => {
    setErr(null);
    try {
      const created = await create.mutateAsync({
        nama: nama.trim(),
        nomor_lantai: Number(nomorLantai),
        gedung,
      });
      await qc.invalidateQueries({ queryKey: ["resource:list", "Lantai"] });
      onCreated?.(created.name);
      reset();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat lantai.");
    }
  };

  const gedungOptions = gedungQ.data ?? [];

  return (
    <Modal
      open={open}
      onClose={close}
      size="md"
      title="Tambah Lantai"
      description="Isi data lantai. Tanda * wajib."
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
      <FormGrid cols={2}>
        <FormField label="Gedung" required>
          <Select value={gedung} onChange={(e) => setGedung(e.target.value)}>
            <option value="">
              {gedungQ.isLoading ? "Memuat..." : "— Pilih gedung —"}
            </option>
            {gedungOptions.map((g) => (
              <option key={g.name} value={g.name}>
                {g.nama ? `${g.name} — ${g.nama}` : g.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Nomor Lantai" required>
          <Input
            type="number"
            value={nomorLantai}
            onChange={(e) => setNomorLantai(e.target.value)}
            min={0}
          />
        </FormField>
        <FormField label="Nama" required className="sm:col-span-2">
          <Input value={nama} onChange={(e) => setNama(e.target.value)} />
        </FormField>
      </FormGrid>
      {err && (
        <div className="mt-4 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {err}
        </div>
      )}
    </Modal>
  );
}
