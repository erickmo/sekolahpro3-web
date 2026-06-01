// BukuDetailStats — stat/summary presentational blocks for the Buku detail
// page: "Sedang Dipinjam" active-loan card (Kembalikan action), the star-rating
// glyph, and the overview/detail/review/stok/aktivitas tab panels. Layer: pure
// presentation. Loan data + return callback come in as props; tab navigation is
// plumbed via `onChangeTab`.
import {
  Avatar,
  Badge,
  Button,
  Column,
  DataTable,
  EmptyState,
  InfoField,
  InfoGrid,
  SectionCard,
  StatCard,
  IconCheck,
  IconChart,
  IconClock,
  IconId,
  IconMapPin,
  IconPlus,
  IconWallet,
} from "@sekolahpro/ui";
import { stubAction } from "../../lib/stub";
import { perpFormatRupiah, perpFormatDate } from "./perpFormatters";
import { isActivePinjaman, type PeminjamanDoc } from "./bukuDetail";
import { PEMINJAMAN_TONE } from "./RiwayatPeminjamanTable";
import type {
  AktivitasRow,
  Buku,
  StokTransaksiRow,
} from "../../data/perpustakaan";

/** Tab identifiers shared between the route shell and these panels. */
export type TabKey = "ringkasan" | "detail" | "kopi" | "peminjaman" | "review" | "stok" | "aktivitas";

/** Badge tone per stock-transaction type. */
const STOK_TONE: Record<StokTransaksiRow["tipe"], "success" | "brand" | "warning" | "danger"> = {
  Masuk: "success",
  Keluar: "brand",
  Hilang: "danger",
  Rusak: "warning",
};

/** Total stars rendered by the rating glyph. */
const STAR_SLOTS = 5;
/** Threshold (fractional part) at which a half star is shown. */
const HALF_STAR_THRESHOLD = 0.5;
/** Number of recent reviews shown in the overview "Review Terbaru" card. */
const RECENT_REVIEW_LIMIT = 3;

/** StarRating renders a 5-slot rating glyph with optional half star. */
export function StarRating({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= HALF_STAR_THRESHOLD;
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500 text-sm">
      {Array.from({ length: STAR_SLOTS }).map((_, i) => (
        <span key={i}>{i < full ? "★" : i === full && half ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

/**
 * SedangDipinjamSection lists loans still outstanding for this title and exposes
 * a per-row "Kembalikan" action. `onReturn` receives the loan docname.
 */
export function SedangDipinjamSection({
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
                <span className="text-muted-fg"> — peminjam {p.anggota ?? "—"} — rencana {perpFormatDate(p.tanggal_kembali_rencana ?? "")}</span>
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

/** RingkasanTab — overview panel: stat cards, description, active loans, reviews. */
export function RingkasanTab({ buku, onChangeTab }: { buku: Buku; onChangeTab: (k: TabKey) => void }) {
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
                    <div className="text-xs text-muted-fg">NIS {p.nis ?? "—"} · Pinjam {perpFormatDate(p.tanggalPinjam)} · Kembali {perpFormatDate(p.tanggalKembali)}</div>
                  </div>
                  <div className="text-right">
                    <Badge tone={PEMINJAMAN_TONE[p.status]} dot>{p.status}</Badge>
                    {p.denda !== undefined ? (
                      <div className="text-xs text-amber-700 mt-0.5 tabular-nums">{perpFormatRupiah(p.denda)}</div>
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
              <InfoField label="Harga Perolehan" value={buku.hargaPerolehan !== undefined ? perpFormatRupiah(buku.hargaPerolehan) : "—"} />
              <InfoField label="Ditambahkan" value={perpFormatDate(buku.ditambahkan)} />
            </InfoGrid>
          </SectionCard>
          <SectionCard title="Review Terbaru" action={<Button variant="ghost" size="sm" onClick={() => onChangeTab("review")}>Lihat semua</Button>} padded={false}>
            <ul className="divide-y divide-border">
              {buku.review.slice(0, RECENT_REVIEW_LIMIT).map((r, i) => (
                <li key={i} className="flex items-start gap-3 px-5 py-3.5">
                  <Avatar name={r.peresensi} size="sm" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-fg truncate">{r.peresensi}</div>
                    <div className="text-xs text-muted-fg flex items-center gap-2">
                      <StarRating value={r.rating} />
                      <span>{perpFormatDate(r.tanggal)}</span>
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

/** DetailTab — full identity + description panel. */
export function DetailTab({ buku }: { buku: Buku }) {
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
          <InfoField label="Harga Perolehan" value={buku.hargaPerolehan !== undefined ? perpFormatRupiah(buku.hargaPerolehan) : "—"} />
          <InfoField label="Lokasi" icon={<IconMapPin />} value={buku.lokasi} />
        </InfoGrid>
      </SectionCard>
      <SectionCard title="Deskripsi">
        <p className="text-sm text-fg leading-relaxed">{buku.deskripsi}</p>
      </SectionCard>
    </div>
  );
}

/** ReviewTab — rating stats + reader reviews list. */
export function ReviewTab({ buku }: { buku: Buku }) {
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
                    <span className="text-xs text-muted-fg">· {perpFormatDate(r.tanggal)}</span>
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

/** StokTab — stock-transaction ledger. */
export function StokTab({ buku }: { buku: Buku }) {
  const cols: Column<StokTransaksiRow>[] = [
    { key: "tgl", header: "Tanggal", cell: (r) => perpFormatDate(r.tanggal) },
    { key: "tipe", header: "Tipe", cell: (r) => <Badge tone={STOK_TONE[r.tipe]} dot>{r.tipe}</Badge> },
    { key: "jumlah", header: "Jumlah", align: "right", cell: (r) => <span className="tabular-nums">{r.jumlah}</span> },
    { key: "sumber", header: "Sumber", cell: (r) => r.sumber ?? "—" },
    { key: "catatan", header: "Catatan", cell: (r) => <span className="text-muted-fg">{r.catatan ?? "—"}</span> },
  ];
  return (
    <SectionCard
      title="Riwayat Transaksi Stok"
      action={<Button size="sm" onClick={() => stubAction(`Catat Transaksi Stok ${buku.kodeBuku}`)}><IconPlus className="mr-1 h-3.5 w-3.5 shrink-0" />Catat Transaksi</Button>}
      padded={false}
    >
      <DataTable data={buku.stokTransaksi} columns={cols} rowKey={(r) => `${r.tanggal}-${r.tipe}-${r.jumlah}`} />
    </SectionCard>
  );
}

/** AktivitasTab — activity timeline. */
export function AktivitasTab({ buku }: { buku: Buku }) {
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
                  <IconClock className="h-3 w-3 shrink-0" />{a.waktu}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
