import type { KontenDoctype } from "../../data/situs";

// Field schemas drive the generic KontenManager so all five content types share
// one CRUD component (no per-doctype duplication). Keep field names in sync with
// the backend doctype JSON in website_sekolah.

export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "select"
  | "date"
  | "datetime"
  | "number"
  | "image"
  | "check";

export interface KontenField {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  /** Show this field as a column in the list table. */
  listColumn?: boolean;
}

export interface KontenSchema {
  doctype: KontenDoctype;
  singular: string;
  /** Field used as the row title in the table. */
  titleField: string;
  fields: KontenField[];
}

/** Schema for a Situs Sekolah child table (rows saved as an array, no own doctype CRUD). */
export interface ChildSchema {
  /** snake_case parent field holding the rows (e.g. "keunggulan"). */
  field: string;
  /** Singular human label, e.g. "Keunggulan". */
  singular: string;
  /** Field shown as the row title in the list. */
  titleField: string;
  fields: KontenField[];
}

const STATUS: KontenField = {
  name: "status",
  label: "Status",
  type: "select",
  options: ["Draft", "Terbit"],
  required: true,
  listColumn: true,
};

export const BERITA_SCHEMA: KontenSchema = {
  doctype: "Berita Sekolah",
  singular: "Berita",
  titleField: "judul",
  fields: [
    { name: "judul", label: "Judul", type: "text", required: true, listColumn: true },
    { name: "kategori", label: "Kategori", type: "select", options: ["Berita", "Pengumuman", "Agenda", "Prestasi", "Artikel"], listColumn: true },
    { name: "ringkasan", label: "Ringkasan", type: "textarea" },
    { name: "konten", label: "Isi (HTML)", type: "richtext", required: true },
    { name: "gambar_sampul", label: "Gambar Sampul (URL)", type: "image" },
    { name: "penulis", label: "Penulis", type: "text" },
    { name: "tanggal_terbit", label: "Tanggal Terbit", type: "date", listColumn: true },
    STATUS,
  ],
};

export const HALAMAN_SCHEMA: KontenSchema = {
  doctype: "Halaman Situs",
  singular: "Halaman",
  titleField: "judul",
  fields: [
    { name: "judul", label: "Judul", type: "text", required: true, listColumn: true },
    { name: "slug", label: "Slug (opsional)", type: "text" },
    { name: "ikon", label: "Ikon", type: "text" },
    { name: "konten", label: "Isi (HTML)", type: "richtext" },
    { name: "urutan", label: "Urutan", type: "number" },
    { name: "tampilkan_di_nav", label: "Tampilkan di Navigasi", type: "check", listColumn: true },
    STATUS,
  ],
};

export const AGENDA_SCHEMA: KontenSchema = {
  doctype: "Agenda Sekolah",
  singular: "Agenda",
  titleField: "judul",
  fields: [
    { name: "judul", label: "Judul", type: "text", required: true, listColumn: true },
    { name: "tanggal_mulai", label: "Tanggal Mulai", type: "datetime", required: true, listColumn: true },
    { name: "tanggal_selesai", label: "Tanggal Selesai", type: "datetime" },
    { name: "lokasi", label: "Lokasi", type: "text", listColumn: true },
    { name: "deskripsi", label: "Deskripsi", type: "textarea" },
    STATUS,
  ],
};

export const GALERI_SCHEMA: KontenSchema = {
  doctype: "Galeri Sekolah",
  singular: "Foto",
  titleField: "judul",
  fields: [
    { name: "judul", label: "Judul", type: "text", required: true, listColumn: true },
    { name: "gambar", label: "Gambar (URL)", type: "image", required: true },
    { name: "kategori", label: "Kategori", type: "text", listColumn: true },
    { name: "urutan", label: "Urutan", type: "number" },
    STATUS,
  ],
};

export const PRESTASI_SCHEMA: KontenSchema = {
  doctype: "Prestasi Sekolah",
  singular: "Prestasi",
  titleField: "judul",
  fields: [
    { name: "judul", label: "Judul", type: "text", required: true, listColumn: true },
    { name: "tingkat", label: "Tingkat", type: "select", options: ["Sekolah", "Kecamatan", "Kabupaten", "Kota", "Provinsi", "Nasional", "Internasional"], listColumn: true },
    { name: "tahun", label: "Tahun", type: "number", listColumn: true },
    { name: "peraih", label: "Peraih", type: "text", listColumn: true },
    { name: "deskripsi", label: "Deskripsi", type: "textarea" },
    { name: "gambar", label: "Gambar (URL)", type: "image" },
    STATUS,
  ],
};
