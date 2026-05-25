/**
 * Denda summary helper (PERP-ADR-0001).
 *
 * Typed wrapper around the whitelisted backend method
 * `sekolahpro.perpustakaan.api.denda.get_denda_summary` which aggregates
 * `Denda Perpustakaan` rows per `Peminjaman Buku`. Used by the unified
 * sirkulasi list to decorate rows with their fine totals + payment status
 * without N+1 fetching.
 *
 * See: docs/superpowers/specs/2026-05-25-perpustakaan-sirkulasi-merge-design.md
 */
import { frappeFetch } from "@sekolahpro/api-client";

export type DendaStatus = "Belum Lunas" | "Lunas" | "";

export interface DendaSummaryEntry {
  total: number;
  status_bayar: DendaStatus;
}

export type DendaSummary = Record<string, DendaSummaryEntry>;

/**
 * Fetch an aggregated denda summary keyed by peminjaman name.
 *
 * Returns an empty mapping immediately when given an empty input — this avoids
 * a wasted backend roundtrip and matches the contract of the whitelisted
 * method (see PERP-ADR-0001).
 */
export async function fetchDendaSummary(
  peminjamanNames: string[],
): Promise<DendaSummary> {
  if (peminjamanNames.length === 0) return {};
  return frappeFetch<DendaSummary>(
    "sekolahpro.perpustakaan.api.denda.get_denda_summary",
    { peminjaman_names: peminjamanNames },
  );
}
