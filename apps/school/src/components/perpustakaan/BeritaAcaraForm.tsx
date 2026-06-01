/**
 * BeritaAcaraForm — input fields for a BA Kerusakan Buku detail.
 *
 * Layer: presentational component (perpustakaan domain). Renders the three
 * report sections (incident identity, incident detail + photo, decision) and
 * lifts every change to the parent via `set_doc`. Owns no data fetch beyond
 * the inline eksemplar/user option search used by the SearchableSelects.
 */
import type { Dispatch, SetStateAction } from "react";
import {
  FormField,
  FormGrid,
  Input,
  SearchableSelect,
  SectionCard,
  Textarea,
  DatePicker,
  type SearchableOption,
} from "@sekolahpro/ui";
import { listResource } from "@sekolahpro/api-client";
import { perpToday, perpFormatRupiah } from "./perpFormatters";
import { BeritaAcaraPhotoCapture } from "./BeritaAcaraPhotoCapture";

/** Shape of the BA Kerusakan Buku document edited by this form. */
export type BA = {
  name?: string;
  tanggal_kejadian: string;
  eksemplar: string;
  pelapor: string;
  jenis_kerusakan: "" | "Rusak Ringan" | "Rusak Berat" | "Hilang";
  keputusan: "" | "Diperbaiki" | "Hapus" | "Ganti Rugi";
  nilai_ganti_rugi: number;
  deskripsi: string;
  foto: string;
  catatan_keputusan: string;
  docstatus?: number;
};

/** Blank BA seeded with today's date for the "new" flow. */
export function defaultBA(): BA {
  return {
    tanggal_kejadian: perpToday(),
    eksemplar: "",
    pelapor: "",
    jenis_kerusakan: "",
    keputusan: "",
    nilai_ganti_rugi: 0,
    deskripsi: "",
    foto: "",
    catatan_keputusan: "",
  };
}

async function searchEksemplar(q: string): Promise<SearchableOption[]> {
  const filters = q
    ? { or_filters: [["name", "like", `%${q}%`], ["nomor_inventaris", "like", `%${q}%`]] as [string, string, unknown][] }
    : {};
  const rows = await listResource<{ name: string; nomor_inventaris?: string; buku?: string }>("Eksemplar Buku", {
    fields: ["name", "nomor_inventaris", "buku"],
    ...filters,
    limit_page_length: 20,
    order_by: "modified desc",
  });
  return rows.map((r) => {
    const opt: SearchableOption = { value: r.name, label: r.nomor_inventaris ?? r.name };
    if (r.buku) opt.hint = r.buku;
    return opt;
  });
}

async function searchPelapor(q: string): Promise<SearchableOption[]> {
  const f = q ? { or_filters: [["name", "like", `%${q}%`], ["full_name", "like", `%${q}%`]] as [string, string, unknown][] } : {};
  const rows = await listResource<{ name: string; full_name?: string }>("User", {
    fields: ["name", "full_name"], ...f, limit_page_length: 20,
  });
  return rows.map((r) => ({ value: r.name, label: r.full_name ?? r.name }));
}

const JENIS_OPTIONS: SearchableOption[] = [
  { value: "Rusak Ringan", label: "Rusak Ringan" },
  { value: "Rusak Berat", label: "Rusak Berat" },
  { value: "Hilang", label: "Hilang" },
];

const KEPUTUSAN_OPTIONS: SearchableOption[] = [
  { value: "Diperbaiki", label: "Diperbaiki" },
  { value: "Hapus", label: "Hapus (eksemplar arsip)" },
  { value: "Ganti Rugi", label: "Ganti Rugi" },
];

interface Props {
  doc: BA;
  set_doc: Dispatch<SetStateAction<BA>>;
  /** When true (BA submitted) all inputs are disabled. */
  is_readonly: boolean;
  /** When true the photo field shows a required asterisk. */
  photo_required: boolean;
  /** Suggested ganti-rugi value (buku price) for the decision section hint. */
  suggested_rugi: number;
  /** Surfaces photo-capture errors to the parent's error banner. */
  on_photo_error: (message: string) => void;
}

