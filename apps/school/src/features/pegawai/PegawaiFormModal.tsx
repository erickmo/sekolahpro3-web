import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { listResource, createResource, updateResource } from "@sekolahpro/api-client";
import type { PegawaiApi } from "./roles";

const PEGAWAI_DOCTYPE = "Pegawai";
const ROLE_GURU = "Pegawai Guru";
const ROLE_STAFF = "Pegawai Staff";

// Year range for date pickers. Birth/employment dates can reach back decades,
// so expose a wide dropdown range for fast year jumping.
const MIN_YEAR = 1940;
const MAX_YEAR = new Date().getFullYear() + 1;

type ScalarField = {
  name: keyof PegawaiApi | "tempat_lahir" | "agama" | "no_hp" | "email_pribadi" | "alamat" | "pendidikan_terakhir" | "golongan";
  label: string;
  type: "text" | "date" | "select" | "textarea";
  required?: boolean;
  colSpan?: 1 | 2;
  options?: string[];
};

type FieldSection = {
  title: string;
  description?: string;
  fields: ScalarField[];
};

// Fields grouped into logical sections for an easy-to-scan form.
const FIELD_SECTIONS: FieldSection[] = [
  {
    title: "Identitas Diri",
    description: "Data pribadi sesuai dokumen resmi.",
    fields: [
      { name: "nama_lengkap", label: "Nama Lengkap", type: "text", required: true, colSpan: 2 },
      { name: "nik", label: "NIK", type: "text", required: true },
      { name: "tempat_lahir", label: "Tempat Lahir", type: "text" },
      { name: "tanggal_lahir", label: "Tanggal Lahir", type: "date", required: true },
      { name: "jenis_kelamin", label: "Jenis Kelamin", type: "select", required: true, options: ["Laki-laki", "Perempuan"] },
      { name: "agama", label: "Agama", type: "select", options: ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"] },
    ],
  },
  {
    title: "Kontak",
    description: "Informasi kontak pribadi pegawai.",
    fields: [
      { name: "no_hp", label: "No. HP", type: "text" },
      { name: "email_pribadi", label: "Email Pribadi", type: "text" },
      { name: "alamat", label: "Alamat", type: "textarea", colSpan: 2 },
    ],
  },
  {
    title: "Kepegawaian",
    description: "Status dan jenjang kepegawaian.",
    fields: [
      { name: "status_kepegawaian", label: "Status Kepegawaian", type: "select", required: true, options: ["PNS", "PPPK", "GTY", "GTT", "Honorer"] },
      { name: "nip", label: "NIP", type: "text" },
      { name: "nuptk", label: "NUPTK", type: "text" },
      { name: "jabatan_fungsional", label: "Jabatan Fungsional", type: "text" },
      { name: "pendidikan_terakhir", label: "Pendidikan Terakhir", type: "select", options: ["SMA", "D3", "S1", "S2", "S3"] },
    ],
  },
];

const ALL_FIELDS: ScalarField[] = FIELD_SECTIONS.flatMap((s) => s.fields);

function toOptions(values: string[]): SearchableOption[] {
  return values.map((v) => ({ value: v, label: v }));
}

async function searchLink(doctype: string, labelField: string, q: string): Promise<SearchableOption[]> {
  const rows = await listResource<Record<string, string>>(doctype, {
    fields: ["name", labelField],
    ...(q ? { or_filters: [["name", "like", `%${q}%`], [labelField, "like", `%${q}%`]] as [string, string, unknown][] } : {}),
    limit_page_length: 20,
    order_by: "modified desc",
  });
  return rows.map((r) => ({ value: r.name ?? "", label: r[labelField] ? `${r[labelField]} (${r.name})` : (r.name ?? "") }));
}

export interface PegawaiFormModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initial?: PegawaiApi;
  onSaved?: (name: string) => void;
}

function initialValues(p?: PegawaiApi): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of ALL_FIELDS) out[f.name] = (p?.[f.name as keyof PegawaiApi] as string | undefined) ?? "";
  return out;
}

