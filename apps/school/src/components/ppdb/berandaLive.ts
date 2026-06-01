/**
 * berandaLive — lapisan agregasi LIVE untuk Beranda PPDB.
 *
 * Dipakai HANYA oleh route sch.$sekolah.ppdb.index. Diekstrak agar file route
 * tetap di bawah 300 baris dan tiap fungsi ringkas (< 40 baris).
 *
 * Kontrak: setiap KPI/seri viz di-wire ke sumber live (gelombang aktif,
 * statistik gelombang, pembayaran), TAPI selalu jatuh ke nilai turunan-mock
 * (ppdbAnalytics) saat hasil live kosong/undefined. Backend kosong tidak boleh
 * membuat halaman blank/crash — ia degradasi ke perilaku mock yang ada.
 *
 * Tidak ada state/DB/sesi di luar hook React TanStack Query yang dipanggil di
 * dalam useLiveAggregates; builder KPI/viz murni terhadap input yang diberikan.
 */
import { useMemo } from "react";
import { listPpdbForSekolah } from "../../data/ppdb";
import {
  funnelData,
  jalurDistribution,
  paymentStatusDistribution,
  dailyRegistrationTrend,
  quotaInfo,
} from "../../lib/ppdbAnalytics";
import {
  useGelombangAktif,
  useStatistikGelombang,
  type GelombangAktif,
  type StatistikGelombang,
} from "../../lib/ppdbApi";
import {
  usePembayaranLive,
  perStatusToFunnel,
  jalurDistributionLive,
  paymentStatusDistributionLive,
  type PembayaranLiveRow,
} from "../../lib/ppdbLive";
import type { BerandaKpi, BerandaViz } from "./berandaPanel";

/* ------------------------------------------------------------------ */
/* Konstanta                                                          */
/* ------------------------------------------------------------------ */

// FALLBACK saat tidak ada gelombang aktif live; live menimpa via `kuota`.
const FALLBACK_KUOTA_GELOMBANG_AKTIF = 200;
// FALLBACK saat tidak ada gelombang aktif live; live menimpa via `tanggal_tutup`.
const FALLBACK_GELOMBANG_DEADLINE_ISO = "2026-06-30";
/** Tanggal acuan "hari ini" untuk hitung tren + sisa hari (deterministik). */
export const TODAY_ISO = "2026-05-25";
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const TREND_WINDOW_DAYS = 14;

/** Status pendaftaran yang dihitung sebagai "lolos" pada KPI. */
const LOLOS_STATUSES = new Set(["Lulus", "Daftar Ulang", "Diterima"]);
/** Status pembayaran yang menandakan tagihan belum tertangani. */
export const PAYMENT_PENDING = "Tertunda";
// Status gelombang yang dianggap "aktif" untuk dipilih sebagai sumber live.
const GELOMBANG_STATUS_OPEN = "Buka";

/* ------------------------------------------------------------------ */
/* Tipe baris + field whitelist                                       */
/* ------------------------------------------------------------------ */

/** Field "Pendaftaran PPDB" terverifikasi dari doctype JSON. */
export type PendaftaranRow = {
  name: string;
  status?: string;
  gelombang_ppdb?: string;
  calon_siswa?: string;
  tanggal_daftar?: string;
  jalur?: string;
};
export const PENDAFTARAN_FIELDS = [
  "name",
  "status",
  "gelombang_ppdb",
  "calon_siswa",
  "tanggal_daftar",
  "jalur",
];

type MockList = ReturnType<typeof listPpdbForSekolah>;

/* ------------------------------------------------------------------ */
/* Bundel + resolusi sumber live                                      */
/* ------------------------------------------------------------------ */

/**
 * Bundel nilai live yang sudah diresolusi untuk halaman; setiap konsumen
 * memutuskan sendiri kapan jatuh ke fallback mock berdasar isi bundel ini.
 */
export interface LiveAggregates {
  gelombang: GelombangAktif | undefined;
  stat: StatistikGelombang | undefined;
  pembayaran: PembayaranLiveRow[];
}

/** Pilih gelombang aktif: utamakan status "Buka", else gelombang pertama. */
function pickActiveGelombang(list: GelombangAktif[]): GelombangAktif | undefined {
  return list.find((g) => g.status === GELOMBANG_STATUS_OPEN) ?? list[0];
}

