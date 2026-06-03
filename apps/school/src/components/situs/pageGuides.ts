/**
 * Per-page onboarding content for the Situs Sekolah module, written from the
 * point of view of the staff who run the school's public website (humas yang
 * mengisi konten, operator/admin yang menata tampilan dan domain).
 * Centralized so the copy is consistent and editable in one place; each page
 * renders it via the shared <PageGuide> component.
 *
 * Steps are role-tagged with coarse SchoolGuideRole keys to FRAME who each
 * step speaks to — they never hide anything from anyone.
 */
import type { PageGuideStep } from "../guide";
import type { SchoolGuideRole } from "../../lib/schoolGuideRole";

/** Guide step constrained to the school role union so role typos fail to compile. */
export type SitusGuideStep = Omit<PageGuideStep, "roles"> & {
  roles?: SchoolGuideRole[];
};

/** Identifier for each guided Situs Sekolah page. */
export type SitusGuideId =
  | "dashboard"
  | "agenda"
  | "berita"
  | "domain"
  | "galeri"
  | "halaman"
  | "prestasi"
  | "sorotan"
  | "tampilan"
  | "tataletak";

/** Full guide content for a single page. */
export interface SitusGuideContent {
  title: string;
  intro: string;
  steps: SitusGuideStep[];
  tips: string[];
}

