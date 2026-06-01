/**
 * Pure compute helpers for the Pengadaan detail page (PERP-GAP-11/23).
 *
 * Extracted from the route so the totals and the inventaris-preview generation are
 * unit-testable without rendering. No React, no I/O.
 */

/** One acquisition line item, as edited in the form. */
export interface PengadaanItemInput {
  jumlah_eksemplar?: number | string;
  harga_satuan?: number | string;
  buku?: string;
  buku_label?: string;
  prefix_inventaris?: string;
}

export interface PengadaanTotals {
  totalEksemplar: number;
  totalBiaya: number;
}

/** Inventory prefix length used when an item has no explicit prefix. */
const DEFAULT_PREFIX_LEN = 8;
/** Zero-pad width for generated inventory numbers (e.g. 001..NNN). */
const INV_SEQ_PAD = 3;

/** Sum copies and cost across all line items (non-numeric values count as 0). */
export function computePengadaanTotals(items: ReadonlyArray<PengadaanItemInput>): PengadaanTotals {
  let totalEksemplar = 0;
  let totalBiaya = 0;
  for (const it of items) {
    const qty = Number(it.jumlah_eksemplar) || 0;
    const harga = Number(it.harga_satuan) || 0;
    totalEksemplar += qty;
    totalBiaya += qty * harga;
  }
  return { totalEksemplar, totalBiaya };
}

/**
 * Build a human-readable preview of the inventory numbers each line will generate.
 * Lines with no book or zero quantity are skipped.
 */
export function buildPreviewInventaris(items: ReadonlyArray<PengadaanItemInput>): string[] {
  const out: string[] = [];
  for (const it of items) {
    const qty = Number(it.jumlah_eksemplar) || 0;
    if (!it.buku || qty === 0) continue;
    const prefix = it.prefix_inventaris?.trim() || it.buku.substring(0, DEFAULT_PREFIX_LEN);
    const first = `${prefix}-${String(1).padStart(INV_SEQ_PAD, "0")}`;
    const last = `${prefix}-${String(qty).padStart(INV_SEQ_PAD, "0")}`;
    out.push(`${it.buku_label ?? it.buku} → ${first} … ${last} (${qty} eksemplar)`);
  }
  return out;
}
