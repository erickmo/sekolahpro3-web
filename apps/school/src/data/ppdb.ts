// Mock data fixture untuk modul PPDB (Penerimaan Peserta Didik Baru).
// Replace dengan @sekolahpro/api-client hooks ketika backend siap.

export type StatusPendaftaran =
  | "Draft"
  | "Terkirim"
  | "Verifikasi"
  | "Tes"
  | "Lulus"
  | "Tidak Lulus"
  | "Daftar Ulang"
  | "Diterima"
  | "Mengundurkan Diri";
export type JalurPendaftaran =
  | "Reguler"
  | "Prestasi Akademik"
  | "Prestasi Non-Akademik"
  | "Afirmasi"
  | "Zonasi"
  | "Mutasi Orang Tua";
export type JenjangTujuan = "TK" | "SD" | "SMP" | "SMA";
export type JenisKelamin = "Laki-laki" | "Perempuan";
export type Agama = "Islam" | "Kristen" | "Katolik" | "Hindu" | "Budha" | "Konghucu";

export interface DokumenPpdbRow {
  nama: string;
  tipe:
    | "KK"
    | "Akta"
    | "KTP Ortu"
    | "Foto"
    | "Rapor"
    | "Ijazah"
    | "SKHU"
    | "Surat Sehat"
    | "Sertifikat Prestasi"
    | "Lainnya";
  status: "Belum" | "Diterima" | "Ditolak";
  catatan?: string | undefined;
  ukuran?: string | undefined;
  diunggah?: string | undefined;
}

export interface TahapanRow {
  tahap:
    | "Pendaftaran"
    | "Verifikasi Berkas"
    | "Tes Akademik"
    | "Wawancara"
    | "Pengumuman"
    | "Daftar Ulang";
  tanggal: string;
  status: "Selesai" | "Berjalan" | "Belum";
  catatan?: string | undefined;
  petugas?: string | undefined;
}

export interface NilaiRaporRow {
  semester: string;
  kelas: string;
  mapel: string;
  nilai: number;
}

export interface PembayaranPpdbRow {
  id: string;
  judul: "Biaya Pendaftaran" | "Uang Pangkal" | "SPP Pertama" | "Seragam" | "Buku";
  tanggal: string;
  jumlah: number;
  status: "Lunas" | "Tertunda" | "Cicilan";
  metode?: "Transfer" | "QRIS" | "Tunai" | "Virtual Account" | undefined;
}

export interface WawancaraRow {
  tanggal: string;
  jenis: "Calon Siswa" | "Orang Tua";
  pewawancara: string;
  skor: number;
  catatan?: string | undefined;
}

export interface AktivitasRow {
  waktu: string;
  aktor: string;
  aksi: string;
  tone: "neutral" | "brand" | "success" | "warning" | "danger";
}

export interface WaliPpdbRow {
  hubungan: "Ayah" | "Ibu" | "Wali";
  nama: string;
  nik?: string | undefined;
  pekerjaan?: string | undefined;
  penghasilan?: string | undefined;
  telepon?: string | undefined;
  email?: string | undefined;
}

export interface Pendaftar {
  noPendaftaran: string;
  namaLengkap: string;
  nisn?: string | undefined;
  nik?: string | undefined;
  jenisKelamin: JenisKelamin;
  tempatLahir: string;
  tanggalLahir: string;
  agama: Agama;
  kewarganegaraan: "WNI" | "WNA";
  jenjangTujuan: JenjangTujuan;
  jalur: JalurPendaftaran;
  asalSekolah: string;
  nilaiRataRata?: number | undefined;
  statusPendaftaran: StatusPendaftaran;
  tahunAjaran: string;
  tanggalDaftar: string;
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
  jarakKeSekolah?: string | undefined;
  biayaPendaftaran: number;
  totalBiaya: number;
  totalDibayar: number;
  skorTes?: number | undefined;
  skorWawancara?: number | undefined;
  rankingZonasi?: number | undefined;
  wali: WaliPpdbRow[];
  dokumen: DokumenPpdbRow[];
  tahapan: TahapanRow[];
  raporSmp: NilaiRaporRow[];
  pembayaran: PembayaranPpdbRow[];
  wawancara: WawancaraRow[];
  aktivitas: AktivitasRow[];
}

const namaList = [
  "Arka Pradipta", "Naya Kirana", "Bima Saputra", "Salsa Nabila", "Raka Wijaya",
  "Keisha Putri", "Daffa Hakim", "Alya Ramadhani", "Fadli Kurniawan", "Zahra Aulia",
  "Gilang Mahardika", "Tania Safitri", "Hafiz Rahman", "Nadia Permata", "Iqbal Maulana",
  "Citra Anindya", "Bagas Pratomo", "Mira Anjani", "Reza Pahlevi", "Indah Cahyani",
  "Yoga Pranata", "Aulia Rahmadhani", "Dimas Kurnia", "Salma Khairunnisa", "Rizki Aditya",
  "Vania Larasati", "Fauzan Hidayat", "Putri Maharani", "Adit Setiawan", "Najwa Salsabila",
];

