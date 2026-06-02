/**
 * Single source of truth for the Akad Pembiayaan field contract.
 *
 * Bug this guards: the create form posts `pokok_pembiayaan` (and the detail
 * page reads it), but the list + member-detail map previously read the legacy
 * `jumlah_pokok`, so every freshly-created akad showed "—" for its principal.
 * Routing both the create payload and the reads through these constants keeps
 * the write key and read key from drifting apart again.
 */

/** Canonical field storing the financing principal on Akad Pembiayaan. */
export const AKAD_POKOK_FIELD = "pokok_pembiayaan";

/** Fields coerced to numbers before POST. */
export const AKAD_NUMERIC_FIELDS: ReadonlySet<string> = new Set([
  AKAD_POKOK_FIELD,
  "margin",
  "tenor_bulan",
]);

export interface AkadPayloadInput {
  anggota: string;
  produk: string;
  akad: string;
  tanggal_akad: string;
  pokok_pembiayaan: number;
  tenor_bulan: number;
  margin?: number;
  jaminan?: string;
  catatan?: string;
}

/**
 * Build the Akad Pembiayaan create payload using canonical keys; optional
 * fields are omitted when empty so they do not overwrite with blanks.
 */
export function buildAkadPayload(input: AkadPayloadInput): Record<string, unknown> {
  const out: Record<string, unknown> = {
    anggota: input.anggota,
    produk: input.produk,
    akad: input.akad,
    tanggal_akad: input.tanggal_akad,
    [AKAD_POKOK_FIELD]: input.pokok_pembiayaan,
    tenor_bulan: input.tenor_bulan,
  };
  if (input.margin !== undefined && !Number.isNaN(input.margin)) out.margin = input.margin;
  if (input.jaminan?.trim()) out.jaminan = input.jaminan;
  if (input.catatan?.trim()) out.catatan = input.catatan;
  return out;
}
