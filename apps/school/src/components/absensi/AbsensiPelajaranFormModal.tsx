/**
 * AbsensiPelajaranFormModal — create form modal untuk doctype "Absensi Pelajaran".
 *
 * Header-only create. Detail kehadiran per siswa diisi di halaman detail.
 * Source of truth: doctype Absensi Pelajaran (akademik).
 */

import { useState } from "react";
import { Button, DatePicker, FormField, FormGrid, Modal, SearchableSelect } from "@sekolahpro/ui";
import { useResourceCreate, useResourceList } from "@sekolahpro/api-client";
import { useQueryClient } from "@tanstack/react-query";

type RombelRow = { name: string; nama_rombel?: string };
type MapelRow = { name: string; nama_mapel?: string };
type GuruRow = { name: string; nama_lengkap?: string };
type SlotRow = { name: string };

const SUMBER_OPTIONS = ["Manual", "FaceRec", "NFC", "QR"] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

interface FormState {
  rombel: string;
  mata_pelajaran: string;
  tanggal: string;
  guru: string;
  slot: string;
  sumber_input: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const initial = (): FormState => ({
  rombel: "",
  mata_pelajaran: "",
  tanggal: todayISO(),
  guru: "",
  slot: "",
  sumber_input: "Manual",
});

export function AbsensiPelajaranFormModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(initial);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Absensi Pelajaran");
  const rombelQ = useResourceList<RombelRow>("Rombongan Belajar", {
    fields: ["name", "nama_rombel"],
    limit_page_length: 0,
  });
  const mapelQ = useResourceList<MapelRow>("Mata Pelajaran", {
    fields: ["name", "nama_mapel"],
    limit_page_length: 0,
  });
  const guruQ = useResourceList<GuruRow>("Guru", {
    fields: ["name", "nama_lengkap"],
    limit_page_length: 0,
  });
  const slotQ = useResourceList<SlotRow>("Slot Jadwal", {
    fields: ["name"],
    limit_page_length: 0,
  });

  const set = <K extends keyof FormState>(k: K, v: string) =>
    setForm((cur) => ({ ...cur, [k]: v }));

  const reset = () => {
    setForm(initial());
    setErr(null);
  };

  const close = () => {
    if (create.isPending) return;
    reset();
    onClose();
  };

  const canSubmit =
    !!form.rombel &&
    !!form.mata_pelajaran &&
    !!form.tanggal &&
    !create.isPending;

  const submit = async () => {
    setErr(null);
    try {
      const payload: Record<string, unknown> = {
        rombel: form.rombel,
        mata_pelajaran: form.mata_pelajaran,
        tanggal: form.tanggal,
      };
      if (form.guru) payload.guru = form.guru;
      if (form.slot) payload.slot = form.slot;
      if (form.sumber_input) payload.sumber_input = form.sumber_input;

      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Absensi Pelajaran"] });
      reset();
      if (onCreated) onCreated(created.name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat absensi pelajaran.");
    }
  };

  const rombelOpts = rombelQ.data ?? [];
  const mapelOpts = mapelQ.data ?? [];
  const guruOpts = guruQ.data ?? [];
  const slotOpts = slotQ.data ?? [];

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Tambah Absensi Pelajaran"
      description="Isi header sesi mengajar. Tanda * wajib."
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close} disabled={create.isPending}>Batal</Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {create.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormGrid cols={2}>
          <FormField label="Rombongan Belajar" required>
            <SearchableSelect
              value={form.rombel}
              onChange={(v) => set("rombel", v)}
              disabled={rombelQ.isLoading}
              options={rombelOpts.map((r) => ({ value: r.name, label: r.nama_rombel ?? r.name }))}
              placeholder={rombelQ.isLoading ? "Memuat..." : "— Pilih Rombel —"}
            />
          </FormField>
          <FormField label="Mata Pelajaran" required>
            <SearchableSelect
              value={form.mata_pelajaran}
              onChange={(v) => set("mata_pelajaran", v)}
              disabled={mapelQ.isLoading}
              options={mapelOpts.map((m) => ({ value: m.name, label: m.nama_mapel ?? m.name }))}
              placeholder={mapelQ.isLoading ? "Memuat..." : "— Pilih Mapel —"}
            />
          </FormField>
          <FormField label="Tanggal" required>
            <DatePicker
              value={form.tanggal}
              onChange={(v) => set("tanggal", v)}
            />
          </FormField>
          <FormField label="Guru">
            <SearchableSelect
              value={form.guru}
              onChange={(v) => set("guru", v)}
              disabled={guruQ.isLoading}
              options={guruOpts.map((g) => ({ value: g.name, label: g.nama_lengkap ?? g.name }))}
              placeholder={guruQ.isLoading ? "Memuat..." : "— Opsional —"}
            />
          </FormField>
          <FormField label="Slot Jadwal">
            <SearchableSelect
              value={form.slot}
              onChange={(v) => set("slot", v)}
              disabled={slotQ.isLoading}
              options={slotOpts.map((s) => ({ value: s.name, label: s.name }))}
              placeholder={slotQ.isLoading ? "Memuat..." : "— Opsional —"}
            />
          </FormField>
          <FormField label="Sumber Input">
            <SearchableSelect
              value={form.sumber_input}
              onChange={(v) => set("sumber_input", v)}
              options={SUMBER_OPTIONS.map((o) => ({ value: o, label: o }))}
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
