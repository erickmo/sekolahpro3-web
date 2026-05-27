/**
 * PPDB whitelisted API hooks (TanStack Query mutations + helpers).
 *
 * Source of truth: sekolahpro/ppdb/api/ppdb.py — see
 * docs/domains/ppdb/README.html §4 (API Endpoints).
 *
 * Every mutation invalidates the relevant resource:list / resource:doc
 * queries so list pages + detail pages refresh automatically.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { frappeFetch } from "@sekolahpro/api-client";

const M = "sekolahpro.ppdb.api.ppdb";

const M_GET_GELOMBANG_AKTIF = `${M}.get_gelombang_aktif`;
const M_AJUKAN = `${M}.ajukan_pendaftaran`;
const M_VERIFIKASI = `${M}.verifikasi_pendaftaran`;
const M_SET_HASIL_SELEKSI = `${M}.set_hasil_seleksi`;
const M_UMUMKAN_HASIL = `${M}.umumkan_hasil`;
const M_STATISTIK = `${M}.get_statistik_gelombang`;
const M_FINALISASI = `${M}.finalisasi_pendaftaran`;
const M_CREATE_PAYMENT_ORDER = `${M}.create_payment_order`;

export type GelombangAktif = {
  name: string;
  nama: string;
  sekolah?: string;
  tingkat?: string;
  tahun_ajaran?: string;
  tanggal_buka?: string;
  tanggal_tutup?: string;
  kuota?: number;
  biaya_pendaftaran?: number;
  status?: string;
};

export type StatistikGelombang = {
  gelombang: string;
  total_pendaftar: number;
  diterima: number;
  ditolak: number;
  sisa_kuota: number;
  per_status: Record<string, number>;
};

export type PaymentOrderResult = {
  payment_url: string;
  order_id: string;
  provider: string;
};

export type VerifikasiStatus =
  | "Diverifikasi"
  | "Seleksi"
  | "Diterima"
  | "Ditolak";

export type HasilSeleksi = "Lulus" | "Tidak Lulus";

export function useGelombangAktif(filter?: { sekolah?: string; tingkat?: string }) {
  return useQuery<GelombangAktif[]>({
    queryKey: ["ppdb:gelombang-aktif", filter ?? {}],
    queryFn: () => frappeFetch<GelombangAktif[]>(M_GET_GELOMBANG_AKTIF, filter ?? {}),
  });
}

export function useStatistikGelombang(gelombangName: string | undefined) {
  return useQuery<StatistikGelombang>({
    queryKey: ["ppdb:statistik", gelombangName],
    queryFn: () => frappeFetch<StatistikGelombang>(M_STATISTIK, { gelombang_ppdb: gelombangName! }),
    enabled: !!gelombangName,
  });
}

function invalidatePpdbCaches(qc: ReturnType<typeof useQueryClient>) {
  // Invalidate every PPDB-related list/doc cache after a mutation.
  qc.invalidateQueries({ queryKey: ["resource:list", "Pendaftaran PPDB"] });
  qc.invalidateQueries({ queryKey: ["resource:list", "Pembayaran PPDB"] });
  qc.invalidateQueries({ queryKey: ["resource:list", "Seleksi PPDB"] });
  qc.invalidateQueries({ queryKey: ["resource:list", "Daftar Ulang PPDB"] });
  qc.invalidateQueries({ queryKey: ["resource:list", "Gelombang PPDB"] });
  qc.invalidateQueries({ queryKey: ["resource:doc", "Pendaftaran PPDB"] });
  qc.invalidateQueries({ queryKey: ["resource:doc", "Gelombang PPDB"] });
  qc.invalidateQueries({ queryKey: ["ppdb:statistik"] });
  qc.invalidateQueries({ queryKey: ["ppdb:gelombang-aktif"] });
}

export function useAjukanPendaftaran() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { pendaftaran_ppdb: string }>({
    mutationFn: (args) => frappeFetch(M_AJUKAN, args),
    onSuccess: () => invalidatePpdbCaches(qc),
  });
}

export function useVerifikasiPendaftaran() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { pendaftaran_ppdb: string; status: VerifikasiStatus; catatan?: string }>({
    mutationFn: (args) => frappeFetch(M_VERIFIKASI, args),
    onSuccess: () => invalidatePpdbCaches(qc),
  });
}

export function useSetHasilSeleksi() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { seleksi_ppdb: string; hasil: HasilSeleksi }>({
    mutationFn: (args) => frappeFetch(M_SET_HASIL_SELEKSI, args),
    onSuccess: () => invalidatePpdbCaches(qc),
  });
}

export function useUmumkanHasil() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { gelombang_ppdb: string }>({
    mutationFn: (args) => frappeFetch(M_UMUMKAN_HASIL, args),
    onSuccess: () => invalidatePpdbCaches(qc),
  });
}

export function useFinalisasiPendaftaran() {
  const qc = useQueryClient();
  return useMutation<{ siswa?: string } | unknown, Error, { pendaftaran_ppdb: string }>({
    mutationFn: (args) => frappeFetch(M_FINALISASI, args),
    onSuccess: () => invalidatePpdbCaches(qc),
  });
}

export function useCreatePaymentOrder() {
  const qc = useQueryClient();
  return useMutation<PaymentOrderResult, Error, { pendaftaran_ppdb: string }>({
    mutationFn: (args) => frappeFetch<PaymentOrderResult>(M_CREATE_PAYMENT_ORDER, args),
    onSuccess: () => invalidatePpdbCaches(qc),
  });
}

// UI tone map — central so badges/buttons stay consistent across pages.
export const TONE_BY_STATUS: Record<string, "success" | "brand" | "neutral" | "warning" | "danger"> = {
  Diterima: "success",
  Lulus: "success",
  Selesai: "success",
  Diverifikasi: "brand",
  Seleksi: "brand",
  "Daftar Ulang": "brand",
  "Tidak Lulus": "danger",
  Ditolak: "danger",
  "Mengundurkan Diri": "danger",
  Draft: "neutral",
  Diajukan: "warning",
  Terkirim: "warning",
};

// Pipeline funnel — canonical order of Pendaftaran PPDB statuses.
// Used by dashboard funnel viz + seleksi pengumuman preview.
export const PIPELINE_STAGES: { key: string; label: string; tone: "neutral" | "warning" | "brand" | "success" | "danger" }[] = [
  { key: "Draft", label: "Draft", tone: "neutral" },
  { key: "Diajukan", label: "Diajukan", tone: "warning" },
  { key: "Diverifikasi", label: "Diverifikasi", tone: "brand" },
  { key: "Seleksi", label: "Seleksi", tone: "brand" },
  { key: "Diterima", label: "Diterima", tone: "success" },
  { key: "Ditolak", label: "Ditolak", tone: "danger" },
  { key: "Selesai", label: "Selesai (jadi Siswa)", tone: "success" },
];
