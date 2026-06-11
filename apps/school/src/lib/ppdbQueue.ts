/**
 * ppdbQueue — bangun antrean kerja PPDB untuk dashboard staff/manajer.
 *
 * Pure (tanpa I/O): menerima list Pendaftar + tanggal hari ini, mengembalikan
 * 4 grup pekerjaan yang menunggu tindakan (dokumen, seleksi, pembayaran,
 * daftar-ulang) lengkap dengan count, preview item, dan deep-link route.
 *
 * Dipakai pages PPDB untuk menampilkan "apa yang harus dikerjakan hari ini".
 */

import type { Pendaftar } from "../data/ppdb";

/** Identitas stabil tiap antrean — dipakai sebagai key UI + lookup test. */
export type WorkQueueId = "dokumen" | "seleksi" | "pembayaran" | "daftar-ulang";

/** Satu baris pratinjau di dalam sebuah antrean kerja. */
export interface WorkQueueItem {
  noPendaftaran: string;
  namaLengkap: string;
  detail: string;
}

/** Sebuah grup antrean kerja lengkap dengan ringkasan + deep-link. */
export interface WorkQueueGroup {
  id: WorkQueueId;
  label: string;
  description: string;
  count: number;
  tone: "brand" | "warning" | "danger" | "success" | "neutral";
  actionHref: string;
  items: WorkQueueItem[];
}

// Maksimal baris pratinjau yang ditampilkan per grup (sisanya cukup via count).
const PREVIEW_LIMIT = 5;

// Status dokumen yang dianggap belum tuntas → butuh tindakan staff.
const DOC_PENDING_STATUSES = new Set<Pendaftar["dokumen"][number]["status"]>(["Belum", "Ditolak"]);

// Status pendaftaran yang sudah masuk fase seleksi (skor tes diharapkan ada).
const SELEKSI_STATUSES = new Set<Pendaftar["statusPendaftaran"]>(["Tes", "Lulus", "Tidak Lulus"]);

// Status pendaftaran yang berhak/wajib melakukan daftar ulang.
const DAFTAR_ULANG_ELIGIBLE = new Set<Pendaftar["statusPendaftaran"]>(["Lulus", "Diterima"]);

// Status pembayaran yang menandakan tagihan belum tertangani.
const PAYMENT_PENDING_STATUS = "Tertunda";

// Status pendaftaran final yang menandakan daftar ulang sudah selesai.
const STATUS_DAFTAR_ULANG_DONE: Pendaftar["statusPendaftaran"] = "Daftar Ulang";

// Prefix route PPDB; "$sekolah" sengaja literal agar konsumen mengisi param.
const ROUTE_PREFIX = "/sch/$sekolah/akademik/ppdb";

/** True jika pendaftar punya minimal satu dokumen yang belum tuntas. */
function needsDocAction(p: Pendaftar): boolean {
  return p.dokumen.some((d) => DOC_PENDING_STATUSES.has(d.status));
}

/** True jika pendaftar di fase seleksi tetapi skor tes belum diinput. */
function needsSeleksiAction(p: Pendaftar): boolean {
  // Skor undefined = panitia belum memasukkan nilai → masih jadi pekerjaan.
  return SELEKSI_STATUSES.has(p.statusPendaftaran) && p.skorTes === undefined;
}

/** True jika ada tagihan pembayaran yang masih tertunda. */
function needsPaymentAction(p: Pendaftar): boolean {
  return p.pembayaran.some((bayar) => bayar.status === PAYMENT_PENDING_STATUS);
}

/** True jika pendaftar lulus/diterima tetapi belum daftar ulang. */
function needsDaftarUlangAction(p: Pendaftar): boolean {
  return (
    DAFTAR_ULANG_ELIGIBLE.has(p.statusPendaftaran) &&
    p.statusPendaftaran !== STATUS_DAFTAR_ULANG_DONE
  );
}

/** Hitung jumlah dokumen yang belum tuntas untuk teks detail. */
function pendingDocCount(p: Pendaftar): number {
  return p.dokumen.filter((d) => DOC_PENDING_STATUSES.has(d.status)).length;
}

