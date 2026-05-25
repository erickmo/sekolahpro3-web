// Mock data fixture untuk modul Kelas (rombel).
// Replace dengan @sekolahpro/api-client hooks ketika backend siap.

export type StatusKelas = "Aktif" | "Penuh" | "Arsip";
export type Jenjang = "TK" | "SD" | "SMP" | "SMA";
export type Tingkat = "X" | "XI" | "XII" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
export type JurusanSma = "IPA" | "IPS" | "Bahasa" | "—";

export interface SiswaKelasRow {
  nis: string;
  nama: string;
  jenisKelamin: "L" | "P";
  status: "Aktif" | "Mutasi" | "Cuti";
  rataNilai: number;
  persenKehadiran: number;
}

export interface JadwalMapelRow {
  hari: "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu";
  jam: string;
  mapel: string;
  guru: string;
  ruang: string;
}

export interface RekapNilaiRow {
  mapel: string;
  rataKelas: number;
  tertinggi: number;
  terendah: number;
  lulus: number;
  jumlahSiswa: number;
}

export interface RekapAbsensiRow {
  tanggal: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  terlambat: number;
}

export interface JurnalKelasRow {
  tanggal: string;
  jam: string;
  mapel: string;
  guru: string;
  materi: string;
  catatan?: string | undefined;
}

export interface AktivitasRow {
  waktu: string;
  aktor: string;
  aksi: string;
  tone: "neutral" | "brand" | "success" | "warning" | "danger";
}

export interface Kelas {
  kodeKelas: string;
  nama: string;
  jenjang: Jenjang;
  tingkat: Tingkat;
  jurusan?: JurusanSma | undefined;
  rombel: "A" | "B" | "C" | "D";
  waliKelas: string;
  waliKelasNip: string;
  ruang: string;
  kapasitas: number;
  jumlahSiswa: number;
  jumlahLaki: number;
  jumlahPerempuan: number;
  tahunAjaran: string;
  semester: "Ganjil" | "Genap";
  status: StatusKelas;
  rataNilai: number;
  persenKehadiran: number;
  jamPelajaranPerMinggu: number;
  jumlahMapel: number;
  siswa: SiswaKelasRow[];
  jadwal: JadwalMapelRow[];
  rekapNilai: RekapNilaiRow[];
  rekapAbsensi: RekapAbsensiRow[];
  jurnal: JurnalKelasRow[];
  aktivitas: AktivitasRow[];
}

const siswaNamaList = [
  "Budi Santoso", "Rina Anggraini", "Dewi Lestari", "Ahmad Fauzi", "Siti Nurhaliza",
  "Andi Pratama", "Maya Sari", "Reza Maulana", "Nia Ramadhani", "Bagas Wicaksono",
  "Putri Ayu", "Hendra Gunawan", "Tiara Putri", "Fajar Sidik", "Lestari Wulandari",
  "Galih Permana", "Sinta Dewi", "Yusuf Mahendra", "Anisa Rahmawati", "Rizky Hidayat",
  "Citra Kirana", "Eko Prasetyo", "Vania Sabrina", "Aldi Taher", "Bunga Citra",
  "Dimas Anggara", "Selena Putri", "Iqbal Ramadhan", "Mawar Eva", "Aril Noah",
  "Jessica Mila", "Verrel Bramasta", "Aurel Hermansyah", "Atta Halilintar", "Lesti Kejora",
  "Rizky Billar", "Nadya Mustika", "Marshanda Saputri", "Raffi Ahmad", "Nagita Slavina",
];

const guruNamaList = [
  "Dr. Sutrisno, M.Pd.", "Hj. Siti Aminah, S.Pd.", "H. Bambang Supardi, M.M.",
  "Dra. Endang Wahyuni", "Drs. Hendro Wibowo", "Ratna Sari, S.Pd.",
  "Eko Susanto, M.Pd.", "Hj. Nur Hidayah, S.Ag.", "Agus Riyanto, S.Si.",
  "Yuni Astuti, S.Pd.", "Slamet Riyadi, M.Pd.", "Indah Permatasari, S.Pd.",
  "Joko Pramono, S.Kom.", "Dewi Lestari, M.Pd.", "Anwar Sanusi, S.Pd.",
  "Sri Wahyuningsih, S.Pd.", "Bayu Aji, M.Pd.", "Tuti Handayani, S.Pd.",
  "Heri Susanto, S.Pd.", "Lina Marlina, S.Pd.", "Dedi Kurniawan, M.Pd.",
  "Wati Suryani, S.Pd.", "Rahmat Hidayat, S.Pd.", "Nuraini Sholihah, S.Ag.",
];

