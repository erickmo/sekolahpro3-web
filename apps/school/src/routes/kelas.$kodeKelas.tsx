import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import {
  Badge,
  Breadcrumb,
  Button,
  Column,
  DataTable,
  DetailPageTemplate,
  EmptyState,
  PageHeader,
  SectionCard,
  StatCard,
  Tabs,
  IconArrowLeft,
  IconBook,
  IconCalendar,
  IconChart,
  IconCheck,
  IconClock,
  IconDownload,
  IconEdit,
  IconFile,
  IconHome,
  IconId,
  IconMapPin,
  IconMore,
  IconPrint,
  IconUsers,
  type TabItem,
} from "@sekolahpro/ui";
import { useResourceDoc, useResourceList } from "@sekolahpro/api-client";
import {
  findKelas,
  formatTanggal,
  type AktivitasRow,
  type JadwalMapelRow,
  type JurnalKelasRow,
  type Kelas,
  type RekapAbsensiRow,
  type RekapNilaiRow,
  type SiswaKelasRow,
  type StatusKelas,
} from "../data/kelas";

// Primary doc shape from "Rombongan Belajar" (verified against
// sekolahpro/siswa/doctype/rombongan_belajar/rombongan_belajar.json).
// Frappe REST returns child tables inline on doc-fetch, so `anggota` is
// the Anggota Rombel child rows without an extra round-trip.
type AnggotaRombelRow = {
  name: string;
  siswa?: string;
  no_urut?: number;
  tanggal_masuk_rombel?: string;
  status?: string;
};

type RombelDoc = {
  name: string;
  nama_rombel?: string;
  tahun_ajaran?: string;
  jenjang?: string;
  tingkat?: number | string;
  sekolah?: string;
  wali_kelas?: string;
  kapasitas?: number;
  ruangan?: string;
  status?: string;
  jumlah_siswa?: number;
  anggota?: AnggotaRombelRow[];
};

const ANGGOTA_STATUS_MAP: Record<string, SiswaKelasRow["status"]> = {
  Aktif: "Aktif",
  Keluar: "Mutasi",
};

// Map Anggota Rombel child rows into the SiswaKelasRow shape the UI expects.
// Fields the child table cannot supply (nama, jenisKelamin, rataNilai,
// persenKehadiran) fall back to a paired mock row by index so the table
// continues to render until those fields are wired (Anggota → Siswa join +
// Entri Nilai + Absensi aggregations are a follow-up sprint).
function mapAnggotaToSiswaRows(
  anggota: AnggotaRombelRow[],
  mockSiswa: SiswaKelasRow[],
): SiswaKelasRow[] {
  return anggota.map((a, i) => {
    const fallback = mockSiswa[i % Math.max(mockSiswa.length, 1)];
    return {
      nis: a.siswa ?? fallback?.nis ?? "",
      nama: fallback?.nama ?? a.siswa ?? "",
      jenisKelamin: fallback?.jenisKelamin ?? "L",
      status: ANGGOTA_STATUS_MAP[a.status ?? "Aktif"] ?? "Aktif",
      rataNilai: fallback?.rataNilai ?? 0,
      persenKehadiran: fallback?.persenKehadiran ?? 0,
    };
  });
}

// Slot Jadwal child row shape (akademik/doctype/slot_jadwal). Returned
// inline when fetching the parent Jadwal Pelajaran doc by name.
type SlotJadwalRow = {
  name: string;
  hari?: JadwalMapelRow["hari"];
  jam_mulai?: string;
  jam_selesai?: string;
  mata_pelajaran?: string;
  guru?: string;
  ruangan?: string;
};

type JadwalPelajaranDoc = {
  name: string;
  slots?: SlotJadwalRow[];
};

function formatJam(jamMulai?: string, jamSelesai?: string): string {
  if (!jamMulai && !jamSelesai) return "";
  const trim = (s?: string) => (s ?? "").slice(0, 5);
  return `${trim(jamMulai)} - ${trim(jamSelesai)}`;
}

