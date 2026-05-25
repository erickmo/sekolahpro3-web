// Mock data fixture untuk modul Koperasi.
// Replace dengan @sekolahpro/api-client hooks ketika backend siap.

export type StatusAnggota = "Aktif" | "Non-aktif" | "Keluar" | "Pending";
export type TipeAnggota = "Siswa" | "Guru" | "Staff" | "Orang Tua";
export type JenisSimpanan = "Pokok" | "Wajib" | "Sukarela" | "Berjangka";
export type JenisKelamin = "Laki-laki" | "Perempuan";

export interface SimpananRow {
  id: string;
  tanggal: string;
  jenis: JenisSimpanan;
  tipe: "Setor" | "Tarik";
  jumlah: number;
  saldoSetelah: number;
  petugas: string;
  ref?: string | undefined;
}

export interface PinjamanRow {
  id: string;
  tanggal: string;
  jumlah: number;
  tenor: number;
  bunga: number;
  angsuran: number;
  sisaPokok: number;
  status: "Pengajuan" | "Disetujui" | "Berjalan" | "Lunas" | "Macet" | "Ditolak";
  jatuhTempo: string;
}

export interface AngsuranRow {
  id: string;
  pinjamanId: string;
  tanggal: string;
  jumlah: number;
  pokok: number;
  bunga: number;
  denda?: number | undefined;
  status: "Terjadwal" | "Dibayar" | "Telat";
  petugas?: string | undefined;
}

export interface TransaksiTokoRow {
  id: string;
  tanggal: string;
  item: string;
  jumlah: number;
  harga: number;
  total: number;
  metode: "Tunai" | "Saldo Simpanan" | "Transfer";
  petugas: string;
}

export interface SHURow {
  tahun: string;
  persenAnggota: number;
  persenJasaSimpanan: number;
  persenJasaPinjaman: number;
  totalDiterima: number;
}

export interface AktivitasRow {
  waktu: string;
  aktor: string;
  aksi: string;
  tone: "neutral" | "brand" | "success" | "warning" | "danger";
}

export interface Anggota {
  noAnggota: string;
  nama: string;
  tipeAnggota: TipeAnggota;
  nis?: string | undefined;
  nip?: string | undefined;
  jenisKelamin: JenisKelamin;
  tanggalLahir: string;
  telepon?: string | undefined;
  email?: string | undefined;
  alamat?: string | undefined;
  tanggalGabung: string;
  status: StatusAnggota;
  fotoUrl?: string | undefined;
  // Saldo simpanan per jenis
  saldoSimpananPokok: number;
  saldoSimpananWajib: number;
  saldoSimpananSukarela: number;
  saldoSimpananBerjangka: number;
  totalSimpanan: number;
  // Ringkasan pinjaman & toko
  pinjamanAktif: number;
  sisaPinjaman: number;
  totalBelanjaToko: number;
  jumlahTransaksi: number;
  // Relasi
  simpanan: SimpananRow[];
  pinjaman: PinjamanRow[];
  angsuran: AngsuranRow[];
  transaksiToko: TransaksiTokoRow[];
  shu: SHURow[];
  aktivitas: AktivitasRow[];
}

const namaList = [
  "Budi Santoso", "Rina Anggraini", "Dewi Lestari", "Ahmad Fauzi", "Siti Nurhaliza",
  "Andi Pratama", "Maya Sari", "Reza Maulana", "Nia Ramadhani", "Bagas Wicaksono",
  "Putri Ayu", "Hendra Gunawan", "Tiara Putri", "Fajar Sidik", "Lestari Wulandari",
  "Galih Permana", "Sinta Dewi", "Yusuf Mahendra", "Anisa Rahmawati", "Rizky Hidayat",
  "Citra Kirana", "Eko Prasetyo", "Vania Sabrina", "Aldi Taher", "Bunga Citra",
  "Dimas Anggara", "Selena Putri", "Iqbal Ramadhan", "Mawar Eva", "Aril Noah",
  "Jessica Mila", "Verrel Bramasta", "Aurel Hermansyah", "Atta Halilintar", "Lesti Kejora",
];

const tipeList: TipeAnggota[] = ["Siswa","Siswa","Siswa","Guru","Guru","Staff","Orang Tua","Orang Tua"];
const statusList: StatusAnggota[] = ["Aktif","Aktif","Aktif","Aktif","Aktif","Aktif","Aktif","Non-aktif","Keluar","Pending"];
const petugasList = ["Bendahara","Kasir Koperasi","Pengurus Koperasi","Tata Usaha"];
const itemList = ["Buku Tulis","Pulpen","Pensil","Penghapus","Penggaris","Seragam Olahraga","Topi Sekolah","Dasi Sekolah","Snack","Air Mineral","Map Plastik","Kertas HVS"];

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

