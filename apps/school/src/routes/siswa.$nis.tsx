import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useResourceCreate } from "@sekolahpro/api-client";
import {
  AbsensiModal,
  CatatanModal,
  DokumenModal,
  MutasiModal,
  PembayaranModal,
  PeriodeModal,
  PesanModal,
  SemesterModal,
  TagihanModal,
  WaliModal,
  type PeriodeRange,
  type SemesterPick,
} from "../components/SiswaModals";
import { openOrAlert, printDocument, stubAction } from "../lib/stub";
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
  IconWallet,
  type TabItem,
} from "@sekolahpro/ui";
import { useResourceDoc } from "@sekolahpro/api-client";
import {
  findSiswa,
  formatRupiah,
  formatTanggal,
  umur,
  type AbsensiRow,
  type AktivitasRow,
  type DokumenRow,
  type MutasiRow,
  type NilaiRow,
  type PembayaranRow,
  type Siswa,
  type StatusSiswa,
  type TagihanRow,
  type WaliRow,
} from "../data/siswa";

type TabKey = "ringkasan" | "profil" | "akademik" | "absensi" | "keuangan" | "wali" | "mutasi" | "dokumen" | "aktivitas";

const STATUS_TONE: Record<StatusSiswa, "success" | "brand" | "neutral" | "warning" | "danger"> = {
  Aktif: "success",
  Calon: "brand",
  Alumni: "neutral",
  "Pindah Keluar": "warning",
  DO: "danger",
};

const ABSEN_TONE = {
  Hadir: "success",
  Sakit: "warning",
  Izin: "brand",
  Alpa: "danger",
  Terlambat: "warning",
} as const;

const TAGIHAN_TONE = {
  Lunas: "success",
  Tertunda: "warning",
  "Jatuh Tempo": "danger",
  Cicilan: "brand",
} as const;

