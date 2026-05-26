// PERP-ADR-0001 — Buku detail page wires the "Sedang Dipinjam" section to
// active Peminjaman Buku (status Aktif/Terlambat) joined via the Item
// Peminjaman child table 4-tuple filter `[child_dt, field, op, val]`. Each
// row exposes a "Kembalikan" action that opens `ReturnModal`, which submits
// `Pengembalian Buku` and invalidates the peminjaman cache so this view
// refetches automatically.
import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { stubAction } from "../lib/stub";
import { ReturnModal } from "../components/perpustakaan/ReturnModal";
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
  IconCalendar,
  IconChart,
  IconChat,
  IconCheck,
  IconClock,
  IconDownload,
  IconEdit,
  IconFile,
  IconHome,
  IconId,
  IconMapPin,
  IconMore,
  IconPlus,
  IconPrint,
  IconWallet,
  type TabItem,
} from "@sekolahpro/ui";
import { useResourceDoc, useResourceList } from "@sekolahpro/api-client";
import {
  findBuku,
  formatRupiah,
  formatTanggal,
  type AktivitasRow,
  type Buku,
  type KopiRow,
  type PeminjamanRow,
  type StatusBuku,
  type StokTransaksiRow,
} from "../data/perpustakaan";

type TabKey = "ringkasan" | "detail" | "kopi" | "peminjaman" | "review" | "stok" | "aktivitas";

const STATUS_TONE: Record<StatusBuku, "success" | "brand" | "neutral" | "warning" | "danger"> = {
  Tersedia: "success",
  Dipinjam: "brand",
  Dipesan: "warning",
  Rusak: "warning",
  Hilang: "danger",
  Arsip: "neutral",
};

const KONDISI_TONE: Record<KopiRow["kondisi"], "success" | "warning" | "danger" | "neutral"> = {
  Baik: "success",
  "Rusak Ringan": "warning",
  "Rusak Berat": "danger",
  Hilang: "danger",
};

const PEMINJAMAN_TONE: Record<PeminjamanRow["status"], "brand" | "success" | "warning" | "danger"> = {
  Aktif: "brand",
  Dikembalikan: "success",
  Terlambat: "warning",
  Hilang: "danger",
};

const STOK_TONE: Record<StokTransaksiRow["tipe"], "success" | "brand" | "warning" | "danger"> = {
  Masuk: "success",
  Keluar: "brand",
  Hilang: "danger",
  Rusak: "warning",
};

function bukuInisial(judul: string): string {
  const parts = judul.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "B";
}

