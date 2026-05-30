import { createFileRoute, Link, notFound, useNavigate, useParams} from "@tanstack/react-router";
import { useResourceDoc, useResourceList } from "@sekolahpro/api-client";
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
  IconPhone,
  IconPlus,
  IconPrint,
  IconUsers,
  IconWallet,
  type TabItem,
} from "@sekolahpro/ui";
import { useState } from "react";
import { downloadCsv, openOrAlert, printDocument, stubAction } from "../lib/stub";
import { PpdbActionPanel } from "../components/ppdb-extra/PpdbActionPanel";
import {
  EditWaliModal,
  JadwalWawancaraModal,
  UploadDokumenModal,
  openMailto,
  openWa,
} from "../components/ppdb-extra/PpdbDetailModals";
import {
  findPendaftar,
  formatRupiah,
  formatTanggal,
  umur,
  type AktivitasRow,
  type NilaiRaporRow,
  type PembayaranPpdbRow,
  type Pendaftar,
  type StatusPendaftaran,
  type TahapanRow,
  type WaliPpdbRow,
} from "../data/ppdb";

type TabKey = "ringkasan" | "profil" | "wali" | "dokumen" | "tahapan" | "akademik" | "wawancara" | "pembayaran" | "aktivitas";

// Action handlers terikat ke konteks detail page (pendaftaran + calon).
// Tabs konsumsi via prop sehingga UI bisa di-test tanpa membuka detail page.
interface PpdbActions {
  onKirimPesan: () => void;
  onKirimWa: () => void;
  onCetakKartu: () => void;
  onUnduhBerkas: () => void;
  onEditProfil: () => void;
  onTambahWali: () => void;
  onUnggahDokumen: () => void;
  onCatatPembayaran: () => void;
  onUnduhBuktiBayar: () => void;
  onJadwalWawancara: () => void;
  onUnduhRapor: () => void;
}

const STATUS_TONE: Record<StatusPendaftaran, "success" | "brand" | "neutral" | "warning" | "danger"> = {
  Diterima: "success",
  Lulus: "success",
  Verifikasi: "brand",
  Tes: "brand",
  "Daftar Ulang": "brand",
  "Tidak Lulus": "danger",
  "Mengundurkan Diri": "danger",
  Draft: "neutral",
  Terkirim: "warning",
};

const DOKUMEN_TONE = {
  Diterima: "success",
  Belum: "warning",
  Ditolak: "danger",
} as const;

const TAHAPAN_TONE = {
  Selesai: "success",
  Berjalan: "brand",
  Belum: "neutral",
} as const;

const PEMBAYARAN_TONE = {
  Lunas: "success",
  Tertunda: "warning",
  Cicilan: "brand",
} as const;

function persenBayar(p: Pendaftar): number {
  return p.totalBiaya === 0 ? 0 : Math.min(100, Math.round((p.totalDibayar / p.totalBiaya) * 100));
}

function persenTahapan(p: Pendaftar): number {
  const selesai = p.tahapan.filter((t) => t.status === "Selesai").length;
  return Math.round((selesai / p.tahapan.length) * 100);
}

function Hero({ pendaftar, actions }: { pendaftar: Pendaftar; actions: PpdbActions }) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-brand/5 via-bg to-violet-500/5 p-6 shadow-sm">
      <div className="flex flex-wrap items-start gap-5">
        <Avatar name={pendaftar.namaLengkap} src={pendaftar.fotoUrl ?? null} size="lg" className="!h-20 !w-20 !text-xl" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold text-fg truncate">{pendaftar.namaLengkap}</h2>
            <Badge tone={STATUS_TONE[pendaftar.statusPendaftaran]} dot>{pendaftar.statusPendaftaran}</Badge>
            <Badge tone="brand">{pendaftar.jalur}</Badge>
          </div>
          <div className="mt-1 text-sm text-muted-fg">
            <span className="tabular-nums">{pendaftar.noPendaftaran}</span>
            <span className="mx-2">·</span>
            <span>{pendaftar.jenjangTujuan}</span>
            <span className="mx-2">·</span>
            <span>TA {pendaftar.tahunAjaran}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-fg">
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconCake /></span>{formatTanggal(pendaftar.tanggalLahir)} ({umur(pendaftar.tanggalLahir)} th)</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconMail /></span>{pendaftar.email}</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconPhone /></span>{pendaftar.telepon}</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconMapPin /></span>{pendaftar.kecamatan}, {pendaftar.kabupaten}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={actions.onKirimPesan}>
            <span className="h-4 w-4 mr-1.5"><IconMail /></span>Email
          </Button>
          <Button variant="outline" size="sm" onClick={actions.onKirimWa}>
            <span className="h-4 w-4 mr-1.5"><IconChat /></span>WhatsApp
          </Button>
          <Button variant="outline" size="sm" onClick={actions.onCetakKartu}>
            <span className="h-4 w-4 mr-1.5"><IconPrint /></span>Cetak Kartu
          </Button>
          <Button variant="outline" size="sm" onClick={actions.onUnduhBerkas}>
            <span className="h-4 w-4 mr-1.5"><IconDownload /></span>Unduh CSV
          </Button>
          <Button size="sm" onClick={actions.onEditProfil}>
            <span className="h-4 w-4 mr-1.5"><IconEdit /></span>Edit
          </Button>
        </div>
      </div>
    </div>
  );
}