// Audit Log SekolahPro row shape (verified against
// pengaturan/doctype/audit_log_sekolahpro/audit_log_sekolahpro.json).
type AuditLogRow = {
  name: string;
  timestamp?: string;
  user?: string;
  action?: string;
  severity?: "info" | "warning" | "error" | "critical" | string;
};

const SEVERITY_TONE: Record<string, AktivitasRow["tone"]> = {
  info: "neutral",
  warning: "warning",
  error: "danger",
  critical: "danger",
};

function mapAuditToAktivitas(rows: AuditLogRow[]): AktivitasRow[] {
  return rows.map((r) => {
    const ts = r.timestamp ?? "";
    const waktu = ts ? new Date(ts).toLocaleString("id-ID") : "—";
    const aksi = r.severity ? `${r.action ?? ""} (${r.severity})`.trim() : (r.action ?? "");
    return {
      waktu,
      aktor: r.user ?? "Sistem",
      aksi: aksi || "—",
      tone: SEVERITY_TONE[r.severity ?? "info"] ?? "neutral",
    };
  });
}

function mapSlotsToJadwalRows(
  slots: SlotJadwalRow[],
  defaultRuang: string,
): JadwalMapelRow[] {
  return slots
    .filter((s) => !!s.hari)
    .map((s) => ({
      hari: s.hari as JadwalMapelRow["hari"],
      jam: formatJam(s.jam_mulai, s.jam_selesai),
      mapel: s.mata_pelajaran ?? "—",
      guru: s.guru ?? "—",
      ruang: s.ruangan ?? defaultRuang,
    }));
}

type TabKey = "ringkasan" | "siswa" | "jadwal" | "nilai" | "absensi" | "jurnal" | "aktivitas";

const STATUS_TONE: Record<StatusKelas, "success" | "warning" | "neutral"> = {
  Aktif: "success",
  Penuh: "warning",
  Arsip: "neutral",
};

const SISWA_STATUS_TONE: Record<SiswaKelasRow["status"], "success" | "warning" | "neutral"> = {
  Aktif: "success",
  Mutasi: "warning",
  Cuti: "neutral",
};

function heroBadgeLabel(k: Kelas): string {
  if (k.jenjang === "SMA") return `${k.tingkat}${k.jurusan && k.jurusan !== "—" ? ` ${k.jurusan}` : ""}`;
  if (k.jenjang === "SMP") return `SMP ${k.tingkat}`;
  if (k.jenjang === "SD") return `SD ${k.tingkat}`;
  return `TK ${k.tingkat === "1" ? "A" : "B"}`;
}

function Hero({ kelas }: { kelas: Kelas }) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-brand/5 via-bg to-violet-500/5 p-6 shadow-sm">
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 via-brand/10 to-violet-500/15 text-brand">
          <div className="text-center leading-tight">
            <div className="text-lg font-bold tabular-nums">{heroBadgeLabel(kelas)}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-fg">Rombel {kelas.rombel}</div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold text-fg truncate">{kelas.nama}</h2>
            <Badge tone={STATUS_TONE[kelas.status]} dot>{kelas.status}</Badge>
            <Badge tone="brand">{kelas.jenjang}</Badge>
          </div>
          <div className="mt-1 text-sm text-muted-fg">
            <span className="tabular-nums">{kelas.kodeKelas}</span>
            <span className="mx-2">·</span>
            <span>{kelas.waliKelas}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-fg">
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconId /></span>NIP {kelas.waliKelasNip}</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconMapPin /></span>Ruang {kelas.ruang}</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconCalendar /></span>{kelas.tahunAjaran}</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconClock /></span>Semester {kelas.semester}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <span className="h-4 w-4 mr-1.5"><IconPrint /></span>Cetak Daftar
          </Button>
          <Button variant="outline" size="sm">
            <span className="h-4 w-4 mr-1.5"><IconDownload /></span>Unduh Rapor
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

