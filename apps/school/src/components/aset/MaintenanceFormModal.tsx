/**
 * MaintenanceFormModal — create form for "Permintaan Maintenance Aset".
 *
 * Files a maintenance ticket in status Dilaporkan. Scheduling, starting, and
 * completing the ticket happen from the detail page via server endpoints (which
 * lock/unlock the asset).
 */
import { useState } from "react";
import { Button, FormField, Input, Modal, Select, Textarea, SearchableSelect } from "@sekolahpro/ui";
import { useResourceCreate } from "@sekolahpro/api-client";
import { useSessionStore } from "@sekolahpro/auth";
import { useQueryClient } from "@tanstack/react-query";
import { FormSection, FormError } from "./FormSection";
import { useDoctypeOptions } from "./useDoctypeOptions";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
  /** Pre-select an asset (e.g. when opened from an asset detail page). */
  presetAset?: string;
}

interface FormState {
  aset: string;
  pelapor: string;
  tanggal_lapor: string;
  prioritas: string;
  jenis: string;
  deskripsi_masalah: string;
}

const PRIORITAS_OPTIONS = ["Rendah", "Sedang", "Tinggi", "Kritis"];
const JENIS_OPTIONS = ["Perbaikan", "Servis Rutin", "Penggantian Part", "Inspeksi"];
const todayIso = () => new Date().toISOString().slice(0, 10);

export function MaintenanceFormModal({ open, onClose, onCreated, presetAset }: Props) {
  const initial: FormState = {
    aset: presetAset ?? "",
    pelapor: "",
    tanggal_lapor: todayIso(),
    prioritas: "Sedang",
    jenis: "Perbaikan",
    deskripsi_masalah: "",
  };
  const [form, setForm] = useState<FormState>(initial);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Permintaan Maintenance Aset");
  const sekolah = useSessionStore((s) => s.activeSekolah?.name);
  const asetOpts = useDoctypeOptions("Aset", "nama");

  const set = <K extends keyof FormState>(k: K, v: string) =>
    setForm((cur) => ({ ...cur, [k]: v }));

  const reset = () => {
    setForm({ ...initial, aset: presetAset ?? "" });
    setErr(null);
  };
  const close = () => {
    reset();
    onClose();
  };

  const canSubmit =
    !!form.aset && !!form.pelapor.trim() && !!form.deskripsi_masalah.trim() && !!sekolah && !create.isPending;

  const submit = async () => {
    setErr(null);
    if (!sekolah) {
      setErr("Sekolah aktif tidak ditemukan.");
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        aset: form.aset,
        pelapor: form.pelapor.trim(),
        tanggal_lapor: form.tanggal_lapor,
        prioritas: form.prioritas,
        jenis: form.jenis,
        deskripsi_masalah: form.deskripsi_masalah.trim(),
        sekolah,
      };
      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Permintaan Maintenance Aset"] });
      reset();
      if (onCreated) onCreated(created.name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat tiket.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Lapor Maintenance Aset"
      description="Buat tiket perbaikan/servis. Tanda * wajib diisi."
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close}>Batal</Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {create.isPending ? "Menyimpan..." : "Laporkan"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormSection title="Tiket Maintenance" description="Aset dan masalah yang dilaporkan.">
          <FormField label="Aset" required>
            <SearchableSelect
              value={form.aset}
              onChange={(v) => set("aset", v)}
              options={asetOpts.options}
              placeholder={asetOpts.isLoading ? "Memuat..." : "Pilih aset"}
              disabled={!!presetAset}
            />
          </FormField>
          <FormField label="Pelapor" required>
            <Input value={form.pelapor} onChange={(e) => set("pelapor", e.target.value)} placeholder="Nama pelapor" />
          </FormField>
          <FormField label="Tanggal Lapor" required>
            <Input type="date" value={form.tanggal_lapor} onChange={(e) => set("tanggal_lapor", e.target.value)} />
          </FormField>
          <FormField label="Prioritas" required>
            <Select value={form.prioritas} onChange={(e) => set("prioritas", e.target.value)}>
              {PRIORITAS_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Jenis" required>
            <Select value={form.jenis} onChange={(e) => set("jenis", e.target.value)}>
              {JENIS_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Deskripsi Masalah" required>
            <Textarea value={form.deskripsi_masalah} onChange={(e) => set("deskripsi_masalah", e.target.value)} rows={3} placeholder="Jaring gawang sobek di sisi kanan" />
          </FormField>
        </FormSection>
        <FormError message={err} />
      </div>
    </Modal>
  );
}