function RingkasanTab({ pendaftar, onChangeTab }: { pendaftar: Pendaftar; onChangeTab: (k: TabKey) => void }) {
  const currentStep = pendaftar.tahapan.find((t) => t.status === "Berjalan") ?? pendaftar.tahapan[pendaftar.tahapan.length - 1]!;
  const pctBayar = persenBayar(pendaftar);
  const pctTahapan = persenTahapan(pendaftar);
  const sisa = Math.max(0, pendaftar.totalBiaya - pendaftar.totalDibayar);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Skor Tes" value={pendaftar.skorTes ?? "—"} hint={pendaftar.skorTes ? "skala 0-100" : "belum tes"} icon={<IconChart />} accent="brand" />
        <StatCard label="Skor Wawancara" value={pendaftar.skorWawancara ?? "—"} hint={pendaftar.skorWawancara ? "skala 0-100" : "belum wawancara"} icon={<IconChat />} accent="violet" />
        <StatCard label="Pembayaran" value={`${pctBayar}%`} hint={formatRupiah(pendaftar.totalDibayar)} icon={<IconWallet />} accent="amber" />
        <StatCard label="Tahapan" value={`${pctTahapan}%`} hint={`${currentStep.tahap}`} icon={<IconCheck />} accent="emerald" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <SectionCard
            title="Tahapan Pendaftaran"
            description="Status setiap tahap PPDB"
            action={<Button variant="ghost" size="sm" onClick={() => onChangeTab("tahapan")}>Lihat detail</Button>}
            padded={false}
          >
            <ol className="divide-y divide-border">
              {pendaftar.tahapan.map((t, i) => {
                const active = t.status === "Berjalan";
                return (
                  <li key={i} className={`flex items-start gap-3 px-5 py-3.5 ${active ? "bg-brand/5" : ""}`}>
                    <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${t.status === "Selesai" ? "bg-emerald-500/10 text-emerald-600" : t.status === "Berjalan" ? "bg-brand/10 text-brand" : "bg-muted text-muted-fg"}`}>
                      <span className="h-4 w-4">{t.status === "Selesai" ? <IconCheck /> : <IconClock />}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-fg">{t.tahap}</div>
                      <div className="text-xs text-muted-fg mt-0.5">
                        {formatTanggal(t.tanggal)}{t.petugas ? ` · ${t.petugas}` : ""}
                      </div>
                    </div>
                    <Badge tone={TAHAPAN_TONE[t.status]} dot>{t.status}</Badge>
                  </li>
                );
              })}
            </ol>
          </SectionCard>

          <SectionCard
            title="Status Dokumen"
            description="Kelengkapan berkas pendaftaran"
            action={<Button variant="ghost" size="sm" onClick={() => onChangeTab("dokumen")}>Lihat semua</Button>}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {pendaftar.dokumen.map((d) => (
                <div key={d.nama} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
                  <span className="h-8 w-8 rounded-md bg-muted inline-flex items-center justify-center text-muted-fg"><span className="h-4 w-4"><IconFile /></span></span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-fg truncate">{d.nama}</div>
                    <div className="text-xs text-muted-fg">{d.tipe}</div>
                  </div>
                  <Badge tone={DOKUMEN_TONE[d.status]} dot>{d.status}</Badge>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Wali" padded={false}>
            <ul className="divide-y divide-border">
              {pendaftar.wali.map((w, i) => (
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
              {pendaftar.aktivitas.slice(0, 4).map((a, i) => (
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

          <SectionCard title="Alur Pendaftaran" description="Aksi sesuai status terkini.">
            <PpdbActionPanel
              pendaftaranName={pendaftar.noPendaftaran}
              currentStatus={pendaftar.statusPendaftaran}
            />
            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-fg">
              Sisa pembayaran: <span className="font-medium text-fg tabular-nums">{formatRupiah(sisa)}</span>
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}

function ProfilTab({ pendaftar }: { pendaftar: Pendaftar }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Identitas">
        <InfoGrid cols={3}>
          <InfoField label="No. Pendaftaran" icon={<IconId />} value={<span className="tabular-nums">{pendaftar.noPendaftaran}</span>} />
          <InfoField label="NISN" value={<span className="tabular-nums">{pendaftar.nisn}</span>} />
          <InfoField label="NIK" value={<span className="tabular-nums">{pendaftar.nik}</span>} />
          <InfoField label="Nama Lengkap" value={pendaftar.namaLengkap} />
          <InfoField label="Jenis Kelamin" value={pendaftar.jenisKelamin} />
          <InfoField label="Tempat, Tanggal Lahir" value={`${pendaftar.tempatLahir}, ${formatTanggal(pendaftar.tanggalLahir)}`} hint={`${umur(pendaftar.tanggalLahir)} tahun`} />
          <InfoField label="Agama" value={pendaftar.agama} />
          <InfoField label="Kewarganegaraan" value={pendaftar.kewarganegaraan} />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Asal Sekolah & Jalur">
        <InfoGrid cols={3}>
          <InfoField label="Asal Sekolah" value={pendaftar.asalSekolah} />
          <InfoField label="Nilai Rata-rata" value={pendaftar.nilaiRataRata !== undefined ? pendaftar.nilaiRataRata.toFixed(1) : undefined} />
          <InfoField label="Jarak ke Sekolah" value={pendaftar.jarakKeSekolah} />
          <InfoField label="Jalur Pendaftaran" value={<Badge tone="brand">{pendaftar.jalur}</Badge>} />
          <InfoField label="Jenjang Tujuan" value={pendaftar.jenjangTujuan} />
          <InfoField label="Tahun Ajaran" value={pendaftar.tahunAjaran} />
          {pendaftar.rankingZonasi !== undefined ? (
            <InfoField label="Ranking Zonasi" value={<span className="tabular-nums">#{pendaftar.rankingZonasi}</span>} />
          ) : null}
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Alamat">
        <InfoGrid cols={3}>
          <InfoField label="Alamat" icon={<IconMapPin />} value={pendaftar.alamat} className="sm:col-span-2 lg:col-span-2" />
          <InfoField label="RT/RW" value={`${pendaftar.rt}/${pendaftar.rw}`} />
          <InfoField label="Desa/Kelurahan" value={pendaftar.desa} />
          <InfoField label="Kecamatan" value={pendaftar.kecamatan} />
          <InfoField label="Kabupaten/Kota" value={pendaftar.kabupaten} />
          <InfoField label="Provinsi" value={pendaftar.provinsi} />
          <InfoField label="Kode Pos" value={pendaftar.kodePos} />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Kontak">
        <InfoGrid cols={2}>
          <InfoField label="Telepon" icon={<IconPhone />} value={pendaftar.telepon} />
          <InfoField label="Email" icon={<IconMail />} value={pendaftar.email} />
        </InfoGrid>
      </SectionCard>
    </div>
  );
}

function WaliTab({ pendaftar, actions }: { pendaftar: Pendaftar; actions: PpdbActions }) {
  const cols: Column<WaliPpdbRow>[] = [
    { key: "hub", header: "Hubungan", cell: (r) => <Badge tone="brand">{r.hubungan}</Badge> },
    { key: "nama", header: "Nama", cell: (r) => <span className="font-medium">{r.nama}</span> },
    { key: "nik", header: "NIK", cell: (r) => <span className="tabular-nums text-muted-fg">{r.nik ?? "—"}</span> },
    { key: "pekerjaan", header: "Pekerjaan", cell: (r) => r.pekerjaan ?? "—" },
    { key: "penghasilan", header: "Penghasilan", cell: (r) => r.penghasilan ?? "—" },
    { key: "telp", header: "Telepon", cell: (r) => r.telepon ?? "—" },
    { key: "email", header: "Email", cell: (r) => r.email ?? "—" },
  ];
  return (
    <SectionCard
      title="Data Wali"
      description="Ayah, Ibu, atau Wali resmi"
      action={<Button size="sm" onClick={actions.onTambahWali}><span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Edit Wali</Button>}
      padded={false}
    >
      <DataTable data={pendaftar.wali} columns={cols} rowKey={(r) => `${r.hubungan}-${r.nama}`} />
    </SectionCard>
  );
}

type DokumenPpdbDoc = {
  name: string;
  jenis?: string;
  status?: string;
  catatan?: string;
  berkas?: string;
  uploaded_by?: string;
  modified?: string;
};

function DokumenTab({ pendaftar, actions }: { pendaftar: Pendaftar; actions: PpdbActions }) {
  // Live data dari doctype Dokumen PPDB (gantikan mock fallback).
  const q = useResourceList<DokumenPpdbDoc>("Dokumen PPDB", {
    fields: ["name", "jenis", "status", "catatan", "berkas", "uploaded_by", "modified"],
    filters: [["pendaftaran_ppdb", "=", pendaftar.noPendaftaran]],
    order_by: "`modified` desc",
    limit_page_length: 100,
  });
  const rows = q.data ?? [];

  const statTone = (s: string | undefined): "success" | "warning" | "danger" | "neutral" => {
    if (s === "Diterima") return "success";
    if (s === "Ditolak") return "danger";
    if (s === "Belum") return "warning";
    return "neutral";
  };

  const cols: Column<DokumenPpdbDoc>[] = [
    {
      key: "jenis",
      header: "Dokumen",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <span className="h-8 w-8 rounded-md bg-muted inline-flex items-center justify-center text-muted-fg">
            <span className="h-4 w-4"><IconFile /></span>
          </span>
          <span className="font-medium">{r.jenis ?? "—"}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <Badge tone={statTone(r.status)} dot>{r.status ?? "—"}</Badge>,
    },
    { key: "catatan", header: "Catatan", cell: (r) => <span className="text-muted-fg">{r.catatan ?? "—"}</span> },
    {
      key: "berkas",
      header: "Berkas",
      cell: (r) =>
        r.berkas ? (
          <a href={r.berkas} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline text-xs">
            Buka
          </a>
        ) : (
          "—"
        ),
    },
    { key: "modified", header: "Diunggah", cell: (r) => r.modified ? formatTanggal(r.modified) : "—" },
  ];

  return (
    <SectionCard
      title="Dokumen Pendaftaran"
      description={q.isLoading ? "Memuat..." : `${rows.length} berkas`}
      action={
        <Button size="sm" onClick={actions.onUnggahDokumen}>
          <span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Unggah Dokumen
        </Button>
      }
      padded={false}
    >
      {rows.length === 0 ? (
        <EmptyState title={q.isLoading ? "Memuat..." : "Belum ada dokumen"} description="Unggah berkas pendukung (akta, KK, rapor, dst.)." />
      ) : (
        <DataTable data={rows} columns={cols} rowKey={(r) => r.name} />
      )}
    </SectionCard>
  );
}

type TahapanLogDoc = {
  name: string;
  tahap?: string;
  status?: "Menunggu" | "Berjalan" | "Selesai" | "Dibatalkan";
  tanggal?: string;
  petugas?: string;
  catatan?: string;
};

function TahapanTab({ pendaftar }: { pendaftar: Pendaftar }) {
  // Live data dari Tahapan PPDB Log; fallback ke mock saat doctype kosong.
  const q = useResourceList<TahapanLogDoc>("Tahapan PPDB Log", {
    fields: ["name", "tahap", "status", "tanggal", "petugas", "catatan"],
    filters: [["pendaftaran_ppdb", "=", pendaftar.noPendaftaran]],
    order_by: "`tanggal` asc",
    limit_page_length: 100,
  });
  const live = q.data ?? [];
  const rows: TahapanRow[] = live.length > 0
    ? live.map((r): TahapanRow => ({
        tahap: (r.tahap ?? "—") as TahapanRow["tahap"],
        status: (r.status === "Selesai" || r.status === "Berjalan" ? r.status : "Belum") as TahapanRow["status"],
        tanggal: r.tanggal ?? "",
        petugas: r.petugas ?? "",
        catatan: r.catatan ?? "",
      }))
    : pendaftar.tahapan;
  return (
    <SectionCard
      title="Linimasa Tahapan PPDB"
      description={q.isLoading ? "Memuat..." : "Status dan catatan setiap tahap"}
      padded={false}
    >
      <ol className="relative">
        {rows.map((t: TahapanRow, i) => (
          <li key={i} className="flex gap-4 px-5 py-4 border-b border-border last:border-b-0">
            <div className="flex flex-col items-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${t.status === "Selesai" ? "bg-emerald-500/10 text-emerald-600" : t.status === "Berjalan" ? "bg-brand/10 text-brand" : "bg-muted text-muted-fg"}`}>
                <span className="h-4 w-4">{t.status === "Selesai" ? <IconCheck /> : <IconClock />}</span>
              </div>
              {i < rows.length - 1 ? (
                <div className="mt-1 flex-1 w-px bg-border" />
              ) : null}
            </div>
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-fg">{t.tahap}</div>
                <Badge tone={TAHAPAN_TONE[t.status]} dot>{t.status}</Badge>
              </div>
              <div className="text-xs text-muted-fg mt-1 inline-flex items-center gap-1">
                <span className="h-3 w-3"><IconCalendar /></span>{formatTanggal(t.tanggal)}
                {t.petugas ? <><span className="mx-1">·</span>{t.petugas}</> : null}
              </div>
              {t.catatan ? <div className="text-sm text-muted-fg mt-2">{t.catatan}</div> : null}
            </div>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}

type RaporPpdbDoc = {
  name: string;
  calon_siswa?: string;
  nilai_rata_rata?: number;
  nilai?: Array<{ semester?: string; kelas?: string; mapel?: string; nilai?: number }>;
};

type HasilTesDoc = {
  name: string;
  jenis_tes?: string;
  skor?: number;
  tanggal_tes?: string;
};

function AkademikTab({ pendaftar, actions, calonSiswaName }: { pendaftar: Pendaftar; actions: PpdbActions; calonSiswaName?: string | undefined }) {
  // Live: Rapor PPDB by calon_siswa + Hasil Tes Akademik PPDB by pendaftaran.
  const raporQ = useResourceList<RaporPpdbDoc>("Rapor PPDB", {
    fields: ["name", "calon_siswa", "nilai_rata_rata"],
    filters: calonSiswaName ? [["calon_siswa", "=", calonSiswaName]] : [["name", "=", "__none__"]],
    limit_page_length: 1,
  });
  const tesQ = useResourceList<HasilTesDoc>("Hasil Tes Akademik PPDB", {
    fields: ["name", "jenis_tes", "skor", "tanggal_tes"],
    filters: [["pendaftaran_ppdb", "=", pendaftar.noPendaftaran]],
    order_by: "`tanggal_tes` desc",
    limit_page_length: 1,
  });
  const raporDoc = raporQ.data?.[0];
  const tesDoc = tesQ.data?.[0];
  const liveRapor: NilaiRaporRow[] = raporDoc?.nilai?.map((r) => ({
    semester: r.semester ?? "—",
    kelas: r.kelas ?? "—",
    mapel: r.mapel ?? "—",
    nilai: r.nilai ?? 0,
  })) ?? [];
  // Fallback ke mock saat live kosong (data belum diisi panitia).
  const rapor: NilaiRaporRow[] = liveRapor.length > 0 ? liveRapor : pendaftar.raporSmp;
  const rataRata = raporDoc?.nilai_rata_rata ?? pendaftar.nilaiRataRata;
  const skorTes = tesDoc?.skor ?? pendaftar.skorTes;

  const cols: Column<NilaiRaporRow>[] = [
    { key: "semester", header: "Semester", cell: (r) => <span className="font-medium">{r.semester}</span> },
    { key: "kelas", header: "Kelas", cell: (r) => r.kelas },
    { key: "mapel", header: "Mata Pelajaran", cell: (r) => r.mapel },
    { key: "nilai", header: "Nilai", align: "right", cell: (r) => <span className="tabular-nums font-semibold">{r.nilai}</span> },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Nilai Rata-rata SMP" value={rataRata?.toFixed(1) ?? "—"} accent="brand" icon={<IconChart />} />
        <StatCard label="Skor Tes Akademik" value={skorTes ?? "—"} hint="skala 0-100" accent="violet" icon={<IconGrad />} />
        <StatCard label="Jumlah Mata Pelajaran" value={rapor.length} accent="emerald" icon={<IconBook />} />
      </div>
      <SectionCard
        title="Rapor SMP"
        description={rapor.length === 0 ? "Tidak ada data rapor untuk jenjang ini" : "Riwayat nilai 5 semester terakhir"}
        action={
          <Button variant="outline" size="sm" onClick={actions.onUnduhRapor}>
            <span className="h-3.5 w-3.5 mr-1"><IconDownload /></span>Unduh
          </Button>
        }
        padded={false}
      >
        {rapor.length === 0 ? (
          <EmptyState title="Belum ada data rapor" description="Data rapor tersedia untuk pendaftar jenjang SMA." />
        ) : (
          <DataTable data={rapor} columns={cols} rowKey={(r) => `${r.semester}-${r.mapel}`} />
        )}
      </SectionCard>
    </div>
  );
}

type WawancaraPpdbDoc = {
  name: string;
  tanggal_wawancara?: string;
  pewawancara?: string;
  status?: string;
  skor?: number;
  rekomendasi?: string;
  catatan?: string;
};

function WawancaraTab({ pendaftar, actions }: { pendaftar: Pendaftar; actions: PpdbActions }) {
  // Live data dari doctype Wawancara PPDB.
  const q = useResourceList<WawancaraPpdbDoc>("Wawancara PPDB", {
    fields: ["name", "tanggal_wawancara", "pewawancara", "status", "skor", "rekomendasi", "catatan"],
    filters: [["pendaftaran_ppdb", "=", pendaftar.noPendaftaran]],
    order_by: "`tanggal_wawancara` desc",
    limit_page_length: 50,
  });
  const rows = q.data ?? [];

  const statTone = (s: string | undefined): "success" | "warning" | "danger" | "brand" => {
    if (s === "Selesai") return "success";
    if (s === "Dibatalkan") return "danger";
    if (s === "Terjadwal") return "warning";
    return "brand";
  };

  const cols: Column<WawancaraPpdbDoc>[] = [
    { key: "tanggal_wawancara", header: "Tanggal", cell: (r) => r.tanggal_wawancara ? formatTanggal(r.tanggal_wawancara) : "—" },
    { key: "status", header: "Status", cell: (r) => <Badge tone={statTone(r.status)} dot>{r.status ?? "—"}</Badge> },
    { key: "pewawancara", header: "Pewawancara", cell: (r) => <span className="font-medium">{r.pewawancara ?? "—"}</span> },
    { key: "skor", header: "Skor", align: "right", cell: (r) => r.skor !== undefined ? <span className="tabular-nums font-semibold">{r.skor}</span> : "—" },
    { key: "rekomendasi", header: "Rekomendasi", cell: (r) => r.rekomendasi ?? "—" },
    { key: "catatan", header: "Catatan", cell: (r) => <span className="text-muted-fg">{r.catatan ?? "—"}</span> },
  ];

  return (
    <SectionCard
      title="Riwayat Wawancara"
      description={q.isLoading ? "Memuat..." : `${rows.length} sesi`}
      action={<Button size="sm" onClick={actions.onJadwalWawancara}><span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Jadwal Wawancara</Button>}
      padded={false}
    >
      {rows.length === 0 ? (
        <EmptyState title={q.isLoading ? "Memuat..." : "Belum ada wawancara"} description="Pendaftar belum mengikuti tahap wawancara." />
      ) : (
        <DataTable data={rows} columns={cols} rowKey={(r) => r.name} />
      )}
    </SectionCard>
  );
}

function PembayaranTab({ pendaftar, actions }: { pendaftar: Pendaftar; actions: PpdbActions }) {
  const cols: Column<PembayaranPpdbRow>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="tabular-nums text-muted-fg">{r.id}</span> },
    { key: "judul", header: "Tagihan", cell: (r) => <span className="font-medium">{r.judul}</span> },
    { key: "tgl", header: "Tanggal", cell: (r) => formatTanggal(r.tanggal) },
    { key: "jml", header: "Jumlah", align: "right", cell: (r) => <span className="tabular-nums">{formatRupiah(r.jumlah)}</span> },
    { key: "metode", header: "Metode", cell: (r) => r.metode ? <Badge tone="neutral">{r.metode}</Badge> : <span className="text-muted-fg">—</span> },
    { key: "status", header: "Status", cell: (r) => <Badge tone={PEMBAYARAN_TONE[r.status]} dot>{r.status}</Badge> },
  ];
  const sisa = Math.max(0, pendaftar.totalBiaya - pendaftar.totalDibayar);
  const terbuka = pendaftar.pembayaran.filter((p) => p.status !== "Lunas").length;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Biaya" value={formatRupiah(pendaftar.totalBiaya)} accent="brand" icon={<IconWallet />} />
        <StatCard label="Sudah Dibayar" value={formatRupiah(pendaftar.totalDibayar)} accent="emerald" icon={<IconCheck />} />
        <StatCard label="Sisa" value={formatRupiah(sisa)} accent="amber" />
        <StatCard label="Tagihan Terbuka" value={terbuka} hint={`dari ${pendaftar.pembayaran.length} tagihan`} accent="rose" />
      </div>
      <SectionCard
        title="Riwayat Pembayaran"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={actions.onCatatPembayaran}>Catat Pembayaran</Button>
            <Button variant="outline" size="sm" onClick={actions.onUnduhBuktiBayar}>
              <span className="h-3.5 w-3.5 mr-1"><IconDownload /></span>Unduh
            </Button>
          </div>
        }
        padded={false}
      >
        <DataTable data={pendaftar.pembayaran} columns={cols} rowKey={(r) => r.id} />
      </SectionCard>
    </div>
  );
}

