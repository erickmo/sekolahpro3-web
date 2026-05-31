/**
 * AbsensiGuruFormModal — create form modal untuk doctype "Absensi Guru".
 *
 * Header-only create. Detail kehadiran guru ditambahkan di halaman detail.
 * Source of truth: doctype Absensi Guru (akademik).
 */

import { useState, type ReactNode } from "react";
import {
  Button,
  DatePicker,
  FormField,
  FormGrid,
  Modal,
  SearchableSelect,
  type SearchableOption,
} from "@sekolahpro/ui";
import { listResource, useResourceCreate } from "@sekolahpro/api-client";
import { useQueryClient } from "@tanstack/react-query";

// Year range for attendance date pickers. Attendance is recorded near "now",
// so expose a narrow dropdown range for fast year jumping.
const MIN_YEAR = new Date().getFullYear() - 2;
const MAX_YEAR = new Date().getFullYear() + 1;

const SEKOLAH_DOCTYPE = "Sekolah";
const SEKOLAH_LABEL_FIELD = "nama_sekolah";
const TAHUN_AJARAN_DOCTYPE = "Tahun Ajaran";
const TAHUN_AJARAN_LABEL_FIELD = "tahun";

const SEMESTER_OPTIONS = ["Ganjil", "Genap"] as const;
const SUMBER_OPTIONS = ["Manual", "Sync"] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

interface FormState {
  tanggal: string;
  tahun_ajaran: string;
  sekolah: string;
  semester: string;
  sumber_input: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const initial = (): FormState => ({
  tanggal: todayISO(),
  tahun_ajaran: "",
  sekolah: "",
  semester: "",
  sumber_input: "Manual",
});

/** Map static enum strings to SearchableSelect options. */
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

export function AbsensiGuruFormModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(initial);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Absensi Guru");

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
    !!form.tanggal &&
    !!form.tahun_ajaran &&
    !!form.sekolah &&
    !!form.semester &&
    !create.isPending;

  const submit = async () => {
    setErr(null);
    try {
      const payload: Record<string, unknown> = {
        tanggal: form.tanggal,
        tahun_ajaran: form.tahun_ajaran,
        sekolah: form.sekolah,
        semester: form.semester,
      };
      if (form.sumber_input) payload.sumber_input = form.sumber_input;

      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Absensi Guru"] });
      reset();
      if (onCreated) onCreated(created.name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat absensi guru.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="mega"
      title="Tambah Absensi Guru"
      description="Isi data header presensi guru. Tanda * wajib."
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
        <FormSection title="Periode & Sekolah" description="Tanggal, tahun ajaran, dan sekolah presensi.">
          <FormField label="Tanggal" required>
            <DatePicker
              value={form.tanggal}
              onChange={(v) => set("tanggal", v)}
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
            />
          </FormField>
          <FormField label="Tahun Ajaran" required>
            <SearchableSelect
              value={form.tahun_ajaran}
              onChange={(v) => set("tahun_ajaran", v)}
              loadOptions={(q) => searchLink(TAHUN_AJARAN_DOCTYPE, TAHUN_AJARAN_LABEL_FIELD, q)}
              placeholder="Cari tahun ajaran…"
            />
          </FormField>
          <FormField label="Sekolah" required>
            <SearchableSelect
              value={form.sekolah}
              onChange={(v) => set("sekolah", v)}
              loadOptions={(q) => searchLink(SEKOLAH_DOCTYPE, SEKOLAH_LABEL_FIELD, q)}
              placeholder="Cari sekolah…"
            />
          </FormField>
          <FormField label="Semester" required>
            <SearchableSelect
              value={form.semester}
              onChange={(v) => set("semester", v)}
              options={toOptions(SEMESTER_OPTIONS)}
              placeholder="— Pilih Semester —"
            />
          </FormField>
        </FormSection>

        <FormSection title="Metadata" description="Asal sumber data presensi.">
          <FormField label="Sumber Input">
            <SearchableSelect
              value={form.sumber_input}
              onChange={(v) => set("sumber_input", v)}
              options={toOptions(SUMBER_OPTIONS)}
              placeholder="— Pilih Sumber —"
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