/** Section heading + grid wrapper for one logical group of fields. */
function FormSection({ title, description, children }: { title: string; description?: string | undefined; children: ReactNode }) {
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

export function PegawaiFormModal({ open, onClose, mode, initial, onSaved }: PegawaiFormModalProps) {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(initial));
  const [user, setUser] = useState(initial?.user ?? "");
  const [sekolah, setSekolah] = useState(initial?.sekolah ?? "");
  const [isGuru, setIsGuru] = useState(() => (initial?.roles ?? []).some((r) => r.role === ROLE_GURU));
  const [isStaff, setIsStaff] = useState(() => (initial?.roles ?? []).some((r) => r.role === ROLE_STAFF));
  const [aktif, setAktif] = useState(initial?.is_aktif !== 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));

  const missingRequired =
    ALL_FIELDS.some((f) => f.required && !values[f.name]) || !user || !sekolah || (!isGuru && !isStaff);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const roles: { role: string }[] = [];
      if (isGuru) roles.push({ role: ROLE_GURU });
      if (isStaff) roles.push({ role: ROLE_STAFF });
      const payload: Record<string, unknown> = {
        ...Object.fromEntries(Object.entries(values).filter(([, v]) => v !== "")),
        user,
        sekolah,
        roles,
        is_aktif: aktif ? 1 : 0,
      };
      const doc =
        mode === "create"
          ? await createResource<{ name: string }>(PEGAWAI_DOCTYPE, payload)
          : await updateResource<{ name: string }>(PEGAWAI_DOCTYPE, initial!.name, payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", PEGAWAI_DOCTYPE] });
      await qc.invalidateQueries({ queryKey: ["resource:doc", PEGAWAI_DOCTYPE, doc.name] });
      onSaved?.(doc.name);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const renderField = (f: ScalarField): ReactNode => {
    const v = values[f.name] ?? "";
    if (f.type === "date")
      return (
        <DatePicker
          value={v}
          onChange={(d) => set(f.name, d)}
          captionLayout="dropdown-buttons"
          fromYear={MIN_YEAR}
          toYear={MAX_YEAR}
        />
      );
    if (f.type === "textarea") return <Textarea value={v} onChange={(e) => set(f.name, e.target.value)} />;
    if (f.type === "select")
      return (
        <SearchableSelect
          value={v}
          onChange={(val) => set(f.name, val)}
          options={toOptions(f.options ?? [])}
          placeholder="— pilih —"
        />
      );
    return <Input value={v} onChange={(e) => set(f.name, e.target.value)} />;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Tambah Pegawai" : "Ubah Pegawai"}
      description="Lengkapi data pegawai. Tanda * wajib diisi."
      size="mega"
      tone="brand"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Batal</Button>
          <Button onClick={submit} disabled={busy || missingRequired}>{busy ? "Menyimpan…" : "Simpan"}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <FormSection title="Akun & Penempatan" description="Akun login dan sekolah penempatan pegawai.">
          <FormField label="User (akun login)" required>
            <SearchableSelect value={user} onChange={setUser} loadOptions={(q) => searchLink("User", "full_name", q)} placeholder="Cari user…" disabled={mode === "edit"} />
          </FormField>
          <FormField label="Sekolah" required>
            <SearchableSelect value={sekolah} onChange={setSekolah} loadOptions={(q) => searchLink("Sekolah", "nama_sekolah", q)} placeholder="Cari sekolah…" />
          </FormField>
          <FormField label="Role" required hint="Minimal satu" className="col-span-2">
            <div className="flex flex-wrap items-center gap-4 text-sm py-1.5">
              <label className="flex items-center gap-2"><input type="checkbox" checked={isGuru} onChange={(e) => setIsGuru(e.target.checked)} /> Guru</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={isStaff} onChange={(e) => setIsStaff(e.target.checked)} /> Staff</label>
              <label className="flex items-center gap-2 ml-auto"><input type="checkbox" checked={aktif} onChange={(e) => setAktif(e.target.checked)} /> Aktif</label>
            </div>
          </FormField>
        </FormSection>

        {FIELD_SECTIONS.map((sec) => (
          <FormSection key={sec.title} title={sec.title} description={sec.description}>
            {sec.fields.map((f) => (
              <FormField key={f.name} label={f.label} required={f.required} className={f.colSpan === 2 ? "col-span-2" : undefined}>
                {renderField(f)}
              </FormField>
            ))}
          </FormSection>
        ))}

        {error ? <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div> : null}
      </div>
    </Modal>
  );
}
