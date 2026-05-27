import { useEffect, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

export interface NavLink { label: string; url: string; match_end: boolean; }
export interface ProofItem { label: string; }
export interface FooterColumn { title: string; links: { label: string; href: string }[]; }

export interface SiteContent {
  nav_links: NavLink[];
  nav_cta_login_label: string;
  nav_cta_login_url: string;
  nav_cta_primary_label: string;
  nav_cta_primary_url: string;
  proof_items: ProofItem[];
  whatsapp_number: string;
  whatsapp_display: string;
  whatsapp_hours: string;
  contact_email: string;
  contact_email_note: string;
  office_name: string;
  office_address: string;
  footer_blurb: string;
  footer_copyright: string;
  footer_legal_note: string;
  footer_columns: FooterColumn[];
}

const STATIC_FALLBACK: SiteContent = {
  nav_links: [
    { label: "Beranda", url: "/", match_end: true },
    { label: "Fitur", url: "/fitur", match_end: false },
    { label: "Berita", url: "/berita", match_end: false },
    { label: "Partner", url: "/partner", match_end: false },
    { label: "PPDB", url: "/ppdb", match_end: false },
    { label: "Kontak", url: "/kontak", match_end: false },
  ],
  nav_cta_login_label: "Masuk",
  nav_cta_login_url: "/login",
  nav_cta_primary_label: "Coba Gratis",
  nav_cta_primary_url: "/kontak?utm=nav",
  proof_items: [
    { label: "Dipakai 120+ sekolah" },
    { label: "ISO-27001 ready" },
    { label: "Dukungan oncall WIB" },
    { label: "Dibangun di Indonesia" },
  ],
  whatsapp_number: "6281234567890",
  whatsapp_display: "+62 812-3456-7890",
  whatsapp_hours: "Senin–Jumat, 09.00–17.00 WIB.",
  contact_email: "halo@sekolahpro.id",
  contact_email_note: "Untuk pertanyaan tidak mendesak.",
  office_name: "Sekolah Pro Indonesia",
  office_address: "Jakarta Selatan, DKI Jakarta",
  footer_blurb: "Sistem informasi sekolah yang dibangun di Indonesia, untuk ritme sekolah Indonesia.",
  footer_copyright: "© {year} SekolahPro. Dibangun di Indonesia 🇮🇩.",
  footer_legal_note: "v.2026.05 · Edisi Kurikulum Merdeka",
  footer_columns: [
    { title: "Produk", links: [
      { label: "Fitur", href: "/fitur" },
      { label: "Berita", href: "/berita" },
      { label: "Partner", href: "/partner" },
    ]},
    { title: "Perusahaan", links: [
      { label: "Kontak", href: "/kontak" },
      { label: "Masuk Dasbor", href: "/login" },
    ]},
    { title: "Legal", links: [
      { label: "Kebijakan Privasi", href: "/privasi" },
      { label: "Syarat Layanan", href: "/syarat" },
    ]},
  ],
};

interface ApiShape {
  nav_links?: { label?: string; url?: string; match_end?: number; sort_order?: number }[];
  nav_cta_login_label?: string; nav_cta_login_url?: string;
  nav_cta_primary_label?: string; nav_cta_primary_url?: string;
  proof_items?: { label?: string; sort_order?: number }[];
  whatsapp_number?: string; whatsapp_display?: string; whatsapp_hours?: string;
  contact_email?: string; contact_email_note?: string;
  office_name?: string; office_address?: string;
  footer_blurb?: string; footer_copyright?: string; footer_legal_note?: string;
  footer_columns?: { title?: string; sort_order?: number; links?: { label?: string; href?: string }[] }[];
}

function sortBy<T extends { sort_order?: number }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

function map(raw: ApiShape): SiteContent {
  const navLinks = sortBy(raw.nav_links ?? []).filter((n) => n.label && n.url).map((n) => ({
    label: n.label as string,
    url: n.url as string,
    match_end: Boolean(n.match_end),
  }));
  const proof = sortBy(raw.proof_items ?? []).filter((p) => p.label).map((p) => ({ label: p.label as string }));
  const cols = sortBy(raw.footer_columns ?? []).filter((c) => c.title).map((c) => ({
    title: c.title as string,
    links: (c.links ?? []).filter((l) => l.label && l.href).map((l) => ({ label: l.label as string, href: l.href as string })),
  }));

  return {
    nav_links: navLinks.length ? navLinks : STATIC_FALLBACK.nav_links,
    nav_cta_login_label: raw.nav_cta_login_label ?? STATIC_FALLBACK.nav_cta_login_label,
    nav_cta_login_url: raw.nav_cta_login_url ?? STATIC_FALLBACK.nav_cta_login_url,
    nav_cta_primary_label: raw.nav_cta_primary_label ?? STATIC_FALLBACK.nav_cta_primary_label,
    nav_cta_primary_url: raw.nav_cta_primary_url ?? STATIC_FALLBACK.nav_cta_primary_url,
    proof_items: proof.length ? proof : STATIC_FALLBACK.proof_items,
    whatsapp_number: raw.whatsapp_number ?? STATIC_FALLBACK.whatsapp_number,
    whatsapp_display: raw.whatsapp_display ?? STATIC_FALLBACK.whatsapp_display,
    whatsapp_hours: raw.whatsapp_hours ?? STATIC_FALLBACK.whatsapp_hours,
    contact_email: raw.contact_email ?? STATIC_FALLBACK.contact_email,
    contact_email_note: raw.contact_email_note ?? STATIC_FALLBACK.contact_email_note,
    office_name: raw.office_name ?? STATIC_FALLBACK.office_name,
    office_address: raw.office_address ?? STATIC_FALLBACK.office_address,
    footer_blurb: raw.footer_blurb ?? STATIC_FALLBACK.footer_blurb,
    footer_copyright: raw.footer_copyright ?? STATIC_FALLBACK.footer_copyright,
    footer_legal_note: raw.footer_legal_note ?? STATIC_FALLBACK.footer_legal_note,
    footer_columns: cols.length ? cols : STATIC_FALLBACK.footer_columns,
  };
}

export function useSiteContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(STATIC_FALLBACK);
  useEffect(() => {
    if (!API_BASE) return;
    let cancelled = false;
    fetch(`${API_BASE}/api/method/sekolahpro.api.site.get_content`, { credentials: "omit" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((body: { message?: ApiShape }) => {
        if (cancelled || !body?.message) return;
        setContent(map(body.message));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return content;
}

export function whatsappHref(num: string): string {
  return `https://wa.me/${num.replace(/[^\d]/g, "")}`;
}
