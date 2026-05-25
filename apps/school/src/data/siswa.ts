// Mock data fixture untuk modul Siswa.
// Replace dengan @sekolahpro/api-client hooks ketika backend siap.

export type StatusSiswa = "Calon" | "Aktif" | "Alumni" | "Pindah Keluar" | "DO";
export type JenisKelamin = "Laki-laki" | "Perempuan";
export type Agama = "Islam" | "Kristen" | "Katolik" | "Hindu" | "Budha" | "Konghucu";

export interface WaliRow {
  hubungan: "Ayah" | "Ibu" | "Wali";
  nama: string;
  nik?: string | undefined;
  pekerjaan?: string | undefined;
  penghasilan?: string | undefined;
  pendidikan?: string | undefined;
  telepon?: string | undefined;
  email?: string | undefined;
  alamat?: string | undefined;
}

export interface NilaiRow {
  mapel: string;
  guru: string;
  pengetahuan: number;
  keterampilan: number;
  predikat: "A" | "B" | "C" | "D";
}

export interface AbsensiRow {
  tanggal: string;
  status: "Hadir" | "Sakit" | "Izin" | "Alpa" | "Terlambat";
  keterangan?: string | undefined;
  pencatat: string;
}

export interface TagihanRow {
  id: string;
  judul: string;
  jatuhTempo: string;
  jumlah: number;
  status: "Lunas" | "Tertunda" | "Jatuh Tempo" | "Cicilan";
  dibayar?: number | undefined;
}

export interface PembayaranRow {
  id: string;
  tanggal: string;
  metode: "Tunai" | "Transfer" | "QRIS" | "Virtual Account";
  jumlah: number;
  ref: string;
  penerima: string;
}

export interface MutasiRow {
  tanggal: string;
  jenis: "Naik Kelas" | "Tinggal Kelas" | "Pindah Keluar" | "DO" | "Masuk";
  dari?: string | undefined;
  ke?: string | undefined;
  keterangan?: string | undefined;
}

