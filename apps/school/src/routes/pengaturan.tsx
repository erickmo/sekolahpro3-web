import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Avatar,
  Badge,
  Button,
  type Column,
  DataTable,
  InfoField,
  InfoGrid,
  PageHeader,
  SectionCard,
  Tabs,
  type TabItem,
  IconSettings,
  IconId,
  IconUsers,
  IconBell,
  IconWallet,
  IconCalendar,
  IconFile,
  IconAlert,
  IconCheck,
  IconEdit,
  IconPlus,
  IconClock,
} from "@sekolahpro/ui";

type TabKey = "sekolah" | "akademik" | "peran" | "integrasi" | "notifikasi" | "keamanan" | "billing" | "branding" | "log";

interface Peran {
  nama: string;
  jumlahUser: number;
  permission: number;
  deskripsi: string;
  builtIn: boolean;
}

interface Integrasi {
  nama: string;
  deskripsi: string;
  status: "Terhubung" | "Belum" | "Error";
  terakhirSinkron?: string | undefined;
  versi?: string | undefined;
}

interface NotifikasiPref {
  kategori: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
}

const PERAN_LIST: Peran[] = [
  { nama: "Sekolah Admin", jumlahUser: 2, permission: 64, deskripsi: "Akses penuh ke semua modul sekolah", builtIn: true },
  { nama: "Kepala Sekolah", jumlahUser: 1, permission: 48, deskripsi: "Approval rapor, audit log, dashboard", builtIn: true },
  { nama: "Wali Kelas", jumlahUser: 24, permission: 22, deskripsi: "Kelas scope: nilai, absensi, wali", builtIn: true },
  { nama: "Guru", jumlahUser: 48, permission: 18, deskripsi: "Mapel scope: input nilai, jadwal, materi", builtIn: true },
  { nama: "Bendahara", jumlahUser: 2, permission: 30, deskripsi: "Tagihan, pembayaran, kas, approval", builtIn: true },
  { nama: "Petugas Koperasi", jumlahUser: 1, permission: 24, deskripsi: "Simpanan, pinjaman, transaksi toko", builtIn: true },
  { nama: "Pustakawan", jumlahUser: 1, permission: 20, deskripsi: "Koleksi buku, peminjaman, denda", builtIn: true },
  { nama: "Auditor", jumlahUser: 1, permission: 12, deskripsi: "Read-only ke audit log dan laporan", builtIn: true },
  { nama: "Tata Usaha", jumlahUser: 3, permission: 36, deskripsi: "Data siswa, guru, staff, dokumen", builtIn: true },
];

const INTEGRASI_LIST: Integrasi[] = [
  { nama: "Dapodik", deskripsi: "Sinkronisasi data siswa dan guru ke Dapodik Kemdikbud", status: "Terhubung", terakhirSinkron: "2026-05-24 06:00", versi: "v2024.b" },
  { nama: "EMIS Kemenag", deskripsi: "Sinkronisasi madrasah ke EMIS", status: "Belum" },
  { nama: "Midtrans", deskripsi: "Payment gateway untuk SPP dan PPDB", status: "Terhubung", terakhirSinkron: "2026-05-24 11:32", versi: "v2.45" },
  { nama: "Xendit", deskripsi: "Payment gateway alternatif", status: "Belum" },
  { nama: "WhatsApp Business", deskripsi: "Kirim pesan dan pengumuman via WA", status: "Terhubung", terakhirSinkron: "2026-05-24 12:10", versi: "Cloud API" },
  { nama: "Google Workspace", deskripsi: "SSO + Google Classroom integration", status: "Terhubung", terakhirSinkron: "2026-05-23 22:00" },
  { nama: "SIMPATIKA", deskripsi: "Data guru Kemenag", status: "Error", terakhirSinkron: "2026-05-22 06:00" },
  { nama: "Frappe ERPNext", deskripsi: "Backend doctype sync", status: "Terhubung", terakhirSinkron: "2026-05-24 12:30", versi: "v15.42" },
];

