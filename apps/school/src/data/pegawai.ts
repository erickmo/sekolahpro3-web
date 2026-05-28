import { belongsToSchool, pickSchoolSlug, type MockSchoolSlug } from "./school-scope";

export type RolePegawai = "guru" | "staff";

export type StatusPegawai =
  | "Aktif"
  | "Cuti"
  | "Non-aktif"
  | "Pensiun"
  | "Kontrak Berakhir";

export type JenisKelamin = "Laki-laki" | "Perempuan";
export type Agama = "Islam" | "Kristen" | "Katolik" | "Hindu" | "Budha" | "Konghucu";

export type JenisPtk =
  | "Guru Kelas" | "Guru Mapel" | "Guru BK" | "Kepala Sekolah" | "Wakil Kepsek";

export type StatusKepegawaian =
  | "PNS" | "PPPK" | "GTY" | "GTT" | "Tetap Yayasan" | "Kontrak" | "Honorer";

export type Departemen =
  | "Tata Usaha" | "Keuangan" | "Perpustakaan" | "Laboratorium" | "Keamanan"
  | "Kebersihan" | "Kantin" | "Teknologi Informasi" | "Sarana Prasarana" | "Kesehatan";

export interface JadwalMengajarRow {
  hari: "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu";
  jam: string;
  mapel: string;
  kelas: string;
  ruang: string;
}

export interface KelasAmpuRow {
  kelas: string;
  mapel: string;
  jumlahSiswa: number;
  rataNilai: number;
}

export interface RiwayatMengajarRow {
  tahun: string;
  semester: "Ganjil" | "Genap";
  mapel: string;
  kelas: string;
  jumlahSiswa: number;
}

export interface SertifikasiRow {
  nama: string;
  lembaga: string;
  tanggal: string;
  noSertifikat: string;
  masaBerlaku?: string | undefined;
}

export interface SkMengajarRow {
  nomorSk: string;
  tanggalSk: string;
  mapel: string;
  tahunAjaran: string;
}

export interface TugasRow {
  id: string;
  judul: string;
  deskripsi: string;
  prioritas: "Rendah" | "Sedang" | "Tinggi" | "Mendesak";
  status: "Backlog" | "Berjalan" | "Selesai" | "Tertunda";
  jatuhTempo: string;
  pemberi: string;
}

export interface RiwayatJabatanRow {
  tahun: string;
  jabatan: string;
  departemen: string;
  keterangan?: string | undefined;
}

export interface PelatihanRow {
  nama: string;
  penyelenggara: string;
  tanggal: string;
  durasi: string;
  sertifikatUrl?: string | undefined;
}

export interface KehadiranRow {
  tanggal: string;
  status: "Hadir" | "Sakit" | "Izin" | "Dinas Luar" | "Alpa";
  jamMasuk?: string | undefined;
  jamPulang?: string | undefined;
  keterangan?: string | undefined;
}

export interface DokumenRow {
  nama: string;
  tipe: "Ijazah" | "Akta" | "Sertifikat" | "SK" | "KTP" | "KK" | "Foto" | "NPWP" | "Kontrak" | "Lainnya";
  ukuran: string;
  diunggah: string;
  url?: string | undefined;
}

export interface AktivitasRow {
  waktu: string;
  aktor: string;
  aksi: string;
  tone: "neutral" | "brand" | "success" | "warning" | "danger";
}

export interface PegawaiProfilGuru {
  jenisPtk: JenisPtk;
  mapelPengampu: string[];
  jadwalMengajar: JadwalMengajarRow[];
  kelasAmpu: KelasAmpuRow[];
  riwayatMengajar: RiwayatMengajarRow[];
  sertifikasi: SertifikasiRow[];
  skMengajar: SkMengajarRow[];
  totalJamMengajar: number;
  jumlahKelas: number;
  jumlahSiswaBinaan: number;
  rataNilaiKelas: number;
}

export interface PegawaiProfilStaff {
  departemen: Departemen;
  jabatanStaff: string;
  atasan?: string | undefined;
  tugas: TugasRow[];
  riwayatJabatan: RiwayatJabatanRow[];
  pelatihan: PelatihanRow[];
  jumlahTugasAktif: number;
  jumlahTugasSelesai: number;
  jamKerjaMingguIni: number;
}

export interface Pegawai {
  sekolah: MockSchoolSlug;
  nip: string;
  nuptk?: string | undefined;
  nik?: string | undefined;
  namaLengkap: string;
  gelar?: { depan?: string | undefined; belakang?: string | undefined } | undefined;
  roles: RolePegawai[];
  status: StatusPegawai;
  jenisKelamin: JenisKelamin;
  tempatLahir: string;
  tanggalLahir: string;
  agama: Agama;
  kewarganegaraan: "WNI" | "WNA";
  jabatanUtama: string;
  statusKepegawaian: StatusKepegawaian;
  pangkat?: string | undefined;
  golongan?: string | undefined;
  tmtKerja: string;
  tahunPensiun?: string | undefined;
  masaKontrakBerakhir?: string | undefined;
  pendidikanTerakhir: string;
  jurusan?: string | undefined;
  asalKampus?: string | undefined;
  gajiPokok?: number | undefined;
  tunjangan?: number | undefined;
  alamat?: string | undefined;
  rt?: string | undefined;
  rw?: string | undefined;
  desa?: string | undefined;
  kecamatan?: string | undefined;
  kabupaten?: string | undefined;
  provinsi?: string | undefined;
  kodePos?: string | undefined;
  telepon?: string | undefined;
  email?: string | undefined;
  fotoUrl?: string | undefined;
  guru?: PegawaiProfilGuru | undefined;
  staff?: PegawaiProfilStaff | undefined;
  kehadiran: KehadiranRow[];
  dokumen: DokumenRow[];
  aktivitas: AktivitasRow[];
  persenKehadiran: number;
}

export function isGuru(p: Pegawai): boolean {
  return p.roles.includes("guru");
}

export function isStaff(p: Pegawai): boolean {
  return p.roles.includes("staff");
}

export function isDualRole(p: Pegawai): boolean {
  return isGuru(p) && isStaff(p);
}

export const PEGAWAI_LIST: Pegawai[] = [];

export function findPegawai(nip: string, sekolah?: string): Pegawai | undefined {
  const p = PEGAWAI_LIST.find((row) => row.nip === nip);
  if (!p) return undefined;
  if (sekolah && !belongsToSchool(p.sekolah, sekolah)) return undefined;
  return p;
}

export function listPegawaiForSekolah(sekolah?: string): Pegawai[] {
  if (!sekolah) return PEGAWAI_LIST;
  return PEGAWAI_LIST.filter((p) => belongsToSchool(p.sekolah, sekolah));
}

export { pickSchoolSlug };
