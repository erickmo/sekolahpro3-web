import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Column,
  DataTable,
  DetailPageTemplate,
  EmptyState,
  InfoField,
  InfoGrid,
  PageHeader,
  SectionCard,
  StatCard,
  Tabs,
  IconArrowLeft,
  IconBook,
  IconCake,
  IconCalendar,
  IconCheck,
  IconChat,
  IconChart,
  IconClock,
  IconEdit,
  IconFile,
  IconGrad,
  IconHome,
  IconId,
  IconMail,
  IconMapPin,
  IconMore,
  IconPhone,
  IconPlus,
  IconPrint,
  IconUsers,
  IconAlert,
  type TabItem,
} from "@sekolahpro/ui";
import {
  findStaff,
  formatRupiah,
  formatTanggal,
  umur,
  type AktivitasRow,
  type DokumenRow,
  type KehadiranStaffRow,
  type PelatihanRow,
  type RiwayatJabatanRow,
  type Staff,
  type StatusStaff,
  type TugasRow,
} from "../data/staff";

type TabKey = "ringkasan" | "profil" | "kepegawaian" | "tugas" | "kehadiran" | "riwayat" | "pelatihan" | "dokumen" | "aktivitas";

const STATUS_TONE: Record<StatusStaff, "success" | "warning" | "neutral" | "danger"> = {
  Aktif: "success",
  Cuti: "warning",
  "Non-aktif": "neutral",
  Pensiun: "neutral",
  "Kontrak Berakhir": "danger",
};

const KEHADIRAN_TONE = {
  Hadir: "success",
  Sakit: "warning",
  Izin: "brand",
  "Dinas Luar": "brand",
  Alpa: "danger",
} as const;

const PRIORITAS_TONE = {
  Mendesak: "danger",
  Tinggi: "warning",
  Sedang: "brand",
  Rendah: "neutral",
} as const;

const TUGAS_STATUS_TONE = {
  Selesai: "success",
  Berjalan: "brand",
  Backlog: "neutral",
  Tertunda: "warning",
} as const;