function RingkasanTab({ kelas }: { kelas: Kelas }) {
  const today = kelas.jadwal.filter((j) => j.hari === "Senin").slice(0, 6);
  const topMapel = [...kelas.rekapNilai].sort((a, b) => b.rataKelas - a.rataKelas).slice(0, 5);
  const jurnalTerbaru = kelas.jurnal.slice(0, 4);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Jumlah Siswa" value={kelas.jumlahSiswa} hint={`Kapasitas ${kelas.kapasitas}`} icon={<IconUsers />} accent="brand" />
        <StatCard label="Rata Nilai" value={kelas.rataNilai} hint="seluruh mapel" icon={<IconChart />} accent="violet" />
        <StatCard label="Kehadiran" value={`${kelas.persenKehadiran}%`} delta={{ value: "30 hari terakhir", trend: "flat" }} icon={<IconCheck />} accent="emerald" />
        <StatCard label="Jam Pelajaran" value={`${kelas.jamPelajaranPerMinggu} jp`} hint="per minggu" icon={<IconClock />} accent="amber" />
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
                    <div className="text-xs text-muted-fg">{j.guru} · {j.ruang}</div>
                  </div>
                  <div className="text-right text-xs tabular-nums text-muted-fg">{j.jam}</div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Rekap Nilai Tertinggi" description="5 mapel teratas" padded={false}>
            <ul className="divide-y divide-border">
              {topMapel.map((m, i) => (
                <li key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-violet-500/10 text-violet-600">
                    <span className="h-4 w-4"><IconBook /></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-fg">{m.mapel}</div>
                    <div className="text-xs text-muted-fg">Tertinggi {m.tertinggi} · Terendah {m.terendah}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">{m.rataKelas}</div>
                    <div className="text-xs text-muted-fg">{m.lulus}/{m.jumlahSiswa} lulus</div>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Wali Kelas">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand text-sm font-semibold">
                {kelas.waliKelas.split(" ").slice(-2).map((s) => s[0]).join("").toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-fg truncate">{kelas.waliKelas}</div>
                <div className="text-xs text-muted-fg tabular-nums">NIP {kelas.waliKelasNip}</div>
                <div className="mt-2 flex gap-2">
                  <Button variant="outline" size="sm">Profil</Button>
                  <Button variant="outline" size="sm">Pesan</Button>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Jurnal Terbaru" padded={false}>
            <ul className="divide-y divide-border">
              {jurnalTerbaru.map((j, i) => (
                <li key={i} className="px-5 py-3">
                  <div className="text-sm font-medium text-fg truncate">{j.mapel}</div>
                  <div className="text-xs text-muted-fg truncate">{j.materi}</div>
                  <div className="mt-1 text-xs text-muted-fg tabular-nums">{formatTanggal(j.tanggal)} · {j.jam}</div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Aksi Cepat">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm"><span className="text-xs">Catat Jurnal</span></Button>
              <Button variant="outline" size="sm"><span className="text-xs">Input Nilai</span></Button>
              <Button variant="outline" size="sm"><span className="text-xs">Absensi Manual</span></Button>
              <Button variant="outline" size="sm"><span className="text-xs">Atur Jadwal</span></Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}

function SiswaTab({ kelas }: { kelas: Kelas }) {
  const cols: Column<SiswaKelasRow>[] = [
    { key: "nis", header: "NIS", cell: (r) => <span className="tabular-nums text-muted-fg">{r.nis}</span>, width: "120px" },
    { key: "nama", header: "Nama Siswa", cell: (r) => <span className="font-medium">{r.nama}</span> },
    { key: "jk", header: "JK", align: "center", width: "70px", cell: (r) => (
      <Badge tone={r.jenisKelamin === "L" ? "brand" : "neutral"}>{r.jenisKelamin}</Badge>
    ) },
    { key: "rata", header: "Rata Nilai", align: "right", cell: (r) => <span className="tabular-nums font-semibold">{r.rataNilai}</span> },
    { key: "hadir", header: "Kehadiran", cell: (r) => (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-emerald-500" style={{ width: `${r.persenKehadiran}%` }} />
        </div>
        <span className="text-xs tabular-nums text-muted-fg">{r.persenKehadiran}%</span>
      </div>
    ) },
    { key: "status", header: "Status", cell: (r) => <Badge tone={SISWA_STATUS_TONE[r.status]} dot>{r.status}</Badge> },
  ];
  return (
    <SectionCard
      title={`Daftar Siswa (${kelas.siswa.length})`}
      description={`L ${kelas.jumlahLaki} · P ${kelas.jumlahPerempuan}`}
      action={<Button size="sm"><span className="h-3.5 w-3.5 mr-1"><IconPrint /></span>Cetak Daftar</Button>}
      padded={false}
    >
      <DataTable data={kelas.siswa} columns={cols} rowKey={(r) => r.nis} />
    </SectionCard>
  );
}

function JadwalTab({ kelas }: { kelas: Kelas }) {
  const cols: Column<JadwalMapelRow>[] = [
    { key: "hari", header: "Hari", cell: (r) => <Badge tone="brand">{r.hari}</Badge>, width: "100px" },
    { key: "jam", header: "Jam", cell: (r) => <span className="tabular-nums">{r.jam}</span>, width: "140px" },
    { key: "mapel", header: "Mata Pelajaran", cell: (r) => <span className="font-medium">{r.mapel}</span> },
    { key: "guru", header: "Guru", cell: (r) => r.guru },
    { key: "ruang", header: "Ruang", cell: (r) => <span className="text-muted-fg">{r.ruang}</span>, width: "100px" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Jam Pelajaran" value={`${kelas.jamPelajaranPerMinggu} jp`} hint="per minggu" accent="brand" icon={<IconClock />} />
        <StatCard label="Jumlah Mapel" value={kelas.jumlahMapel} accent="violet" icon={<IconBook />} />
        <StatCard label="Hari Belajar" value={kelas.jenjang === "TK" ? 5 : 6} hint="hari per minggu" accent="emerald" icon={<IconCalendar />} />
      </div>
      <SectionCard
        title="Jadwal Mingguan"
        description={`${kelas.tahunAjaran} · Semester ${kelas.semester}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Pilih Semester</Button>
            <Button variant="outline" size="sm"><span className="h-3.5 w-3.5 mr-1"><IconDownload /></span>Unduh</Button>
          </div>
        }
        padded={false}
      >
        <DataTable data={kelas.jadwal} columns={cols} rowKey={(r) => `${r.hari}-${r.jam}-${r.mapel}`} />
      </SectionCard>
    </div>
  );
}

function NilaiTab({ kelas }: { kelas: Kelas }) {
  const cols: Column<RekapNilaiRow>[] = [
    { key: "mapel", header: "Mata Pelajaran", cell: (r) => <span className="font-medium">{r.mapel}</span> },
    { key: "rata", header: "Rata Kelas", align: "right", cell: (r) => <span className="tabular-nums font-semibold">{r.rataKelas}</span> },
    { key: "tertinggi", header: "Tertinggi", align: "right", cell: (r) => <span className="tabular-nums text-emerald-600">{r.tertinggi}</span> },
    { key: "terendah", header: "Terendah", align: "right", cell: (r) => <span className="tabular-nums text-rose-600">{r.terendah}</span> },
    { key: "lulus", header: "Lulus", align: "right", cell: (r) => <span className="tabular-nums">{r.lulus}</span> },
    { key: "total", header: "Jumlah Siswa", align: "right", cell: (r) => <span className="tabular-nums text-muted-fg">{r.jumlahSiswa}</span> },
  ];
  const sorted = [...kelas.rekapNilai].sort((a, b) => b.rataKelas - a.rataKelas);
  const rataKeseluruhan = sorted.length > 0
    ? Math.round(sorted.reduce((s, r) => s + r.rataKelas, 0) / sorted.length)
    : 0;
  const tertinggi = sorted[0];
  const terendah = sorted[sorted.length - 1];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Rata Keseluruhan" value={rataKeseluruhan} accent="brand" icon={<IconChart />} />
        <StatCard label="Mapel Tertinggi" value={tertinggi?.rataKelas ?? 0} hint={tertinggi?.mapel ?? "—"} accent="emerald" icon={<IconCheck />} />
        <StatCard label="Mapel Terendah" value={terendah?.rataKelas ?? 0} hint={terendah?.mapel ?? "—"} accent="amber" icon={<IconBook />} />
      </div>
      <SectionCard
        title="Rekap Nilai per Mapel"
        action={<Button variant="outline" size="sm"><span className="h-3.5 w-3.5 mr-1"><IconDownload /></span>Ekspor</Button>}
        padded={false}
      >
        <DataTable data={kelas.rekapNilai} columns={cols} rowKey={(r) => r.mapel} />
      </SectionCard>
    </div>
  );
}

function AbsensiTab({ kelas }: { kelas: Kelas }) {
  const totals = kelas.rekapAbsensi.reduce(
    (acc, r) => ({
      hadir: acc.hadir + r.hadir,
      sakit: acc.sakit + r.sakit,
      izin: acc.izin + r.izin,
      alpa: acc.alpa + r.alpa,
      terlambat: acc.terlambat + r.terlambat,
    }),
    { hadir: 0, sakit: 0, izin: 0, alpa: 0, terlambat: 0 },
  );
  const cols: Column<RekapAbsensiRow>[] = [
    { key: "tgl", header: "Tanggal", cell: (r) => <span className="tabular-nums">{formatTanggal(r.tanggal)}</span> },
    { key: "hadir", header: "Hadir", align: "right", cell: (r) => <span className="tabular-nums text-emerald-600">{r.hadir}</span> },
    { key: "sakit", header: "Sakit", align: "right", cell: (r) => <span className="tabular-nums text-amber-600">{r.sakit}</span> },
    { key: "izin", header: "Izin", align: "right", cell: (r) => <span className="tabular-nums text-brand">{r.izin}</span> },
    { key: "alpa", header: "Alpa", align: "right", cell: (r) => <span className="tabular-nums text-rose-600">{r.alpa}</span> },
    { key: "terlambat", header: "Terlambat", align: "right", cell: (r) => <span className="tabular-nums text-violet-600">{r.terlambat}</span> },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-5">
        <StatCard label="Hadir" value={totals.hadir} accent="emerald" icon={<IconCheck />} />
        <StatCard label="Sakit" value={totals.sakit} accent="amber" />
        <StatCard label="Izin" value={totals.izin} accent="brand" />
        <StatCard label="Alpa" value={totals.alpa} accent="rose" />
        <StatCard label="Terlambat" value={totals.terlambat} accent="violet" />
      </div>
      <SectionCard
        title="Rekap Absensi Harian"
        description="10 hari terakhir"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Filter Periode</Button>
            <Button variant="outline" size="sm">Catat Manual</Button>
          </div>
        }
        padded={false}
      >
        <DataTable data={kelas.rekapAbsensi} columns={cols} rowKey={(r) => r.tanggal} />
      </SectionCard>
    </div>
  );
}

function JurnalTab({ kelas }: { kelas: Kelas }) {
  const cols: Column<JurnalKelasRow>[] = [
    { key: "tgl", header: "Tanggal", cell: (r) => <span className="tabular-nums">{formatTanggal(r.tanggal)}</span>, width: "140px" },
    { key: "jam", header: "Jam", cell: (r) => <span className="tabular-nums">{r.jam}</span>, width: "140px" },
    { key: "mapel", header: "Mapel", cell: (r) => <span className="font-medium">{r.mapel}</span> },
    { key: "guru", header: "Guru", cell: (r) => r.guru },
    { key: "materi", header: "Materi", cell: (r) => r.materi },
    { key: "catatan", header: "Catatan", cell: (r) => <span className="text-muted-fg">{r.catatan ?? "—"}</span> },
  ];
  return (
    <SectionCard
      title="Jurnal Kelas"
      action={<Button size="sm"><span className="h-3.5 w-3.5 mr-1"><IconFile /></span>Tambah Jurnal</Button>}
      padded={false}
    >
      <DataTable data={kelas.jurnal} columns={cols} rowKey={(r) => `${r.tanggal}-${r.jam}-${r.mapel}`} />
    </SectionCard>
  );
}

function AktivitasTab({ kelas }: { kelas: Kelas }) {
  return (
    <SectionCard title="Linimasa Aktivitas" description="Riwayat perubahan dan kejadian terkait kelas" padded={false}>
      {kelas.aktivitas.length === 0 ? (
        <EmptyState title="Belum ada aktivitas" />
      ) : (
        <ul className="divide-y divide-border">
          {kelas.aktivitas.map((a: AktivitasRow, i) => (
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
  { key: "siswa", label: "Siswa", icon: <IconUsers /> },
  { key: "jadwal", label: "Jadwal", icon: <IconCalendar /> },
  { key: "nilai", label: "Nilai", icon: <IconChart /> },
  { key: "absensi", label: "Absensi", icon: <IconCheck /> },
  { key: "jurnal", label: "Jurnal", icon: <IconFile /> },
  { key: "aktivitas", label: "Aktivitas", icon: <IconClock /> },
];

const VALID_TABS = new Set<TabKey>([
  "ringkasan", "siswa", "jadwal", "nilai", "absensi", "jurnal", "aktivitas",
]);

function KelasDetailPage() {
  const { kodeKelas } = Route.useParams();
  const search = Route.useSearch();
  const docQ = useResourceDoc<RombelDoc>("Rombongan Belajar", kodeKelas);
  // Active Jadwal Pelajaran for this rombel (2-hop chain: list returns name,
  // doc fetch returns slots inline). React Query dedups across remounts.
  const jadwalListQ = useResourceList<{ name: string }>("Jadwal Pelajaran", {
    filters: { rombel: kodeKelas, is_aktif: 1 },
    fields: ["name"],
    limit_page_length: 1,
  });
  const jadwalName = jadwalListQ.data?.[0]?.name;
  const jadwalDocQ = useResourceDoc<JadwalPelajaranDoc>(
    "Jadwal Pelajaran",
    jadwalName,
  );
  const auditQ = useResourceList<AuditLogRow>("Audit Log SekolahPro", {
    filters: { docname: kodeKelas, doctype_name: "Rombongan Belajar" },
    fields: ["name", "timestamp", "user", "action", "severity"],
    order_by: "timestamp desc",
    limit_page_length: 20,
  });
  // Remaining nested data (rekapNilai, rekapAbsensi, jurnal, aktivitas) still
  // comes from mock until each gets its own resource wiring.
  // TODO(/kelas/$kodeKelas): wire remaining tabs to:
  //   - Absensi Harian / Absensi Pelajaran (rekap absensi)
  //   - Entri Nilai (rekap nilai)
  const mock = findKelas(kodeKelas);
  // Merge: real primary fields + anggota override mock; rest falls back.
  const kelas: Kelas | undefined = (() => {
    if (!docQ.data && !mock) return undefined;
    if (!mock) return undefined; // need nested shape; show notFound until wired
    const d = docQ.data;
    if (!d) return mock;
    const siswa = d.anggota?.length
      ? mapAnggotaToSiswaRows(d.anggota, mock.siswa)
      : mock.siswa;
    const ruang = d.ruangan ?? mock.ruang;
    const jadwal = jadwalDocQ.data?.slots?.length
      ? mapSlotsToJadwalRows(jadwalDocQ.data.slots, ruang)
      : mock.jadwal;
    const aktivitas = auditQ.data?.length
      ? mapAuditToAktivitas(auditQ.data)
      : mock.aktivitas;
    return {
      ...mock,
      kodeKelas: d.name,
      nama: d.nama_rombel ?? mock.nama,
      tahunAjaran: d.tahun_ajaran ?? mock.tahunAjaran,
      tingkat: (String(d.tingkat ?? mock.tingkat)) as Kelas["tingkat"],
      waliKelas: d.wali_kelas ?? mock.waliKelas,
      kapasitas: d.kapasitas ?? mock.kapasitas,
      jumlahSiswa: d.jumlah_siswa ?? siswa.length ?? mock.jumlahSiswa,
      ruang,
      status: ((d.status as Kelas["status"]) ?? mock.status),
      siswa,
      jadwal,
      aktivitas,
    };
  })();
  const navigate = useNavigate();
  const tab: TabKey = VALID_TABS.has(search.tab as TabKey) ? (search.tab as TabKey) : "ringkasan";
  const setTab = (next: TabKey) => {
    navigate({ to: "/kelas/$kodeKelas", params: { kodeKelas }, search: { tab: next === "ringkasan" ? undefined : next } });
  };

  if (!kelas) {
    if (docQ.isLoading) {
      return <div className="py-16 text-center text-sm text-muted-fg">Memuat detail kelas...</div>;
    }
    throw notFound();
  }

  const counts: Partial<Record<TabKey, number>> = {
    siswa: kelas.siswa.length,
    jadwal: kelas.jadwal.length,
    nilai: kelas.rekapNilai.length,
    absensi: kelas.rekapAbsensi.length,
    jurnal: kelas.jurnal.length,
    aktivitas: kelas.aktivitas.length,
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
      case "ringkasan": return <RingkasanTab kelas={kelas} />;
      case "siswa": return <SiswaTab kelas={kelas} />;
      case "jadwal": return <JadwalTab kelas={kelas} />;
      case "nilai": return <NilaiTab kelas={kelas} />;
      case "absensi": return <AbsensiTab kelas={kelas} />;
      case "jurnal": return <JurnalTab kelas={kelas} />;
      case "aktivitas": return <AktivitasTab kelas={kelas} />;
    }
  };

  return (
    <DetailPageTemplate
      header={
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: "Dashboard", render: ({ className, children }) => <Link to="/" className={className}>{children}</Link> },
              { label: "Kelas", render: ({ className, children }) => <Link to="/kelas" className={className}>{children}</Link> },
              { label: kelas.kodeKelas },
            ]}
          />
          <PageHeader
            eyebrow="Detail Kelas"
            title={kelas.nama}
            description={`${kelas.kodeKelas} · ${kelas.waliKelas} · ${kelas.tahunAjaran} ${kelas.semester}`}
            actions={
              <Button variant="outline" onClick={() => navigate({ to: "/kelas" })}>
                <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
                Kembali ke daftar
              </Button>
            }
          />
        </div>
      }
      hero={<Hero kelas={kelas} />}
      tabs={<Tabs items={tabItems} />}
      primary={renderTab()}
    />
  );
}

type SearchParams = { tab?: TabKey | undefined };

export const Route = createFileRoute("/kelas/$kodeKelas")({
  component: KelasDetailPage,
  validateSearch: (raw: Record<string, unknown>): SearchParams => {
    const t = typeof raw.tab === "string" ? raw.tab : undefined;
    return { tab: t && VALID_TABS.has(t as TabKey) ? (t as TabKey) : undefined };
  },
  notFoundComponent: () => (
    <div className="py-16">
      <EmptyState
        title="Kelas tidak ditemukan"
        description="Kode kelas yang diminta tidak ada di sistem. Periksa kembali atau kembali ke daftar kelas."
        action={
          <Link to="/kelas" className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
            <span className="h-4 w-4"><IconArrowLeft /></span> Kembali ke daftar
          </Link>
        }
      />
    </div>
  ),
});
