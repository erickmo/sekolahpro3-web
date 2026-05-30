import { useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@sekolahpro/auth";

const SAAS_ROLES = ["SekolahPro Admin", "SekolahPro Manager", "System Manager"] as const;

function useCanEditIdentitas(): boolean {
  const { roles } = useSession();
  return (roles ?? []).some((r) => SAAS_ROLES.includes(r as (typeof SAAS_ROLES)[number]));
}
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  type Column,
  DataTable,
  FormField,
  FormGrid,
  InfoField,
  InfoGrid,
  Input,
  Modal,
  PageHeader,
  SectionCard,
  Tabs,
  Textarea,
  DatePicker,
  SearchableSelect,
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

interface Identitas {
  nama: string;
  npsn: string;
  nss: string;
  jenjang: string;
  status: string;
  akreditasi: string;
  akreditasiBerlaku: string;
  kepsek: string;
  tahunBerdiri: string;
  naungan: string;
}

interface Alamat {
  jalan: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  provinsi: string;
  kodePos: string;
  telepon: string;
  email: string;
  website: string;
}

interface Domain {
  subdomain: string;
  domainCustom: string;
  tenantId: string;
  wilayah: string;
}

interface TahunAjaran {
  tahun: string;
  semester: string;
  mulai: string;
  selesai: string;
  hariAktif: number;
  hariLibur: number;
}

interface Skala {
  aMin: number;
  bMin: number;
  cMin: number;
  kkmPengetahuan: number;
  kkmKeterampilan: number;
  sistemRapor: string;
}

interface JamOperasional {
  durasiJP: number;
  mulai: string;
  selesai: string;
  jumat: string;
  sabtu: string;
  istirahat: string;
}

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

interface Keamanan {
  panjangMin: number;
  kompleksitas: string;
  masaBerlaku: number;
  riwayatPassword: number;
  loginGagalMaks: number;
  lockoutMenit: number;
  dua2faWajib: string;
  metode2fa: string;
  sessionTimeout: number;
  sso: string;
  rememberMe: number;
  concurrentSessions: number;
  auditRetensi: number;
  backupOtomatis: string;
  backupRetensi: number;
  dataLulus: string;
}

interface Billing {
  paket: string;
  siklus: string;
  harga: string;
  maksSiswa: number;
  maksPegawai: number;
  penyimpanan: string;
  mulai: string;
  berakhir: string;
  autoRenew: boolean;
  metodePembayaran: string;
  npwp: string;
  emailTagihan: string;
}

const INITIAL_IDENTITAS: Identitas = {
  nama: "SMA Negeri 1 Bandung",
  npsn: "20219142",
  nss: "301026005001",
  jenjang: "SMA",
  status: "Negeri",
  akreditasi: "A",
  akreditasiBerlaku: "Berlaku 2024-2029",
  kepsek: "Drs. Bambang Sutrisno, M.Pd.",
  tahunBerdiri: "1962",
  naungan: "Kemendikbud",
};

const INITIAL_ALAMAT: Alamat = {
  jalan: "Jl. Ir. H. Juanda No. 93",
  kelurahan: "Lebakgede",
  kecamatan: "Coblong",
  kota: "Kota Bandung",
  provinsi: "Jawa Barat",
  kodePos: "40132",
  telepon: "(022) 2503097",
  email: "info@sman1-bdg.sch.id",
  website: "sman1-bdg.sch.id",
};

const INITIAL_DOMAIN: Domain = {
  subdomain: "sman1bdg.sekolahpro.id",
  domainCustom: "portal.sman1-bdg.sch.id",
  tenantId: "TNT-000142",
  wilayah: "ID-JKT-1",
};

const INITIAL_TAHUN: TahunAjaran = {
  tahun: "2025/2026",
  semester: "Genap",
  mulai: "2026-01-08",
  selesai: "2026-06-30",
  hariAktif: 120,
  hariLibur: 22,
};

const INITIAL_SKALA: Skala = {
  aMin: 90,
  bMin: 80,
  cMin: 70,
  kkmPengetahuan: 70,
  kkmKeterampilan: 70,
  sistemRapor: "Kurikulum Merdeka",
};

const INITIAL_JAM: JamOperasional = {
  durasiJP: 45,
  mulai: "07:00",
  selesai: "14:30",
  jumat: "07:00 - 11:30",
  sabtu: "07:00 - 12:00",
  istirahat: "2 sesi (15 menit)",
};

const INITIAL_PERAN: Peran[] = [
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

const INITIAL_INTEGRASI: Integrasi[] = [
  { nama: "Dapodik", deskripsi: "Sinkronisasi data siswa dan guru ke Dapodik Kemdikbud", status: "Terhubung", terakhirSinkron: "2026-05-24 06:00", versi: "v2024.b" },
  { nama: "EMIS Kemenag", deskripsi: "Sinkronisasi madrasah ke EMIS", status: "Belum" },
  { nama: "Midtrans", deskripsi: "Payment gateway untuk SPP dan PPDB", status: "Terhubung", terakhirSinkron: "2026-05-24 11:32", versi: "v2.45" },
  { nama: "Xendit", deskripsi: "Payment gateway alternatif", status: "Belum" },
  { nama: "WhatsApp Business", deskripsi: "Kirim pesan dan pengumuman via WA", status: "Terhubung", terakhirSinkron: "2026-05-24 12:10", versi: "Cloud API" },
  { nama: "Google Workspace", deskripsi: "SSO + Google Classroom integration", status: "Terhubung", terakhirSinkron: "2026-05-23 22:00" },
  { nama: "SIMPATIKA", deskripsi: "Data guru Kemenag", status: "Error", terakhirSinkron: "2026-05-22 06:00" },
  { nama: "Frappe ERPNext", deskripsi: "Backend doctype sync", status: "Terhubung", terakhirSinkron: "2026-05-24 12:30", versi: "v15.42" },
];

const INITIAL_NOTIFIKASI: NotifikasiPref[] = [
  { kategori: "Tagihan jatuh tempo", email: true, push: true, sms: false, inApp: true },
  { kategori: "Absensi siswa", email: false, push: true, sms: false, inApp: true },
  { kategori: "Nilai rapor tersedia", email: true, push: true, sms: false, inApp: true },
  { kategori: "Pengumuman sekolah", email: true, push: true, sms: true, inApp: true },
  { kategori: "Pengajuan cuti pegawai", email: true, push: false, sms: false, inApp: true },
  { kategori: "Stok perpustakaan rendah", email: false, push: false, sms: false, inApp: true },
  { kategori: "Audit log critical", email: true, push: true, sms: true, inApp: true },
];

const INITIAL_KEAMANAN: Keamanan = {
  panjangMin: 10,
  kompleksitas: "Huruf besar + angka + simbol",
  masaBerlaku: 180,
  riwayatPassword: 5,
  loginGagalMaks: 5,
  lockoutMenit: 30,
  dua2faWajib: "Aktif untuk Admin",
  metode2fa: "TOTP, SMS, Email",
  sessionTimeout: 60,
  sso: "Google Workspace",
  rememberMe: 14,
  concurrentSessions: 3,
  auditRetensi: 365,
  backupOtomatis: "Harian, 02:00 WIB",
  backupRetensi: 90,
  dataLulus: "Disimpan 5 tahun",
};

const INITIAL_BILLING: Billing = {
  paket: "SekolahPro Plus",
  siklus: "Tahunan",
  harga: "Rp 18.000.000 / tahun",
  maksSiswa: 2500,
  maksPegawai: 200,
  penyimpanan: "100 GB",
  mulai: "2025-07-01",
  berakhir: "2026-06-30",
  autoRenew: true,
  metodePembayaran: "Virtual Account BCA",
  npwp: "01.234.567.8-901.000",
  emailTagihan: "finance@sman1-bdg.sch.id",
};

const STATUS_INTEGRASI_TONE = {
  Terhubung: "success",
  Belum: "neutral",
  Error: "danger",
} as const;

function CheckCell({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={
        value
          ? "inline-flex h-5 w-5 items-center justify-center rounded text-emerald-600 hover:bg-emerald-50"
          : "inline-flex h-5 w-5 items-center justify-center rounded text-muted-fg hover:bg-muted"
      }
      aria-label="Toggle"
    >
      {value ? <IconCheck /> : <span>—</span>}
    </button>
  );
}

function SavedFlash({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-600">
      <span className="h-3 w-3"><IconCheck /></span>Tersimpan
    </span>
  );
}

function useFlash() {
  const [key, setKey] = useState<string | null>(null);
  const trigger = (k: string) => {
    setKey(k);
    setTimeout(() => setKey((cur) => (cur === k ? null : cur)), 1800);
  };
  return [key, trigger] as const;
}

interface EditButtonProps {
  onClick: () => void;
  label?: string;
}
function EditButton({ onClick, label = "Edit" }: EditButtonProps) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      <span className="h-3.5 w-3.5 mr-1"><IconEdit /></span>{label}
    </Button>
  );
}

