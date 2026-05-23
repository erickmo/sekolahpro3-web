import { Link } from "react-router-dom";
import { Button } from "@sekolahpro/ui";

interface PillarDetail {
  key: string;
  title: string;
  tagline: string;
  description: string;
  users: string[];
  features: string[];
  workflow: string[];
}

const PILLARS: PillarDetail[] = [
  {
    key: "akademik",
    title: "Akademik",
    tagline: "Dari jadwal kelas sampai rapor.",
    description:
      "Semua aktivitas akademik dalam satu alur: penjadwalan otomatis, presensi harian, input nilai per mata pelajaran, sampai cetak rapor sesuai format Kurikulum Merdeka.",
    users: ["Guru", "Wali Kelas", "Kurikulum", "Kepala Sekolah"],
    features: [
      "Jadwal otomatis berdasarkan kapasitas kelas + ketersediaan guru",
      "Presensi harian via QR atau input cepat oleh wali kelas",
      "Bank soal & ujian online (PG, esai, hybrid)",
      "Buku nilai per fase + rapor PDF cetak/digital",
      "Catatan capaian profil pelajar Pancasila",
    ],
    workflow: ["Susun jadwal", "Catat presensi", "Input nilai", "Cetak rapor"],
  },
  {
    key: "ppdb",
    title: "PPDB",
    tagline: "Penerimaan siswa baru, tanpa antrean.",
    description:
      "Formulir online, seleksi otomatis berdasarkan zona/raport, pembayaran daftar ulang via QRIS, sampai SK penerimaan — semuanya satu alur.",
    users: ["Panitia PPDB", "Calon Orangtua", "Tata Usaha"],
    features: [
      "Formulir publik dengan unggah dokumen",
      "Verifikasi & seleksi otomatis berbasis kuota",
      "Pembayaran daftar ulang QRIS/virtual account",
      "SK penerimaan + nomor induk otomatis",
      "Statistik real-time kuota per jurusan",
    ],
    workflow: ["Daftar online", "Seleksi", "Bayar daftar ulang", "Terbit NIS"],
  },
  {
    key: "keuangan",
    title: "Keuangan",
    tagline: "Tagihan jelas, kasir cepat, laporan akurat.",
    description:
      "SPP bulanan, tagihan ekstra, pembayaran tunai/QRIS, sampai laporan kas harian — terintegrasi dengan data siswa dan rapor.",
    users: ["Bendahara", "Tata Usaha", "Orangtua", "Kepala Sekolah"],
    features: [
      "Master tagihan per kelas + diskon individual",
      "Pembayaran tunai, QRIS, virtual account, atau split",
      "Riwayat pembayaran orangtua di portal & WhatsApp",
      "Tutup kas harian + neraca bulanan otomatis",
      "Tunggakan jatuh tempo terdeteksi otomatis",
    ],
    workflow: ["Terbitkan tagihan", "Terima pembayaran", "Tutup kas", "Cetak laporan"],
  },
  {
    key: "koperasi",
    title: "Koperasi & Kantin",
    tagline: "Kartu e-money siswa + kasir cashless.",
    description:
      "Top-up saldo siswa via orangtua, transaksi tap-card di kantin/koperasi, laporan harian per stan — orangtua tahu uang anak kemana.",
    users: ["Pengelola Koperasi", "Penjaga Kantin", "Orangtua", "Siswa"],
    features: [
      "Top-up saldo siswa via QRIS oleh orangtua",
      "Terminal kasir Android + reader kartu RFID",
      "Limit harian per siswa (atur oleh orangtua)",
      "Riwayat transaksi siswa real-time",
      "Laporan stok & penjualan per stan",
    ],
    workflow: ["Top-up saldo", "Tap kartu", "Transaksi tercatat", "Laporan harian"],
  },
  {
    key: "komunikasi",
    title: "Komunikasi",
    tagline: "Pesan tepat sasaran ke orangtua.",
    description:
      "Pengumuman per kelas/sekolah, rapor digital, notifikasi tagihan & presensi anak — terkirim via aplikasi orangtua dan WhatsApp resmi.",
    users: ["Wali Kelas", "Humas", "Orangtua"],
    features: [
      "Broadcast pengumuman per kelas/jenjang/seluruh sekolah",
      "Template WhatsApp resmi (terverifikasi Meta)",
      "Rapor & raport tengah semester PDF digital",
      "Notifikasi presensi & tagihan otomatis",
      "Chat 2 arah wali kelas ↔ orangtua",
    ],
    workflow: ["Susun pesan", "Pilih audiens", "Kirim", "Pantau dibaca"],
  },
  {
    key: "data-induk",
    title: "Data Induk",
    tagline: "Satu sumber kebenaran data sekolah.",
    description:
      "Siswa, guru, kelas, dan struktur sekolah dalam satu master data — sinkron dengan Dapodik, dan jadi sumber untuk semua modul lain.",
    users: ["Tata Usaha", "Operator Dapodik", "Kepala Sekolah"],
    features: [
      "Master siswa dengan riwayat akademik lintas tahun",
      "Master guru + SK pengajaran",
      "Sinkronisasi Dapodik (impor & ekspor)",
      "Master kelas, jenjang, jurusan, tahun ajaran",
      "Riwayat perubahan terjamin (audit log)",
    ],
    workflow: ["Impor Dapodik", "Edit lokal", "Validasi", "Ekspor ulang"],
  },
];

