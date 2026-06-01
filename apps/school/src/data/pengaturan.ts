/**
 * Pengaturan (settings) domain types + mock fixtures.
 *
 * Single source of truth for every configuration entity rendered by the
 * Pengaturan redesign. Pure data only (no React, no JSX) so it is fully
 * unit-testable and importable from both routes and pure-logic modules.
 *
 * The interfaces and INITIAL_* fixtures here were moved verbatim from the old
 * god-file route (sch.$sekolah.pengaturan.index.tsx) — same field names, same
 * mock values — so the redesign is a pure refactor of the data layer.
 */

/** School identity / profile. */
export interface Identitas {
  nama: string;
  npsn: string;
  nss: string;
  jenjang: string;
  status: string;
  akreditasi: string;
  akreditasiBerlaku: string;
  kepsek: string;
  tahunBerdiri: string;
  naungan: string;
}

/** Postal address and primary contact channels. */
export interface Alamat {
  jalan: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  provinsi: string;
  kodePos: string;
  telepon: string;
  email: string;
  website: string;
}

/** Tenant subdomain / custom domain configuration. */
export interface Domain {
  subdomain: string;
  domainCustom: string;
  tenantId: string;
  wilayah: string;
}

/** Active academic year window. */
export interface TahunAjaran {
  tahun: string;
  semester: string;
  mulai: string;
  selesai: string;
  hariAktif: number;
  hariLibur: number;
}

/** Grading scale thresholds + report-card system. */
export interface Skala {
  aMin: number;
  bMin: number;
  cMin: number;
  kkmPengetahuan: number;
  kkmKeterampilan: number;
  sistemRapor: string;
}

/** Daily operating hours. */
export interface JamOperasional {
  durasiJP: number;
  mulai: string;
  selesai: string;
  jumat: string;
  sabtu: string;
  istirahat: string;
}

/** A user role with its user count and permission count. */
export interface Peran {
  nama: string;
  jumlahUser: number;
  permission: number;
  deskripsi: string;
  builtIn: boolean;
}

/** A third-party integration and its connection status. */
export interface Integrasi {
  nama: string;
  deskripsi: string;
  status: "Terhubung" | "Belum" | "Error";
  terakhirSinkron?: string | undefined;
  versi?: string | undefined;
}

/** Per-category notification channel preferences. */
export interface NotifikasiPref {
  kategori: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
}

/** Security policy bundle (password, auth, audit/retention). */
export interface Keamanan {
  panjangMin: number;
  kompleksitas: string;
  masaBerlaku: number;
  riwayatPassword: number;
  loginGagalMaks: number;
  lockoutMenit: number;
  dua2faWajib: string;
  metode2fa: string;
  sessionTimeout: number;
  sso: string;
  rememberMe: number;
  concurrentSessions: number;
  auditRetensi: number;
  backupOtomatis: string;
  backupRetensi: number;
  dataLulus: string;
}

/** Subscription / billing plan. */
export interface Billing {
  paket: string;
  siklus: string;
  harga: string;
  maksSiswa: number;
  maksPegawai: number;
  penyimpanan: string;
  mulai: string;
  berakhir: string;
  autoRenew: boolean;
  metodePembayaran: string;
  npwp: string;
  emailTagihan: string;
}

/** Visual brand palette. */
export interface Branding {
  brand: string;
  accent: string;
  success: string;
  danger: string;
}

/** A single configuration-change audit entry. */
export interface LogEntry {
  aktor: string;
  aksi: string;
  waktu: string;
  tone: "neutral" | "brand" | "success" | "warning";
}

/** Stable identifier for each Pengaturan tab (adds "ringkasan" overview). */
export type PengaturanTabKey =
  | "ringkasan"
  | "sekolah"
  | "akademik"
  | "peran"
  | "integrasi"
  | "notifikasi"
  | "keamanan"
  | "billing"
  | "branding"
  | "log";

/** Live usage counters compared against billing plan limits. */
export interface CurrentUsage {
  siswaAktif: number;
  pegawaiAktif: number;
  storageGB: number;
}

export const INITIAL_IDENTITAS: Identitas = {
  nama: "SMA Negeri 1 Bandung",
  npsn: "20219142",
  nss: "301026005001",
  jenjang: "SMA",
  status: "Negeri",
  akreditasi: "A",
  akreditasiBerlaku: "Berlaku 2024-2029",
  kepsek: "Drs. Bambang Sutrisno, M.Pd.",
  tahunBerdiri: "1962",
  naungan: "Kemendikbud",
};