/** Section: incident identity (date, eksemplar, reporter, damage type). */
function IdentitasSection({ doc, set_doc, is_readonly }: Pick<Props, "doc" | "set_doc" | "is_readonly">) {
  return (
    <SectionCard title="Identitas Insiden">
      <FormGrid cols={3}>
        <FormField label="Tanggal Kejadian" htmlFor="tgl" required>
          <DatePicker id="tgl" value={doc.tanggal_kejadian} disabled={is_readonly}
            onChange={(v) => set_doc((p) => ({ ...p, tanggal_kejadian: v }))} />
        </FormField>
        <FormField label="Eksemplar" htmlFor="eks" required>
          <SearchableSelect
            value={doc.eksemplar}
            disabled={is_readonly}
            onChange={(v) => set_doc((p) => ({ ...p, eksemplar: v }))}
            loadOptions={searchEksemplar}
            resolveLabel={async (v) => v}
            placeholder="Cari nomor inventaris…"
          />
        </FormField>
        <FormField label="Pelapor" htmlFor="pelapor">
          <SearchableSelect
            value={doc.pelapor}
            disabled={is_readonly}
            onChange={(v) => set_doc((p) => ({ ...p, pelapor: v }))}
            loadOptions={searchPelapor}
            resolveLabel={async (v) => v}
            placeholder="Cari user…"
          />
        </FormField>
        <FormField label="Jenis Kerusakan" htmlFor="jenis" required>
          <SearchableSelect
            id="jenis"
            value={doc.jenis_kerusakan}
            disabled={is_readonly}
            onChange={(v) => set_doc((p) => ({ ...p, jenis_kerusakan: v as BA["jenis_kerusakan"] }))}
            options={JENIS_OPTIONS}
            placeholder="— Pilih —"
          />
        </FormField>
      </FormGrid>
    </SectionCard>
  );
}

/** Section: incident detail (description + evidence photo). */
function DetailSection({
  doc,
  set_doc,
  is_readonly,
  photo_required,
  on_photo_error,
}: Pick<Props, "doc" | "set_doc" | "is_readonly" | "photo_required" | "on_photo_error">) {
  return (
    <SectionCard title="Detail Kejadian">
      <FormField label="Deskripsi Kerusakan" htmlFor="desk">
        <Textarea id="desk" value={doc.deskripsi} disabled={is_readonly} rows={4}
          onChange={(e) => set_doc((p) => ({ ...p, deskripsi: e.target.value }))} />
      </FormField>
      <BeritaAcaraPhotoCapture
        foto={doc.foto}
        is_readonly={is_readonly}
        photo_required={photo_required}
        on_uploaded={(url) => set_doc((p) => ({ ...p, foto: url }))}
        on_clear={() => set_doc((p) => ({ ...p, foto: "" }))}
        on_error={on_photo_error}
      />
    </SectionCard>
  );
}

/** Section: decision (keputusan, ganti-rugi value, note). */
function KeputusanSection({
  doc,
  set_doc,
  is_readonly,
  suggested_rugi,
}: Pick<Props, "doc" | "set_doc" | "is_readonly" | "suggested_rugi">) {
  return (
    <SectionCard title="Keputusan" description="Diputuskan oleh Kepala Perpustakaan saat approve.">
      <FormGrid cols={2}>
        <FormField label="Keputusan" htmlFor="keputusan">
          <SearchableSelect
            id="keputusan"
            value={doc.keputusan}
            disabled={is_readonly}
            onChange={(v) => set_doc((p) => ({ ...p, keputusan: v as BA["keputusan"] }))}
            options={KEPUTUSAN_OPTIONS}
            placeholder="— Belum diputuskan —"
          />
        </FormField>
        <FormField label="Nilai Ganti Rugi (Rp)" htmlFor="rugi"
          hint={suggested_rugi > 0 ? `Saran (harga buku): ${perpFormatRupiah(suggested_rugi)}` : undefined}>
          <Input id="rugi" type="number" min={0} value={String(doc.nilai_ganti_rugi)}
            disabled={is_readonly || doc.keputusan !== "Ganti Rugi"}
            onChange={(e) => set_doc((p) => ({ ...p, nilai_ganti_rugi: Number(e.target.value) }))} />
        </FormField>
      </FormGrid>
      <FormField label="Catatan Keputusan" htmlFor="catkep">
        <Textarea id="catkep" value={doc.catatan_keputusan} disabled={is_readonly} rows={2}
          onChange={(e) => set_doc((p) => ({ ...p, catatan_keputusan: e.target.value }))} />
      </FormField>
    </SectionCard>
  );
}

/**
 * BeritaAcaraForm composes the three editable report sections. State lives in
 * the parent route; this component is a controlled view over `doc` + `set_doc`.
 */
export function BeritaAcaraForm({ doc, set_doc, is_readonly, photo_required, suggested_rugi, on_photo_error }: Props) {
  return (
    <>
      <IdentitasSection doc={doc} set_doc={set_doc} is_readonly={is_readonly} />
      <DetailSection
        doc={doc}
        set_doc={set_doc}
        is_readonly={is_readonly}
        photo_required={photo_required}
        on_photo_error={on_photo_error}
      />
      <KeputusanSection doc={doc} set_doc={set_doc} is_readonly={is_readonly} suggested_rugi={suggested_rugi} />
    </>
  );
}