function ModalFooter({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <>
      <Button variant="ghost" onClick={onCancel}>Batal</Button>
      <Button onClick={onSave}>Simpan</Button>
    </>
  );
}

function IdentitasModal({ open, onClose, value, onSave }: { open: boolean; onClose: () => void; value: Identitas; onSave: (v: Identitas) => void }) {
  const [draft, setDraft] = useState<Identitas>(value);
  const set = (k: keyof Identitas, v: string) => setDraft({ ...draft, [k]: v });
  return (
    <Modal open={open} onClose={onClose} title="Edit Identitas Sekolah" size="lg" footer={<ModalFooter onCancel={onClose} onSave={() => onSave(draft)} />}>
      <FormGrid cols={2}>
        <FormField label="Nama Sekolah" required><Input value={draft.nama} onChange={(e) => set("nama", e.target.value)} /></FormField>
        <FormField label="NPSN"><Input value={draft.npsn} onChange={(e) => set("npsn", e.target.value)} /></FormField>
        <FormField label="NSS"><Input value={draft.nss} onChange={(e) => set("nss", e.target.value)} /></FormField>
        <FormField label="Jenjang">
          <SearchableSelect
            value={draft.jenjang}
            onChange={(v) => set("jenjang", v)}
            options={["PAUD", "TK", "SD", "SMP", "SMA", "SMK", "MA"].map((o) => ({ value: o, label: o }))}
          />
        </FormField>
        <FormField label="Status">
          <SearchableSelect
            value={draft.status}
            onChange={(v) => set("status", v)}
            options={["Negeri", "Swasta"].map((o) => ({ value: o, label: o }))}
          />
        </FormField>
        <FormField label="Akreditasi">
          <SearchableSelect
            value={draft.akreditasi}
            onChange={(v) => set("akreditasi", v)}
            options={["A", "B", "C", "Belum"].map((o) => ({ value: o, label: o }))}
          />
        </FormField>
        <FormField label="Akreditasi Berlaku" className="sm:col-span-2"><Input value={draft.akreditasiBerlaku} onChange={(e) => set("akreditasiBerlaku", e.target.value)} /></FormField>
        <FormField label="Kepala Sekolah" className="sm:col-span-2"><Input value={draft.kepsek} onChange={(e) => set("kepsek", e.target.value)} /></FormField>
        <FormField label="Tahun Berdiri"><Input value={draft.tahunBerdiri} onChange={(e) => set("tahunBerdiri", e.target.value)} /></FormField>
        <FormField label="Naungan">
          <SearchableSelect
            value={draft.naungan}
            onChange={(v) => set("naungan", v)}
            options={["Kemendikbud", "Kemenag", "Yayasan"].map((o) => ({ value: o, label: o }))}
          />
        </FormField>
      </FormGrid>
    </Modal>
  );
}

function AlamatModal({ open, onClose, value, onSave }: { open: boolean; onClose: () => void; value: Alamat; onSave: (v: Alamat) => void }) {
  const [draft, setDraft] = useState<Alamat>(value);
  const set = (k: keyof Alamat, v: string) => setDraft({ ...draft, [k]: v });
  return (
    <Modal open={open} onClose={onClose} title="Edit Alamat & Kontak" size="lg" footer={<ModalFooter onCancel={onClose} onSave={() => onSave(draft)} />}>
      <FormGrid cols={3}>
        <FormField label="Alamat" className="sm:col-span-3"><Textarea value={draft.jalan} onChange={(e) => set("jalan", e.target.value)} rows={2} /></FormField>
        <FormField label="Kelurahan"><Input value={draft.kelurahan} onChange={(e) => set("kelurahan", e.target.value)} /></FormField>
        <FormField label="Kecamatan"><Input value={draft.kecamatan} onChange={(e) => set("kecamatan", e.target.value)} /></FormField>
        <FormField label="Kota"><Input value={draft.kota} onChange={(e) => set("kota", e.target.value)} /></FormField>
        <FormField label="Provinsi"><Input value={draft.provinsi} onChange={(e) => set("provinsi", e.target.value)} /></FormField>
        <FormField label="Kode Pos"><Input value={draft.kodePos} onChange={(e) => set("kodePos", e.target.value)} /></FormField>
        <FormField label="Telepon"><Input value={draft.telepon} onChange={(e) => set("telepon", e.target.value)} /></FormField>
        <FormField label="Email"><Input type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} /></FormField>
        <FormField label="Website" className="sm:col-span-2"><Input value={draft.website} onChange={(e) => set("website", e.target.value)} /></FormField>
      </FormGrid>
    </Modal>
  );
}

