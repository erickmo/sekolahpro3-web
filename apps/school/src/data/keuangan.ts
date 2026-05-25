// Mock data fixture untuk modul Keuangan Sekolah.
// Replace dengan @sekolahpro/api-client hooks ketika backend siap.

export type StatusTagihan =
  | "Draft"
  | "Terkirim"
  | "Tertunda"
  | "Lunas"
  | "Jatuh Tempo"
  | "Cicilan"
  | "Dibatalkan";

export type MetodeBayar = "Tunai" | "Transfer" | "QRIS" | "Virtual Account" | "EDC";

export type KategoriPengeluaran =
  | "Operasional"
  | "Gaji"
  | "Sarana Prasarana"
  | "Kegiatan"
  | "ATK"
  | "Utilitas"
  | "Lainnya";

export type JenisJurnal = "Penerimaan" | "Pengeluaran" | "Penyesuaian";

export type StatusPengeluaran =
  | "Draft"
  | "Approval"
  | "Disetujui"
  | "Ditolak"
  | "Dibayar";

export interface TagihanRow {
  id: string;
  siswa: string;
  kelas: string;
  judul: string;
  jatuhTempo: string;
  jumlah: number;
  dibayar: number;
  status: StatusTagihan;
  tahunAjaran: string;
}

export interface PembayaranRow {
  id: string;
  tanggal: string;
  siswa: string;
  kelas: string;
  judul: string;
  metode: MetodeBayar;
  jumlah: number;
  ref: string;
  penerima: string;
  tagihanId: string;
}

export interface PengeluaranRow {
  id: string;
  tanggal: string;
  kategori: KategoriPengeluaran;
  deskripsi: string;
  jumlah: number;
  penerima: string;
  metode: MetodeBayar;
  approver?: string | undefined;
  status: StatusPengeluaran;
}

export interface JurnalRow {
  id: string;
  tanggal: string;
  ref: string;
  jenis: JenisJurnal;
  akun: string;
  debit: number;
  kredit: number;
  keterangan: string;
}

export interface KasRow {
  tanggal: string;
  saldoAwal: number;
  masuk: number;
  keluar: number;
  saldoAkhir: number;
}

export interface RingkasanBulan {
  bulan: string;
  pemasukan: number;
  pengeluaran: number;
  saldo: number;
}

// --- Seeded RNG --------------------------------------------------------------