function StarRating({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500 text-sm">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < full ? "★" : i === full && half ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

function Hero({ buku, onEdit }: { buku: Buku; onEdit: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-brand/5 via-bg to-violet-500/5 p-6 shadow-sm">
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex h-24 w-20 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-violet-500 text-white text-xl font-bold shadow-sm ring-2 ring-bg">
          {bukuInisial(buku.judul)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold text-fg truncate">{buku.judul}</h2>
            <Badge tone={STATUS_TONE[buku.status]} dot>{buku.status}</Badge>
            <Badge tone="neutral">{buku.kategori}</Badge>
            <Badge tone="brand">{buku.bahasa}</Badge>
          </div>
          <div className="mt-1 text-sm text-muted-fg">
            <span className="tabular-nums">ISBN {buku.isbn}</span>
            <span className="mx-2">·</span>
            <span className="tabular-nums">{buku.kodeBuku}</span>
            <span className="mx-2">·</span>
            <span>{buku.penulis.join(", ")}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-fg">
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconBook /></span>{buku.penerbit}</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconCalendar /></span>{buku.tahunTerbit}</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconFile /></span>{buku.jumlahHalaman} halaman</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><IconMapPin /></span>{buku.lokasi}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => stubAction(`Pinjamkan ${buku.judul}`)}>
            <span className="h-4 w-4 mr-1.5"><IconChat /></span>Pinjamkan
          </Button>
          <Button variant="outline" size="sm" onClick={() => stubAction(`Cetak Label ${buku.kodeBuku}`)}>
            <span className="h-4 w-4 mr-1.5"><IconPrint /></span>Cetak Label
          </Button>
          <Button variant="outline" size="sm" onClick={() => stubAction(`Unduh Metadata ${buku.kodeBuku}`)}>
            <span className="h-4 w-4 mr-1.5"><IconDownload /></span>Unduh
          </Button>
          <Button size="sm" onClick={onEdit}>
            <span className="h-4 w-4 mr-1.5"><IconEdit /></span>Edit
          </Button>
          <Button variant="outline" size="sm" className="!px-2" onClick={() => stubAction("Aksi lainnya (menu)")}>
            <span className="h-4 w-4"><IconMore /></span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function RingkasanTab({ buku, onChangeTab }: { buku: Buku; onChangeTab: (k: TabKey) => void }) {
  const peminjamanAktif = buku.peminjaman.filter((p) => p.status === "Aktif" || p.status === "Terlambat");
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Kopi Tersedia" value={buku.kopiTersedia} hint={`dari ${buku.jumlahKopi} kopi`} icon={<IconCheck />} accent="emerald" />
        <StatCard label="Sedang Dipinjam" value={buku.kopiDipinjam} hint={`${peminjamanAktif.length} peminjam aktif`} icon={<IconWallet />} accent="brand" />
        <StatCard label="Total Peminjaman" value={buku.jumlahDipinjam} hint="sepanjang waktu" icon={<IconChart />} accent="violet" />
        <StatCard label="Rating Rata-rata" value={buku.ratingRata.toFixed(1)} hint={`${buku.jumlahReview} ulasan`} icon={<IconChart />} accent="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <SectionCard
            title="Deskripsi Buku"
            description={`${buku.kategori} · ${buku.bahasa}`}
            action={<Badge tone="brand" dot>{buku.edisi ?? "Edisi"}</Badge>}
          >
            <p className="text-sm text-fg leading-relaxed">{buku.deskripsi}</p>
          </SectionCard>

          <SectionCard title="Peminjaman Aktif" action={<Button variant="ghost" size="sm" onClick={() => onChangeTab("peminjaman")}>Lihat semua</Button>} padded={false}>
            <ul className="divide-y divide-border">
              {peminjamanAktif.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                  <Avatar name={p.peminjam} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-fg">{p.peminjam}</div>
                    <div className="text-xs text-muted-fg">NIS {p.nis ?? "—"} · Pinjam {formatTanggal(p.tanggalPinjam)} · Kembali {formatTanggal(p.tanggalKembali)}</div>
                  </div>
                  <div className="text-right">
                    <Badge tone={PEMINJAMAN_TONE[p.status]} dot>{p.status}</Badge>
                    {p.denda !== undefined ? (
                      <div className="text-xs text-amber-700 mt-0.5 tabular-nums">{formatRupiah(p.denda)}</div>
                    ) : null}
                  </div>
                </li>
              ))}
              {peminjamanAktif.length === 0 ? (
                <li className="px-5 py-6 text-sm text-muted-fg text-center">Tidak ada peminjaman aktif.</li>
              ) : null}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Info Cepat">
            <InfoGrid cols={2}>
              <InfoField label="Lokasi" icon={<IconMapPin />} value={buku.lokasi} />
              <InfoField label="Edisi" value={buku.edisi ?? "—"} />
              <InfoField label="Harga Perolehan" value={buku.hargaPerolehan !== undefined ? formatRupiah(buku.hargaPerolehan) : "—"} />
              <InfoField label="Ditambahkan" value={formatTanggal(buku.ditambahkan)} />
            </InfoGrid>
          </SectionCard>

          <SectionCard title="Review Terbaru" action={<Button variant="ghost" size="sm" onClick={() => onChangeTab("review")}>Lihat semua</Button>} padded={false}>
            <ul className="divide-y divide-border">
              {buku.review.slice(0, 3).map((r, i) => (
                <li key={i} className="flex items-start gap-3 px-5 py-3.5">
                  <Avatar name={r.peresensi} size="sm" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-fg truncate">{r.peresensi}</div>
                    <div className="text-xs text-muted-fg flex items-center gap-2">
                      <StarRating value={r.rating} />
                      <span>{formatTanggal(r.tanggal)}</span>
                    </div>
                    <div className="text-xs text-fg mt-1 line-clamp-2">{r.isi}</div>
                  </div>
                </li>
              ))}
              {buku.review.length === 0 ? (
                <li className="px-5 py-6 text-sm text-muted-fg text-center">Belum ada ulasan.</li>
              ) : null}
            </ul>
          </SectionCard>

          <SectionCard title="Aksi Cepat">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => stubAction(`Pinjamkan ${buku.judul}`)}><span className="text-xs">Pinjamkan</span></Button>
              <Button variant="outline" size="sm" onClick={() => stubAction(`Tandai Hilang ${buku.kodeBuku}`)}><span className="text-xs">Tandai Hilang</span></Button>
              <Button variant="outline" size="sm" onClick={() => stubAction(`Pindah Lokasi ${buku.kodeBuku}`)}><span className="text-xs">Pindah Lokasi</span></Button>
              <Button variant="outline" size="sm" onClick={() => stubAction(`Arsipkan ${buku.kodeBuku}`)}><span className="text-xs">Arsipkan</span></Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}

function DetailTab({ buku }: { buku: Buku }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Identitas Buku">
        <InfoGrid cols={3}>
          <InfoField label="ISBN" icon={<IconId />} value={<span className="tabular-nums">{buku.isbn}</span>} />
          <InfoField label="Kode Buku" value={<span className="tabular-nums">{buku.kodeBuku}</span>} />
          <InfoField label="Judul" value={buku.judul} />
          <InfoField label="Penulis" value={buku.penulis.join(", ")} />
          <InfoField label="Penerbit" value={buku.penerbit} />
          <InfoField label="Tahun Terbit" value={String(buku.tahunTerbit)} />
          <InfoField label="Edisi" value={buku.edisi ?? "—"} />
          <InfoField label="Kategori" value={<Badge tone="neutral">{buku.kategori}</Badge>} />
          <InfoField label="Bahasa" value={buku.bahasa} />
          <InfoField label="Jumlah Halaman" value={<span className="tabular-nums">{buku.jumlahHalaman}</span>} />
          <InfoField label="Harga Perolehan" value={buku.hargaPerolehan !== undefined ? formatRupiah(buku.hargaPerolehan) : "—"} />
          <InfoField label="Lokasi" icon={<IconMapPin />} value={buku.lokasi} />
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Deskripsi">
        <p className="text-sm text-fg leading-relaxed">{buku.deskripsi}</p>
      </SectionCard>
    </div>
  );
}