function DomainModal({ open, onClose, value, onSave }: { open: boolean; onClose: () => void; value: Domain; onSave: (v: Domain) => void }) {
  const [draft, setDraft] = useState<Domain>(value);
  const set = (k: keyof Domain, v: string) => setDraft({ ...draft, [k]: v });
  return (
    <Modal open={open} onClose={onClose} title="Edit Domain & Tenant" footer={<ModalFooter onCancel={onClose} onSave={() => onSave(draft)} />}>
      <FormGrid cols={2}>
        <FormField label="Subdomain" hint="Bagian sebelum sekolahpro.id"><Input value={draft.subdomain} onChange={(e) => set("subdomain", e.target.value)} /></FormField>
        <FormField label="Domain Custom"><Input value={draft.domainCustom} onChange={(e) => set("domainCustom", e.target.value)} /></FormField>
        <FormField label="Tenant ID" hint="Tidak dapat diubah"><Input value={draft.tenantId} disabled /></FormField>
        <FormField label="Wilayah Server">
          <SearchableSelect
            value={draft.wilayah}
            onChange={(v) => set("wilayah", v)}
            options={["ID-JKT-1", "ID-JKT-2", "ID-SBY-1", "SG-1"].map((o) => ({ value: o, label: o }))}
          />
        </FormField>
      </FormGrid>
    </Modal>
  );
}

function SekolahTab({
  identitas, setIdentitas, alamat, setAlamat, domain, setDomain, flash, flashKey,
}: {
  identitas: Identitas; setIdentitas: (v: Identitas) => void;
  alamat: Alamat; setAlamat: (v: Alamat) => void;
  domain: Domain; setDomain: (v: Domain) => void;
  flash: (k: string) => void; flashKey: string | null;
}) {
  const [open, setOpen] = useState<"identitas" | "alamat" | "domain" | null>(null);
  const canEditIdentitas = useCanEditIdentitas();
  return (
    <div className="space-y-6">
      <SectionCard
        title={<span>Identitas Sekolah<SavedFlash show={flashKey === "identitas"} /></span>}
        action={canEditIdentitas ? <EditButton onClick={() => setOpen("identitas")} /> : <span className="text-xs text-muted-fg">Hanya SaaS User</span>}
      >
        <InfoGrid cols={3}>
          <InfoField label="Nama Sekolah" value={identitas.nama} />
          <InfoField label="NPSN" value={<span className="tabular-nums">{identitas.npsn}</span>} />
          <InfoField label="NSS" value={<span className="tabular-nums">{identitas.nss}</span>} />
          <InfoField label="Jenjang" value={identitas.jenjang} />
          <InfoField label="Status" value={<Badge tone="success">{identitas.status}</Badge>} />
          <InfoField label="Akreditasi" value={<Badge tone="brand">{identitas.akreditasi}</Badge>} hint={identitas.akreditasiBerlaku} />
          <InfoField label="Kepala Sekolah" value={identitas.kepsek} />
          <InfoField label="Tahun Berdiri" value={identitas.tahunBerdiri} />
          <InfoField label="Naungan" value={identitas.naungan} />
        </InfoGrid>
      </SectionCard>

      <SectionCard
        title={<span>Alamat & Kontak<SavedFlash show={flashKey === "alamat"} /></span>}
        action={<EditButton onClick={() => setOpen("alamat")} />}
      >
        <InfoGrid cols={3}>
          <InfoField label="Alamat" value={alamat.jalan} className="sm:col-span-2 lg:col-span-2" />
          <InfoField label="Kelurahan" value={alamat.kelurahan} />
          <InfoField label="Kecamatan" value={alamat.kecamatan} />
          <InfoField label="Kota" value={alamat.kota} />
          <InfoField label="Provinsi" value={alamat.provinsi} />
          <InfoField label="Kode Pos" value={alamat.kodePos} />
          <InfoField label="Telepon" value={alamat.telepon} />
          <InfoField label="Email" value={alamat.email} />
          <InfoField label="Website" value={alamat.website} />
        </InfoGrid>
      </SectionCard>

      <SectionCard
        title={<span>Domain & Tenant<SavedFlash show={flashKey === "domain"} /></span>}
        action={<EditButton onClick={() => setOpen("domain")} />}
      >
        <InfoGrid cols={2}>
          <InfoField label="Subdomain" value={domain.subdomain} />
          <InfoField label="Domain Custom" value={domain.domainCustom} hint="Terverifikasi" />
          <InfoField label="Tenant ID" value={<span className="tabular-nums">{domain.tenantId}</span>} />
          <InfoField label="Wilayah Server" value={domain.wilayah} />
        </InfoGrid>
      </SectionCard>

      <IdentitasModal open={canEditIdentitas && open === "identitas"} onClose={() => setOpen(null)} value={identitas} onSave={(v) => { setIdentitas(v); setOpen(null); flash("identitas"); }} />
      <AlamatModal open={open === "alamat"} onClose={() => setOpen(null)} value={alamat} onSave={(v) => { setAlamat(v); setOpen(null); flash("alamat"); }} />
      <DomainModal open={open === "domain"} onClose={() => setOpen(null)} value={domain} onSave={(v) => { setDomain(v); setOpen(null); flash("domain"); }} />
    </div>
  );
}

function TahunModal({ open, onClose, value, onSave }: { open: boolean; onClose: () => void; value: TahunAjaran; onSave: (v: TahunAjaran) => void }) {
  const [draft, setDraft] = useState<TahunAjaran>(value);
  return (
    <Modal open={open} onClose={onClose} title="Ganti Tahun Ajaran" footer={<ModalFooter onCancel={onClose} onSave={() => onSave(draft)} />}>
      <FormGrid cols={2}>
        <FormField label="Tahun Ajaran" required><Input value={draft.tahun} onChange={(e) => setDraft({ ...draft, tahun: e.target.value })} placeholder="2026/2027" /></FormField>
        <FormField label="Semester">
          <SearchableSelect
            value={draft.semester}
            onChange={(v) => setDraft({ ...draft, semester: v })}
            options={["Ganjil", "Genap"].map((o) => ({ value: o, label: o }))}
          />
        </FormField>
        <FormField label="Mulai"><DatePicker value={draft.mulai} onChange={(v) => setDraft({ ...draft, mulai: v })} /></FormField>
        <FormField label="Selesai"><DatePicker value={draft.selesai} onChange={(v) => setDraft({ ...draft, selesai: v })} /></FormField>
        <FormField label="Hari Aktif"><Input type="number" value={draft.hariAktif} onChange={(e) => setDraft({ ...draft, hariAktif: Number(e.target.value) })} /></FormField>
        <FormField label="Hari Libur"><Input type="number" value={draft.hariLibur} onChange={(e) => setDraft({ ...draft, hariLibur: Number(e.target.value) })} /></FormField>
      </FormGrid>
    </Modal>
  );
}