/** Hitung jumlah tagihan tertunda untuk teks detail. */
function pendingPaymentCount(p: Pendaftar): number {
  return p.pembayaran.filter((bayar) => bayar.status === PAYMENT_PENDING_STATUS).length;
}

// Pembangun teks detail per antrean — dipisah agar pesan kontekstual & ringkas.
const DETAIL_BUILDER: Record<WorkQueueId, (p: Pendaftar) => string> = {
  dokumen: (p) => `${pendingDocCount(p)} dokumen perlu diverifikasi`,
  seleksi: (p) => `${p.statusPendaftaran} • skor tes belum diinput`,
  pembayaran: (p) => `${pendingPaymentCount(p)} tagihan tertunda`,
  "daftar-ulang": (p) => `${p.statusPendaftaran} • menunggu daftar ulang`,
};

/** Definisi statis tiap antrean: predikat, metadata, dan route tujuan. */
interface QueueSpec {
  id: WorkQueueId;
  label: string;
  description: string;
  tone: WorkQueueGroup["tone"];
  route: string;
  predicate: (p: Pendaftar) => boolean;
}

// Urutan grup mengikuti alur kerja PPDB: berkas → seleksi → bayar → daftar ulang.
const QUEUE_SPECS: QueueSpec[] = [
  {
    id: "dokumen",
    label: "Verifikasi Dokumen",
    description: "Berkas pendaftar yang menunggu diverifikasi atau ditolak.",
    tone: "warning",
    route: `${ROUTE_PREFIX}/calon-siswa`,
    predicate: needsDocAction,
  },
  {
    id: "seleksi",
    label: "Input Nilai Seleksi",
    description: "Peserta seleksi yang skor tesnya belum dimasukkan.",
    tone: "brand",
    route: `${ROUTE_PREFIX}/seleksi`,
    predicate: needsSeleksiAction,
  },
  {
    id: "pembayaran",
    label: "Pembayaran Tertunda",
    description: "Tagihan pendaftar yang belum lunas dan perlu ditindaklanjuti.",
    tone: "danger",
    route: `${ROUTE_PREFIX}/pembayaran`,
    predicate: needsPaymentAction,
  },
  {
    id: "daftar-ulang",
    label: "Daftar Ulang",
    description: "Pendaftar lulus/diterima yang belum menyelesaikan daftar ulang.",
    tone: "success",
    route: `${ROUTE_PREFIX}/daftar-ulang`,
    predicate: needsDaftarUlangAction,
  },
];

/** Ubah pendaftar yang cocok menjadi item pratinjau untuk satu antrean. */
function toQueueItem(p: Pendaftar, id: WorkQueueId): WorkQueueItem {
  return {
    noPendaftaran: p.noPendaftaran,
    namaLengkap: p.namaLengkap,
    detail: DETAIL_BUILDER[id](p),
  };
}

/** Bangun satu grup antrean dari spesifikasi + list pendaftar tersaring. */
function buildGroup(spec: QueueSpec, list: Pendaftar[]): WorkQueueGroup {
  const matched = list.filter(spec.predicate);
  return {
    id: spec.id,
    label: spec.label,
    description: spec.description,
    count: matched.length,
    // Grup kosong tampil netral; berisi pakai tone aksinya agar kontras.
    tone: matched.length === 0 ? "neutral" : spec.tone,
    actionHref: spec.route,
    items: matched.slice(0, PREVIEW_LIMIT).map((p) => toQueueItem(p, spec.id)),
  };
}

/**
 * Bangun 4 antrean kerja PPDB dari daftar pendaftar.
 *
 * @param list daftar pendaftar yang akan dikelompokkan
 * @param _todayIso tanggal hari ini (ISO) — disediakan untuk paritas kontrak &
 *   ekstensi berbasis-waktu di masa depan; saat ini grup tidak bergantung waktu
 * @returns 4 grup berurutan: dokumen, seleksi, pembayaran, daftar-ulang
 */
export function buildWorkQueue(list: Pendaftar[], _todayIso: string): WorkQueueGroup[] {
  return QUEUE_SPECS.map((spec) => buildGroup(spec, list));
}