function Hero({ siswa, onEdit, onMessage, onPrintCard, onDownloadRapor, onMore }: {
  siswa: Siswa;
  onEdit: () => void;
  onMessage: () => void;
  onPrintCard: () => void;
  onDownloadRapor: () => void;
  onMore: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-brand/5 via-bg to-violet-500/5 p-6 shadow-sm">
      <div className="flex flex-wrap items-start gap-5">
        <Avatar name={siswa.namaLengkap} src={siswa.fotoUrl ?? null} size="lg" className="!h-20 !w-20 !text-xl" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold text-fg truncate">{siswa.namaLengkap}</h2>
            <Badge tone={STATUS_TONE[siswa.status]} dot>{siswa.status}</Badge>
            {siswa.penerimaKip ? <Badge tone="brand">KIP</Badge> : null}
            {siswa.kebutuhanKhusus && siswa.kebutuhanKhusus !== "Normal" ? (
              <Badge tone="warning">Kebutuhan Khusus</Badge>
            ) : null}
          </div>
          <div className="mt-1 text-sm text-muted-fg">
            <span className="tabular-nums">NIS {siswa.nis}</span>
            <span className="mx-2">·</span>
            <span className="tabular-nums">NISN {siswa.nisn}</span>
            <span className="mx-2">·</span>
            <span>{siswa.kelas} ({siswa.rombel})</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-fg">
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconCake /></span>{formatTanggal(siswa.tanggalLahir)} ({umur(siswa.tanggalLahir)} th)</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconMail /></span>{siswa.email}</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconPhone /></span>{siswa.telepon}</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconMapPin /></span>{siswa.kecamatan}, {siswa.kabupaten}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onMessage}>
            <span className="h-4 w-4 mr-1.5"><IconChat /></span>Pesan
          </Button>
          <Button variant="outline" size="sm" onClick={onPrintCard}>
            <span className="h-4 w-4 mr-1.5"><IconPrint /></span>Cetak Kartu
          </Button>
          <Button variant="outline" size="sm" onClick={onDownloadRapor}>
            <span className="h-4 w-4 mr-1.5"><IconDownload /></span>Unduh Rapor
          </Button>
          <Button size="sm" onClick={onEdit}>
            <span className="h-4 w-4 mr-1.5"><IconEdit /></span>Edit
          </Button>
          <Button variant="outline" size="sm" className="!px-2" onClick={onMore}>
            <span className="h-4 w-4"><IconMore /></span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function RingkasanTab({ siswa, onChangeTab }: { siswa: Siswa; onChangeTab: (k: TabKey) => void }) {
  const tagihanTertunda = siswa.tagihan.filter((t) => t.status !== "Lunas").length;
  const [openPay, setOpenPay] = useState(false);
  const [openMutasi, setOpenMutasi] = useState(false);
  const [openCatatan, setOpenCatatan] = useState(false);
  const [openTugas, setOpenTugas] = useState(false);

  const qc = useQueryClient();
  const createMutasi = useResourceCreate("Mutasi Siswa");
  const createOutbox = useResourceCreate("Mobile Outbox Entry");

  const handleMutasi = async (m: MutasiRow) => {
    try {
      await createMutasi.mutateAsync({
        siswa: siswa.nis,
        jenis_mutasi: m.jenis,
        tanggal_mutasi: m.tanggal,
        rombel_asal: m.dari ?? "",
        rombel_tujuan: m.ke ?? "",
        alasan_pindah: m.keterangan ?? "",
      });
      qc.invalidateQueries({ queryKey: ["resource:list", "Mutasi Siswa"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mencatat mutasi.");
    }
  };

  const handleSuratTugas = async (p: { kanal: string; penerima: string; subjek: string; isi: string }) => {
    try {
      await createOutbox.mutateAsync({
        idempotency_key: `siswa-${siswa.nis}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        op: `siswa_surat_tugas:${p.kanal.toLowerCase()}`,
        request_hash: "n/a",
        status: "received",
        response: JSON.stringify({ siswa: siswa.nis, ...p }),
      });
      qc.invalidateQueries({ queryKey: ["resource:list", "Mobile Outbox Entry"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengirim pesan.");
    }
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Rata-rata Nilai" value={siswa.rataNilai} hint={`${siswa.nilai.length} mata pelajaran`} icon={<IconChart />} accent="brand" />
        <StatCard label="Kehadiran" value={`${siswa.persenKehadiran}%`} delta={{ value: "30 hari terakhir", trend: "flat" }} icon={<IconCheck />} accent="emerald" />
        <StatCard label="Saldo Tagihan" value={siswa.saldoTagihan > 0 ? formatRupiah(siswa.saldoTagihan) : "Lunas"} hint={`${tagihanTertunda} tagihan terbuka`} icon={<IconWallet />} accent="amber" />
        <StatCard label="Total Pembayaran" value={formatRupiah(siswa.pembayaran.reduce((s, p) => s + p.jumlah, 0))} hint={`${siswa.pembayaran.length} transaksi`} icon={<IconCalendar />} accent="violet" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <SectionCard
            title="Aktivitas Akademik Terbaru"
            description="Nilai dan pencapaian terkini"
            action={<Badge tone="brand" dot>Semester berjalan</Badge>}
          >
            <ul className="divide-y divide-border -mx-5 -my-2">
              {siswa.nilai.slice(0, 5).map((n) => (
                <li key={n.mapel} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand/10 text-brand">
                    <span className="h-4 w-4"><IconBook /></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-fg">{n.mapel}</div>
                    <div className="text-xs text-muted-fg">Guru: {n.guru}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">{((n.pengetahuan + n.keterampilan) / 2).toFixed(1)}</div>
                    <div className="text-xs"><Badge tone={n.predikat === "A" ? "success" : n.predikat === "B" ? "brand" : "warning"}>{n.predikat}</Badge></div>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Tagihan Terbuka" action={<Button variant="ghost" size="sm" onClick={() => onChangeTab("keuangan")}>Lihat semua</Button>} padded={false}>
            <ul className="divide-y divide-border">
              {siswa.tagihan.filter((t) => t.status !== "Lunas").map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
                    <span className="h-4 w-4"><IconWallet /></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-fg">{t.judul}</div>
                    <div className="text-xs text-muted-fg">Jatuh tempo {formatTanggal(t.jatuhTempo)} · {t.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">{formatRupiah(t.jumlah)}</div>
                    <Badge tone={TAGIHAN_TONE[t.status]} dot>{t.status}</Badge>
                  </div>
                </li>
              ))}
              {siswa.tagihan.filter((t) => t.status !== "Lunas").length === 0 ? (
                <li className="px-5 py-6 text-sm text-muted-fg text-center">Semua tagihan sudah lunas.</li>
              ) : null}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Wali" padded={false}>
            <ul className="divide-y divide-border">
              {siswa.wali.map((w, i) => (
                <li key={i} className="flex items-start gap-3 px-5 py-3.5">
                  <Avatar name={w.nama} size="sm" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-fg truncate">{w.nama}</div>
                    <div className="text-xs text-muted-fg">{w.hubungan} · {w.pekerjaan ?? "—"}</div>
                    {w.telepon ? <div className="text-xs text-muted-fg mt-0.5">{w.telepon}</div> : null}
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Aktivitas Terkini" padded={false}>
            <ul className="divide-y divide-border">
              {siswa.aktivitas.slice(0, 4).map((a, i) => (
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
              <Button variant="outline" size="sm" onClick={() => setOpenPay(true)}><span className="text-xs">Catat Pembayaran</span></Button>
              <Button variant="outline" size="sm" onClick={() => setOpenCatatan(true)}><span className="text-xs">Tambah Catatan</span></Button>
              <Button variant="outline" size="sm" onClick={() => setOpenTugas(true)}><span className="text-xs">Surat Tugas</span></Button>
              <Button variant="outline" size="sm" onClick={() => setOpenMutasi(true)}><span className="text-xs">Pindah Kelas</span></Button>
            </div>
          </SectionCard>
        </div>
      </div>
      <PembayaranModal
        open={openPay}
        onClose={() => setOpenPay(false)}
        tagihanList={siswa.tagihan}
        // TODO wire to "Pembayaran Siswa" once backend doctype confirmed
        onSubmit={(p) => console.info("[siswa] pembayaran (stub)", siswa.nis, p)}
      />
      <MutasiModal
        open={openMutasi}
        onClose={() => setOpenMutasi(false)}
        onSubmit={handleMutasi}
      />
      <CatatanModal
        open={openCatatan}
        onClose={() => setOpenCatatan(false)}
        // TODO wire to "Catatan Siswa" once backend doctype confirmed
        onSubmit={(c) => console.info("[siswa] catatan (stub)", siswa.nis, c)}
      />
      <PesanModal
        open={openTugas}
        onClose={() => setOpenTugas(false)}
        defaultKanal="Email"
        defaultPenerima={siswa.email ?? ""}
        onSubmit={handleSuratTugas}
      />
    </>
  );
}

function ProfilTab({ siswa }: { siswa: Siswa }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Identitas">
        <InfoGrid cols={3}>
          <InfoField label="NIS" icon={<IconId />} value={<span className="tabular-nums">{siswa.nis}</span>} />
          <InfoField label="NISN" value={<span className="tabular-nums">{siswa.nisn}</span>} />
          <InfoField label="NIK" value={<span className="tabular-nums">{siswa.nik}</span>} />
          <InfoField label="Nama Lengkap" value={siswa.namaLengkap} />
          <InfoField label="Nama Panggilan" value={siswa.namaPanggilan} />
          <InfoField label="Jenis Kelamin" value={siswa.jenisKelamin} />
          <InfoField label="Tempat, Tanggal Lahir" value={`${siswa.tempatLahir}, ${formatTanggal(siswa.tanggalLahir)}`} hint={`${umur(siswa.tanggalLahir)} tahun`} />
          <InfoField label="Agama" value={siswa.agama} />
          <InfoField label="Kewarganegaraan" value={siswa.kewarganegaraan} />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Data Dapodik">
        <InfoGrid cols={3}>
          <InfoField label="Kebutuhan Khusus" value={siswa.kebutuhanKhusus} />
          <InfoField label="Alat Transportasi" value={siswa.alatTransportasi} />
          <InfoField label="Jarak Rumah" value={siswa.jarakRumah} />
          <InfoField label="Waktu Tempuh" value={siswa.waktuTempuh} />
          <InfoField label="Penghasilan Ortu" value={siswa.penghasilanOrtu} />
          <InfoField label="Penerima KIP" value={siswa.penerimaKip ? <Badge tone="brand">Ya · {siswa.noKip}</Badge> : "Tidak"} />
          <InfoField label="Penerima KPS" value={siswa.penerimaKps ? "Ya" : "Tidak"} />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Administrasi Sekolah">
        <InfoGrid cols={3}>
          <InfoField label="Jenjang" value={siswa.jenjang} />
          <InfoField label="Tahun Masuk" value={siswa.tahunMasuk} />
          <InfoField label="Asal Sekolah" value={siswa.asalSekolah} />
          <InfoField label="Tanggal Diterima" value={siswa.tanggalDiterima ? formatTanggal(siswa.tanggalDiterima) : undefined} />
          <InfoField label="No. STTB" value={siswa.noSttb} />
          <InfoField label="Kelas / Rombel" value={`${siswa.kelas} (${siswa.rombel})`} />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Alamat">
        <InfoGrid cols={3}>
          <InfoField label="Alamat" icon={<IconMapPin />} value={siswa.alamat} className="sm:col-span-2 lg:col-span-2" />
          <InfoField label="RT/RW" value={`${siswa.rt}/${siswa.rw}`} />
          <InfoField label="Desa/Kelurahan" value={siswa.desa} />
          <InfoField label="Kecamatan" value={siswa.kecamatan} />
          <InfoField label="Kabupaten/Kota" value={siswa.kabupaten} />
          <InfoField label="Provinsi" value={siswa.provinsi} />
          <InfoField label="Kode Pos" value={siswa.kodePos} />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Kontak">
        <InfoGrid cols={2}>
          <InfoField label="Telepon" icon={<IconPhone />} value={siswa.telepon} />
          <InfoField label="Email" icon={<IconMail />} value={siswa.email} />
        </InfoGrid>
      </SectionCard>
    </div>
  );
}

function AkademikTab({ siswa }: { siswa: Siswa }) {
  const [openSemester, setOpenSemester] = useState(false);
  const [semester, setSemester] = useState<SemesterPick>({ tahunAjaran: "2025/2026", semester: "Genap" });
  const cols: Column<NilaiRow>[] = [
    { key: "mapel", header: "Mata Pelajaran", cell: (r) => <span className="font-medium">{r.mapel}</span> },
    { key: "guru", header: "Guru Pengampu", cell: (r) => <span className="text-muted-fg">{r.guru}</span> },
    { key: "p", header: "Pengetahuan", align: "right", cell: (r) => <span className="tabular-nums">{r.pengetahuan}</span> },
    { key: "k", header: "Keterampilan", align: "right", cell: (r) => <span className="tabular-nums">{r.keterampilan}</span> },
    { key: "rata", header: "Rata-rata", align: "right", cell: (r) => <span className="tabular-nums font-semibold">{((r.pengetahuan + r.keterampilan) / 2).toFixed(1)}</span> },
    { key: "pred", header: "Predikat", align: "center", cell: (r) => <Badge tone={r.predikat === "A" ? "success" : r.predikat === "B" ? "brand" : r.predikat === "C" ? "warning" : "danger"}>{r.predikat}</Badge> },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Rata-rata Semester" value={siswa.rataNilai} accent="brand" icon={<IconChart />} />
        <StatCard label="Peringkat Kelas" value="—" hint="Belum dihitung" accent="violet" icon={<IconGrad />} />
        <StatCard label="Mata Pelajaran" value={siswa.nilai.length} accent="emerald" icon={<IconBook />} />
      </div>
      <SectionCard
        title="Nilai per Mata Pelajaran"
        description={`Tahun Ajaran ${semester.tahunAjaran} · Semester ${semester.semester}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpenSemester(true)}>Pilih Semester</Button>
            <Button variant="outline" size="sm" onClick={() => stubAction(`Unduh Nilai ${siswa.nis} ${semester.tahunAjaran} ${semester.semester}`)}><span className="h-3.5 w-3.5 mr-1"><IconDownload /></span>Unduh</Button>
          </div>
        }
        padded={false}
      >
        <DataTable data={siswa.nilai} columns={cols} rowKey={(r) => r.mapel} />
      </SectionCard>
      <SemesterModal open={openSemester} onClose={() => setOpenSemester(false)} initial={semester} onPick={setSemester} />
    </div>
  );
}

function AbsensiTab({ siswa }: { siswa: Siswa }) {
  const [openPeriode, setOpenPeriode] = useState(false);
  const [openManual, setOpenManual] = useState(false);
  const [periode, setPeriode] = useState<PeriodeRange | null>(null);
  const cols: Column<AbsensiRow>[] = [
    { key: "tgl", header: "Tanggal", cell: (r) => <span className="tabular-nums">{formatTanggal(r.tanggal)}</span> },
    { key: "status", header: "Status", cell: (r) => <Badge tone={ABSEN_TONE[r.status]} dot>{r.status}</Badge> },
    { key: "ket", header: "Keterangan", cell: (r) => <span className="text-muted-fg">{r.keterangan ?? "—"}</span> },
    { key: "pencatat", header: "Pencatat", cell: (r) => r.pencatat },
  ];
  const filteredAbsensi = periode && (periode.from || periode.to)
    ? siswa.absensi.filter((a) => {
        if (periode.from && a.tanggal < periode.from) return false;
        if (periode.to && a.tanggal > periode.to) return false;
        return true;
      })
    : siswa.absensi;
  const counts = filteredAbsensi.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-5">
        <StatCard label="Hadir" value={counts.Hadir ?? 0} accent="emerald" icon={<IconCheck />} />
        <StatCard label="Sakit" value={counts.Sakit ?? 0} accent="amber" />
        <StatCard label="Izin" value={counts.Izin ?? 0} accent="brand" />
        <StatCard label="Terlambat" value={counts.Terlambat ?? 0} accent="amber" />
        <StatCard label="Alpa" value={counts.Alpa ?? 0} accent="rose" />
      </div>
      <SectionCard
        title="Riwayat Kehadiran"
        description={periode && (periode.from || periode.to) ? `Periode ${periode.from || "…"} → ${periode.to || "…"} · ${filteredAbsensi.length} entri` : `${siswa.absensi.length} entri`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpenPeriode(true)}>
              {periode && (periode.from || periode.to) ? "Periode aktif" : "Filter Periode"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setOpenManual(true)}>Catat Manual</Button>
          </div>
        }
        padded={false}
      >
        <DataTable data={filteredAbsensi} columns={cols} rowKey={(r) => r.tanggal} />
      </SectionCard>
      <PeriodeModal
        open={openPeriode}
        onClose={() => setOpenPeriode(false)}
        initial={periode ?? undefined}
        onApply={setPeriode}
        onClear={() => setPeriode(null)}
      />
      <AbsensiModal
        open={openManual}
        onClose={() => setOpenManual(false)}
        defaultPencatat="Wali Kelas"
        // TODO wire to "Absensi Siswa" once backend doctype confirmed
        onSubmit={(a) => console.info("[siswa] absensi manual (stub)", siswa.nis, a)}
      />
    </div>
  );
}

function KeuanganTab({ siswa }: { siswa: Siswa }) {
  const [openTag, setOpenTag] = useState(false);
  const [openPay, setOpenPay] = useState(false);
  const tagCols: Column<TagihanRow>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="tabular-nums text-muted-fg">{r.id}</span> },
    { key: "judul", header: "Tagihan", cell: (r) => <span className="font-medium">{r.judul}</span> },
    { key: "jt", header: "Jatuh Tempo", cell: (r) => formatTanggal(r.jatuhTempo) },
    { key: "jml", header: "Jumlah", align: "right", cell: (r) => <span className="tabular-nums">{formatRupiah(r.jumlah)}</span> },
    { key: "dibayar", header: "Dibayar", align: "right", cell: (r) => <span className="tabular-nums text-muted-fg">{formatRupiah(r.dibayar ?? 0)}</span> },
    { key: "status", header: "Status", cell: (r) => <Badge tone={TAGIHAN_TONE[r.status]} dot>{r.status}</Badge> },
  ];
  const payCols: Column<PembayaranRow>[] = [
    { key: "tgl", header: "Tanggal", cell: (r) => formatTanggal(r.tanggal) },
    { key: "id", header: "Ref", cell: (r) => <span className="tabular-nums text-muted-fg">{r.ref}</span> },
    { key: "metode", header: "Metode", cell: (r) => <Badge tone="neutral">{r.metode}</Badge> },
    { key: "jml", header: "Jumlah", align: "right", cell: (r) => <span className="tabular-nums">{formatRupiah(r.jumlah)}</span> },
    { key: "penerima", header: "Penerima", cell: (r) => r.penerima },
  ];

  const totalTagihan = siswa.tagihan.reduce((s, t) => s + t.jumlah, 0);
  const totalBayar = siswa.pembayaran.reduce((s, p) => s + p.jumlah, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Saldo Tagihan" value={siswa.saldoTagihan > 0 ? formatRupiah(siswa.saldoTagihan) : "Lunas"} accent="amber" icon={<IconWallet />} />
        <StatCard label="Total Ditagihkan" value={formatRupiah(totalTagihan)} accent="brand" />
        <StatCard label="Total Pembayaran" value={formatRupiah(totalBayar)} accent="emerald" icon={<IconCheck />} />
        <StatCard label="Tagihan Terbuka" value={siswa.tagihan.filter((t) => t.status !== "Lunas").length} accent="rose" />
      </div>
      <SectionCard
        title="Tagihan"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpenPay(true)}>Catat Pembayaran</Button>
            <Button size="sm" onClick={() => setOpenTag(true)}><span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Buat Tagihan</Button>
          </div>
        }
        padded={false}
      >
        <DataTable data={siswa.tagihan} columns={tagCols} rowKey={(r) => r.id} />
      </SectionCard>
      <SectionCard title="Riwayat Pembayaran" action={<Button variant="outline" size="sm" onClick={() => stubAction(`Unduh Riwayat Pembayaran ${siswa.nis}`)}><span className="h-3.5 w-3.5 mr-1"><IconDownload /></span>Unduh</Button>} padded={false}>
        <DataTable data={siswa.pembayaran} columns={payCols} rowKey={(r) => r.id} />
      </SectionCard>
      {/* TODO wire to "Tagihan Siswa" once backend doctype confirmed */}
      <TagihanModal open={openTag} onClose={() => setOpenTag(false)} onSubmit={(t) => console.info("[siswa] tagihan (stub)", siswa.nis, t)} />
      {/* TODO wire to "Pembayaran Siswa" once backend doctype confirmed */}
      <PembayaranModal open={openPay} onClose={() => setOpenPay(false)} tagihanList={siswa.tagihan} onSubmit={(p) => console.info("[siswa] pembayaran (stub)", siswa.nis, p)} />
    </div>
  );
}