function SkalaModal({ open, onClose, value, onSave }: { open: boolean; onClose: () => void; value: Skala; onSave: (v: Skala) => void }) {
  const [draft, setDraft] = useState<Skala>(value);
  const setNum = (k: keyof Skala, v: string) => setDraft({ ...draft, [k]: Number(v) });
  return (
    <Modal open={open} onClose={onClose} title="Edit Skala Penilaian" footer={<ModalFooter onCancel={onClose} onSave={() => onSave(draft)} />}>
      <FormGrid cols={2}>
        <FormField label="A (Sangat Baik) - Min" hint="≥ nilai ini"><Input type="number" value={draft.aMin} onChange={(e) => setNum("aMin", e.target.value)} /></FormField>
        <FormField label="B (Baik) - Min"><Input type="number" value={draft.bMin} onChange={(e) => setNum("bMin", e.target.value)} /></FormField>
        <FormField label="C (Cukup) - Min"><Input type="number" value={draft.cMin} onChange={(e) => setNum("cMin", e.target.value)} /></FormField>
        <FormField label="Sistem Rapor">
          <SearchableSelect
            value={draft.sistemRapor}
            onChange={(v) => setDraft({ ...draft, sistemRapor: v })}
            options={["Kurikulum Merdeka", "Kurikulum 2013", "KTSP"].map((o) => ({ value: o, label: o }))}
          />
        </FormField>
        <FormField label="KKM Pengetahuan"><Input type="number" value={draft.kkmPengetahuan} onChange={(e) => setNum("kkmPengetahuan", e.target.value)} /></FormField>
        <FormField label="KKM Keterampilan"><Input type="number" value={draft.kkmKeterampilan} onChange={(e) => setNum("kkmKeterampilan", e.target.value)} /></FormField>
      </FormGrid>
    </Modal>
  );
}

function JamModal({ open, onClose, value, onSave }: { open: boolean; onClose: () => void; value: JamOperasional; onSave: (v: JamOperasional) => void }) {
  const [draft, setDraft] = useState<JamOperasional>(value);
  const set = (k: keyof JamOperasional, v: string | number) => setDraft({ ...draft, [k]: v });
  return (
    <Modal open={open} onClose={onClose} title="Edit Jam Operasional" footer={<ModalFooter onCancel={onClose} onSave={() => onSave(draft)} />}>
      <FormGrid cols={2}>
        <FormField label="Durasi Jam Pelajaran (menit)"><Input type="number" value={draft.durasiJP} onChange={(e) => set("durasiJP", Number(e.target.value))} /></FormField>
        <FormField label="Istirahat"><Input value={draft.istirahat} onChange={(e) => set("istirahat", e.target.value)} /></FormField>
        <FormField label="Mulai (Senin-Kamis)"><Input type="time" value={draft.mulai} onChange={(e) => set("mulai", e.target.value)} /></FormField>
        <FormField label="Selesai (Senin-Kamis)"><Input type="time" value={draft.selesai} onChange={(e) => set("selesai", e.target.value)} /></FormField>
        <FormField label="Jumat"><Input value={draft.jumat} onChange={(e) => set("jumat", e.target.value)} /></FormField>
        <FormField label="Sabtu"><Input value={draft.sabtu} onChange={(e) => set("sabtu", e.target.value)} /></FormField>
      </FormGrid>
    </Modal>
  );
}

function AkademikTab({
  tahun, setTahun, skala, setSkala, jam, setJam, flash, flashKey,
}: {
  tahun: TahunAjaran; setTahun: (v: TahunAjaran) => void;
  skala: Skala; setSkala: (v: Skala) => void;
  jam: JamOperasional; setJam: (v: JamOperasional) => void;
  flash: (k: string) => void; flashKey: string | null;
}) {
  const [open, setOpen] = useState<"tahun" | "skala" | "jam" | null>(null);
  return (
    <div className="space-y-6">
      <SectionCard
        title={<span>Tahun Ajaran Aktif<SavedFlash show={flashKey === "tahun"} /></span>}
        action={<Button variant="outline" size="sm" onClick={() => setOpen("tahun")}>Ganti Tahun Ajaran</Button>}
      >
        <InfoGrid cols={3}>
          <InfoField label="Tahun Ajaran" value={tahun.tahun} />
          <InfoField label="Semester" value={<Badge tone="brand">{tahun.semester}</Badge>} />
          <InfoField label="Mulai" value={tahun.mulai} />
          <InfoField label="Selesai" value={tahun.selesai} />
          <InfoField label="Hari Aktif" value={`${tahun.hariAktif} hari`} />
          <InfoField label="Hari Libur" value={`${tahun.hariLibur} hari`} />
        </InfoGrid>
      </SectionCard>

      <SectionCard
        title={<span>Skala Penilaian<SavedFlash show={flashKey === "skala"} /></span>}
        action={<EditButton onClick={() => setOpen("skala")} />}
      >
        <InfoGrid cols={4}>
          <InfoField label="A (Sangat Baik)" value={`≥ ${skala.aMin}`} />
          <InfoField label="B (Baik)" value={`${skala.bMin} - ${skala.aMin - 1}`} />
          <InfoField label="C (Cukup)" value={`${skala.cMin} - ${skala.bMin - 1}`} />
          <InfoField label="D (Kurang)" value={`< ${skala.cMin}`} />
          <InfoField label="KKM Pengetahuan" value={String(skala.kkmPengetahuan)} />
          <InfoField label="KKM Keterampilan" value={String(skala.kkmKeterampilan)} />
          <InfoField label="Skala Sikap" value="A-D Deskriptif" />
          <InfoField label="Sistem Rapor" value={skala.sistemRapor} />
        </InfoGrid>
      </SectionCard>

      <SectionCard
        title={<span>Jam Operasional<SavedFlash show={flashKey === "jam"} /></span>}
        action={<EditButton onClick={() => setOpen("jam")} />}
      >
        <InfoGrid cols={3}>
          <InfoField label="Jam Pelajaran" value={`${jam.durasiJP} menit`} />
          <InfoField label="Mulai" value={jam.mulai} />
          <InfoField label="Selesai" value={jam.selesai} />
          <InfoField label="Jumat" value={jam.jumat} />
          <InfoField label="Sabtu" value={jam.sabtu} hint="Ekstrakurikuler" />
          <InfoField label="Istirahat" value={jam.istirahat} />
        </InfoGrid>
      </SectionCard>

      <TahunModal open={open === "tahun"} onClose={() => setOpen(null)} value={tahun} onSave={(v) => { setTahun(v); setOpen(null); flash("tahun"); }} />
      <SkalaModal open={open === "skala"} onClose={() => setOpen(null)} value={skala} onSave={(v) => { setSkala(v); setOpen(null); flash("skala"); }} />
      <JamModal open={open === "jam"} onClose={() => setOpen(null)} value={jam} onSave={(v) => { setJam(v); setOpen(null); flash("jam"); }} />
    </div>
  );
}

