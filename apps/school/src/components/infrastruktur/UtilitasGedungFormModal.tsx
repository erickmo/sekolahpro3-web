/**
 * UtilitasGedungFormModal — create/edit modal untuk doctype "Utilitas Gedung".
 *
 * Autoname backend: format:{gedung}-{jenis}. Field wajib: gedung, jenis, status.
 * defaultGedung: kunci konteks gedung (select Gedung/Sekolah disembunyikan).
 * editName: mode edit (gedung tidak diubah).
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
  useResourceCreate,
  useResourceDoc,
  useResourceList,
  useResourceUpdate,
} from "@sekolahpro/api-client";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
  defaultGedung?: string;
  editName?: string;
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

export function UtilitasGedungFormModal({ open, onClose, onCreated, defaultGedung, editName }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, gedung: defaultGedung ?? "" });
  const [err, setErr] = useState<string | null>(null);
  const create = useResourceCreate<{ name: string }>("Utilitas Gedung");
  const update = useResourceUpdate<{ name: string }>("Utilitas Gedung");
  const docQ = useResourceDoc<Record<string, unknown>>("Utilitas Gedung", editName, { enabled: !!editName });

  const gedungQ = useResourceList<GedungRow>("Gedung", {
    fields: ["name", "nama"],
    limit_page_length: 0,
  });
  const sekolahQ = useResourceList<SekolahRow>("Sekolah", {
    fields: ["name", "nama_sekolah"],
    limit_page_length: 0,
  });

  useEffect(() => {
    if (docQ.data) {
      const d = docQ.data as Record<string, unknown>;
      setForm({
        gedung: `${d.gedung ?? defaultGedung ?? ""}`,
        sekolah: `${d.sekolah ?? ""}`,
        jenis: `${d.jenis ?? ""}`,
        provider: `${d.provider ?? ""}`,
        kapasitas: `${d.kapasitas ?? ""}`,
        satuan: `${d.satuan ?? ""}`,
        nomor_pelanggan: `${d.nomor_pelanggan ?? ""}`,
        status: `${d.status ?? "Aktif"}`,
      });
    } else if (!editName && defaultGedung) {
      setForm((c) => ({ ...c, gedung: defaultGedung }));
    }
  }, [docQ.data, defaultGedung, editName]);

  const set = <K extends keyof FormState>(k: K, v: string) =>
    setForm((cur) => ({ ...cur, [k]: v }));

  const reset = () => {
    setForm({ ...EMPTY_FORM, gedung: defaultGedung ?? "" });
    setErr(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const requiredOk = (!!form.gedung || !!editName) && !!form.jenis && !!form.status;
  const pending = create.isPending || update.isPending;
  const submitDisabled = !requiredOk || pending;

  const submit = async () => {
    setErr(null);
    const patch: Record<string, string> = { jenis: form.jenis, status: form.status };
    if (form.provider) patch.provider = form.provider;
    if (form.kapasitas) patch.kapasitas = form.kapasitas;
    if (form.satuan) patch.satuan = form.satuan;
    if (form.nomor_pelanggan) patch.nomor_pelanggan = form.nomor_pelanggan;
    try {
      let name: string;
      if (editName) {
        name = (await update.mutateAsync({ name: editName, patch })).name;
      } else {
        const createPayload: Record<string, string> = { ...patch, gedung: form.gedung };
        if (form.sekolah) createPayload.sekolah = form.sekolah;
        name = (await create.mutateAsync(createPayload)).name;
      }
      await qc.invalidateQueries({ queryKey: ["resource:list", "Utilitas Gedung"] });
      reset();
      onCreated?.(name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal menyimpan utilitas.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title={editName ? "Edit Utilitas" : "Tambah Utilitas"}
      description="Catat utilitas (listrik, air, internet, dsb) untuk satu gedung."
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close}>Batal</Button>
          <Button onClick={submit} disabled={submitDisabled}>
            {pending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormGrid cols={2}>
          {!defaultGedung && (
            <FormField label="Gedung" required>
              <SearchableSelect
                value={form.gedung}
                onChange={(v) => set("gedung", v)}
                options={(gedungQ.data ?? []).map((g) => ({
                  value: g.name,
                  label: g.nama ? `${g.name} — ${g.nama}` : g.name,
                }))}
                placeholder="— Pilih gedung —"
              />
            </FormField>
          )}

          {!defaultGedung && (
            <FormField label="Sekolah">
              <SearchableSelect
                value={form.sekolah}
                onChange={(v) => set("sekolah", v)}
                options={(sekolahQ.data ?? []).map((s) => ({ value: s.name, label: s.name }))}
                placeholder="— Pilih sekolah —"
              />
            </FormField>
          )}

          <FormField label="Jenis" required>
            <Select aria-label="Jenis" value={form.jenis} onChange={(e) => set("jenis", e.target.value)}>
              <option value="">— pilih —</option>
              {JENIS_OPTIONS.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Status" required>
            <Select aria-label="Status" value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Provider">
            <Input
              aria-label="Provider"
              value={form.provider}
              onChange={(e) => set("provider", e.target.value)}
              placeholder="PLN, PDAM, Telkom, dsb"
            />
          </FormField>

          <FormField label="Nomor Pelanggan">
            <Input
              aria-label="Nomor Pelanggan"
              value={form.nomor_pelanggan}
              onChange={(e) => set("nomor_pelanggan", e.target.value)}
            />
          </FormField>

          <FormField label="Kapasitas">
            <Input
              aria-label="Kapasitas"
              value={form.kapasitas}
              onChange={(e) => set("kapasitas", e.target.value)}
              placeholder="mis. 2200"
            />
          </FormField>

          <FormField label="Satuan">
            <Input
              aria-label="Satuan"
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
