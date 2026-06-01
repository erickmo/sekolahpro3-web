/**
 * Pure compute helpers for the Pinjam Kolektif detail page (PERP-GAP-25/26).
 *
 * Layer: pure domain logic. Extracted from the route so the scan parsing, the
 * dedup rules, and the resolved-eksemplar validation are unit-testable without
 * rendering or network I/O. No React, no fetch — callers do the I/O and feed the
 * raw rows in.
 */

/** One scanned eksemplar row, as held in the form's items list. */
export interface ItemRow {
  eksemplar: string;
  nomor_inventaris?: string;
  judul_buku?: string;
}

/** A raw "Eksemplar Buku" row as returned by the resource list endpoint. */
export interface EksemplarRow {
  name: string;
  nomor_inventaris?: string;
  buku?: string;
  status?: string;
}

/** Eksemplar status that means the copy is free to be borrowed. */
const STATUS_TERSEDIA = "Tersedia";

/**
 * Split a pasted bulk-input string into trimmed, non-empty scan codes.
 * Accepts newline- or comma-delimited input (per the paste-to-add UX).
 *
 * @param raw the textarea contents
 * @returns the cleaned list of codes (order preserved)
 */
export function parseScanCodes(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * True if `code` already matches an existing item's eksemplar id OR its
 * nomor_inventaris — used to reject duplicates before resolving.
 *
 * @param items the items already in the list
 * @param code the candidate scan code
 */
export function isDuplicateItem(items: ReadonlyArray<ItemRow>, code: string): boolean {
  return items.some((i) => i.eksemplar === code || i.nomor_inventaris === code);
}

/**
 * Validate a fetched eksemplar row into an {@link ItemRow}, or return an error
 * message keyed by the original scan code. Mirrors the route's `resolveItem`
 * rules: missing copy → not found; non-available copy → blocked by status.
 *
 * @param code the original scan code (for error messages)
 * @param ek the resolved eksemplar row, or undefined when none matched
 */
export function resolveItem(
  code: string,
  ek: EksemplarRow | undefined,
): ItemRow | { error: string } {
  const c = code.trim();
  if (!c) return { error: "kosong" };
  if (!ek) return { error: `${c}: tidak ditemukan` };
  if (ek.status && ek.status !== STATUS_TERSEDIA) return { error: `${c}: status ${ek.status}` };
  return { eksemplar: ek.name, nomor_inventaris: ek.nomor_inventaris ?? "", judul_buku: ek.buku ?? "" };
}

/**
 * Append `item` to `list`, but only if no existing entry already has the same
 * eksemplar id. Pure: returns a new array, never mutates the input.
 *
 * @param list the current accumulator
 * @param item the resolved item to add
 */
export function bulkAdd(list: ReadonlyArray<ItemRow>, item: ItemRow): ItemRow[] {
  if (list.some((a) => a.eksemplar === item.eksemplar)) return [...list];
  return [...list, item];
}
