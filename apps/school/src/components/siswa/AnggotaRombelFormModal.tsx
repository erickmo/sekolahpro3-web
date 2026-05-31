/**
 * AnggotaRombelFormModal — append child row to "Rombongan Belajar".anggota.
 *
 * Anggota Rombel is istable=1 (child of Rombongan Belajar). REST create on the
 * child doctype is not supported standalone; instead fetch the parent rombel,
 * push a new row into its `anggota` array, then PUT the parent.
 */

import { useState, type ReactNode } from "react";
import {
  Button,
  DatePicker,
  FormField,
  FormGrid,
  Input,
  Modal,
  SearchableSelect,
  type SearchableOption,
} from "@sekolahpro/ui";
import { getResource, listResource, updateResource } from "@sekolahpro/api-client";
import { useQueryClient } from "@tanstack/react-query";

const ROMBEL_DOCTYPE = "Rombongan Belajar";
const ANGGOTA_DOCTYPE = "Anggota Rombel";
const SISWA_DOCTYPE = "Siswa";
const STATUS_OPTIONS = ["Aktif", "Keluar"] as const;

// Tanggal masuk bersifat transaksional (tahun ajaran berjalan), jadi rentang
// dropdown tahun cukup sempit di sekitar tahun sekarang.
const MIN_YEAR = new Date().getFullYear() - 10;
const MAX_YEAR = new Date().getFullYear() + 1;

interface AnggotaRow {
  siswa: string;
  no_urut?: number;
  tanggal_masuk_rombel?: string;
  status?: string;
}

interface ParentDoc {
  name: string;
  anggota?: AnggotaRow[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (rombel: string, siswa: string) => void;
}

interface FormState {
  rombel: string;
  siswa: string;
  no_urut: string;
  tanggal_masuk_rombel: string;
  status: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const initial = (): FormState => ({
  rombel: "",
  siswa: "",
  no_urut: "",
  tanggal_masuk_rombel: todayISO(),
  status: "Aktif",
});

/** Build static enum options for SearchableSelect. */
function toOptions(values: readonly string[]): SearchableOption[] {
  return values.map((v) => ({ value: v, label: v }));
}

/** Async option loader untuk rombel aktif saja. */
async function searchRombelAktif(q: string): Promise<SearchableOption[]> {
  const rows = await listResource<Record<string, string>>(ROMBEL_DOCTYPE, {
    fields: ["name", "nama_rombel"],
    filters: [["status", "=", "Aktif"]],
    ...(q ? { or_filters: [["name", "like", `%${q}%`], ["nama_rombel", "like", `%${q}%`]] as [string, string, unknown][] } : {}),
    limit_page_length: 20,
    order_by: "modified desc",
  });
  return rows.map((r) => ({ value: r.name ?? "", label: r.nama_rombel ? `${r.nama_rombel} (${r.name})` : (r.name ?? "") }));
}

/** Async option loader untuk siswa (label nama + NIS). */
async function searchSiswa(q: string): Promise<SearchableOption[]> {
  const rows = await listResource<Record<string, string>>(SISWA_DOCTYPE, {
    fields: ["name", "nama_lengkap", "nis"],
    ...(q ? { or_filters: [["name", "like", `%${q}%`], ["nama_lengkap", "like", `%${q}%`], ["nis", "like", `%${q}%`]] as [string, string, unknown][] } : {}),
    limit_page_length: 20,
    order_by: "modified desc",
  });
  return rows.map((r) => ({
    value: r.name ?? "",
    label: r.nama_lengkap ? `${r.nama_lengkap}${r.nis ? ` · ${r.nis}` : ""}` : (r.name ?? ""),
  }));
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

export function AnggotaRombelFormModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(initial);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const qc = useQueryClient();

  const set = <K extends keyof FormState>(k: K, v: string) =>
    setForm((cur) => ({ ...cur, [k]: v }));

  const reset = () => {
    setForm(initial());
    setErr(null);
  };

  const close = () => {
    if (pending) return;
    reset();
    onClose();
  };

  const canSubmit = !!form.rombel && !!form.siswa && !!form.status && !pending;

  const submit = async () => {
    setErr(null);
    setPending(true);
    try {
      const parent = await getResource<ParentDoc>(ROMBEL_DOCTYPE, form.rombel);
      const existing = parent.anggota ?? [];
      if (existing.some((r) => r.siswa === form.siswa)) {
        throw new Error("Siswa sudah terdaftar di rombel ini.");
      }
      const row: AnggotaRow = {
        siswa: form.siswa,
        status: form.status,
        tanggal_masuk_rombel: form.tanggal_masuk_rombel || todayISO(),
      };
      if (form.no_urut.trim()) row.no_urut = Number(form.no_urut);

      await updateResource(ROMBEL_DOCTYPE, form.rombel, {
        anggota: [...existing, row],
      });
      await qc.invalidateQueries({ queryKey: ["resource:list", ANGGOTA_DOCTYPE] });
      await qc.invalidateQueries({ queryKey: ["resource:list", ROMBEL_DOCTYPE] });
      await qc.invalidateQueries({ queryKey: ["resource:doc", ROMBEL_DOCTYPE, form.rombel] });
      reset();
      if (onCreated) onCreated(form.rombel, form.siswa);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal menambah anggota rombel.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="mega"
      tone="brand"
      title="Tambah Anggota Rombel"
      description="Tambahkan siswa ke rombongan belajar. Tanda * wajib diisi."
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={pending}>Batal</Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {pending ? "Menyimpan…" : "Simpan"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <FormSection title="Penempatan" description="Rombel aktif tujuan dan siswa yang ditambahkan.">
          <FormField label="Rombongan Belajar" required>
            <SearchableSelect
              value={form.rombel}
              onChange={(v) => set("rombel", v)}
              loadOptions={searchRombelAktif}
              placeholder="Cari rombel aktif…"
            />
          </FormField>
          <FormField label="Siswa" required>
            <SearchableSelect
              value={form.siswa}
              onChange={(v) => set("siswa", v)}
              loadOptions={searchSiswa}
              placeholder="Cari siswa…"
            />
          </FormField>
        </FormSection>

        <FormSection title="Detail Keanggotaan" description="Nomor absen, tanggal masuk, dan status.">
          <FormField label="No. Urut/Absen">
            <Input
              type="number"
              min={0}
              value={form.no_urut}
              onChange={(e) => set("no_urut", e.target.value)}
            />
          </FormField>
          <FormField label="Tanggal Masuk">
            <DatePicker
              value={form.tanggal_masuk_rombel}
              onChange={(v) => set("tanggal_masuk_rombel", v)}
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
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

        {err && (
          <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {err}
          </div>
        )}
      </div>
    </Modal>
  );
}