const NOTIFIKASI_LIST: NotifikasiPref[] = [
  { kategori: "Tagihan jatuh tempo", email: true, push: true, sms: false, inApp: true },
  { kategori: "Absensi siswa", email: false, push: true, sms: false, inApp: true },
  { kategori: "Nilai rapor tersedia", email: true, push: true, sms: false, inApp: true },
  { kategori: "Pengumuman sekolah", email: true, push: true, sms: true, inApp: true },
  { kategori: "Pengajuan cuti pegawai", email: true, push: false, sms: false, inApp: true },
  { kategori: "Stok perpustakaan rendah", email: false, push: false, sms: false, inApp: true },
  { kategori: "Audit log critical", email: true, push: true, sms: true, inApp: true },
];

const STATUS_INTEGRASI_TONE = {
  Terhubung: "success",
  Belum: "neutral",
  Error: "danger",
} as const;

function CheckCell({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex h-4 w-4 items-center justify-center text-emerald-600"><IconCheck /></span>
  ) : (
    <span className="text-muted-fg">—</span>
  );
}

function SekolahTab() {
  return (
    <div className="space-y-6">
      <SectionCard title="Identitas Sekolah" action={<Button variant="outline" size="sm"><span className="h-3.5 w-3.5 mr-1"><IconEdit /></span>Edit</Button>}>
        <InfoGrid cols={3}>
          <InfoField label="Nama Sekolah" value="SMA Negeri 1 Bandung" />
          <InfoField label="NPSN" value={<span className="tabular-nums">20219142</span>} />
          <InfoField label="NSS" value={<span className="tabular-nums">301026005001</span>} />
          <InfoField label="Jenjang" value="SMA" />
          <InfoField label="Status" value={<Badge tone="success">Negeri</Badge>} />
          <InfoField label="Akreditasi" value={<Badge tone="brand">A</Badge>} hint="Berlaku 2024-2029" />
          <InfoField label="Kepala Sekolah" value="Drs. Bambang Sutrisno, M.Pd." />
          <InfoField label="Tahun Berdiri" value="1962" />
          <InfoField label="Naungan" value="Kemendikbud" />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Alamat & Kontak">
        <InfoGrid cols={3}>
          <InfoField label="Alamat" value="Jl. Ir. H. Juanda No. 93" className="sm:col-span-2 lg:col-span-2" />
          <InfoField label="Kelurahan" value="Lebakgede" />
          <InfoField label="Kecamatan" value="Coblong" />
          <InfoField label="Kota" value="Kota Bandung" />
          <InfoField label="Provinsi" value="Jawa Barat" />
          <InfoField label="Kode Pos" value="40132" />
          <InfoField label="Telepon" value="(022) 2503097" />
          <InfoField label="Email" value="info@sman1-bdg.sch.id" />
          <InfoField label="Website" value="sman1-bdg.sch.id" />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Domain & Tenant">
        <InfoGrid cols={2}>
          <InfoField label="Subdomain" value="sman1bdg.sekolahpro.id" />
          <InfoField label="Domain Custom" value="portal.sman1-bdg.sch.id" hint="Terverifikasi" />
          <InfoField label="Tenant ID" value={<span className="tabular-nums">TNT-000142</span>} />
          <InfoField label="Wilayah Server" value="ID-JKT-1" />
        </InfoGrid>
      </SectionCard>
    </div>
  );
}

function AkademikTab() {
  return (
    <div className="space-y-6">
      <SectionCard title="Tahun Ajaran Aktif" action={<Button variant="outline" size="sm">Ganti Tahun Ajaran</Button>}>
        <InfoGrid cols={3}>
          <InfoField label="Tahun Ajaran" value="2025/2026" />
          <InfoField label="Semester" value={<Badge tone="brand">Genap</Badge>} />
          <InfoField label="Mulai" value="08 Jan 2026" />
          <InfoField label="Selesai" value="30 Jun 2026" />
          <InfoField label="Hari Aktif" value="120 hari" />
          <InfoField label="Hari Libur" value="22 hari" />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Skala Penilaian">
        <InfoGrid cols={4}>
          <InfoField label="A (Sangat Baik)" value="≥ 90" />
          <InfoField label="B (Baik)" value="80 - 89" />
          <InfoField label="C (Cukup)" value="70 - 79" />
          <InfoField label="D (Kurang)" value="< 70" />
          <InfoField label="KKM Pengetahuan" value="70" />
          <InfoField label="KKM Keterampilan" value="70" />
          <InfoField label="Skala Sikap" value="A-D Deskriptif" />
          <InfoField label="Sistem Rapor" value="Kurikulum Merdeka" />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Jam Operasional">
        <InfoGrid cols={3}>
          <InfoField label="Jam Pelajaran" value="45 menit" />
          <InfoField label="Mulai" value="07:00" />
          <InfoField label="Selesai" value="14:30" />
          <InfoField label="Jumat" value="07:00 - 11:30" />
          <InfoField label="Sabtu" value="07:00 - 12:00" hint="Ekstrakurikuler" />
          <InfoField label="Istirahat" value="2 sesi (15 menit)" />
        </InfoGrid>
      </SectionCard>
    </div>
  );
}

