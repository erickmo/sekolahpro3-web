/**
 * Segmented-control config + active-state logic for the Inventaris layout
 * (PERP-GAP-03).
 *
 * WHY: the `to` templates carry the `$sekolah` route segment, so the layout must
 * (a) pass `params={{ sekolah }}` to `<Link>` for TanStack to resolve them, and
 * (b) compare the RESOLVED path against the live pathname — comparing the raw
 * `$sekolah` template never matches, leaving the active highlight permanently off.
 */

/** One segment of the inventaris segmented control. */
export interface InventarisSegment {
  to: string;
  label: string;
}

/** Sub-pages of the Inventaris umbrella, in display order. */
export const INVENTARIS_SEGMENTS: InventarisSegment[] = [
  { to: "/sch/$sekolah/perpustakaan/inventaris/opname", label: "Stock Opname" },
  { to: "/sch/$sekolah/perpustakaan/inventaris/berita-acara", label: "Berita Acara Kerusakan" },
];

/**
 * Resolve a `$sekolah`-templated segment path against the active school slug.
 *
 * @param to segment `to` template (contains `$sekolah`)
 * @param sekolah active school slug
 * @returns the concrete pathname
 */
export function resolveSegmentPath(to: string, sekolah: string): string {
  return to.replace("$sekolah", sekolah);
}

/**
 * Whether `pathname` is within the given segment (exact match or nested child).
 *
 * @param pathname the live resolved pathname
 * @param to segment `to` template
 * @param sekolah active school slug
 */
export function isSegmentActive(pathname: string, to: string, sekolah: string): boolean {
  const resolved = resolveSegmentPath(to, sekolah);
  return pathname === resolved || pathname.startsWith(resolved + "/");
}
