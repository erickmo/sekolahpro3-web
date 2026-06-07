/**
 * Information architecture for the unified Keuangan hub — "Alur Uang".
 *
 * One "Keuangan" hub spans two physical route trees (operasional pages under
 * /keuangan/* and akuntansi pages under /akuntansi/*) but the menu is the money
 * pipeline itself: Tagih -> Terima -> Catat -> Tutup Buku -> Lapor Pajak, plus a
 * collapsed "Siapkan" (setup) drawer. The pipeline is both the daily accountant's
 * jobs-to-be-done mental model and the onboarding story (read left to right).
 *
 * This module is the single source of truth for the hub navigation groups,
 * active-section resolution, and per-role emphasis. Every leaf `to` is an
 * existing route — pure regrouping, no URL migration. Pure data + functions only
 * (no React) so it is fully unit-testable.
 *
 * Roles drive EMPHASIS, never visibility — see lib/keuanganRole.ts.
 */
import type { NavTabGroup } from "../components/GroupedNavTabs";
import type { KeuanganRole } from "./keuanganRole";

/** A single navigable destination inside the hub. */
export interface KeuanganNavItem {
  to: string;
  label: string;
  /** When true, only an exact pathname match is "active" (dashboard roots). */
  exact?: boolean;
  /** Presentation roles this item is most relevant to. Empty/undefined = all. */
  roles?: KeuanganRole[];
  /** Short hint shown under the label in mega-menu / stage surfaces. */
  hint?: string;
}

/**
 * Stable identifier for each pipeline stage. Order = the money flow; `beranda`
 * is the cockpit and `siapkan` is the setup drawer (kept out of the pill row).
 */
export type KeuanganSectionKey =
  | "beranda"
  | "tagih"
  | "terima"
  | "catat"
  | "tutup-buku"
  | "lapor-pajak"
  | "siapkan";

/** A labelled group of nav items (one pipeline stage / drawer). */
export interface KeuanganNavGroup {
  key: KeuanganSectionKey;
  label: string;
  /** Roles this whole stage is most relevant to. */
  roles?: KeuanganRole[];
  items: KeuanganNavItem[];
}

/**
 * The hub navigation, in money-flow order. Operasional pages live under
 * /keuangan, akuntansi pages keep their existing /akuntansi URLs (no migration).
 * Some pages have a natural second home (Buku Kas, Bagan Akun, Periode); they are
 * listed where most useful — resolveActiveSection picks ONE canonical home.
 */
export const KEUANGAN_HUB_GROUPS: readonly KeuanganNavGroup[] = [
  {
    key: "beranda",
    label: "Beranda",
    items: [{ to: "/sch/$sekolah/keuangan", label: "Beranda", exact: true, hint: "Antrean kerja & alur uang" }],
  },
  {
    key: "tagih",
    label: "Tagih",
    roles: ["bendahara", "kasir"],
    items: [
      { to: "/sch/$sekolah/keuangan/tagihan", label: "Tagihan SPP & Siswa", roles: ["bendahara", "kasir"], hint: "Terbitkan & pantau tagihan siswa" },
      { to: "/sch/$sekolah/akuntansi/buku-besar/jurnal/new", label: "Jurnal Penyesuaian", roles: ["akuntan"], hint: "Koreksi/penagihan manual" },
    ],
  },
  {
    key: "terima",
    label: "Terima",
    roles: ["kasir", "bendahara"],
    items: [
      { to: "/sch/$sekolah/keuangan/pembayaran", label: "Terima Pembayaran", roles: ["kasir", "bendahara"], hint: "Catat pelunasan SPP/biaya" },
      { to: "/sch/$sekolah/akuntansi/buku-besar/pembayaran", label: "Pembayaran (Buku Besar)", roles: ["akuntan"], hint: "Payment Entry sisi GL" },
      { to: "/sch/$sekolah/keuangan/kas", label: "Setoran ke Buku Kas", roles: ["kasir", "bendahara"], hint: "Rekonsiliasi arus kas harian" },
    ],
  },
  {
    key: "catat",
    label: "Catat",
    roles: ["bendahara", "akuntan"],
    items: [
      { to: "/sch/$sekolah/keuangan/pengeluaran", label: "Pengeluaran & Persetujuan", roles: ["bendahara"], hint: "Belanja & alur persetujuan" },
      { to: "/sch/$sekolah/akuntansi/buku-besar/jurnal", label: "Jurnal Umum", roles: ["akuntan"], hint: "Posting manual ke buku besar" },
      { to: "/sch/$sekolah/akuntansi/buku-besar/gl", label: "Buku Besar (GL)", roles: ["akuntan"], hint: "GL Entry / mutasi akun" },
      { to: "/sch/$sekolah/akuntansi/buku-besar/akun", label: "Bagan Akun", roles: ["akuntan"], hint: "Chart of Accounts" },
    ],
  },
  {
    key: "tutup-buku",
    label: "Tutup Buku",
    roles: ["akuntan", "kepala"],
    items: [
      { to: "/sch/$sekolah/akuntansi/anggaran", label: "Realisasi vs Anggaran", roles: ["akuntan", "kepala"], hint: "Budget per cost center" },
      { to: "/sch/$sekolah/akuntansi/anggaran/cost-center", label: "Cost Center", roles: ["akuntan"], hint: "Pusat biaya" },
      { to: "/sch/$sekolah/akuntansi/referensi/period", label: "Tutup Periode", roles: ["akuntan"], hint: "Kunci periode akuntansi" },
    ],
  },
  {
    key: "lapor-pajak",
    label: "Lapor Pajak",
    roles: ["akuntan"],
    items: [
      { to: "/sch/$sekolah/akuntansi/pajak/spt-ppn", label: "SPT Masa PPN", roles: ["akuntan"], hint: "Pelaporan PPN bulanan" },
      { to: "/sch/$sekolah/akuntansi/pajak/efaktur", label: "e-Faktur Export", roles: ["akuntan"], hint: "CSV/XML untuk DJP" },
      { to: "/sch/$sekolah/akuntansi/pajak/withholding", label: "PPh Withholding", roles: ["akuntan"], hint: "PPh 21/22/23/4(2)" },
      { to: "/sch/$sekolah/akuntansi/pajak/ter", label: "PPh 21 TER", roles: ["akuntan"], hint: "Tarif TER & 4(2)" },
    ],
  },
  {
    key: "siapkan",
    label: "Siapkan",
    roles: ["akuntan"],
    items: [
      { to: "/sch/$sekolah/akuntansi/referensi/fiscal-year", label: "Tahun Fiskal", roles: ["akuntan"], hint: "Periode tahun buku" },
      { to: "/sch/$sekolah/akuntansi/referensi/period", label: "Periode Akuntansi", roles: ["akuntan"], hint: "Periode bulanan" },
      { to: "/sch/$sekolah/akuntansi/referensi/currency", label: "Mata Uang / Kurs", roles: ["akuntan"], hint: "Kurs valas" },
      { to: "/sch/$sekolah/akuntansi/referensi/settings", label: "Pengaturan Modul", roles: ["akuntan"], hint: "NPWP, pajak, NSFP" },
      { to: "/sch/$sekolah/akuntansi/buku-besar/akun", label: "Bagan Akun", roles: ["akuntan"], hint: "Chart of Accounts" },
    ],
  },
];

