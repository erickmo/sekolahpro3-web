/**
 * PeminjamanFormModal — create form for "Permintaan Peminjaman Aset".
 *
 * Collects requester info + a dynamic list of borrowed assets (aset + jumlah).
 * Created in status Diajukan; approval/return happen later from the detail page
 * (which call the server-side reserve/release endpoints). tanggal_kembali is
 * left to the backend default (Pengaturan) when blank.
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
  IconPlus,
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

interface ItemRow {
  aset: string;
  jumlah: string;
}

interface FormState {
  pemohon: string;
  peran_pemohon: string;
  kontak: string;
  tanggal_pinjam: string;
  keperluan: string;
}

const PERAN_OPTIONS = ["Guru", "Siswa", "Staff", "Ekskul", "Lainnya"];
const todayIso = () => new Date().toISOString().slice(0, 10);

const INITIAL: FormState = {
  pemohon: "",
  peran_pemohon: "Guru",
  kontak: "",
  tanggal_pinjam: todayIso(),
  keperluan: "",
};

export function PeminjamanFormModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [items, setItems] = useState<ItemRow[]>([{ aset: "", jumlah: "1" }]);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Permintaan Peminjaman Aset");
  const sekolah = useSessionStore((s) => s.activeSekolah?.name);
  const asetOpts = useDoctypeOptions("Aset", "nama", [["status", "=", "Tersedia"]]);

  const set = <K extends keyof FormState>(k: K, v: string) =>
    setForm((cur) => ({ ...cur, [k]: v }));

  const setItem = (idx: number, patch: Partial<ItemRow>) =>
    setItems((cur) => cur.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const addItem = () => setItems((cur) => [...cur, { aset: "", jumlah: "1" }]);
  const removeItem = (idx: number) => setItems((cur) => (cur.length > 1 ? cur.filter((_, i) => i !== idx) : cur));

  const reset = () => {
    setForm(INITIAL);
    setItems([{ aset: "", jumlah: "1" }]);
    setErr(null);
  };
  const close = () => {
    reset();
    onClose();
  };

  const validItems = items.filter((it) => it.aset && Number(it.jumlah) >= 1);
  const canSubmit =
    !!form.pemohon.trim() && !!form.keperluan.trim() && validItems.length > 0 && !!sekolah && !create.isPending;

  const submit = async () => {
    setErr(null);
    if (!sekolah) {
      setErr("Sekolah aktif tidak ditemukan.");
      return;
    }
    // Reject duplicate assets early (backend also enforces, but fail fast in UI).
    const uniq = new Set(validItems.map((it) => it.aset));
    if (uniq.size !== validItems.length) {
      setErr("Ada aset yang dipilih lebih dari sekali.");
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        pemohon: form.pemohon.trim(),
        peran_pemohon: form.peran_pemohon,
        tanggal_pinjam: form.tanggal_pinjam,
        keperluan: form.keperluan.trim(),
        sekolah,
        items: validItems.map((it) => ({ aset: it.aset, jumlah: Number(it.jumlah) })),
      };
      if (form.kontak.trim()) payload.kontak = form.kontak.trim();
      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Permintaan Peminjaman Aset"] });
      reset();
      if (onCreated) onCreated(created.name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat permintaan.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="mega"
      title="Buat Permintaan Peminjaman"
      description="Catat siapa meminjam apa. Persetujuan dilakukan setelahnya."
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close}>Batal</Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {create.isPending ? "Menyimpan..." : "Ajukan"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormSection title="Pemohon" description="Identitas peminjam.">
          <FormField label="Nama Pemohon" required>
            <Input value={form.pemohon} onChange={(e) => set("pemohon", e.target.value)} placeholder="Budi Pelatih" />
          </FormField>
          <FormField label="Peran" required>
            <Select value={form.peran_pemohon} onChange={(e) => set("peran_pemohon", e.target.value)}>
              {PERAN_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Kontak (No. HP)">
            <Input value={form.kontak} onChange={(e) => set("kontak", e.target.value)} placeholder="0812..." />
          </FormField>
          <FormField label="Tanggal Pinjam" required>
            <Input type="date" value={form.tanggal_pinjam} onChange={(e) => set("tanggal_pinjam", e.target.value)} />
          </FormField>
          <FormField label="Keperluan" required>
            <Textarea value={form.keperluan} onChange={(e) => set("keperluan", e.target.value)} rows={2} placeholder="Latihan ekskul futsal" />
          </FormField>
        </FormSection>

        <section className="rounded-lg border border-border bg-muted/20 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-fg">Aset Dipinjam</h3>
            <Button variant="outline" onClick={addItem}>
              <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
              Tambah Baris
            </Button>
          </div>
          <div className="space-y-2">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-end gap-2">
                <div className="flex-1">
                  <FormField label={idx === 0 ? "Aset" : ""}>
                    <SearchableSelect
                      value={it.aset}
                      onChange={(v) => setItem(idx, { aset: v })}
                      options={asetOpts.options}
                      placeholder={asetOpts.isLoading ? "Memuat..." : "Pilih aset"}
                    />
                  </FormField>
                </div>
                <div className="w-24">
                  <FormField label={idx === 0 ? "Jumlah" : ""}>
                    <Input type="number" min={1} value={it.jumlah} onChange={(e) => setItem(idx, { jumlah: e.target.value })} />
                  </FormField>
                </div>
                <Button variant="outline" onClick={() => removeItem(idx)} disabled={items.length <= 1} title="Hapus baris">
                  Hapus
                </Button>
              </div>
            ))}
          </div>
        </section>
        <FormError message={err} />
      </div>
    </Modal>
  );
}