function buildAnggota(idx: number): Anggota {
  const nama = namaList[idx % namaList.length]!;
  const tahunGabung = 2020 + (idx % 6);
  const noAnggota = `KOP-${tahunGabung}-${pad(idx + 1, 5)}`;
  const tipeAnggota = pick(tipeList, idx + 3);
  const gender: JenisKelamin = idx % 2 === 0 ? "Laki-laki" : "Perempuan";
  const status = statusList[idx % statusList.length]!;
  const tglLahir = `${1985 + (idx % 25)}-${pad((idx % 12) + 1, 2)}-${pad((idx % 27) + 1, 2)}`;
  const tglGabung = `${tahunGabung}-${pad((idx % 12) + 1, 2)}-${pad((idx % 27) + 1, 2)}`;

  // Saldo simpanan
  const saldoPokok = 100000; // standar
  const saldoWajib = (50000) * (12 + (idx % 24)); // akumulasi bulanan
  const saldoSukarela = Math.floor(rand(idx + 7) * 30) * 100000;
  const saldoBerjangka = idx % 3 === 0 ? Math.floor(rand(idx + 11) * 50) * 500000 : 0;
  const totalSimpanan = saldoPokok + saldoWajib + saldoSukarela + saldoBerjangka;

  const punyaPinjaman = idx % 4 !== 0;
  const jumlahPinjaman = punyaPinjaman ? (5 + Math.floor(rand(idx + 13) * 20)) * 1000000 : 0;
  const tenor = punyaPinjaman ? [6, 12, 18, 24][idx % 4]! : 0;
  const bunga = 1.5;
  const angsuranPokok = punyaPinjaman ? Math.floor(jumlahPinjaman / tenor) : 0;
  const angsuranBunga = punyaPinjaman ? Math.floor((jumlahPinjaman * bunga) / 100) : 0;
  const angsuran = angsuranPokok + angsuranBunga;
  const cicilanLewat = punyaPinjaman ? Math.min(tenor, 3 + (idx % 6)) : 0;
  const sisaPokok = punyaPinjaman ? jumlahPinjaman - (angsuranPokok * cicilanLewat) : 0;
  const jatuhTempo = `${tahunGabung + Math.floor((tenor + (idx % 12) + 1) / 12)}-${pad(((tenor + (idx % 12)) % 12) + 1, 2)}-15`;

  // Histori simpanan: ambil dari beberapa setoran wajib + sukarela
  const simpanan: SimpananRow[] = Array.from({ length: 8 }).map((_, i) => {
    const isSetor = i % 3 !== 0;
    const jenis: JenisSimpanan = pick<JenisSimpanan>(["Wajib","Sukarela","Sukarela","Pokok"], idx + i + 5);
    const jumlah = isSetor
      ? (jenis === "Wajib" ? 50000 : 100000 + Math.floor(rand(idx + i + 17) * 9) * 50000)
      : 50000 + Math.floor(rand(idx + i + 19) * 5) * 50000;
    const day = 28 - i * 3;
    const month = ((idx + i) % 12) + 1;
    return {
      id: `SIM-${noAnggota}-${pad(i + 1, 3)}`,
      tanggal: `2026-${pad(month, 2)}-${pad(day < 1 ? 1 : day, 2)}`,
      jenis,
      tipe: isSetor ? "Setor" : "Tarik",
      jumlah,
      saldoSetelah: totalSimpanan - i * 25000,
      petugas: pick(petugasList, idx + i),
      ref: `TRX-${pad(idx * 31 + i, 6)}`,
    };
  });

  const statusPinjamanList: PinjamanRow["status"][] = ["Berjalan","Lunas","Pengajuan","Disetujui","Macet","Ditolak"];
  const pinjaman: PinjamanRow[] = punyaPinjaman
    ? Array.from({ length: 2 }).map((_, i) => {
        const j = (i === 0 ? jumlahPinjaman : Math.floor(jumlahPinjaman * 0.6));
        const t = (i === 0 ? tenor : 12);
        const ap = Math.floor(j / t);
        const ab = Math.floor((j * bunga) / 100);
        const st = i === 0 ? statusPinjamanList[idx % statusPinjamanList.length]! : "Lunas";
        const sisa = st === "Lunas" ? 0 : j - ap * Math.min(t, 3 + ((idx + i) % 6));
        return {
          id: `PJM-${noAnggota}-${pad(i + 1, 3)}`,
          tanggal: `${tahunGabung + i}-${pad((idx % 12) + 1, 2)}-10`,
          jumlah: j,
          tenor: t,
          bunga,
          angsuran: ap + ab,
          sisaPokok: sisa,
          status: st,
          jatuhTempo: `${tahunGabung + i + Math.floor(t / 12)}-${pad(((t + idx) % 12) + 1, 2)}-15`,
        };
      })
    : [];

  const angsuranStatusList: AngsuranRow["status"][] = ["Dibayar","Dibayar","Dibayar","Terjadwal","Telat"];
  const angsuranList: AngsuranRow[] = punyaPinjaman
    ? Array.from({ length: 6 }).map((_, i) => {
        const st = pick(angsuranStatusList, idx + i + 23);
        const denda = st === "Telat" ? 25000 : undefined;
        const row: AngsuranRow = {
          id: `ANG-${noAnggota}-${pad(i + 1, 3)}`,
          pinjamanId: `PJM-${noAnggota}-001`,
          tanggal: `2026-${pad(((idx + i) % 12) + 1, 2)}-15`,
          jumlah: angsuran + (denda ?? 0),
          pokok: angsuranPokok,
          bunga: angsuranBunga,
          status: st,
        };
        if (denda !== undefined) row.denda = denda;
        if (st === "Dibayar") row.petugas = pick(petugasList, idx + i);
        return row;
      })
    : [];

  const transaksiToko: TransaksiTokoRow[] = Array.from({ length: 6 }).map((_, i) => {
    const item = pick(itemList, idx + i + 29);
    const jml = 1 + (i % 5);
    const harga = (2 + (idx + i) % 20) * 1000;
    const day = 24 - i * 3;
    const month = ((idx + i) % 12) + 1;
    return {
      id: `TRX-${noAnggota}-${pad(i + 1, 3)}`,
      tanggal: `2026-${pad(month, 2)}-${pad(day < 1 ? 1 : day, 2)}`,
      item,
      jumlah: jml,
      harga,
      total: jml * harga,
      metode: pick<TransaksiTokoRow["metode"]>(["Tunai","Saldo Simpanan","Transfer"], idx + i + 31),
      petugas: pick(petugasList, idx + i + 7),
    };
  });

  const totalBelanjaToko = transaksiToko.reduce((s, t) => s + t.total, 0);

  const shu: SHURow[] = Array.from({ length: 3 }).map((_, i) => {
    const tahun = 2024 - i;
    const persen = 1.5 + rand(idx + i + 41) * 1.5;
    return {
      tahun: `${tahun}`,
      persenAnggota: Number(persen.toFixed(2)),
      persenJasaSimpanan: Number((1 + rand(idx + i + 43)).toFixed(2)),
      persenJasaPinjaman: Number((1 + rand(idx + i + 47)).toFixed(2)),
      totalDiterima: Math.floor(totalSimpanan * persen / 100),
    };
  });

  const aktivitas: AktivitasRow[] = [
    { waktu: "Hari ini, 09:30", aktor: "Kasir Koperasi", aksi: "Mencatat setoran simpanan wajib", tone: "success" },
    { waktu: "Kemarin, 14:15", aktor: "Bendahara", aksi: "Menerima angsuran pinjaman", tone: "brand" },
    { waktu: "3 hari lalu", aktor: pick(namaList, idx + 9), aksi: "Melakukan transaksi toko koperasi", tone: "neutral" },
    { waktu: "1 minggu lalu", aktor: "Sistem", aksi: "Mengirim pengingat jatuh tempo angsuran", tone: "warning" },
  ];

  return {
    noAnggota,
    nama,
    tipeAnggota,
    nis: tipeAnggota === "Siswa" ? `${tahunGabung}${pad(idx + 1, 4)}` : undefined,
    nip: tipeAnggota === "Guru" || tipeAnggota === "Staff" ? `${1970 + (idx % 25)}${pad((idx % 12) + 1, 2)}${pad((idx % 27) + 1, 2)} ${tahunGabung}${pad((idx % 12) + 1, 2)} ${idx % 2 === 0 ? 1 : 2} ${pad((idx % 999) + 1, 3)}` : undefined,
    jenisKelamin: gender,
    tanggalLahir: tglLahir,
    telepon: `0812${pad(idx * 137, 8)}`,
    email: `${nama.split(" ").join(".").toLowerCase()}@koperasi.sekolahpro.id`,
    alamat: `Jl. Koperasi No. ${idx + 1}`,
    tanggalGabung: tglGabung,
    status,
    saldoSimpananPokok: saldoPokok,
    saldoSimpananWajib: saldoWajib,
    saldoSimpananSukarela: saldoSukarela,
    saldoSimpananBerjangka: saldoBerjangka,
    totalSimpanan,
    pinjamanAktif: punyaPinjaman ? jumlahPinjaman : 0,
    sisaPinjaman: sisaPokok,
    totalBelanjaToko,
    jumlahTransaksi: transaksiToko.length,
    simpanan,
    pinjaman,
    angsuran: angsuranList,
    transaksiToko,
    shu,
    aktivitas,
  };
}

export const ANGGOTA_LIST: Anggota[] = Array.from({ length: 35 }, (_, i) => buildAnggota(i));

export function findAnggota(noAnggota: string): Anggota | undefined {
  return ANGGOTA_LIST.find((a) => a.noAnggota === noAnggota);
}

export const FILTER_OPTIONS = {
  status: ["Semua","Aktif","Non-aktif","Keluar","Pending"] as const,
  tipeAnggota: ["Semua","Siswa","Guru","Staff","Orang Tua"] as const,
  jenisKelamin: ["Semua","Laki-laki","Perempuan"] as const,
  tahunGabung: ["Semua","2020","2021","2022","2023","2024","2025"] as const,
};

export function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export function formatTanggal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
