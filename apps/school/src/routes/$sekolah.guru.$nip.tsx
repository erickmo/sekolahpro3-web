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
  IconDownload,
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
  type TabItem,
} from "@sekolahpro/ui";
import { useResourceDoc, useResourceList } from "@sekolahpro/api-client";
import {
  findGuru,
  formatTanggal,
  umur,
  type AktivitasRow,
  type DokumenRow,
  type Guru,
  type JadwalMengajarRow,
  type KehadiranGuruRow,
  type KelasAmpuRow,
  type RiwayatMengajarRow,
  type SertifikasiRow,
  type StatusGuru,
} from "../data/guru";

type TabKey = "ringkasan" | "profil" | "kepegawaian" | "jadwal" | "kelas" | "riwayat" | "sertifikasi" | "kehadiran" | "dokumen" | "aktivitas";

const STATUS_TONE: Record<StatusGuru, "success" | "brand" | "neutral" | "warning" | "danger"> = {
  Aktif: "success",
  Cuti: "warning",
  "Non-aktif": "neutral",
  Pensiun: "neutral",
};

const KEHADIRAN_TONE = {
  Hadir: "success",
  Sakit: "warning",
  Izin: "brand",
  "Dinas Luar": "brand",
  Alpa: "danger",
} as const;

function namaWithGelar(g: Guru): string {
  const depan = g.gelar.depan ? `${g.gelar.depan} ` : "";
  const belakang = g.gelar.belakang ? `, ${g.gelar.belakang}` : "";
  return `${depan}${g.namaLengkap}${belakang}`;
}

