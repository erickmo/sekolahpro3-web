/**
 * Pure helpers untuk Sesi Kas Teller.
 *
 * Source of truth schema:
 *   docs/domains/koperasi/entities/sesi-kas-teller.html
 *
 * Lifecycle: Draft → Aktif → Pending Approval → Selesai.
 * Tidak menyentuh DB / network — semua fungsi murni agar dapat di-unit-test
 * tanpa setup Frappe. Untuk side-effect pemanggilan API gunakan layer
 * `@sekolahpro/api-client` di sisi komponen.
 */

export type Shift = "Pagi" | "Siang" | "Sore";

export interface DenominasiItem {
  /** Nilai pecahan, mis. 100_000, 50_000, 20_000. */
  nominal: number;
  /** Jumlah lembar/koin untuk pecahan ini. */
  jumlah: number;
}

const MAX_CATATAN_LEN = 500;

/** Jumlah uang total = Σ nominal × jumlah. Item tanpa jumlah dianggap 0. */
export function computeTotalDenominasi(items: DenominasiItem[]): number {
  return items.reduce((sum, it) => sum + (it.nominal ?? 0) * (it.jumlah ?? 0), 0);
}

/** Saldo seharusnya = modal_kas + total_setoran − total_penarikan (per spec). */
export function computeSaldoSeharusnya(args: {
  modalKas: number;
  totalSetoran: number;
  totalPenarikan: number;
}): number {
  return args.modalKas + args.totalSetoran - args.totalPenarikan;
}

/** Selisih = total fisik tutup − saldo seharusnya. Positif = lebih, negatif = kurang. */
export function computeSelisih(args: {
  totalDenominasiTutup: number;
  saldoSeharusnya: number;
}): number {
  return args.totalDenominasiTutup - args.saldoSeharusnya;
}

export interface TransaksiCashRow {
  jenis: string;
  jumlah: number;
}

/**
 * Cash-drawer effect per transaction jenis. Only Setor (cash in) and Tarik
 * (cash out) move physical cash in a teller drawer; Transfer / Bagi Hasil /
 * Koreksi are book entries that do not change the cash on hand, so they are
 * excluded from the reconciliation expected-balance. (+1 = setoran, -1 =
 * penarikan, 0 = non-cash.)
 */
const CASH_SIGN: Record<string, 1 | -1 | 0> = {
  Setor: 1,
  Tarik: -1,
  Transfer: 0,
  "Bagi Hasil": 0,
  Koreksi: 0,
};

/**
 * Sum a day's transactions into cash setoran/penarikan totals for the closing
 * reconciliation. Replaces the previous hard-coded zeros in TutupSesiForm so
 * "saldo seharusnya" reflects the real day, not just the opening modal.
 */
export function sumTransaksiSigned(rows: TransaksiCashRow[]): {
  totalSetoran: number;
  totalPenarikan: number;
} {
  let totalSetoran = 0;
  let totalPenarikan = 0;
  for (const row of rows) {
    const sign = CASH_SIGN[row.jenis] ?? 0;
    if (sign === 1) totalSetoran += row.jumlah ?? 0;
    else if (sign === -1) totalPenarikan += row.jumlah ?? 0;
  }
  return { totalSetoran, totalPenarikan };
}

export interface BukaSesiInput {
  shift: Shift;
  modalKas: number;
  denominasiBuka: DenominasiItem[];
}

/** Validasi form Buka Sesi. Return null jika valid, string pesan error jika tidak. */
export function validateBukaSesi(input: BukaSesiInput): string | null {
  if (input.modalKas <= 0) return "Modal kas harus lebih dari nol.";
  if (input.denominasiBuka.length === 0) {
    return "Rincian denominasi awal wajib diisi.";
  }
  const total = computeTotalDenominasi(input.denominasiBuka);
  if (total !== input.modalKas) {
    return `Total denominasi (${total.toLocaleString("id-ID")}) harus sama dengan modal kas (${input.modalKas.toLocaleString("id-ID")}).`;
  }
  return null;
}

export interface TutupSesiInput {
  denominasiTutup: DenominasiItem[];
  saldoSeharusnya: number;
  catatanSelisih: string;
}

/** Validasi form Tutup Sesi. Catatan wajib bila selisih ≠ 0. */
export function validateTutupSesi(input: TutupSesiInput): string | null {
  if (input.denominasiTutup.length === 0) {
    return "Rincian denominasi tutup wajib diisi.";
  }
  const total = computeTotalDenominasi(input.denominasiTutup);
  const selisih = computeSelisih({
    totalDenominasiTutup: total,
    saldoSeharusnya: input.saldoSeharusnya,
  });
  if (selisih !== 0 && input.catatanSelisih.trim().length === 0) {
    return "Selisih tidak nol — catatan selisih wajib diisi.";
  }
  if (input.catatanSelisih.length > MAX_CATATAN_LEN) {
    return `Catatan terlalu panjang (maks ${MAX_CATATAN_LEN} karakter).`;
  }
  return null;
}
