/**
 * Information architecture for the unified Keuangan hub.
 *
 * One "Keuangan" hub spans two physical route trees — the operasional pages
 * under /keuangan/* (mock-backed, daily cash) and the akuntansi pages under
 * /akuntansi/* (Frappe-backed ledger). This module is the single source of
 * truth for the hub navigation groups, active-section resolution, and per-role
 * emphasis. Pure data + functions only (no React) so it is fully unit-testable.
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
  /** Short hint shown under the label in mega-menu surfaces. */
  hint?: string;
}

/** Stable identifier for each top-level hub section. */
export type KeuanganSectionKey = "ringkasan" | "operasional" | "akuntansi";

/** A labelled group of nav items (one hub section). */
export interface KeuanganNavGroup {
  key: KeuanganSectionKey;
  label: string;
  /** Roles this whole section is most relevant to. */
  roles?: KeuanganRole[];
  items: KeuanganNavItem[];
}

/**
 * The hub navigation, in display order. Operasional pages live under /keuangan,
 * akuntansi pages keep their existing /akuntansi URLs (see spec: no URL migration).
 */
export const KEUANGAN_HUB_GROUPS: readonly KeuanganNavGroup[] = [
  {
    key: "ringkasan",
    label: "Ringkasan",
    items: [{ to: "/sch/$sekolah/keuangan", label: "Dashboard", exact: true }],
  },
  {
    key: "operasional",
    label: "Operasional",
    roles: ["bendahara", "kasir"],
    items: [
      { to: "/sch/$sekolah/keuangan/tagihan", label: "Tagihan", roles: ["bendahara", "kasir"], hint: "SPP & tagihan siswa" },
      { to: "/sch/$sekolah/keuangan/pembayaran", label: "Pembayaran", roles: ["kasir", "bendahara"], hint: "Terima pembayaran" },
      { to: "/sch/$sekolah/keuangan/pengeluaran", label: "Pengeluaran", roles: ["bendahara"], hint: "Belanja & persetujuan" },
      { to: "/sch/$sekolah/keuangan/kas", label: "Buku Kas", roles: ["kasir", "bendahara"], hint: "Arus kas harian" },
    ],
  },
  {
    key: "akuntansi",
    label: "Akuntansi",
    roles: ["akuntan", "kepala"],
    items: [
      { to: "/sch/$sekolah/akuntansi/buku-besar", label: "Buku Besar", roles: ["akuntan"], hint: "Akun, jurnal, GL" },
      { to: "/sch/$sekolah/akuntansi/anggaran", label: "Anggaran", roles: ["akuntan", "kepala"], hint: "Budget & cost center" },
      { to: "/sch/$sekolah/akuntansi/pajak", label: "Pajak", roles: ["akuntan"], hint: "PPN, PPh, e-Faktur" },
      { to: "/sch/$sekolah/akuntansi/referensi", label: "Referensi", roles: ["akuntan"], hint: "Tahun fiskal & setelan" },
    ],
  },
];

/**
 * Hub IA flattened into ModuleShell's NavTabGroup[] (drops role/hint metadata).
 * Single source for the header pill row shown by both /keuangan and /akuntansi.
 */
export const KEUANGAN_NAV_GROUPS: NavTabGroup[] = KEUANGAN_HUB_GROUPS.map((g) => ({
  label: g.label,
  items: g.items.map((i) => ({
    to: i.to,
    label: i.label,
    ...(i.exact ? { exact: i.exact } : {}),
  })),
}));

/**
 * Resolve which top-level hub section a pathname belongs to.
 * Returns null when the pathname is outside the hub.
 */
export function resolveActiveSection(pathname: string): KeuanganSectionKey | null {
  // Akuntansi owns its whole /akuntansi/* route tree.
  if (/\/akuntansi(\/|$)/.test(pathname)) {
    return "akuntansi";
  }
  // Operasional = a /keuangan sub-page; the bare /keuangan root is the dashboard.
  const keuanganMatch = pathname.match(/\/keuangan(\/[\w-]+)?/);
  if (keuanganMatch) {
    return keuanganMatch[1] ? "operasional" : "ringkasan";
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
