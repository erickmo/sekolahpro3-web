/**
 * Per-page onboarding content for the Koperasi module, written for
 * non-technical school-cooperative staff (teller, admin, supervisor).
 * Centralized so the copy stays consistent and editable in one place; each
 * page renders it via <KoperasiPageGuide id="..."/>.
 *
 * Steps are role-tagged to FRAME who each step speaks to — they never hide
 * anything from anyone. Jargon (SHU, ZIS, akad, PPATK, denominasi, dormant)
 * is explained inline on the page where the user first meets it.
 */
import type { PageGuideStep } from "../guide";
import type { KoperasiRole } from "../../lib/koperasi/role";

/** Guide step constrained to the koperasi role union so role typos fail to compile. */
export type KoperasiGuideStep = Omit<PageGuideStep, "roles"> & { roles?: KoperasiRole[] };

/** Identifier for each guided Koperasi page. */
export type KoperasiGuideId =
  | "dashboard"
  | "onboarding"
  | "daftar"
  | "rekening"
  | "transaksi"
  | "kas-teller"
  | "workspace"
  | "kartu"
  | "emoney"
  | "pembiayaan"
  | "angsuran"
  | "suku-bunga"
  | "nasabah"
  | "wallet"
  | "zis"
  | "zis-penyaluran"
  | "zis-program"
  | "wakaf"
  | "persetujuan"
  | "period-close"
  | "shu"
  | "ppatk"
  | "laporan"
  | "pengaturan";

/** Full guide content for a single page. */
export interface KoperasiGuideContent {
  title: string;
  intro: string;
  steps: KoperasiGuideStep[];
  tips: string[];
}