function PeranModal({ open, onClose, value, onSave }: { open: boolean; onClose: () => void; value: Peran; onSave: (v: Peran) => void }) {
  const [draft, setDraft] = useState<Peran>(value);
  return (
    <Modal open={open} onClose={onClose} title={`Edit Peran: ${value.nama}`} footer={<ModalFooter onCancel={onClose} onSave={() => onSave(draft)} />}>
      <FormGrid cols={2}>
        <FormField label="Nama Peran" required className="sm:col-span-2"><Input value={draft.nama} onChange={(e) => setDraft({ ...draft, nama: e.target.value })} disabled={draft.builtIn} /></FormField>
        <FormField label="Deskripsi" className="sm:col-span-2"><Textarea value={draft.deskripsi} onChange={(e) => setDraft({ ...draft, deskripsi: e.target.value })} rows={2} /></FormField>
        <FormField label="Jumlah Permission"><Input type="number" value={draft.permission} onChange={(e) => setDraft({ ...draft, permission: Number(e.target.value) })} /></FormField>
        <FormField label="Jumlah User" hint="Read-only"><Input type="number" value={draft.jumlahUser} disabled /></FormField>
      </FormGrid>
    </Modal>
  );
}

function PeranTambahModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (v: Peran) => void }) {
  const [draft, setDraft] = useState<Peran>({ nama: "", jumlahUser: 0, permission: 0, deskripsi: "", builtIn: false });
  return (
    <Modal open={open} onClose={onClose} title="Tambah Peran Custom" footer={<ModalFooter onCancel={onClose} onSave={() => { if (draft.nama.trim()) onSave(draft); }} />}>
      <FormGrid cols={2}>
        <FormField label="Nama Peran" required className="sm:col-span-2"><Input value={draft.nama} onChange={(e) => setDraft({ ...draft, nama: e.target.value })} placeholder="contoh: Pembina OSIS" /></FormField>
        <FormField label="Deskripsi" className="sm:col-span-2"><Textarea value={draft.deskripsi} onChange={(e) => setDraft({ ...draft, deskripsi: e.target.value })} rows={2} /></FormField>
        <FormField label="Jumlah Permission"><Input type="number" value={draft.permission} onChange={(e) => setDraft({ ...draft, permission: Number(e.target.value) })} /></FormField>
      </FormGrid>
    </Modal>
  );
}

function PeranTab({ list, setList, flash, flashKey }: { list: Peran[]; setList: (v: Peran[]) => void; flash: (k: string) => void; flashKey: string | null }) {
  const [editing, setEditing] = useState<Peran | null>(null);
  const [adding, setAdding] = useState(false);

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
    { key: "aksi", header: "", align: "right", cell: (r) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>Edit</Button>
        {!r.builtIn && (
          <Button variant="ghost" size="sm" onClick={() => { setList(list.filter((p) => p.nama !== r.nama)); flash("peran"); }}>Hapus</Button>
        )}
      </div>
    ) },
  ];
  return (
    <>
      <SectionCard
        title={<span>Peran Pengguna<SavedFlash show={flashKey === "peran"} /></span>}
        description={`${list.length} peran terdaftar`}
        action={<Button size="sm" onClick={() => setAdding(true)}><span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Tambah Peran</Button>}
        padded={false}
      >
        <DataTable data={list} columns={cols} rowKey={(r) => r.nama} />
      </SectionCard>
      {editing && (
        <PeranModal
          open
          onClose={() => setEditing(null)}
          value={editing}
          onSave={(v) => { setList(list.map((p) => (p.nama === editing.nama ? v : p))); setEditing(null); flash("peran"); }}
        />
      )}
      <PeranTambahModal
        open={adding}
        onClose={() => setAdding(false)}
        onSave={(v) => { setList([...list, v]); setAdding(false); flash("peran"); }}
      />
    </>
  );
}