function KopiTab({ buku }: { buku: Buku }) {
  const cols: Column<KopiRow>[] = [
    { key: "kode", header: "Kode Kopi", cell: (r) => <span className="tabular-nums font-medium">{r.kodeKopi}</span> },
    { key: "kondisi", header: "Kondisi", cell: (r) => <Badge tone={KONDISI_TONE[r.kondisi]} dot>{r.kondisi}</Badge> },
    { key: "lokasi", header: "Lokasi", cell: (r) => r.lokasi },
    { key: "status", header: "Status", cell: (r) => <Badge tone={STATUS_TONE[r.status]} dot>{r.status}</Badge> },
  ];
  return (
    <SectionCard
      title="Daftar Kopi"
      description={`${buku.jumlahKopi} eksemplar`}
      action={<Button size="sm" onClick={() => stubAction(`Tambah Kopi ${buku.kodeBuku}`)}><span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Tambah Kopi</Button>}
      padded={false}
    >
      <DataTable data={buku.kopi} columns={cols} rowKey={(r) => r.kodeKopi} />
    </SectionCard>
  );
}

function PeminjamanTab({ buku }: { buku: Buku }) {
  const cols: Column<PeminjamanRow>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="tabular-nums text-muted-fg">{r.id}</span> },
    { key: "peminjam", header: "Peminjam", cell: (r) => <span className="font-medium">{r.peminjam}</span> },
    { key: "nis", header: "NIS", cell: (r) => <span className="tabular-nums text-muted-fg">{r.nis ?? "—"}</span> },
    { key: "pinjam", header: "Tanggal Pinjam", cell: (r) => formatTanggal(r.tanggalPinjam) },
    { key: "kembali", header: "Tanggal Kembali", cell: (r) => formatTanggal(r.tanggalKembali) },
    { key: "status", header: "Status", cell: (r) => <Badge tone={PEMINJAMAN_TONE[r.status]} dot>{r.status}</Badge> },
    { key: "denda", header: "Denda", align: "right", cell: (r) => <span className="tabular-nums">{r.denda !== undefined ? formatRupiah(r.denda) : "—"}</span> },
    { key: "petugas", header: "Petugas", cell: (r) => r.petugas },
  ];
  const counts = buku.peminjaman.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Aktif" value={counts.Aktif ?? 0} accent="brand" icon={<IconWallet />} />
        <StatCard label="Terlambat" value={counts.Terlambat ?? 0} accent="amber" />
        <StatCard label="Dikembalikan" value={counts.Dikembalikan ?? 0} accent="emerald" icon={<IconCheck />} />
        <StatCard label="Hilang" value={counts.Hilang ?? 0} accent="rose" />
      </div>
      <SectionCard
        title="Riwayat Peminjaman"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => stubAction("Filter Periode Peminjaman")}>Filter Periode</Button>
            <Button size="sm" onClick={() => stubAction(`Pinjamkan ${buku.judul}`)}><span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Pinjamkan</Button>
          </div>
        }
        padded={false}
      >
        <DataTable data={buku.peminjaman} columns={cols} rowKey={(r) => r.id} />
      </SectionCard>
    </div>
  );
}