/** The setup drawer group, surfaced separately from the header pill row. */
export const KEUANGAN_SETUP_GROUP: KeuanganNavGroup =
  KEUANGAN_HUB_GROUPS.find((g) => g.key === "siapkan") as KeuanganNavGroup;

/**
 * Hub IA flattened into ModuleShell's NavTabGroup[] (drops role/hint metadata).
 * Excludes the `siapkan` drawer — the header pill row shows the pipeline only.
 * Single source for the header pill row shown by both /keuangan and /akuntansi.
 */
export const KEUANGAN_NAV_GROUPS: NavTabGroup[] = KEUANGAN_HUB_GROUPS.filter(
  (g) => g.key !== "siapkan",
).map((g) => ({
  label: g.label,
  items: g.items.map((i) => ({
    to: i.to,
    label: i.label,
    ...(i.exact ? { exact: i.exact } : {}),
  })),
}));

/**
 * Canonical route-prefix -> stage table, ordered longest/most-specific first so
 * `.includes` resolves a page that visually appears in two stages (e.g. Bagan
 * Akun, Buku Kas, Periode) to ONE active section. Keep ledger sub-routes above
 * their parents.
 */
const SECTION_BY_PREFIX: ReadonlyArray<readonly [string, KeuanganSectionKey]> = [
  ["/akuntansi/buku-besar/pembayaran", "terima"],
  ["/akuntansi/buku-besar/jurnal", "catat"],
  ["/akuntansi/buku-besar/gl", "catat"],
  ["/akuntansi/buku-besar/akun", "catat"],
  ["/akuntansi/buku-besar", "catat"],
  ["/akuntansi/anggaran", "tutup-buku"],
  ["/akuntansi/pajak", "lapor-pajak"],
  ["/akuntansi/referensi", "siapkan"],
  ["/keuangan/tagihan", "tagih"],
  ["/keuangan/pembayaran", "terima"],
  ["/keuangan/kas", "terima"],
  ["/keuangan/pengeluaran", "catat"],
];

/**
 * Resolve which pipeline stage a pathname belongs to (its canonical home).
 * Returns "beranda" for the bare /keuangan or /akuntansi roots, null when the
 * pathname is outside the hub.
 */
export function resolveActiveSection(pathname: string): KeuanganSectionKey | null {
  for (const [prefix, section] of SECTION_BY_PREFIX) {
    if (pathname.includes(prefix)) {
      return section;
    }
  }
  // Bare hub roots (no sub-page) land on the cockpit. Akuntansi index redirects
  // to /keuangan, so it shares the beranda stage.
  if (/\/keuangan(\/|$)/.test(pathname) || /\/akuntansi(\/|$)/.test(pathname)) {
    return "beranda";
  }
  return null;
}

/**
 * Whether a nav item should be visually emphasized for the given role.
 * Role-agnostic items (no `roles`) are always emphasized; otherwise the role
 * must be listed. Emphasis is a hint only — nothing is ever hidden.
 */
export function isItemEmphasized(item: KeuanganNavItem, role: KeuanganRole): boolean {
  if (!item.roles || item.roles.length === 0) {
    return true;
  }
  return item.roles.includes(role);
}