function PeranTab() {
  const cols: Column<Peran>[] = [
    { key: "nama", header: "Peran", cell: (r) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{r.nama}</span>
        {r.builtIn ? <Badge tone="neutral">Built-in</Badge> : <Badge tone="brand">Custom</Badge>}
      </div>
    ) },
    { key: "deskripsi", header: "Deskripsi", cell: (r) => <span className="text-sm text-muted-fg">{r.deskripsi}</span> },
    { key: "user", header: "User", align: "right", cell: (r) => <span className="tabular-nums">{r.jumlahUser}</span> },
    { key: "perm", header: "Permission", align: "right", cell: (r) => <span className="tabular-nums text-muted-fg">{r.permission}</span> },
    { key: "aksi", header: "", align: "right", cell: () => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="sm">Edit Permission</Button>
        <Button variant="ghost" size="sm">Anggota</Button>
      </div>
    ) },
  ];
  return (
    <SectionCard
      title="Peran Pengguna"
      description="9 peran terdaftar"
      action={<Button size="sm"><span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Tambah Peran</Button>}
      padded={false}
    >
      <DataTable data={PERAN_LIST} columns={cols} rowKey={(r) => r.nama} />
    </SectionCard>
  );
}

function IntegrasiTab() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {INTEGRASI_LIST.map((i) => (
        <div key={i.nama} className="rounded-xl border border-border bg-bg p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium text-fg">{i.nama}</div>
              <div className="text-xs text-muted-fg mt-0.5">{i.deskripsi}</div>
            </div>
            <Badge tone={STATUS_INTEGRASI_TONE[i.status]} dot>{i.status}</Badge>
          </div>
          {i.terakhirSinkron ? (
            <div className="text-xs text-muted-fg inline-flex items-center gap-1">
              <span className="h-3 w-3"><IconClock /></span>
              Terakhir sinkron: <span className="tabular-nums">{i.terakhirSinkron}</span>
            </div>
          ) : null}
          {i.versi ? <div className="text-xs text-muted-fg">Versi: {i.versi}</div> : null}
          <div className="flex gap-2 pt-1">
            {i.status === "Terhubung" ? (
              <>
                <Button variant="outline" size="sm">Konfigurasi</Button>
                <Button variant="ghost" size="sm">Putuskan</Button>
              </>
            ) : i.status === "Error" ? (
              <>
                <Button size="sm">Coba Lagi</Button>
                <Button variant="ghost" size="sm">Log</Button>
              </>
            ) : (
              <Button size="sm">Hubungkan</Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function NotifikasiTab() {
  const cols: Column<NotifikasiPref>[] = [
    { key: "kategori", header: "Kategori", cell: (r) => <span className="font-medium">{r.kategori}</span> },
    { key: "email", header: "Email", align: "center", cell: (r) => <CheckCell value={r.email} /> },
    { key: "push", header: "Push", align: "center", cell: (r) => <CheckCell value={r.push} /> },
    { key: "sms", header: "SMS", align: "center", cell: (r) => <CheckCell value={r.sms} /> },
    { key: "inApp", header: "In-App", align: "center", cell: (r) => <CheckCell value={r.inApp} /> },
    { key: "aksi", header: "", align: "right", cell: () => <Button variant="ghost" size="sm">Atur</Button> },
  ];
  return (
    <SectionCard
      title="Preferensi Notifikasi"
      description="Saluran pengiriman per kategori event"
      action={<Button variant="outline" size="sm">Reset ke Default</Button>}
      padded={false}
    >
      <DataTable data={NOTIFIKASI_LIST} columns={cols} rowKey={(r) => r.kategori} />
    </SectionCard>
  );
}

function KeamananTab() {
  return (
    <div className="space-y-6">
      <SectionCard title="Kebijakan Password">
        <InfoGrid cols={2}>
          <InfoField label="Panjang Minimum" value="10 karakter" />
          <InfoField label="Kompleksitas" value="Huruf besar + angka + simbol" />
          <InfoField label="Masa Berlaku" value="180 hari" />
          <InfoField label="Riwayat Password" value="5 terakhir tidak boleh diulang" />
          <InfoField label="Login Gagal Maks" value="5 kali" hint="Sebelum akun terkunci" />
          <InfoField label="Lockout Duration" value="30 menit" />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Autentikasi">
        <InfoGrid cols={3}>
          <InfoField label="2FA Wajib" value={<Badge tone="success">Aktif untuk Admin</Badge>} />
          <InfoField label="Metode 2FA" value="TOTP, SMS, Email" />
          <InfoField label="Session Timeout" value="60 menit idle" />
          <InfoField label="Single Sign-On" value={<Badge tone="brand">Google Workspace</Badge>} />
          <InfoField label="Remember Me" value="14 hari" />
          <InfoField label="Concurrent Sessions" value="3 device" />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Audit & Retensi">
        <InfoGrid cols={2}>
          <InfoField label="Audit Log Retensi" value="365 hari" />
          <InfoField label="Backup Otomatis" value={<Badge tone="success">Harian, 02:00 WIB</Badge>} />
          <InfoField label="Backup Retensi" value="90 hari" />
          <InfoField label="Data Siswa Lulus" value="Disimpan 5 tahun" />
        </InfoGrid>
      </SectionCard>
    </div>
  );
}

function BillingTab() {
  return (
    <div className="space-y-6">
      <SectionCard title="Paket Berlangganan" action={<Button variant="outline" size="sm">Ubah Paket</Button>}>
        <InfoGrid cols={3}>
          <InfoField label="Paket" value={<Badge tone="brand">SekolahPro Plus</Badge>} />
          <InfoField label="Siklus" value="Tahunan" />
          <InfoField label="Harga" value="Rp 18.000.000 / tahun" />
          <InfoField label="Maks Siswa" value="2.500" hint="Saat ini: 1.842" />
          <InfoField label="Maks Pegawai" value="200" hint="Saat ini: 72" />
          <InfoField label="Penyimpanan" value="100 GB" hint="Saat ini: 42.3 GB" />
          <InfoField label="Mulai" value="01 Jul 2025" />
          <InfoField label="Berakhir" value="30 Jun 2026" hint="38 hari lagi" />
          <InfoField label="Auto-renew" value={<Badge tone="success">Aktif</Badge>} />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Tagihan & Pembayaran">
        <InfoGrid cols={3}>
          <InfoField label="Metode Pembayaran" value="Virtual Account BCA" />
          <InfoField label="NPWP" value={<span className="tabular-nums">01.234.567.8-901.000</span>} />
          <InfoField label="Email Tagihan" value="finance@sman1-bdg.sch.id" />
        </InfoGrid>
      </SectionCard>
    </div>
  );
}

function BrandingTab() {
  return (
    <div className="space-y-6">
      <SectionCard title="Logo & Identitas Visual" action={<Button variant="outline" size="sm">Unggah Aset</Button>}>
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <div className="text-xs text-muted-fg mb-2">Logo Utama</div>
            <div className="h-32 rounded-lg border border-border bg-muted/30 flex items-center justify-center text-3xl font-bold text-brand">SMA1</div>
          </div>
          <div>
            <div className="text-xs text-muted-fg mb-2">Logo Mono</div>
            <div className="h-32 rounded-lg border border-border bg-fg flex items-center justify-center text-3xl font-bold text-bg">SMA1</div>
          </div>
          <div>
            <div className="text-xs text-muted-fg mb-2">Favicon</div>
            <div className="h-32 rounded-lg border border-border bg-muted/30 flex items-center justify-center text-xl font-bold text-brand">S</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Palet Warna">
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { name: "Brand", hex: "#2563eb", cls: "bg-blue-600" },
            { name: "Accent", hex: "#7c3aed", cls: "bg-violet-600" },
            { name: "Success", hex: "#10b981", cls: "bg-emerald-500" },
            { name: "Danger", hex: "#ef4444", cls: "bg-rose-500" },
          ].map((c) => (
            <div key={c.name} className="rounded-lg border border-border p-3 flex items-center gap-3">
              <span className={`h-10 w-10 rounded-md ${c.cls}`} />
              <div>
                <div className="text-sm font-medium">{c.name}</div>
                <div className="text-xs text-muted-fg tabular-nums">{c.hex}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function LogTab() {
  return (
    <SectionCard title="Riwayat Perubahan Konfigurasi" description="20 perubahan terakhir" padded={false}>
      <ul className="divide-y divide-border">
        {[
          { aktor: "Tata Usaha", aksi: "Mengubah jam operasional", waktu: "2026-05-23 14:20", tone: "neutral" as const },
          { aktor: "Sekolah Admin", aksi: "Menambah peran custom: Pembina OSIS", waktu: "2026-05-22 09:15", tone: "brand" as const },
          { aktor: "Sekolah Admin", aksi: "Menghubungkan integrasi WhatsApp Business", waktu: "2026-05-21 16:42", tone: "success" as const },
          { aktor: "Auditor", aksi: "Mengubah retensi audit log dari 180 ke 365 hari", waktu: "2026-05-20 11:08", tone: "warning" as const },
          { aktor: "Sistem", aksi: "Backup harian selesai", waktu: "2026-05-24 02:00", tone: "success" as const },
        ].map((a, i) => (
          <li key={i} className="flex items-start gap-3 px-5 py-3">
            <Avatar name={a.aktor} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-sm text-fg"><span className="font-medium">{a.aktor}</span> <span className="text-muted-fg">{a.aksi}</span></div>
              <div className="text-xs text-muted-fg mt-0.5 inline-flex items-center gap-1">
                <span className="h-3 w-3"><IconClock /></span>{a.waktu}
              </div>
            </div>
            <Badge tone={a.tone} dot>·</Badge>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

const TAB_META: { key: TabKey; label: string; icon: JSX.Element }[] = [
  { key: "sekolah", label: "Sekolah", icon: <IconId /> },
  { key: "akademik", label: "Akademik", icon: <IconCalendar /> },
  { key: "peran", label: "Peran", icon: <IconUsers /> },
  { key: "integrasi", label: "Integrasi", icon: <IconSettings /> },
  { key: "notifikasi", label: "Notifikasi", icon: <IconBell /> },
  { key: "keamanan", label: "Keamanan", icon: <IconAlert /> },
  { key: "billing", label: "Billing", icon: <IconWallet /> },
  { key: "branding", label: "Branding", icon: <IconFile /> },
  { key: "log", label: "Log Konfigurasi", icon: <IconClock /> },
];

function PengaturanPage() {
  const [tab, setTab] = useState<TabKey>("sekolah");

  const tabItems: TabItem[] = TAB_META.map((t) => ({
    key: t.key,
    label: t.label,
    icon: t.icon,
    active: tab === t.key,
    render: ({ className, children }) => (
      <button type="button" onClick={() => setTab(t.key)} className={className}>
        {children}
      </button>
    ),
  }));

  const renderTab = () => {
    switch (tab) {
      case "sekolah": return <SekolahTab />;
      case "akademik": return <AkademikTab />;
      case "peran": return <PeranTab />;
      case "integrasi": return <IntegrasiTab />;
      case "notifikasi": return <NotifikasiTab />;
      case "keamanan": return <KeamananTab />;
      case "billing": return <BillingTab />;
      case "branding": return <BrandingTab />;
      case "log": return <LogTab />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sistem"
        title="Pengaturan"
        description="Profil sekolah, peran pengguna, integrasi, dan keamanan."
        actions={
          <Button variant="outline">
            <span className="h-4 w-4 mr-1.5"><IconSettings /></span>
            Ekspor Konfigurasi
          </Button>
        }
      />
      <Tabs items={tabItems} />
      {renderTab()}
    </div>
  );
}

export const Route = createFileRoute("/pengaturan")({ component: PengaturanPage });
