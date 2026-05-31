/**
 * RombelFormModal — create form modal untuk doctype "Rombongan Belajar".
 *
 * Source of truth (fields): doctype Rombongan Belajar di backend Frappe.
 * autoname = format:{tahun_ajaran}-{nama_rombel} (name auto-generated).
 */

import { useState, type ReactNode } from "react";
import {
  Button,
  FormField,
  FormGrid,
  Input,
  Modal,
  SearchableSelect,
  type SearchableOption,
} from "@sekolahpro/ui";
import { listResource, useResourceCreate } from "@sekolahpro/api-client";
import { useQueryClient } from "@tanstack/react-query";

const ROMBEL_DOCTYPE = "Rombongan Belajar";
const STATUS_OPTIONS = ["Aktif", "Ditutup"] as const;

interface RombelFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

interface FormState {
  nama_rombel: string;
  tahun_ajaran: string;
  jenjang: string;
  tingkat: string;
  sekolah: string;
  wali_kelas: string;
  kapasitas: string;
  ruangan: string;
  status: string;
}

const INITIAL: FormState = {
  nama_rombel: "",
  tahun_ajaran: "",
  jenjang: "",
  tingkat: "",
  sekolah: "",
  wali_kelas: "",
  kapasitas: "",
  ruangan: "",
  status: "Aktif",
};

/** Build static enum options for SearchableSelect. */
function toOptions(values: readonly string[]): SearchableOption[] {
  return values.map((v) => ({ value: v, label: v }));
}

/** Async option loader for a Frappe link field. */
async function searchLink(doctype: string, labelField: string, q: string): Promise<SearchableOption[]> {
  const rows = await listResource<Record<string, string>>(doctype, {
    fields: ["name", labelField],
    ...(q ? { or_filters: [["name", "like", `%${q}%`], [labelField, "like", `%${q}%`]] as [string, string, unknown][] } : {}),
    limit_page_length: 20,
    order_by: "modified desc",
  });
  return rows.map((r) => ({ value: r.name ?? "", label: r[labelField] ? `${r[labelField]} (${r.name})` : (r.name ?? "") }));
}

/** Section heading + grid wrapper for one logical group of fields. */
function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-muted/20 p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {description ? <p className="text-xs text-muted-fg mt-0.5">{description}</p> : null}
      </div>
      <FormGrid>{children}</FormGrid>
    </section>
  );
}

export function RombelFormModal({ open, onClose, onCreated }: RombelFormModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>(ROMBEL_DOCTYPE);

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
    !!form.nama_rombel.trim() &&
    !!form.tahun_ajaran &&
    !!form.jenjang &&
    !!form.tingkat.trim() &&
    !!form.sekolah &&
    !!form.status &&
    !create.isPending;

  const submit = async () => {
    setErr(null);
    try {
      const payload: Record<string, unknown> = {
        nama_rombel: form.nama_rombel.trim(),
        tahun_ajaran: form.tahun_ajaran,
        jenjang: form.jenjang,
        tingkat: Number(form.tingkat),
        sekolah: form.sekolah,
        status: form.status,
      };
      if (form.wali_kelas) payload.wali_kelas = form.wali_kelas;
      if (form.kapasitas.trim()) payload.kapasitas = Number(form.kapasitas);
      if (form.ruangan) payload.ruangan = form.ruangan;

      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", ROMBEL_DOCTYPE] });
      reset();
      if (onCreated) onCreated(created.name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat rombongan belajar.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="mega"
      tone="brand"
      title="Tambah Rombongan Belajar"
      description="Isi data rombongan belajar. Tanda * wajib diisi."
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={create.isPending}>Batal</Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {create.isPending ? "Menyimpan…" : "Simpan"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <FormSection title="Identitas Rombel" description="Nama dan penempatan akademik rombongan belajar.">
          <FormField label="Nama Rombel" required hint="Dipakai untuk auto-ID: {tahun_ajaran}-{nama_rombel}">
            <Input
              value={form.nama_rombel}
              onChange={(e) => set("nama_rombel", e.target.value)}
              placeholder="VII-A"
            />
          </FormField>
          <FormField label="Tahun Ajaran" required>
            <SearchableSelect
              value={form.tahun_ajaran}
              onChange={(v) => set("tahun_ajaran", v)}
              loadOptions={(q) => searchLink("Tahun Ajaran", "name", q)}
              placeholder="Cari tahun ajaran…"
            />
          </FormField>
          <FormField label="Jenjang" required>
            <SearchableSelect
              value={form.jenjang}
              onChange={(v) => set("jenjang", v)}
              loadOptions={(q) => searchLink("Unit Jenjang", "name", q)}
              placeholder="Cari jenjang…"
            />
          </FormField>
          <FormField label="Tingkat" required>
            <Input
              type="number"
              min={0}
              value={form.tingkat}
              onChange={(e) => set("tingkat", e.target.value)}
              placeholder="7"
            />
          </FormField>
          <FormField label="Sekolah" required>
            <SearchableSelect
              value={form.sekolah}
              onChange={(v) => set("sekolah", v)}
              loadOptions={(q) => searchLink("Sekolah", "nama_sekolah", q)}
              placeholder="Cari sekolah…"
            />
          </FormField>
          <FormField label="Status" required>
            <SearchableSelect
              value={form.status}
              onChange={(v) => set("status", v)}
              options={toOptions(STATUS_OPTIONS)}
              placeholder="— pilih —"
            />
          </FormField>
        </FormSection>

        <FormSection title="Penempatan & Kapasitas" description="Wali kelas, ruangan, dan daya tampung.">
          <FormField label="Wali Kelas">
            <SearchableSelect
              value={form.wali_kelas}
              onChange={(v) => set("wali_kelas", v)}
              loadOptions={(q) => searchLink("User", "full_name", q)}
              placeholder="Cari wali kelas…"
            />
          </FormField>
          <FormField label="Ruangan">
            <SearchableSelect
              value={form.ruangan}
              onChange={(v) => set("ruangan", v)}
              loadOptions={(q) => searchLink("Ruangan", "nama", q)}
              placeholder="Cari ruangan…"
            />
          </FormField>
          <FormField label="Kapasitas">
            <Input
              type="number"
              min={0}
              value={form.kapasitas}
              onChange={(e) => set("kapasitas", e.target.value)}
              placeholder="32"
            />
          </FormField>
        </FormSection>

        {err && (
          <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {err}
          </div>
        )}
      </div>
    </Modal>
  );
}