/** Wire ketiga sumber live (gelombang, statistik, pembayaran) jadi satu bundel. */
export function useLiveAggregates(): LiveAggregates {
  const gelombangQ = useGelombangAktif();
  const gelombang = pickActiveGelombang(gelombangQ.data ?? []);
  const statistikQ = useStatistikGelombang(gelombang?.name);
  const pembayaranQ = usePembayaranLive();
  return {
    gelombang,
    stat: statistikQ.data,
    pembayaran: pembayaranQ.data ?? [],
  };
}

/* ------------------------------------------------------------------ */
/* Builder KPI                                                        */
/* ------------------------------------------------------------------ */

/** Hari tersisa menuju deadline (0 bila tanggal invalid atau sudah lewat). */
function hariTersisa(deadlineIso: string, todayIso: string): number {
  const d = new Date(deadlineIso).getTime();
  const t = new Date(todayIso).getTime();
  if (Number.isNaN(d) || Number.isNaN(t)) return 0;
  return Math.max(0, Math.ceil((d - t) / MS_PER_DAY));
}

/** Hitung jumlah pendaftar unik dengan minimal satu tagihan tertunda. */
function countPembayaranPending(list: MockList): number {
  return list.filter((p) => p.pembayaran.some((b) => b.status === PAYMENT_PENDING)).length;
}

/** Bangun KPI agregat. Total & hari-tersisa hidup; jatuh ke mock saat kosong. */
export function useKpi(rows: PendaftaranRow[], mockList: MockList, live: LiveAggregates): BerandaKpi {
  return useMemo(() => {
    // total: statistik live total_pendaftar; fallback = jumlah baris backend.
    const total = live.stat ? live.stat.total_pendaftar : rows.length;
    const lolos = rows.filter((p) => p.status && LOLOS_STATUSES.has(p.status)).length;
    // deadline: tanggal_tutup gelombang aktif; fallback = konstanta deadline.
    const deadline = live.gelombang?.tanggal_tutup ?? FALLBACK_GELOMBANG_DEADLINE_ISO;
    return {
      total,
      lolos,
      pembayaranPending: countPembayaranPending(mockList),
      hariTersisa: hariTersisa(deadline, TODAY_ISO),
    };
  }, [rows, mockList, live]);
}

/* ------------------------------------------------------------------ */
/* Builder visualisasi                                                */
/* ------------------------------------------------------------------ */

/** Jalur donut: hitung dari baris backend bila ada `jalur`, else mock. */
function resolveJalur(rows: PendaftaranRow[], mockList: MockList): BerandaViz["jalur"] {
  const liveJalur = jalurDistributionLive(rows);
  return liveJalur.length ? liveJalur : jalurDistribution(mockList);
}

/** Kuota gauge: pakai statistik+kuota gelombang live; else quotaInfo mock. */
function resolveQuota(
  rows: PendaftaranRow[],
  live: LiveAggregates,
): { quotaFilled: number; quotaTotal: number } {
  if (live.stat && live.gelombang?.kuota) {
    // sisa_kuota dari backend → terisi = kuota - sisa (terjamin >= 0 di server).
    const total = live.gelombang.kuota;
    return { quotaFilled: Math.max(0, total - live.stat.sisa_kuota), quotaTotal: total };
  }
  const quota = quotaInfo(rows.length, FALLBACK_KUOTA_GELOMBANG_AKTIF);
  return { quotaFilled: quota.filled, quotaTotal: FALLBACK_KUOTA_GELOMBANG_AKTIF };
}

/** Rakit bundel visualisasi; tiap seri hidup dgn fallback ke analytics mock. */
export function useViz(rows: PendaftaranRow[], mockList: MockList, live: LiveAggregates): BerandaViz {
  return useMemo(() => {
    const trend = dailyRegistrationTrend(rows, TREND_WINDOW_DAYS, TODAY_ISO);
    return {
      // funnel: per_status statistik live; fallback = funnel dari status baris.
      funnel: live.stat ? perStatusToFunnel(live.stat.per_status) : funnelData(rows),
      trendPoints: trend.points,
      trendLabels: trend.labels,
      jalur: resolveJalur(rows, mockList),
      // payment: distribusi status pembayaran live; fallback = analytics mock.
      paymentDist: live.pembayaran.length
        ? paymentStatusDistributionLive(live.pembayaran)
        : paymentStatusDistribution(mockList),
      ...resolveQuota(rows, live),
    };
  }, [rows, mockList, live]);
}
