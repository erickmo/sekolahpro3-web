// BukuDetailHeader — presentational hero for the Buku detail page: book cover
// initials, title + status/category badges, identity meta, and the row of
// action buttons. Layer: pure presentation (no data fetch, no routing). State
// and the edit callback are plumbed in as props from the route.
import {
  Badge,
  Button,
  IconBook,
  IconCalendar,
  IconChat,
  IconDownload,
  IconEdit,
  IconFile,
  IconMapPin,
  IconMore,
  IconPrint,
} from "@sekolahpro/ui";
import { stubAction } from "../../lib/stub";
import type { Buku, StatusBuku } from "../../data/perpustakaan";

/** Badge tone per aggregate book status (shared with the Kopi table). */
export const STATUS_TONE: Record<StatusBuku, "success" | "brand" | "neutral" | "warning" | "danger"> = {
  Tersedia: "success",
  Dipinjam: "brand",
  Dipesan: "warning",
  Rusak: "warning",
  Hilang: "danger",
  Arsip: "neutral",
};

/** Max words used to build the cover initials placeholder. */
const MAX_INITIAL_WORDS = 2;
/** Fallback glyph when a title yields no usable initial. */
const INITIAL_FALLBACK = "B";

/** Derive up-to-two-letter initials from a book title for the cover tile. */
export function bukuInisial(judul: string): string {
  const parts = judul.trim().split(/\s+/).slice(0, MAX_INITIAL_WORDS);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || INITIAL_FALLBACK;
}

/**
 * BukuDetailHeader renders the gradient hero block at the top of the detail
 * page. `onEdit` is invoked by the primary Edit button; the remaining buttons
 * are stub actions preserved verbatim from the original route.
 */
export function BukuDetailHeader({ buku, onEdit }: { buku: Buku; onEdit: () => void }) {
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
            <span className="inline-flex items-center gap-1.5"><IconBook className="h-3.5 w-3.5 shrink-0" />{buku.penerbit}</span>
            <span className="inline-flex items-center gap-1.5"><IconCalendar className="h-3.5 w-3.5 shrink-0" />{buku.tahunTerbit}</span>
            <span className="inline-flex items-center gap-1.5"><IconFile className="h-3.5 w-3.5 shrink-0" />{buku.jumlahHalaman} halaman</span>
            <span className="inline-flex items-center gap-1.5"><IconMapPin className="h-3.5 w-3.5 shrink-0" />{buku.lokasi}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => stubAction(`Pinjamkan ${buku.judul}`)}>
            <IconChat className="mr-1.5 h-4 w-4 shrink-0" />Pinjamkan
          </Button>
          <Button variant="outline" size="sm" onClick={() => stubAction(`Cetak Label ${buku.kodeBuku}`)}>
            <IconPrint className="mr-1.5 h-4 w-4 shrink-0" />Cetak Label
          </Button>
          <Button variant="outline" size="sm" onClick={() => stubAction(`Unduh Metadata ${buku.kodeBuku}`)}>
            <IconDownload className="mr-1.5 h-4 w-4 shrink-0" />Unduh
          </Button>
          <Button size="sm" onClick={onEdit}>
            <IconEdit className="mr-1.5 h-4 w-4 shrink-0" />Edit
          </Button>
          <Button variant="outline" size="sm" className="!px-2" onClick={() => stubAction("Aksi lainnya (menu)")}>
            <IconMore className="h-4 w-4 shrink-0" />
          </Button>
        </div>
      </div>
    </div>
  );
}
