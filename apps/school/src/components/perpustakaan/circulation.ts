/**
 * Circulation write helpers (PERP-GAP-02/25/26, ADR PERP-ADR-0001).
 *
 * Every submittable circulation doctype (`Pengembalian Buku`, `Peminjaman Buku`,
 * `Pengembalian Kolektif Kelas`, …) MUST be created through {@link insertAndSubmit}.
 *
 * WHY: `createResource` is a plain POST that only runs Frappe's `insert()` — it
 * never performs the `submit()` transition, so `on_submit` never fires. All the
 * real side-effects of a return live in `on_submit`: releasing the eksemplar back
 * to "Tersedia", generating the `Denda Perpustakaan` row for late returns,
 * promoting the next FIFO reservation, and closing the peminjaman. Passing
 * `docstatus: 1` on a single-shot insert sets the flag but still skips the
 * transition, silently dropping every one of those effects.
 */
import { frappeFetch } from "@sekolahpro/api-client";

/**
 * Insert a draft document then submit it via two sequential Frappe RPCs, so
 * `on_submit` hooks run. The submit is skipped automatically if the insert
 * rejects (the error propagates to the caller).
 *
 * @param doctype submittable doctype name
 * @param doc field values for the draft (do NOT pass `docstatus`; submit sets it)
 * @returns the submitted document
 */
export async function insertAndSubmit<T extends { name: string }>(
  doctype: string,
  doc: Record<string, unknown>,
): Promise<T> {
  const inserted = await frappeFetch<{ name: string }>("frappe.client.insert", {
    doc: { doctype, ...doc },
  });
  return frappeFetch<T>("frappe.client.submit", {
    doc: { doctype, name: inserted.name },
  });
}
