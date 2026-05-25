// Mock data fixture untuk modul Staff (tenaga kependidikan & non-pengajar).
// Replace dengan @sekolahpro/api-client hooks ketika backend siap.

export type StatusStaff = "Aktif" | "Cuti" | "Non-aktif" | "Pensiun" | "Kontrak Berakhir";
export type JenisKelamin = "Laki-laki" | "Perempuan";
export type Agama = "Islam" | "Kristen" | "Katolik" | "Hindu" | "Budha" | "Konghucu";
export type Departemen =
  | "Tata Usaha"
  | "Keuangan"
  | "Perpustakaan"
  | "Laboratorium"
  | "Keamanan"
  | "Kebersihan"
  | "Kantin"
  | "Teknologi Informasi"
  | "Sarana Prasarana"
  | "Kesehatan";
export type StatusKepegawaian = "PNS" | "PPPK" | "Tetap Yayasan" | "Kontrak" | "Honorer";

export interface KehadiranStaffRow {
  tanggal: string;
  status: "Hadir" | "Sakit" | "Izin" | "Dinas Luar" | "Alpa";
  jamMasuk?: string | undefined;
  jamPulang?: string | undefined;
  keterangan?: string | undefined;
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

export interface DokumenRow {
  nama: string;
  tipe: "Ijazah" | "Akta" | "KK" | "KTP" | "Foto" | "Kontrak" | "SK" | "Lainnya";
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

export interface Staff {
  nip: string;
  nik?: string | undefined;
  namaLengkap: string;
  jenisKelamin: JenisKelamin;
  tempatLahir: string;
  tanggalLahir: string;
  agama: Agama;
  kewarganegaraan: "WNI" | "WNA";
  status: StatusStaff;
  departemen: Departemen;
  jabatan: string;
  statusKepegawaian: StatusKepegawaian;
  tmtKerja: string;
  masaKontrakBerakhir?: string | undefined;
  pendidikanTerakhir: string;
  jurusan?: string | undefined;
  gajiPokok?: number | undefined;
  tunjangan?: number | undefined;
  atasan?: string | undefined;
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
  kehadiran: KehadiranStaffRow[];
  tugas: TugasRow[];
  riwayatJabatan: RiwayatJabatanRow[];
  pelatihan: PelatihanRow[];
  dokumen: DokumenRow[];
  aktivitas: AktivitasRow[];
  // Ringkasan
  persenKehadiran: number;
  jumlahTugasAktif: number;
  jumlahTugasSelesai: number;
  jamKerjaMingguIni: number;
}

const namaList = [
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

const statusList: StatusStaff[] = ["Aktif","Aktif","Aktif","Aktif","Aktif","Aktif","Aktif","Cuti","Kontrak Berakhir","Non-aktif"];
const statusKepegawaianList: StatusKepegawaian[] = ["PNS","PPPK","Tetap Yayasan","Kontrak","Honorer"];
const agamaList: Agama[] = ["Islam","Islam","Kristen","Katolik","Hindu","Budha"];
const pendidikanList = ["SMA/SMK","D3","S1","S1","S2"];

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

function buildStaff(idx: number): Staff {
  const nama = namaList[idx % namaList.length]!;
  const tahun = 2010 + (idx % 14);
  const nip = `19${pad(70 + (idx % 25), 2)}${pad((idx % 12) + 1, 2)}${pad((idx % 27) + 1, 2)}${pad(idx + 1, 6)}`;
  const gender: JenisKelamin = idx % 2 === 0 ? "Laki-laki" : "Perempuan";
  const status = statusList[idx % statusList.length]!;
  const departemen = departemenList[idx % departemenList.length]!;
  const jabatanPool = jabatanByDept[departemen];
  const jabatan = jabatanPool[idx % jabatanPool.length]!;
  const statusKepegawaian = statusKepegawaianList[idx % statusKepegawaianList.length]!;
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
  const pendidikan = pick(pendidikanList, idx + 5);

  const kehadiran: KehadiranStaffRow[] = Array.from({ length: 10 }).map((_, i) => {
    const day = 24 - i;
    const r = rand(idx + i + 41);
    const st: KehadiranStaffRow["status"] =
      r < 0.85 ? "Hadir" : r < 0.9 ? "Sakit" : r < 0.94 ? "Izin" : r < 0.98 ? "Dinas Luar" : "Alpa";
    const base: KehadiranStaffRow = {
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
      pemberi: pick(namaList, i + idx + 9),
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
    { waktu: "2 hari lalu", aktor: pick(namaList, idx + 9), aksi: "Menyelesaikan tugas inventarisasi", tone: "success" },
    { waktu: "5 hari lalu", aktor: "Sistem", aksi: "Mengirim pengingat kontrak akan berakhir", tone: "warning" },
  ];

  const tugasAktif = tugas.filter((t) => t.status !== "Selesai").length;
  const tugasSelesai = tugas.filter((t) => t.status === "Selesai").length;
  const jamKerja = 32 + Math.floor(rand(idx + 19) * 12);

  return {
    nip,
    nik: `3273${pad(idx * 41, 12)}`,
    namaLengkap: nama,
    jenisKelamin: gender,
    tempatLahir: pick(["Bandung","Jakarta","Surabaya","Semarang","Bogor","Depok","Bekasi"], idx),
    tanggalLahir: tglLahir,
    agama,
    kewarganegaraan: "WNI",
    status,
    departemen,
    jabatan,
    statusKepegawaian,
    tmtKerja: tmt,
    masaKontrakBerakhir: kontrakBerakhir,
    pendidikanTerakhir: pendidikan,
    jurusan: pendidikan === "SMA/SMK" ? "IPS" : pick(["Manajemen","Akuntansi","Teknik Informatika","Pendidikan","Administrasi"], idx),
    gajiPokok: gaji,
    tunjangan,
    atasan: pick(namaList, idx + 17),
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
    tugas,
    riwayatJabatan,
    pelatihan,
    dokumen,
    aktivitas,
    persenKehadiran: hadir,
    jumlahTugasAktif: tugasAktif,
    jumlahTugasSelesai: tugasSelesai,
    jamKerjaMingguIni: jamKerja,
  };
}

export const STAFF_LIST: Staff[] = Array.from({ length: 30 }, (_, i) => buildStaff(i));

export function findStaff(nip: string): Staff | undefined {
  return STAFF_LIST.find((s) => s.nip === nip);
}

const jabatanAll = Array.from(new Set(Object.values(jabatanByDept).flat()));

export const FILTER_OPTIONS = {
  status: ["Semua","Aktif","Cuti","Non-aktif","Pensiun","Kontrak Berakhir"] as const,
  jenisKelamin: ["Semua","Laki-laki","Perempuan"] as const,
  departemen: ["Semua", ...departemenList] as const,
  statusKepegawaian: ["Semua","PNS","PPPK","Tetap Yayasan","Kontrak","Honorer"] as const,
  jabatan: ["Semua", ...jabatanAll] as const,
};

export function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

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
