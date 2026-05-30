/**
 * FasilitasRuanganFormModal — create/edit modal untuk CHILD doctype
 * "Fasilitas Ruangan".
 *
 * Child table dari Ruangan (parentfield = "fasilitas"). Saat create payload
 * wajib menyertakan parent/parenttype/parentfield. Saat edit hanya kirim
 * field nilai (parent tidak diubah).
 * defaultGedung: filter daftar ruangan ke gedung tsb.
 */

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, FormField, FormGrid, Input, Modal, Select } from "@sekolahpro/ui";
import {
  useResourceCreate,
  useResourceDoc,
  useResourceList,
  useResourceUpdate,
} from "@sekolahpro/api-client";

type RuanganRow = { name: string; nama?: string };

const KONDISI_OPTIONS = ["Baik", "Rusak"] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
  defaultGedung?: string;
  editName?: string;
}

export function FasilitasRuanganFormModal({ open, onClose, onCreated, defaultGedung, editName }: Props) {
  const qc = useQueryClient();
  const [parent, setParent] = useState("");
  const [namaFasilitas, setNamaFasilitas] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [kondisi, setKondisi] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  const create = useResourceCreate<{ name: string }>("Fasilitas Ruangan");
  const update = useResourceUpdate<{ name: string }>("Fasilitas Ruangan");
  const docQ = useResourceDoc<Record<string, unknown>>("Fasilitas Ruangan", editName, { enabled: !!editName });

  const ruanganQ = useResourceList<RuanganRow>("Ruangan", {
    fields: ["name", "nama"],
    filters: defaultGedung ? [["gedung", "=", defaultGedung]] : [],
    limit_page_length: 0,
  });

  useEffect(() => {
    if (!docQ.data) return;
    const d = docQ.data as Record<string, unknown>;
    setNamaFasilitas(`${d.nama_fasilitas ?? ""}`);
    setJumlah(`${d.jumlah ?? ""}`);
    setKondisi(`${d.kondisi ?? ""}`);
    if (d.parent) setParent(`${d.parent}`);
  }, [docQ.data]);

  const reset = () => {
    setParent("");
    setNamaFasilitas("");
    setJumlah("");
    setKondisi("");
    setErr(null);
  };

  const closeAll = () => {
    reset();
    onClose();
  };

  const requiredMissing = !namaFasilitas.trim() || (!editName && !parent);
  const pending = create.isPending || update.isPending;

  const submit = async () => {
    setErr(null);
    const patch: Record<string, unknown> = { nama_fasilitas: namaFasilitas.trim() };
    if (jumlah.trim()) {
      const n = Number(jumlah);
      if (!Number.isNaN(n)) patch.jumlah = n;
    }
    if (kondisi) patch.kondisi = kondisi;
    try {
      const name = editName
        ? (await update.mutateAsync({ name: editName, patch })).name
        : (await create.mutateAsync({ ...patch, parent, parenttype: "Ruangan", parentfield: "fasilitas" })).name;
      await qc.invalidateQueries({ queryKey: ["resource:list", "Fasilitas Ruangan"] });
      onCreated?.(name);
      reset();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal menyimpan fasilitas.");
    }
  };

  const ruanganRows = ruanganQ.data ?? [];

  return (
    <Modal
      open={open}
      onClose={closeAll}
      size="lg"
      title={editName ? "Edit Fasilitas" : "Tambah Fasilitas"}
      description="Pilih ruangan tujuan lalu isi data fasilitas. Tanda * wajib."
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={closeAll}>
            Batal
          </Button>
          <Button onClick={submit} disabled={requiredMissing || pending}>
            {pending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormGrid cols={2}>
          <FormField label="Ruangan" required>
            <Select aria-label="Ruangan" value={parent} onChange={(e) => setParent(e.target.value)} disabled={!!editName}>
              <option value="">— pilih —</option>
              {ruanganRows.map((r) => (
                <option key={r.name} value={r.name}>{r.nama ? `${r.name} — ${r.nama}` : r.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Nama Fasilitas" required>
            <Input
              aria-label="Nama Fasilitas"
              value={namaFasilitas}
              onChange={(e) => setNamaFasilitas(e.target.value)}
            />
          </FormField>
          <FormField label="Jumlah">
            <Input
              aria-label="Jumlah"
              type="number"
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value)}
            />
          </FormField>
          <FormField label="Kondisi">
            <Select aria-label="Kondisi" value={kondisi} onChange={(e) => setKondisi(e.target.value)}>
              <option value="">— pilih —</option>
              {KONDISI_OPTIONS.map((o) => (
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
