/**
 * Per-page onboarding content for the Kelas & Rombel module, written from the
 * academic-staff point of view (kurikulum, wali kelas, tata usaha). Centralized
 * so the copy stays consistent and editable in one place; each route renders it
 * via the shared <PageGuide> component.
 *
 * Steps are role-tagged to FRAME who each step speaks to — they never hide
 * anything from anyone. Role keys come from SCHOOL_ROLE_LABEL.
 */
import type { PageGuideStep } from "../guide";
import type { SchoolGuideRole } from "../../lib/schoolGuideRole";

/** Guide step constrained to the school role union so role typos fail to compile. */
export type KelasGuideStep = Omit<PageGuideStep, "roles"> & { roles?: SchoolGuideRole[] };

/** Identifier for each guided Kelas page. */
export type KelasGuideId = "dashboard" | "anggota" | "daftar" | "rombel";

/** Full guide content for a single page. */
export interface KelasGuideContent {
  title: string;
  intro: string;
  steps: KelasGuideStep[];
  tips: string[];
}

export const KELAS_PAGE_GUIDES: Record<KelasGuideId, KelasGuideContent> = {
  dashboard: {
    title: "Cara pakai Dashboard Kelas & Rombel",
    intro: "Ringkasan kondisi rombel: kapasitas, wali kelas, dan rombel yang perlu perhatian.",
    steps: [
      {
        title: "Baca kartu ringkasan",
        detail: "Lihat jumlah rombel tanpa wali, over kapasitas, penuh, dan tanpa jadwal sekejap.",
        roles: ["kurikulum", "kepala_sekolah"],
      },
      {
        title: "Ikuti Alur Setup Kelas",
        detail: "Langkah berurutan: buat rombel, tunjuk wali, isi anggota, lalu susun jadwal.",
        roles: ["kurikulum"],
      },
      {
        title: "Tindak Perlu Perhatian",
        detail: "Rombel penuh atau belum punya wali kelas muncul di sini untuk segera ditangani.",
        roles: ["kurikulum", "tata_usaha"],
      },
      {
        title: "Pakai Aksi Cepat",
        detail: "Lompat langsung ke Daftar Kelas, Rombongan Belajar, atau Anggota Rombel.",
        roles: ["operator"],
      },
    ],
    tips: [
      "Klik kartu untuk lompat ke daftar terkait.",
      "Angka dihitung dari data live, bukan cache.",
    ],
  },
  anggota: {
    title: "Cara pakai Anggota Rombel",
    intro: "Kelola daftar siswa per rombel: tambah anggota, atur nomor urut, dan pantau status.",
    steps: [
      {
        title: "Tambah anggota",
        detail: "Tombol Tambah Anggota → pilih rombel dan siswa yang masuk.",
        roles: ["tata_usaha", "wali_kelas"],
      },
      {
        title: "Cari & filter",
        detail: "Cari berdasarkan ID, nama siswa, atau rombel untuk menyaring baris.",
        roles: ["operator"],
      },
      {
        title: "Periksa status keanggotaan",
        detail: "Kolom Status menandai siswa Aktif atau yang sudah Keluar dari rombel.",
        roles: ["wali_kelas", "kesiswaan"],
      },
    ],
    tips: [
      "No. Urut menentukan urutan absen di rombel.",
      "Tanggal Masuk dicatat saat siswa bergabung ke rombel.",
    ],
  },
  daftar: {
    title: "Cara pakai Daftar Kelas",
    intro: "Atur rombongan belajar: kapasitas, wali kelas, dan tingkat dalam satu daftar.",
    steps: [
      {
        title: "Tambah kelas",
        detail: "Tombol Tambah Kelas → isi nama rombel, tingkat, wali, dan kapasitas.",
        roles: ["kurikulum", "tata_usaha"],
      },
      {
        title: "Cari & urutkan",
        detail: "Cari berdasarkan ID, nama rombel, atau wali kelas; klik judul kolom untuk urutkan.",
        roles: ["operator"],
      },
      {
        title: "Pantau kapasitas",
        detail: "Kolom Siswa menampilkan jumlah terisi dibanding kapasitas tiap rombel.",
        roles: ["kurikulum", "wali_kelas"],
      },
    ],
    tips: [
      "Rombel tanpa wali kelas perlu segera ditugaskan.",
      "Status Ditutup menandai rombel yang tidak lagi aktif.",
    ],
  },
  rombel: {
    title: "Cara pakai Rombongan Belajar",
    intro: "Bentuk struktur rombel per tahun ajaran: nama, tingkat, dan wali kelasnya.",
    steps: [
      {
        title: "Buat rombel",
        detail: "Tombol Buat Rombel → tetapkan nama, tingkat, tahun ajaran, dan wali kelas.",
        roles: ["kurikulum"],
      },
      {
        title: "Cari rombel",
        detail: "Cari berdasarkan ID atau nama rombel untuk menemukan struktur yang dicari.",
        roles: ["operator"],
      },
      {
        title: "Periksa tahun ajaran",
        detail: "Kolom TA memastikan rombel terikat ke tahun ajaran yang benar.",
        roles: ["kurikulum", "kepala_sekolah"],
      },
    ],
    tips: [
      "Buat rombel dulu sebelum mengisi anggota dan menyusun jadwal.",
      "Satu wali kelas idealnya memegang satu rombel aktif.",
    ],
  },
};