export const INITIAL_ALAMAT: Alamat = {
  jalan: "Jl. Ir. H. Juanda No. 93",
  kelurahan: "Lebakgede",
  kecamatan: "Coblong",
  kota: "Kota Bandung",
  provinsi: "Jawa Barat",
  kodePos: "40132",
  telepon: "(022) 2503097",
  email: "info@sman1-bdg.sch.id",
  website: "sman1-bdg.sch.id",
};

export const INITIAL_DOMAIN: Domain = {
  subdomain: "sman1bdg.sekolahpro.id",
  domainCustom: "portal.sman1-bdg.sch.id",
  tenantId: "TNT-000142",
  wilayah: "ID-JKT-1",
};

export const INITIAL_TAHUN: TahunAjaran = {
  tahun: "2025/2026",
  semester: "Genap",
  mulai: "2026-01-08",
  selesai: "2026-06-30",
  hariAktif: 120,
  hariLibur: 22,
};

export const INITIAL_SKALA: Skala = {
  aMin: 90,
  bMin: 80,
  cMin: 70,
  kkmPengetahuan: 70,
  kkmKeterampilan: 70,
  sistemRapor: "Kurikulum Merdeka",
};

export const INITIAL_JAM: JamOperasional = {
  durasiJP: 45,
  mulai: "07:00",
  selesai: "14:30",
  jumat: "07:00 - 11:30",
  sabtu: "07:00 - 12:00",
  istirahat: "2 sesi (15 menit)",
};

export const INITIAL_PERAN: Peran[] = [
  { nama: "Sekolah Admin", jumlahUser: 2, permission: 64, deskripsi: "Akses penuh ke semua modul sekolah", builtIn: true },
  { nama: "Kepala Sekolah", jumlahUser: 1, permission: 48, deskripsi: "Approval rapor, audit log, dashboard", builtIn: true },
  { nama: "Wali Kelas", jumlahUser: 24, permission: 22, deskripsi: "Kelas scope: nilai, absensi, wali", builtIn: true },
  { nama: "Guru", jumlahUser: 48, permission: 18, deskripsi: "Mapel scope: input nilai, jadwal, materi", builtIn: true },
  { nama: "Bendahara", jumlahUser: 2, permission: 30, deskripsi: "Tagihan, pembayaran, kas, approval", builtIn: true },
  { nama: "Petugas Koperasi", jumlahUser: 1, permission: 24, deskripsi: "Simpanan, pinjaman, transaksi toko", builtIn: true },
  { nama: "Pustakawan", jumlahUser: 1, permission: 20, deskripsi: "Koleksi buku, peminjaman, denda", builtIn: true },
  { nama: "Auditor", jumlahUser: 1, permission: 12, deskripsi: "Read-only ke audit log dan laporan", builtIn: true },
  { nama: "Tata Usaha", jumlahUser: 3, permission: 36, deskripsi: "Data siswa, guru, staff, dokumen", builtIn: true },
];

export const INITIAL_INTEGRASI: Integrasi[] = [
  { nama: "Dapodik", deskripsi: "Sinkronisasi data siswa dan guru ke Dapodik Kemdikbud", status: "Terhubung", terakhirSinkron: "2026-05-24 06:00", versi: "v2024.b" },
  { nama: "EMIS Kemenag", deskripsi: "Sinkronisasi madrasah ke EMIS", status: "Belum" },
  { nama: "Midtrans", deskripsi: "Payment gateway untuk SPP dan PPDB", status: "Terhubung", terakhirSinkron: "2026-05-24 11:32", versi: "v2.45" },
  { nama: "Xendit", deskripsi: "Payment gateway alternatif", status: "Belum" },
  { nama: "WhatsApp Business", deskripsi: "Kirim pesan dan pengumuman via WA", status: "Terhubung", terakhirSinkron: "2026-05-24 12:10", versi: "Cloud API" },
  { nama: "Google Workspace", deskripsi: "SSO + Google Classroom integration", status: "Terhubung", terakhirSinkron: "2026-05-23 22:00" },
  { nama: "SIMPATIKA", deskripsi: "Data guru Kemenag", status: "Error", terakhirSinkron: "2026-05-22 06:00" },
  { nama: "Frappe ERPNext", deskripsi: "Backend doctype sync", status: "Terhubung", terakhirSinkron: "2026-05-24 12:30", versi: "v15.42" },
];

