/**
 * Pure aggregation for the Koperasi "Laporan rinci" page (kop/$sekolah/laporan).
 *
 * Layer: domain logic only — no React, no fetch. The route fetches raw rows via
 * useResourceList and feeds them here; components format the returned numbers.
 *
 * Domain contracts verified against backend (sekolahpro/koperasi):
 * - Transaksi Simpanan measures MEMBER-LIABILITY movement (gl.py skips cash GL
 *   for Bagi Hasil/Bunga), NOT physical koperasi cash. kredit grows member saldo,
 *   debit shrinks it. (transaksi_simpanan.py: Pelunasan Denda Perpus = debit.)
 * - Physical cash flow comes from Sesi Kas Teller total_setoran/total_penarikan,
 *   which are only populated when a session is closed (status "Selesai").
 * - NPF is computed on at-risk principal (Aktif + Macet), excluding settled (Lunas).
 * Source: docs/superpowers/plans/2026-06-21-koperasi-laporan-rinci.md
 */

/** Jenis transaksi yang menambah saldo simpanan anggota (kredit). */
export const JENIS_KREDIT = ["Setoran", "Bagi Hasil", "Bunga"] as const;
/** Jenis transaksi yang mengurangi saldo simpanan anggota (debit). */
export const JENIS_DEBIT = ["Penarikan", "Biaya Admin Dormant", "Pelunasan Denda Perpus"] as const;

/** Status sesi kas yang sudah ditutup — satu-satunya yang punya total kas valid. */
const SESI_SELESAI = "Selesai";
/** Status akad pembiayaan yang masih berisiko (dipakai sebagai penyebut NPF). */
const STATUS_AKTIF = "Aktif";
const STATUS_MACET = "Macet";

export type ArahMutasi = "kredit" | "debit";

export interface TransaksiRow {
  jenis: string;
  jumlah: number;
}
export interface SesiKasRow {
  teller: string;
  status: string;
  total_setoran?: number;
  total_penarikan?: number;
  selisih?: number;
}
export interface RekeningRow {
  saldo: number;
  status: string;
}
export interface AkadRow {
  jumlah_pokok: number;
  status: string;
}

export interface MutasiJenis {
  jenis: string;
  count: number;
  total: number;
  arah: ArahMutasi;
}
export interface MutasiSimpananRekap {
  perJenis: MutasiJenis[];
  totalKredit: number;
  totalDebit: number;
  net: number;
}

export interface ArusKasTeller {
  teller: string;
  sesi: number;
  setoran: number;
  penarikan: number;
  net: number;
}
export interface ArusKasRekap {
  perTeller: ArusKasTeller[];
  totalSetoran: number;
  totalPenarikan: number;
  netKas: number;
  sesiBermasalah: number;
  totalSelisih: number;
}

export interface KomposisiStatus {
  status: string;
  count: number;
  saldo: number;
}
export interface KomposisiRekap {
  perStatus: KomposisiStatus[];
  totalSaldo: number;
  totalRekening: number;
}

export interface KualitasStatus {
  status: string;
  count: number;
  pokok: number;
}
export interface KualitasRekap {
  perStatus: KualitasStatus[];
  totalPokok: number;
  pokokBerisiko: number;
  npfRatio: number;
}

/** Classify a savings transaction jenis as kredit (saldo up) or debit (saldo down). */
export function arahJenis(jenis: string): ArahMutasi {
  return (JENIS_DEBIT as readonly string[]).includes(jenis) ? "debit" : "kredit";
}

/**
 * Recap savings-liability movement grouped by jenis.
 * net = totalKredit - totalDebit (positive = simpanan tumbuh).
 */
