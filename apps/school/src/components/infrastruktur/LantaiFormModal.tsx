import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { humanizeFrappeError, useResourceCreate, useResourceDoc, useResourceList, useResourceUpdate } from "@sekolahpro/api-client";
import { Modal, Button, FormField, FormGrid, Input, SearchableSelect } from "@sekolahpro/ui";

interface LantaiFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
  /** Bila di-set, gedung dikunci ke nilai ini (select disembunyikan). */
  defaultGedung?: string;
  /** Bila di-set → mode edit. */
  editName?: string;
}

type GedungRow = { name: string; nama?: string };

export function LantaiFormModal({ open, onClose, onCreated, defaultGedung, editName }: LantaiFormModalProps) {
  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Lantai");
  const update = useResourceUpdate<{ name: string }>("Lantai");
  const docQ = useResourceDoc<Record<string, unknown>>("Lantai", editName, { enabled: !!editName });
  const gedungQ = useResourceList<GedungRow>("Gedung", {
    fields: ["name", "nama"],
    limit_page_length: 0,
  });

  const [nama, setNama] = useState("");
  const [nomorLantai, setNomorLantai] = useState("");
  const [gedung, setGedung] = useState(defaultGedung ?? "");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (docQ.data) {
      const d = docQ.data as Record<string, unknown>;
      setNama(`${d.nama ?? ""}`);
      setNomorLantai(`${d.nomor_lantai ?? ""}`);
      setGedung(`${d.gedung ?? defaultGedung ?? ""}`);
    } else if (!editName && defaultGedung) {
      setGedung(defaultGedung);
    }
  }, [docQ.data, defaultGedung, editName]);

  const reset = () => {
    setNama("");
    setNomorLantai("");
    setGedung(defaultGedung ?? "");
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
    !create.isPending &&
    !update.isPending;

  const submit = async () => {
    setErr(null);
    try {
      let name: string;
      if (editName) {
        name = (await update.mutateAsync({ name: editName, patch: { nama: nama.trim(), nomor_lantai: Number(nomorLantai) } })).name;
      } else {
        name = (await create.mutateAsync({ nama: nama.trim(), nomor_lantai: Number(nomorLantai), gedung })).name;
      }
      await qc.invalidateQueries({ queryKey: ["resource:list", "Lantai"] });
      onCreated?.(name);
      reset();
      onClose();
    } catch (e) {
      setErr(humanizeFrappeError(e) ?? (e as Error)?.message ?? "Gagal menyimpan lantai.");
    }
  };

  const gedungOptions = gedungQ.data ?? [];
  const pending = create.isPending || update.isPending;

  return (
    <Modal
      open={open}
      onClose={close}
      size="md"
      title={editName ? "Edit Lantai" : "Tambah Lantai"}
      description="Isi data lantai. Tanda * wajib."
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close}>Batal</Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {pending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      }
    >
      <FormGrid cols={2}>
        {!defaultGedung && (
          <FormField label="Gedung" required>
            <SearchableSelect
              value={gedung}
              onChange={(v) => setGedung(v)}
              disabled={gedungQ.isLoading}
              options={gedungOptions.map((g) => ({
                value: g.name,
                label: g.nama ? `${g.name} — ${g.nama}` : g.name,
              }))}
              placeholder={gedungQ.isLoading ? "Memuat..." : "— Pilih gedung —"}
            />
          </FormField>
        )}
        <FormField label="Nomor Lantai" required>
          <Input
            aria-label="Nomor Lantai"
            type="number"
            value={nomorLantai}
            onChange={(e) => setNomorLantai(e.target.value)}
            min={0}
          />
        </FormField>
        <FormField label="Nama" required className="sm:col-span-2">
          <Input aria-label="Nama" value={nama} onChange={(e) => setNama(e.target.value)} />
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
