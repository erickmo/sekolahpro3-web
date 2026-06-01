// Single source of truth for situs section/template/status keys.
// MUST stay in sync with the backend module sekolahpro/website_sekolah/constants.py.
// The contract test (src/__tests__/contract.test.ts) asserts the template
// registry and section components only use keys declared here.

export const TEMPLATE_KEYS = ["klasik", "modern", "ceria"] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];
export const DEFAULT_TEMPLATE: TemplateKey = "klasik";

// Ordered list of all renderable sections. A school enables a subset via the
// `tampilkan_*` toggles on Situs Sekolah; the resolved SiteData.sections holds
// the enabled subset in this canonical order.
export const SECTION_KEYS = [
  "hero",
  "profil",
  "berita",
  "agenda",
  "galeri",
  "prestasi",
  "fasilitas",
  "ppdb",
  "kontak",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const STATUS_DRAFT = "Draft";
export const STATUS_TERBIT = "Terbit";

// Aligned with News Article.category where it overlaps (see ADR isolation note).
export const KATEGORI_BERITA = [
  "Berita",
  "Pengumuman",
  "Agenda",
  "Prestasi",
  "Artikel",
] as const;
export type KategoriBerita = (typeof KATEGORI_BERITA)[number];

export const TINGKAT_PRESTASI = [
  "Sekolah",
  "Kecamatan",
  "Kabupaten",
  "Kota",
  "Provinsi",
  "Nasional",
  "Internasional",
] as const;

export const PPDB_JALUR = ["Reguler", "Prestasi", "Afirmasi", "Mutasi"] as const;

// Human labels for nav + section headings (Indonesian UI).
export const SECTION_LABELS: Record<SectionKey, string> = {
  hero: "Beranda",
  profil: "Profil",
  berita: "Berita",
  agenda: "Agenda",
  galeri: "Galeri",
  prestasi: "Prestasi",
  fasilitas: "Fasilitas",
  ppdb: "PPDB",
  kontak: "Kontak",
};
