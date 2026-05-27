/**
 * UtilitasGedungFormModal — create modal untuk doctype "Utilitas Gedung".
 *
 * Autoname backend: format:{gedung}-{jenis}. Field wajib: gedung, jenis, status.
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  FormField,
  FormGrid,
  Input,
  Modal,
  Select,
} from "@sekolahpro/ui";
import { useResourceCreate, useResourceList } from "@sekolahpro/api-client";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
};

type GedungRow = { name: string; nama?: string };
type SekolahRow = { name: string; nama_sekolah?: string };

const JENIS_OPTIONS = ["Listrik", "Air", "Internet", "Gas", "Lainnya"] as const;
const STATUS_OPTIONS = ["Aktif", "Nonaktif"] as const;

type FormState = {
  gedung: string;
  sekolah: string;
  jenis: string;
  provider: string;
  kapasitas: string;
  satuan: string;
  nomor_pelanggan: string;
  status: string;
};

const EMPTY_FORM: FormState = {
  gedung: "",
  sekolah: "",
  jenis: "",
  provider: "",
  kapasitas: "",
  satuan: "",
  nomor_pelanggan: "",
  status: "Aktif",
};

export function UtilitasGedungFormModal({ open, onClose, onCreated }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [err, setErr] = useState<string | null>(null);
  const create = useResourceCreate<{ name: string }>("Utilitas Gedung");

  const gedungQ = useResourceList<GedungRow>("Gedung", {
    fields: ["name", "nama"],
    limit_page_length: 0,
  });
  const sekolahQ = useResourceList<SekolahRow>("Sekolah", {
    fields: ["name", "nama_sekolah"],
    limit_page_length: 0,
  });

  const set = <K extends keyof FormState>(k: K, v: string) =>
    setForm((cur) => ({ ...cur, [k]: v }));

  const reset = () => {
    setForm(EMPTY_FORM);
    setErr(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const requiredOk = !!form.gedung && !!form.jenis && !!form.status;
  const submitDisabled = !requiredOk || create.isPending;

  const submit = async () => {
    setErr(null);
    const payload: Record<string, string> = {
      gedung: form.gedung,
      jenis: form.jenis,
      status: form.status,
    };
    if (form.sekolah) payload.sekolah = form.sekolah;
    if (form.provider) payload.provider = form.provider;
    if (form.kapasitas) payload.kapasitas = form.kapasitas;
    if (form.satuan) payload.satuan = form.satuan;
    if (form.nomor_pelanggan) payload.nomor_pelanggan = form.nomor_pelanggan;

    try {
      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Utilitas Gedung"] });
      reset();
      onCreated?.(created.name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat utilitas gedung.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Tambah Utilitas Gedung"
      description="Catat utilitas (listrik, air, internet, dsb) untuk satu gedung."
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close}>Batal</Button>
          <Button onClick={submit} disabled={submitDisabled}>
            {create.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormGrid cols={2}>
          <FormField label="Gedung" required>
            <Select value={form.gedung} onChange={(e) => set("gedung", e.target.value)}>
              <option value="">— Pilih gedung —</option>
              {(gedungQ.data ?? []).map((g) => (
                <option key={g.name} value={g.name}>
                  {g.nama ? `${g.name} — ${g.nama}` : g.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Sekolah">
            <Select value={form.sekolah} onChange={(e) => set("sekolah", e.target.value)}>
              <option value="">— Pilih sekolah —</option>
              {(sekolahQ.data ?? []).map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Jenis" required>
            <Select value={form.jenis} onChange={(e) => set("jenis", e.target.value)}>
              <option value="">— Pilih jenis —</option>
              {JENIS_OPTIONS.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Status" required>
            <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Provider">
            <Input
              value={form.provider}
              onChange={(e) => set("provider", e.target.value)}
              placeholder="PLN, PDAM, Telkom, dsb"
            />
          </FormField>

          <FormField label="Nomor Pelanggan">
            <Input
              value={form.nomor_pelanggan}
              onChange={(e) => set("nomor_pelanggan", e.target.value)}
            />
          </FormField>

          <FormField label="Kapasitas">
            <Input
              value={form.kapasitas}
              onChange={(e) => set("kapasitas", e.target.value)}
              placeholder="mis. 2200"
            />
          </FormField>

          <FormField label="Satuan">
            <Input
              value={form.satuan}
              onChange={(e) => set("satuan", e.target.value)}
              placeholder="VA, Mbps, m3, dsb"
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