const mapelSma = ["Matematika","Bahasa Indonesia","Bahasa Inggris","Fisika","Kimia","Biologi","Sejarah","PKn","Seni Budaya","Penjas","Agama","TIK"];
const mapelSmp = ["Matematika","Bahasa Indonesia","Bahasa Inggris","IPA","IPS","Sejarah","PKn","Seni Budaya","Penjas","Agama","TIK","Prakarya"];
const mapelSd  = ["Matematika","Bahasa Indonesia","Tematik","IPA","IPS","PKn","Seni Budaya","Penjas","Agama","B. Daerah"];
const mapelTk  = ["Bahasa","Kognitif","Motorik","Sosial","Seni","Agama"];

const hariList: JadwalMapelRow["hari"][] = ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
const jamSlot = ["07:00 - 07:45","07:45 - 08:30","08:30 - 09:15","09:30 - 10:15","10:15 - 11:00","11:00 - 11:45","12:30 - 13:15","13:15 - 14:00"];

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

interface KelasSeed {
  jenjang: Jenjang;
  tingkat: Tingkat;
  jurusan: JurusanSma;
}

const KELAS_SEEDS: KelasSeed[] = [
  // SMA — 9 kelas (X/XI/XII × IPA/IPS/Bahasa)
  { jenjang: "SMA", tingkat: "X",   jurusan: "IPA" },
  { jenjang: "SMA", tingkat: "X",   jurusan: "IPA" },
  { jenjang: "SMA", tingkat: "X",   jurusan: "IPS" },
  { jenjang: "SMA", tingkat: "XI",  jurusan: "IPA" },
  { jenjang: "SMA", tingkat: "XI",  jurusan: "IPA" },
  { jenjang: "SMA", tingkat: "XI",  jurusan: "IPS" },
  { jenjang: "SMA", tingkat: "XII", jurusan: "IPA" },
  { jenjang: "SMA", tingkat: "XII", jurusan: "IPS" },
  { jenjang: "SMA", tingkat: "XII", jurusan: "Bahasa" },
  // SMP — 6 kelas
  { jenjang: "SMP", tingkat: "7", jurusan: "—" },
  { jenjang: "SMP", tingkat: "7", jurusan: "—" },
  { jenjang: "SMP", tingkat: "8", jurusan: "—" },
  { jenjang: "SMP", tingkat: "8", jurusan: "—" },
  { jenjang: "SMP", tingkat: "9", jurusan: "—" },
  { jenjang: "SMP", tingkat: "9", jurusan: "—" },
  // SD — 7 kelas
  { jenjang: "SD", tingkat: "1", jurusan: "—" },
  { jenjang: "SD", tingkat: "2", jurusan: "—" },
  { jenjang: "SD", tingkat: "3", jurusan: "—" },
  { jenjang: "SD", tingkat: "4", jurusan: "—" },
  { jenjang: "SD", tingkat: "5", jurusan: "—" },
  { jenjang: "SD", tingkat: "5", jurusan: "—" },
  { jenjang: "SD", tingkat: "6", jurusan: "—" },
  // TK — 2 kelas
  { jenjang: "TK", tingkat: "1", jurusan: "—" },
  { jenjang: "TK", tingkat: "2", jurusan: "—" },
];

const ROMBEL_CYCLE: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];

function mapelByJenjang(j: Jenjang): string[] {
  if (j === "SMA") return mapelSma;
  if (j === "SMP") return mapelSmp;
  if (j === "SD") return mapelSd;
  return mapelTk;
}

function buildSiswaKelasRows(idx: number, jumlah: number): SiswaKelasRow[] {
  return Array.from({ length: jumlah }).map((_, i) => {
    const seed = idx * 97 + i + 11;
    const nama = siswaNamaList[(idx * 7 + i) % siswaNamaList.length]!;
    const jk: "L" | "P" = i % 2 === 0 ? "L" : "P";
    const r = rand(seed);
    const status: SiswaKelasRow["status"] = r < 0.9 ? "Aktif" : r < 0.96 ? "Mutasi" : "Cuti";
    const nis = `${2024 - (idx % 3)}${pad(idx * 40 + i + 1, 4)}`;
    return {
      nis,
      nama,
      jenisKelamin: jk,
      status,
      rataNilai: 70 + Math.floor(rand(seed + 3) * 25),
      persenKehadiran: 78 + Math.floor(rand(seed + 5) * 20),
    };
  });
}

