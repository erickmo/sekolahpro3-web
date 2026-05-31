/**
 * AbsensiPelajaranFormModal — create form modal untuk doctype "Absensi Pelajaran".
 *
 * Header-only create. Detail kehadiran per siswa diisi di halaman detail.
 * Source of truth: doctype Absensi Pelajaran (akademik).
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

const ROMBEL_DOCTYPE = "Rombongan Belajar";
const ROMBEL_LABEL_FIELD = "nama_rombel";
const MAPEL_DOCTYPE = "Mata Pelajaran";
const MAPEL_LABEL_FIELD = "nama_mapel";
const GURU_DOCTYPE = "Guru";
const GURU_LABEL_FIELD = "nama_lengkap";
const SLOT_DOCTYPE = "Slot Jadwal";
const SLOT_LABEL_FIELD = "name";

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

export function AbsensiPelajaranFormModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(initial);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Absensi Pelajaran");

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

  return (
    <Modal
      open={open}
      onClose={close}
      size="mega"
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
        <FormSection title="Sesi Mengajar" description="Rombel, mata pelajaran, dan tanggal sesi.">
          <FormField label="Rombongan Belajar" required>
            <SearchableSelect
              value={form.rombel}
              onChange={(v) => set("rombel", v)}
              loadOptions={(q) => searchLink(ROMBEL_DOCTYPE, ROMBEL_LABEL_FIELD, q)}
              placeholder="Cari rombel…"
            />
          </FormField>
          <FormField label="Mata Pelajaran" required>
            <SearchableSelect
              value={form.mata_pelajaran}
              onChange={(v) => set("mata_pelajaran", v)}
              loadOptions={(q) => searchLink(MAPEL_DOCTYPE, MAPEL_LABEL_FIELD, q)}
              placeholder="Cari mata pelajaran…"
            />
          </FormField>
          <FormField label="Tanggal" required>
            <DatePicker
              value={form.tanggal}
              onChange={(v) => set("tanggal", v)}
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
            />
          </FormField>
        </FormSection>

        <FormSection title="Pengampu & Jadwal" description="Guru pengampu, slot jadwal, dan sumber data (opsional).">
          <FormField label="Guru">
            <SearchableSelect
              value={form.guru}
              onChange={(v) => set("guru", v)}
              loadOptions={(q) => searchLink(GURU_DOCTYPE, GURU_LABEL_FIELD, q)}
              placeholder="Cari guru… (opsional)"
            />
          </FormField>
          <FormField label="Slot Jadwal">
            <SearchableSelect
              value={form.slot}
              onChange={(v) => set("slot", v)}
              loadOptions={(q) => searchLink(SLOT_DOCTYPE, SLOT_LABEL_FIELD, q)}
              placeholder="Cari slot… (opsional)"
            />
          </FormField>
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
