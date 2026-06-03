/**
 * Per-page onboarding content for the Master Data module, written from the
 * school admin / curriculum-staff point of view. Centralized so the copy is
 * consistent and editable in one place; each route renders it via the shared
 * <PageGuide> component.
 *
 * Steps are role-tagged with the coarse school-wide role keys to FRAME who each
 * step speaks to — they are a presentation hint only and never hide anything.
 */
import type { PageGuideStep } from "../guide";
import type { SchoolGuideRole } from "../../lib/schoolGuideRole";

/** Guide step constrained to the school role union so role typos fail to compile. */
export type MasterGuideStep = Omit<PageGuideStep, "roles"> & { roles?: SchoolGuideRole[] };

/** Identifier for each guided Master Data page. */
export type MasterGuideId =
  | "dashboard"
  | "kkm"
  | "komponen-nilai"
  | "konfigurasi"
  | "kurikulum"
  | "mapel"
  | "pengguna"
  | "tahun-ajaran"
  | "unit-jenjang";

/** Full guide content for a single page. */
export interface MasterGuideContent {
  title: string;
  intro: string;
  steps: MasterGuideStep[];
  tips: string[];
}

export const MASTER_PAGE_GUIDES: Record<MasterGuideId, MasterGuideContent> = {
  dashboard: {
    title: "Cara pakai Dashboard Master Data",
    intro: "Ringkasan kesehatan data inti tenant: pengguna, periode akademik, dan modul aktif.",
    steps: [
      { title: "Baca kartu ringkasan", detail: "Pantau pengguna aktif, tahun ajaran aktif, dan akun bermasalah sekejap.", roles: ["admin", "kepala_sekolah"] },
      { title: "Tindak Perlu Perhatian", detail: "Pengguna tanpa peran atau TA belum aktif muncul di sini untuk diperbaiki.", roles: ["admin", "tata_usaha"] },
      { title: "Pakai Aksi Cepat", detail: "Pintasan ke Tahun Ajaran, Pengguna, Kurikulum, dan pengaturan penilaian.", roles: ["admin"] },
    ],
    tips: [
      "Klik kartu kritis untuk lompat langsung ke halaman penyelesaiannya.",
      "Angka dihitung dari data live, bukan cache.",
    ],
  },
  kkm: {
    title: "Cara pakai KKM",
    intro: "Tetapkan Kriteria Ketuntasan Minimal per mata pelajaran, tingkat, dan tahun ajaran.",
    steps: [
      { title: "Set KKM baru", detail: "Tombol Set KKM → pilih mapel, tingkat, lalu isi nilai sesuai tipe.", roles: ["kurikulum"] },
      { title: "Pilih tipe KKM", detail: "Angka, Interval (batas bawah–atas), atau Deskriptif sesuai kebutuhan.", roles: ["kurikulum", "guru"] },
      { title: "Filter & tinjau", detail: "Saring per tingkat atau tipe untuk mengecek kelengkapan KKM.", roles: ["kurikulum"] },
    ],
    tips: [
      "Nilai KKM tipe Angka harus 0–100.",
      "Batas atas Interval harus lebih besar dari batas bawah.",
    ],
  },
  "komponen-nilai": {
    title: "Cara pakai Komponen Nilai",
    intro: "Definisikan komponen penilaian (UH, UTS, UAS, Tugas) beserta bobotnya per kurikulum.",
    steps: [
      { title: "Tambah komponen", detail: "Isi nama komponen, kurikulum, dan bobot dalam persen.", roles: ["kurikulum"] },
      { title: "Atur cakupan mapel", detail: "Kosongkan mata pelajaran untuk komponen umum semua mapel kurikulum.", roles: ["kurikulum"] },
      { title: "Cek Validasi Bobot", detail: "Panel ringkasan menandai grup yang totalnya belum 100%.", roles: ["kurikulum", "guru"] },
    ],
    tips: [
      "Total bobot per (kurikulum, mapel) idealnya tepat 100%.",
      "Bobot harus lebih dari 0 dan maksimal 100.",
    ],
  },
  konfigurasi: {
    title: "Cara pakai Konfigurasi Penilaian",
    intro: "Atur tipe penilaian (Angka/Huruf/Deskriptif) dan rentang nilai per kurikulum, mapel, atau tingkat.",
    steps: [
      { title: "Tambah konfigurasi", detail: "Pilih kurikulum, lalu tetapkan tipe penilaian yang berlaku.", roles: ["kurikulum"] },
      { title: "Persempit cakupan", detail: "Isi mapel atau tingkat bila konfigurasi hanya untuk sebagian.", roles: ["kurikulum"] },
      { title: "Set rentang Angka", detail: "Untuk tipe Angka, isi nilai minimum dan maksimum.", roles: ["kurikulum"] },
    ],
    tips: [
      "Kosongkan mapel & tingkat untuk konfigurasi default seluruh kurikulum.",
      "Nilai maksimum harus lebih besar dari nilai minimum.",
    ],
  },
  kurikulum: {
    title: "Cara pakai Kurikulum",
    intro: "Kelola versi kurikulum (K13/Merdeka) per unit jenjang dan tahun ajaran.",
    steps: [
      { title: "Tambah kurikulum", detail: "Isi nama, tipe, unit jenjang, dan tahun berlaku.", roles: ["kurikulum", "admin"] },
      { title: "Aktifkan versi", detail: "Centang Aktifkan agar kurikulum dipakai oleh penilaian.", roles: ["kurikulum"] },
      { title: "Buka detail", detail: "Klik baris untuk melihat struktur mapel dan turunannya.", roles: ["kurikulum"] },
    ],
    tips: [
      "Kurikulum jadi anchor Komponen Nilai & Konfigurasi Penilaian.",
      "Filter Tipe membantu memisahkan K13 dan Merdeka.",
    ],
  },
  mapel: {
    title: "Cara pakai Mata Pelajaran",
    intro: "Daftar mata pelajaran beserta kode, kelompok, dan kurikulum penaung.",
    steps: [
      { title: "Tambah mapel", detail: "Isi nama, kode unik, kurikulum, dan kelompok mapel.", roles: ["kurikulum", "admin"] },
      { title: "Tandai wajib", detail: "Centang bila mapel wajib diikuti seluruh peserta didik.", roles: ["kurikulum"] },
      { title: "Filter kelompok", detail: "Saring per Umum/Pilihan/Mulok/P5/Kejuruan untuk fokus.", roles: ["kurikulum"] },
    ],
    tips: [
      "Kode mapel sebaiknya singkat dan unik (mis. MAT-01).",
      "Klik baris untuk membuka detail mapel.",
    ],
  },
  pengguna: {
    title: "Cara pakai Pengguna Sekolah",
    intro: "Undang dan kelola akun pengguna sekolah beserta peran dan statusnya.",
    steps: [
      { title: "Undang pengguna", detail: "Tombol Undang Pengguna → isi user dan peran sekolah.", roles: ["admin", "tata_usaha"] },
      { title: "Tetapkan peran", detail: "Pastikan setiap pengguna punya peran agar akses fitur terbuka.", roles: ["admin"] },
      { title: "Cari & buka detail", detail: "Cari per ID/user, klik baris untuk mengubah peran atau status.", roles: ["admin", "tata_usaha"] },
    ],
    tips: [
      "Pengguna tanpa peran tidak bisa mengakses fitur — segera tetapkan.",
      "Status Nonaktif memblokir login tanpa menghapus akun.",
    ],
  },
  "tahun-ajaran": {
    title: "Cara pakai Tahun Ajaran",
    intro: "Kelola periode akademik; semester Ganjil & Genap diatur di dalam tiap tahun ajaran.",
    steps: [
      { title: "Tambah TA", detail: "Tombol Tambah TA → isi nama dan rentang tanggal periode.", roles: ["admin", "tata_usaha"] },
      { title: "Kelola semester", detail: "Buka kartu TA untuk mengatur Semester Ganjil & Genap di dalamnya.", roles: ["admin", "kurikulum"] },
      { title: "Pahami relasi", detail: "Diagram Struktur menunjukkan turunan TA & Kurikulum ke penilaian.", roles: ["kurikulum"] },
    ],
    tips: [
      "Hanya boleh ada satu tahun ajaran berstatus Aktif.",
      "Klik kartu untuk membuka detail dan daftar semesternya.",
    ],
  },
  "unit-jenjang": {
    title: "Cara pakai Unit Jenjang",
    intro: "Atur unit jenjang sekolah (TK/SD/SMP/SMA) yang menaungi kurikulum dan rombel.",
    steps: [
      { title: "Tambah unit", detail: "Tombol Tambah Unit → isi nama unit dan jenjang/tingkatnya.", roles: ["admin"] },
      { title: "Cari & buka detail", detail: "Cari per nama, klik baris untuk mengubah unit atau statusnya.", roles: ["admin", "tata_usaha"] },
      { title: "Pastikan status", detail: "Hanya unit berstatus Aktif yang dipakai oleh data turunannya.", roles: ["admin"] },
    ],
    tips: [
      "Unit jenjang jadi acuan Kurikulum dan pembagian rombel.",
      "Nonaktifkan unit lama tanpa menghapus datanya.",
    ],
  },
};