function buildJadwal(idx: number, jenjang: Jenjang, ruang: string): JadwalMapelRow[] {
  const mapelList = mapelByJenjang(jenjang);
  const rows: JadwalMapelRow[] = [];
  const hariCount = jenjang === "TK" ? 5 : 6;
  for (let h = 0; h < hariCount; h++) {
    const hari = hariList[h]!;
    const slot = jenjang === "SD" || jenjang === "TK" ? 4 : 6;
    for (let s = 0; s < slot; s++) {
      const seed = idx * 113 + h * 17 + s + 3;
      rows.push({
        hari,
        jam: jamSlot[s % jamSlot.length]!,
        mapel: pick(mapelList, seed),
        guru: pick(guruNamaList, seed + 1),
        ruang,
      });
    }
  }
  return rows;
}

function buildRekapNilai(idx: number, jenjang: Jenjang, jumlahSiswa: number): RekapNilaiRow[] {
  return mapelByJenjang(jenjang).slice(0, 8).map((m, i) => {
    const seed = idx * 53 + i + 19;
    const rata = 72 + Math.floor(rand(seed) * 20);
    const tertinggi = Math.min(99, rata + 8 + Math.floor(rand(seed + 1) * 7));
    const terendah = Math.max(40, rata - 15 - Math.floor(rand(seed + 2) * 8));
    const lulus = Math.max(0, jumlahSiswa - Math.floor(rand(seed + 3) * 4));
    return { mapel: m, rataKelas: rata, tertinggi, terendah, lulus, jumlahSiswa };
  });
}

function buildRekapAbsensi(idx: number, jumlahSiswa: number): RekapAbsensiRow[] {
  return Array.from({ length: 10 }).map((_, i) => {
    const day = 24 - i;
    const seed = idx * 41 + i + 7;
    const sakit = Math.floor(rand(seed) * 3);
    const izin = Math.floor(rand(seed + 1) * 2);
    const alpa = Math.floor(rand(seed + 2) * 2);
    const terlambat = Math.floor(rand(seed + 3) * 3);
    const hadir = Math.max(0, jumlahSiswa - sakit - izin - alpa);
    return {
      tanggal: `2026-05-${pad(day, 2)}`,
      hadir,
      sakit,
      izin,
      alpa,
      terlambat,
    };
  });
}

function buildJurnal(idx: number, jenjang: Jenjang): JurnalKelasRow[] {
  const mapelList = mapelByJenjang(jenjang);
  return Array.from({ length: 8 }).map((_, i) => {
    const seed = idx * 29 + i + 5;
    const day = 24 - i;
    const r: JurnalKelasRow = {
      tanggal: `2026-05-${pad(day, 2)}`,
      jam: jamSlot[i % jamSlot.length]!,
      mapel: pick(mapelList, seed),
      guru: pick(guruNamaList, seed + 1),
      materi: pick(
        [
          "Bab 3 - Latihan soal",
          "Praktikum dasar",
          "Diskusi kelompok",
          "Presentasi tugas",
          "Ujian harian",
          "Pengayaan materi",
          "Remedial",
        ],
        seed + 2,
      ),
    };
    if (i % 3 === 0) r.catatan = "3 siswa belum mengumpulkan tugas";
    return r;
  });
}

function buildAktivitas(idx: number): AktivitasRow[] {
  return [
    { waktu: "Hari ini, 08:30", aktor: pick(guruNamaList, idx + 3), aksi: "Mencatat jurnal mengajar", tone: "brand" },
    { waktu: "Hari ini, 07:15", aktor: "Sistem", aksi: "Memperbarui rekap absensi pagi", tone: "neutral" },
    { waktu: "Kemarin, 15:40", aktor: pick(guruNamaList, idx + 5), aksi: "Menginput nilai ulangan harian", tone: "success" },
    { waktu: "Kemarin, 09:00", aktor: "Wakil Kurikulum", aksi: "Menyesuaikan jadwal pelajaran", tone: "warning" },
    { waktu: "3 hari lalu", aktor: pick(guruNamaList, idx + 7), aksi: "Mengubah wali kelas sementara", tone: "neutral" },
  ];
}

function namaKelas(seed: KelasSeed, rombel: string): { kode: string; nama: string } {
  if (seed.jenjang === "SMA") {
    const kode = `${seed.tingkat}-${seed.jurusan}-${rombel}`;
    const nama = `${seed.tingkat} ${seed.jurusan} - Rombel ${rombel}`;
    return { kode, nama };
  }
  if (seed.jenjang === "SMP") {
    const kode = `SMP-${seed.tingkat}-${rombel}`;
    const nama = `Kelas ${seed.tingkat} - Rombel ${rombel}`;
    return { kode, nama };
  }
  if (seed.jenjang === "SD") {
    const kode = `SD-${seed.tingkat}-${rombel}`;
    const nama = `Kelas ${seed.tingkat} - Rombel ${rombel}`;
    return { kode, nama };
  }
  const kode = `TK-${seed.tingkat === "1" ? "A" : "B"}-${rombel}`;
  const nama = `TK ${seed.tingkat === "1" ? "A" : "B"} - Rombel ${rombel}`;
  return { kode, nama };
}

