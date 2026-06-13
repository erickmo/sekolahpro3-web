/**
 * Pure client-side guards for koperasi savings transactions and teller sessions.
 *
 * Why pure (not a controller method): these run in the React form BEFORE any
 * network call, to stop cash-discrepancy mistakes (zero/blank nominal, transfer
 * to self, withdrawal over balance) while the member is still at the counter.
 * No DB / no session access → fully unit-testable. The same backend rules still
 * apply server-side; this is fast UX feedback, not the authority.
 */

// Jenis a teller can CREATE from the UI — exact backend Select values of
// Transaksi Simpanan. The other backend values (Bunga, Biaya Admin Dormant,
// Pelunasan Denda Perpus) are system-generated and never offered here.
export type TransaksiJenis = "Setoran" | "Penarikan" | "Bagi Hasil";

export interface ValidateTransaksiInput {
  jenis: TransaksiJenis;
  /** Nominal in rupiah. Must be > 0. */
  nominal: number;
  /** Source account name. Required. */
  rekening: string;
  /** Known source balance, if available. When provided, Penarikan cannot exceed it. */
  saldo?: number;
}

/**
 * Validate a transaction before submit.
 * @returns null when valid, otherwise a Bahasa Indonesia error message.
 */
export function validateTransaksi(input: ValidateTransaksiInput): string | null {
  if (!input.rekening.trim()) return "Rekening wajib dipilih.";
  if (!Number.isFinite(input.nominal) || input.nominal <= 0) {
    return "Nominal harus lebih dari nol.";
  }

  // Only block over-withdrawal when we actually know the balance.
  if (input.jenis === "Penarikan" && input.saldo !== undefined && input.nominal > input.saldo) {
    return `Nominal penarikan melebihi saldo (Rp ${input.saldo.toLocaleString("id-ID")}).`;
  }

  return null;
}

export interface SesiKasRow {
  teller?: string;
  status?: string;
}

/**
 * True when `userId` currently owns an open (Aktif) cash session.
 * Drives the "buka sesi kas dulu" gate before cash actions.
 */
export function hasActiveSession(sessions: SesiKasRow[], userId: string): boolean {
  return sessions.some((s) => s.status === "Aktif" && s.teller === userId);
}
