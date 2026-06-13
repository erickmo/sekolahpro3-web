/**
 * Single source of truth for the Akad Pembiayaan field contract.
 *
 * Backend doctype (akad_pembiayaan.json) verified 2026-06-13:
 *   nasabah* (Link Nasabah), produk_pembiayaan* (Link Produk Pembiayaan),
 *   jumlah_pokok* (Currency), tenor* (Int, bulan), tanggal_akad* (Date),
 *   status (Aktif|Lunas|Macet). margin_total/total_kewajiban/kolektibilitas
 *   are read-only, derived by the controller. There is NO anggota/produk/
 *   akad/pokok_pembiayaan/tenor_bulan/margin/jaminan/catatan field — the old
 *   contract here posted those and every create failed/showed "—".
 */

/** Canonical field storing the financing principal on Akad Pembiayaan. */
export const AKAD_POKOK_FIELD = "jumlah_pokok";

/** Fields coerced to numbers before POST. */
export const AKAD_NUMERIC_FIELDS: ReadonlySet<string> = new Set([
  AKAD_POKOK_FIELD,
  "tenor",
]);

export interface AkadPayloadInput {
  /** Nasabah doc-ID (NSB-…) — the financing counterparty. */
  nasabah: string;
  /** Produk Pembiayaan doc-ID. */
  produk_pembiayaan: string;
  tanggal_akad: string;
  jumlah_pokok: number;
  /** Tenor in months. */
  tenor: number;
}

/**
 * Build the Akad Pembiayaan create payload using canonical keys only —
 * read-only/derived fields are never sent.
 */
export function buildAkadPayload(input: AkadPayloadInput): Record<string, unknown> {
  return {
    nasabah: input.nasabah,
    produk_pembiayaan: input.produk_pembiayaan,
    tanggal_akad: input.tanggal_akad,
    [AKAD_POKOK_FIELD]: input.jumlah_pokok,
    tenor: input.tenor,
  };
}