function ruangByJenjang(j: Jenjang, idx: number): string {
  if (j === "SMA") return `R-${201 + (idx % 12)}`;
  if (j === "SMP") return `R-${101 + (idx % 8)}`;
  if (j === "SD") return `R-${1 + (idx % 12)}`;
  return `R-TK-${(idx % 4) + 1}`;
}

function buildKelas(idx: number): Kelas {
  const seed = KELAS_SEEDS[idx % KELAS_SEEDS.length]!;
  const rombel = ROMBEL_CYCLE[idx % 4]!;
  const { kode, nama } = namaKelas(seed, rombel);
  const ruang = ruangByJenjang(seed.jenjang, idx);
  const wali = guruNamaList[idx % guruNamaList.length]!;
  const waliNip = `1985${pad(idx * 31, 6)}${pad(idx + 1, 3)}`;
  const kapasitas = seed.jenjang === "TK" ? 20 : seed.jenjang === "SD" ? 30 : 36;
  const jumlahSiswa = Math.max(10, kapasitas - Math.floor(rand(idx + 11) * 6));
  const jumlahLaki = Math.floor(jumlahSiswa / 2) + (idx % 3 === 0 ? 1 : 0);
  const jumlahPerempuan = jumlahSiswa - jumlahLaki;
  const rata = 72 + Math.floor(rand(idx + 13) * 18);
  const hadir = 82 + Math.floor(rand(idx + 17) * 15);
  const tahunBase = 2024 + (idx % 2);
  const tahunAjaran = `${tahunBase}/${tahunBase + 1}`;
  const semester: "Ganjil" | "Genap" = idx % 2 === 0 ? "Ganjil" : "Genap";
  const r = rand(idx + 23);
  const status: StatusKelas =
    jumlahSiswa >= kapasitas - 1 ? "Penuh" :
    r < 0.08 ? "Arsip" : "Aktif";
  const jamPelajaran = seed.jenjang === "TK" ? 18 : seed.jenjang === "SD" ? 28 : seed.jenjang === "SMP" ? 36 : 42;
  const mapelList = mapelByJenjang(seed.jenjang);

  const kelas: Kelas = {
    kodeKelas: kode,
    nama,
    jenjang: seed.jenjang,
    tingkat: seed.tingkat,
    rombel,
    waliKelas: wali,
    waliKelasNip: waliNip,
    ruang,
    kapasitas,
    jumlahSiswa,
    jumlahLaki,
    jumlahPerempuan,
    tahunAjaran,
    semester,
    status,
    rataNilai: rata,
    persenKehadiran: hadir,
    jamPelajaranPerMinggu: jamPelajaran,
    jumlahMapel: mapelList.length,
    siswa: buildSiswaKelasRows(idx, jumlahSiswa),
    jadwal: buildJadwal(idx, seed.jenjang, ruang),
    rekapNilai: buildRekapNilai(idx, seed.jenjang, jumlahSiswa),
    rekapAbsensi: buildRekapAbsensi(idx, jumlahSiswa),
    jurnal: buildJurnal(idx, seed.jenjang),
    aktivitas: buildAktivitas(idx),
  };
  if (seed.jenjang === "SMA") kelas.jurusan = seed.jurusan;
  return kelas;
}

export const KELAS_LIST: Kelas[] = Array.from({ length: 24 }, (_, i) => buildKelas(i));

export function findKelas(kodeKelas: string): Kelas | undefined {
  return KELAS_LIST.find((k) => k.kodeKelas === kodeKelas);
}

export const FILTER_OPTIONS = {
  status: ["Semua", "Aktif", "Penuh", "Arsip"] as const,
  jenjang: ["Semua", "TK", "SD", "SMP", "SMA"] as const,
  tingkat: ["Semua", "X", "XI", "XII", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const,
  jurusan: ["Semua", "IPA", "IPS", "Bahasa", "—"] as const,
  tahunAjaran: ["Semua", "2024/2025", "2025/2026"] as const,
  semester: ["Semua", "Ganjil", "Genap"] as const,
};

export function formatTanggal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
