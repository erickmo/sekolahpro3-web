/**
 * AbsensiPelajaranFormModal — create form modal untuk doctype "Absensi Pelajaran".
 *
 * Header-only create. Detail kehadiran per siswa diisi di halaman detail.
 * Source of truth: doctype Absensi Pelajaran (akademik).
 */

import { useState } from "react";
import { Button, FormField, FormGrid, Input, Modal, Select } from "@sekolahpro/ui";
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
            <Select
              value={form.rombel}
              onChange={(e) => set("rombel", e.target.value)}
              disabled={rombelQ.isLoading}
            >
              <option value="">
                {rombelQ.isLoading ? "Memuat..." : "— Pilih Rombel —"}
              </option>
              {rombelOpts.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.nama_rombel ?? r.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Mata Pelajaran" required>
            <Select
              value={form.mata_pelajaran}
              onChange={(e) => set("mata_pelajaran", e.target.value)}
              disabled={mapelQ.isLoading}
            >
              <option value="">
                {mapelQ.isLoading ? "Memuat..." : "— Pilih Mapel —"}
              </option>
              {mapelOpts.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.nama_mapel ?? m.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Tanggal" required>
            <Input
              type="date"
              value={form.tanggal}
              onChange={(e) => set("tanggal", e.target.value)}
            />
          </FormField>
          <FormField label="Guru">
            <Select
              value={form.guru}
              onChange={(e) => set("guru", e.target.value)}
              disabled={guruQ.isLoading}
            >
              <option value="">
                {guruQ.isLoading ? "Memuat..." : "— Opsional —"}
              </option>
              {guruOpts.map((g) => (
                <option key={g.name} value={g.name}>
                  {g.nama_lengkap ?? g.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Slot Jadwal">
            <Select
              value={form.slot}
              onChange={(e) => set("slot", e.target.value)}
              disabled={slotQ.isLoading}
            >
              <option value="">
                {slotQ.isLoading ? "Memuat..." : "— Opsional —"}
              </option>
              {slotOpts.map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Sumber Input">
            <Select value={form.sumber_input} onChange={(e) => set("sumber_input", e.target.value)}>
              {SUMBER_OPTIONS.map((o) => (
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