function rand(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
function pick<T>(arr: readonly T[], seed: number): T {
  return arr[Math.floor(rand(seed) * arr.length)]!;
}
function pad(n: number, w: number): string {
  return String(n).padStart(w, "0");
}

// --- Helpers ----------------------------------------------------------------

export function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatTanggal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// --- Vocabulary -------------------------------------------------------------

const SISWA_NAMES = [
  "Budi Santoso", "Rina Anggraini", "Dewi Lestari", "Ahmad Fauzi", "Siti Nurhaliza",
  "Andi Pratama", "Maya Sari", "Reza Maulana", "Nia Ramadhani", "Bagas Wicaksono",
  "Putri Ayu", "Hendra Gunawan", "Tiara Putri", "Fajar Sidik", "Lestari Wulandari",
  "Galih Permana", "Sinta Dewi", "Yusuf Mahendra", "Anisa Rahmawati", "Rizky Hidayat",
  "Citra Kirana", "Eko Prasetyo", "Vania Sabrina", "Aldi Taher", "Bunga Citra",
];

const KELAS_LIST = ["7A", "7B", "8A", "8B", "9A", "9B", "10 IPA 1", "10 IPS 1", "11 IPA 2", "12 IPS 1"];

const JUDUL_TAGIHAN = [
  "SPP Bulanan",
  "Uang Gedung",
  "Seragam Sekolah",
  "Buku Pelajaran",
  "Study Tour",
  "Ujian Tengah Semester",
  "Ujian Akhir Semester",
  "Kegiatan Ekstrakurikuler",
  "Dana Komite",
  "Praktikum Lab",
];

const STATUS_TAGIHAN_POOL: StatusTagihan[] = [
  "Lunas", "Lunas", "Lunas", "Tertunda", "Tertunda",
  "Jatuh Tempo", "Cicilan", "Terkirim", "Draft", "Dibatalkan",
];

const METODE_POOL: MetodeBayar[] = ["Tunai", "Transfer", "QRIS", "Virtual Account", "EDC"];

const PENERIMA_KAS = ["Bendahara Sekolah", "Tata Usaha", "Kasir", "Staf Keuangan"];

const KATEGORI_POOL: KategoriPengeluaran[] = [
  "Operasional", "Gaji", "Sarana Prasarana", "Kegiatan", "ATK", "Utilitas", "Lainnya",
];

const DESKRIPSI_PENGELUARAN = [
  "Pembayaran listrik bulanan",
  "Pembayaran air PDAM",
  "Pembelian ATK ruang guru",
  "Honor pengajar tambahan",
  "Pemeliharaan AC kelas",
  "Pembelian buku perpustakaan",
  "Konsumsi rapat komite",
  "Servis printer kantor",
  "Pembelian alat kebersihan",
  "Biaya internet bulanan",
  "Renovasi toilet siswa",
  "Pembelian seragam upacara",
];

const PENERIMA_PENGELUARAN = [
  "PLN Persero", "PDAM Tirta", "CV Maju Jaya", "Toko ATK Sentosa",
  "Bpk. Ahmad (Guru)", "PT Telkom", "Kantin Bu Yati", "Vendor Servis Tek",
];

const APPROVER_LIST = ["Kepala Sekolah", "Wakil Kepala Sekolah", "Bendahara Sekolah"];

const STATUS_PENGELUARAN_POOL: StatusPengeluaran[] = [
  "Dibayar", "Dibayar", "Disetujui", "Approval", "Approval", "Draft", "Ditolak",
];

const AKUN_LIST = [
  "1-1000 Kas",
  "1-1100 Bank Mandiri",
  "1-1200 Bank BCA",
  "4-1000 Pendapatan SPP",
  "4-2000 Pendapatan Lain",
  "5-1000 Beban Operasional",
  "5-2000 Beban Gaji",
  "5-3000 Beban Utilitas",
];

const JENIS_JURNAL_POOL: JenisJurnal[] = [
  "Penerimaan", "Penerimaan", "Pengeluaran", "Pengeluaran", "Penyesuaian",
];

const TAHUN_AJARAN_LIST = ["2024/2025", "2025/2026"];

const BULAN_NAMA = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

// --- Builders ---------------------------------------------------------------

function buildTagihan(idx: number): TagihanRow {
  const siswa = SISWA_NAMES[idx % SISWA_NAMES.length]!;
  const kelas = KELAS_LIST[idx % KELAS_LIST.length]!;
  const judul = pick(JUDUL_TAGIHAN, idx + 3);
  const status = STATUS_TAGIHAN_POOL[idx % STATUS_TAGIHAN_POOL.length]!;
  const jumlah = (1 + Math.floor(rand(idx + 5) * 30)) * 100000;
  const dibayar =
    status === "Lunas" ? jumlah
    : status === "Cicilan" ? Math.floor(jumlah * (0.3 + rand(idx + 9) * 0.4))
    : status === "Tertunda" ? Math.floor(jumlah * rand(idx + 11) * 0.3)
    : 0;
  const month = (idx % 12) + 1;
  const day = (idx % 27) + 1;
  const year = 2026;
  const tahunAjaran = pick(TAHUN_AJARAN_LIST, idx + 13);
  return {
    id: `TAG-${year}-${pad(idx + 1, 5)}`,
    siswa,
    kelas,
    judul,
    jatuhTempo: `${year}-${pad(month, 2)}-${pad(day, 2)}`,
    jumlah,
    dibayar,
    status,
    tahunAjaran,
  };
}

function buildPembayaran(idx: number): PembayaranRow {
  const siswa = SISWA_NAMES[(idx + 2) % SISWA_NAMES.length]!;
  const kelas = KELAS_LIST[(idx + 1) % KELAS_LIST.length]!;
  const judul = pick(JUDUL_TAGIHAN, idx + 7);
  const metode = pick(METODE_POOL, idx + 11);
  const jumlah = (1 + Math.floor(rand(idx + 13) * 25)) * 100000;
  const month = ((idx + 1) % 12) + 1;
  const day = ((idx * 3) % 27) + 1;
  return {
    id: `PAY-2026-${pad(idx + 1, 5)}`,
    tanggal: `2026-${pad(month, 2)}-${pad(day, 2)}`,
    siswa,
    kelas,
    judul,
    metode,
    jumlah,
    ref: `REF-${pad(idx * 37 + 101, 8)}`,
    penerima: pick(PENERIMA_KAS, idx + 17),
    tagihanId: `TAG-2026-${pad(((idx * 7) % 60) + 1, 5)}`,
  };
}

function buildPengeluaran(idx: number): PengeluaranRow {
  const kategori = pick(KATEGORI_POOL, idx + 19);
  const deskripsi = pick(DESKRIPSI_PENGELUARAN, idx + 23);
  const penerima = pick(PENERIMA_PENGELUARAN, idx + 29);
  const metode = pick(METODE_POOL, idx + 31);
  const status = STATUS_PENGELUARAN_POOL[idx % STATUS_PENGELUARAN_POOL.length]!;
  const jumlah = (1 + Math.floor(rand(idx + 37) * 50)) * 100000;
  const month = ((idx + 2) % 12) + 1;
  const day = ((idx * 5) % 27) + 1;
  const row: PengeluaranRow = {
    id: `EXP-2026-${pad(idx + 1, 5)}`,
    tanggal: `2026-${pad(month, 2)}-${pad(day, 2)}`,
    kategori,
    deskripsi,
    jumlah,
    penerima,
    metode,
    status,
  };
  if (status !== "Draft") {
    row.approver = pick(APPROVER_LIST, idx + 41);
  }
  return row;
}

function buildJurnal(idx: number): JurnalRow {
  const jenis = JENIS_JURNAL_POOL[idx % JENIS_JURNAL_POOL.length]!;
  const akun = pick(AKUN_LIST, idx + 43);
  const jumlah = (1 + Math.floor(rand(idx + 47) * 50)) * 100000;
  const isDebit = jenis !== "Pengeluaran";
  const month = ((idx + 3) % 12) + 1;
  const day = ((idx * 7) % 27) + 1;
  return {
    id: `JRN-2026-${pad(idx + 1, 5)}`,
    tanggal: `2026-${pad(month, 2)}-${pad(day, 2)}`,
    ref: `REF-${pad(idx * 53 + 1001, 8)}`,
    jenis,
    akun,
    debit: isDebit ? jumlah : 0,
    kredit: isDebit ? 0 : jumlah,
    keterangan:
      jenis === "Penerimaan" ? "Penerimaan SPP/Tagihan siswa"
      : jenis === "Pengeluaran" ? "Pembayaran beban operasional"
      : "Penyesuaian akhir periode",
  };
}

function buildKas(idx: number): KasRow {
  const month = ((idx % 12)) + 1;
  const day = (idx % 27) + 1;
  const masuk = (1 + Math.floor(rand(idx + 59) * 60)) * 100000;
  const keluar = (1 + Math.floor(rand(idx + 61) * 40)) * 100000;
  const saldoAwal = 50000000 + Math.floor(rand(idx + 67) * 30) * 1000000;
  return {
    tanggal: `2026-${pad(month, 2)}-${pad(day, 2)}`,
    saldoAwal,
    masuk,
    keluar,
    saldoAkhir: saldoAwal + masuk - keluar,
  };
}

function buildRingkasan(idx: number): RingkasanBulan {
  const pemasukan = (50 + Math.floor(rand(idx + 71) * 80)) * 1000000;
  const pengeluaran = (30 + Math.floor(rand(idx + 73) * 60)) * 1000000;
  return {
    bulan: BULAN_NAMA[idx]!,
    pemasukan,
    pengeluaran,
    saldo: pemasukan - pengeluaran,
  };
}

// --- Exports ----------------------------------------------------------------

export const TAGIHAN_LIST: TagihanRow[] = Array.from({ length: 60 }, (_, i) => buildTagihan(i));
export const PEMBAYARAN_LIST: PembayaranRow[] = Array.from({ length: 50 }, (_, i) => buildPembayaran(i));
export const PENGELUARAN_LIST: PengeluaranRow[] = Array.from({ length: 40 }, (_, i) => buildPengeluaran(i));
export const JURNAL_LIST: JurnalRow[] = Array.from({ length: 80 }, (_, i) => buildJurnal(i));
export const KAS_LIST: KasRow[] = Array.from({ length: 30 }, (_, i) => buildKas(i));
export const RINGKASAN_BULAN: RingkasanBulan[] = Array.from({ length: 12 }, (_, i) => buildRingkasan(i));

export const FILTER_OPTIONS = {
  statusTagihan: ["Semua", "Draft", "Terkirim", "Tertunda", "Lunas", "Jatuh Tempo", "Cicilan", "Dibatalkan"] as const,
  kategoriPengeluaran: ["Semua", "Operasional", "Gaji", "Sarana Prasarana", "Kegiatan", "ATK", "Utilitas", "Lainnya"] as const,
  metode: ["Semua", "Tunai", "Transfer", "QRIS", "Virtual Account", "EDC"] as const,
  jenisJurnal: ["Semua", "Penerimaan", "Pengeluaran", "Penyesuaian"] as const,
  tahunAjaran: ["Semua", "2024/2025", "2025/2026"] as const,
  kelas: ["Semua", ...KELAS_LIST] as const,
  statusPengeluaran: ["Semua", "Draft", "Approval", "Disetujui", "Ditolak", "Dibayar"] as const,
};
