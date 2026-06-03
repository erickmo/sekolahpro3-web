// Single source of truth for situs section/template/status keys.
// MUST stay in sync with the backend module sekolahpro/website_sekolah/constants.py.
// The contract test (src/__tests__/contract.test.ts) asserts the template
// registry and section components only use keys declared here.

// klasik/modern/ceria also exist in the backend constants.py; aurora + the
// trio below (elegan/akademik/alam) are SPA-only data-driven skins, renderable
// via demo presets + the block engine but not yet backend-persistable.
export const TEMPLATE_KEYS = ["klasik", "modern", "ceria", "aurora", "elegan", "akademik", "alam"] as const;
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

// Block engine: the ordered set of renderable block types. MUST stay in sync
// with the backend Situs Layout Block.tipe Select and the SPA BlockType union.
export const BLOCK_TYPES = [
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
] as const;

// Renderer variants per block type. A block's `variant` selects which
// registered FC renders it; an unknown variant falls back to the first entry.
// `playful` is the ceria template's hero (backend template_situs fixture);
// `overlay` is the SPA-only skin from the plan. All five must resolve.
export const HERO_VARIANTS = ["split", "centered", "fullbleed", "overlay", "playful"] as const;
export type HeroVariant = (typeof HERO_VARIANTS)[number];
export const DEFAULT_HERO_VARIANT: HeroVariant = "split";

// Universal fallback variant key. Present as the FIRST entry in every section
// variant list so an unknown/blank variant resolves to it.
export const DEFAULT_VARIANT = "default";

// Per-type section variants. Each list INCLUDES the variants the backend
// template_situs default_layout fixtures emit (grid/cards/list/row/masonry/
// carousel/banner) plus `default` as the safe fallback.
export const KEUNGGULAN_VARIANTS = ["default", "grid", "cards"] as const;
export const STATISTIK_VARIANTS = ["default", "row", "bar", "tiles"] as const;
export const TESTIMONI_VARIANTS = ["default", "carousel", "grid"] as const;
export const BERITA_VARIANTS = ["default", "cards", "list"] as const;
export const GALERI_VARIANTS = ["default", "grid", "masonry"] as const;
export const PPDB_VARIANTS = ["default", "banner"] as const;
export const CTA_VARIANTS = ["default", "banner", "split"] as const;

// Section chrome style from Template Situs.section_style.
export const SECTION_STYLES = ["card", "flat", "bordered"] as const;
export type SectionStyle = (typeof SECTION_STYLES)[number];
export const DEFAULT_SECTION_STYLE: SectionStyle = "card";

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