export interface DokumenRow {
  nama: string;
  tipe: "Ijazah" | "Akta" | "KK" | "KTP" | "Foto" | "Rapor" | "Lainnya";
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

export interface Siswa {
  nis: string;
  nisn: string;
  nik?: string | undefined;
  namaLengkap: string;
  namaPanggilan?: string | undefined;
  jenisKelamin: JenisKelamin;
  tempatLahir: string;
  tanggalLahir: string;
  agama: Agama;
  kewarganegaraan: "WNI" | "WNA";
  status: StatusSiswa;
  jenjang: string;
  kelas: string;
  rombel: string;
  tahunMasuk: string;
  asalSekolah?: string | undefined;
  noSttb?: string | undefined;
  tanggalDiterima?: string | undefined;
  kebutuhanKhusus?: string | undefined;
  alatTransportasi?: string | undefined;
  jarakRumah?: string | undefined;
  waktuTempuh?: string | undefined;
  penghasilanOrtu?: string | undefined;
  penerimaKip?: boolean | undefined;
  noKip?: string | undefined;
  penerimaKps?: boolean | undefined;
  noKps?: string | undefined;
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
  wali: WaliRow[];
  // Relasi
  nilai: NilaiRow[];
  absensi: AbsensiRow[];
  tagihan: TagihanRow[];
  pembayaran: PembayaranRow[];
  mutasi: MutasiRow[];
  dokumen: DokumenRow[];
  aktivitas: AktivitasRow[];
  // Ringkasan
  rataNilai: number;
  persenKehadiran: number;
  saldoTagihan: number;
}

const namaList = [
  "Budi Santoso", "Rina Anggraini", "Dewi Lestari", "Ahmad Fauzi", "Siti Nurhaliza",
  "Andi Pratama", "Maya Sari", "Reza Maulana", "Nia Ramadhani", "Bagas Wicaksono",
  "Putri Ayu", "Hendra Gunawan", "Tiara Putri", "Fajar Sidik", "Lestari Wulandari",
  "Galih Permana", "Sinta Dewi", "Yusuf Mahendra", "Anisa Rahmawati", "Rizky Hidayat",
  "Citra Kirana", "Eko Prasetyo", "Vania Sabrina", "Aldi Taher", "Bunga Citra",
  "Dimas Anggara", "Selena Putri", "Iqbal Ramadhan", "Mawar Eva", "Aril Noah",
  "Jessica Mila", "Verrel Bramasta", "Aurel Hermansyah", "Atta Halilintar", "Lesti Kejora",
  "Rizky Billar", "Nadya Mustika", "Marshanda Saputri", "Raffi Ahmad", "Nagita Slavina",
];

const kelasList = ["X-IPA-1","X-IPA-2","X-IPS-1","XI-IPA-1","XI-IPA-2","XI-IPS-1","XII-IPA-1","XII-IPA-2","XII-IPS-1"];
const jenjangList = ["SMA"];
const statusList: StatusSiswa[] = ["Aktif","Aktif","Aktif","Aktif","Aktif","Aktif","Aktif","Calon","Alumni","Pindah Keluar"];
const agamaList: Agama[] = ["Islam","Islam","Kristen","Katolik","Hindu","Budha"];

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

function buildSiswa(idx: number): Siswa {
  const nama = namaList[idx % namaList.length]!;
  const tahun = 2022 + (idx % 4);
  const nis = `${tahun}${pad(idx + 1, 4)}`;
  const nisn = `00${pad(1000000 + idx * 137, 7)}`;
  const gender: JenisKelamin = idx % 2 === 0 ? "Laki-laki" : "Perempuan";
  const status = statusList[idx % statusList.length]!;
  const kelas = pick(kelasList, idx + 7);
  const rombel = `${kelas} ${idx % 2 === 0 ? "A" : "B"}`;
  const agama = pick(agamaList, idx + 3);
  const tglLahir = `200${5 + (idx % 5)}-${pad((idx % 12) + 1, 2)}-${pad((idx % 27) + 1, 2)}`;
  const rata = 70 + Math.floor(rand(idx + 11) * 25);
  const hadir = 80 + Math.floor(rand(idx + 13) * 18);
  const saldo = idx % 5 === 0 ? 0 : Math.floor(rand(idx + 17) * 6) * 250000;

  const nilai: NilaiRow[] = [
    "Matematika","Bahasa Indonesia","Bahasa Inggris","Fisika","Kimia","Biologi","Sejarah","PKn","Seni Budaya"
  ].map((m, i) => {
    const v = 70 + Math.floor(rand(idx + i + 23) * 25);
    const v2 = 70 + Math.floor(rand(idx + i + 31) * 25);
    const avg = (v + v2) / 2;
    const pred: "A" | "B" | "C" | "D" = avg >= 90 ? "A" : avg >= 80 ? "B" : avg >= 70 ? "C" : "D";
    return { mapel: m, guru: pick(namaList, i + idx + 5), pengetahuan: v, keterampilan: v2, predikat: pred };
  });

  const absensi: AbsensiRow[] = Array.from({ length: 10 }).map((_, i) => {
    const day = 24 - i;
    const r = rand(idx + i + 41);
    const st: AbsensiRow["status"] =
      r < 0.85 ? "Hadir" : r < 0.9 ? "Sakit" : r < 0.94 ? "Izin" : r < 0.97 ? "Terlambat" : "Alpa";
    const base: AbsensiRow = {
      tanggal: `2026-05-${pad(day, 2)}`,
      status: st,
      pencatat: pick(namaList, i + idx),
    };
    if (st !== "Hadir") base.keterangan = "Surat keterangan diterima";
    return base;
  });

  const tagihan: TagihanRow[] = [
    { id: `INV-${nis}-01`, judul: "SPP Mei 2026", jatuhTempo: "2026-05-10", jumlah: 750000, status: idx % 5 === 0 ? "Lunas" : "Tertunda" },
    { id: `INV-${nis}-02`, judul: "Uang Kegiatan Semester", jatuhTempo: "2026-04-30", jumlah: 500000, status: "Lunas", dibayar: 500000 },
    { id: `INV-${nis}-03`, judul: "Seragam Tahun Ajaran Baru", jatuhTempo: "2026-07-15", jumlah: 1200000, status: idx % 3 === 0 ? "Cicilan" : "Tertunda", dibayar: idx % 3 === 0 ? 600000 : 0 },
  ];

  const pembayaran: PembayaranRow[] = [
    { id: `PAY-${nis}-01`, tanggal: "2026-04-12", metode: "Transfer", jumlah: 750000, ref: "BCA-883421", penerima: "Tata Usaha" },
    { id: `PAY-${nis}-02`, tanggal: "2026-03-05", metode: "QRIS", jumlah: 500000, ref: "QR-7721", penerima: "Tata Usaha" },
    { id: `PAY-${nis}-03`, tanggal: "2026-02-08", metode: "Tunai", jumlah: 750000, ref: "KAS-001", penerima: "Bendahara" },
  ];

  const mutasi: MutasiRow[] = [
    { tanggal: `${tahun}-07-15`, jenis: "Masuk", ke: "X-IPA-1", keterangan: "Pendaftaran tahun ajaran" },
    { tanggal: `${tahun + 1}-06-20`, jenis: "Naik Kelas", dari: "X-IPA-1", ke: "XI-IPA-1" },
  ];

  const dokumen: DokumenRow[] = [
    { nama: "Akta Kelahiran.pdf", tipe: "Akta", ukuran: "324 KB", diunggah: "2026-01-10" },
    { nama: "Kartu Keluarga.pdf", tipe: "KK", ukuran: "512 KB", diunggah: "2026-01-10" },
    { nama: "Foto 3x4.jpg", tipe: "Foto", ukuran: "128 KB", diunggah: "2026-01-12" },
    { nama: "Ijazah SMP.pdf", tipe: "Ijazah", ukuran: "612 KB", diunggah: "2026-01-15" },
    { nama: "Rapor Semester 1.pdf", tipe: "Rapor", ukuran: "832 KB", diunggah: "2026-01-20" },
  ];

  const aktivitas: AktivitasRow[] = [
    { waktu: "Hari ini, 09:12", aktor: "Tata Usaha", aksi: "Memperbarui data wali", tone: "neutral" },
    { waktu: "Kemarin, 14:30", aktor: "Bendahara", aksi: "Menerima pembayaran SPP Mei", tone: "success" },
    { waktu: "2 hari lalu", aktor: pick(namaList, idx + 9), aksi: "Mencatat kehadiran kelas", tone: "brand" },
    { waktu: "5 hari lalu", aktor: "Sistem", aksi: "Mengirim pengingat tagihan", tone: "warning" },
  ];

  const wali: WaliRow[] = [
    {
      hubungan: "Ayah",
      nama: pick(namaList, idx + 17),
      nik: `3273${pad(idx * 31, 12)}`,
      pekerjaan: pick(["Pegawai Swasta","Wirausaha","Guru","PNS","Petani"], idx),
      penghasilan: "Rp 3-5 juta",
      pendidikan: "S1",
      telepon: `0812${pad(idx * 113, 8)}`,
      email: `ayah.${nama.split(" ")[0]!.toLowerCase()}@email.com`,
    },
    {
      hubungan: "Ibu",
      nama: pick(namaList, idx + 23),
      pekerjaan: "Ibu Rumah Tangga",
      pendidikan: "SMA",
      telepon: `0813${pad(idx * 119, 8)}`,
    },
  ];

  return {
    nis,
    nisn,
    nik: `3273${pad(idx * 41, 12)}`,
    namaLengkap: nama,
    namaPanggilan: nama.split(" ")[0]!,
    jenisKelamin: gender,
    tempatLahir: pick(["Bandung","Jakarta","Surabaya","Semarang","Bogor","Depok","Bekasi"], idx),
    tanggalLahir: tglLahir,
    agama,
    kewarganegaraan: "WNI",
    status,
    jenjang: pick(jenjangList, idx),
    kelas,
    rombel,
    tahunMasuk: `${tahun}/${tahun + 1}`,
    asalSekolah: pick(["SMP Negeri 1","SMP Negeri 5","SMP Tunas Bangsa","SMP Islam Al-Azhar"], idx),
    noSttb: `STTB-${pad(idx + 100, 6)}`,
    tanggalDiterima: `${tahun}-07-01`,
    kebutuhanKhusus: idx % 17 === 0 ? "F (Kesulitan Belajar)" : "Normal",
    alatTransportasi: pick(["Sepeda Motor","Jalan Kaki","Jemputan Sekolah","Angkutan Umum"], idx),
    jarakRumah: pick(["<1 km","1-3","3-5","5-10"], idx),
    waktuTempuh: pick(["<30 menit","30-60"], idx),
    penghasilanOrtu: pick(["< Rp 500.000","Rp 500.000-1jt","Rp 1-2jt","Rp 2-5jt","> Rp 5jt"], idx),
    penerimaKip: idx % 7 === 0,
    noKip: idx % 7 === 0 ? `KIP-${pad(idx, 6)}` : undefined,
    alamat: `Jl. Merdeka No. ${idx + 1}`,
    rt: pad((idx % 12) + 1, 2),
    rw: pad((idx % 8) + 1, 2),
    desa: pick(["Sukamaju","Cibadak","Cikutra","Antapani","Ujungberung"], idx),
    kecamatan: pick(["Coblong","Cibeunying","Kiaracondong","Sukasari"], idx),
    kabupaten: "Kota Bandung",
    provinsi: "Jawa Barat",
    kodePos: `4012${idx % 10}`,
    telepon: `0822${pad(idx * 79, 8)}`,
    email: `${nama.split(" ").join(".").toLowerCase()}@siswa.sekolahpro.id`,
    wali,
    nilai,
    absensi,
    tagihan,
    pembayaran,
    mutasi,
    dokumen,
    aktivitas,
    rataNilai: rata,
    persenKehadiran: hadir,
    saldoTagihan: saldo,
  };
}

export const SISWA_LIST: Siswa[] = Array.from({ length: 40 }, (_, i) => buildSiswa(i));

export function findSiswa(nis: string): Siswa | undefined {
  return SISWA_LIST.find((s) => s.nis === nis);
}

export const FILTER_OPTIONS = {
  status: ["Semua","Calon","Aktif","Alumni","Pindah Keluar","DO"] as const,
  jenisKelamin: ["Semua","Laki-laki","Perempuan"] as const,
  jenjang: ["Semua","SMA","SMP","SD"] as const,
  kelas: ["Semua", ...kelasList] as const,
  tahunMasuk: ["Semua","2022/2023","2023/2024","2024/2025","2025/2026"] as const,
  kebutuhanKhusus: ["Semua","Normal","Berkebutuhan"] as const,
  kip: ["Semua","Penerima","Bukan Penerima"] as const,
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
