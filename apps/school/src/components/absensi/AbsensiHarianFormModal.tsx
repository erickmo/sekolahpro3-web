/**
 * AbsensiHarianFormModal — create form modal untuk doctype "Absensi Harian".
 *
 * Header-only create (rombel + tanggal). Detail kehadiran diisi di halaman detail.
 * Source of truth: doctype Absensi Harian (akademik).
 */

import { useState } from "react";
import { Button, FormField, FormGrid, Input, Modal, Select } from "@sekolahpro/ui";
import { useResourceCreate, useResourceList } from "@sekolahpro/api-client";
import { useQueryClient } from "@tanstack/react-query";

type RombelRow = { name: string; nama_rombel?: string };

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

interface FormState {
  rombel: string;
  tanggal: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const initial = (): FormState => ({ rombel: "", tanggal: todayISO() });

export function AbsensiHarianFormModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(initial);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Absensi Harian");
  const rombelQ = useResourceList<RombelRow>("Rombongan Belajar", {
    fields: ["name", "nama_rombel"],
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

  const canSubmit = !!form.rombel && !!form.tanggal && !create.isPending;

  const submit = async () => {
    setErr(null);
    try {
      const created = await create.mutateAsync({
        rombel: form.rombel,
        tanggal: form.tanggal,
      });
      await qc.invalidateQueries({ queryKey: ["resource:list", "Absensi Harian"] });
      reset();
      if (onCreated) onCreated(created.name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat absensi harian.");
    }
  };

  const rombelOpts = rombelQ.data ?? [];

  return (
    <Modal
      open={open}
      onClose={close}
      size="md"
      title="Tambah Absensi Harian"
      description="Pilih rombel & tanggal. Detail kehadiran diisi setelah header tersimpan."
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
          <FormField label="Tanggal" required>
            <Input
              type="date"
              value={form.tanggal}
              onChange={(e) => set("tanggal", e.target.value)}
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
