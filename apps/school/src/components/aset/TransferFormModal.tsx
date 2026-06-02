/**
 * TransferFormModal — create form for "Transfer Aset" (warehouse movement).
 *
 * Creates a Draft transfer; finalizing it (which moves the asset's master
 * location) is done from the transfer list/detail via the server endpoint.
 * lokasi_asal is fetched server-side from the asset, so it is not collected.
 */
import { useState } from "react";
import { Button, FormField, Input, Modal, Textarea, SearchableSelect } from "@sekolahpro/ui";
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
  aset: string;
  lokasi_tujuan: string;
  jumlah: string;
  tanggal: string;
  petugas: string;
  alasan: string;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

const INITIAL: FormState = {
  aset: "",
  lokasi_tujuan: "",
  jumlah: "1",
  tanggal: todayIso(),
  petugas: "",
  alasan: "",
};

export function TransferFormModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Transfer Aset");
  const sekolah = useSessionStore((s) => s.activeSekolah?.name);
  const asetOpts = useDoctypeOptions("Aset", "nama");
  const lokasiOpts = useDoctypeOptions("Lokasi Aset", "nama_lokasi", [["status", "=", "Aktif"]]);

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

  const canSubmit = !!form.aset && !!form.lokasi_tujuan && !!sekolah && !create.isPending;

  const submit = async () => {
    setErr(null);
    if (!sekolah) {
      setErr("Sekolah aktif tidak ditemukan.");
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        aset: form.aset,
        lokasi_tujuan: form.lokasi_tujuan,
        jumlah: Number(form.jumlah) || 1,
        tanggal: form.tanggal,
        sekolah,
      };
      if (form.petugas.trim()) payload.petugas = form.petugas.trim();
      if (form.alasan.trim()) payload.alasan = form.alasan.trim();
      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Transfer Aset"] });
      reset();
      if (onCreated) onCreated(created.name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat transfer.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Buat Transfer Aset"
      description="Pindahkan aset ke lokasi penyimpanan lain. Tanda * wajib diisi."
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close}>Batal</Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {create.isPending ? "Menyimpan..." : "Simpan Draft"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormSection title="Detail Transfer" description="Aset dan lokasi tujuan.">
          <FormField label="Aset" required>
            <SearchableSelect
              value={form.aset}
              onChange={(v) => set("aset", v)}
              options={asetOpts.options}
              placeholder={asetOpts.isLoading ? "Memuat..." : "Pilih aset"}
            />
          </FormField>
          <FormField label="Lokasi Tujuan" required>
            <SearchableSelect
              value={form.lokasi_tujuan}
              onChange={(v) => set("lokasi_tujuan", v)}
              options={lokasiOpts.options}
              placeholder={lokasiOpts.isLoading ? "Memuat..." : "Pilih lokasi tujuan"}
            />
          </FormField>
          <FormField label="Jumlah">
            <Input type="number" min={1} value={form.jumlah} onChange={(e) => set("jumlah", e.target.value)} />
          </FormField>
          <FormField label="Tanggal" required>
            <Input type="date" value={form.tanggal} onChange={(e) => set("tanggal", e.target.value)} />
          </FormField>
          <FormField label="Petugas">
            <Input value={form.petugas} onChange={(e) => set("petugas", e.target.value)} placeholder="Nama petugas" />
          </FormField>
          <FormField label="Alasan Pindah">
            <Textarea value={form.alasan} onChange={(e) => set("alasan", e.target.value)} rows={2} />
          </FormField>
        </FormSection>
        <FormError message={err} />
      </div>
    </Modal>
  );
}