const jenjangList: JenjangTujuan[] = ["TK", "SD", "SMP", "SMA"];
const jalurList: JalurPendaftaran[] = [
  "Reguler","Reguler","Reguler","Prestasi Akademik","Prestasi Non-Akademik","Afirmasi","Zonasi","Mutasi Orang Tua",
];
const statusList: StatusPendaftaran[] = [
  "Diterima","Diterima","Daftar Ulang","Lulus","Tes","Verifikasi","Terkirim","Draft","Tidak Lulus","Mengundurkan Diri",
];
const agamaList: Agama[] = ["Islam","Islam","Kristen","Katolik","Hindu","Budha"];
const asalSekolahList = [
  "SD Negeri 1","SD Negeri 5","SD Islam Al-Azhar","SD Tunas Bangsa",
  "SMP Negeri 1","SMP Negeri 5","SMP Islam Al-Azhar","SMP Tunas Bangsa",
];
const pewawancaraList = [
  "Dra. Siti Aminah, M.Pd.","Drs. Bambang Hartono","Hj. Yuliani, S.Pd.","Pak Hendra Wibowo","Bu Retno Lestari",
];

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

function buildPendaftar(idx: number): Pendaftar {
  const nama = namaList[idx % namaList.length]!;
  const tahun = 2026;
  const noPendaftaran = `PPDB-${tahun}-${pad(idx + 1, 6)}`;
  const nisn = `00${pad(2000000 + idx * 149, 7)}`;
  const gender: JenisKelamin = idx % 2 === 0 ? "Laki-laki" : "Perempuan";
  const status = statusList[idx % statusList.length]!;
  const jalur = pick(jalurList, idx + 5);
  const jenjang = pick(jenjangList, idx + 3);
  const agama = pick(agamaList, idx + 7);
  const tglLahir = `${2008 + (idx % 8)}-${pad((idx % 12) + 1, 2)}-${pad((idx % 27) + 1, 2)}`;
  const tanggalDaftar = `2026-${pad(((idx % 5) + 1), 2)}-${pad((idx % 27) + 1, 2)}`;
  const nilaiRata = 70 + Math.floor(rand(idx + 11) * 28);
  const skorTes = status === "Draft" || status === "Terkirim" ? undefined : 60 + Math.floor(rand(idx + 13) * 38);
  const skorWawancara = status === "Draft" || status === "Terkirim" || status === "Verifikasi" ? undefined : 60 + Math.floor(rand(idx + 17) * 38);
  const rankingZonasi = jalur === "Zonasi" ? (idx % 50) + 1 : undefined;

  const biayaPendaftaran = 250000;
  const uangPangkal = 5000000 + (idx % 5) * 1000000;
  const sppPertama = 750000;
  const seragam = 1200000;
  const buku = 800000;
  const totalBiaya = biayaPendaftaran + uangPangkal + sppPertama + seragam + buku;

  // Tentukan pembayaran berdasarkan status
  const pembayaran: PembayaranPpdbRow[] = [];
  pembayaran.push({
    id: `PAY-${noPendaftaran}-01`,
    judul: "Biaya Pendaftaran",
    tanggal: tanggalDaftar,
    jumlah: biayaPendaftaran,
    status: status === "Draft" ? "Tertunda" : "Lunas",
    metode: "QRIS",
  });
  if (status === "Diterima" || status === "Daftar Ulang") {
    pembayaran.push({ id: `PAY-${noPendaftaran}-02`, judul: "Uang Pangkal", tanggal: "2026-05-10", jumlah: uangPangkal, status: idx % 3 === 0 ? "Cicilan" : "Lunas", metode: "Transfer" });
    pembayaran.push({ id: `PAY-${noPendaftaran}-03`, judul: "Seragam", tanggal: "2026-05-12", jumlah: seragam, status: idx % 4 === 0 ? "Tertunda" : "Lunas", metode: "Virtual Account" });
    pembayaran.push({ id: `PAY-${noPendaftaran}-04`, judul: "Buku", tanggal: "2026-05-15", jumlah: buku, status: idx % 5 === 0 ? "Tertunda" : "Lunas", metode: "Transfer" });
  }
  if (status === "Diterima") {
    pembayaran.push({ id: `PAY-${noPendaftaran}-05`, judul: "SPP Pertama", tanggal: "2026-07-01", jumlah: sppPertama, status: "Lunas", metode: "Transfer" });
  }
  const totalDibayar = pembayaran
    .filter((p) => p.status === "Lunas")
    .reduce((s, p) => s + p.jumlah, 0)
    + pembayaran.filter((p) => p.status === "Cicilan").reduce((s, p) => s + Math.floor(p.jumlah / 2), 0);

  const dokumen: DokumenPpdbRow[] = [
    { nama: "Kartu Keluarga.pdf", tipe: "KK", status: status === "Draft" ? "Belum" : "Diterima", ukuran: "512 KB", diunggah: tanggalDaftar },
    { nama: "Akta Kelahiran.pdf", tipe: "Akta", status: status === "Draft" ? "Belum" : "Diterima", ukuran: "324 KB", diunggah: tanggalDaftar },
    { nama: "KTP Orang Tua.pdf", tipe: "KTP Ortu", status: status === "Draft" || status === "Terkirim" ? "Belum" : "Diterima", ukuran: "428 KB", diunggah: tanggalDaftar },
    { nama: "Pas Foto 3x4.jpg", tipe: "Foto", status: status === "Draft" ? "Belum" : "Diterima", ukuran: "128 KB", diunggah: tanggalDaftar },
    { nama: "Rapor 5 Semester.pdf", tipe: "Rapor", status: status === "Draft" || status === "Terkirim" ? "Belum" : (idx % 9 === 0 ? "Ditolak" : "Diterima"), catatan: idx % 9 === 0 ? "Scan kurang jelas, mohon unggah ulang" : undefined, ukuran: "1.2 MB", diunggah: tanggalDaftar },
    { nama: "Ijazah SD.pdf", tipe: "Ijazah", status: jenjang === "SMP" || jenjang === "SMA" ? (status === "Draft" ? "Belum" : "Diterima") : "Belum", ukuran: "612 KB", diunggah: tanggalDaftar },
    { nama: "Surat Keterangan Sehat.pdf", tipe: "Surat Sehat", status: status === "Daftar Ulang" || status === "Diterima" ? "Diterima" : "Belum", ukuran: "256 KB", diunggah: status === "Daftar Ulang" || status === "Diterima" ? "2026-05-08" : undefined },
    { nama: "Sertifikat Juara.pdf", tipe: "Sertifikat Prestasi", status: jalur === "Prestasi Akademik" || jalur === "Prestasi Non-Akademik" ? "Diterima" : "Belum", ukuran: "412 KB", diunggah: jalur.startsWith("Prestasi") ? tanggalDaftar : undefined },
  ];

  const tahapanList: TahapanRow["tahap"][] = ["Pendaftaran","Verifikasi Berkas","Tes Akademik","Wawancara","Pengumuman","Daftar Ulang"];
  const currentStepIdx =
    status === "Draft" ? 0 :
    status === "Terkirim" ? 0 :
    status === "Verifikasi" ? 1 :
    status === "Tes" ? 2 :
    status === "Lulus" ? 4 :
    status === "Tidak Lulus" ? 4 :
    status === "Daftar Ulang" ? 5 :
    status === "Diterima" ? 5 :
    status === "Mengundurkan Diri" ? 5 :
    0;
  const tahapan: TahapanRow[] = tahapanList.map((t, i) => {
    const st: TahapanRow["status"] = i < currentStepIdx ? "Selesai" : i === currentStepIdx ? "Berjalan" : "Belum";
    const base: TahapanRow = {
      tahap: t,
      tanggal: `2026-${pad(((i % 6) + 3), 2)}-${pad((i * 4) + 5, 2)}`,
      status: st,
    };
    if (st !== "Belum") {
      base.petugas = pick(pewawancaraList, idx + i);
      base.catatan = i === currentStepIdx ? "Dalam proses penanganan tim PPDB" : "Selesai tepat waktu";
    }
    return base;
  });

  const raporSmp: NilaiRaporRow[] =
    jenjang === "SMA"
      ? Array.from({ length: 10 }).map((_, i) => {
          const semesterIdx = Math.floor(i / 2) + 1;
          const mapel = pick(["Matematika","Bahasa Indonesia","Bahasa Inggris","IPA","IPS"], i + idx);
          return {
            semester: `Semester ${semesterIdx}`,
            kelas: `${semesterIdx <= 2 ? "VII" : semesterIdx <= 4 ? "VIII" : "IX"}`,
            mapel,
            nilai: 70 + Math.floor(rand(idx + i + 23) * 25),
          };
        })
      : [];

  const wawancara: WawancaraRow[] = skorWawancara !== undefined
    ? [
        { tanggal: "2026-05-05", jenis: "Calon Siswa", pewawancara: pick(pewawancaraList, idx), skor: skorWawancara, catatan: "Komunikasi baik, percaya diri" },
        { tanggal: "2026-05-06", jenis: "Orang Tua", pewawancara: pick(pewawancaraList, idx + 1), skor: skorWawancara - 3, catatan: "Mendukung penuh program sekolah" },
      ]
    : [];

  const aktivitas: AktivitasRow[] = [
    { waktu: "Hari ini, 10:15", aktor: "Panitia PPDB", aksi: "Memverifikasi berkas pendaftaran", tone: "brand" },
    { waktu: "Kemarin, 14:30", aktor: "Sistem", aksi: "Mengirim email konfirmasi pendaftaran", tone: "neutral" },
    { waktu: "2 hari lalu", aktor: pick(pewawancaraList, idx + 9), aksi: "Menjadwalkan wawancara calon siswa", tone: "success" },
    { waktu: "5 hari lalu", aktor: "Sistem", aksi: "Mengirim pengingat kelengkapan dokumen", tone: "warning" },
  ];

  const wali: WaliPpdbRow[] = [
    {
      hubungan: "Ayah",
      nama: pick(namaList, idx + 17),
      nik: `3273${pad(idx * 37, 12)}`,
      pekerjaan: pick(["Pegawai Swasta","Wirausaha","Guru","PNS","Petani"], idx),
      penghasilan: pick(["Rp 2-5 juta","Rp 5-10 juta","> Rp 10 juta"], idx + 1),
      telepon: `0812${pad(idx * 117, 8)}`,
      email: `ayah.${nama.split(" ")[0]!.toLowerCase()}@email.com`,
    },
    {
      hubungan: "Ibu",
      nama: pick(namaList, idx + 23),
      nik: `3273${pad(idx * 41, 12)}`,
      pekerjaan: pick(["Ibu Rumah Tangga","Wirausaha","Guru","Karyawan Swasta"], idx + 2),
      telepon: `0813${pad(idx * 121, 8)}`,
    },
  ];

  const result: Pendaftar = {
    noPendaftaran,
    namaLengkap: nama,
    nisn,
    nik: `3273${pad(idx * 53, 12)}`,
    jenisKelamin: gender,
    tempatLahir: pick(["Bandung","Jakarta","Surabaya","Semarang","Bogor","Depok","Bekasi"], idx),
    tanggalLahir: tglLahir,
    agama,
    kewarganegaraan: "WNI",
    jenjangTujuan: jenjang,
    jalur,
    asalSekolah: pick(asalSekolahList, idx),
    nilaiRataRata: nilaiRata,
    statusPendaftaran: status,
    tahunAjaran: `${tahun}/${tahun + 1}`,
    tanggalDaftar,
    alamat: `Jl. Pelajar No. ${idx + 1}`,
    rt: pad((idx % 12) + 1, 2),
    rw: pad((idx % 8) + 1, 2),
    desa: pick(["Sukamaju","Cibadak","Cikutra","Antapani","Ujungberung"], idx),
    kecamatan: pick(["Coblong","Cibeunying","Kiaracondong","Sukasari"], idx),
    kabupaten: "Kota Bandung",
    provinsi: "Jawa Barat",
    kodePos: `4012${idx % 10}`,
    telepon: `0822${pad(idx * 73, 8)}`,
    email: `${nama.split(" ").join(".").toLowerCase()}@ppdb.sekolahpro.id`,
    jarakKeSekolah: pick(["<1 km","1-3 km","3-5 km","5-10 km"], idx),
    biayaPendaftaran,
    totalBiaya,
    totalDibayar,
    wali,
    dokumen,
    tahapan,
    raporSmp,
    pembayaran,
    wawancara,
    aktivitas,
  };
  if (skorTes !== undefined) result.skorTes = skorTes;
  if (skorWawancara !== undefined) result.skorWawancara = skorWawancara;
  if (rankingZonasi !== undefined) result.rankingZonasi = rankingZonasi;
  return result;
}

export const PPDB_LIST: Pendaftar[] = Array.from({ length: 35 }, (_, i) => buildPendaftar(i));

export function findPendaftar(noPendaftaran: string): Pendaftar | undefined {
  return PPDB_LIST.find((p) => p.noPendaftaran === noPendaftaran);
}

export const FILTER_OPTIONS = {
  statusPendaftaran: ["Semua","Draft","Terkirim","Verifikasi","Tes","Lulus","Tidak Lulus","Daftar Ulang","Diterima","Mengundurkan Diri"] as const,
  jalur: ["Semua","Reguler","Prestasi Akademik","Prestasi Non-Akademik","Afirmasi","Zonasi","Mutasi Orang Tua"] as const,
  jenjangTujuan: ["Semua","TK","SD","SMP","SMA"] as const,
  jenisKelamin: ["Semua","Laki-laki","Perempuan"] as const,
  tahunAjaran: ["Semua","2025/2026","2026/2027","2027/2028"] as const,
  agama: ["Semua","Islam","Kristen","Katolik","Hindu","Budha","Konghucu"] as const,
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