function IntegrasiTab({ list, setList, flash }: { list: Integrasi[]; setList: (v: Integrasi[]) => void; flash: (k: string) => void }) {
  const updateStatus = (nama: string, status: Integrasi["status"]) => {
    setList(list.map((i) => i.nama === nama ? {
      ...i,
      status,
      terakhirSinkron: status === "Terhubung" ? new Date().toISOString().slice(0, 16).replace("T", " ") : i.terakhirSinkron,
    } : i));
    flash(`integrasi-${nama}`);
  };
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {list.map((i) => (
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
                <Button variant="outline" size="sm" onClick={() => updateStatus(i.nama, "Terhubung")}>Sinkron Ulang</Button>
                <Button variant="ghost" size="sm" onClick={() => updateStatus(i.nama, "Belum")}>Putuskan</Button>
              </>
            ) : i.status === "Error" ? (
              <>
                <Button size="sm" onClick={() => updateStatus(i.nama, "Terhubung")}>Coba Lagi</Button>
                <Button variant="ghost" size="sm" onClick={() => updateStatus(i.nama, "Belum")}>Putuskan</Button>
              </>
            ) : (
              <Button size="sm" onClick={() => updateStatus(i.nama, "Terhubung")}>Hubungkan</Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function NotifikasiTab({ list, setList, reset, flash, flashKey }: { list: NotifikasiPref[]; setList: (v: NotifikasiPref[]) => void; reset: () => void; flash: (k: string) => void; flashKey: string | null }) {
  const toggle = (kategori: string, field: keyof Omit<NotifikasiPref, "kategori">) => {
    setList(list.map((r) => r.kategori === kategori ? { ...r, [field]: !r[field] } : r));
    flash("notifikasi");
  };
  const cols: Column<NotifikasiPref>[] = [
    { key: "kategori", header: "Kategori", cell: (r) => <span className="font-medium">{r.kategori}</span> },
    { key: "email", header: "Email", align: "center", cell: (r) => <CheckCell value={r.email} onToggle={() => toggle(r.kategori, "email")} /> },
    { key: "push", header: "Push", align: "center", cell: (r) => <CheckCell value={r.push} onToggle={() => toggle(r.kategori, "push")} /> },
    { key: "sms", header: "SMS", align: "center", cell: (r) => <CheckCell value={r.sms} onToggle={() => toggle(r.kategori, "sms")} /> },
    { key: "inApp", header: "In-App", align: "center", cell: (r) => <CheckCell value={r.inApp} onToggle={() => toggle(r.kategori, "inApp")} /> },
  ];
  return (
    <SectionCard
      title={<span>Preferensi Notifikasi<SavedFlash show={flashKey === "notifikasi"} /></span>}
      description="Klik ikon untuk toggle saluran"
      action={<Button variant="outline" size="sm" onClick={() => { reset(); flash("notifikasi"); }}>Reset ke Default</Button>}
      padded={false}
    >
      <DataTable data={list} columns={cols} rowKey={(r) => r.kategori} />
    </SectionCard>
  );
}

function KeamananModal({ open, onClose, value, onSave, section }: { open: boolean; onClose: () => void; value: Keamanan; onSave: (v: Keamanan) => void; section: "password" | "auth" | "audit" }) {
  const [draft, setDraft] = useState<Keamanan>(value);
  const setNum = (k: keyof Keamanan, v: string) => setDraft({ ...draft, [k]: Number(v) });
  const setStr = (k: keyof Keamanan, v: string) => setDraft({ ...draft, [k]: v });
  const title = section === "password" ? "Edit Kebijakan Password" : section === "auth" ? "Edit Autentikasi" : "Edit Audit & Retensi";
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<ModalFooter onCancel={onClose} onSave={() => onSave(draft)} />}>
      <FormGrid cols={2}>
        {section === "password" && (
          <>
            <FormField label="Panjang Minimum"><Input type="number" value={draft.panjangMin} onChange={(e) => setNum("panjangMin", e.target.value)} /></FormField>
            <FormField label="Kompleksitas"><Input value={draft.kompleksitas} onChange={(e) => setStr("kompleksitas", e.target.value)} /></FormField>
            <FormField label="Masa Berlaku (hari)"><Input type="number" value={draft.masaBerlaku} onChange={(e) => setNum("masaBerlaku", e.target.value)} /></FormField>
            <FormField label="Riwayat Password"><Input type="number" value={draft.riwayatPassword} onChange={(e) => setNum("riwayatPassword", e.target.value)} /></FormField>
            <FormField label="Login Gagal Maks"><Input type="number" value={draft.loginGagalMaks} onChange={(e) => setNum("loginGagalMaks", e.target.value)} /></FormField>
            <FormField label="Lockout (menit)"><Input type="number" value={draft.lockoutMenit} onChange={(e) => setNum("lockoutMenit", e.target.value)} /></FormField>
          </>
        )}
        {section === "auth" && (
          <>
            <FormField label="2FA Wajib">
              <SearchableSelect
                value={draft.dua2faWajib}
                onChange={(v) => setStr("dua2faWajib", v)}
                options={["Tidak aktif", "Aktif untuk Admin", "Aktif untuk semua"].map((o) => ({ value: o, label: o }))}
              />
            </FormField>
            <FormField label="Metode 2FA"><Input value={draft.metode2fa} onChange={(e) => setStr("metode2fa", e.target.value)} /></FormField>
            <FormField label="Session Timeout (menit)"><Input type="number" value={draft.sessionTimeout} onChange={(e) => setNum("sessionTimeout", e.target.value)} /></FormField>
            <FormField label="Single Sign-On">
              <SearchableSelect
                value={draft.sso}
                onChange={(v) => setStr("sso", v)}
                options={["Tidak aktif", "Google Workspace", "Microsoft 365", "SAML Custom"].map((o) => ({ value: o, label: o }))}
              />
            </FormField>
            <FormField label="Remember Me (hari)"><Input type="number" value={draft.rememberMe} onChange={(e) => setNum("rememberMe", e.target.value)} /></FormField>
            <FormField label="Concurrent Sessions"><Input type="number" value={draft.concurrentSessions} onChange={(e) => setNum("concurrentSessions", e.target.value)} /></FormField>
          </>
        )}
        {section === "audit" && (
          <>
            <FormField label="Audit Log Retensi (hari)"><Input type="number" value={draft.auditRetensi} onChange={(e) => setNum("auditRetensi", e.target.value)} /></FormField>
            <FormField label="Backup Otomatis"><Input value={draft.backupOtomatis} onChange={(e) => setStr("backupOtomatis", e.target.value)} /></FormField>
            <FormField label="Backup Retensi (hari)"><Input type="number" value={draft.backupRetensi} onChange={(e) => setNum("backupRetensi", e.target.value)} /></FormField>
            <FormField label="Data Siswa Lulus"><Input value={draft.dataLulus} onChange={(e) => setStr("dataLulus", e.target.value)} /></FormField>
          </>
        )}
      </FormGrid>
    </Modal>
  );
}

function KeamananTab({ value, setValue, flash, flashKey }: { value: Keamanan; setValue: (v: Keamanan) => void; flash: (k: string) => void; flashKey: string | null }) {
  const [open, setOpen] = useState<"password" | "auth" | "audit" | null>(null);
  return (
    <div className="space-y-6">
      <SectionCard
        title={<span>Kebijakan Password<SavedFlash show={flashKey === "keamanan-password"} /></span>}
        action={<EditButton onClick={() => setOpen("password")} />}
      >
        <InfoGrid cols={2}>
          <InfoField label="Panjang Minimum" value={`${value.panjangMin} karakter`} />
          <InfoField label="Kompleksitas" value={value.kompleksitas} />
          <InfoField label="Masa Berlaku" value={`${value.masaBerlaku} hari`} />
          <InfoField label="Riwayat Password" value={`${value.riwayatPassword} terakhir tidak boleh diulang`} />
          <InfoField label="Login Gagal Maks" value={`${value.loginGagalMaks} kali`} hint="Sebelum akun terkunci" />
          <InfoField label="Lockout Duration" value={`${value.lockoutMenit} menit`} />
        </InfoGrid>
      </SectionCard>

      <SectionCard
        title={<span>Autentikasi<SavedFlash show={flashKey === "keamanan-auth"} /></span>}
        action={<EditButton onClick={() => setOpen("auth")} />}
      >
        <InfoGrid cols={3}>
          <InfoField label="2FA Wajib" value={<Badge tone="success">{value.dua2faWajib}</Badge>} />
          <InfoField label="Metode 2FA" value={value.metode2fa} />
          <InfoField label="Session Timeout" value={`${value.sessionTimeout} menit idle`} />
          <InfoField label="Single Sign-On" value={<Badge tone="brand">{value.sso}</Badge>} />
          <InfoField label="Remember Me" value={`${value.rememberMe} hari`} />
          <InfoField label="Concurrent Sessions" value={`${value.concurrentSessions} device`} />
        </InfoGrid>
      </SectionCard>

      <SectionCard
        title={<span>Audit & Retensi<SavedFlash show={flashKey === "keamanan-audit"} /></span>}
        action={<EditButton onClick={() => setOpen("audit")} />}
      >
        <InfoGrid cols={2}>
          <InfoField label="Audit Log Retensi" value={`${value.auditRetensi} hari`} />
          <InfoField label="Backup Otomatis" value={<Badge tone="success">{value.backupOtomatis}</Badge>} />
          <InfoField label="Backup Retensi" value={`${value.backupRetensi} hari`} />
          <InfoField label="Data Siswa Lulus" value={value.dataLulus} />
        </InfoGrid>
      </SectionCard>

      {open && (
        <KeamananModal
          open
          onClose={() => setOpen(null)}
          value={value}
          section={open}
          onSave={(v) => { setValue(v); const s = open; setOpen(null); flash(`keamanan-${s}`); }}
        />
      )}
    </div>
  );
}

function PaketModal({ open, onClose, value, onSave }: { open: boolean; onClose: () => void; value: Billing; onSave: (v: Billing) => void }) {
  const [draft, setDraft] = useState<Billing>(value);
  return (
    <Modal open={open} onClose={onClose} title="Ubah Paket Berlangganan" size="lg" footer={<ModalFooter onCancel={onClose} onSave={() => onSave(draft)} />}>
      <FormGrid cols={2}>
        <FormField label="Paket">
          <SearchableSelect
            value={draft.paket}
            onChange={(v) => setDraft({ ...draft, paket: v })}
            options={["SekolahPro Basic", "SekolahPro Plus", "SekolahPro Enterprise"].map((o) => ({ value: o, label: o }))}
          />
        </FormField>
        <FormField label="Siklus">
          <SearchableSelect
            value={draft.siklus}
            onChange={(v) => setDraft({ ...draft, siklus: v })}
            options={["Bulanan", "Tahunan"].map((o) => ({ value: o, label: o }))}
          />
        </FormField>
        <FormField label="Harga"><Input value={draft.harga} onChange={(e) => setDraft({ ...draft, harga: e.target.value })} /></FormField>
        <FormField label="Penyimpanan"><Input value={draft.penyimpanan} onChange={(e) => setDraft({ ...draft, penyimpanan: e.target.value })} /></FormField>
        <FormField label="Maks Siswa"><Input type="number" value={draft.maksSiswa} onChange={(e) => setDraft({ ...draft, maksSiswa: Number(e.target.value) })} /></FormField>
        <FormField label="Maks Pegawai"><Input type="number" value={draft.maksPegawai} onChange={(e) => setDraft({ ...draft, maksPegawai: Number(e.target.value) })} /></FormField>
        <FormField label="Mulai"><DatePicker value={draft.mulai} onChange={(v) => setDraft({ ...draft, mulai: v })} /></FormField>
        <FormField label="Berakhir"><DatePicker value={draft.berakhir} onChange={(v) => setDraft({ ...draft, berakhir: v })} /></FormField>
        <FormField label="" className="sm:col-span-2">
          <Checkbox checked={draft.autoRenew} onChange={(e) => setDraft({ ...draft, autoRenew: e.target.checked })} label="Auto-renew aktif" />
        </FormField>
      </FormGrid>
    </Modal>
  );
}

function TagihanModal({ open, onClose, value, onSave }: { open: boolean; onClose: () => void; value: Billing; onSave: (v: Billing) => void }) {
  const [draft, setDraft] = useState<Billing>(value);
  return (
    <Modal open={open} onClose={onClose} title="Edit Tagihan & Pembayaran" footer={<ModalFooter onCancel={onClose} onSave={() => onSave(draft)} />}>
      <FormGrid cols={1}>
        <FormField label="Metode Pembayaran">
          <SearchableSelect
            value={draft.metodePembayaran}
            onChange={(v) => setDraft({ ...draft, metodePembayaran: v })}
            options={["Virtual Account BCA", "Virtual Account Mandiri", "Virtual Account BNI", "Transfer Manual", "Kartu Kredit"].map((o) => ({ value: o, label: o }))}
          />
        </FormField>
        <FormField label="NPWP"><Input value={draft.npwp} onChange={(e) => setDraft({ ...draft, npwp: e.target.value })} /></FormField>
        <FormField label="Email Tagihan"><Input type="email" value={draft.emailTagihan} onChange={(e) => setDraft({ ...draft, emailTagihan: e.target.value })} /></FormField>
      </FormGrid>
    </Modal>
  );
}

function BillingTab({ value, setValue, flash, flashKey }: { value: Billing; setValue: (v: Billing) => void; flash: (k: string) => void; flashKey: string | null }) {
  const [open, setOpen] = useState<"paket" | "tagihan" | null>(null);
  return (
    <div className="space-y-6">
      <SectionCard
        title={<span>Paket Berlangganan<SavedFlash show={flashKey === "billing-paket"} /></span>}
        action={<Button variant="outline" size="sm" onClick={() => setOpen("paket")}>Ubah Paket</Button>}
      >
        <InfoGrid cols={3}>
          <InfoField label="Paket" value={<Badge tone="brand">{value.paket}</Badge>} />
          <InfoField label="Siklus" value={value.siklus} />
          <InfoField label="Harga" value={value.harga} />
          <InfoField label="Maks Siswa" value={value.maksSiswa.toLocaleString("id-ID")} hint="Saat ini: 1.842" />
          <InfoField label="Maks Pegawai" value={String(value.maksPegawai)} hint="Saat ini: 72" />
          <InfoField label="Penyimpanan" value={value.penyimpanan} hint="Saat ini: 42.3 GB" />
          <InfoField label="Mulai" value={value.mulai} />
          <InfoField label="Berakhir" value={value.berakhir} />
          <InfoField label="Auto-renew" value={<Badge tone={value.autoRenew ? "success" : "neutral"}>{value.autoRenew ? "Aktif" : "Nonaktif"}</Badge>} />
        </InfoGrid>
      </SectionCard>

      <SectionCard
        title={<span>Tagihan & Pembayaran<SavedFlash show={flashKey === "billing-tagihan"} /></span>}
        action={<EditButton onClick={() => setOpen("tagihan")} />}
      >
        <InfoGrid cols={3}>
          <InfoField label="Metode Pembayaran" value={value.metodePembayaran} />
          <InfoField label="NPWP" value={<span className="tabular-nums">{value.npwp}</span>} />
          <InfoField label="Email Tagihan" value={value.emailTagihan} />
        </InfoGrid>
      </SectionCard>

      <PaketModal open={open === "paket"} onClose={() => setOpen(null)} value={value} onSave={(v) => { setValue(v); setOpen(null); flash("billing-paket"); }} />
      <TagihanModal open={open === "tagihan"} onClose={() => setOpen(null)} value={value} onSave={(v) => { setValue(v); setOpen(null); flash("billing-tagihan"); }} />
    </div>
  );
}

interface Branding {
  brand: string;
  accent: string;
  success: string;
  danger: string;
}

const INITIAL_BRANDING: Branding = {
  brand: "#2563eb",
  accent: "#7c3aed",
  success: "#10b981",
  danger: "#ef4444",
};

function BrandingModal({ open, onClose, value, onSave }: { open: boolean; onClose: () => void; value: Branding; onSave: (v: Branding) => void }) {
  const [draft, setDraft] = useState<Branding>(value);
  return (
    <Modal open={open} onClose={onClose} title="Edit Palet Warna" footer={<ModalFooter onCancel={onClose} onSave={() => onSave(draft)} />}>
      <FormGrid cols={2}>
        {(["brand", "accent", "success", "danger"] as const).map((k) => (
          <FormField key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}>
            <div className="flex gap-2 items-center">
              <input type="color" value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} className="h-10 w-14 rounded border border-border cursor-pointer" />
              <Input value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
            </div>
          </FormField>
        ))}
      </FormGrid>
    </Modal>
  );
}

