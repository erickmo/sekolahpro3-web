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
