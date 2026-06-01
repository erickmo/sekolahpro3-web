/**
 * Sub-navigation tab definitions for the Manajemen Aset module.
 *
 * Single source of truth for the in-module tab bar (rendered by the layout
 * route) and for documentation. Pure data — no React — so it can be unit-tested
 * and reused.
 */

/** One tab entry. `exact` = match only the exact path (used by Dashboard). */
export interface AsetTab {
  to: string;
  label: string;
  exact?: boolean;
}

export const ASET_TABS: readonly AsetTab[] = [
  { to: "/sch/$sekolah/aset", label: "Dashboard", exact: true },
  { to: "/sch/$sekolah/aset/daftar", label: "Daftar Aset" },
  { to: "/sch/$sekolah/aset/peminjaman", label: "Peminjaman" },
  { to: "/sch/$sekolah/aset/maintenance", label: "Maintenance" },
  { to: "/sch/$sekolah/aset/transfer", label: "Transfer" },
  { to: "/sch/$sekolah/aset/kategori", label: "Kategori" },
  { to: "/sch/$sekolah/aset/lokasi", label: "Lokasi" },
  { to: "/sch/$sekolah/aset/laporan", label: "Laporan" },
];

/**
 * Resolve whether a tab is active for the current pathname.
 * `exact` tabs match only their own path; others also match nested detail
 * routes (e.g. /peminjaman/PINJ-AST-0001). Pure → unit-testable.
 */
export function isTabActive(tabTo: string, sekolah: string, pathname: string, exact?: boolean): boolean {
  const resolved = tabTo.replace("$sekolah", sekolah);
  return exact ? pathname === resolved : pathname === resolved || pathname.startsWith(resolved + "/");
}
