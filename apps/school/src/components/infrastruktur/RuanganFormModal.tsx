/**
 * RuanganFormModal — create/edit modal untuk doctype "Ruangan".
 *
 * autoname backend: format:{lantai}-{kode}
 * defaultGedung: kunci konteks gedung → filter daftar lantai + sembunyikan
 * select Gedung/Sekolah (keduanya denorm otomatis di backend dari lantai).
 */

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  FormField,
  FormGrid,
  Input,
  Modal,
  Select,
  SearchableSelect,
} from "@sekolahpro/ui";
import {
  useResourceCreate,
  useResourceDoc,
  useResourceList,
  useResourceUpdate,
} from "@sekolahpro/api-client";

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
  defaultGedung?: string;
  editName?: string;
}

export function RuanganFormModal({ open, onClose, onCreated, defaultGedung, editName }: Props) {
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
  const update = useResourceUpdate<{ name: string }>("Ruangan");
  const docQ = useResourceDoc<Record<string, unknown>>("Ruangan", editName, { enabled: !!editName });

  const lantaiQ = useResourceList<LantaiRow>("Lantai", {
    fields: ["name", "gedung", "nomor_lantai"],
    filters: defaultGedung ? [["gedung", "=", defaultGedung]] : [],
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

  useEffect(() => {
    if (!docQ.data) return;
    const d = docQ.data as Record<string, unknown>;
    setNama(`${d.nama ?? ""}`);
    setKode(`${d.kode ?? ""}`);
    setLantai(`${d.lantai ?? ""}`);
    setJenisRuangan(`${d.jenis_ruangan ?? "Kelas"}`);
    setStatus(`${d.status ?? "Tersedia"}`);
    setKapasitas(`${d.kapasitas ?? ""}`);
    setLuasM2(`${d.luas_m2 ?? ""}`);
  }, [docQ.data]);

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
    const patch: Record<string, unknown> = {
      nama: nama.trim(),
      kode: kode.trim(),
      lantai,
      jenis_ruangan: jenisRuangan,
      status,
    };
    if (!defaultGedung && gedung) patch.gedung = gedung;
    if (!defaultGedung && sekolah) patch.sekolah = sekolah;
    if (kapasitas.trim()) {
      const n = parseInt(kapasitas, 10);
      if (!Number.isNaN(n)) patch.kapasitas = n;
    }
    if (luasM2.trim()) {
      const n = parseFloat(luasM2);
      if (!Number.isNaN(n)) patch.luas_m2 = n;
    }
    try {
      const name = editName
        ? (await update.mutateAsync({ name: editName, patch })).name
        : (await create.mutateAsync(patch)).name;
      await qc.invalidateQueries({ queryKey: ["resource:list", "Ruangan"] });
      onCreated?.(name);
      reset();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal menyimpan ruangan.");
    }
  };

  const lantaiRows = lantaiQ.data ?? [];
  const gedungRows = gedungQ.data ?? [];
  const sekolahRows = sekolahQ.data ?? [];
  const pending = create.isPending || update.isPending;

  return (
    <Modal
      open={open}
      onClose={closeAll}
      size="xl"
      title={editName ? "Edit Ruangan" : "Tambah Ruangan"}
      description="Isi data ruangan. Tanda * wajib."
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
          <FormField label="Nama" required>
            <Input aria-label="Nama" value={nama} onChange={(e) => setNama(e.target.value)} />
          </FormField>
          <FormField label="Kode" required>
            <Input aria-label="Kode" value={kode} onChange={(e) => setKode(e.target.value)} />
          </FormField>
          <FormField label="Lantai" required>
            <Select aria-label="Lantai" value={lantai} onChange={(e) => setLantai(e.target.value)}>
              <option value="">— pilih —</option>
              {lantaiRows.map((r) => (
                <option key={r.name} value={r.name}>{r.name}</option>
              ))}
            </Select>
          </FormField>
          {!defaultGedung && (
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
          )}
          {!defaultGedung && (
            <FormField label="Sekolah">
              <SearchableSelect
                value={sekolah}
                onChange={(v) => setSekolah(v)}
                options={sekolahRows.map((r) => ({ value: r.name, label: r.name }))}
                placeholder="— pilih —"
              />
            </FormField>
          )}
          <FormField label="Jenis Ruangan" required>
            <Select aria-label="Jenis Ruangan" value={jenisRuangan} onChange={(e) => setJenisRuangan(e.target.value)}>
              {JENIS_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Kapasitas">
            <Input
              aria-label="Kapasitas"
              type="number"
              value={kapasitas}
              onChange={(e) => setKapasitas(e.target.value)}
            />
          </FormField>
          <FormField label="Luas (m²)">
            <Input
              aria-label="Luas"
              type="number"
              step="0.01"
              value={luasM2}
              onChange={(e) => setLuasM2(e.target.value)}
            />
          </FormField>
          <FormField label="Status" required>
            <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((o) => (
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
