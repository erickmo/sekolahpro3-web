// Resolve the per-school site from the request host (or a dev override), map the
// backend payload to the SiteData contract, and expose it via react-query.

import { useQuery } from "@tanstack/react-query";
import {
  BLOCK_TYPES,
  DEFAULT_HERO_VARIANT,
  DEFAULT_SECTION_STYLE,
  DEFAULT_TEMPLATE,
  DEFAULT_VARIANT,
  SECTION_KEYS,
  SECTION_STYLES,
  type SectionKey,
  type SectionStyle,
  type TemplateKey,
} from "../constants";
import { demoSite } from "../data/demo-site";
import type {
  BlockType,
  Keunggulan,
  LayoutBlock,
  NavLink,
  SiteData,
  SiteTheme,
  Statistik,
  Testimoni,
} from "../types";
import { call } from "./api";

interface ApiBrand {
  color?: string;
  color_2?: string;
  logo?: string | null;
  favicon?: string | null;
  hero_image?: string | null;
}
interface ApiNav {
  to?: string;
  label?: string;
  section?: string;
}
interface ApiSite {
  sekolah?: string;
  nama?: string;
  template_key?: string;
  brand?: ApiBrand;
  social?: Record<string, string>;
  profil?: Record<string, string | undefined>;
  contact?: Record<string, string>;
  meta?: Record<string, string>;
  sections?: string[];
  nav?: ApiNav[];
  layout_blocks?: Array<Record<string, unknown>>;
  keunggulan?: Array<Record<string, unknown>>;
  statistik?: Array<Record<string, unknown>>;
  testimoni?: Array<Record<string, unknown>>;
  theme?: Record<string, unknown>;
}

function validTemplate(key: string | undefined): TemplateKey {
  return (["klasik", "modern", "ceria"] as const).includes(key as TemplateKey)
    ? (key as TemplateKey)
    : DEFAULT_TEMPLATE;
}

function validSections(raw: string[] | undefined): SectionKey[] {
  if (!raw?.length) return [...SECTION_KEYS];
  const allowed = new Set<string>(SECTION_KEYS);
  const filtered = SECTION_KEYS.filter((s) => raw.includes(s) && allowed.has(s));
  return filtered.length ? filtered : [...SECTION_KEYS];
}

function mapNav(raw: ApiNav[] | undefined, sections: SectionKey[]): NavLink[] {
  const valid = (raw ?? [])
    .filter((n) => n.to && n.label && SECTION_KEYS.includes(n.section as SectionKey))
    .map((n) => ({ to: n.to as string, label: n.label as string, section: n.section as SectionKey }));
  if (valid.length) return valid;
  // Derive nav from enabled sections if the backend sent none.
  return demoSite.nav.filter((n) => sections.includes(n.section));
}

function str(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}
function optStr(v: unknown): string | undefined {
  const s = str(v);
  return s ? s : undefined;
}
function bool(v: unknown): boolean {
  // Frappe Check fields arrive as 0/1; treat undefined as active.
  return v === undefined || v === null ? true : Boolean(typeof v === "number" ? v : v === true || v === "1");
}

function mapLayoutBlocks(raw: Array<Record<string, unknown>> | undefined): LayoutBlock[] {
  const allowed = new Set<string>(BLOCK_TYPES);
  return (raw ?? [])
    .filter((b) => allowed.has(str(b.tipe)))
    .map((b) => ({
      tipe: str(b.tipe) as BlockType,
      variant: str(b.variant) || DEFAULT_VARIANT,
      aktif: bool(b.aktif),
      judul: optStr(b.judul),
      subjudul: optStr(b.subjudul),
      ctaLabel: optStr(b.cta_label),
      ctaUrl: optStr(b.cta_url),
      konten: optStr(b.konten),
    }));
}

function mapKeunggulan(raw: Array<Record<string, unknown>> | undefined): Keunggulan[] {
  return (raw ?? []).map((k) => ({ ikon: str(k.ikon), judul: str(k.judul), deskripsi: str(k.deskripsi) }));
}
function mapStatistik(raw: Array<Record<string, unknown>> | undefined): Statistik[] {
  return (raw ?? []).map((s) => ({ label: str(s.label), nilai: str(s.nilai), satuan: optStr(s.satuan) }));
}
function mapTestimoni(raw: Array<Record<string, unknown>> | undefined): Testimoni[] {
  return (raw ?? []).map((t) => ({
    nama: str(t.nama),
    peran: optStr(t.peran),
    foto: optStr(t.foto),
    kutipan: str(t.kutipan),
  }));
}

