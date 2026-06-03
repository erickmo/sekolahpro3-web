/**
 * Per-page onboarding content for the Jadwal (class-schedule) module, written
 * from the academic-staff point of view. Centralized so the copy stays
 * consistent and editable in one place; each route renders it via the shared
 * <PageGuide> component.
 *
 * Steps are role-tagged with coarse SchoolGuideRole keys to FRAME who each step
 * speaks to — they never hide anything from anyone.
 */
import type { PageGuideStep } from "../guide";
import type { SchoolGuideRole } from "../../lib/schoolGuideRole";

/** Guide step constrained to the school role union so role typos fail to compile. */
export type JadwalGuideStep = Omit<PageGuideStep, "roles"> & { roles?: SchoolGuideRole[] };

/** Identifier for each guided Jadwal page. */
export type JadwalGuideId =
  | "dashboard"
  | "daftar"
  | "override"
  | "slot-override"
  | "slot";

/** Full guide content for a single page. */
export interface JadwalGuideContent {
  title: string;
  intro: string;
  steps: JadwalGuideStep[];
  tips: string[];
}

export const JADWAL_PAGE_GUIDES: Record<JadwalGuideId, JadwalGuideContent> = {
  dashboard: {
    title: "Cara pakai Dashboard Jadwal",
    intro: "Ringkasan jadwal pelajaran hari ini: slot aktif, konflik, override, dan kelas yang belum terjadwal.",
    steps: [
      { title: "Baca kartu ringkasan", detail: "Lihat jadwal aktif hari ini, konflik slot, dan override yang sedang berlaku.", roles: ["kurikulum", "kepala_sekolah"] },
      { title: "Tindak lanjut Perlu Perhatian", detail: "Konflik, override, dan guru izin yang berdampak ke kelas muncul di sini untuk ditindak.", roles: ["kurikulum"] },
      { title: "Pakai Aksi Cepat", detail: "Lompat ke Slot, Susun Jadwal, atau Override lewat pintasan di kartu Aksi Cepat.", roles: ["kurikulum", "operator"] },
    ],
    tips: [
      "Klik kartu statistik untuk lompat ke halaman terkait.",
      "Alur Penyusunan Jadwal memandu urutan: Slot → Susun → Override.",
    ],
  },
  daftar: {
    title: "Cara pakai Jadwal Pelajaran",
    intro: "Daftar header jadwal pelajaran per rombel; cari, lalu buka untuk mengelola slot per jam.",
    steps: [
      { title: "Tambah jadwal", detail: "Tombol Tambah Jadwal → pilih rombel, tahun ajaran, semester, dan kurikulum.", roles: ["kurikulum", "operator"] },
      { title: "Cari & saring", detail: "Gunakan kotak pencarian (ID atau rombel) untuk menemukan jadwal tertentu.", roles: ["kurikulum", "guru"] },
      { title: "Cek status aktif", detail: "Kolom Status menandai jadwal yang sedang berlaku versus nonaktif.", roles: ["kurikulum"] },
    ],
    tips: [
      "Header jadwal hanya menyimpan rombel/semester; slot per jam diisi lewat halaman detail.",
      "Satu rombel sebaiknya punya satu jadwal aktif per semester.",
    ],
  },
  override: {
    title: "Cara pakai Jadwal Override",
    intro: "Catat penyesuaian jadwal pada tanggal tertentu: libur, pengganti, atau jam tambahan.",
    steps: [
      { title: "Tambah override", detail: "Tombol Tambah Override → pilih rombel, tanggal, tipe (Libur/Pengganti/Tambahan), dan alasan.", roles: ["kurikulum", "operator"] },
      { title: "Pilih tipe yang tepat", detail: "Libur meniadakan jadwal, Pengganti menggeser, Tambahan menyisipkan jam ekstra.", roles: ["kurikulum"] },
      { title: "Pantau tanggal terbaru", detail: "Daftar tersortir per tanggal sehingga override terdekat mudah ditemukan.", roles: ["kurikulum", "guru"] },
    ],
    tips: [
      "Slot per override yang baru diatur diisi di halaman Slot Override.",
      "Isi alasan agar guru dan wali kelas paham konteks perubahan.",
    ],
  },
  "slot-override": {
    title: "Cara pakai Slot Override",
    intro: "Baris slot per jam yang menempel pada satu header Jadwal Override (mapel, guru, jam pengganti).",
    steps: [
      { title: "Pilih header override", detail: "Tombol Tambah Slot Override → tautkan ke Jadwal Override induk yang sudah dibuat.", roles: ["kurikulum", "operator"] },
      { title: "Isi jam & pengajar", detail: "Masukkan jam mulai–selesai, mata pelajaran, guru, dan ruangan bila perlu.", roles: ["kurikulum"] },
      { title: "Periksa daftar", detail: "Kolom Override dan Slot menampilkan keterkaitan tiap baris dengan headernya.", roles: ["kurikulum", "guru"] },
    ],
    tips: [
      "Buat header di Jadwal Override dulu sebelum menambah slot di sini.",
      "Format jam memakai HH:MM agar konsisten dengan slot reguler.",
    ],
  },
  slot: {
    title: "Cara pakai Slot Jadwal",
    intro: "Definisi slot waktu dasar (jam pelajaran, istirahat, upacara) yang dipakai menyusun jadwal.",
    steps: [
      { title: "Tambah slot", detail: "Tombol Tambah Slot → pilih hari, tipe, jam mulai–selesai, dan durasi (menit).", roles: ["kurikulum", "operator"] },
      { title: "Pilih tipe slot", detail: "Tipe Pelajaran, Istirahat, Upacara, atau Sholat membedakan blok waktu.", roles: ["kurikulum"] },
      { title: "Buka detail slot", detail: "Klik baris untuk melihat dan mengubah definisi slot terpilih.", roles: ["kurikulum", "guru"] },
    ],
    tips: [
      "Atur slot lebih dulu — ia menjadi fondasi seluruh penyusunan jadwal.",
      "Jam memakai format HH:MM:SS; durasi membantu deteksi tumpang tindih.",
    ],
  },
};