function ReviewTab({ buku }: { buku: Buku }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Rating Rata-rata" value={buku.ratingRata.toFixed(1)} hint={`${buku.jumlahReview} ulasan`} accent="amber" icon={<IconChart />} />
        <StatCard label="Total Ulasan" value={buku.jumlahReview} accent="brand" />
        <StatCard label="Ulasan Ditampilkan" value={buku.review.length} accent="violet" />
      </div>
      <SectionCard title="Ulasan Pembaca" description="Komentar dari peminjam" padded={false}>
        {buku.review.length === 0 ? (
          <EmptyState title="Belum ada ulasan" />
        ) : (
          <ul className="divide-y divide-border">
            {buku.review.map((r, i) => (
              <li key={i} className="flex items-start gap-4 px-5 py-4">
                <Avatar name={r.peresensi} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-fg">{r.peresensi}</span>
                    <StarRating value={r.rating} />
                    <span className="text-xs text-muted-fg">· {formatTanggal(r.tanggal)}</span>
                  </div>
                  <div className="text-sm text-fg mt-1.5 leading-relaxed">{r.isi}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

function StokTab({ buku }: { buku: Buku }) {
  const cols: Column<StokTransaksiRow>[] = [
    { key: "tgl", header: "Tanggal", cell: (r) => formatTanggal(r.tanggal) },
    { key: "tipe", header: "Tipe", cell: (r) => <Badge tone={STOK_TONE[r.tipe]} dot>{r.tipe}</Badge> },
    { key: "jumlah", header: "Jumlah", align: "right", cell: (r) => <span className="tabular-nums">{r.jumlah}</span> },
    { key: "sumber", header: "Sumber", cell: (r) => r.sumber ?? "—" },
    { key: "catatan", header: "Catatan", cell: (r) => <span className="text-muted-fg">{r.catatan ?? "—"}</span> },
  ];
  return (
    <SectionCard
      title="Riwayat Transaksi Stok"
      action={<Button size="sm" onClick={() => stubAction(`Catat Transaksi Stok ${buku.kodeBuku}`)}><span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Catat Transaksi</Button>}
      padded={false}
    >
      <DataTable data={buku.stokTransaksi} columns={cols} rowKey={(r) => `${r.tanggal}-${r.tipe}-${r.jumlah}`} />
    </SectionCard>
  );
}

function AktivitasTab({ buku }: { buku: Buku }) {
  return (
    <SectionCard title="Linimasa Aktivitas" description="Riwayat perubahan dan kejadian terkait buku" padded={false}>
      {buku.aktivitas.length === 0 ? (
        <EmptyState title="Belum ada aktivitas" />
      ) : (
        <ul className="divide-y divide-border">
          {buku.aktivitas.map((a: AktivitasRow, i) => (
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
  { key: "detail", label: "Detail", icon: <IconId /> },
  { key: "kopi", label: "Kopi", icon: <IconBook /> },
  { key: "peminjaman", label: "Peminjaman", icon: <IconWallet /> },
  { key: "review", label: "Review", icon: <IconChat /> },
  { key: "stok", label: "Stok", icon: <IconFile /> },
  { key: "aktivitas", label: "Aktivitas", icon: <IconClock /> },
];

const VALID_TABS = new Set<TabKey>([
  "ringkasan","detail","kopi","peminjaman","review","stok","aktivitas",
]);

// Backend Buku doctype shape; nested arrays (kopi, peminjaman, review,
// aktivitas) stay on mock until each gets its own resource query.
type BukuDoc = {
  name: string;
  judul?: string;
  isbn?: string;
  pengarang?: string;
  penerbit?: string;
  tahun_terbit?: number;
  kategori?: string;
  deskripsi?: string;
};

type EksemplarDoc = {
  name: string;
  buku?: string;
  nomor_inventaris?: string;
  kondisi?: "Baik" | "Rusak" | "Hilang";
  status?: "Tersedia" | "Dipinjam" | "Dipesan" | "Tidak Aktif";
};

type PeminjamanDoc = {
  name: string;
  anggota?: string;
  tanggal_pinjam?: string;
  tanggal_kembali_rencana?: string;
  status?: "Aktif" | "Selesai" | "Terlambat";
};

const KONDISI_MAP: Record<NonNullable<EksemplarDoc["kondisi"]>, KopiRow["kondisi"]> = {
  Baik: "Baik",
  Rusak: "Rusak Ringan",
  Hilang: "Hilang",
};

const EKS_STATUS_MAP: Record<NonNullable<EksemplarDoc["status"]>, StatusBuku> = {
  Tersedia: "Tersedia",
  Dipinjam: "Dipinjam",
  Dipesan: "Dipesan",
  "Tidak Aktif": "Arsip",
};

const PINJ_STATUS_MAP: Record<NonNullable<PeminjamanDoc["status"]>, PeminjamanRow["status"]> = {
  Aktif: "Aktif",
  Selesai: "Dikembalikan",
  Terlambat: "Terlambat",
};

function mapEksemplarToKopi(rows: EksemplarDoc[], fallbackLokasi: KopiRow["lokasi"]): KopiRow[] {
  return rows.map((r) => ({
    kodeKopi: r.nomor_inventaris ?? r.name,
    kondisi: r.kondisi ? KONDISI_MAP[r.kondisi] : "Baik",
    lokasi: fallbackLokasi,
    status: r.status ? EKS_STATUS_MAP[r.status] : "Tersedia",
  }));
}

function mapPeminjamanRows(rows: PeminjamanDoc[]): PeminjamanRow[] {
  return rows.map((r) => {
    const row: PeminjamanRow = {
      id: r.name,
      peminjam: r.anggota ?? "—",
      tanggalPinjam: r.tanggal_pinjam ?? "",
      tanggalKembali: r.tanggal_kembali_rencana ?? "",
      status: r.status ? PINJ_STATUS_MAP[r.status] : "Aktif",
      petugas: "—",
    };
    return row;
  });
}

const KATEGORI_SET = new Set<Buku["kategori"]>([
  "Fiksi", "Non-Fiksi", "Pelajaran", "Referensi", "Majalah",
  "Komik", "Biografi", "Sejarah", "Sains", "Agama",
]);

function deriveStatus(kopi: KopiRow[]): StatusBuku {
  if (kopi.length === 0) return "Arsip";
  if (kopi.some((k) => k.status === "Tersedia")) return "Tersedia";
  if (kopi.some((k) => k.status === "Dipinjam")) return "Dipinjam";
  if (kopi.some((k) => k.status === "Dipesan")) return "Dipesan";
  return "Arsip";
}

// Build a Buku purely from backend data when no mock fixture exists for this
// ISBN (e.g. records freshly created via the daftar modal).
function bukuFromBackend(d: BukuDoc, kopi: KopiRow[], peminjaman: PeminjamanRow[]): Buku {
  const kategoriRaw = d.kategori as Buku["kategori"] | undefined;
  const kategori: Buku["kategori"] = kategoriRaw && KATEGORI_SET.has(kategoriRaw) ? kategoriRaw : "Referensi";
  const tersedia = kopi.filter((k) => k.status === "Tersedia").length;
  const dipinjam = kopi.filter((k) => k.status === "Dipinjam").length;
  return {
    isbn: d.isbn ?? d.name,
    kodeBuku: d.name,
    judul: d.judul ?? d.name,
    penulis: d.pengarang ? d.pengarang.split(",").map((s) => s.trim()).filter(Boolean) : [],
    penerbit: d.penerbit ?? "—",
    tahunTerbit: d.tahun_terbit ?? 0,
    kategori,
    bahasa: "Indonesia",
    jumlahHalaman: 0,
    deskripsi: d.deskripsi ?? "—",
    jumlahKopi: kopi.length,
    kopiTersedia: tersedia,
    kopiDipinjam: dipinjam,
    lokasi: "—",
    ratingRata: 0,
    jumlahReview: 0,
    jumlahDipinjam: peminjaman.length,
    ditambahkan: "",
    status: deriveStatus(kopi),
    kopi,
    peminjaman,
    review: [],
    stokTransaksi: [],
    aktivitas: [],
  };
}

type ActivePinjaman = Pick<PeminjamanDoc, "name" | "anggota" | "tanggal_kembali_rencana" | "status">;

function isActivePinjaman(p: PeminjamanDoc): p is ActivePinjaman & PeminjamanDoc {
  return p.status === "Aktif" || p.status === "Terlambat";
}

function SedangDipinjamSection({
  rows,
  onReturn,
}: {
  rows: PeminjamanDoc[];
  onReturn: (name: string) => void;
}) {
  const active = rows.filter(isActivePinjaman);
  return (
    <SectionCard title={`Sedang Dipinjam (${active.length})`} padded={false}>
      {active.length === 0 ? (
        <div className="px-5 py-6 text-sm text-muted-fg text-center">
          Tidak ada peminjaman aktif untuk buku ini.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {active.map((p) => (
            <li key={p.name} className="flex items-center gap-3 px-5 py-3.5">
              <div className="flex-1 min-w-0 text-sm text-fg">
                <span className="font-medium tabular-nums">{p.name}</span>
                <span className="text-muted-fg"> — peminjam {p.anggota ?? "—"} — rencana {formatTanggal(p.tanggal_kembali_rencana ?? "")}</span>
              </div>
              <Badge tone={p.status === "Terlambat" ? "warning" : "brand"} dot>{p.status ?? "Aktif"}</Badge>
              <Button size="sm" onClick={() => onReturn(p.name)}>Kembalikan</Button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function BukuDetailPage() {
  const { isbn } = Route.useParams();
  const search = Route.useSearch();
  const docQ = useResourceDoc<BukuDoc>("Buku", isbn);
  const bukuName = docQ.data?.name ?? isbn;
  const kopiQ = useResourceList<EksemplarDoc>("Eksemplar Buku", {
    fields: ["name", "buku", "nomor_inventaris", "kondisi", "status"],
    filters: { buku: bukuName },
    limit_page_length: 200,
  });
  const eksemplarNames = (kopiQ.data ?? []).map((e) => e.name);
  // Peminjaman Buku is the loan parent; eksemplar links live on its child
  // rows (Item Peminjaman). Use the 4-tuple `[child_doctype, field, op, val]`
  // filter so Frappe joins on the child without an extra round-trip.
  const pinjQ = useResourceList<PeminjamanDoc>("Peminjaman Buku", {
    fields: ["name", "anggota", "tanggal_pinjam", "tanggal_kembali_rencana", "status"],
    filters: [["Item Peminjaman", "eksemplar", "in", eksemplarNames]],
    limit_page_length: 200,
  }, { enabled: eksemplarNames.length > 0 });
  const mock = findBuku(isbn);
  const buku: Buku | undefined = (() => {
    const d = docQ.data;
    // Backend-only path: no mock fixture but doc exists → render from backend.
    if (!mock) {
      if (!d) return undefined;
      const kopi = kopiQ.data ? mapEksemplarToKopi(kopiQ.data, "Rak A") : [];
      const peminjaman = pinjQ.data ? mapPeminjamanRows(pinjQ.data) : [];
      return bukuFromBackend(d, kopi, peminjaman);
    }
    if (!d) return mock;
    // `pengarang` is single Data on backend; split for stub's string[] shape.
    const penulis = d.pengarang
      ? d.pengarang.split(",").map((s) => s.trim()).filter(Boolean)
      : mock.penulis;
    const kopiBackend = kopiQ.data?.length ? mapEksemplarToKopi(kopiQ.data, mock.lokasi as KopiRow["lokasi"]) : mock.kopi;
    const pinjBackend = pinjQ.data?.length ? mapPeminjamanRows(pinjQ.data) : mock.peminjaman;
    return {
      ...mock,
      isbn: d.isbn ?? mock.isbn,
      judul: d.judul ?? mock.judul,
      penulis,
      penerbit: d.penerbit ?? mock.penerbit,
      tahunTerbit: d.tahun_terbit ?? mock.tahunTerbit,
      kategori: (d.kategori as Buku["kategori"]) ?? mock.kategori,
      deskripsi: d.deskripsi ?? mock.deskripsi,
      kopi: kopiBackend,
      peminjaman: pinjBackend,
    };
  })();
  const navigate = useNavigate();
  const [returnFor, setReturnFor] = useState<string | null>(null);
  const tab: TabKey = VALID_TABS.has(search.tab as TabKey) ? (search.tab as TabKey) : "ringkasan";
  const setTab = (next: TabKey) => {
    navigate({ to: "/perpustakaan/$isbn", params: { isbn }, search: { tab: next === "ringkasan" ? undefined : next } });
  };

  if (!buku) {
    if (docQ.isLoading) {
      return (
        <div className="py-16 text-center text-sm text-muted-fg">Memuat detail buku…</div>
      );
    }
    throw notFound();
  }

  const counts: Partial<Record<TabKey, number>> = {
    kopi: buku.kopi.length,
    peminjaman: buku.peminjaman.length,
    review: buku.review.length,
    stok: buku.stokTransaksi.length,
    aktivitas: buku.aktivitas.length,
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
      case "ringkasan": return <RingkasanTab buku={buku} onChangeTab={setTab} />;
      case "detail": return <DetailTab buku={buku} />;
      case "kopi": return <KopiTab buku={buku} />;
      case "peminjaman": return <PeminjamanTab buku={buku} />;
      case "review": return <ReviewTab buku={buku} />;
      case "stok": return <StokTab buku={buku} />;
      case "aktivitas": return <AktivitasTab buku={buku} />;
    }
  };

  return (
    <DetailPageTemplate
      header={
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: "Dashboard", render: ({ className, children }) => <Link to="/" className={className}>{children}</Link> },
              { label: "Perpustakaan", render: ({ className, children }) => <Link to="/perpustakaan" className={className}>{children}</Link> },
              { label: buku.judul },
            ]}
          />
          <PageHeader
            eyebrow="Detail Buku"
            title={buku.judul}
            description={`ISBN ${buku.isbn} · ${buku.kategori} · ${buku.status}`}
            actions={
              <Button variant="outline" onClick={() => navigate({ to: "/perpustakaan" })}>
                <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
                Kembali ke daftar
              </Button>
            }
          />
        </div>
      }
      hero={<Hero buku={buku} onEdit={() => stubAction(`Edit Buku ${buku.kodeBuku}`)} />}
      tabs={<Tabs items={tabItems} />}
      primary={
        <div className="space-y-6">
          <SedangDipinjamSection rows={pinjQ.data ?? []} onReturn={setReturnFor} />
          {renderTab()}
          {returnFor && (
            <ReturnModal
              open
              peminjaman={returnFor}
              onClose={() => setReturnFor(null)}
              onSuccess={() => setReturnFor(null)}
            />
          )}
        </div>
      }
    />
  );
}

type SearchParams = { tab?: TabKey | undefined };

export const Route = createFileRoute("/perpustakaan/$isbn")({
  component: BukuDetailPage,
  validateSearch: (raw: Record<string, unknown>): SearchParams => {
    const t = typeof raw.tab === "string" ? raw.tab : undefined;
    return { tab: t && VALID_TABS.has(t as TabKey) ? (t as TabKey) : undefined };
  },
  notFoundComponent: () => (
    <div className="py-16">
      <EmptyState
        title="Buku tidak ditemukan"
        description="ISBN yang diminta tidak ada di sistem. Periksa kembali atau kembali ke daftar buku."
        action={
          <Link to="/perpustakaan" className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
            <span className="h-4 w-4"><IconArrowLeft /></span> Kembali ke daftar
          </Link>
        }
      />
    </div>
  ),
});
