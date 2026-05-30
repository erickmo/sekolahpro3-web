import type { KoperasiCard } from "../../data/sekolah";

/**
 * Resolve a Koperasi card from the user's accessible koperasi list by its slug.
 *
 * The slug equals the anchor school's `kode_pendek` (sekolah_utama). The
 * top-level `/$koperasi` route uses this to mirror the `$sekolah.tsx` tenant
 * guard: match the route param against the list, set the active sekolah, and
 * 404 when there is no match.
 *
 * @param list - koperasi cards from `list_my_koperasi` (may be undefined while loading)
 * @param slug - the `$koperasi` route param
 * @returns the matching card, or undefined when none matches
 */
export function findKoperasiBySlug(
  list: KoperasiCard[] | undefined,
  slug: string,
): KoperasiCard | undefined {
  if (!list) return undefined;
  return list.find((k) => k.slug === slug);
}
