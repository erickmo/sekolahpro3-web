import type { ChildSchema, KontenField } from "./schemas";
import type { BlockTipe } from "../../data/situs";

// Schemas for the Situs Sekolah child tables (keunggulan/statistik/testimoni)
// and the layout-block editor. Field names MUST stay in sync with the backend
// doctype JSON in website_sekolah and the SPA block registry (apps/situs).

export const KEUNGGULAN_SCHEMA: ChildSchema = {
  field: "keunggulan",
  singular: "Keunggulan",
  titleField: "judul",
  fields: [
    { name: "ikon", label: "Ikon", type: "text" },
    { name: "judul", label: "Judul", type: "text", required: true, listColumn: true },
    { name: "deskripsi", label: "Deskripsi", type: "textarea" },
  ],
};

export const STATISTIK_SCHEMA: ChildSchema = {
  field: "statistik",
  singular: "Statistik",
  titleField: "label",
  fields: [
    { name: "label", label: "Label", type: "text", required: true, listColumn: true },
    { name: "nilai", label: "Nilai", type: "text", required: true, listColumn: true },
    { name: "satuan", label: "Satuan", type: "text" },
  ],
};

export const TESTIMONI_SCHEMA: ChildSchema = {
  field: "testimoni",
  singular: "Testimoni",
  titleField: "nama",
  fields: [
    { name: "nama", label: "Nama", type: "text", required: true, listColumn: true },
    { name: "peran", label: "Peran", type: "text", listColumn: true },
    { name: "foto", label: "Foto", type: "image" },
    { name: "kutipan", label: "Kutipan", type: "textarea", required: true },
  ],
};

// Presentational fields editable per layout block (in addition to tipe/variant/aktif).
export const LAYOUT_BLOCK_FIELDS: KontenField[] = [
  { name: "judul", label: "Judul Section", type: "text" },
  { name: "subjudul", label: "Subjudul", type: "textarea" },
  { name: "cta_label", label: "Label Tombol", type: "text" },
  { name: "cta_url", label: "URL Tombol", type: "text" },
  { name: "konten", label: "Konten", type: "richtext" },
];

// Block type catalogue — mirrors the backend Situs Layout Block `tipe` Select
// and the 13 BLOCK_TYPES in the SPA (apps/situs/src/constants.ts).
export const BLOCK_TIPE_OPTIONS = [
  "hero",
  "keunggulan",
  "statistik",
  "testimoni",
  "profil",
  "berita",
  "agenda",
  "galeri",
  "prestasi",
  "ppdb",
  "cta",
  "kontak",
  "richtext",
] as const satisfies readonly BlockTipe[];

// Human-readable Indonesian labels per block type for the layout-builder UI.
// Keyed by every BLOCK_TIPE_OPTIONS member so dropdowns/cards never show a bare key.
export const BLOCK_TIPE_LABELS: Record<BlockTipe, string> = {
  hero: "Hero",
  keunggulan: "Keunggulan",
  statistik: "Statistik",
  testimoni: "Testimoni",
  profil: "Profil Sekolah",
  berita: "Berita",
  agenda: "Agenda",
  galeri: "Galeri",
  prestasi: "Prestasi",
  ppdb: "PPDB",
  cta: "Ajakan (CTA)",
  kontak: "Kontak",
  richtext: "Teks Bebas",
};

// Variant options per block type for the CMS dropdowns. MUST match the SPA
// block registry (apps/situs/src/templates/blocks/registry.ts) so every picked
// variant resolves to a real renderer. `default` is the universal fallback.
export const BLOCK_VARIANTS: Record<BlockTipe, string[]> = {
  hero: ["split", "centered", "fullbleed", "overlay", "playful"],
  keunggulan: ["default", "grid", "cards"],
  statistik: ["default", "row", "bar", "tiles"],
  testimoni: ["default", "carousel", "grid"],
  profil: ["default"],
  berita: ["default", "cards", "list"],
  agenda: ["default"],
  galeri: ["default", "grid", "masonry"],
  prestasi: ["default"],
  ppdb: ["default", "banner"],
  cta: ["default", "banner", "split"],
  kontak: ["default"],
  richtext: ["default"],
};
