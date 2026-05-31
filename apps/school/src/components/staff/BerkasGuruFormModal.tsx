/**
 * BerkasGuruFormModal — create form for doctype "Berkas Guru".
 * Required: guru, nama_berkas, file (Attach URL).
 */

import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useResourceCreate, listResource } from "@sekolahpro/api-client";
import {
  Button,
  DatePicker,
  FormField,
  FormGrid,
  Input,
  Modal,
  SearchableSelect,
  Textarea,
  type SearchableOption,
} from "@sekolahpro/ui";

const PEGAWAI_DOCTYPE = "Pegawai";
const PEGAWAI_LABEL_FIELD = "nama_lengkap";

// Berkas dates span historical documents (old certificates) through future
// expiry dates, so use a generous year range.
const MIN_YEAR = 1960;
const MAX_YEAR = new Date().getFullYear() + 30;

/** Map plain string enums to SearchableSelect option objects. */
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

interface BerkasGuruFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

const JENIS_BERKAS = [
  "Ijazah", "Sertifikat", "KTP", "KK", "NPWP",
  "SK CPNS", "SK PNS", "SK Berkala", "SK Pangkat", "SK Mutasi",
  "Karpeg", "Karis/Karsu", "Taspen", "BPJS", "NUPTK Card",
  "Akta Nikah", "Sertifikat Diklat", "PAK", "Lainnya",
] as const;

interface FormState {
  guru: string;
  nama_berkas: string;
  jenis_berkas: string;
  file: string;
  nomor_dokumen: string;
  tanggal_upload: string;
  tanggal_berlaku: string;
  tanggal_kadaluarsa: string;
  keterangan: string;
}

const INITIAL: FormState = {
  guru: "",
  nama_berkas: "",
  jenis_berkas: "",
  file: "",
  nomor_dokumen: "",
  tanggal_upload: "",
  tanggal_berlaku: "",
  tanggal_kadaluarsa: "",
  keterangan: "",
};

export function BerkasGuruFormModal({ open, onClose, onCreated }: BerkasGuruFormModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Berkas Guru");

  const set = <K extends keyof FormState>(k: K, v: string) =>
    setForm((cur) => ({ ...cur, [k]: v }));

  const reset = () => { setForm(INITIAL); setErr(null); };
  const close = () => { reset(); onClose(); };

  const canSubmit =
    !!form.guru &&
    !!form.nama_berkas.trim() &&
    !!form.file.trim() &&
    !create.isPending;

  const submit = async () => {
    setErr(null);
    try {
      const payload: Record<string, unknown> = {
        guru: form.guru,
        nama_berkas: form.nama_berkas.trim(),
        file: form.file.trim(),
      };
      if (form.jenis_berkas) payload.jenis_berkas = form.jenis_berkas;
      if (form.nomor_dokumen.trim()) payload.nomor_dokumen = form.nomor_dokumen.trim();
      if (form.tanggal_upload) payload.tanggal_upload = form.tanggal_upload;
      if (form.tanggal_berlaku) payload.tanggal_berlaku = form.tanggal_berlaku;
      if (form.tanggal_kadaluarsa) payload.tanggal_kadaluarsa = form.tanggal_kadaluarsa;
      if (form.keterangan.trim()) payload.keterangan = form.keterangan.trim();

      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Berkas Guru"] });
      onCreated?.(created.name);
      reset();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal menyimpan berkas.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="mega"
      title="Unggah Berkas Staff"
      description="Isi data berkas. Tanda * wajib diisi."
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
        <FormSection title="Berkas" description="Identitas dan jenis dokumen.">
          <FormField label="Staff" required className="col-span-2">
            <SearchableSelect
              value={form.guru}
              onChange={(v) => set("guru", v)}
              loadOptions={(q) => searchLink(PEGAWAI_DOCTYPE, PEGAWAI_LABEL_FIELD, q)}
              placeholder="Cari staff…"
            />
          </FormField>
          <FormField label="Nama Berkas" required>
            <Input
              value={form.nama_berkas}
              onChange={(e) => set("nama_berkas", e.target.value)}
              placeholder="Ijazah S1"
            />
          </FormField>
          <FormField label="Jenis Berkas">
            <SearchableSelect
              value={form.jenis_berkas}
              onChange={(v) => set("jenis_berkas", v)}
              options={toOptions(JENIS_BERKAS)}
              placeholder="—"
            />
          </FormField>
          <FormField label="URL File" required hint="Unggah dulu via Frappe Desk lalu salin URL-nya (/files/...)" className="col-span-2">
            <Input
              value={form.file}
              onChange={(e) => set("file", e.target.value)}
              placeholder="/files/ijazah.pdf"
            />
          </FormField>
          <FormField label="Nomor Dokumen">
            <Input
              value={form.nomor_dokumen}
              onChange={(e) => set("nomor_dokumen", e.target.value)}
            />
          </FormField>
        </FormSection>

        <FormSection title="Masa Berlaku" description="Tanggal unggah, berlaku, dan kadaluarsa.">
          <FormField label="Tanggal Upload">
            <DatePicker
              value={form.tanggal_upload}
              onChange={(v) => set("tanggal_upload", v)}
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
            />
          </FormField>
          <FormField label="Tanggal Berlaku">
            <DatePicker
              value={form.tanggal_berlaku}
              onChange={(v) => set("tanggal_berlaku", v)}
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
            />
          </FormField>
          <FormField label="Tanggal Kadaluarsa">
            <DatePicker
              value={form.tanggal_kadaluarsa}
              onChange={(v) => set("tanggal_kadaluarsa", v)}
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
            />
          </FormField>
          <FormField label="Keterangan" className="col-span-2">
            <Textarea
              rows={3}
              value={form.keterangan}
              onChange={(e) => set("keterangan", e.target.value)}
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
