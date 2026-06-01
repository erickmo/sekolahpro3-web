/**
 * Identity helpers for the Buku detail route (PERP-GAP-01, ADR PERP-ADR-0001).
 *
 * The detail route is declared as `/perpustakaan/$isbn`, but the `$isbn` segment
 * actually carries the Frappe DOCNAME (e.g. `BUKU-0001`): the detail page resolves
 * the document via `useResourceDoc("Buku", param)`, and Frappe looks a doc up
 * strictly by its `name`, never by the `isbn` field. Navigating by the ISBN value
 * therefore 404s every book that HAS an ISBN. These helpers centralize the rule so
 * call sites cannot regress to passing the ISBN.
 */

/** A catalog list row carrying at least the Frappe docname. */
export interface BukuRouteRow {
  name: string;
  isbn?: string | undefined;
}

/**
 * Value to pass as the `$isbn` route param for a catalog row: always the docname,
 * so `useResourceDoc("Buku", param)` resolves the real document.
 *
 * @param row catalog row with a `name` (docname) and optional `isbn`
 * @returns the docname to route by
 */
export function bukuRouteParam(row: BukuRouteRow): string {
  return row.name;
}

/**
 * ISBN to enrich the demo fixture by on the detail page. Prefers the resolved
 * document's own ISBN (so a backed doc still matches a fixture by ISBN), falling
 * back to the raw route param for direct ISBN deep-links that hit no backend.
 *
 * @param routeParam the raw `$isbn` route param (a docname in normal navigation)
 * @param doc the resolved backend/mock document, if any
 * @returns the ISBN to look the demo fixture up by
 */
export function bukuEnrichIsbn(routeParam: string, doc?: { isbn?: string | undefined }): string {
  return doc?.isbn ?? routeParam;
}
