// The unified data contract every template + section renders against. The
// backend endpoint `sekolahpro.api.situs.get_site` returns this shape (snake_case
// keys are mapped to this camelCase contract in src/lib/site.ts).

import type { KategoriBerita, SectionKey, TemplateKey } from "./constants";

export interface SiteBrand {
  /** Primary brand color as a CSS color string (hex). */
  color: string;
  /** Secondary/accent color. */
  color2: string;
  logo: string | null;
  favicon: string | null;
  heroImage: string | null;
}

export interface SiteSocial {
  instagram?: string | undefined;
  facebook?: string | undefined;
  youtube?: string | undefined;
  tiktok?: string | undefined;
  whatsapp?: string | undefined;
}

/** Discriminator for a layout block; mirrors backend Situs Layout Block.tipe. */
export type BlockType =
  | "hero"
  | "keunggulan"
  | "statistik"
  | "testimoni"
  | "profil"
  | "berita"
  | "agenda"
  | "galeri"
  | "prestasi"
  | "ppdb"
  | "cta"
  | "kontak"
  | "richtext";

/** One ordered section on the homepage. `variant` selects a renderer skin. */
export interface LayoutBlock {
  tipe: BlockType;
  variant: string;
  aktif: boolean;
  judul?: string | undefined;
  subjudul?: string | undefined;
  ctaLabel?: string | undefined;
  ctaUrl?: string | undefined;
  /** HTML (Text Editor) for richtext blocks. */
  konten?: string | undefined;
}

export interface Keunggulan {
  ikon: string;
  judul: string;
  deskripsi: string;
}

export interface Statistik {
  label: string;
  nilai: string;
  satuan?: string | undefined;
}

export interface Testimoni {
  nama: string;
  peran?: string | undefined;
  foto?: string | undefined;
  kutipan: string;
}

/** Visual tokens sourced from the school's Template Situs record. */
export interface SiteTheme {
  heroVariant: string;
  radius: string;
  fontHeading: string;
  fontBody: string;
  shadow: string;
  sectionStyle: "card" | "flat" | "bordered";
}

export interface SiteProfil {
  tagline: string;
  heroJudul: string;
  heroSubjudul: string;
  heroCtaLabel: string;
  heroCtaUrl: string;
  visi: string;
  /** HTML (Text Editor). */
  misi: string;
  /** HTML (Text Editor). */
  sambutanKepsek: string;
  namaKepsek: string;
  alamat: string;
  /** Raw <iframe> embed string for an optional map. */
  petaEmbed: string;
  /** Small uppercase label above the hero title. */
  heroEyebrow?: string | undefined;
  /** Secondary hero CTA label. */
  heroCta2Label?: string | undefined;
  /** Secondary hero CTA url. */
  heroCta2Url?: string | undefined;
}

export interface SiteContact {
  telepon: string;
  email: string;
  whatsapp: string;
  alamat: string;
}

export interface SiteMeta {
  metaTitle: string;
  metaDescription: string;
  ogImage: string | null;
}

export interface NavLink {
  /** Route path under the site root, e.g. "/berita". */
  to: string;
  label: string;
  /** Section this nav entry maps to (for highlighting / analytics). */
  section: SectionKey;
}

/** The resolved per-school site configuration + profile. */
export interface SiteData {
  /** Sekolah doc name (the tenant key). */
  sekolah: string;
  nama: string;
  templateKey: TemplateKey;
  brand: SiteBrand;
  social: SiteSocial;
  profil: SiteProfil;
  contact: SiteContact;
  meta: SiteMeta;
  /** Enabled sections in canonical order. */
  sections: SectionKey[];
  nav: NavLink[];
  /** Ordered homepage blocks; empty => template derives a default layout. */
  layoutBlocks: LayoutBlock[];
  keunggulan: Keunggulan[];
  statistik: Statistik[];
  testimoni: Testimoni[];
  theme: SiteTheme;
  /** True when this is the offline/demo fallback (no live backend). */
  isDemo?: boolean;
  /** True when an unsaved-edit preview overlay is applied (CMS preview mode). */
  isPreview?: boolean;
}

export interface Berita {
  name: string;
  judul: string;
  slug: string;
  kategori: KategoriBerita;
  ringkasan: string;
  /** HTML body (only present on detail fetch). */
  konten?: string | undefined;
  gambarSampul: string | null;
  tanggalTerbit: string;
  penulis: string;
}

export interface Agenda {
  name: string;
  judul: string;
  tanggalMulai: string;
  tanggalSelesai: string | null;
  lokasi: string;
  deskripsi: string;
}

export interface Galeri {
  name: string;
  judul: string;
  gambar: string;
  kategori: string;
}

export interface Prestasi {
  name: string;
  judul: string;
  tingkat: string;
  tahun: number;
  peraih: string;
  deskripsi: string;
  gambar: string | null;
}

export interface Halaman {
  name: string;
  slug: string;
  judul: string;
  /** HTML body. */
  konten: string;
  ikon: string;
}

export interface PpdbGelombang {
  name: string;
  nama: string;
  tingkat: string;
  tanggalBuka: string;
  tanggalTutup: string;
  biayaPendaftaran: number;
  sisaKuota: number;
}

export interface PpdbInfo {
  dibuka: boolean;
  gelombang: PpdbGelombang[];
  jalur: string[];
  dokumen: string[];
  catatan: string;
}
