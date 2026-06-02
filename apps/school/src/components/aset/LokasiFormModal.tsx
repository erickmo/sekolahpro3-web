/**
 * LokasiFormModal — create form for doctype "Lokasi Aset" (storage/warehouse).
 *
 * sekolah is taken from the session store so the location is scoped to the
 * active tenant. `ruangan` (link to Infrastruktur Ruangan) is intentionally
 * omitted from this quick-create form; it can be set later in Desk if needed.
 */
import { useState } from "react";
import { Button, FormField, Input, Modal, Select, Textarea } from "@sekolahpro/ui";
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
  nama_lokasi: string;
  kode: string;
  jenis_lokasi: string;
  penanggung_jawab: string;
  kapasitas: string;
  keterangan: string;
}

const JENIS_OPTIONS = ["Gudang", "Ruang Penyimpanan", "Lapangan", "Lab", "Kelas", "Lainnya"];

const INITIAL: FormState = {
  nama_lokasi: "",
  kode: "",
  jenis_lokasi: "Gudang",
  penanggung_jawab: "",
  kapasitas: "",
  keterangan: "",
};

export function LokasiFormModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Lokasi Aset");
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

  const canSubmit = !!form.nama_lokasi.trim() && !!form.kode.trim() && !!sekolah && !create.isPending;

  const submit = async () => {
    setErr(null);
    if (!sekolah) {
      setErr("Sekolah aktif tidak ditemukan.");
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        nama_lokasi: form.nama_lokasi.trim(),
        kode: form.kode.trim(),
        jenis_lokasi: form.jenis_lokasi,
        status: "Aktif",
        sekolah,
      };
      if (form.penanggung_jawab.trim()) payload.penanggung_jawab = form.penanggung_jawab.trim();
      if (form.kapasitas.trim()) payload.kapasitas = Number(form.kapasitas);
      if (form.keterangan.trim()) payload.keterangan = form.keterangan.trim();
      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Lokasi Aset"] });
      reset();
      if (onCreated) onCreated(created.name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat lokasi.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Tambah Lokasi Aset"
      description="Gudang / ruang penyimpanan aset. Tanda * wajib diisi."
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
        <FormSection title="Data Lokasi" description="Tempat penyimpanan dalam sekolah aktif.">
          <FormField label="Nama Lokasi" required>
            <Input value={form.nama_lokasi} onChange={(e) => set("nama_lokasi", e.target.value)} placeholder="Gudang Olahraga" />
          </FormField>
          <FormField label="Kode" required hint="Auto-ID: {sekolah}-{kode}">
            <Input value={form.kode} onChange={(e) => set("kode", e.target.value)} placeholder="GDO" />
          </FormField>
          <FormField label="Jenis Lokasi" required>
            <Select value={form.jenis_lokasi} onChange={(e) => set("jenis_lokasi", e.target.value)}>
              {JENIS_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Penanggung Jawab">
            <Input value={form.penanggung_jawab} onChange={(e) => set("penanggung_jawab", e.target.value)} placeholder="Nama PJ" />
          </FormField>
          <FormField label="Kapasitas" hint="0 = tidak dibatasi">
            <Input type="number" min={0} value={form.kapasitas} onChange={(e) => set("kapasitas", e.target.value)} placeholder="100" />
          </FormField>
          <FormField label="Keterangan">
            <Textarea value={form.keterangan} onChange={(e) => set("keterangan", e.target.value)} rows={2} />
          </FormField>
        </FormSection>
        <FormError message={err} />
      </div>
    </Modal>
  );
}
