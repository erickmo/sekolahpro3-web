// Typed client for the Pegawai self-service backend
// (sekolahpro.akademik.api.portal_pegawai.*). Each endpoint resolves the caller
// Pegawai from the Frappe session and returns only that pegawai's data.
import { useFrappeMethod, useFrappeMutation } from "@sekolahpro/api-client";

const NS = "sekolahpro.akademik.api.portal_pegawai";
export const M_MY_CUTI = `${NS}.my_cuti`;
export const M_SALDO_CUTI = `${NS}.saldo_cuti`;
export const M_AJUKAN_CUTI = `${NS}.ajukan_cuti`;
export const M_MY_ABSENSI = `${NS}.my_absensi`;
export const M_MY_SK = `${NS}.my_sk`;

export type CutiStatus = "Draft" | "Diajukan" | "Disetujui" | "Ditolak" | "Selesai";

export interface CutiRow {
  name: string;
  jenis_cuti: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: CutiStatus;
}

export interface SaldoRow {
  jenis_cuti: string;
  /** Kuota tahunan; null = tidak dibatasi untuk jenis ini. */
  kuota: number | null;
  terpakai: number;
  /** Sisa kuota; null = tidak dibatasi. */
  sisa: number | null;
}

export interface AbsensiRow {
  tanggal: string;
  status: string;
  keterangan?: string | null;
}

export interface SkRow {
  name: string;
  status: string;
  nomor_sk_manual?: string | null;
  tanggal_sk?: string | null;
  /** Disintesis backend: "Mengajar" | "Jabatan". */
  jenis: string;
}

export interface AjukanCutiInput extends Record<string, unknown> {
  jenis_cuti: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  alasan?: string;
}

/** Daftar pengajuan cuti milik pegawai yang login. */
export function useMyCuti() {
  return useFrappeMethod<CutiRow[]>(M_MY_CUTI);
}

/** Sisa saldo cuti per jenis untuk tahun berjalan (atau `tahun` tertentu). */
export function useSaldoCuti(tahun?: number) {
  return useFrappeMethod<SaldoRow[]>(M_SALDO_CUTI, tahun ? { tahun } : {});
}

/** Rekap kehadiran pegawai; opsional difilter `bulan` (1-12). */
export function useMyAbsensi(bulan?: number) {
  return useFrappeMethod<AbsensiRow[]>(M_MY_ABSENSI, bulan ? { bulan } : {});
}

/** SK Mengajar + SK Jabatan milik pegawai yang login. */
export function useMySk() {
  return useFrappeMethod<SkRow[]>(M_MY_SK);
}

/** Mutasi: ajukan cuti baru (dibuat sebagai Draft, controller memvalidasi). */
export function useAjukanCuti() {
  return useFrappeMutation<AjukanCutiInput, string>(M_AJUKAN_CUTI);
}

const ID_DATE = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });

/** Format tanggal ISO -> "23 Jun 2026"; "-" bila kosong/invalid. */
export function formatTanggal(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : ID_DATE.format(d);
}
