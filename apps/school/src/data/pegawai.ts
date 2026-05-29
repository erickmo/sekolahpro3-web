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

// ─────────────────────────────────────────────────────────────────────────────
// Fixture builders (ported from guru.ts and staff.ts).
// ─────────────────────────────────────────────────────────────────────────────

const guruNamaList = [
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
const statusGuruList: StatusPegawai[] = ["Aktif","Aktif","Aktif","Aktif","Aktif","Aktif","Aktif","Cuti","Non-aktif","Pensiun"];
const statusKepGuruList: StatusKepegawaian[] = ["PNS","PNS","PPPK","GTY","GTT","Honorer"];
const agamaList: Agama[] = ["Islam","Islam","Kristen","Katolik","Hindu","Budha"];
const kelasList = ["X-IPA-1","X-IPA-2","X-IPS-1","XI-IPA-1","XI-IPA-2","XI-IPS-1","XII-IPA-1","XII-IPA-2","XII-IPS-1"];
const hariList: JadwalMengajarRow["hari"][] = ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
const ruangList = ["R-101","R-102","R-103","R-201","R-202","Lab-IPA","Lab-Komp","Aula"];
const gelarDepanList = ["Drs.","Dra.","Ir.","H.","Hj.",""];
const gelarBelakangList = ["S.Pd.","M.Pd.","S.Si.","M.Si.","S.Pd., M.Pd.","S.T., M.T.","S.E.","S.Sos."];
const pangkatList = ["Penata Muda","Penata Muda Tk. I","Penata","Penata Tk. I","Pembina"];
const golonganList = ["III/a","III/b","III/c","III/d","IV/a","IV/b"];
const pendidikanGuruList = ["S1","S2","S3"];
const jurusanGuruList = ["Pendidikan Matematika","Pendidikan Bahasa","Pendidikan Fisika","Pendidikan Kimia","Pendidikan Biologi","Pendidikan Sejarah","Pendidikan Olahraga","Pendidikan Ekonomi"];
const kampusList = ["UPI Bandung","UGM Yogyakarta","UI Jakarta","Unpad","UNJ","UNS Solo","Unesa Surabaya"];

const staffNamaList = [
  "Budi Santoso", "Rina Anggraini", "Dewi Lestari", "Ahmad Fauzi", "Siti Nurhaliza",
  "Andi Pratama", "Maya Sari", "Reza Maulana", "Nia Ramadhani", "Bagas Wicaksono",
  "Putri Ayu", "Hendra Gunawan", "Tiara Putri", "Fajar Sidik", "Lestari Wulandari",
  "Galih Permana", "Sinta Dewi", "Yusuf Mahendra", "Anisa Rahmawati", "Rizky Hidayat",
  "Citra Kirana", "Eko Prasetyo", "Vania Sabrina", "Aldi Taher", "Bunga Citra",
  "Dimas Anggara", "Selena Putri", "Iqbal Ramadhan", "Mawar Eva", "Aril Noah",
];

const departemenList: Departemen[] = [
  "Tata Usaha","Keuangan","Perpustakaan","Laboratorium","Keamanan",
  "Kebersihan","Kantin","Teknologi Informasi","Sarana Prasarana","Kesehatan",
];

const jabatanByDept: Record<Departemen, string[]> = {
  "Tata Usaha": ["Kepala TU", "Staf TU", "Operator Dapodik", "Resepsionis"],
  "Keuangan": ["Bendahara", "Staf Keuangan", "Kasir"],
  "Perpustakaan": ["Kepala Perpustakaan", "Pustakawan"],
  "Laboratorium": ["Kepala Lab", "Laboran"],
  "Keamanan": ["Koordinator Satpam", "Satpam"],
  "Kebersihan": ["Petugas Kebersihan", "Tukang Kebun"],
  "Kantin": ["Petugas Kantin"],
  "Teknologi Informasi": ["Admin IT", "Teknisi Jaringan"],
  "Sarana Prasarana": ["Staf Sarpras", "Kurir"],
  "Kesehatan": ["Petugas Kesehatan/UKS"],
};

const statusStaffList: StatusPegawai[] = ["Aktif","Aktif","Aktif","Aktif","Aktif","Aktif","Aktif","Cuti","Kontrak Berakhir","Non-aktif"];
const statusKepStaffList: StatusKepegawaian[] = ["PNS","PPPK","Tetap Yayasan","Kontrak","Honorer"];
const pendidikanStaffList = ["SMA/SMK","D3","S1","S1","S2"];

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

interface GuruFixture {
  shared: Omit<Pegawai, "roles" | "guru" | "staff">;
  profil: PegawaiProfilGuru;
}

function buildGuruFixture(idx: number): GuruFixture {
  const nama = guruNamaList[idx % guruNamaList.length]!;
  const tahunMasuk = 2000 + (idx % 20);
  const nip = `${1960 + (idx % 30)}${pad((idx % 12) + 1, 2)}${pad((idx % 27) + 1, 2)} ${tahunMasuk}${pad((idx % 12) + 1, 2)} ${idx % 2 === 0 ? 1 : 2} ${pad((idx % 999) + 1, 3)}`;
  const nuptk = `${pad(1000000000000000 + idx * 991, 16)}`.slice(0, 16);
  const gender: JenisKelamin = idx % 2 === 0 ? "Laki-laki" : "Perempuan";
  const status = statusGuruList[idx % statusGuruList.length]!;
  const jenisPtk = pick(jenisPtkList, idx + 5);
  const statusKep = pick(statusKepGuruList, idx + 7);
  const agama = pick(agamaList, idx + 3);
  const tglLahir = `${1965 + (idx % 30)}-${pad((idx % 12) + 1, 2)}-${pad((idx % 27) + 1, 2)}`;
  const mapelUtama = pick(mapelList, idx + 11);
  const mapelKedua = pick(mapelList, idx + 17);
  const mataPelajaran = mapelUtama === mapelKedua ? [mapelUtama] : [mapelUtama, mapelKedua];
  const jabatan = pick(jabatanList, idx + 13);
  const pendidikan = pick(pendidikanGuruList, idx + 19);
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

  const skMengajar: SkMengajarRow[] = [
    { nomorSk: `SK/MGJ/${pad(idx + 100, 4)}/2024`, tanggalSk: "2024-07-15", mapel: mapelUtama, tahunAjaran: "2024/2025" },
    { nomorSk: `SK/MGJ/${pad(idx + 100, 4)}/2025`, tanggalSk: "2025-07-15", mapel: mapelUtama, tahunAjaran: "2025/2026" },
  ];

  const kehadiran: KehadiranRow[] = Array.from({ length: 10 }).map((_, i) => {
    const day = 24 - i;
    const r = rand(idx + i + 53);
    const st: KehadiranRow["status"] =
      r < 0.88 ? "Hadir" : r < 0.93 ? "Dinas Luar" : r < 0.96 ? "Sakit" : r < 0.98 ? "Izin" : "Alpa";
    const base: KehadiranRow = {
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

  const shared: Omit<Pegawai, "roles" | "guru" | "staff"> = {
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
    jabatanUtama: jabatan,
    statusKepegawaian: statusKep,
    pangkat: isPns ? pick(pangkatList, idx + 8) : undefined,
    golongan: isPns ? pick(golonganList, idx + 9) : undefined,
    tmtKerja: `${tahunMasuk}-${pad((idx % 12) + 1, 2)}-01`,
    tahunPensiun: isPns ? `${1965 + (idx % 30) + 60}` : undefined,
    pendidikanTerakhir: pendidikan,
    jurusan: pick(jurusanGuruList, idx + 10),
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
    kehadiran,
    dokumen,
    aktivitas,
    persenKehadiran: hadir,
  };

  const profil: PegawaiProfilGuru = {
    jenisPtk,
    mapelPengampu: mataPelajaran,
    jadwalMengajar,
    kelasAmpu,
    riwayatMengajar,
    sertifikasi,
    skMengajar,
    totalJamMengajar: totalJam,
    jumlahKelas,
    jumlahSiswaBinaan: jumlahSiswa,
    rataNilaiKelas: rataKelas,
  };

  return { shared, profil };
}

interface StaffFixture {
  shared: Omit<Pegawai, "roles" | "guru" | "staff">;
  profil: PegawaiProfilStaff;
}

function buildStaffFixture(idx: number): StaffFixture {
  const nama = staffNamaList[idx % staffNamaList.length]!;
  const tahun = 2010 + (idx % 14);
  const nip = `19${pad(70 + (idx % 25), 2)}${pad((idx % 12) + 1, 2)}${pad((idx % 27) + 1, 2)}${pad(idx + 1, 6)}`;
  const gender: JenisKelamin = idx % 2 === 0 ? "Laki-laki" : "Perempuan";
  const status = statusStaffList[idx % statusStaffList.length]!;
  const departemen = departemenList[idx % departemenList.length]!;
  const jabatanPool = jabatanByDept[departemen];
  const jabatan = jabatanPool[idx % jabatanPool.length]!;
  const statusKepegawaian = statusKepStaffList[idx % statusKepStaffList.length]!;
  const agama = pick(agamaList, idx + 3);
  const tglLahir = `19${70 + (idx % 25)}-${pad((idx % 12) + 1, 2)}-${pad((idx % 27) + 1, 2)}`;
  const hadir = 80 + Math.floor(rand(idx + 13) * 18);
  const tmt = `${tahun}-${pad((idx % 12) + 1, 2)}-${pad((idx % 27) + 1, 2)}`;
  const isKontrak = statusKepegawaian === "Kontrak" || statusKepegawaian === "Honorer" || statusKepegawaian === "PPPK";
  const kontrakBerakhir = isKontrak
    ? `2026-${pad(((idx + 6) % 12) + 1, 2)}-${pad((idx % 27) + 1, 2)}`
    : undefined;
  const gaji = 2500000 + (idx % 10) * 500000;
  const tunjangan = 500000 + (idx % 6) * 250000;
  const pendidikan = pick(pendidikanStaffList, idx + 5);

  const kehadiran: KehadiranRow[] = Array.from({ length: 10 }).map((_, i) => {
    const day = 24 - i;
    const r = rand(idx + i + 41);
    const st: KehadiranRow["status"] =
      r < 0.85 ? "Hadir" : r < 0.9 ? "Sakit" : r < 0.94 ? "Izin" : r < 0.98 ? "Dinas Luar" : "Alpa";
    const base: KehadiranRow = {
      tanggal: `2026-05-${pad(day, 2)}`,
      status: st,
    };
    if (st === "Hadir" || st === "Dinas Luar") {
      base.jamMasuk = `0${7 + (i % 2)}:${pad((i * 7) % 60, 2)}`;
      base.jamPulang = `1${5 + (i % 2)}:${pad((i * 11) % 60, 2)}`;
    }
    if (st !== "Hadir") base.keterangan = st === "Dinas Luar" ? "Dinas ke kantor cabang" : "Surat keterangan diterima";
    return base;
  });

  const prioritasList: TugasRow["prioritas"][] = ["Rendah","Sedang","Tinggi","Mendesak"];
  const statusTugasList: TugasRow["status"][] = ["Backlog","Berjalan","Selesai","Tertunda"];
  const tugas: TugasRow[] = Array.from({ length: 8 }).map((_, i) => {
    const st = statusTugasList[(idx + i) % statusTugasList.length]!;
    return {
      id: `TGS-${pad(idx + 1, 3)}-${pad(i + 1, 2)}`,
      judul: pick([
        "Rekap absensi bulanan","Inventarisasi aset","Penyusunan laporan keuangan",
        "Audit ruang kelas","Pemeliharaan perangkat lab","Pembaruan data Dapodik",
        "Pengarsipan dokumen siswa","Persiapan rapat orang tua",
      ], i + idx),
      deskripsi: "Penyelesaian sesuai SOP dan target waktu yang telah ditentukan.",
      prioritas: prioritasList[(idx + i) % prioritasList.length]!,
      status: st,
      jatuhTempo: `2026-${pad(((idx + i) % 12) + 1, 2)}-${pad(((i * 3) % 27) + 1, 2)}`,
      pemberi: pick(staffNamaList, i + idx + 9),
    };
  });

  const riwayatJabatan: RiwayatJabatanRow[] = [
    { tahun: `${tahun}`, jabatan: "Staf", departemen, keterangan: "Mulai bertugas" },
    { tahun: `${tahun + 3}`, jabatan: jabatan, departemen, keterangan: "Promosi internal" },
  ];

  const pelatihan: PelatihanRow[] = [
    { nama: "Pelatihan Administrasi Sekolah", penyelenggara: "Dinas Pendidikan", tanggal: "2025-03-15", durasi: "3 hari" },
    { nama: "Workshop Keamanan Data", penyelenggara: "Kemendikbud", tanggal: "2025-07-20", durasi: "2 hari" },
    { nama: "Sertifikasi Profesi", penyelenggara: "BNSP", tanggal: "2024-11-10", durasi: "5 hari" },
  ];

  const dokumen: DokumenRow[] = [
    { nama: "KTP.pdf", tipe: "KTP", ukuran: "224 KB", diunggah: "2025-01-10" },
    { nama: "Ijazah Terakhir.pdf", tipe: "Ijazah", ukuran: "612 KB", diunggah: "2025-01-12" },
    { nama: "SK Pengangkatan.pdf", tipe: "SK", ukuran: "432 KB", diunggah: "2025-01-15" },
    { nama: "Kontrak Kerja.pdf", tipe: "Kontrak", ukuran: "528 KB", diunggah: "2025-01-15" },
    { nama: "Foto 3x4.jpg", tipe: "Foto", ukuran: "128 KB", diunggah: "2025-01-20" },
  ];

  const aktivitas: AktivitasRow[] = [
    { waktu: "Hari ini, 09:12", aktor: "Kepala Sekolah", aksi: "Menugaskan rekap absensi", tone: "brand" },
    { waktu: "Kemarin, 14:30", aktor: "HRD", aksi: "Memperbarui data kepegawaian", tone: "neutral" },
    { waktu: "2 hari lalu", aktor: pick(staffNamaList, idx + 9), aksi: "Menyelesaikan tugas inventarisasi", tone: "success" },
    { waktu: "5 hari lalu", aktor: "Sistem", aksi: "Mengirim pengingat kontrak akan berakhir", tone: "warning" },
  ];

  const tugasAktif = tugas.filter((t) => t.status !== "Selesai").length;
  const tugasSelesai = tugas.filter((t) => t.status === "Selesai").length;
  const jamKerja = 32 + Math.floor(rand(idx + 19) * 12);

  const shared: Omit<Pegawai, "roles" | "guru" | "staff"> = {
    sekolah: pickSchoolSlug(idx),
    nip,
    nik: `3273${pad(idx * 41, 12)}`,
    namaLengkap: nama,
    jenisKelamin: gender,
    tempatLahir: pick(["Bandung","Jakarta","Surabaya","Semarang","Bogor","Depok","Bekasi"], idx),
    tanggalLahir: tglLahir,
    agama,
    kewarganegaraan: "WNI",
    status,
    jabatanUtama: jabatan,
    statusKepegawaian,
    tmtKerja: tmt,
    masaKontrakBerakhir: kontrakBerakhir,
    pendidikanTerakhir: pendidikan,
    jurusan: pendidikan === "SMA/SMK" ? "IPS" : pick(["Manajemen","Akuntansi","Teknik Informatika","Pendidikan","Administrasi"], idx),
    gajiPokok: gaji,
    tunjangan,
    alamat: `Jl. Merdeka No. ${idx + 1}`,
    rt: pad((idx % 12) + 1, 2),
    rw: pad((idx % 8) + 1, 2),
    desa: pick(["Sukamaju","Cibadak","Cikutra","Antapani","Ujungberung"], idx),
    kecamatan: pick(["Coblong","Cibeunying","Kiaracondong","Sukasari"], idx),
    kabupaten: "Kota Bandung",
    provinsi: "Jawa Barat",
    kodePos: `4012${idx % 10}`,
    telepon: `0822${pad(idx * 79, 8)}`,
    email: `${nama.split(" ").join(".").toLowerCase()}@staff.sekolahpro.id`,
    kehadiran,
    dokumen,
    aktivitas,
    persenKehadiran: hadir,
  };

  const profil: PegawaiProfilStaff = {
    departemen,
    jabatanStaff: jabatan,
    atasan: pick(staffNamaList, idx + 17),
    tugas,
    riwayatJabatan,
    pelatihan,
    jumlahTugasAktif: tugasAktif,
    jumlahTugasSelesai: tugasSelesai,
    jamKerjaMingguIni: jamKerja,
  };

  return { shared, profil };
}

export const PEGAWAI_LIST: Pegawai[] = (() => {
  const list: Pegawai[] = [];

  for (let i = 0; i < 30; i++) {
    const g = buildGuruFixture(i);
    list.push({ ...g.shared, roles: ["guru"], guru: g.profil });
  }

  for (let i = 0; i < 30; i++) {
    const s = buildStaffFixture(i);
    list.push({ ...s.shared, roles: ["staff"], staff: s.profil });
  }

  // Dual-role exemplars: take guru indices 0,5,10,15, attach a staff profile.
  for (const guruIdx of [0, 5, 10, 15]) {
    const target = list[guruIdx]!;
    const s = buildStaffFixture(guruIdx + 50);
    const merged: Pegawai = {
      ...target,
      roles: ["guru", "staff"],
      staff: { ...s.profil, departemen: "Tata Usaha" },
    };
    list[guruIdx] = merged;
  }

  return list;
})();

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