export const SITUS_PAGE_GUIDES: Record<SitusGuideId, SitusGuideContent> = {
  dashboard: {
    title: "Cara pakai Situs Sekolah",
    intro: "Pusat kontrol situs publik: pantau status terbit, template, dan domain, lalu lanjut ke langkah berikutnya.",
    steps: [
      { title: "Cek status & ringkasan", detail: "Kartu Status, Template, dan Domain menampilkan kondisi situs sekejap.", roles: ["humas", "admin"] },
      { title: "Ikuti Langkah Cepat", detail: "Tombol 1–4 mengantar ke Template, Berita, Profil, dan Domain berurutan.", roles: ["humas", "operator"] },
      { title: "Terbitkan situs", detail: "Tombol Terbitkan membuat situs terlihat publik; Jadikan Draft menyembunyikannya.", roles: ["admin", "kepala_sekolah"] },
    ],
    tips: [
      "Pakai Lihat Situs untuk pratinjau sebelum menerbitkan.",
      "Selesaikan template, konten, dan domain sebelum terbit.",
    ],
  },
  agenda: {
    title: "Cara pakai Agenda",
    intro: "Kelola daftar agenda/kegiatan sekolah yang tampil di situs publik.",
    steps: [
      { title: "Tambah agenda", detail: "Tombol Tambah → isi judul, tanggal mulai/selesai, dan lokasi.", roles: ["humas"] },
      { title: "Atur status terbit", detail: "Set status Terbit agar agenda muncul di situs, atau Draft untuk menyembunyikan.", roles: ["humas"] },
      { title: "Ubah atau hapus", detail: "Pakai tombol Ubah/Hapus pada baris untuk menyunting agenda lama.", roles: ["humas"] },
    ],
    tips: [
      "Tanggal mulai wajib diisi agar agenda tampil terurut.",
      "Hanya agenda berstatus Terbit yang tampil ke publik.",
    ],
  },
  berita: {
    title: "Cara pakai Berita",
    intro: "Tulis dan kelola berita, pengumuman, dan artikel yang tampil di situs sekolah.",
    steps: [
      { title: "Tulis berita baru", detail: "Tombol Tambah → isi judul, kategori, ringkasan, dan isi (HTML).", roles: ["humas"] },
      { title: "Lengkapi detail", detail: "Tambahkan gambar sampul, penulis, dan tanggal terbit.", roles: ["humas"] },
      { title: "Terbitkan", detail: "Set status Terbit agar berita tampil di situs publik.", roles: ["humas"] },
    ],
    tips: [
      "Kategori membantu pengunjung memfilter berita di situs.",
      "Simpan sebagai Draft dulu bila isi belum final.",
    ],
  },
  domain: {
    title: "Cara pakai Domain & SSL",
    intro: "Atur alamat situs sekolah: subdomain SekolahPro gratis atau domain kustom sendiri.",
    steps: [
      { title: "Tentukan subdomain", detail: "Isi subdomain (huruf kecil, angka, tanda hubung) untuk alamat <subdomain>.sekolahpro.id.", roles: ["operator", "admin"] },
      { title: "Tambah domain kustom", detail: "Isi domain sekolah sendiri, mis. www.namasekolah.sch.id.", roles: ["admin"] },
      { title: "Arahkan DNS & simpan", detail: "Ikuti petunjuk CNAME lalu klik Simpan Domain; verifikasi & SSL diproses otomatis.", roles: ["operator", "admin"] },
    ],
    tips: [
      "Subdomain harus unik — bila gagal, coba nama lain.",
      "SSL aktif otomatis setelah DNS domain kustom mengarah benar.",
    ],
  },
  galeri: {
    title: "Cara pakai Galeri",
    intro: "Unggah dan kelola foto-foto yang tampil di galeri situs sekolah.",
    steps: [
      { title: "Tambah foto", detail: "Tombol Tambah → isi judul, URL gambar, dan kategori.", roles: ["humas"] },
      { title: "Atur urutan", detail: "Isi nilai Urutan untuk menentukan posisi foto di galeri.", roles: ["humas"] },
      { title: "Terbitkan", detail: "Set status Terbit agar foto muncul di situs publik.", roles: ["humas"] },
    ],
    tips: [
      "Gambar wajib berupa URL yang bisa diakses publik.",
      "Kelompokkan foto dengan kategori yang konsisten.",
    ],
  },
  halaman: {
    title: "Cara pakai Halaman",
    intro: "Buat halaman statis kustom (mis. Profil, Fasilitas) untuk situs sekolah.",
    steps: [
      { title: "Tambah halaman", detail: "Tombol Tambah → isi judul, slug, dan isi (HTML).", roles: ["humas", "operator"] },
      { title: "Tampilkan di navigasi", detail: "Aktifkan Tampilkan di Navigasi agar halaman muncul di menu situs.", roles: ["humas"] },
      { title: "Atur urutan & terbit", detail: "Isi Urutan untuk posisi menu, lalu set status Terbit.", roles: ["humas"] },
    ],
    tips: [
      "Kosongkan slug agar dibuat otomatis dari judul.",
      "Hanya halaman Terbit yang dapat diakses pengunjung.",
    ],
  },
  prestasi: {
    title: "Cara pakai Prestasi",
    intro: "Catat prestasi siswa dan sekolah untuk dipamerkan di situs publik.",
    steps: [
      { title: "Tambah prestasi", detail: "Tombol Tambah → isi judul, tingkat, tahun, dan peraih.", roles: ["humas", "kesiswaan"] },
      { title: "Lengkapi detail", detail: "Tambahkan deskripsi dan URL gambar pendukung.", roles: ["humas"] },
      { title: "Terbitkan", detail: "Set status Terbit agar prestasi tampil di situs.", roles: ["humas"] },
    ],
    tips: [
      "Tingkat (Nasional/Provinsi/dll) menonjolkan capaian terbesar.",
      "Isi tahun agar prestasi terurut rapi.",
    ],
  },
  sorotan: {
    title: "Cara pakai Sorotan",
    intro: "Atur bagian sorotan beranda: Keunggulan, Statistik, dan Testimoni.",
    steps: [
      { title: "Pilih bagian", detail: "Klik tab Keunggulan, Statistik, atau Testimoni di atas.", roles: ["humas"] },
      { title: "Tambah item", detail: "Tambahkan baris pada bagian aktif lalu isi datanya.", roles: ["humas"] },
      { title: "Simpan", detail: "Perubahan tersimpan ke situs setelah disimpan.", roles: ["humas"] },
    ],
    tips: [
      "Statistik cocok untuk angka ringkas (jumlah siswa, alumni).",
      "Testimoni memperkuat kepercayaan calon orang tua.",
    ],
  },
  tampilan: {
    title: "Cara pakai Tampilan Situs",
    intro: "Pilih template, atur warna brand, isi konten beranda, dan tentukan bagian yang tampil.",
    steps: [
      { title: "Pilih template", detail: "Klik salah satu kartu template sebagai tema dasar situs.", roles: ["humas", "operator"] },
      { title: "Atur brand & hero", detail: "Set warna utama/aksen, logo, gambar hero, tagline, dan visi-misi.", roles: ["humas"] },
      { title: "Pilih bagian tampil", detail: "Nyalakan/matikan Berita, Agenda, Galeri, PPDB, dan lainnya.", roles: ["humas", "operator"] },
      { title: "Simpan perubahan", detail: "Klik Simpan Perubahan agar tampilan diterapkan ke situs.", roles: ["humas"] },
    ],
    tips: [
      "Warna brand otomatis dipakai di seluruh halaman situs.",
      "URL logo & hero harus dapat diakses publik.",
    ],
  },
  tataletak: {
    title: "Cara pakai Tata Letak",
    intro: "Susun urutan, aktif/nonaktif, dan varian tiap blok bagian beranda situs.",
    steps: [
      { title: "Tambah blok", detail: "Pilih jenis blok lalu klik + Tambah Blok.", roles: ["humas", "operator"] },
      { title: "Atur urutan & varian", detail: "Gunakan panah ↑/↓ untuk mengurutkan dan pilih varian tiap blok.", roles: ["humas"] },
      { title: "Aktif/nonaktif & simpan", detail: "Toggle Aktif tiap blok lalu klik Simpan Tata Letak.", roles: ["humas", "operator"] },
    ],
    tips: [
      "Blok nonaktif tetap tersimpan tapi tidak tampil di situs.",
      "Susun blok terpenting di urutan atas beranda.",
    ],
  },
};
