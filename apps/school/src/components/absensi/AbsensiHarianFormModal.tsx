/**
 * AbsensiHarianFormModal — create form modal untuk doctype "Absensi Harian".
 *
 * Header-only create (rombel + tanggal). Detail kehadiran diisi di halaman detail.
 * Source of truth: doctype Absensi Harian (akademik).
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

export function AbsensiHarianFormModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(initial);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Absensi Harian");

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

  return (
    <Modal
      open={open}
      onClose={close}
      size="mega"
      title="Tambah Absensi Harian"
      description="Pilih rombel & tanggal. Tanda * wajib. Detail kehadiran diisi setelah header tersimpan."
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
        <FormSection title="Header Presensi" description="Rombel dan tanggal sesi presensi harian.">
          <FormField label="Rombongan Belajar" required>
            <SearchableSelect
              value={form.rombel}
              onChange={(v) => set("rombel", v)}
              loadOptions={(q) => searchLink(ROMBEL_DOCTYPE, ROMBEL_LABEL_FIELD, q)}
              placeholder="Cari rombel…"
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

        {err && (
          <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {err}
          </div>
        )}
      </div>
    </Modal>
  );
}
