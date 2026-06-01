// Resolve the per-school site from the request host (or a dev override), map the
// backend payload to the SiteData contract, and expose it via react-query.

import { useQuery } from "@tanstack/react-query";
import { DEFAULT_TEMPLATE, SECTION_KEYS, type SectionKey, type TemplateKey } from "../constants";
import { demoSite } from "../data/demo-site";
import type { NavLink, SiteData } from "../types";
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
  profil?: Record<string, string>;
  contact?: Record<string, string>;
  meta?: Record<string, string>;
  sections?: string[];
  nav?: ApiNav[];
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
