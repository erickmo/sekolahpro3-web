// Mock data fixture untuk modul Master Data.
// Replace dengan @sekolahpro/api-client hooks ketika backend siap.

export type StatusAktif = "Aktif" | "Nonaktif";

export interface PenggunaRow {
  name: string;
  nama: string;
  user: string;
  peran: string | null;
  sekolah: string;
  status: StatusAktif;
}

export interface TahunAjaranRow {
  name: string;
  tahun: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: StatusAktif;
}

export interface ModulRow {
  name: string;
  nama_modul: string;
  enabled: 0 | 1;
  deskripsi: string;
}

export interface FeatureFlagRow {
  name: string;
  flag_name: string;
  enabled: 0 | 1;
  deskripsi: string;
}

export interface AktivitasMasterRow {
  id: string;
  entitas: "Pengguna" | "Tahun Ajaran" | "Modul" | "Feature Flag" | "Organisasi" | "Unit Jenjang";
  judul: string;
  aksi: "Dibuat" | "Diubah" | "Diaktifkan" | "Dinonaktifkan";
  waktu: string;
  oleh: string;
}

export const MASTER_PENGGUNA: PenggunaRow[] = [
  { name: "USR-001", nama: "Ahmad Fauzi", user: "ahmad@sekolah.id", peran: "Admin Sekolah", sekolah: "SMP Mulia", status: "Aktif" },
  { name: "USR-002", nama: "Siti Rahma", user: "siti@sekolah.id", peran: "Kepala Sekolah", sekolah: "SMP Mulia", status: "Aktif" },
  { name: "USR-003", nama: "Budi Santoso", user: "budi@sekolah.id", peran: "Guru", sekolah: "SMP Mulia", status: "Aktif" },
  { name: "USR-004", nama: "Dewi Lestari", user: "dewi@sekolah.id", peran: null, sekolah: "SMP Mulia", status: "Aktif" },
  { name: "USR-005", nama: "Rudi Hartono", user: "rudi@sekolah.id", peran: "Tata Usaha", sekolah: "SMP Mulia", status: "Aktif" },
  { name: "USR-006", nama: "Maya Putri", user: "maya@sekolah.id", peran: null, sekolah: "SMP Mulia", status: "Aktif" },
  { name: "USR-007", nama: "Joko Susanto", user: "joko@sekolah.id", peran: "Bendahara", sekolah: "SMP Mulia", status: "Nonaktif" },
  { name: "USR-008", nama: "Linda Sari", user: "linda@sekolah.id", peran: "Guru", sekolah: "SMP Mulia", status: "Aktif" },
];

export const MASTER_TAHUN_AJARAN: TahunAjaranRow[] = [
  { name: "TA-2026", tahun: "2026/2027", tanggal_mulai: "2026-07-15", tanggal_selesai: "2027-06-30", status: "Nonaktif" },
  { name: "TA-2025", tahun: "2025/2026", tanggal_mulai: "2025-07-15", tanggal_selesai: "2026-06-30", status: "Aktif" },
  { name: "TA-2024", tahun: "2024/2025", tanggal_mulai: "2024-07-15", tanggal_selesai: "2025-06-30", status: "Nonaktif" },
];

export const MASTER_MODUL: ModulRow[] = [
  { name: "MOD-AKADEMIK", nama_modul: "Akademik", enabled: 1, deskripsi: "Kurikulum, mapel, raport" },
  { name: "MOD-KEUANGAN", nama_modul: "Keuangan", enabled: 1, deskripsi: "SPP, tagihan, pembayaran" },
  { name: "MOD-KOPERASI", nama_modul: "Koperasi", enabled: 1, deskripsi: "Simpan pinjam anggota" },
  { name: "MOD-PERPUS", nama_modul: "Perpustakaan", enabled: 1, deskripsi: "Manajemen buku & sirkulasi" },
  { name: "MOD-PPDB", nama_modul: "PPDB", enabled: 1, deskripsi: "Penerimaan peserta didik baru" },
  { name: "MOD-ASRAMA", nama_modul: "Asrama", enabled: 0, deskripsi: "Manajemen asrama siswa" },
  { name: "MOD-KANTIN", nama_modul: "Kantin", enabled: 0, deskripsi: "Transaksi kantin & topup" },
];

export const MASTER_FEATURE_FLAG: FeatureFlagRow[] = [
  { name: "FF-001", flag_name: "raport_v2", enabled: 1, deskripsi: "Template raport versi 2" },
  { name: "FF-002", flag_name: "absensi_qr", enabled: 1, deskripsi: "Absensi berbasis QR code" },
  { name: "FF-003", flag_name: "wali_app", enabled: 1, deskripsi: "Aplikasi wali murid" },
  { name: "FF-004", flag_name: "ai_insight", enabled: 0, deskripsi: "Rekomendasi AI di dashboard" },
  { name: "FF-005", flag_name: "auto_tagihan", enabled: 0, deskripsi: "Generate tagihan otomatis" },
];

export const MASTER_AKTIVITAS: AktivitasMasterRow[] = [
  { id: "ACT-001", entitas: "Pengguna", judul: "Linda Sari ditambahkan sebagai Guru", aksi: "Dibuat", waktu: "2026-05-24 14:30", oleh: "Ahmad Fauzi" },
  { id: "ACT-002", entitas: "Feature Flag", judul: "wali_app diaktifkan", aksi: "Diaktifkan", waktu: "2026-05-23 09:12", oleh: "Siti Rahma" },
  { id: "ACT-003", entitas: "Modul", judul: "Modul Asrama dinonaktifkan", aksi: "Dinonaktifkan", waktu: "2026-05-22 16:05", oleh: "Ahmad Fauzi" },
  { id: "ACT-004", entitas: "Tahun Ajaran", judul: "TA 2026/2027 disiapkan", aksi: "Dibuat", waktu: "2026-05-20 10:00", oleh: "Siti Rahma" },
  { id: "ACT-005", entitas: "Pengguna", judul: "Peran Joko Susanto diubah", aksi: "Diubah", waktu: "2026-05-19 11:42", oleh: "Ahmad Fauzi" },
  { id: "ACT-006", entitas: "Organisasi", judul: "Yayasan Mulia diperbarui", aksi: "Diubah", waktu: "2026-05-18 08:20", oleh: "Siti Rahma" },
];