function BrandingTab({ value, setValue, flash, flashKey }: { value: Branding; setValue: (v: Branding) => void; flash: (k: string) => void; flashKey: string | null }) {
  const [open, setOpen] = useState<"logo" | "palet" | null>(null);
  return (
    <div className="space-y-6">
      <SectionCard
        title={<span>Logo & Identitas Visual<SavedFlash show={flashKey === "branding-logo"} /></span>}
        action={<Button variant="outline" size="sm" onClick={() => { setOpen("logo"); flash("branding-logo"); }}>Unggah Aset</Button>}
      >
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

      <SectionCard
        title={<span>Palet Warna<SavedFlash show={flashKey === "branding-palet"} /></span>}
        action={<EditButton onClick={() => setOpen("palet")} />}
      >
        <div className="grid gap-3 sm:grid-cols-4">
          {(["brand", "accent", "success", "danger"] as const).map((k) => (
            <div key={k} className="rounded-lg border border-border p-3 flex items-center gap-3">
              <span className="h-10 w-10 rounded-md" style={{ background: value[k] }} />
              <div>
                <div className="text-sm font-medium capitalize">{k}</div>
                <div className="text-xs text-muted-fg tabular-nums">{value[k]}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <BrandingModal open={open === "palet"} onClose={() => setOpen(null)} value={value} onSave={(v) => { setValue(v); setOpen(null); flash("branding-palet"); }} />

      {open === "logo" && (
        <Modal open onClose={() => setOpen(null)} title="Unggah Aset" footer={<Button onClick={() => setOpen(null)}>Tutup</Button>}>
          <FormGrid cols={1}>
            <FormField label="Logo Utama (PNG/SVG, maks 1MB)"><Input type="file" accept=".png,.svg" /></FormField>
            <FormField label="Logo Mono"><Input type="file" accept=".png,.svg" /></FormField>
            <FormField label="Favicon (ICO/PNG 32x32)"><Input type="file" accept=".ico,.png" /></FormField>
          </FormGrid>
        </Modal>
      )}
    </div>
  );
}

interface LogEntry { aktor: string; aksi: string; waktu: string; tone: "neutral" | "brand" | "success" | "warning" }
const INITIAL_LOG: LogEntry[] = [
  { aktor: "Tata Usaha", aksi: "Mengubah jam operasional", waktu: "2026-05-23 14:20", tone: "neutral" },
  { aktor: "Sekolah Admin", aksi: "Menambah peran custom: Pembina OSIS", waktu: "2026-05-22 09:15", tone: "brand" },
  { aktor: "Sekolah Admin", aksi: "Menghubungkan integrasi WhatsApp Business", waktu: "2026-05-21 16:42", tone: "success" },
  { aktor: "Auditor", aksi: "Mengubah retensi audit log dari 180 ke 365 hari", waktu: "2026-05-20 11:08", tone: "warning" },
  { aktor: "Sistem", aksi: "Backup harian selesai", waktu: "2026-05-24 02:00", tone: "success" },
];

function LogTab({ list }: { list: LogEntry[] }) {
  return (
    <SectionCard title="Riwayat Perubahan Konfigurasi" description={`${list.length} perubahan terakhir`} padded={false}>
      <ul className="divide-y divide-border">
        {list.map((a, i) => (
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

const TAB_META: { key: TabKey; label: string; icon: ReactNode }[] = [
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
  const [flashKey, flash] = useFlash();

  const [identitas, setIdentitas] = useState<Identitas>(INITIAL_IDENTITAS);
  const [alamat, setAlamat] = useState<Alamat>(INITIAL_ALAMAT);
  const [domain, setDomain] = useState<Domain>(INITIAL_DOMAIN);
  const [tahun, setTahun] = useState<TahunAjaran>(INITIAL_TAHUN);
  const [skala, setSkala] = useState<Skala>(INITIAL_SKALA);
  const [jam, setJam] = useState<JamOperasional>(INITIAL_JAM);
  const [peran, setPeran] = useState<Peran[]>(INITIAL_PERAN);
  const [integrasi, setIntegrasi] = useState<Integrasi[]>(INITIAL_INTEGRASI);
  const [notifikasi, setNotifikasi] = useState<NotifikasiPref[]>(INITIAL_NOTIFIKASI);
  const [keamanan, setKeamanan] = useState<Keamanan>(INITIAL_KEAMANAN);
  const [billing, setBilling] = useState<Billing>(INITIAL_BILLING);
  const [branding, setBranding] = useState<Branding>(INITIAL_BRANDING);
  const [log] = useState<LogEntry[]>(INITIAL_LOG);

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
      case "sekolah": return <SekolahTab identitas={identitas} setIdentitas={setIdentitas} alamat={alamat} setAlamat={setAlamat} domain={domain} setDomain={setDomain} flash={flash} flashKey={flashKey} />;
      case "akademik": return <AkademikTab tahun={tahun} setTahun={setTahun} skala={skala} setSkala={setSkala} jam={jam} setJam={setJam} flash={flash} flashKey={flashKey} />;
      case "peran": return <PeranTab list={peran} setList={setPeran} flash={flash} flashKey={flashKey} />;
      case "integrasi": return <IntegrasiTab list={integrasi} setList={setIntegrasi} flash={flash} />;
      case "notifikasi": return <NotifikasiTab list={notifikasi} setList={setNotifikasi} reset={() => setNotifikasi(INITIAL_NOTIFIKASI)} flash={flash} flashKey={flashKey} />;
      case "keamanan": return <KeamananTab value={keamanan} setValue={setKeamanan} flash={flash} flashKey={flashKey} />;
      case "billing": return <BillingTab value={billing} setValue={setBilling} flash={flash} flashKey={flashKey} />;
      case "branding": return <BrandingTab value={branding} setValue={setBranding} flash={flash} flashKey={flashKey} />;
      case "log": return <LogTab list={log} />;
    }
  };

  const handleExport = () => {
    const payload = { identitas, alamat, domain, tahun, skala, jam, peran, integrasi, notifikasi, keamanan, billing, branding };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pengaturan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sistem"
        title="Pengaturan"
        description="Profil sekolah, peran pengguna, integrasi, dan keamanan."
        actions={
          <Button variant="outline" onClick={handleExport}>
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

export const Route = createFileRoute("/$sekolah/pengaturan/")({ component: PengaturanPage });
