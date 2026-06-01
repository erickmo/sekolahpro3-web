/**
 * AsetFormModal — create form for doctype "Aset".
 *
 * Kategori & lokasi are picked from the active tenant's masters (via
 * useDoctypeOptions + SearchableSelect). jumlah_tersedia is NOT collected — the
 * backend initializes it to jumlah_total on insert. sekolah comes from session.
 */
import { useState } from "react";
import {
  Button,
  FormField,
  Input,
  Modal,
  Select,
  Textarea,
  SearchableSelect,
} from "@sekolahpro/ui";
import { useResourceCreate } from "@sekolahpro/api-client";
import { useSessionStore } from "@sekolahpro/auth";
import { useQueryClient } from "@tanstack/react-query";
import { FormSection, FormError } from "./FormSection";
import { useDoctypeOptions } from "./useDoctypeOptions";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

interface FormState {
  nama: string;
  kode: string;
  kategori: string;
  lokasi: string;
  merk: string;
  jumlah_total: string;
  kondisi: string;
  nilai_perolehan: string;
  tanggal_perolehan: string;
  catatan: string;
}

const KONDISI_OPTIONS = ["Baik", "Rusak Ringan", "Rusak Berat"];

const INITIAL: FormState = {
  nama: "",
  kode: "",
  kategori: "",
  lokasi: "",
  merk: "",
  jumlah_total: "1",
  kondisi: "Baik",
  nilai_perolehan: "",
  tanggal_perolehan: "",
  catatan: "",
};

export function AsetFormModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Aset");
  const sekolah = useSessionStore((s) => s.activeSekolah?.name);
  const kategoriOpts = useDoctypeOptions("Kategori Aset", "nama_kategori");
  const lokasiOpts = useDoctypeOptions("Lokasi Aset", "nama_lokasi");

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
    !!form.kategori &&
    Number(form.jumlah_total) >= 1 &&
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
        kategori: form.kategori,
        jumlah_total: Number(form.jumlah_total),
        kondisi: form.kondisi,
        status: "Tersedia",
        sekolah,
      };
      if (form.lokasi) payload.lokasi = form.lokasi;
      if (form.merk.trim()) payload.merk = form.merk.trim();
      if (form.nilai_perolehan.trim()) payload.nilai_perolehan = Number(form.nilai_perolehan);
      if (form.tanggal_perolehan) payload.tanggal_perolehan = form.tanggal_perolehan;
      if (form.catatan.trim()) payload.catatan = form.catatan.trim();
      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Aset"] });
      reset();
      if (onCreated) onCreated(created.name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat aset.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="mega"
      title="Tambah Aset"
      description="Daftarkan aset baru. Tanda * wajib diisi."
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
        <FormSection title="Identitas Aset" description="Nama, kode, dan pengelompokan.">
          <FormField label="Nama Aset" required>
            <Input value={form.nama} onChange={(e) => set("nama", e.target.value)} placeholder="Bola Sepak Mikasa" />
          </FormField>
          <FormField label="Kode / Tag" required hint="Auto-ID: {sekolah}-{kode}">
            <Input value={form.kode} onChange={(e) => set("kode", e.target.value)} placeholder="BOLA-001" />
          </FormField>
          <FormField label="Kategori" required>
            <SearchableSelect
              value={form.kategori}
              onChange={(v) => set("kategori", v)}
              options={kategoriOpts.options}
              placeholder={kategoriOpts.isLoading ? "Memuat..." : "Pilih kategori"}
            />
          </FormField>
          <FormField label="Lokasi">
            <SearchableSelect
              value={form.lokasi}
              onChange={(v) => set("lokasi", v)}
              options={lokasiOpts.options}
              placeholder={lokasiOpts.isLoading ? "Memuat..." : "Pilih lokasi"}
            />
          </FormField>
          <FormField label="Merk">
            <Input value={form.merk} onChange={(e) => set("merk", e.target.value)} placeholder="Mikasa" />
          </FormField>
        </FormSection>

        <FormSection title="Stok & Kondisi" description="Jumlah unit dan kondisi fisik.">
          <FormField label="Jumlah Total" required hint="Minimal 1">
            <Input type="number" min={1} value={form.jumlah_total} onChange={(e) => set("jumlah_total", e.target.value)} />
          </FormField>
          <FormField label="Kondisi" required>
            <Select value={form.kondisi} onChange={(e) => set("kondisi", e.target.value)}>
              {KONDISI_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Nilai Perolehan (Rp)">
            <Input type="number" min={0} value={form.nilai_perolehan} onChange={(e) => set("nilai_perolehan", e.target.value)} placeholder="150000" />
          </FormField>
          <FormField label="Tanggal Perolehan">
            <Input type="date" value={form.tanggal_perolehan} onChange={(e) => set("tanggal_perolehan", e.target.value)} />
          </FormField>
          <FormField label="Catatan">
            <Textarea value={form.catatan} onChange={(e) => set("catatan", e.target.value)} rows={2} />
          </FormField>
        </FormSection>
        <FormError message={err} />
      </div>
    </Modal>
  );
}
