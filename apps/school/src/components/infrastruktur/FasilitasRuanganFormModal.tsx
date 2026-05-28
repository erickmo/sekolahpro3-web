/**
 * FasilitasRuanganFormModal — create modal untuk CHILD doctype "Fasilitas Ruangan".
 *
 * Child table dari Ruangan (parentfield = "fasilitas"). Payload wajib
 * menyertakan parent/parenttype/parentfield untuk dibuat via REST.
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  FormField,
  FormGrid,
  Input,
  Modal,
  SearchableSelect,
} from "@sekolahpro/ui";
import { useResourceCreate, useResourceList } from "@sekolahpro/api-client";

type RuanganRow = { name: string; nama?: string };

const KONDISI_OPTIONS = ["Baik", "Rusak"] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

export function FasilitasRuanganFormModal({ open, onClose, onCreated }: Props) {
  const qc = useQueryClient();
  const [parent, setParent] = useState("");
  const [namaFasilitas, setNamaFasilitas] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [kondisi, setKondisi] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  const create = useResourceCreate<{ name: string }>("Fasilitas Ruangan");

  const ruanganQ = useResourceList<RuanganRow>("Ruangan", {
    fields: ["name", "nama"],
    limit_page_length: 0,
  });

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

  const requiredMissing = !parent || !namaFasilitas.trim();

  const submit = async () => {
    setErr(null);
    const payload: Record<string, unknown> = {
      parent,
      parenttype: "Ruangan",
      parentfield: "fasilitas",
      nama_fasilitas: namaFasilitas.trim(),
    };
    if (jumlah.trim()) {
      const n = Number(jumlah);
      if (!Number.isNaN(n)) payload.jumlah = n;
    }
    if (kondisi) payload.kondisi = kondisi;
    try {
      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Fasilitas Ruangan"] });
      onCreated?.(created.name);
      reset();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat fasilitas ruangan.");
    }
  };

  const ruanganRows = ruanganQ.data ?? [];

  return (
    <Modal
      open={open}
      onClose={closeAll}
      size="lg"
      title="Tambah Fasilitas Ruangan"
      description="Pilih ruangan tujuan lalu isi data fasilitas. Tanda * wajib."
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={closeAll}>
            Batal
          </Button>
          <Button onClick={submit} disabled={requiredMissing || create.isPending}>
            {create.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormGrid cols={2}>
          <FormField label="Ruangan" required>
            <SearchableSelect
              value={parent}
              onChange={(v) => setParent(v)}
              options={ruanganRows.map((r) => ({
                value: r.name,
                label: `${r.name}${r.nama ? ` — ${r.nama}` : ""}`,
              }))}
              placeholder="— pilih —"
            />
          </FormField>
          <FormField label="Nama Fasilitas" required>
            <Input
              value={namaFasilitas}
              onChange={(e) => setNamaFasilitas(e.target.value)}
            />
          </FormField>
          <FormField label="Jumlah">
            <Input
              type="number"
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value)}
            />
          </FormField>
          <FormField label="Kondisi">
            <SearchableSelect
              value={kondisi}
              onChange={(v) => setKondisi(v)}
              options={KONDISI_OPTIONS.map((o) => ({ value: o, label: o }))}
              placeholder="— pilih —"
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
