/**
 * RuanganFormModal — create modal untuk doctype "Ruangan".
 *
 * autoname backend: format:{lantai}-{kode}
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

type LantaiRow = { name: string; gedung?: string; nomor_lantai?: number };
type GedungRow = { name: string; nama?: string };
type SekolahRow = { name: string; nama_sekolah?: string };

const JENIS_OPTIONS = [
  "Kelas",
  "Lab",
  "Perpustakaan",
  "Aula",
  "Kamar Asrama",
  "Musholla",
  "Kantor",
  "Gudang",
  "Lainnya",
] as const;

const STATUS_OPTIONS = ["Tersedia", "Dipakai", "Maintenance"] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

export function RuanganFormModal({ open, onClose, onCreated }: Props) {
  const qc = useQueryClient();
  const [nama, setNama] = useState("");
  const [kode, setKode] = useState("");
  const [lantai, setLantai] = useState("");
  const [gedung, setGedung] = useState("");
  const [sekolah, setSekolah] = useState("");
  const [jenisRuangan, setJenisRuangan] = useState<string>("Kelas");
  const [kapasitas, setKapasitas] = useState("");
  const [luasM2, setLuasM2] = useState("");
  const [status, setStatus] = useState<string>("Tersedia");
  const [err, setErr] = useState<string | null>(null);

  const create = useResourceCreate<{ name: string }>("Ruangan");

  const lantaiQ = useResourceList<LantaiRow>("Lantai", {
    fields: ["name", "gedung", "nomor_lantai"],
    limit_page_length: 0,
  });
  const gedungQ = useResourceList<GedungRow>("Gedung", {
    fields: ["name", "nama"],
    limit_page_length: 0,
  });
  const sekolahQ = useResourceList<SekolahRow>("Sekolah", {
    fields: ["name", "nama_sekolah"],
    limit_page_length: 0,
  });

  const reset = () => {
    setNama("");
    setKode("");
    setLantai("");
    setGedung("");
    setSekolah("");
    setJenisRuangan("Kelas");
    setKapasitas("");
    setLuasM2("");
    setStatus("Tersedia");
    setErr(null);
  };

  const closeAll = () => {
    reset();
    onClose();
  };

  const requiredMissing =
    !nama.trim() || !kode.trim() || !lantai || !jenisRuangan || !status;

  const submit = async () => {
    setErr(null);
    const payload: Record<string, unknown> = {
      nama: nama.trim(),
      kode: kode.trim(),
      lantai,
      jenis_ruangan: jenisRuangan,
      status,
    };
    if (gedung) payload.gedung = gedung;
    if (sekolah) payload.sekolah = sekolah;
    if (kapasitas.trim()) {
      const n = parseInt(kapasitas, 10);
      if (!Number.isNaN(n)) payload.kapasitas = n;
    }
    if (luasM2.trim()) {
      const n = parseFloat(luasM2);
      if (!Number.isNaN(n)) payload.luas_m2 = n;
    }
    try {
      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Ruangan"] });
      onCreated?.(created.name);
      reset();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat ruangan.");
    }
  };

  const lantaiRows = lantaiQ.data ?? [];
  const gedungRows = gedungQ.data ?? [];
  const sekolahRows = sekolahQ.data ?? [];

  return (
    <Modal
      open={open}
      onClose={closeAll}
      size="xl"
      title="Tambah Ruangan"
      description="Isi data ruangan. Tanda * wajib."
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
          <FormField label="Nama" required>
            <Input value={nama} onChange={(e) => setNama(e.target.value)} />
          </FormField>
          <FormField label="Kode" required>
            <Input value={kode} onChange={(e) => setKode(e.target.value)} />
          </FormField>
          <FormField label="Lantai" required>
            <SearchableSelect
              value={lantai}
              onChange={(v) => setLantai(v)}
              options={lantaiRows.map((r) => ({ value: r.name, label: r.name }))}
              placeholder="— pilih —"
            />
          </FormField>
          <FormField label="Gedung">
            <SearchableSelect
              value={gedung}
              onChange={(v) => setGedung(v)}
              options={gedungRows.map((r) => ({
                value: r.name,
                label: `${r.name}${r.nama ? ` — ${r.nama}` : ""}`,
              }))}
              placeholder="— pilih —"
            />
          </FormField>
          <FormField label="Sekolah">
            <SearchableSelect
              value={sekolah}
              onChange={(v) => setSekolah(v)}
              options={sekolahRows.map((r) => ({ value: r.name, label: r.name }))}
              placeholder="— pilih —"
            />
          </FormField>
          <FormField label="Jenis Ruangan" required>
            <SearchableSelect
              value={jenisRuangan}
              onChange={(v) => setJenisRuangan(v)}
              options={JENIS_OPTIONS.map((o) => ({ value: o, label: o }))}
            />
          </FormField>
          <FormField label="Kapasitas">
            <Input
              type="number"
              value={kapasitas}
              onChange={(e) => setKapasitas(e.target.value)}
            />
          </FormField>
          <FormField label="Luas (m²)">
            <Input
              type="number"
              step="0.01"
              value={luasM2}
              onChange={(e) => setLuasM2(e.target.value)}
            />
          </FormField>
          <FormField label="Status" required>
            <SearchableSelect
              value={status}
              onChange={(v) => setStatus(v)}
              options={STATUS_OPTIONS.map((o) => ({ value: o, label: o }))}
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
