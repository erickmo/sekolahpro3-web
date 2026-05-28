// Mock data fixture untuk modul Guru.
// Replace dengan @sekolahpro/api-client hooks ketika backend siap.

import { belongsToSchool, pickSchoolSlug, type MockSchoolSlug } from "./school-scope";

export type StatusGuru = "Aktif" | "Cuti" | "Non-aktif" | "Pensiun";
export type JenisKelamin = "Laki-laki" | "Perempuan";
export type Agama = "Islam" | "Kristen" | "Katolik" | "Hindu" | "Budha" | "Konghucu";
export type JenisPtk = "Guru Kelas" | "Guru Mapel" | "Guru BK" | "Kepala Sekolah" | "Wakil Kepsek";
export type StatusKepegawaian = "PNS" | "PPPK" | "GTY" | "GTT" | "Honorer";

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

export interface KehadiranGuruRow {
  tanggal: string;
  status: "Hadir" | "Sakit" | "Izin" | "Dinas Luar" | "Alpa";
  jamMasuk?: string | undefined;
  jamPulang?: string | undefined;
  keterangan?: string | undefined;
}

export interface DokumenRow {
  nama: string;
  tipe: "Ijazah" | "Sertifikat" | "SK" | "KTP" | "KK" | "Foto" | "NPWP" | "Lainnya";
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

export interface Guru {
  sekolah: MockSchoolSlug;
  nip: string;
  nuptk: string;
  nik?: string | undefined;
  namaLengkap: string;
  gelar: { depan?: string | undefined; belakang?: string | undefined };
  jenisKelamin: JenisKelamin;
  tempatLahir: string;
  tanggalLahir: string;
  agama: Agama;
  kewarganegaraan: "WNI" | "WNA";
  status: StatusGuru;
  jenisPtk: JenisPtk;
  mataPelajaran: string[];
  jabatan: string;
  statusKepegawaian: StatusKepegawaian;
  pangkat?: string | undefined;
  golongan?: string | undefined;
  tmtKerja: string;
  tahunPensiun?: string | undefined;
  pendidikanTerakhir: string;
  jurusan?: string | undefined;
  asalKampus?: string | undefined;
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
  // Relasi
  jadwalMengajar: JadwalMengajarRow[];
  kelasAmpu: KelasAmpuRow[];
  riwayatMengajar: RiwayatMengajarRow[];
  sertifikasi: SertifikasiRow[];
  kehadiran: KehadiranGuruRow[];
  dokumen: DokumenRow[];
  aktivitas: AktivitasRow[];
  // Ringkasan
  totalJamMengajar: number;
  jumlahKelas: number;
  jumlahSiswaBinaan: number;
  rataNilaiKelas: number;
  persenKehadiran: number;
}

const namaList = [
  "Suharto Wibowo", "Sri Mulyani", "Bambang Susilo", "Retno Marsudi", "Joko Widodo",
  "Megawati Putri", "Susilo Bambang", "Hatta Rajasa", "Sri Wahyuni", "Anies Baswedan",
  "Tri Rismaharini", "Ridwan Kamil", "Khofifah Indar", "Ganjar Pranowo", "Puan Maharani",
  "Airlangga Hartarto", "Sandiaga Uno", "Erick Thohir", "Mahfud MD", "Yenny Wahid",
  "Najwa Shihab", "Rhenald Kasali", "Anies Rasyid", "Sri Sultan", "Mohammad Nuh",
  "Anwar Usman", "Mahyeldi Ansharullah", "Bobby Nasution", "Khofifah Parawansa", "Ma'ruf Amin",
  "Sri Susilowati", "Bambang Hartono", "Endang Sulistyowati", "Agus Salim", "Indrawati Sari",
  "Hartono Susanto", "Nurul Hidayah", "Slamet Riyadi", "Wijayanti Pratiwi", "Subandrio Wibisono",
];

const mapelList = [
  "Matematika","Bahasa Indonesia","Bahasa Inggris","Fisika","Kimia","Biologi","Sejarah",
  "PKn","Seni Budaya","Penjas","TIK","Ekonomi","Geografi","Sosiologi",
];
const jabatanList = ["Guru","Wali Kelas","Kepala Sekolah","Wakil Kepsek","Kepala Lab","Pembina OSIS","Koordinator BK"];
const jenisPtkList: JenisPtk[] = ["Guru Mapel","Guru Mapel","Guru Mapel","Guru Kelas","Guru BK","Wakil Kepsek","Kepala Sekolah"];
const statusList: StatusGuru[] = ["Aktif","Aktif","Aktif","Aktif","Aktif","Aktif","Aktif","Cuti","Non-aktif","Pensiun"];
const statusKepList: StatusKepegawaian[] = ["PNS","PNS","PPPK","GTY","GTT","Honorer"];
const agamaList: Agama[] = ["Islam","Islam","Kristen","Katolik","Hindu","Budha"];
const kelasList = ["X-IPA-1","X-IPA-2","X-IPS-1","XI-IPA-1","XI-IPA-2","XI-IPS-1","XII-IPA-1","XII-IPA-2","XII-IPS-1"];
const hariList: JadwalMengajarRow["hari"][] = ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
const ruangList = ["R-101","R-102","R-103","R-201","R-202","Lab-IPA","Lab-Komp","Aula"];
const gelarDepanList = ["Drs.","Dra.","Ir.","H.","Hj.",""];
const gelarBelakangList = ["S.Pd.","M.Pd.","S.Si.","M.Si.","S.Pd., M.Pd.","S.T., M.T.","S.E.","S.Sos."];
const pangkatList = ["Penata Muda","Penata Muda Tk. I","Penata","Penata Tk. I","Pembina"];
const golonganList = ["III/a","III/b","III/c","III/d","IV/a","IV/b"];
const pendidikanList = ["S1","S2","S3"];
const jurusanList = ["Pendidikan Matematika","Pendidikan Bahasa","Pendidikan Fisika","Pendidikan Kimia","Pendidikan Biologi","Pendidikan Sejarah","Pendidikan Olahraga","Pendidikan Ekonomi"];
const kampusList = ["UPI Bandung","UGM Yogyakarta","UI Jakarta","Unpad","UNJ","UNS Solo","Unesa Surabaya"];

function rand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(rand(seed) * arr.length)]!;
}
function pad(n: number, w: number) {
  return String(n).padStart(w, "0");
}

