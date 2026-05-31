/**
 * SkJabatanFormModal — create form for doctype "SK Jabatan".
 * Required: guru, jenis_jabatan, tanggal_sk, tanggal_mulai_berlaku.
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
const JENIS_JABATAN_DOCTYPE = "Jenis Jabatan";
const JENIS_JABATAN_LABEL_FIELD = "nama_jabatan";
const TAHUN_AJARAN_DOCTYPE = "Tahun Ajaran";

// SK/jabatan dates are administrative and recent, so use a narrow year range.
const MIN_YEAR = new Date().getFullYear() - 10;
const MAX_YEAR = new Date().getFullYear() + 5;

interface SkJabatanFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

interface FormState {
  guru: string;
  jenis_jabatan: string;
  tanggal_sk: string;
  tanggal_mulai_berlaku: string;
  tanggal_berakhir: string;
  tahun_ajaran: string;
  keterangan_tugas: string;
  nomor_sk_manual: string;
  status: string;
}

const INITIAL: FormState = {
  guru: "",
  jenis_jabatan: "",
  tanggal_sk: "",
  tanggal_mulai_berlaku: "",
  tanggal_berakhir: "",
  tahun_ajaran: "",
  keterangan_tugas: "",
  nomor_sk_manual: "",
  status: "Draft",
};

const STATUS_OPTIONS = ["Draft", "Diajukan", "Disetujui Kepsek", "Diterbitkan", "Dicabut"] as const;

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

/** Async loader for active Jenis Jabatan only (preserves aktif=1 filter). */
async function searchJenisJabatan(q: string): Promise<SearchableOption[]> {
  const rows = await listResource<Record<string, string>>(JENIS_JABATAN_DOCTYPE, {
    fields: ["name", JENIS_JABATAN_LABEL_FIELD],
    filters: [["aktif", "=", 1]] as [string, string, unknown][],
    ...(q ? { or_filters: [["name", "like", `%${q}%`], [JENIS_JABATAN_LABEL_FIELD, "like", `%${q}%`]] as [string, string, unknown][] } : {}),
    limit_page_length: 20,
    order_by: "modified desc",
  });
  return rows.map((r) => ({
    value: r.name ?? "",
    label: r[JENIS_JABATAN_LABEL_FIELD] ? `${r[JENIS_JABATAN_LABEL_FIELD]} (${r.name})` : (r.name ?? ""),
  }));
}

/** Async loader for Tahun Ajaran where the document name is the label. */
async function searchTahunAjaran(q: string): Promise<SearchableOption[]> {
  const rows = await listResource<Record<string, string>>(TAHUN_AJARAN_DOCTYPE, {
    fields: ["name"],
    ...(q ? { filters: [["name", "like", `%${q}%`]] as [string, string, unknown][] } : {}),
    limit_page_length: 20,
    order_by: "modified desc",
  });
  return rows.map((r) => ({ value: r.name ?? "", label: r.name ?? "" }));
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

export function SkJabatanFormModal({ open, onClose, onCreated }: SkJabatanFormModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("SK Jabatan");

  const set = <K extends keyof FormState>(k: K, v: string) =>
    setForm((cur) => ({ ...cur, [k]: v }));

  const reset = () => { setForm(INITIAL); setErr(null); };
  const close = () => { reset(); onClose(); };

  const canSubmit =
    !!form.guru &&
    !!form.jenis_jabatan &&
    !!form.tanggal_sk &&
    !!form.tanggal_mulai_berlaku &&
    !create.isPending;

  const submit = async () => {
    setErr(null);
    try {
      const payload: Record<string, unknown> = {
        guru: form.guru,
        jenis_jabatan: form.jenis_jabatan,
        tanggal_sk: form.tanggal_sk,
        tanggal_mulai_berlaku: form.tanggal_mulai_berlaku,
        status: form.status,
      };
      if (form.tanggal_berakhir) payload.tanggal_berakhir = form.tanggal_berakhir;
      if (form.tahun_ajaran) payload.tahun_ajaran = form.tahun_ajaran;
      if (form.keterangan_tugas.trim()) payload.keterangan_tugas = form.keterangan_tugas.trim();
      if (form.nomor_sk_manual.trim()) payload.nomor_sk_manual = form.nomor_sk_manual.trim();

      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "SK Jabatan"] });
      onCreated?.(created.name);
      reset();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat SK Jabatan.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="mega"
      title="Terbitkan SK Jabatan"
      description="Isi data SK Jabatan. Tanda * wajib diisi."
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
        <FormSection title="Penugasan" description="Pegawai dan jenis jabatan yang ditetapkan.">
          <FormField label="Staff" required className="col-span-2">
            <SearchableSelect
              value={form.guru}
              onChange={(v) => set("guru", v)}
              loadOptions={(q) => searchLink(PEGAWAI_DOCTYPE, PEGAWAI_LABEL_FIELD, q)}
              placeholder="Cari staff…"
            />
          </FormField>
          <FormField label="Jenis Jabatan" required>
            <SearchableSelect
              value={form.jenis_jabatan}
              onChange={(v) => set("jenis_jabatan", v)}
              loadOptions={searchJenisJabatan}
              placeholder="Cari jenis jabatan…"
            />
          </FormField>
          <FormField label="Status">
            <SearchableSelect
              value={form.status}
              onChange={(v) => set("status", v)}
              options={toOptions(STATUS_OPTIONS)}
            />
          </FormField>
        </FormSection>

        <FormSection title="Masa Berlaku" description="Tanggal SK dan periode berlakunya.">
          <FormField label="Tanggal SK" required>
            <DatePicker
              value={form.tanggal_sk}
              onChange={(v) => set("tanggal_sk", v)}
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
            />
          </FormField>
          <FormField label="Tahun Ajaran">
            <SearchableSelect
              value={form.tahun_ajaran}
              onChange={(v) => set("tahun_ajaran", v)}
              loadOptions={searchTahunAjaran}
              placeholder="— Opsional —"
            />
          </FormField>
          <FormField label="Tanggal Mulai Berlaku" required>
            <DatePicker
              value={form.tanggal_mulai_berlaku}
              onChange={(v) => set("tanggal_mulai_berlaku", v)}
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
            />
          </FormField>
          <FormField label="Tanggal Berakhir">
            <DatePicker
              value={form.tanggal_berakhir}
              onChange={(v) => set("tanggal_berakhir", v)}
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
            />
          </FormField>
        </FormSection>

        <FormSection title="Dokumen" description="Nomor resmi dan keterangan tugas.">
          <FormField label="Nomor SK (Resmi)" className="col-span-2">
            <Input
              value={form.nomor_sk_manual}
              onChange={(e) => set("nomor_sk_manual", e.target.value)}
              placeholder="800/SK/.../2026"
            />
          </FormField>
          <FormField label="Keterangan Tugas" className="col-span-2">
            <Textarea
              rows={3}
              value={form.keterangan_tugas}
              onChange={(e) => set("keterangan_tugas", e.target.value)}
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
