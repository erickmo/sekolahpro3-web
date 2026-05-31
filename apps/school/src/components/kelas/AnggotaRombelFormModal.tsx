/**
 * AnggotaRombelFormModal — create modal untuk CHILD doctype "Anggota Rombel".
 *
 * Child table dari Rombongan Belajar (parentfield = "anggota"). Payload wajib
 * menyertakan parent/parenttype/parentfield untuk dibuat via REST.
 */

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
  type SearchableOption,
} from "@sekolahpro/ui";
import { listResource, useResourceCreate } from "@sekolahpro/api-client";

const ANGGOTA_DOCTYPE = "Anggota Rombel";
const ROMBEL_PARENTTYPE = "Rombongan Belajar";
const ROMBEL_PARENTFIELD = "anggota";
const STATUS_OPTIONS = ["Aktif", "Keluar"] as const;

// Tanggal masuk rombel bersifat transaksional (tahun ajaran berjalan), jadi
// rentang dropdown tahun cukup sempit di sekitar tahun sekarang.
const MIN_YEAR = new Date().getFullYear() - 10;
const MAX_YEAR = new Date().getFullYear() + 1;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

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

export function AnggotaRombelFormModal({ open, onClose, onCreated }: Props) {
  const qc = useQueryClient();
  const [parent, setParent] = useState("");
  const [siswa, setSiswa] = useState("");
  const [noUrut, setNoUrut] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [status, setStatus] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  const create = useResourceCreate<{ name: string }>(ANGGOTA_DOCTYPE);

  const reset = () => {
    setParent("");
    setSiswa("");
    setNoUrut("");
    setTanggal("");
    setStatus("");
    setErr(null);
  };

  const closeAll = () => {
    reset();
    onClose();
  };

  const requiredMissing = !parent || !siswa;

  const submit = async () => {
    setErr(null);
    const payload: Record<string, unknown> = {
      parent,
      parenttype: ROMBEL_PARENTTYPE,
      parentfield: ROMBEL_PARENTFIELD,
      siswa,
    };
    if (noUrut.trim()) {
      const n = Number(noUrut);
      if (!Number.isNaN(n)) payload.no_urut = n;
    }
    if (tanggal) payload.tanggal_masuk_rombel = tanggal;
    if (status) payload.status = status;
    try {
      const created = await create.mutateAsync(payload);
      await qc.invalidateQueries({ queryKey: ["resource:list", ANGGOTA_DOCTYPE] });
      onCreated?.(created.name);
      reset();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat anggota rombel.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={closeAll}
      size="mega"
      tone="brand"
      title="Tambah Anggota Rombel"
      description="Pilih rombel tujuan lalu isi data anggota. Tanda * wajib diisi."
      footer={
        <>
          <Button variant="outline" onClick={closeAll} disabled={create.isPending}>
            Batal
          </Button>
          <Button onClick={submit} disabled={requiredMissing || create.isPending}>
            {create.isPending ? "Menyimpan…" : "Simpan"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <FormSection title="Penempatan" description="Rombel tujuan dan siswa yang ditambahkan.">
          <FormField label="Rombel" required>
            <SearchableSelect
              value={parent}
              onChange={(v) => setParent(v)}
              loadOptions={(q) => searchLink(ROMBEL_PARENTTYPE, "nama_rombel", q)}
              placeholder="Cari rombel…"
            />
          </FormField>
          <FormField label="Siswa" required>
            <SearchableSelect
              value={siswa}
              onChange={(v) => setSiswa(v)}
              loadOptions={(q) => searchLink("Siswa", "nama_lengkap", q)}
              placeholder="Cari siswa…"
            />
          </FormField>
        </FormSection>

        <FormSection title="Detail Keanggotaan" description="Nomor urut, tanggal masuk, dan status.">
          <FormField label="No. Urut">
            <Input
              type="number"
              value={noUrut}
              onChange={(e) => setNoUrut(e.target.value)}
            />
          </FormField>
          <FormField label="Tanggal Masuk Rombel">
            <DatePicker
              value={tanggal}
              onChange={(v) => setTanggal(v)}
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
            />
          </FormField>
          <FormField label="Status">
            <SearchableSelect
              value={status}
              onChange={(v) => setStatus(v)}
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