function daysUntil(iso: string | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date("2026-05-24");
  return Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function Hero({ staff }: { staff: Staff }) {
  const kontrakSisa = daysUntil(staff.masaKontrakBerakhir);
  const kontrakSoon = kontrakSisa !== null && kontrakSisa >= 0 && kontrakSisa <= 90;
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-brand/5 via-bg to-violet-500/5 p-6 shadow-sm">
      <div className="flex flex-wrap items-start gap-5">
        <Avatar name={staff.namaLengkap} src={staff.fotoUrl ?? null} size="lg" className="!h-20 !w-20 !text-xl" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold text-fg truncate">{staff.namaLengkap}</h2>
            <Badge tone={STATUS_TONE[staff.status]} dot>{staff.status}</Badge>
            <Badge tone="neutral">{staff.statusKepegawaian}</Badge>
            {kontrakSoon ? <Badge tone="warning">Kontrak berakhir {kontrakSisa} hari lagi</Badge> : null}
          </div>
          <div className="mt-1 text-sm text-muted-fg">
            <span className="tabular-nums">NIP {staff.nip}</span>
            <span className="mx-2">·</span>
            <span>{staff.departemen}</span>
            <span className="mx-2">·</span>
            <span>{staff.jabatan}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-fg">
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconCake /></span>{formatTanggal(staff.tanggalLahir)} ({umur(staff.tanggalLahir)} th)</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconMail /></span>{staff.email}</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconPhone /></span>{staff.telepon}</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconMapPin /></span>{staff.kecamatan}, {staff.kabupaten}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <span className="h-4 w-4 mr-1.5"><IconChat /></span>Pesan
          </Button>
          <Button variant="outline" size="sm">
            <span className="h-4 w-4 mr-1.5"><IconPlus /></span>Tugaskan
          </Button>
          <Button variant="outline" size="sm">
            <span className="h-4 w-4 mr-1.5"><IconPrint /></span>Cetak SK
          </Button>
          <Button size="sm">
            <span className="h-4 w-4 mr-1.5"><IconEdit /></span>Edit
          </Button>
          <Button variant="outline" size="sm" className="!px-2">
            <span className="h-4 w-4"><IconMore /></span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function RingkasanTab({ staff }: { staff: Staff }) {
  const tugasMendesak = staff.tugas.filter((t) => (t.prioritas === "Mendesak" || t.prioritas === "Tinggi") && t.status !== "Selesai");
  const kontrakSisa = daysUntil(staff.masaKontrakBerakhir);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Kehadiran" value={`${staff.persenKehadiran}%`} delta={{ value: "30 hari terakhir", trend: "flat" }} icon={<IconCheck />} accent="emerald" />
        <StatCard label="Tugas Aktif" value={staff.jumlahTugasAktif} hint={`${tugasMendesak.length} prioritas tinggi`} icon={<IconClock />} accent="brand" />
        <StatCard label="Tugas Selesai" value={staff.jumlahTugasSelesai} hint="kumulatif" icon={<IconChart />} accent="violet" />
        <StatCard label="Jam Kerja Minggu Ini" value={`${staff.jamKerjaMingguIni} jam`} icon={<IconCalendar />} accent="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <SectionCard
            title="Tugas Mendesak"
            description="Prioritas tinggi & mendesak yang belum selesai"
            action={<Badge tone="warning" dot>Perlu tindak lanjut</Badge>}
            padded={false}
          >
            <ul className="divide-y divide-border">
              {tugasMendesak.length === 0 ? (
                <li className="px-5 py-6 text-sm text-muted-fg text-center">Tidak ada tugas prioritas tinggi.</li>
              ) : tugasMendesak.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
                    <span className="h-4 w-4"><IconAlert /></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-fg">{t.judul}</div>
                    <div className="text-xs text-muted-fg">Jatuh tempo {formatTanggal(t.jatuhTempo)} · {t.id}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge tone={PRIORITAS_TONE[t.prioritas]}>{t.prioritas}</Badge>
                    <div><Badge tone={TUGAS_STATUS_TONE[t.status]} dot>{t.status}</Badge></div>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Kehadiran Terkini" action={<Button variant="ghost" size="sm">Lihat semua</Button>} padded={false}>
            <ul className="divide-y divide-border">
              {staff.kehadiran.slice(0, 5).map((k, i) => (
                <li key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand/10 text-brand">
                    <span className="h-4 w-4"><IconClock /></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-fg">{formatTanggal(k.tanggal)}</div>
                    <div className="text-xs text-muted-fg">
                      {k.jamMasuk ? `Masuk ${k.jamMasuk}` : "—"}
                      {k.jamPulang ? ` · Pulang ${k.jamPulang}` : ""}
                      {k.keterangan ? ` · ${k.keterangan}` : ""}
                    </div>
                  </div>
                  <Badge tone={KEHADIRAN_TONE[k.status]} dot>{k.status}</Badge>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Info Kontrak">
            <InfoGrid cols={2}>
              <InfoField label="Status Kepegawaian" value={<Badge tone="neutral">{staff.statusKepegawaian}</Badge>} />
              <InfoField label="TMT Kerja" icon={<IconCalendar />} value={formatTanggal(staff.tmtKerja)} />
              <InfoField
                label="Masa Kontrak Berakhir"
                value={
                  staff.masaKontrakBerakhir
                    ? <span>{formatTanggal(staff.masaKontrakBerakhir)} {kontrakSisa !== null && kontrakSisa >= 0 && kontrakSisa <= 90 ? <Badge tone="warning">{kontrakSisa} hari lagi</Badge> : null}</span>
                    : <span className="text-muted-fg">Tidak berlaku</span>
                }
              />
              <InfoField label="Atasan" icon={<IconUsers />} value={staff.atasan} />
            </InfoGrid>
          </SectionCard>

          <SectionCard title="Aktivitas Terkini" padded={false}>
            <ul className="divide-y divide-border">
              {staff.aktivitas.slice(0, 4).map((a, i) => (
                <li key={i} className="flex items-start gap-3 px-5 py-3">
                  <Badge tone={a.tone} dot>·</Badge>
                  <div className="min-w-0">
                    <div className="text-sm text-fg">
                      <span className="font-medium">{a.aktor}</span>{" "}
                      <span className="text-muted-fg">{a.aksi}</span>
                    </div>
                    <div className="text-xs text-muted-fg mt-0.5 inline-flex items-center gap-1">
                      <span className="h-3 w-3"><IconClock /></span>{a.waktu}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Aksi Cepat">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm"><span className="text-xs">Buat Tugas</span></Button>
              <Button variant="outline" size="sm"><span className="text-xs">Catat Kehadiran</span></Button>
              <Button variant="outline" size="sm"><span className="text-xs">Perpanjang Kontrak</span></Button>
              <Button variant="outline" size="sm"><span className="text-xs">Cetak Slip Gaji</span></Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}

function ProfilTab({ staff }: { staff: Staff }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Identitas">
        <InfoGrid cols={3}>
          <InfoField label="NIP" icon={<IconId />} value={<span className="tabular-nums">{staff.nip}</span>} />
          <InfoField label="NIK" value={<span className="tabular-nums">{staff.nik}</span>} />
          <InfoField label="Nama Lengkap" value={staff.namaLengkap} />
          <InfoField label="Jenis Kelamin" value={staff.jenisKelamin} />
          <InfoField label="Tempat, Tanggal Lahir" value={`${staff.tempatLahir}, ${formatTanggal(staff.tanggalLahir)}`} hint={`${umur(staff.tanggalLahir)} tahun`} />
          <InfoField label="Agama" value={staff.agama} />
          <InfoField label="Kewarganegaraan" value={staff.kewarganegaraan} />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Alamat">
        <InfoGrid cols={3}>
          <InfoField label="Alamat" icon={<IconMapPin />} value={staff.alamat} className="sm:col-span-2 lg:col-span-2" />
          <InfoField label="RT/RW" value={`${staff.rt}/${staff.rw}`} />
          <InfoField label="Desa/Kelurahan" value={staff.desa} />
          <InfoField label="Kecamatan" value={staff.kecamatan} />
          <InfoField label="Kabupaten/Kota" value={staff.kabupaten} />
          <InfoField label="Provinsi" value={staff.provinsi} />
          <InfoField label="Kode Pos" value={staff.kodePos} />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Kontak">
        <InfoGrid cols={2}>
          <InfoField label="Telepon" icon={<IconPhone />} value={staff.telepon} />
          <InfoField label="Email" icon={<IconMail />} value={staff.email} />
        </InfoGrid>
      </SectionCard>
    </div>
  );
}

function KepegawaianTab({ staff }: { staff: Staff }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Penugasan">
        <InfoGrid cols={3}>
          <InfoField label="Departemen" value={staff.departemen} />
          <InfoField label="Jabatan" value={staff.jabatan} />
          <InfoField label="Status Kepegawaian" value={<Badge tone="neutral">{staff.statusKepegawaian}</Badge>} />
          <InfoField label="TMT Kerja" icon={<IconCalendar />} value={formatTanggal(staff.tmtKerja)} />
          <InfoField label="Masa Kontrak Berakhir" value={staff.masaKontrakBerakhir ? formatTanggal(staff.masaKontrakBerakhir) : "Tidak berlaku"} />
          <InfoField label="Atasan" icon={<IconUsers />} value={staff.atasan} />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Pendidikan">
        <InfoGrid cols={3}>
          <InfoField label="Pendidikan Terakhir" icon={<IconGrad />} value={staff.pendidikanTerakhir} />
          <InfoField label="Jurusan" value={staff.jurusan} />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Remunerasi">
        <InfoGrid cols={3}>
          <InfoField label="Gaji Pokok" value={staff.gajiPokok ? <span className="tabular-nums font-semibold">{formatRupiah(staff.gajiPokok)}</span> : "—"} />
          <InfoField label="Tunjangan" value={staff.tunjangan ? <span className="tabular-nums">{formatRupiah(staff.tunjangan)}</span> : "—"} />
          <InfoField label="Total" value={<span className="tabular-nums font-semibold">{formatRupiah((staff.gajiPokok ?? 0) + (staff.tunjangan ?? 0))}</span>} />
        </InfoGrid>
      </SectionCard>
    </div>
  );
}

function TugasTab({ staff }: { staff: Staff }) {
  const cols: Column<TugasRow>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="tabular-nums text-muted-fg">{r.id}</span> },
    { key: "judul", header: "Judul", cell: (r) => (
      <div>
        <div className="font-medium text-fg">{r.judul}</div>
        <div className="text-xs text-muted-fg truncate">{r.deskripsi}</div>
      </div>
    ) },
    { key: "prio", header: "Prioritas", cell: (r) => <Badge tone={PRIORITAS_TONE[r.prioritas]}>{r.prioritas}</Badge> },
    { key: "jt", header: "Jatuh Tempo", cell: (r) => formatTanggal(r.jatuhTempo) },
    { key: "pemberi", header: "Pemberi", cell: (r) => r.pemberi },
    { key: "status", header: "Status", cell: (r) => <Badge tone={TUGAS_STATUS_TONE[r.status]} dot>{r.status}</Badge> },
  ];
  const aktif = staff.tugas.filter((t) => t.status !== "Selesai").length;
  const selesai = staff.tugas.filter((t) => t.status === "Selesai").length;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Tugas" value={staff.tugas.length} accent="brand" icon={<IconClock />} />
        <StatCard label="Aktif" value={aktif} accent="amber" />
        <StatCard label="Selesai" value={selesai} accent="emerald" icon={<IconCheck />} />
      </div>
      <SectionCard
        title="Daftar Tugas"
        action={<Button size="sm"><span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Buat Tugas</Button>}
        padded={false}
      >
        <DataTable data={staff.tugas} columns={cols} rowKey={(r) => r.id} />
      </SectionCard>
    </div>
  );
}

function KehadiranTab({ staff }: { staff: Staff }) {
  const cols: Column<KehadiranStaffRow>[] = [
    { key: "tgl", header: "Tanggal", cell: (r) => <span className="tabular-nums">{formatTanggal(r.tanggal)}</span> },
    { key: "status", header: "Status", cell: (r) => <Badge tone={KEHADIRAN_TONE[r.status]} dot>{r.status}</Badge> },
    { key: "masuk", header: "Jam Masuk", cell: (r) => <span className="tabular-nums">{r.jamMasuk ?? "—"}</span> },
    { key: "pulang", header: "Jam Pulang", cell: (r) => <span className="tabular-nums">{r.jamPulang ?? "—"}</span> },
    { key: "ket", header: "Keterangan", cell: (r) => <span className="text-muted-fg">{r.keterangan ?? "—"}</span> },
  ];
  const counts = staff.kehadiran.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-5">
        <StatCard label="Hadir" value={counts.Hadir ?? 0} accent="emerald" icon={<IconCheck />} />
        <StatCard label="Sakit" value={counts.Sakit ?? 0} accent="amber" />
        <StatCard label="Izin" value={counts.Izin ?? 0} accent="brand" />
        <StatCard label="Dinas Luar" value={counts["Dinas Luar"] ?? 0} accent="violet" />
        <StatCard label="Alpa" value={counts.Alpa ?? 0} accent="rose" />
      </div>
      <SectionCard
        title="Riwayat Kehadiran"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Filter Periode</Button>
            <Button variant="outline" size="sm">Catat Manual</Button>
          </div>
        }
        padded={false}
      >
        <DataTable data={staff.kehadiran} columns={cols} rowKey={(r) => r.tanggal} />
      </SectionCard>
    </div>
  );
}

function RiwayatTab({ staff }: { staff: Staff }) {
  const cols: Column<RiwayatJabatanRow>[] = [
    { key: "tahun", header: "Tahun", cell: (r) => <span className="tabular-nums">{r.tahun}</span> },
    { key: "jabatan", header: "Jabatan", cell: (r) => <span className="font-medium">{r.jabatan}</span> },
    { key: "departemen", header: "Departemen", cell: (r) => r.departemen },
    { key: "ket", header: "Keterangan", cell: (r) => <span className="text-muted-fg">{r.keterangan ?? "—"}</span> },
  ];
  return (
    <SectionCard
      title="Riwayat Jabatan"
      description="Histori penugasan dan promosi"
      action={<Button size="sm"><span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Tambah</Button>}
      padded={false}
    >
      <DataTable data={staff.riwayatJabatan} columns={cols} rowKey={(r) => `${r.tahun}-${r.jabatan}`} />
    </SectionCard>
  );
}

function PelatihanTab({ staff }: { staff: Staff }) {
  const cols: Column<PelatihanRow>[] = [
    { key: "nama", header: "Nama Pelatihan", cell: (r) => <span className="font-medium">{r.nama}</span> },
    { key: "penyelenggara", header: "Penyelenggara", cell: (r) => r.penyelenggara },
    { key: "tgl", header: "Tanggal", cell: (r) => formatTanggal(r.tanggal) },
    { key: "durasi", header: "Durasi", cell: (r) => <span className="text-muted-fg">{r.durasi}</span> },
  ];
  return (
    <SectionCard
      title="Pelatihan & Sertifikasi"
      action={<Button size="sm"><span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Tambah Pelatihan</Button>}
      padded={false}
    >
      <DataTable data={staff.pelatihan} columns={cols} rowKey={(r) => `${r.tanggal}-${r.nama}`} />
    </SectionCard>
  );
}

function DokumenTab({ staff }: { staff: Staff }) {
  const cols: Column<DokumenRow>[] = [
    { key: "nama", header: "Dokumen", cell: (r) => (
      <div className="flex items-center gap-3">
        <span className="h-8 w-8 rounded-md bg-muted inline-flex items-center justify-center text-muted-fg"><span className="h-4 w-4"><IconFile /></span></span>
        <span className="font-medium">{r.nama}</span>
      </div>
    ) },
    { key: "tipe", header: "Tipe", cell: (r) => <Badge tone="neutral">{r.tipe}</Badge> },
    { key: "ukuran", header: "Ukuran", cell: (r) => <span className="text-muted-fg tabular-nums">{r.ukuran}</span> },
    { key: "tgl", header: "Diunggah", cell: (r) => formatTanggal(r.diunggah) },
    { key: "aksi", header: "", align: "right", cell: () => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="sm">Lihat</Button>
        <Button variant="ghost" size="sm">Unduh</Button>
      </div>
    ) },
  ];
  return (
    <SectionCard title="Dokumen" action={<Button size="sm"><span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Unggah</Button>} padded={false}>
      <DataTable data={staff.dokumen} columns={cols} rowKey={(r) => r.nama} />
    </SectionCard>
  );
}

function AktivitasTab({ staff }: { staff: Staff }) {
  return (
    <SectionCard title="Linimasa Aktivitas" description="Riwayat perubahan dan kejadian terkait staff" padded={false}>
      {staff.aktivitas.length === 0 ? (
        <EmptyState title="Belum ada aktivitas" />
      ) : (
        <ul className="divide-y divide-border">
          {staff.aktivitas.map((a: AktivitasRow, i) => (
            <li key={i} className="flex items-start gap-4 px-5 py-4">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <Badge tone={a.tone} dot>·</Badge>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-fg">
                  <span className="font-medium">{a.aktor}</span>{" "}
                  <span className="text-muted-fg">{a.aksi}</span>
                </div>
                <div className="text-xs text-muted-fg mt-1 inline-flex items-center gap-1">
                  <span className="h-3 w-3"><IconClock /></span>{a.waktu}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

const TAB_META: { key: TabKey; label: string; icon: JSX.Element }[] = [
  { key: "ringkasan", label: "Ringkasan", icon: <IconHome /> },
  { key: "profil", label: "Profil", icon: <IconId /> },
  { key: "kepegawaian", label: "Kepegawaian", icon: <IconUsers /> },
  { key: "tugas", label: "Tugas", icon: <IconClock /> },
  { key: "kehadiran", label: "Kehadiran", icon: <IconCheck /> },
  { key: "riwayat", label: "Riwayat", icon: <IconGrad /> },
  { key: "pelatihan", label: "Pelatihan", icon: <IconBook /> },
  { key: "dokumen", label: "Dokumen", icon: <IconFile /> },
  { key: "aktivitas", label: "Aktivitas", icon: <IconChart /> },
];

const VALID_TABS = new Set<TabKey>([
  "ringkasan","profil","kepegawaian","tugas","kehadiran","riwayat","pelatihan","dokumen","aktivitas",
]);

function StaffDetailPage() {
  const { nip } = Route.useParams();
  const search = Route.useSearch();
  const staff = findStaff(nip);
  const navigate = useNavigate();
  const tab: TabKey = VALID_TABS.has(search.tab as TabKey) ? (search.tab as TabKey) : "ringkasan";
  const setTab = (next: TabKey) => {
    navigate({ to: "/staff/$nip", params: { nip }, search: { tab: next === "ringkasan" ? undefined : next } });
  };

  if (!staff) {
    throw notFound();
  }

  const counts: Partial<Record<TabKey, number>> = {
    tugas: staff.tugas.filter((t) => t.status !== "Selesai").length,
    kehadiran: staff.kehadiran.length,
    riwayat: staff.riwayatJabatan.length,
    pelatihan: staff.pelatihan.length,
    dokumen: staff.dokumen.length,
    aktivitas: staff.aktivitas.length,
  };

  const tabItems: TabItem[] = TAB_META.map((t) => ({
    key: t.key,
    label: t.label,
    icon: t.icon,
    count: counts[t.key],
    active: tab === t.key,
    render: ({ className, children }) => (
      <button type="button" onClick={() => setTab(t.key)} className={className}>
        {children}
      </button>
    ),
  }));

  const renderTab = () => {
    switch (tab) {
      case "ringkasan": return <RingkasanTab staff={staff} />;
      case "profil": return <ProfilTab staff={staff} />;
      case "kepegawaian": return <KepegawaianTab staff={staff} />;
      case "tugas": return <TugasTab staff={staff} />;
      case "kehadiran": return <KehadiranTab staff={staff} />;
      case "riwayat": return <RiwayatTab staff={staff} />;
      case "pelatihan": return <PelatihanTab staff={staff} />;
      case "dokumen": return <DokumenTab staff={staff} />;
      case "aktivitas": return <AktivitasTab staff={staff} />;
    }
  };

  return (
    <DetailPageTemplate
      header={
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: "Dashboard", render: ({ className, children }) => <Link to="/" className={className}>{children}</Link> },
              { label: "Staff", render: ({ className, children }) => <Link to="/staff" className={className}>{children}</Link> },
              { label: staff.namaLengkap },
            ]}
          />
          <PageHeader
            eyebrow="Detail Staff"
            title={staff.namaLengkap}
            description={`NIP ${staff.nip} · ${staff.departemen} · ${staff.jabatan}`}
            actions={
              <Button variant="outline" onClick={() => navigate({ to: "/staff" })}>
                <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
                Kembali ke daftar
              </Button>
            }
          />
        </div>
      }
      hero={<Hero staff={staff} />}
      tabs={<Tabs items={tabItems} />}
      primary={renderTab()}
    />
  );
}

type SearchParams = { tab?: TabKey | undefined };

export const Route = createFileRoute("/staff/$nip")({
  component: StaffDetailPage,
  validateSearch: (raw: Record<string, unknown>): SearchParams => {
    const t = typeof raw.tab === "string" ? raw.tab : undefined;
    return { tab: t && VALID_TABS.has(t as TabKey) ? (t as TabKey) : undefined };
  },
  notFoundComponent: () => (
    <div className="py-16">
      <EmptyState
        title="Staff tidak ditemukan"
        description="NIP yang diminta tidak ada di sistem. Periksa kembali atau kembali ke daftar staff."
        action={
          <Link to="/staff" className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
            <span className="h-4 w-4"><IconArrowLeft /></span> Kembali ke daftar
          </Link>
        }
      />
    </div>
  ),
});