function AktivitasTab({ pendaftar }: { pendaftar: Pendaftar }) {
  return (
    <SectionCard title="Linimasa Aktivitas" description="Riwayat perubahan dan kejadian terkait pendaftar" padded={false}>
      {pendaftar.aktivitas.length === 0 ? (
        <EmptyState title="Belum ada aktivitas" />
      ) : (
        <ul className="divide-y divide-border">
          {pendaftar.aktivitas.map((a: AktivitasRow, i) => (
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
  { key: "wali", label: "Wali", icon: <IconUsers /> },
  { key: "dokumen", label: "Dokumen", icon: <IconFile /> },
  { key: "tahapan", label: "Tahapan", icon: <IconCheck /> },
  { key: "akademik", label: "Akademik", icon: <IconBook /> },
  { key: "wawancara", label: "Wawancara", icon: <IconChat /> },
  { key: "pembayaran", label: "Pembayaran", icon: <IconWallet /> },
  { key: "aktivitas", label: "Aktivitas", icon: <IconClock /> },
];

const VALID_TABS = new Set<TabKey>([
  "ringkasan","profil","wali","dokumen","tahapan","akademik","wawancara","pembayaran","aktivitas",
]);

// Pendaftaran PPDB doctype is sparse (status, gelombang, calon_siswa link,
// tanggal_daftar) — identity (nama, nisn, jenis_kelamin, dll) lives on the
// linked Calon Siswa doc, fetched as a follow-up query below.
type PpdbDoc = {
  name: string;
  status?: string;
  gelombang_ppdb?: string;
  calon_siswa?: string;
  tanggal_daftar?: string;
  rombongan_belajar?: string;
};

type CalonSiswaDoc = {
  name: string;
  nama_lengkap?: string;
  jenis_kelamin?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  agama?: string;
  kewarganegaraan?: string;
  nik?: string;
  nisn?: string;
  asal_sekolah?: string;
  alamat?: string;
  rt?: string;
  rw?: string;
  desa?: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
  kode_pos?: string;
  no_hp?: string;
  email?: string;
  foto?: string;
  nama_wali?: string;
  hubungan_wali?: string;
  no_hp_wali?: string;
  pekerjaan_wali?: string;
  penghasilan_wali?: string;
};

type PembayaranPpdbDoc = {
  name: string;
  pendaftaran_ppdb?: string;
  jumlah_tagihan?: number;
  jumlah_terbayar?: number;
  status?: string;
};

const BAYAR_STATUS_MAP: Record<string, PembayaranPpdbRow["status"]> = {
  Lunas: "Lunas",
  Partial: "Cicilan",
  "Belum Bayar": "Tertunda",
};

function mapPembayaranRows(rows: PembayaranPpdbDoc[]): PembayaranPpdbRow[] {
  return rows.map((r) => ({
    id: r.name,
    judul: "Biaya Pendaftaran",
    tanggal: "",
    jumlah: r.jumlah_tagihan ?? 0,
    status: BAYAR_STATUS_MAP[r.status ?? ""] ?? "Tertunda",
  }));
}

function mapWaliFromCalonSiswa(c: CalonSiswaDoc): WaliPpdbRow[] {
  if (!c.nama_wali) return [];
  const hub = (c.hubungan_wali === "Ayah" || c.hubungan_wali === "Ibu" ? c.hubungan_wali : "Wali") as WaliPpdbRow["hubungan"];
  const row: WaliPpdbRow = { hubungan: hub, nama: c.nama_wali };
  if (c.pekerjaan_wali) row.pekerjaan = c.pekerjaan_wali;
  if (c.penghasilan_wali) row.penghasilan = c.penghasilan_wali;
  if (c.no_hp_wali) row.telepon = c.no_hp_wali;
  return [row];
}

function PpdbDetailPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  const { noPendaftaran } = Route.useParams();
  const search = Route.useSearch();
  const docQ = useResourceDoc<PpdbDoc>("Pendaftaran PPDB", noPendaftaran);
  const calonSiswaName = docQ.data?.calon_siswa;
  const calonQ = useResourceDoc<CalonSiswaDoc>("Calon Siswa", calonSiswaName);
  const pembayaranQ = useResourceList<PembayaranPpdbDoc>(
    "Pembayaran PPDB",
    {
      fields: ["name", "pendaftaran_ppdb", "jumlah_tagihan", "jumlah_terbayar", "status"],
      filters: { pendaftaran_ppdb: noPendaftaran },
    },
  );
  const mock = findPendaftar(noPendaftaran, sekolah);
  // Merge: top-level pendaftaran overrides mock; identity from Calon Siswa;
  // pembayaran list from Pembayaran PPDB. Each layer falls back to mock.
  const pendaftar: typeof mock = (() => {
    if (!mock) return undefined;
    const d = docQ.data;
    const c = calonQ.data;
    const payRows = pembayaranQ.data;
    const base = d
      ? {
          ...mock,
          noPendaftaran: d.name ?? mock.noPendaftaran,
          statusPendaftaran: (d.status as typeof mock.statusPendaftaran) ?? mock.statusPendaftaran,
          tanggalDaftar: d.tanggal_daftar ?? mock.tanggalDaftar,
        }
      : mock;
    const withIdentity = c
      ? {
          ...base,
          namaLengkap: c.nama_lengkap ?? base.namaLengkap,
          nisn: c.nisn ?? base.nisn,
          nik: c.nik ?? base.nik,
          jenisKelamin: (c.jenis_kelamin as typeof base.jenisKelamin) ?? base.jenisKelamin,
          tempatLahir: c.tempat_lahir ?? base.tempatLahir,
          tanggalLahir: c.tanggal_lahir ?? base.tanggalLahir,
          agama: (c.agama as typeof base.agama) ?? base.agama,
          kewarganegaraan: (c.kewarganegaraan as typeof base.kewarganegaraan) ?? base.kewarganegaraan,
          asalSekolah: c.asal_sekolah ?? base.asalSekolah,
          alamat: c.alamat ?? base.alamat,
          rt: c.rt ?? base.rt,
          rw: c.rw ?? base.rw,
          desa: c.desa ?? base.desa,
          kecamatan: c.kecamatan ?? base.kecamatan,
          kabupaten: c.kabupaten ?? base.kabupaten,
          provinsi: c.provinsi ?? base.provinsi,
          kodePos: c.kode_pos ?? base.kodePos,
          telepon: c.no_hp ?? base.telepon,
          email: c.email ?? base.email,
          fotoUrl: c.foto ?? base.fotoUrl,
          wali: c.nama_wali ? mapWaliFromCalonSiswa(c) : base.wali,
        }
      : base;
    return payRows && payRows.length > 0
      ? { ...withIdentity, pembayaran: mapPembayaranRows(payRows) }
      : withIdentity;
  })();
  const navigate = useNavigate();
  const tab: TabKey = VALID_TABS.has(search.tab as TabKey) ? (search.tab as TabKey) : "ringkasan";
  const setTab = (next: TabKey) => {
    navigate({ to: "/sch/$sekolah/ppdb/$noPendaftaran", params: { sekolah, noPendaftaran }, search: { tab: next === "ringkasan" ? undefined : next } });
  };

  if (!pendaftar) {
    throw notFound();
  }

  const counts: Partial<Record<TabKey, number>> = {
    wali: pendaftar.wali.length,
    dokumen: pendaftar.dokumen.length,
    tahapan: pendaftar.tahapan.length,
    akademik: pendaftar.raporSmp.length,
    wawancara: pendaftar.wawancara.length,
    pembayaran: pendaftar.pembayaran.length,
    aktivitas: pendaftar.aktivitas.length,
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

  // Modal-state untuk action wiring (Upload Dokumen, Jadwal Wawancara, Edit Wali).
  const [showUploadDok, setShowUploadDok] = useState(false);
  const [showJadwalWwc, setShowJadwalWwc] = useState(false);
  const [showEditWali, setShowEditWali] = useState(false);

  const calonName = calonQ.data?.name;

  const actions: PpdbActions = {
    onKirimPesan: () => openMailto(pendaftar.email, `PPDB ${pendaftar.noPendaftaran} — ${pendaftar.namaLengkap}`),
    onKirimWa: () =>
      openWa(
        pendaftar.telepon,
        `Halo ${pendaftar.namaLengkap}, terkait pendaftaran ${pendaftar.noPendaftaran} di SekolahPro.`,
      ),
    onCetakKartu: () =>
      printDocument({
        title: `Kartu Peserta ${pendaftar.noPendaftaran}`,
        heading: "KARTU PESERTA PPDB",
        subheading: `${pendaftar.namaLengkap} · ${pendaftar.jenjangTujuan} · TA ${pendaftar.tahunAjaran}`,
        rows: [
          { label: "No. Pendaftaran", value: pendaftar.noPendaftaran },
          { label: "Nama", value: pendaftar.namaLengkap },
          { label: "NISN", value: pendaftar.nisn ?? "—" },
          { label: "Tempat, Tgl Lahir", value: `${pendaftar.tempatLahir}, ${formatTanggal(pendaftar.tanggalLahir)}` },
          { label: "Asal Sekolah", value: pendaftar.asalSekolah },
          { label: "Status", value: pendaftar.statusPendaftaran },
          { label: "Jalur", value: pendaftar.jalur },
        ],
      }),
    onUnduhBerkas: () =>
      downloadCsv(`biodata-${pendaftar.noPendaftaran}.csv`, [
        {
          no_pendaftaran: pendaftar.noPendaftaran,
          nama: pendaftar.namaLengkap,
          nisn: pendaftar.nisn,
          nik: pendaftar.nik,
          tempat_lahir: pendaftar.tempatLahir,
          tanggal_lahir: pendaftar.tanggalLahir,
          jenis_kelamin: pendaftar.jenisKelamin,
          asal_sekolah: pendaftar.asalSekolah,
          email: pendaftar.email,
          telepon: pendaftar.telepon,
          alamat: pendaftar.alamat,
          status: pendaftar.statusPendaftaran,
        },
      ]),
    onEditProfil: () => navigate({ to: "/sch/$sekolah/ppdb/calon-siswa", params: { sekolah } }),
    onTambahWali: () => {
      if (!calonName) {
        window.alert("Data Calon Siswa belum dimuat.");
        return;
      }
      setShowEditWali(true);
    },
    onUnggahDokumen: () => setShowUploadDok(true),
    onCatatPembayaran: () => navigate({ to: "/sch/$sekolah/ppdb/pembayaran", params: { sekolah } }),
    onUnduhBuktiBayar: () =>
      downloadCsv(`pembayaran-${pendaftar.noPendaftaran}.csv`, pendaftar.pembayaran.map((p) => ({
        id: p.id,
        judul: p.judul,
        tanggal: p.tanggal,
        jumlah: p.jumlah,
        metode: p.metode ?? "",
        status: p.status,
      }))),
    onJadwalWawancara: () => setShowJadwalWwc(true),
    onUnduhRapor: () =>
      downloadCsv(`rapor-${pendaftar.noPendaftaran}.csv`, pendaftar.raporSmp.map((r) => ({
        semester: r.semester,
        mapel: r.mapel,
        nilai: r.nilai,
      }))),
  };

  const renderTab = () => {
    switch (tab) {
      case "ringkasan": return <RingkasanTab pendaftar={pendaftar} onChangeTab={setTab} />;
      case "profil": return <ProfilTab pendaftar={pendaftar} />;
      case "wali": return <WaliTab pendaftar={pendaftar} actions={actions} />;
      case "dokumen": return <DokumenTab pendaftar={pendaftar} actions={actions} />;
      case "tahapan": return <TahapanTab pendaftar={pendaftar} />;
      case "akademik": return <AkademikTab pendaftar={pendaftar} actions={actions} calonSiswaName={calonName} />;
      case "wawancara": return <WawancaraTab pendaftar={pendaftar} actions={actions} />;
      case "pembayaran": return <PembayaranTab pendaftar={pendaftar} actions={actions} />;
      case "aktivitas": return <AktivitasTab pendaftar={pendaftar} />;
    }
  };

  // openOrAlert + stubAction kept for backward compat with legacy stubs (none active).
  void openOrAlert;
  void stubAction;

  return (
    <>
      <DetailPageTemplate
        header={
          <div className="space-y-3">
            <Breadcrumb
              items={[
                { label: "Dashboard", render: ({ className, children }) => <Link to="/sch/$sekolah" params={{ sekolah }} className={className}>{children}</Link> },
                { label: "PPDB", render: ({ className, children }) => <Link to="/sch/$sekolah/ppdb" params={{ sekolah }} className={className}>{children}</Link> },
                { label: pendaftar.namaLengkap },
              ]}
            />
            <PageHeader
              eyebrow="Detail Pendaftar"
              title={pendaftar.namaLengkap}
              description={`${pendaftar.noPendaftaran} · ${pendaftar.jenjangTujuan} · ${pendaftar.statusPendaftaran}`}
              actions={
                <Button variant="outline" onClick={() => navigate({ to: "/sch/$sekolah/ppdb", params: { sekolah } })}>
                  <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
                  Kembali ke daftar
                </Button>
              }
            />
          </div>
        }
        hero={<Hero pendaftar={pendaftar} actions={actions} />}
        tabs={<Tabs items={tabItems} />}
        primary={renderTab()}
      />

      <UploadDokumenModal
        open={showUploadDok}
        onClose={() => setShowUploadDok(false)}
        pendaftaranName={pendaftar.noPendaftaran}
        onSaved={() => pembayaranQ.refetch()}
      />
      <JadwalWawancaraModal
        open={showJadwalWwc}
        onClose={() => setShowJadwalWwc(false)}
        pendaftaranName={pendaftar.noPendaftaran}
      />
      {calonName && (
        <EditWaliModal
          open={showEditWali}
          onClose={() => setShowEditWali(false)}
          calonName={calonName}
          initial={{
            nama_wali: calonQ.data?.nama_wali,
            hubungan_wali: calonQ.data?.hubungan_wali,
            no_hp_wali: calonQ.data?.no_hp_wali,
            pekerjaan_wali: calonQ.data?.pekerjaan_wali,
            penghasilan_wali: calonQ.data?.penghasilan_wali,
          }}
          onSaved={() => calonQ.refetch()}
        />
      )}
    </>
  );
}

type SearchParams = { tab?: TabKey | undefined };

export const Route = createFileRoute("/sch/$sekolah/ppdb/$noPendaftaran")({
  component: PpdbDetailPage,
  validateSearch: (raw: Record<string, unknown>): SearchParams => {
    const t = typeof raw.tab === "string" ? raw.tab : undefined;
    return { tab: t && VALID_TABS.has(t as TabKey) ? (t as TabKey) : undefined };
  },
  notFoundComponent: function NotFound() {
    const { sekolah } = useParams({ from: "/sch/$sekolah" });
    return (
    <div className="py-16">
      <EmptyState
        title="Pendaftar tidak ditemukan"
        description="Nomor Pendaftaran yang diminta tidak ada di sistem. Periksa kembali atau kembali ke daftar PPDB."
        action={
          <Link to="/sch/$sekolah/ppdb" params={{ sekolah }} className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
            <span className="h-4 w-4"><IconArrowLeft /></span> Kembali ke daftar
          </Link>
        }
      />
    </div>
  ); },
});
