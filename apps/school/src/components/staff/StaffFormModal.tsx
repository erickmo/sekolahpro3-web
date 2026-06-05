/**
 * StaffFormModal — create form modal for doctype "Guru" (staff includes guru + non-pengajar).
 *
 * Source of truth: doctype Guru. autoname = format:GURU-{####}.
 * Required server-side: nama_lengkap, user, nik, tanggal_lahir, jenis_kelamin, status_kepegawaian, sekolah.
 */

import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useResourceCreate, listResource } from "@sekolahpro/api-client";
import {
  Button,
  DatePicker,
  FormField,
  FormGrid,
  IdScanField,
  Input,
  Modal,
  SearchableSelect,
  type SearchableOption,
} from "@sekolahpro/ui";
import { scanIdentitas } from "../../lib/ocrApi";
import { mapKtpToPegawai } from "../../lib/ocrMapping";

const SEKOLAH_DOCTYPE = "Sekolah";
const SEKOLAH_LABEL_FIELD = "nama_sekolah";

const JK_OPTIONS = ["Laki-laki", "Perempuan"] as const;
const AGAMA_OPTIONS = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"] as const;
const STATUS_KEP_OPTIONS = ["PNS", "PPPK", "GTY", "GTT", "Honorer"] as const;
const PENDIDIKAN_OPTIONS = ["SMA", "D3", "S1", "S2", "S3"] as const;

// Year range for date pickers. Birth/employment dates can reach back decades,
// so expose a wide dropdown range for fast year jumping.
const MIN_YEAR = 1940;
const MAX_YEAR = new Date().getFullYear() + 1;

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

interface StaffFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

interface FormState {
  nama_lengkap: string;
  user: string;
  nik: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  agama: string;
  no_hp: string;
  email_pribadi: string;
  nip: string;
  nuptk: string;
  status_kepegawaian: string;
  sekolah: string;
  pendidikan_terakhir: string;
  jabatan_fungsional: string;
  tmt_pertama_kerja: string;
}

const INITIAL: FormState = {
  nama_lengkap: "",
  user: "",
  nik: "",
  tanggal_lahir: "",
  jenis_kelamin: "",
  agama: "",
  no_hp: "",
  email_pribadi: "",
  nip: "",
  nuptk: "",
  status_kepegawaian: "",
  sekolah: "",
  pendidikan_terakhir: "",
  jabatan_fungsional: "",
  tmt_pertama_kerja: "",
};