export function Fitur() {
  return (
    <>
      <FiturHero />
      {PILLARS.map((p, i) => (
        <PillarSection key={p.key} pillar={p} reverse={i % 2 === 1} />
      ))}
      <FiturCTA />
    </>
  );
}

function FiturHero() {
  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <p className="text-sm font-medium text-brand">— Fitur</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold text-fg leading-tight max-w-3xl">
          Enam pilar untuk <em className="not-italic font-serif italic text-brand">satu sekolah utuh.</em>
        </h1>
        <p className="mt-4 text-lg text-muted-fg max-w-2xl">
          Setiap pilar bisa berdiri sendiri, namun saling memperkuat. Pakai sesuai kebutuhan sekolah Anda.
        </p>
      </div>
    </section>
  );
}

function PillarSection({ pillar, reverse }: { pillar: PillarDetail; reverse: boolean }) {
  return (
    <section className="py-16 sm:py-20 border-b border-border last:border-b-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`grid gap-10 lg:grid-cols-2 lg:items-start ${reverse ? "lg:[&>div:first-child]:order-2" : ""}`}>
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-semibold uppercase tracking-wide">
              {pillar.title}
            </div>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-fg leading-tight">
              {pillar.tagline}
            </h2>
            <p className="mt-4 text-muted-fg leading-relaxed">
              {pillar.description}
            </p>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-wide text-muted-fg">Untuk peran</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {pillar.users.map((u) => (
                  <span key={u} className="text-xs px-2.5 py-1 rounded-md bg-muted text-fg/80">
                    {u}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-wide text-muted-fg">Alur kerja</p>
              <ol className="mt-2 flex flex-wrap items-center gap-2 text-sm text-fg/80">
                {pillar.workflow.map((w, i) => (
                  <li key={w} className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-md border border-border bg-bg">{w}</span>
                    {i < pillar.workflow.length - 1 && <span className="text-muted-fg" aria-hidden>→</span>}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <ul className="space-y-3">
            {pillar.features.map((f) => (
              <li key={f} className="flex gap-3 items-start">
                <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand" aria-hidden />
                <span className="text-fg/90 leading-relaxed">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function FiturCTA() {
  return (
    <section className="py-16 sm:py-24 bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-semibold text-fg">
          Mulai dari satu pilar, kembangkan saat siap.
        </h2>
        <p className="mt-4 text-muted-fg">
          Anda tidak harus pakai semua dari awal. Tim kami bantu pilih pilar dengan dampak tercepat untuk sekolah Anda.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/kontak?utm=fitur">
            <Button size="lg" className="w-full sm:w-auto">Konsultasi Gratis</Button>
          </Link>
          <Link to="/partner">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">Lihat Sekolah Pengguna</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
