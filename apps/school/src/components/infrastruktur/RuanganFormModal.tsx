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
  humanizeFrappeError,
  useResourceCreate,
  useResourceDoc,
  useResourceList,
  useResourceUpdate,
} from "@sekolahpro/api-client";

type LantaiRow = { name: string; gedung?: string; nomor_lantai?: number };
type GedungRow = { name: string; nama?: string };
type SekolahRow = { name: string; nama_sekolah?: string };

/** Editable child-table row for the "fasilitas" table on Ruangan. */
type FasilitasRow = { nama_fasilitas: string; jumlah: string; kondisi: string };

const KONDISI_OPTIONS = ["Baik", "Rusak"] as const;
const KONDISI_DEFAULT = "Baik";
const emptyFasilitas = (): FasilitasRow => ({ nama_fasilitas: "", jumlah: "", kondisi: KONDISI_DEFAULT });

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
  const [fasilitas, setFasilitas] = useState<FasilitasRow[]>([]);
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
    // Hydrate child rows: get_doc returns the "fasilitas" child table.
    const rows = Array.isArray(d.fasilitas) ? (d.fasilitas as Record<string, unknown>[]) : [];
    setFasilitas(
      rows.map((r) => ({
        nama_fasilitas: `${r.nama_fasilitas ?? ""}`,
        jumlah: r.jumlah == null ? "" : `${r.jumlah}`,
        kondisi: `${r.kondisi ?? KONDISI_DEFAULT}`,
      })),
    );
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
    setFasilitas([]);
    setErr(null);
  };

  // --- Child-table (fasilitas) editors ---
  const addFasilitas = () => setFasilitas((rows) => [...rows, emptyFasilitas()]);
  const removeFasilitas = (idx: number) =>
    setFasilitas((rows) => rows.filter((_, i) => i !== idx));
  const patchFasilitas = (idx: number, key: keyof FasilitasRow, value: string) =>
    setFasilitas((rows) => rows.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));

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
      const n = parseInt(luasM2, 10);
      if (!Number.isNaN(n)) patch.luas_m2 = n;
    }
    // Child table: drop blank-name rows, coerce jumlah to number. Sent whole →
    // Frappe replaces the child set in one save (parent linkage server-side).
    patch.fasilitas = fasilitas
      .filter((r) => r.nama_fasilitas.trim())
      .map((r) => {
        const row: Record<string, unknown> = { nama_fasilitas: r.nama_fasilitas.trim() };
        if (r.jumlah.trim()) {
          const n = Number(r.jumlah);
          if (!Number.isNaN(n)) row.jumlah = n;
        }
        if (r.kondisi) row.kondisi = r.kondisi;
        return row;
      });
    try {
      const name = editName
        ? (await update.mutateAsync({ name: editName, patch })).name
        : (await create.mutateAsync(patch)).name;
      await qc.invalidateQueries({ queryKey: ["resource:list", "Ruangan"] });
      // Refresh the parent Ruangan doc so the read-only fasilitas list in the
      // gedung-detail expanded row reflects the edited child rows.
      await qc.invalidateQueries({ queryKey: ["resource:doc", "Ruangan"] });
      onCreated?.(name);
      reset();
      onClose();
    } catch (e) {
      setErr(humanizeFrappeError(e) ?? (e as Error)?.message ?? "Gagal menyimpan ruangan.");
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
          <FormField label="Lantai" required htmlFor="ruangan-lantai">
            <SearchableSelect
              id="ruangan-lantai"
              value={lantai}
              onChange={(v) => setLantai(v)}
              options={lantaiRows.map((r) => ({ value: r.name, label: r.name }))}
              placeholder="— pilih —"
            />
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
          <FormField label="Jenis Ruangan" required htmlFor="ruangan-jenis">
            <SearchableSelect
              id="ruangan-jenis"
              value={jenisRuangan}
              onChange={(v) => setJenisRuangan(v)}
              options={JENIS_OPTIONS.map((o) => ({ value: o, label: o }))}
              placeholder="— pilih —"
            />
          </FormField>
          <FormField label="Kapasitas">
            <Input
              aria-label="Kapasitas"
              type="number"
              min="0"
              value={kapasitas}
              // Kapasitas = jumlah orang → bilangan bulat non-negatif. Buang
              // minus & desimal di sumber agar nilai negatif tak pernah masuk state.
              onChange={(e) => setKapasitas(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </FormField>
          <FormField label="Luas (m²)">
            <Input
              aria-label="Luas"
              type="number"
              min="0"
              step="1"
              value={luasM2}
              // Luas dipakai sebagai bilangan bulat (m²) → strip ke digit saja.
              onChange={(e) => setLuasM2(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </FormField>
          <FormField label="Status">
            {/* Status dikelola sistem (default Tersedia / transisi backend) → readonly di form. */}
            <Input aria-label="Status" value={status} readOnly tabIndex={-1} />
          </FormField>
        </FormGrid>

        <div className="space-y-2 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-fg">Fasilitas</div>
            <Button variant="outline" onClick={addFasilitas}>+ Tambah baris</Button>
          </div>
          {fasilitas.length === 0 ? (
            <div className="py-2 text-xs text-muted-fg">Belum ada fasilitas. Klik tombol Tambah baris.</div>
          ) : (
            <div className="space-y-2">
              {fasilitas.map((row, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_6rem_8rem_auto] items-end gap-2">
                  <FormField label={idx === 0 ? "Nama Fasilitas" : ""}>
                    <Input
                      aria-label={`Nama Fasilitas ${idx + 1}`}
                      value={row.nama_fasilitas}
                      onChange={(e) => patchFasilitas(idx, "nama_fasilitas", e.target.value)}
                    />
                  </FormField>
                  <FormField label={idx === 0 ? "Jumlah" : ""}>
                    <Input
                      aria-label={`Jumlah ${idx + 1}`}
                      type="number"
                      value={row.jumlah}
                      onChange={(e) => patchFasilitas(idx, "jumlah", e.target.value)}
                    />
                  </FormField>
                  <FormField label={idx === 0 ? "Kondisi" : ""}>
                    <Select
                      aria-label={`Kondisi ${idx + 1}`}
                      value={row.kondisi}
                      onChange={(e) => patchFasilitas(idx, "kondisi", e.target.value)}
                    >
                      {KONDISI_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </Select>
                  </FormField>
                  <Button variant="outline" onClick={() => removeFasilitas(idx)} aria-label={`Hapus fasilitas ${idx + 1}`}>
                    Hapus
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {err && (
          <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {err}
          </div>
        )}
      </div>
    </Modal>
  );
}