function WaliTab({ siswa }: { siswa: Siswa }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const createWali = useResourceCreate("Wali Siswa");

  const handleWali = async (w: WaliRow) => {
    try {
      await createWali.mutateAsync({
        hubungan: w.hubungan,
        nama: w.nama,
        nik_ortu: w.nik ?? "",
        pendidikan: w.pendidikan ?? "",
        pekerjaan: w.pekerjaan ?? "",
        no_hp: w.telepon ?? "",
        email: w.email ?? "",
      });
      qc.invalidateQueries({ queryKey: ["resource:list", "Wali Siswa"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan wali.");
    }
  };

  const cols: Column<WaliRow>[] = [
    { key: "hub", header: "Hubungan", cell: (r) => <Badge tone="brand">{r.hubungan}</Badge> },
    { key: "nama", header: "Nama", cell: (r) => <span className="font-medium">{r.nama}</span> },
    { key: "nik", header: "NIK", cell: (r) => <span className="tabular-nums text-muted-fg">{r.nik ?? "—"}</span> },
    { key: "pekerjaan", header: "Pekerjaan", cell: (r) => r.pekerjaan ?? "—" },
    { key: "penghasilan", header: "Penghasilan", cell: (r) => r.penghasilan ?? "—" },
    { key: "pendidikan", header: "Pendidikan", cell: (r) => r.pendidikan ?? "—" },
    { key: "telp", header: "Telepon", cell: (r) => r.telepon ?? "—" },
  ];
  return (
    <SectionCard
      title="Data Wali"
      description="Ayah, Ibu, atau Wali resmi"
      action={<Button size="sm" onClick={() => setOpen(true)}><span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Tambah Wali</Button>}
      padded={false}
    >
      <DataTable data={siswa.wali} columns={cols} rowKey={(r) => `${r.hubungan}-${r.nama}`} />
      <WaliModal open={open} onClose={() => setOpen(false)} onSubmit={handleWali} />
    </SectionCard>
  );
}

function MutasiTab({ siswa }: { siswa: Siswa }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const createMutasi = useResourceCreate("Mutasi Siswa");

  const handleMutasi = async (m: MutasiRow) => {
    try {
      await createMutasi.mutateAsync({
        siswa: siswa.nis,
        jenis_mutasi: m.jenis,
        tanggal_mutasi: m.tanggal,
        rombel_asal: m.dari ?? "",
        rombel_tujuan: m.ke ?? "",
        alasan_pindah: m.keterangan ?? "",
      });
      qc.invalidateQueries({ queryKey: ["resource:list", "Mutasi Siswa"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mencatat mutasi.");
    }
  };

  const cols: Column<MutasiRow>[] = [
    { key: "tgl", header: "Tanggal", cell: (r) => formatTanggal(r.tanggal) },
    { key: "jenis", header: "Jenis", cell: (r) => <Badge tone="brand">{r.jenis}</Badge> },
    { key: "dari", header: "Dari", cell: (r) => r.dari ?? "—" },
    { key: "ke", header: "Ke", cell: (r) => r.ke ?? "—" },
    { key: "ket", header: "Keterangan", cell: (r) => <span className="text-muted-fg">{r.keterangan ?? "—"}</span> },
  ];
  return (
    <div className="space-y-6">
      <SectionCard title="Riwayat Mutasi" action={<Button size="sm" onClick={() => setOpen(true)}>Catat Mutasi</Button>} padded={false}>
        <DataTable data={siswa.mutasi} columns={cols} rowKey={(r) => `${r.tanggal}-${r.jenis}`} />
      </SectionCard>
      <MutasiModal open={open} onClose={() => setOpen(false)} onSubmit={handleMutasi} />
      <SectionCard title="Transisi Status">
        <p className="text-sm text-muted-fg">
          Status saat ini: <Badge tone={STATUS_TONE[siswa.status]} dot>{siswa.status}</Badge>. Transisi
          status dipicu otomatis oleh Pendaftaran Siswa, Mutasi Siswa, atau Kelulusan Siswa.
        </p>
      </SectionCard>
    </div>
  );
}

function DokumenTab({ siswa }: { siswa: Siswa }) {
  const [open, setOpen] = useState(false);
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
    { key: "aksi", header: "", align: "right", cell: (r) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="sm" onClick={() => openOrAlert(r.url, `Pratinjau "${r.nama}" belum tersedia.`)}>Lihat</Button>
        <Button variant="ghost" size="sm" onClick={() => openOrAlert(r.url, `Unduhan "${r.nama}" belum tersedia.`)}>Unduh</Button>
      </div>
    ) },
  ];
  return (
    <SectionCard title="Dokumen" action={<Button size="sm" onClick={() => setOpen(true)}><span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Unggah</Button>} padded={false}>
      <DataTable data={siswa.dokumen} columns={cols} rowKey={(r) => r.nama} />
      {/* TODO wire to "Dokumen Siswa" once backend doctype confirmed */}
      <DokumenModal open={open} onClose={() => setOpen(false)} onSubmit={(d) => console.info("[siswa] dokumen (stub)", siswa.nis, d)} />
    </SectionCard>
  );
}

function AktivitasTab({ siswa }: { siswa: Siswa }) {
  return (
    <SectionCard title="Linimasa Aktivitas" description="Riwayat perubahan dan kejadian terkait siswa" padded={false}>
      {siswa.aktivitas.length === 0 ? (
        <EmptyState title="Belum ada aktivitas" />
      ) : (
        <ul className="divide-y divide-border">
          {siswa.aktivitas.map((a: AktivitasRow, i) => (
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
  { key: "akademik", label: "Akademik", icon: <IconBook /> },
  { key: "absensi", label: "Absensi", icon: <IconCheck /> },
  { key: "keuangan", label: "Keuangan", icon: <IconWallet /> },
  { key: "wali", label: "Wali", icon: <IconUsers /> },
  { key: "mutasi", label: "Mutasi", icon: <IconGrad /> },
  { key: "dokumen", label: "Dokumen", icon: <IconFile /> },
  { key: "aktivitas", label: "Aktivitas", icon: <IconClock /> },
];

const VALID_TABS = new Set<TabKey>([
  "ringkasan","profil","akademik","absensi","keuangan","wali","mutasi","dokumen","aktivitas",
]);

// Backend Siswa doctype shape (snake_case). Only fields rendered on this
// page are listed; nested child tables (nilai, absensi, tagihan, wali,
// mutasi, dokumen) need their own queries in a follow-up sprint.
type SiswaDoc = {
  name: string;
  nis?: string;
  nisn?: string;
  nik?: string;
  nama_lengkap?: string;
  nama_panggilan?: string;
  jenis_kelamin?: "Laki-laki" | "Perempuan";
  tempat_lahir?: string;
  tanggal_lahir?: string;
  agama?: string;
  kewarganegaraan?: "WNI" | "WNA";
  status?: string;
  jenjang?: string;
  tahun_masuk?: string;
  asal_sekolah?: string;
  kebutuhan_khusus?: string;
};

function SiswaDetailPage() {
  const { nis } = Route.useParams();
  const search = Route.useSearch();
  // Primary lookup from backend; nested arrays (nilai, absensi, tagihan, wali,
  // mutasi, dokumen) still come from mock until each child-table endpoint
  // gets its own useResourceList wiring.
  const docQ = useResourceDoc<SiswaDoc>("Siswa", nis);
  const mock = findSiswa(nis);
  // Merge: real top-level fields override mock; nested arrays fall back.
  const siswa: Siswa | undefined = (() => {
    if (!mock) return undefined;
    const d = docQ.data;
    if (!d) return mock;
    return {
      ...mock,
      nis: d.nis ?? d.name ?? mock.nis,
      nisn: d.nisn ?? mock.nisn,
      nik: d.nik ?? mock.nik,
      namaLengkap: d.nama_lengkap ?? mock.namaLengkap,
      namaPanggilan: d.nama_panggilan ?? mock.namaPanggilan,
      jenisKelamin: d.jenis_kelamin ?? mock.jenisKelamin,
      tempatLahir: d.tempat_lahir ?? mock.tempatLahir,
      tanggalLahir: d.tanggal_lahir ?? mock.tanggalLahir,
      agama: (d.agama as Siswa["agama"]) ?? mock.agama,
      kewarganegaraan: d.kewarganegaraan ?? mock.kewarganegaraan,
      status: (d.status as Siswa["status"]) ?? mock.status,
      jenjang: d.jenjang ?? mock.jenjang,
      tahunMasuk: d.tahun_masuk ?? mock.tahunMasuk,
      asalSekolah: d.asal_sekolah ?? mock.asalSekolah,
      kebutuhanKhusus: d.kebutuhan_khusus ?? mock.kebutuhanKhusus,
    };
  })();
  const navigate = useNavigate();
  const [openPesan, setOpenPesan] = useState(false);
  const tab: TabKey = VALID_TABS.has(search.tab as TabKey) ? (search.tab as TabKey) : "ringkasan";
  const setTab = (next: TabKey) => {
    navigate({ to: "/siswa/$nis", params: { nis }, search: { tab: next === "ringkasan" ? undefined : next } });
  };

  if (!siswa) {
    throw notFound();
  }

  const counts: Partial<Record<TabKey, number>> = {
    akademik: siswa.nilai.length,
    absensi: siswa.absensi.length,
    keuangan: siswa.tagihan.filter((t) => t.status !== "Lunas").length,
    wali: siswa.wali.length,
    mutasi: siswa.mutasi.length,
    dokumen: siswa.dokumen.length,
    aktivitas: siswa.aktivitas.length,
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
      case "ringkasan": return <RingkasanTab siswa={siswa} onChangeTab={setTab} />;
      case "profil": return <ProfilTab siswa={siswa} />;
      case "akademik": return <AkademikTab siswa={siswa} />;
      case "absensi": return <AbsensiTab siswa={siswa} />;
      case "keuangan": return <KeuanganTab siswa={siswa} />;
      case "wali": return <WaliTab siswa={siswa} />;
      case "mutasi": return <MutasiTab siswa={siswa} />;
      case "dokumen": return <DokumenTab siswa={siswa} />;
      case "aktivitas": return <AktivitasTab siswa={siswa} />;
    }
  };

  return (
    <DetailPageTemplate
      header={
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: "Dashboard", render: ({ className, children }) => <Link to="/" className={className}>{children}</Link> },
              { label: "Siswa", render: ({ className, children }) => <Link to="/siswa" className={className}>{children}</Link> },
              { label: siswa.namaLengkap },
            ]}
          />
          <PageHeader
            eyebrow="Detail Siswa"
            title={siswa.namaLengkap}
            description={`NIS ${siswa.nis} · ${siswa.kelas} · ${siswa.status}`}
            actions={
              <Button variant="outline" onClick={() => navigate({ to: "/siswa" })}>
                <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
                Kembali ke daftar
              </Button>
            }
          />
        </div>
      }
      hero={
        <>
          <Hero
            siswa={siswa}
            onEdit={() => navigate({ to: "/siswa/$nis/edit", params: { nis } })}
            onMessage={() => setOpenPesan(true)}
            onPrintCard={() => printDocument({
              title: `Kartu Pelajar - ${siswa.namaLengkap}`,
              heading: "Kartu Pelajar",
              subheading: `${siswa.jenjang} · ${siswa.kelas} · ${siswa.rombel}`,
              rows: [
                { label: "Nama", value: siswa.namaLengkap },
                { label: "NIS", value: siswa.nis },
                { label: "NISN", value: siswa.nisn },
                { label: "Tempat, Tgl Lahir", value: `${siswa.tempatLahir}, ${siswa.tanggalLahir}` },
                { label: "Jenis Kelamin", value: siswa.jenisKelamin },
                { label: "Agama", value: siswa.agama },
                { label: "Alamat", value: [siswa.alamat, siswa.kecamatan, siswa.kabupaten, siswa.provinsi].filter(Boolean).join(", ") },
              ],
            })}
            onDownloadRapor={() => printDocument({
              title: `Rapor - ${siswa.namaLengkap}`,
              heading: `Rapor Siswa`,
              subheading: `${siswa.namaLengkap} · NIS ${siswa.nis} · ${siswa.kelas}`,
              rows: [
                { label: "Rata-rata", value: String(siswa.rataNilai) },
                { label: "Kehadiran", value: `${siswa.persenKehadiran}%` },
              ],
              table: {
                header: ["Mata Pelajaran", "Guru", "Pengetahuan", "Keterampilan", "Rata-rata", "Predikat"],
                rows: siswa.nilai.map((n) => [
                  n.mapel,
                  n.guru,
                  String(n.pengetahuan),
                  String(n.keterampilan),
                  ((n.pengetahuan + n.keterampilan) / 2).toFixed(1),
                  n.predikat,
                ]),
              },
            })}
            onMore={() => stubAction("Menu aksi lainnya")}
          />
          <PesanModal
            open={openPesan}
            onClose={() => setOpenPesan(false)}
            defaultKanal="WhatsApp"
            defaultPenerima={siswa.telepon ?? ""}
            onSubmit={(p) => console.info("[siswa] pesan", siswa.nis, p)}
          />
        </>
      }
      tabs={<Tabs items={tabItems} />}
      primary={renderTab()}
    />
  );
}

type SearchParams = { tab?: TabKey | undefined };

export const Route = createFileRoute("/siswa/$nis")({
  component: SiswaDetailPage,
  validateSearch: (raw: Record<string, unknown>): SearchParams => {
    const t = typeof raw.tab === "string" ? raw.tab : undefined;
    return { tab: t && VALID_TABS.has(t as TabKey) ? (t as TabKey) : undefined };
  },
  notFoundComponent: () => (
    <div className="py-16">
      <EmptyState
        title="Siswa tidak ditemukan"
        description="NIS yang diminta tidak ada di sistem. Periksa kembali atau kembali ke daftar siswa."
        action={
          <Link to="/siswa" className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
            <span className="h-4 w-4"><IconArrowLeft /></span> Kembali ke daftar
          </Link>
        }
      />
    </div>
  ),
});