export const KOPERASI_PAGE_GUIDES: Record<KoperasiGuideId, KoperasiGuideContent> = {
  dashboard: {
    title: "Cara pakai Dashboard Koperasi",
    intro:
      "Pusat pantau harian: tugas yang harus dibereskan hari ini, statistik anggota & kas, dan pintasan menu sesuai irama kerja koperasi.",
    steps: [
      {
        title: "Mulai dari panel tugas",
        detail:
          "Kartu-kartu tugas menunjukkan hal yang menunggu tindakan — closing kas, antrean persetujuan, tunggakan angsuran. Klik kartunya untuk langsung menindak.",
        roles: ["supervisor", "admin"],
      },
      {
        title: "Buka kas sebelum melayani",
        detail:
          "Kalau pagi belum ada sesi kas, muncul peringatan kuning di atas. Transaksi tunai hanya bisa dicatat saat sesi kas aktif.",
        roles: ["teller"],
      },
      {
        title: "Pakai pintasan sesuai ritme",
        detail:
          "Bagian Ritme Operasional mengelompokkan menu: Harian (layanan & kas), Berkala (angsuran, persetujuan, tutup periode), Tahunan & Setup (SHU, pengaturan).",
        roles: ["teller", "admin", "supervisor"],
      },
      {
        title: "Ikuti Alur Operasi saat setup awal",
        detail:
          "Tujuh langkah dari Pengaturan sampai Tutup Buku — panduan sekali jalan saat koperasi baru mulai beroperasi.",
        roles: ["admin"],
      },
    ],
    tips: [
      "Angka di panel tugas ditarik langsung dari data terkini, bukan cache.",
      "Sidebar kiri memuat semua menu; dashboard hanya menonjolkan yang paling sering dipakai.",
    ],
  },
  onboarding: {
    title: "Cara pakai Pendaftaran Anggota",
    intro:
      "Alur terpandu anggota baru: data nasabah → keanggotaan → permohonan buka rekening → persetujuan supervisor → rekening aktif siap transaksi.",
    steps: [
      {
        title: "Cari atau buat nasabah",
        detail:
          "Nasabah = data orangnya (siswa, wali, guru, staff). Cek dulu yang sudah ada supaya tidak dobel.",
        roles: ["admin", "teller"],
      },
      {
        title: "Daftarkan keanggotaan",
        detail:
          "Pilih jenis anggota dan tanggal masuk; anggota baru berstatus Calon Anggota sampai rekeningnya aktif.",
        roles: ["admin"],
      },
      {
        title: "Ajukan buka rekening",
        detail:
          "Pilih produk simpanan dan setoran awal (simpanan pokok). Permohonan masuk antrean persetujuan supervisor.",
        roles: ["admin"],
      },
      {
        title: "Tunggu persetujuan supervisor",
        detail:
          "Supervisor memutuskan lewat halaman Persetujuan; setelah disetujui, rekening otomatis aktif dan anggota siap bertransaksi.",
        roles: ["supervisor"],
      },
    ],
    tips: [
      "Calon anggota yang mandek terlihat di panel tugas dashboard — lanjutkan dari sana.",
      "Simpanan pokok bersifat terkunci, bukan saldo yang bisa ditarik harian.",
    ],
  },
  daftar: {
    title: "Cara pakai Daftar Anggota",
    intro:
      "Registry seluruh anggota koperasi: cari, saring status, dan buka profil untuk melihat rekening serta riwayatnya.",
    steps: [
      {
        title: "Cari & saring",
        detail:
          "Pakai kolom cari (nama/nomor) dan filter status — Aktif, Calon Anggota, Non-aktif, Keluar.",
        roles: ["teller", "admin"],
      },
      {
        title: "Buka profil anggota",
        detail:
          "Klik baris untuk melihat detail: rekening simpanan, kartu, pembiayaan, dan aksi keanggotaan.",
        roles: ["teller", "admin"],
      },
      {
        title: "Tindak lanjuti calon anggota",
        detail:
          "Status Calon Anggota berarti onboarding belum tuntas — lanjutkan lewat halaman Pendaftaran Anggota.",
        roles: ["admin"],
      },
    ],
    tips: [
      "Anggota baru selalu lewat alur Pendaftaran Anggota, bukan ditambah manual di sini.",
      "Status Keluar tetap tersimpan sebagai jejak audit.",
    ],
  },
  rekening: {
    title: "Cara pakai Rekening",
    intro:
      "Daftar rekening simpanan anggota: saldo, status (Aktif/Diblokir/Dormant/Ditutup), dan riwayat mutasinya.",
    steps: [
      {
        title: "Pantau status rekening",
        detail:
          "Pakai filter status untuk menemukan rekening Dormant (lama tidak bergerak) atau yang Diblokir.",
        roles: ["admin", "supervisor"],
      },
      {
        title: "Buka detail rekening",
        detail: "Klik baris untuk melihat saldo terkini dan mutasi transaksinya.",
        roles: ["teller", "admin"],
      },
      {
        title: "Ubah status lewat permohonan",
        detail:
          "Tutup, blokir, atau aktifkan kembali rekening lewat permohonan yang disetujui supervisor — bukan edit langsung.",
        roles: ["admin", "supervisor"],
      },
    ],
    tips: [
      "Rekening lahir dari persetujuan buka rekening, bukan ditambah manual.",
      "Dormant = lama tidak aktif; hidupkan kembali lewat Permohonan Aktivasi Dormant.",
    ],
  },
  transaksi: {
    title: "Cara pakai Transaksi Simpanan",
    intro:
      "Catat setor, tarik, dan transfer simpanan anggota. Setiap transaksi tunai menempel ke sesi kas teller yang sedang aktif.",
    steps: [
      {
        title: "Pastikan sesi kas aktif",
        detail:
          "Setor/Tarik tunai ditolak bila kas belum dibuka — buka dulu di halaman Kas Teller.",
        roles: ["teller"],
      },
      {
        title: "Buat transaksi",
        detail:
          "Tombol Transaksi Baru → pilih rekening, jenis, dan nominal. Saldo rekening terpotong/bertambah otomatis.",
        roles: ["teller"],
      },
      {
        title: "Periksa riwayat",
        detail: "Klik baris untuk detail; saring per jenis bila perlu menelusuri transaksi lama.",
        roles: ["teller", "supervisor"],
      },
    ],
    tips: [
      "Penarikan tidak boleh melebihi saldo rekening.",
      "Melayani antrean panjang? Pakai halaman Layanan Cepat: scan kartu + tombol pintas.",
      "Transfer memindahkan saldo antar rekening — bukan uang tunai keluar.",
    ],
  },
  "kas-teller": {
    title: "Cara pakai Kas Teller",
    intro:
      "Sesi kas = catatan shift harian teller: buka pagi dengan modal, layani transaksi, tutup sore dengan hitung uang fisik per pecahan (denominasi), lalu supervisor menyetujui.",
    steps: [
      {
        title: "Buka sesi pagi",
        detail:
          "Tombol Buka Sesi → isi shift, modal kas (uang awal di laci), dan rincian pecahan uang. Total pecahan harus sama dengan modal.",
        roles: ["teller"],
      },
      {
        title: "Layani transaksi",
        detail: "Selama sesi Aktif, semua setor/tarik tunai tercatat ke sesi ini.",
        roles: ["teller"],
      },
      {
        title: "Tutup kas sore",
        detail:
          "Hitung uang fisik per pecahan; sistem membandingkannya dengan saldo seharusnya dan menghitung selisih. Selisih bukan nol wajib diberi catatan.",
        roles: ["teller"],
      },
      {
        title: "Setujui closing",
        detail:
          "Sesi berstatus Pending Approval menunggu keputusan supervisor sebelum benar-benar Selesai.",
        roles: ["supervisor"],
      },
    ],
    tips: [
      "Denominasi = rincian jumlah lembar/keping per pecahan (Rp100rb, Rp50rb, dst).",
      "Status Pending Approval artinya teller sudah mengajukan tutup — tinggal persetujuan.",
      "Satu teller hanya boleh punya satu sesi Aktif.",
    ],
  },
  workspace: {
    title: "Cara pakai Layanan Cepat",
    intro:
      "Mode pelayanan kilat untuk teller: scan kartu RFID anggota atau ketik nomor anggota, lalu pakai tombol pintas untuk setor/tarik/cek saldo tanpa pindah halaman.",
    steps: [
      {
        title: "Buka kas dulu",
        detail: "Halaman ini hanya berfungsi saat ada sesi kas aktif milik Anda.",
        roles: ["teller"],
      },
      {
        title: "Scan kartu / ketik nomor",
        detail:
          "Kartu RFID otomatis memanggil profil + rekening anggota; tanpa kartu, ketik nomor anggota lalu Enter.",
        roles: ["teller"],
      },
      {
        title: "Pakai tombol pintas",
        detail: "F2 Setor · F3 Tarik · F4 Transfer · F5 Cek Saldo. Esc untuk lanjut ke anggota berikutnya.",
        roles: ["teller"],
      },
    ],
    tips: [
      "Cocok untuk antrean panjang — tangan tidak perlu pegang mouse.",
      "Kartu tidak dikenal? Periksa pendaftarannya di halaman Kartu RFID.",
    ],
  },
  kartu: {
    title: "Cara pakai Kartu RFID",
    intro:
      "Kelola kartu anggota: terbitkan kartu baru, tautkan ke anggota, dan blokir bila hilang atau rusak.",
    steps: [
      {
        title: "Terbitkan kartu",
        detail: "Daftarkan UID kartu fisik dan tautkan ke anggota — satu kartu untuk satu anggota.",
        roles: ["admin"],
      },
      {
        title: "Kelola status",
        detail:
          "Blokir kartu hilang/rusak supaya tidak bisa dipakai di Layanan Cepat maupun mesin kantin.",
        roles: ["admin", "supervisor"],
      },
      {
        title: "Cek pemakaian",
        detail: "Klik baris untuk melihat detail kartu beserta tautan dompet e-money-nya.",
        roles: ["teller", "admin"],
      },
    ],
    tips: [
      "Kartu adalah alat identifikasi; saldo e-money tersimpan di dompet terpisah.",
      "Kartu berstatus blokir otomatis ditolak saat di-scan.",
    ],
  },
  emoney: {
    title: "Cara pakai E-Money",
    intro:
      "Dompet e-money per kartu untuk jajan di kantin/merchant: top-up, pantau saldo, dan telusuri mutasinya.",
    steps: [
      {
        title: "Top-up saldo",
        detail:
          "Pilih dompet kartu anggota lalu isi nominal. Saldo bertambah seketika dan dibatasi plafon dompet.",
        roles: ["teller"],
      },
      {
        title: "Pantau saldo & mutasi",
        detail: "Klik baris untuk melihat riwayat transaksi dompet.",
        roles: ["teller", "admin"],
      },
      {
        title: "Tangani kendala",
        detail:
          "Saldo tidak masuk atau limit penuh → cek batas saldo dompet dan status kartunya dulu sebelum eskalasi.",
        roles: ["admin"],
      },
    ],
    tips: [
      "Top-up yang melebihi batas saldo dompet otomatis ditolak sistem.",
      "E-money beda dari simpanan: dipakai belanja, bukan ditabung.",
    ],
  },
  pembiayaan: {
    title: "Cara pakai Pembiayaan",
    intro:
      "Pengajuan sampai pencairan pinjaman anggota. Mode syariah memakai akad (perjanjian, mis. Murabahah); mode konvensional memakai bunga pinjaman.",
    steps: [
      {
        title: "Buat pengajuan",
        detail:
          "Pilih anggota, produk pembiayaan, plafon, dan tenor. Akad atau bunga mengikuti produknya.",
        roles: ["admin"],
      },
      {
        title: "Proses persetujuan",
        detail: "Pengajuan dinilai dan disetujui sesuai kebijakan koperasi sebelum dicairkan.",
        roles: ["supervisor"],
      },
      {
        title: "Cairkan & pantau",
        detail:
          "Setelah cair, jadwal angsuran terbentuk otomatis — pantau pembayarannya di halaman Angsuran.",
        roles: ["admin", "teller"],
      },
    ],
    tips: [
      "Akad = perjanjian pembiayaan syariah; contoh Murabahah = jual-beli dengan margin yang disepakati.",
      "Keterlambatan bayar muncul sebagai tunggakan di halaman Angsuran dan panel tugas dashboard.",
    ],
  },
  angsuran: {
    title: "Cara pakai Angsuran",
    intro:
      "Jadwal cicilan pembiayaan per anggota: mana yang belum dibayar, kapan jatuh temponya, dan mana yang sudah menjadi tunggakan.",
    steps: [
      {
        title: "Pantau jatuh tempo",
        detail:
          "Saring status Belum dan urutkan per tanggal jatuh tempo — kejar sebelum lewat tanggal.",
        roles: ["admin", "teller"],
      },
      {
        title: "Catat pembayaran",
        detail:
          "Buka baris angsuran yang dibayar lalu tandai pelunasannya; pembayaran tunai tetap lewat sesi kas.",
        roles: ["teller"],
      },
      {
        title: "Tindak tunggakan",
        detail:
          "Status Tunggakan = sudah lewat jatuh tempo. Hubungi anggotanya; jumlah total juga tampil di panel tugas dashboard.",
        roles: ["supervisor", "admin"],
      },
    ],
    tips: [
      "Baris status Belum yang lewat tanggal jatuh tempo ikut dihitung tunggakan di dashboard.",
      "Pelunasan mengubah status baris menjadi Lunas — riwayat tetap tersimpan.",
    ],
  },
  "suku-bunga": {
    title: "Cara pakai Suku Bunga",
    intro:
      "Referensi suku bunga simpanan & pinjaman koperasi konvensional — angkanya dikelola dari master produk, halaman ini baca-saja.",
    steps: [
      {
        title: "Lihat tarif berlaku",
        detail: "Tabel menampilkan bunga per produk yang dipakai sistem untuk perhitungan.",
        roles: ["teller", "admin"],
      },
      {
        title: "Ubah lewat produk",
        detail:
          "Perubahan tarif dilakukan di master produk (butuh akses admin), bukan di halaman ini.",
        roles: ["admin"],
      },
    ],
    tips: [
      "Halaman ini hanya muncul saat mode koperasi konvensional.",
      "Mode syariah memakai nisbah bagi hasil, bukan bunga.",
    ],
  },
  nasabah: {
    title: "Cara pakai halaman Nasabah",
    intro:
      "Nasabah adalah identitas pelanggan koperasi (siswa, pegawai, atau user) lengkap dengan profil KYC sesuai aturan PPATK. Semua rekening, akad, dan keanggotaan menempel ke nasabah.",
    steps: [
      {
        title: "Daftarkan pihak sebagai nasabah",
        detail:
          "Klik Daftarkan Nasabah, pilih tipe pihak (Siswa/Pegawai/User) lalu cari orangnya. Nomor nasabah (NSB-…) dibuat otomatis.",
        roles: ["teller", "admin"],
      },
      {
        title: "Isi profil KYC dengan jujur",
        detail:
          "Tier Low untuk transaksi kecil; Medium wajib mengisi sumber dana; PEP atau negara berisiko otomatis menjadi High dan butuh due diligence ekstra.",
        roles: ["admin", "supervisor"],
      },
      {
        title: "Tindak lanjuti review yang jatuh tempo",
        detail:
          "Badge merah Overdue berarti review KYC melewati batas (Medium 12 bulan, High 6 bulan). Buka detailnya, selesaikan review, lalu perbarui tanggal review.",
        roles: ["supervisor"],
      },
    ],
    tips: [
      "Satu orang cukup satu nasabah — sistem memperingatkan kalau pihak sudah terdaftar.",
      "Nasabah berstatus Tidak Aktif tidak bisa membuka rekening atau akad baru.",
    ],
  },
  wallet: {
    title: "Cara pakai halaman Wallet E-Money",
    intro:
      "Wallet menyimpan saldo e-money satu kartu. Atur batas saldo, sumber dana top-up, dan auto top-up di sini; riwayat pengisian tercatat per wallet.",
    steps: [
      {
        title: "Buat wallet untuk kartu e-money",
        detail:
          "Hanya kartu bertipe emoney yang bisa punya wallet, dan satu kartu satu wallet. Tentukan batas saldo maksimal sesuai kebijakan koperasi.",
        roles: ["admin"],
      },
      {
        title: "Aktifkan auto top-up bila perlu",
        detail:
          "Auto top-up menarik dana dari rekening simpanan sumber setiap saldo turun di bawah ambang. Ketiga isian (ambang, nominal, rekening) wajib saat fitur ini menyala.",
        roles: ["admin"],
      },
      {
        title: "Top-up manual dari halaman ini",
        detail:
          "Gunakan tombol Top-up: pilih kartu, nominal (Rp 1.000–10.000.000), dan sumber dana Tunai atau debit rekening. Saldo wallet terpotong otomatis saat jajan di kantin.",
        roles: ["teller"],
      },
    ],
    tips: [
      "Saldo wallet dihitung backend dari top-up dan transaksi — tidak bisa diedit manual.",
      "Kartu hilang? Blokir kartunya di halaman Kartu; wallet ikut terkunci.",
    ],
  },
  zis: {
    title: "Cara pakai ZIS",
    intro:
      "ZIS = Zakat, Infak, Sedekah — dana sosial koperasi syariah. Catat penerimaan dan penyalurannya di sini, terpisah dari simpanan anggota.",
    steps: [
      {
        title: "Catat penerimaan",
        detail:
          "Pilih jenis (Zakat/Infak/Sedekah), nominal, dan pemberinya. Dana masuk ke penampung ZIS.",
        roles: ["teller", "admin"],
      },
      {
        title: "Pantau saldo dana",
        detail: "Lihat akumulasi per jenis sebelum disalurkan.",
        roles: ["supervisor"],
      },
      {
        title: "Salurkan ke penerima",
        detail:
          "Catat penyaluran ke mustahik (penerima yang berhak) lengkap dengan keterangannya.",
        roles: ["admin", "supervisor"],
      },
    ],
    tips: [
      "Penyaluran zakat mengikuti 8 golongan penerima (asnaf).",
      "Dana ZIS terpisah dari simpanan anggota — jangan sampai tercampur.",
    ],
  },
  "zis-penyaluran": {
    title: "Cara pakai halaman Penyaluran ZIS",
    intro:
      "Penyaluran mencatat dana sosial yang keluar ke penerima manfaat, selalu menempel ke satu Program Penyaluran agar saldo program terjaga.",
    steps: [
      {
        title: "Pilih program yang masih aktif",
        detail:
          "Dana hanya bisa disalurkan dari program berstatus Aktif dan tidak boleh melebihi sisa dana program (terkumpul − tersalurkan).",
        roles: ["admin"],
      },
      {
        title: "Isi asnaf untuk dana zakat",
        detail:
          "Untuk program berkategori Zakat, golongan penerima (8 asnaf) wajib dipilih — bagian Amil dibatasi 12,5% dari penerimaan program.",
        roles: ["admin", "supervisor"],
      },
      {
        title: "Catat penerima bila ada",
        detail:
          "Penerima boleh diisi (Siswa/Pegawai/User) atau dikosongkan untuk penyaluran kolektif. Simpan bukti serah terima fisik untuk audit.",
        roles: ["teller", "admin"],
      },
    ],
    tips: [
      "Saldo program tampil di form — kalau kurang, tambah penerimaan dulu di halaman ZIS.",
    ],
  },
  "zis-program": {
    title: "Cara pakai halaman Program Penyaluran",
    intro:
      "Program adalah wadah penyaluran per jenis dana (mis. Beasiswa Zakat, Infaq Renovasi). Penerimaan dan penyaluran ZIS mengalir lewat program ini.",
    steps: [
      {
        title: "Buat program per tujuan",
        detail:
          "Tentukan nama, jenis dana, dan target. Penerimaan yang ditautkan ke program otomatis menambah angka terkumpul.",
        roles: ["admin"],
      },
      {
        title: "Pantau realisasi",
        detail:
          "Kolom terkumpul vs tersalurkan menunjukkan progres program. Selesaikan program (status Selesai) bila target tercapai agar tidak menerima dana baru.",
        roles: ["supervisor"],
      },
    ],
    tips: [
      "Jenis dana program harus sama dengan jenis dana penerimaannya — sistem menolak campur dana.",
    ],
  },
  wakaf: {
    title: "Cara pakai Wakaf",
    intro:
      "Pencatatan program wakaf — dana/barang yang diwakafkan anggota untuk kepentingan umat — beserta peruntukannya.",
    steps: [
      {
        title: "Catat penerimaan wakaf",
        detail: "Isi wakif (pemberi), bentuk wakaf, nilai, dan program peruntukannya.",
        roles: ["admin"],
      },
      {
        title: "Pantau program",
        detail: "Pastikan setiap dana wakaf jelas program dan penggunaannya.",
        roles: ["supervisor"],
      },
    ],
    tips: [
      "Wakaf bersifat abadi — pokoknya dijaga, manfaatnya yang disalurkan.",
      "Halaman ini hanya muncul pada koperasi mode syariah.",
    ],
  },
  persetujuan: {
    title: "Cara pakai Persetujuan",
    intro:
      "Kotak masuk keputusan supervisor: permohonan rekening (buka, tutup, blokir, unblokir, aktivasi dormant) menunggu disetujui atau ditolak.",
    steps: [
      {
        title: "Tinjau antrean",
        detail:
          "Permohonan berstatus Diajukan menunggu keputusan; buka per tab sesuai jenis permohonannya.",
        roles: ["supervisor"],
      },
      {
        title: "Periksa konteks",
        detail: "Cek anggota, rekening, dan alasan permohonan sebelum memutuskan.",
        roles: ["supervisor"],
      },
      {
        title: "Setujui / tolak",
        detail:
          "Persetujuan langsung mengeksekusi aksinya (mis. rekening jadi aktif); penolakan wajib disertai alasan.",
        roles: ["supervisor"],
      },
    ],
    tips: [
      "Jumlah antrean tampil di panel tugas dashboard — nol berarti beres.",
      "Closing kas teller disetujui dari halaman Kas Teller, bukan di sini.",
    ],
  },
  "period-close": {
    title: "Cara pakai Tutup Periode",
    intro:
      "Menutup periode operasional (biasanya bulanan) supaya transaksi bertanggal lama tidak bisa diinput lagi — gerbang disiplin pembukuan.",
    steps: [
      {
        title: "Buat periode",
        detail: "Definisikan nama dan rentang tanggal periode berjalan.",
        roles: ["admin", "supervisor"],
      },
      {
        title: "Bereskan tugas sebelum tutup",
        detail: "Pastikan closing kas dan persetujuan yang menggantung sudah selesai.",
        roles: ["supervisor"],
      },
      {
        title: "Tutup periode",
        detail:
          "Klik Tutup pada periode Open yang sudah lewat tanggal akhirnya. Setelah Closed, input mundur ke periode itu ditolak.",
        roles: ["supervisor"],
      },
      {
        title: "Buka ulang bila perlu koreksi",
        detail: "Status Reopened mengizinkan koreksi terbatas — tutup kembali setelah selesai.",
        roles: ["supervisor"],
      },
    ],
    tips: [
      "Periode Open yang lewat tanggal akhir muncul sebagai peringatan di panel tugas dashboard.",
      "Tutup periode yang rapi membuat perhitungan SHU akhir tahun jauh lebih mudah.",
    ],
  },
  shu: {
    title: "Cara pakai SHU",
    intro:
      "SHU = Sisa Hasil Usaha, keuntungan koperasi selama setahun yang dibagikan kembali ke anggota sesuai kontribusinya. Halaman ini mengelola perhitungan dan pembagiannya.",
    steps: [
      {
        title: "Siapkan data setahun",
        detail: "Pastikan periode-periode operasional sudah ditutup supaya angka dasarnya final.",
        roles: ["supervisor"],
      },
      {
        title: "Jalankan wizard SHU",
        detail: "Wizard menghitung porsi tiap anggota dari simpanan dan partisipasinya.",
        roles: ["supervisor", "admin"],
      },
      {
        title: "Sahkan & bagikan",
        detail:
          "Setelah disahkan (umumnya lewat rapat anggota), pembagian dibukukan ke rekening anggota.",
        roles: ["supervisor"],
      },
    ],
    tips: [
      "SHU dibagi berdasar jasa simpanan dan jasa usaha tiap anggota — bukan dibagi rata.",
      "Dijalankan sekali per tahun buku, setelah semua periode berstatus Closed.",
    ],
  },
  ppatk: {
    title: "Cara pakai Laporan PPATK",
    intro:
      "Kewajiban lapor ke PPATK (Pusat Pelaporan dan Analisis Transaksi Keuangan): transaksi tunai besar atau mencurigakan dilaporkan lewat portal goAML.",
    steps: [
      {
        title: "Buat draft laporan",
        detail:
          "Siapkan laporan LTKT (tunai besar) atau LTKM (mencurigakan) — awalnya berstatus Draft.",
        roles: ["admin"],
      },
      {
        title: "Ajukan submit",
        detail: "Draft yang siap dikirim diset ke Pending Submit untuk diunggah ke goAML.",
        roles: ["admin", "supervisor"],
      },
      {
        title: "Tandai hasil",
        detail:
          "Setelah terkirim, isi nomor referensi goAML (Submitted); bila ditolak (Rejected), perbaiki lalu kirim ulang.",
        roles: ["admin"],
      },
    ],
    tips: [
      "Laporan menggantung (Draft, Pending Submit, Rejected) tampil di panel tugas dashboard.",
      "goAML = portal pelaporan resmi PPATK; simpan nomor referensinya sebagai bukti.",
    ],
  },
  laporan: {
    title: "Cara pakai Laporan",
    intro:
      "Ringkasan angka kunci koperasi — posisi simpanan, pembiayaan berjalan & macet, dan anggota aktif — dihitung langsung dari data terkini.",
    steps: [
      {
        title: "Baca kartu ringkasan",
        detail: "Empat kartu menampilkan posisi simpanan, pembiayaan, dan keanggotaan saat ini.",
        roles: ["admin", "supervisor"],
      },
      {
        title: "Telusuri sumber angka",
        detail:
          "Ada angka janggal? Buka halaman Rekening, Pembiayaan, atau Angsuran untuk rinciannya.",
        roles: ["admin"],
      },
    ],
    tips: [
      "Angka dibaca live dari data — tutup periode dulu supaya tidak bergeser saat dilaporkan.",
      "Laporan rinci (neraca syariah, SHU, mutasi kas teller) menyusul bertahap.",
    ],
  },
  pengaturan: {
    title: "Cara pakai Pengaturan",
    intro:
      "Konfigurasi koperasi: mode (syariah/konvensional), produk simpanan & pembiayaan, dan master pendukung (denominasi, merchant, fatwa, daftar sanksi).",
    steps: [
      {
        title: "Tetapkan mode koperasi",
        detail:
          "Mode syariah membuka menu ZIS/Wakaf dan istilah akad; konvensional memakai bunga. Mode menentukan menu di sidebar semua pengguna.",
        roles: ["admin"],
      },
      {
        title: "Susun produk",
        detail:
          "Produk simpanan & pembiayaan menentukan setoran minimal, nisbah/bunga, dan aturan rekening.",
        roles: ["admin"],
      },
      {
        title: "Lengkapi master pendukung",
        detail:
          "Denominasi untuk hitung kas, merchant untuk e-money, daftar sanksi untuk pemeriksaan PPATK.",
        roles: ["admin"],
      },
    ],
    tips: [
      "Selesaikan pengaturan sebelum mendaftarkan anggota pertama — lihat Alur Operasi di dashboard.",
      "Perubahan mode langsung mengubah susunan menu sidebar.",
    ],
  },
};