export function rekapMutasiSimpanan(rows: TransaksiRow[]): MutasiSimpananRekap {
  const byJenis = new Map<string, MutasiJenis>();
  for (const row of rows) {
    const jumlah = row.jumlah ?? 0;
    const existing = byJenis.get(row.jenis);
    if (existing) {
      existing.count += 1;
      existing.total += jumlah;
    } else {
      byJenis.set(row.jenis, { jenis: row.jenis, count: 1, total: jumlah, arah: arahJenis(row.jenis) });
    }
  }
  const perJenis = [...byJenis.values()];
  const totalKredit = perJenis.filter((p) => p.arah === "kredit").reduce((s, p) => s + p.total, 0);
  const totalDebit = perJenis.filter((p) => p.arah === "debit").reduce((s, p) => s + p.total, 0);
  return { perJenis, totalKredit, totalDebit, net: totalKredit - totalDebit };
}

/**
 * Recap physical teller cash flow from CLOSED sessions only, grouped by teller.
 * Open/draft sessions have no valid cash totals so they are skipped.
 */
export function rekapArusKasTeller(rows: SesiKasRow[]): ArusKasRekap {
  const closed = rows.filter((r) => r.status === SESI_SELESAI);
  const byTeller = new Map<string, ArusKasTeller>();
  let totalSelisih = 0;
  let sesiBermasalah = 0;
  for (const row of closed) {
    const setoran = row.total_setoran ?? 0;
    const penarikan = row.total_penarikan ?? 0;
    const selisih = row.selisih ?? 0;
    totalSelisih += selisih;
    if (selisih !== 0) sesiBermasalah += 1;
    const existing = byTeller.get(row.teller);
    if (existing) {
      existing.sesi += 1;
      existing.setoran += setoran;
      existing.penarikan += penarikan;
      existing.net += setoran - penarikan;
    } else {
      byTeller.set(row.teller, { teller: row.teller, sesi: 1, setoran, penarikan, net: setoran - penarikan });
    }
  }
  const perTeller = [...byTeller.values()];
  const totalSetoran = perTeller.reduce((s, t) => s + t.setoran, 0);
  const totalPenarikan = perTeller.reduce((s, t) => s + t.penarikan, 0);
  return {
    perTeller,
    totalSetoran,
    totalPenarikan,
    netKas: totalSetoran - totalPenarikan,
    sesiBermasalah,
    totalSelisih,
  };
}

/** Recap savings accounts by status with count + total saldo (point-in-time). */
export function rekapKomposisiSimpanan(rows: RekeningRow[]): KomposisiRekap {
  const byStatus = new Map<string, KomposisiStatus>();
  for (const row of rows) {
    const saldo = row.saldo ?? 0;
    const existing = byStatus.get(row.status);
    if (existing) {
      existing.count += 1;
      existing.saldo += saldo;
    } else {
      byStatus.set(row.status, { status: row.status, count: 1, saldo });
    }
  }
  const perStatus = [...byStatus.values()];
  return {
    perStatus,
    totalSaldo: perStatus.reduce((s, p) => s + p.saldo, 0),
    totalRekening: rows.length,
  };
}

/**
 * Recap financing quality by status. npfRatio = Macet pokok / at-risk pokok,
 * where at-risk = Aktif + Macet (Lunas excluded, basis pokok awal). Guards 0/0 = 0.
 */
export function rekapKualitasPembiayaan(rows: AkadRow[]): KualitasRekap {
  const byStatus = new Map<string, KualitasStatus>();
  for (const row of rows) {
    const pokok = row.jumlah_pokok ?? 0;
    const existing = byStatus.get(row.status);
    if (existing) {
      existing.count += 1;
      existing.pokok += pokok;
    } else {
      byStatus.set(row.status, { status: row.status, count: 1, pokok });
    }
  }
  const perStatus = [...byStatus.values()];
  const pokokOf = (status: string) => perStatus.find((p) => p.status === status)?.pokok ?? 0;
  const macet = pokokOf(STATUS_MACET);
  const pokokBerisiko = pokokOf(STATUS_AKTIF) + macet;
  return {
    perStatus,
    totalPokok: perStatus.reduce((s, p) => s + p.pokok, 0),
    pokokBerisiko,
    npfRatio: pokokBerisiko === 0 ? 0 : macet / pokokBerisiko,
  };
}
