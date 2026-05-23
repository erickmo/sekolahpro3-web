import { useEffect, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

export interface PartnerSchool {
  name: string;
  jenjang: string;
  city: string;
  province: string;
  students: number;
  since: string;
  blurb?: string;
}

export interface PartnerOrg {
  name: string;
  role: string;
}

export interface CaseStudy {
  school: string;
  jenjang: string;
  challenge: string;
  outcome: string;
  metric: { value: string; label: string };
  quote: string;
  quote_author: string;
}

export interface PartnerHero {
  eyebrow: string;
  title_main: string;
  title_italic: string;
  lead: string;
}

export interface PartnerSchoolsSection {
  heading: string;
  lead: string;
}

export interface PartnerCaseSection {
  eyebrow: string;
  title_main: string;
  title_italic: string;
}

export interface PartnerOrgsSection {
  heading: string;
  lead: string;
}

export interface PartnerCTAContent {
  title: string;
  body: string;
  label: string;
  url: string;
}

export interface PartnerContent {
  hero: PartnerHero;
  schools_section: PartnerSchoolsSection;
  case_section: PartnerCaseSection;
  orgs_section: PartnerOrgsSection;
  cta: PartnerCTAContent;
  schools: PartnerSchool[];
  orgs: PartnerOrg[];
  case_studies: CaseStudy[];
}

const FALLBACK_SCHOOLS: PartnerSchool[] = [
  { name: "SMA Cendekia Bangsa", jenjang: "SMA", city: "Bandung", province: "Jawa Barat", students: 1240, since: "2023" },
  { name: "SD Aletheia Malang", jenjang: "SD", city: "Malang", province: "Jawa Timur", students: 680, since: "2024" },
  { name: "SMP Tunas Harapan", jenjang: "SMP", city: "Semarang", province: "Jawa Tengah", students: 920, since: "2024" },
  { name: "SMA Insan Mulia", jenjang: "SMA", city: "Yogyakarta", province: "DI Yogyakarta", students: 1480, since: "2023" },
  { name: "SD Islam Al-Falah", jenjang: "SD", city: "Surabaya", province: "Jawa Timur", students: 540, since: "2025" },
  { name: "SMK Bina Karya", jenjang: "SMK", city: "Solo", province: "Jawa Tengah", students: 2100, since: "2024" },
  { name: "MTs Al-Hikmah", jenjang: "MTs", city: "Makassar", province: "Sulawesi Selatan", students: 720, since: "2025" },
  { name: "SMA Negeri 1 Denpasar", jenjang: "SMA", city: "Denpasar", province: "Bali", students: 1620, since: "2024" },
];

const FALLBACK_ORGS: PartnerOrg[] = [
  { name: "Bank Mandiri", role: "Mitra Pembayaran (VA + QRIS)" },
  { name: "Midtrans", role: "Payment Gateway" },
  { name: "Meta WhatsApp", role: "Penyedia API Resmi" },
  { name: "Dapodik Kemdikbud", role: "Sumber Data Induk" },
  { name: "Telkom IndiHome Sekolah", role: "Konektivitas" },
];

const FALLBACK_CASE_STUDIES: CaseStudy[] = [
  {
    school: "SMA Cendekia Bangsa, Bandung",
    jenjang: "SMA · 1.240 siswa",
    challenge:
      "Tata usaha menghabiskan 3 hari tiap awal bulan menutup buku — data SPP tersebar di Excel terpisah per kelas.",
    outcome:
      "Setelah migrasi, tutup buku selesai dalam 90 menit. Bendahara punya dashboard real-time, kepala sekolah tahu posisi kas tanpa harus bertanya.",
    metric: { value: "90 menit", label: "Waktu tutup buku bulanan" },
    quote:
      "Setelah belasan tahun mengandalkan kertas dan Excel, kami akhirnya bisa membaca sekolah ini seperti membaca neraca — dalam satu halaman, sebelum kopi habis.",
    quote_author: "Drs. Bambang Hartono, M.Pd. · Kepala Sekolah",
  },
  {
    school: "SD Aletheia Malang",
    jenjang: "SD · 680 siswa",
    challenge:
      "PPDB lewat antrean fisik membuat orangtua harus cuti kerja, dan panitia kewalahan mengelola berkas.",
    outcome:
      "PPDB 2025 dilakukan sepenuhnya online. Pendaftaran selesai 4 hari lebih cepat, dengan 0 berkas hilang.",
    metric: { value: "4 hari", label: "Lebih cepat dari tahun lalu" },
    quote:
      "Orangtua tidak perlu antre. Panitia tidak begadang. Anak-anak yang seharusnya jadi fokus, akhirnya jadi fokus lagi.",
    quote_author: "Ibu Lestari, S.Pd. · Ketua Panitia PPDB",
  },
];

export const STATIC_PARTNER: PartnerContent = {
  hero: {
    eyebrow: "— Partner",
    title_main: "Dipercaya sekolah di",
    title_italic: "18 provinsi.",
    lead: "Dari SD swasta kecil sampai SMK besar — kami tumbuh bersama sekolah Indonesia.",
  },
  schools_section: {
    heading: "Sekolah pengguna",
    lead: "Beberapa sekolah yang sudah berjalan dengan SekolahPro.",
  },
  case_section: {
    eyebrow: "— Studi kasus",
    title_main: "Hasil yang bisa",
    title_italic: "diukur.",
  },
  orgs_section: {
    heading: "Ekosistem mitra",
    lead: "Kami berkolaborasi dengan penyedia layanan tepercaya untuk pembayaran, komunikasi, dan integrasi pemerintah.",
  },
  cta: {
    title: "Sekolah Anda bisa jadi cerita berikutnya.",
    body: "Tidak perlu sekolah besar untuk mulai. Banyak partner kami mulai dari satu modul dan tumbuh dari sana.",
    label: "Mulai Konsultasi",
    url: "/kontak?utm=partner",
  },
  schools: FALLBACK_SCHOOLS,
  orgs: FALLBACK_ORGS,
  case_studies: FALLBACK_CASE_STUDIES,
};

interface ApiSchool {
  school_name?: string;
  jenjang?: string;
  city?: string;
  province?: string;
  students_count?: number;
  since_year?: string;
  sort_order?: number;
}

interface ApiOrg {
  org_name?: string;
  role?: string;
  sort_order?: number;
}

interface ApiCaseStudy {
  school_label?: string;
  jenjang_label?: string;
  challenge?: string;
  outcome?: string;
  metric_value?: string;
  metric_label?: string;
  quote_text?: string;
  quote_author?: string;
  sort_order?: number;
}

interface ApiShape {
  hero_eyebrow?: string;
  hero_title_main?: string;
  hero_title_italic?: string;
  hero_lead?: string;
  schools_heading?: string;
  schools_lead?: string;
  case_eyebrow?: string;
  case_title_main?: string;
  case_title_italic?: string;
  orgs_heading?: string;
  orgs_lead?: string;
  cta_title?: string;
  cta_body?: string;
  cta_label?: string;
  cta_url?: string;
  schools?: ApiSchool[];
  orgs?: ApiOrg[];
  case_studies?: ApiCaseStudy[];
}

function bySortOrder<T extends { sort_order?: number }>(a: T, b: T): number {
  return (a.sort_order ?? 0) - (b.sort_order ?? 0);
}

function mapFromApi(raw: ApiShape): PartnerContent {
  const schools = (raw.schools ?? [])
    .filter((s) => s.school_name)
    .slice()
    .sort(bySortOrder)
    .map<PartnerSchool>((s) => ({
      name: s.school_name as string,
      jenjang: s.jenjang ?? "",
      city: s.city ?? "",
      province: s.province ?? "",
      students: s.students_count ?? 0,
      since: s.since_year ?? "",
    }));

  const orgs = (raw.orgs ?? [])
    .filter((o) => o.org_name)
    .slice()
    .sort(bySortOrder)
    .map<PartnerOrg>((o) => ({
      name: o.org_name as string,
      role: o.role ?? "",
    }));

  const case_studies = (raw.case_studies ?? [])
    .filter((c) => c.school_label)
    .slice()
    .sort(bySortOrder)
    .map<CaseStudy>((c) => ({
      school: c.school_label as string,
      jenjang: c.jenjang_label ?? "",
      challenge: c.challenge ?? "",
      outcome: c.outcome ?? "",
      metric: { value: c.metric_value ?? "", label: c.metric_label ?? "" },
      quote: c.quote_text ?? "",
      quote_author: c.quote_author ?? "",
    }));

  return {
    hero: {
      eyebrow: raw.hero_eyebrow ?? STATIC_PARTNER.hero.eyebrow,
      title_main: raw.hero_title_main ?? STATIC_PARTNER.hero.title_main,
      title_italic: raw.hero_title_italic ?? STATIC_PARTNER.hero.title_italic,
      lead: raw.hero_lead ?? STATIC_PARTNER.hero.lead,
    },
    schools_section: {
      heading: raw.schools_heading ?? STATIC_PARTNER.schools_section.heading,
      lead: raw.schools_lead ?? STATIC_PARTNER.schools_section.lead,
    },
    case_section: {
      eyebrow: raw.case_eyebrow ?? STATIC_PARTNER.case_section.eyebrow,
      title_main: raw.case_title_main ?? STATIC_PARTNER.case_section.title_main,
      title_italic: raw.case_title_italic ?? STATIC_PARTNER.case_section.title_italic,
    },
    orgs_section: {
      heading: raw.orgs_heading ?? STATIC_PARTNER.orgs_section.heading,
      lead: raw.orgs_lead ?? STATIC_PARTNER.orgs_section.lead,
    },
    cta: {
      title: raw.cta_title ?? STATIC_PARTNER.cta.title,
      body: raw.cta_body ?? STATIC_PARTNER.cta.body,
      label: raw.cta_label ?? STATIC_PARTNER.cta.label,
      url: raw.cta_url ?? STATIC_PARTNER.cta.url,
    },
    schools: schools.length > 0 ? schools : STATIC_PARTNER.schools,
    orgs: orgs.length > 0 ? orgs : STATIC_PARTNER.orgs,
    case_studies: case_studies.length > 0 ? case_studies : STATIC_PARTNER.case_studies,
  };
}

export function usePartnerContent(): PartnerContent {
  const [content, setContent] = useState<PartnerContent>(STATIC_PARTNER);

  useEffect(() => {
    if (!API_BASE) return;
    let cancelled = false;
    fetch(`${API_BASE}/api/method/sekolahpro.api.partner.get_content`, { credentials: "omit" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((body: { message?: ApiShape }) => {
        if (cancelled || !body?.message) return;
        setContent(mapFromApi(body.message));
      })
      .catch(() => {
        // silent fallback to static defaults
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return content;
}