export function StaffFormModal({ open, onClose, onCreated }: StaffFormModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Guru");

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
    !!form.nama_lengkap.trim() &&
    !!form.user.trim() &&
    !!form.nik.trim() &&
    form.nik.trim().length === 16 &&
    !!form.tanggal_lahir &&
    !!form.jenis_kelamin &&
    !!form.status_kepegawaian &&
    !!form.sekolah &&
    !create.isPending;

  const submit = async () => {
    setErr(null);
    try {
      const payload: Record<string, unknown> = {
        nama_lengkap: form.nama_lengkap.trim(),
        user: form.user.trim(),
        nik: form.nik.trim(),
        tanggal_lahir: form.tanggal_lahir,
        jenis_kelamin: form.jenis_kelamin,
        status_kepegawaian: form.status_kepegawaian,
        sekolah: form.sekolah,
        is_aktif: 1,
      };
      if (form.agama) payload.agama = form.agama;
      if (form.no_hp.trim()) payload.no_hp = form.no_hp.trim();
      if (form.email_pribadi.trim()) payload.email_pribadi = form.email_pribadi.trim();
      if (form.nip.trim()) payload.nip = form.nip.trim();
      if (form.nuptk.trim()) payload.nuptk = form.nuptk.trim();
      if (form.pendidikan_terakhir) payload.pendidikan_terakhir = form.pendidikan_terakhir;
      if (form.jabatan_fungsional.trim()) payload.jabatan_fungsional = form.jabatan_fungsional.trim();
      if (form.tmt_pertama_kerja) payload.tmt_pertama_kerja = form.tmt_pertama_kerja;

      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Guru"] });
      onCreated?.(created.name);
      reset();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat data staff.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="mega"
      title="Tambah Staff"
      description="Isi data staff. Tanda * wajib diisi."
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
        <FormSection title="Identitas Diri" description="Data pribadi sesuai dokumen resmi.">
          {/* OCR auto-fill: scan KTP to pre-populate identity fields (nama_lengkap, nik,
              tanggal_lahir, jenis_kelamin, agama). tempat_lahir/alamat absent from
              FormState — extra keys in mapKtpToPegawai output are safely ignored by spread. */}
          <div className="col-span-2">
            <IdScanField
              jenis="KTP"
              onScan={(blob, jenis) => scanIdentitas(blob, jenis).then((r) => r.fields)}
              onApply={(fields) =>
                setForm((prev) => ({ ...prev, ...(mapKtpToPegawai(fields) as Partial<FormState>) }))
              }
            />
          </div>
          <FormField label="Nama Lengkap" required className="col-span-2">
            <Input
              value={form.nama_lengkap}
              onChange={(e) => set("nama_lengkap", e.target.value)}
              placeholder="Nama lengkap dengan gelar"
            />
          </FormField>
          <FormField label="NIK" required hint="16 digit">
            <Input
              value={form.nik}
              onChange={(e) => set("nik", e.target.value.replace(/\D/g, "").slice(0, 16))}
              placeholder="3201xxxxxxxxxxxx"
            />
          </FormField>
          <FormField label="Tanggal Lahir" required>
            <DatePicker
              value={form.tanggal_lahir}
              onChange={(v) => set("tanggal_lahir", v)}
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
            />
          </FormField>
          <FormField label="Jenis Kelamin" required>
            <SearchableSelect
              value={form.jenis_kelamin}
              onChange={(v) => set("jenis_kelamin", v)}
              options={toOptions(JK_OPTIONS)}
              placeholder="— Pilih —"
            />
          </FormField>
          <FormField label="Agama">
            <SearchableSelect
              value={form.agama}
              onChange={(v) => set("agama", v)}
              options={toOptions(AGAMA_OPTIONS)}
              placeholder="—"
            />
          </FormField>
        </FormSection>

        <FormSection title="Kontak & Akun" description="Login Frappe dan kontak pribadi.">
          <FormField label="User" required hint="Email user Frappe (login)" className="col-span-2">
            <Input
              type="email"
              value={form.user}
              onChange={(e) => set("user", e.target.value)}
              placeholder="user@sekolah.sch.id"
            />
          </FormField>
          <FormField label="No HP">
            <Input
              value={form.no_hp}
              onChange={(e) => set("no_hp", e.target.value)}
              placeholder="08xxxxxxxxxx"
            />
          </FormField>
          <FormField label="Email Pribadi">
            <Input
              type="email"
              value={form.email_pribadi}
              onChange={(e) => set("email_pribadi", e.target.value)}
            />
          </FormField>
        </FormSection>

        <FormSection title="Kepegawaian" description="Status, identitas pegawai, dan penempatan.">
          <FormField label="Status Kepegawaian" required>
            <SearchableSelect
              value={form.status_kepegawaian}
              onChange={(v) => set("status_kepegawaian", v)}
              options={toOptions(STATUS_KEP_OPTIONS)}
              placeholder="— Pilih —"
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
          <FormField label="NIP" hint="Untuk PNS/PPPK">
            <Input value={form.nip} onChange={(e) => set("nip", e.target.value)} />
          </FormField>
          <FormField label="NUPTK">
            <Input value={form.nuptk} onChange={(e) => set("nuptk", e.target.value)} />
          </FormField>
          <FormField label="Pendidikan Terakhir">
            <SearchableSelect
              value={form.pendidikan_terakhir}
              onChange={(v) => set("pendidikan_terakhir", v)}
              options={toOptions(PENDIDIKAN_OPTIONS)}
              placeholder="—"
            />
          </FormField>
          <FormField label="Jabatan Fungsional">
            <Input
              value={form.jabatan_fungsional}
              onChange={(e) => set("jabatan_fungsional", e.target.value)}
              placeholder="Guru Madya / Tata Usaha / dll"
            />
          </FormField>
          <FormField label="TMT Pertama Kerja">
            <DatePicker
              value={form.tmt_pertama_kerja}
              onChange={(v) => set("tmt_pertama_kerja", v)}
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