function buildGuru(idx: number): Guru {
  const nama = namaList[idx % namaList.length]!;
  const tahunMasuk = 2000 + (idx % 20);
  const nip = `${1960 + (idx % 30)}${pad((idx % 12) + 1, 2)}${pad((idx % 27) + 1, 2)} ${tahunMasuk}${pad((idx % 12) + 1, 2)} ${idx % 2 === 0 ? 1 : 2} ${pad((idx % 999) + 1, 3)}`;
  const nuptk = `${pad(1000000000000000 + idx * 991, 16)}`.slice(0, 16);
  const gender: JenisKelamin = idx % 2 === 0 ? "Laki-laki" : "Perempuan";
  const status = statusList[idx % statusList.length]!;
  const jenisPtk = pick(jenisPtkList, idx + 5);
  const statusKep = pick(statusKepList, idx + 7);
  const agama = pick(agamaList, idx + 3);
  const tglLahir = `${1965 + (idx % 30)}-${pad((idx % 12) + 1, 2)}-${pad((idx % 27) + 1, 2)}`;
  const mapelUtama = pick(mapelList, idx + 11);
  const mapelKedua = pick(mapelList, idx + 17);
  const mataPelajaran = mapelUtama === mapelKedua ? [mapelUtama] : [mapelUtama, mapelKedua];
  const jabatan = pick(jabatanList, idx + 13);
  const pendidikan = pick(pendidikanList, idx + 19);
  const isPns = statusKep === "PNS" || statusKep === "PPPK";
  const jumlahKelas = 2 + (idx % 4);
  const jumlahSiswa = jumlahKelas * (28 + (idx % 8));
  const totalJam = jumlahKelas * (4 + (idx % 4));
  const rataKelas = 75 + Math.floor(rand(idx + 11) * 20);
  const hadir = 85 + Math.floor(rand(idx + 13) * 14);

  const jadwalMengajar: JadwalMengajarRow[] = Array.from({ length: totalJam }).map((_, i) => ({
    hari: pick(hariList, idx + i + 21),
    jam: `${pad(7 + (i % 8), 2)}:00 - ${pad(8 + (i % 8), 2)}:30`,
    mapel: pick(mataPelajaran, i + idx),
    kelas: pick(kelasList, idx + i + 29),
    ruang: pick(ruangList, idx + i + 31),
  }));

  const kelasAmpu: KelasAmpuRow[] = Array.from({ length: jumlahKelas }).map((_, i) => ({
    kelas: pick(kelasList, idx + i + 37),
    mapel: pick(mataPelajaran, i + idx),
    jumlahSiswa: 28 + ((idx + i) % 8),
    rataNilai: 72 + Math.floor(rand(idx + i + 41) * 22),
  }));

  const riwayatMengajar: RiwayatMengajarRow[] = Array.from({ length: 6 }).map((_, i) => {
    const tahun = 2020 + Math.floor(i / 2);
    return {
      tahun: `${tahun}/${tahun + 1}`,
      semester: i % 2 === 0 ? "Ganjil" : "Genap",
      mapel: pick(mataPelajaran, i + idx),
      kelas: pick(kelasList, idx + i + 43),
      jumlahSiswa: 28 + ((idx + i) % 10),
    };
  });

  const sertifikasi: SertifikasiRow[] = [
    { nama: `Sertifikasi Pendidik ${mapelUtama}`, lembaga: "Kemendikbudristek", tanggal: `${tahunMasuk + 3}-08-15`, noSertifikat: `SP-${pad(idx + 1000, 6)}`, masaBerlaku: "Seumur hidup" },
    { nama: "Pelatihan Kurikulum Merdeka", lembaga: "Pusdiklat Kemendikbud", tanggal: "2024-03-20", noSertifikat: `PKM-${pad(idx + 200, 5)}` },
    { nama: "Workshop Asesmen Nasional", lembaga: "BSKAP", tanggal: "2023-11-10", noSertifikat: `AN-${pad(idx + 500, 5)}` },
  ];

  const kehadiran: KehadiranGuruRow[] = Array.from({ length: 10 }).map((_, i) => {
    const day = 24 - i;
    const r = rand(idx + i + 53);
    const st: KehadiranGuruRow["status"] =
      r < 0.88 ? "Hadir" : r < 0.93 ? "Dinas Luar" : r < 0.96 ? "Sakit" : r < 0.98 ? "Izin" : "Alpa";
    const base: KehadiranGuruRow = {
      tanggal: `2026-05-${pad(day, 2)}`,
      status: st,
    };
    if (st === "Hadir" || st === "Dinas Luar") {
      base.jamMasuk = "07:00";
      base.jamPulang = "15:30";
    }
    if (st !== "Hadir") base.keterangan = st === "Dinas Luar" ? "Rapat dinas pendidikan" : "Surat keterangan diterima";
    return base;
  });

  const dokumen: DokumenRow[] = [
    { nama: `Ijazah ${pendidikan}.pdf`, tipe: "Ijazah", ukuran: "812 KB", diunggah: "2024-01-10" },
    { nama: "Sertifikat Pendidik.pdf", tipe: "Sertifikat", ukuran: "624 KB", diunggah: "2024-01-12" },
    { nama: "SK Pengangkatan.pdf", tipe: "SK", ukuran: "432 KB", diunggah: "2024-01-15" },
    { nama: "KTP.pdf", tipe: "KTP", ukuran: "212 KB", diunggah: "2024-01-10" },
    { nama: "Kartu Keluarga.pdf", tipe: "KK", ukuran: "512 KB", diunggah: "2024-01-10" },
    { nama: "Foto 3x4.jpg", tipe: "Foto", ukuran: "128 KB", diunggah: "2024-01-12" },
    { nama: "NPWP.pdf", tipe: "NPWP", ukuran: "256 KB", diunggah: "2024-01-14" },
  ];

  const aktivitas: AktivitasRow[] = [
    { waktu: "Hari ini, 08:45", aktor: "Tata Usaha", aksi: "Memperbarui data kepegawaian", tone: "neutral" },
    { waktu: "Kemarin, 13:20", aktor: nama, aksi: "Mengisi jurnal mengajar kelas " + kelasAmpu[0]!.kelas, tone: "success" },
    { waktu: "2 hari lalu", aktor: "Kepala Sekolah", aksi: "Menyetujui pengajuan cuti", tone: "brand" },
    { waktu: "5 hari lalu", aktor: "Sistem", aksi: "Mengirim pengingat penilaian akhir", tone: "warning" },
  ];

  return {
    sekolah: pickSchoolSlug(idx),
    nip,
    nuptk,
    nik: `3273${pad(idx * 47, 12)}`,
    namaLengkap: nama,
    gelar: {
      depan: pick(gelarDepanList, idx + 4) || undefined,
      belakang: pick(gelarBelakangList, idx + 6),
    },
    jenisKelamin: gender,
    tempatLahir: pick(["Bandung","Jakarta","Surabaya","Semarang","Bogor","Depok","Bekasi","Yogyakarta"], idx),
    tanggalLahir: tglLahir,
    agama,
    kewarganegaraan: "WNI",
    status,
    jenisPtk,
    mataPelajaran,
    jabatan,
    statusKepegawaian: statusKep,
    pangkat: isPns ? pick(pangkatList, idx + 8) : undefined,
    golongan: isPns ? pick(golonganList, idx + 9) : undefined,
    tmtKerja: `${tahunMasuk}-${pad((idx % 12) + 1, 2)}-01`,
    tahunPensiun: isPns ? `${1965 + (idx % 30) + 60}` : undefined,
    pendidikanTerakhir: pendidikan,
    jurusan: pick(jurusanList, idx + 10),
    asalKampus: pick(kampusList, idx + 12),
    alamat: `Jl. Pendidikan No. ${idx + 1}`,
    rt: pad((idx % 12) + 1, 2),
    rw: pad((idx % 8) + 1, 2),
    desa: pick(["Sukamaju","Cibadak","Cikutra","Antapani","Ujungberung"], idx),
    kecamatan: pick(["Coblong","Cibeunying","Kiaracondong","Sukasari"], idx),
    kabupaten: "Kota Bandung",
    provinsi: "Jawa Barat",
    kodePos: `4012${idx % 10}`,
    telepon: `0812${pad(idx * 131, 8)}`,
    email: `${nama.split(" ").join(".").toLowerCase()}@guru.sekolahpro.id`,
    jadwalMengajar,
    kelasAmpu,
    riwayatMengajar,
    sertifikasi,
    kehadiran,
    dokumen,
    aktivitas,
    totalJamMengajar: totalJam,
    jumlahKelas,
    jumlahSiswaBinaan: jumlahSiswa,
    rataNilaiKelas: rataKelas,
    persenKehadiran: hadir,
  };
}