function Hero({ guru }: { guru: Guru }) {
  const isWaliKelas = guru.jabatan === "Wali Kelas";
  const isSertifikasi = guru.sertifikasi.some((s) => s.nama.toLowerCase().includes("sertifikasi pendidik"));
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-brand/5 via-bg to-violet-500/5 p-6 shadow-sm">
      <div className="flex flex-wrap items-start gap-5">
        <Avatar name={guru.namaLengkap} src={guru.fotoUrl ?? null} size="lg" className="!h-20 !w-20 !text-xl" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold text-fg truncate">{namaWithGelar(guru)}</h2>
            <Badge tone={STATUS_TONE[guru.status]} dot>{guru.status}</Badge>
            {isSertifikasi ? <Badge tone="brand">Sertifikasi</Badge> : null}
            {isWaliKelas ? <Badge tone="brand">Wali Kelas</Badge> : null}
          </div>
          <div className="mt-1 text-sm text-muted-fg">
            <span className="tabular-nums">NIP {guru.nip}</span>
            <span className="mx-2">·</span>
            <span className="tabular-nums">NUPTK {guru.nuptk}</span>
            <span className="mx-2">·</span>
            <span>{guru.jabatan} · {guru.jenisPtk}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-fg">
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconCake /></span>{formatTanggal(guru.tanggalLahir)} ({umur(guru.tanggalLahir)} th)</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconMail /></span>{guru.email}</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconPhone /></span>{guru.telepon}</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconMapPin /></span>{guru.kecamatan}, {guru.kabupaten}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <span className="h-4 w-4 mr-1.5"><IconChat /></span>Pesan
          </Button>
          <Button variant="outline" size="sm">
            <span className="h-4 w-4 mr-1.5"><IconPrint /></span>Cetak SK
          </Button>
          <Button variant="outline" size="sm">
            <span className="h-4 w-4 mr-1.5"><IconDownload /></span>Unduh Data
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

function RingkasanTab({ guru }: { guru: Guru }) {
  const today = guru.jadwalMengajar.filter((j) => j.hari === "Senin").slice(0, 5);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Rata Nilai Kelas" value={guru.rataNilaiKelas} hint={`${guru.jumlahKelas} kelas diampu`} icon={<IconChart />} accent="brand" />
        <StatCard label="Kehadiran" value={`${guru.persenKehadiran}%`} delta={{ value: "30 hari terakhir", trend: "flat" }} icon={<IconCheck />} accent="emerald" />
        <StatCard label="Jam Mengajar" value={`${guru.totalJamMengajar} jp`} hint="per minggu" icon={<IconClock />} accent="violet" />
        <StatCard label="Siswa Binaan" value={guru.jumlahSiswaBinaan} hint={`${guru.jumlahKelas} kelas`} icon={<IconUsers />} accent="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <SectionCard
            title="Jadwal Hari Ini"
            description="Senin"
            action={<Badge tone="brand" dot>Berlangsung</Badge>}
          >
            <ul className="divide-y divide-border -mx-5 -my-2">
              {today.length === 0 ? (
                <li className="px-5 py-6 text-sm text-muted-fg text-center">Tidak ada jadwal hari ini.</li>
              ) : today.map((j, i) => (
                <li key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand/10 text-brand">
                    <span className="h-4 w-4"><IconClock /></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-fg">{j.mapel}</div>
                    <div className="text-xs text-muted-fg">{j.kelas} · {j.ruang}</div>
                  </div>
                  <div className="text-right text-xs tabular-nums text-muted-fg">{j.jam}</div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Kelas Ampu" action={<Button variant="ghost" size="sm">Lihat semua</Button>} padded={false}>
            <ul className="divide-y divide-border">
              {guru.kelasAmpu.map((k, i) => (
                <li key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-violet-500/10 text-violet-600">
                    <span className="h-4 w-4"><IconBook /></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-fg">{k.kelas} · {k.mapel}</div>
                    <div className="text-xs text-muted-fg">{k.jumlahSiswa} siswa</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">{k.rataNilai}</div>
                    <div className="text-xs text-muted-fg">rata nilai</div>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Sertifikasi Terbaru" padded={false}>
            <ul className="divide-y divide-border">
              {guru.sertifikasi.slice(0, 3).map((s, i) => (
                <li key={i} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
                    <span className="h-4 w-4"><IconGrad /></span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-fg truncate">{s.nama}</div>
                    <div className="text-xs text-muted-fg">{s.lembaga} · {formatTanggal(s.tanggal)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Aktivitas Terkini" padded={false}>
            <ul className="divide-y divide-border">
              {guru.aktivitas.slice(0, 4).map((a, i) => (
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
              <Button variant="outline" size="sm"><span className="text-xs">Catat Jurnal</span></Button>
              <Button variant="outline" size="sm"><span className="text-xs">Input Nilai</span></Button>
              <Button variant="outline" size="sm"><span className="text-xs">Ajukan Cuti</span></Button>
              <Button variant="outline" size="sm"><span className="text-xs">Atur Jadwal</span></Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}

function ProfilTab({ guru }: { guru: Guru }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Identitas">
        <InfoGrid cols={3}>
          <InfoField label="NIP" icon={<IconId />} value={<span className="tabular-nums">{guru.nip}</span>} />
          <InfoField label="NUPTK" value={<span className="tabular-nums">{guru.nuptk}</span>} />
          <InfoField label="NIK" value={<span className="tabular-nums">{guru.nik}</span>} />
          <InfoField label="Nama Lengkap" value={guru.namaLengkap} />
          <InfoField label="Gelar Depan" value={guru.gelar.depan ?? "—"} />
          <InfoField label="Gelar Belakang" value={guru.gelar.belakang ?? "—"} />
          <InfoField label="Jenis Kelamin" value={guru.jenisKelamin} />
          <InfoField label="Tempat, Tanggal Lahir" value={`${guru.tempatLahir}, ${formatTanggal(guru.tanggalLahir)}`} hint={`${umur(guru.tanggalLahir)} tahun`} />
          <InfoField label="Agama" value={guru.agama} />
          <InfoField label="Kewarganegaraan" value={guru.kewarganegaraan} />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Alamat">
        <InfoGrid cols={3}>
          <InfoField label="Alamat" icon={<IconMapPin />} value={guru.alamat} className="sm:col-span-2 lg:col-span-2" />
          <InfoField label="RT/RW" value={`${guru.rt}/${guru.rw}`} />
          <InfoField label="Desa/Kelurahan" value={guru.desa} />
          <InfoField label="Kecamatan" value={guru.kecamatan} />
          <InfoField label="Kabupaten/Kota" value={guru.kabupaten} />
          <InfoField label="Provinsi" value={guru.provinsi} />
          <InfoField label="Kode Pos" value={guru.kodePos} />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Kontak">
        <InfoGrid cols={2}>
          <InfoField label="Telepon" icon={<IconPhone />} value={guru.telepon} />
          <InfoField label="Email" icon={<IconMail />} value={guru.email} />
        </InfoGrid>
      </SectionCard>
    </div>
  );
}

function KepegawaianTab({ guru }: { guru: Guru }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Jabatan & Status">
        <InfoGrid cols={3}>
          <InfoField label="Jabatan" value={guru.jabatan} />
          <InfoField label="Jenis PTK" value={guru.jenisPtk} />
          <InfoField label="Status Kepegawaian" value={<Badge tone="brand">{guru.statusKepegawaian}</Badge>} />
          <InfoField label="Pangkat" value={guru.pangkat ?? "—"} />
          <InfoField label="Golongan" value={guru.golongan ?? "—"} />
          <InfoField label="Mata Pelajaran" value={guru.mataPelajaran.join(", ")} />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Masa Kerja">
        <InfoGrid cols={3}>
          <InfoField label="TMT Kerja" icon={<IconCalendar />} value={formatTanggal(guru.tmtKerja)} />
          <InfoField label="Tahun Pensiun" value={guru.tahunPensiun ?? "—"} />
          <InfoField label="Status" value={<Badge tone={STATUS_TONE[guru.status]} dot>{guru.status}</Badge>} />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Pendidikan">
        <InfoGrid cols={3}>
          <InfoField label="Pendidikan Terakhir" icon={<IconGrad />} value={guru.pendidikanTerakhir} />
          <InfoField label="Jurusan" value={guru.jurusan} />
          <InfoField label="Asal Kampus" value={guru.asalKampus} />
        </InfoGrid>
      </SectionCard>
    </div>
  );
}

function JadwalTab({ guru }: { guru: Guru }) {
  const cols: Column<JadwalMengajarRow>[] = [
    { key: "hari", header: "Hari", cell: (r) => <Badge tone="brand">{r.hari}</Badge> },
    { key: "jam", header: "Jam", cell: (r) => <span className="tabular-nums">{r.jam}</span> },
    { key: "mapel", header: "Mata Pelajaran", cell: (r) => <span className="font-medium">{r.mapel}</span> },
    { key: "kelas", header: "Kelas", cell: (r) => r.kelas },
    { key: "ruang", header: "Ruang", cell: (r) => <span className="text-muted-fg">{r.ruang}</span> },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Jam" value={`${guru.totalJamMengajar} jp`} accent="brand" icon={<IconClock />} />
        <StatCard label="Jumlah Kelas" value={guru.jumlahKelas} accent="violet" icon={<IconBook />} />
        <StatCard label="Mata Pelajaran" value={guru.mataPelajaran.length} accent="emerald" icon={<IconGrad />} />
      </div>
      <SectionCard
        title="Jadwal Mengajar Mingguan"
        description="Semester berjalan"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Pilih Semester</Button>
            <Button variant="outline" size="sm"><span className="h-3.5 w-3.5 mr-1"><IconDownload /></span>Unduh</Button>
          </div>
        }
        padded={false}
      >
        <DataTable data={guru.jadwalMengajar} columns={cols} rowKey={(r) => `${r.hari}-${r.jam}-${r.kelas}-${r.mapel}`} />
      </SectionCard>
    </div>
  );
}

function KelasTab({ guru }: { guru: Guru }) {
  const cols: Column<KelasAmpuRow>[] = [
    { key: "kelas", header: "Kelas", cell: (r) => <span className="font-medium">{r.kelas}</span> },
    { key: "mapel", header: "Mata Pelajaran", cell: (r) => r.mapel },
    { key: "siswa", header: "Jumlah Siswa", align: "right", cell: (r) => <span className="tabular-nums">{r.jumlahSiswa}</span> },
    { key: "rata", header: "Rata Nilai", align: "right", cell: (r) => <span className="tabular-nums font-semibold">{r.rataNilai}</span> },
  ];
  return (
    <SectionCard title="Kelas Ampu" action={<Button size="sm"><span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Tambah Kelas</Button>} padded={false}>
      <DataTable data={guru.kelasAmpu} columns={cols} rowKey={(r) => `${r.kelas}-${r.mapel}`} />
    </SectionCard>
  );
}

function RiwayatTab({ guru }: { guru: Guru }) {
  const cols: Column<RiwayatMengajarRow>[] = [
    { key: "tahun", header: "Tahun Ajaran", cell: (r) => <span className="tabular-nums">{r.tahun}</span> },
    { key: "semester", header: "Semester", cell: (r) => <Badge tone="neutral">{r.semester}</Badge> },
    { key: "mapel", header: "Mata Pelajaran", cell: (r) => <span className="font-medium">{r.mapel}</span> },
    { key: "kelas", header: "Kelas", cell: (r) => r.kelas },
    { key: "siswa", header: "Jumlah Siswa", align: "right", cell: (r) => <span className="tabular-nums">{r.jumlahSiswa}</span> },
  ];
  return (
    <SectionCard title="Riwayat Mengajar" padded={false}>
      <DataTable data={guru.riwayatMengajar} columns={cols} rowKey={(r) => `${r.tahun}-${r.semester}-${r.kelas}-${r.mapel}`} />
    </SectionCard>
  );
}

function SertifikasiTab({ guru }: { guru: Guru }) {
  const cols: Column<SertifikasiRow>[] = [
    { key: "nama", header: "Nama Sertifikasi", cell: (r) => <span className="font-medium">{r.nama}</span> },
    { key: "lembaga", header: "Lembaga", cell: (r) => r.lembaga },
    { key: "tgl", header: "Tanggal", cell: (r) => formatTanggal(r.tanggal) },
    { key: "no", header: "No. Sertifikat", cell: (r) => <span className="tabular-nums text-muted-fg">{r.noSertifikat}</span> },
    { key: "berlaku", header: "Masa Berlaku", cell: (r) => <span className="text-muted-fg">{r.masaBerlaku ?? "—"}</span> },
  ];
  return (
    <SectionCard
      title="Sertifikasi & Pelatihan"
      action={<Button size="sm"><span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Tambah Sertifikat</Button>}
      padded={false}
    >
      <DataTable data={guru.sertifikasi} columns={cols} rowKey={(r) => r.noSertifikat} />
    </SectionCard>
  );
}

function KehadiranTab({ guru }: { guru: Guru }) {
  const cols: Column<KehadiranGuruRow>[] = [
    { key: "tgl", header: "Tanggal", cell: (r) => <span className="tabular-nums">{formatTanggal(r.tanggal)}</span> },
    { key: "status", header: "Status", cell: (r) => <Badge tone={KEHADIRAN_TONE[r.status]} dot>{r.status}</Badge> },
    { key: "masuk", header: "Jam Masuk", cell: (r) => <span className="tabular-nums">{r.jamMasuk ?? "—"}</span> },
    { key: "pulang", header: "Jam Pulang", cell: (r) => <span className="tabular-nums">{r.jamPulang ?? "—"}</span> },
    { key: "ket", header: "Keterangan", cell: (r) => <span className="text-muted-fg">{r.keterangan ?? "—"}</span> },
  ];
  const counts = guru.kehadiran.reduce<Record<string, number>>((acc, a) => {
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
        <DataTable data={guru.kehadiran} columns={cols} rowKey={(r) => r.tanggal} />
      </SectionCard>
    </div>
  );
}

function DokumenTab({ guru }: { guru: Guru }) {
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
      <DataTable data={guru.dokumen} columns={cols} rowKey={(r) => r.nama} />
    </SectionCard>
  );
}

function AktivitasTab({ guru }: { guru: Guru }) {
  return (
    <SectionCard title="Linimasa Aktivitas" description="Riwayat perubahan dan kejadian terkait guru" padded={false}>
      {guru.aktivitas.length === 0 ? (
        <EmptyState title="Belum ada aktivitas" />
      ) : (
        <ul className="divide-y divide-border">
          {guru.aktivitas.map((a: AktivitasRow, i) => (
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
  { key: "kepegawaian", label: "Kepegawaian", icon: <IconGrad /> },
  { key: "jadwal", label: "Jadwal", icon: <IconCalendar /> },
  { key: "kelas", label: "Kelas", icon: <IconBook /> },
  { key: "riwayat", label: "Riwayat", icon: <IconClock /> },
  { key: "sertifikasi", label: "Sertifikasi", icon: <IconCheck /> },
  { key: "kehadiran", label: "Kehadiran", icon: <IconUsers /> },
  { key: "dokumen", label: "Dokumen", icon: <IconFile /> },
  { key: "aktivitas", label: "Aktivitas", icon: <IconClock /> },
];

const VALID_TABS = new Set<TabKey>([
  "ringkasan","profil","kepegawaian","jadwal","kelas","riwayat","sertifikasi","kehadiran","dokumen","aktivitas",
]);

// Backend Guru doctype shape (snake_case). Only top-level fields rendered
// on this page are mapped; nested arrays (jadwalMengajar, kelasAmpu,
// kehadiran, riwayatMengajar, sertifikasi, dokumen, aktivitas) still need
// per-table queries — follow-up sprint.
type MapelPengampuRow = {
  name: string;
  mata_pelajaran?: string;
  tingkat?: string;
};

type GuruDoc = {
  name: string;
  nip?: string;
  nuptk?: string;
  nama_lengkap?: string;
  jenis_kelamin?: "Laki-laki" | "Perempuan";
  status_kepegawaian?: string;
  is_aktif?: number;
  sekolah?: string;
  jabatan_fungsional?: string;
  golongan?: string;
  tmt_cpns?: string;
  mapel_pengampu?: MapelPengampuRow[];
};

function uniqueMapel(rows: MapelPengampuRow[]): string[] {
  const set = new Set<string>();
  for (const r of rows) if (r.mata_pelajaran) set.add(r.mata_pelajaran);
  return [...set];
}

// Slot Jadwal child row + parent Jadwal Pelajaran shape. Frappe REST list
// returns child Table rows inline when requested via `fields`.
type SlotJadwalRow = {
  name: string;
  hari?: JadwalMengajarRow["hari"];
  jam_mulai?: string;
  jam_selesai?: string;
  mata_pelajaran?: string;
  guru?: string;
  ruangan?: string;
};

type JadwalPelajaranDoc = {
  name: string;
  rombel?: string;
  slots?: SlotJadwalRow[];
};

function formatJam(jamMulai?: string, jamSelesai?: string): string {
  const trim = (s?: string) => (s ?? "").slice(0, 5);
  return `${trim(jamMulai)} - ${trim(jamSelesai)}`;
}

function mapToJadwalMengajar(
  docs: JadwalPelajaranDoc[],
  nip: string,
): JadwalMengajarRow[] {
  const out: JadwalMengajarRow[] = [];
  for (const d of docs) {
    const slots = d.slots ?? [];
    for (const s of slots) {
      if (s.guru !== nip) continue;
      if (!s.hari) continue;
      out.push({
        hari: s.hari,
        jam: formatJam(s.jam_mulai, s.jam_selesai),
        mapel: s.mata_pelajaran ?? "",
        kelas: d.rombel ?? "",
        ruang: s.ruangan ?? "",
      });
    }
  }
  return out;
}

function mapToKelasAmpu(
  docs: JadwalPelajaranDoc[],
  nip: string,
): KelasAmpuRow[] {
  const map = new Map<string, KelasAmpuRow>();
  for (const d of docs) {
    const rombel = d.rombel ?? "";
    const slots = d.slots ?? [];
    for (const s of slots) {
      if (s.guru !== nip) continue;
      const mapel = s.mata_pelajaran ?? "";
      const key = `${rombel}|${mapel}`;
      if (map.has(key)) continue;
      map.set(key, { kelas: rombel, mapel, jumlahSiswa: 0, rataNilai: 0 });
    }
  }
  return [...map.values()];
}

function GuruDetailPage() {
  const { nip } = Route.useParams();
  const search = Route.useSearch();
  const docQ = useResourceDoc<GuruDoc>("Guru", nip);
  const jadwalListQ = useResourceList<JadwalPelajaranDoc>("Jadwal Pelajaran", {
    filters: [["Slot Jadwal", "guru", "=", nip], ["is_aktif", "=", 1]],
    fields: ["name", "rombel", "slots"],
    limit_page_length: 50,
  });
  const mock = findGuru(nip);
  // Merge: real top-level fields override mock; nested arrays fall back.
  const guru: Guru | undefined = (() => {
    if (!mock) return undefined;
    const d = docQ.data;
    const jadwalDocs = jadwalListQ.data ?? [];
    const jadwalRows = mapToJadwalMengajar(jadwalDocs, nip);
    const kelasRows = mapToKelasAmpu(jadwalDocs, nip);
    const base: Guru = {
      ...mock,
      jadwalMengajar: jadwalRows.length > 0 ? jadwalRows : mock.jadwalMengajar,
      kelasAmpu: kelasRows.length > 0 ? kelasRows : mock.kelasAmpu,
    };
    if (!d) return base;
    return {
      ...base,
      nip: d.nip ?? d.name ?? mock.nip,
      nuptk: d.nuptk ?? mock.nuptk,
      namaLengkap: d.nama_lengkap ?? mock.namaLengkap,
      jenisKelamin: d.jenis_kelamin ?? mock.jenisKelamin,
      status: (d.is_aktif === 0 ? "Non-aktif" : mock.status) as Guru["status"],
      statusKepegawaian: (d.status_kepegawaian as Guru["statusKepegawaian"]) ?? mock.statusKepegawaian,
      jabatan: d.jabatan_fungsional ?? mock.jabatan,
      pangkat: d.golongan ?? mock.pangkat,
      mataPelajaran: d.mapel_pengampu?.length
        ? uniqueMapel(d.mapel_pengampu)
        : mock.mataPelajaran,
    };
  })();
  const navigate = useNavigate();
  const tab: TabKey = VALID_TABS.has(search.tab as TabKey) ? (search.tab as TabKey) : "ringkasan";
  const setTab = (next: TabKey) => {
    navigate({ to: "/guru/$nip", params: { nip }, search: { tab: next === "ringkasan" ? undefined : next } });
  };

  if (!guru) {
    throw notFound();
  }

  const counts: Partial<Record<TabKey, number>> = {
    jadwal: guru.jadwalMengajar.length,
    kelas: guru.kelasAmpu.length,
    riwayat: guru.riwayatMengajar.length,
    sertifikasi: guru.sertifikasi.length,
    kehadiran: guru.kehadiran.length,
    dokumen: guru.dokumen.length,
    aktivitas: guru.aktivitas.length,
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
      case "ringkasan": return <RingkasanTab guru={guru} />;
      case "profil": return <ProfilTab guru={guru} />;
      case "kepegawaian": return <KepegawaianTab guru={guru} />;
      case "jadwal": return <JadwalTab guru={guru} />;
      case "kelas": return <KelasTab guru={guru} />;
      case "riwayat": return <RiwayatTab guru={guru} />;
      case "sertifikasi": return <SertifikasiTab guru={guru} />;
      case "kehadiran": return <KehadiranTab guru={guru} />;
      case "dokumen": return <DokumenTab guru={guru} />;
      case "aktivitas": return <AktivitasTab guru={guru} />;
    }
  };

  return (
    <DetailPageTemplate
      header={
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: "Dashboard", render: ({ className, children }) => <Link to="/" className={className}>{children}</Link> },
              { label: "Guru", render: ({ className, children }) => <Link to="/guru" className={className}>{children}</Link> },
              { label: guru.namaLengkap },
            ]}
          />
          <PageHeader
            eyebrow="Detail Guru"
            title={namaWithGelar(guru)}
            description={`NIP ${guru.nip} · ${guru.jabatan} · ${guru.status}`}
            actions={
              <Button variant="outline" onClick={() => navigate({ to: "/guru" })}>
                <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
                Kembali ke daftar
              </Button>
            }
          />
        </div>
      }
      hero={<Hero guru={guru} />}
      tabs={<Tabs items={tabItems} />}
      primary={renderTab()}
    />
  );
}

type SearchParams = { tab?: TabKey | undefined };

export const Route = createFileRoute("/guru/$nip")({
  component: GuruDetailPage,
  validateSearch: (raw: Record<string, unknown>): SearchParams => {
    const t = typeof raw.tab === "string" ? raw.tab : undefined;
    return { tab: t && VALID_TABS.has(t as TabKey) ? (t as TabKey) : undefined };
  },
  notFoundComponent: () => (
    <div className="py-16">
      <EmptyState
        title="Guru tidak ditemukan"
        description="NIP yang diminta tidak ada di sistem. Periksa kembali atau kembali ke daftar guru."
        action={
          <Link to="/guru" className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
            <span className="h-4 w-4"><IconArrowLeft /></span> Kembali ke daftar
          </Link>
        }
      />
    </div>
  ),
});