function validSectionStyle(v: unknown): SectionStyle {
  const s = str(v);
  return (SECTION_STYLES as readonly string[]).includes(s) ? (s as SectionStyle) : DEFAULT_SECTION_STYLE;
}

function mapTheme(raw: Record<string, unknown> | undefined): SiteTheme {
  const t = raw ?? {};
  return {
    heroVariant: str(t.hero_variant) || DEFAULT_HERO_VARIANT,
    radius: str(t.radius),
    fontHeading: str(t.font_heading),
    fontBody: str(t.font_body),
    shadow: str(t.shadow),
    sectionStyle: validSectionStyle(t.section_style),
  };
}

export function mapSite(raw: ApiSite): SiteData {
  const sections = validSections(raw.sections);
  const b = raw.brand ?? {};
  const p = raw.profil ?? {};
  const c = raw.contact ?? {};
  const m = raw.meta ?? {};
  const s = raw.social ?? {};
  return {
    sekolah: raw.sekolah ?? "",
    nama: raw.nama ?? raw.sekolah ?? "Sekolah",
    templateKey: validTemplate(raw.template_key),
    brand: {
      color: b.color ?? demoSite.brand.color,
      color2: b.color_2 ?? demoSite.brand.color2,
      logo: b.logo ?? null,
      favicon: b.favicon ?? null,
      heroImage: b.hero_image ?? null,
    },
    social: {
      instagram: s.instagram,
      facebook: s.facebook,
      youtube: s.youtube,
      tiktok: s.tiktok,
      whatsapp: s.whatsapp,
    },
    profil: {
      tagline: p.tagline ?? "",
      heroJudul: p.hero_judul ?? `Selamat Datang di ${raw.nama ?? "Sekolah"}`,
      heroSubjudul: p.hero_subjudul ?? "",
      heroCtaLabel: p.hero_cta_label ?? "Informasi PPDB",
      heroCtaUrl: p.hero_cta_url ?? "/ppdb",
      visi: p.visi ?? "",
      misi: p.misi ?? "",
      sambutanKepsek: p.sambutan_kepsek ?? "",
      namaKepsek: p.nama_kepsek ?? "",
      alamat: p.alamat ?? c.alamat ?? "",
      petaEmbed: p.peta_embed ?? "",
      heroEyebrow: p.hero_eyebrow,
      heroCta2Label: p.hero_cta2_label,
      heroCta2Url: p.hero_cta2_url,
    },
    contact: {
      telepon: c.telepon ?? "",
      email: c.email ?? "",
      whatsapp: c.whatsapp ?? s.whatsapp ?? "",
      alamat: c.alamat ?? p.alamat ?? "",
    },
    meta: {
      metaTitle: m.meta_title ?? `${raw.nama ?? "Sekolah"}`,
      metaDescription: m.meta_description ?? "",
      ogImage: m.og_image ?? null,
    },
    sections,
    nav: mapNav(raw.nav, sections),
    layoutBlocks: mapLayoutBlocks(raw.layout_blocks),
    keunggulan: mapKeunggulan(raw.keunggulan),
    statistik: mapStatistik(raw.statistik),
    testimoni: mapTestimoni(raw.testimoni),
    theme: mapTheme(raw.theme),
  };
}

/** Dev/demo override: ?sekolah= query param wins, then VITE_DEMO_SEKOLAH. */
export function resolveOverride(): string | undefined {
  if (typeof window !== "undefined") {
    const q = new URLSearchParams(window.location.search).get("sekolah");
    if (q) return q;
  }
  return (import.meta.env.VITE_DEMO_SEKOLAH as string | undefined) || undefined;
}

export function currentHost(): string {
  return typeof window !== "undefined" ? window.location.host : "";
}

/** Resolve the site, falling back to the offline demo when the backend is down. */
export async function resolveSiteData(): Promise<SiteData> {
  const host = currentHost();
  const override = resolveOverride();
  try {
    const raw = await call<ApiSite | null>("situs.resolve_site", { host, sekolah: override ?? "" });
    if (raw && raw.sekolah) return mapSite(raw);
  } catch {
    // fall through to demo
  }
  // Offline/demo: tweak the demo name if an override was supplied.
  return override ? { ...demoSite, nama: override, sekolah: override } : demoSite;
}

export function useSiteData() {
  return useQuery<SiteData>({
    queryKey: ["situs.site", currentHost(), resolveOverride()],
    queryFn: resolveSiteData,
    staleTime: 10 * 60 * 1000,
  });
}