export const GURU_LIST: Guru[] = Array.from({ length: 25 }, (_, i) => buildGuru(i));

export function findGuru(nip: string, sekolah?: string): Guru | undefined {
  const g = GURU_LIST.find((row) => row.nip === nip);
  if (!g) return undefined;
  if (!belongsToSchool(g.sekolah, sekolah)) return undefined;
  return g;
}

export function listGuruForSekolah(sekolah?: string): Guru[] {
  if (!sekolah) return GURU_LIST;
  return GURU_LIST.filter((g) => belongsToSchool(g.sekolah, sekolah));
}

export const FILTER_OPTIONS = {
  status: ["Semua","Aktif","Cuti","Non-aktif","Pensiun"] as const,
  jenisKelamin: ["Semua","Laki-laki","Perempuan"] as const,
  jenisPtk: ["Semua","Guru Kelas","Guru Mapel","Guru BK","Kepala Sekolah","Wakil Kepsek"] as const,
  statusKepegawaian: ["Semua","PNS","PPPK","GTY","GTT","Honorer"] as const,
  mataPelajaran: ["Semua", ...mapelList] as const,
  jabatan: ["Semua", ...jabatanList] as const,
};

export function formatTanggal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function umur(iso: string): number {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  const now = new Date("2026-05-24");
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}