export const INITIAL_NOTIFIKASI: NotifikasiPref[] = [
  { kategori: "Tagihan jatuh tempo", email: true, push: true, sms: false, inApp: true },
  { kategori: "Absensi siswa", email: false, push: true, sms: false, inApp: true },
  { kategori: "Nilai rapor tersedia", email: true, push: true, sms: false, inApp: true },
  { kategori: "Pengumuman sekolah", email: true, push: true, sms: true, inApp: true },
  { kategori: "Pengajuan cuti pegawai", email: true, push: false, sms: false, inApp: true },
  { kategori: "Stok perpustakaan rendah", email: false, push: false, sms: false, inApp: true },
  { kategori: "Audit log critical", email: true, push: true, sms: true, inApp: true },
];

export const INITIAL_KEAMANAN: Keamanan = {
  panjangMin: 10,
  kompleksitas: "Huruf besar + angka + simbol",
  masaBerlaku: 180,
  riwayatPassword: 5,
  loginGagalMaks: 5,
  lockoutMenit: 30,
  dua2faWajib: "Aktif untuk Admin",
  metode2fa: "TOTP, SMS, Email",
  sessionTimeout: 60,
  sso: "Google Workspace",
  rememberMe: 14,
  concurrentSessions: 3,
  auditRetensi: 365,
  backupOtomatis: "Harian, 02:00 WIB",
  backupRetensi: 90,
  dataLulus: "Disimpan 5 tahun",
};

export const INITIAL_BILLING: Billing = {
  paket: "SekolahPro Plus",
  siklus: "Tahunan",
  harga: "Rp 18.000.000 / tahun",
  maksSiswa: 2500,
  maksPegawai: 200,
  penyimpanan: "100 GB",
  mulai: "2025-07-01",
  berakhir: "2026-06-30",
  autoRenew: true,
  metodePembayaran: "Virtual Account BCA",
  npwp: "01.234.567.8-901.000",
  emailTagihan: "finance@sman1-bdg.sch.id",
};

export const INITIAL_BRANDING: Branding = {
  brand: "#2563eb",
  accent: "#7c3aed",
  success: "#10b981",
  danger: "#ef4444",
};

export const INITIAL_LOG: LogEntry[] = [
  { aktor: "Tata Usaha", aksi: "Mengubah jam operasional", waktu: "2026-05-23 14:20", tone: "neutral" },
  { aktor: "Sekolah Admin", aksi: "Menambah peran custom: Pembina OSIS", waktu: "2026-05-22 09:15", tone: "brand" },
  { aktor: "Sekolah Admin", aksi: "Menghubungkan integrasi WhatsApp Business", waktu: "2026-05-21 16:42", tone: "success" },
  { aktor: "Auditor", aksi: "Mengubah retensi audit log dari 180 ke 365 hari", waktu: "2026-05-20 11:08", tone: "warning" },
  { aktor: "Sistem", aksi: "Backup harian selesai", waktu: "2026-05-24 02:00", tone: "success" },
];

/** Badge tone for each integration connection status. */
export const STATUS_INTEGRASI_TONE = {
  Terhubung: "success",
  Belum: "neutral",
  Error: "danger",
} as const;

/** Live usage snapshot used by the billing usage gauges. */
export const INITIAL_USAGE: CurrentUsage = { siswaAktif: 1842, pegawaiAktif: 72, storageGB: 42.3 };

/** Aggregate of every Pengaturan configuration entity in one object. */
export interface PengaturanState {
  identitas: Identitas;
  alamat: Alamat;
  domain: Domain;
  tahun: TahunAjaran;
  skala: Skala;
  jam: JamOperasional;
  peran: Peran[];
  integrasi: Integrasi[];
  notifikasi: NotifikasiPref[];
  keamanan: Keamanan;
  billing: Billing;
  branding: Branding;
  log: LogEntry[];
  usage: CurrentUsage;
}

/**
 * Build the default Pengaturan state from every INITIAL_* fixture.
 *
 * @returns a fresh PengaturanState seeded with the mock fixtures.
 */
export function defaultPengaturanState(): PengaturanState {
  return {
    identitas: INITIAL_IDENTITAS,
    alamat: INITIAL_ALAMAT,
    domain: INITIAL_DOMAIN,
    tahun: INITIAL_TAHUN,
    skala: INITIAL_SKALA,
    jam: INITIAL_JAM,
    peran: INITIAL_PERAN,
    integrasi: INITIAL_INTEGRASI,
    notifikasi: INITIAL_NOTIFIKASI,
    keamanan: INITIAL_KEAMANAN,
    billing: INITIAL_BILLING,
    branding: INITIAL_BRANDING,
    log: INITIAL_LOG,
    usage: INITIAL_USAGE,
  };
}
