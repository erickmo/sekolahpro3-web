// PERP-ADR-0001 — Buku detail page wires the "Sedang Dipinjam" section to
// active Peminjaman Buku (status Aktif/Terlambat) joined via the Item
// Peminjaman child table 4-tuple filter `[child_dt, field, op, val]`. Each
// row exposes a "Kembalikan" action that opens `ReturnModal`, which submits
// `Pengembalian Buku` and invalidates the peminjaman cache so this view
// refetches automatically.
//
// Presentational blocks (hero, stat panels, eksemplar/peminjaman tables) live
// in components/perpustakaan/* so this route stays a thin composition layer:
// fetch hooks → bukuFromBackend/mapEksemplarToKopi/mapPeminjamanRows → render.
import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate, useParams } from "@tanstack/react-router";
import { stubAction } from "../lib/stub";
import { ReturnModal } from "../components/perpustakaan/ReturnModal";
import {
  Breadcrumb,
  Button,
  DetailPageTemplate,
  EmptyState,
  PageHeader,
  Tabs,
  IconArrowLeft,
  IconBook,
  IconChat,
  IconClock,
  IconFile,
  IconHome,
  IconId,
  IconWallet,
  type TabItem,
} from "@sekolahpro/ui";
import { useResourceDoc, useResourceList } from "@sekolahpro/api-client";
import {
  findBuku,
  type Buku,
  type KopiRow,
} from "../data/perpustakaan";
import { bukuEnrichIsbn } from "../components/perpustakaan/bukuIdentity";
import {
  type BukuDoc,
  type EksemplarDoc,
  type PeminjamanDoc,
  mapEksemplarToKopi,
  mapPeminjamanRows,
  normalizeKategori,
  bukuFromBackend,
} from "../components/perpustakaan/bukuDetail";
import { BukuDetailHeader } from "../components/perpustakaan/BukuDetailHeader";
import { EksemplarTable } from "../components/perpustakaan/EksemplarTable";
import { RiwayatPeminjamanTable } from "../components/perpustakaan/RiwayatPeminjamanTable";
import {
  type TabKey,
  AktivitasTab,
  DetailTab,
  RingkasanTab,
  ReviewTab,
  SedangDipinjamSection,
  StokTab,
} from "../components/perpustakaan/BukuDetailStats";

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

// Max child rows fetched per related list (eksemplar + loans).
const RELATED_PAGE_LENGTH = 200;

// Default rak used when mapping backend eksemplar without a mock lokasi.
const DEFAULT_RAK: KopiRow["lokasi"] = "Rak A";

// Backend↔view mappers, doctype shapes, and the kategori guard live in
// components/perpustakaan/bukuDetail.ts (pure + unit-tested). See PERP-GAP-13.
// Tab panels, the hero, and the per-copy/loan tables are extracted into sibling
// component files; this route only composes them.

function BukuDetailPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  const { isbn } = Route.useParams();
  const search = Route.useSearch();
  const docQ = useResourceDoc<BukuDoc>("Buku", isbn);
  const bukuName = docQ.data?.name ?? isbn;
  const kopiQ = useResourceList<EksemplarDoc>("Eksemplar Buku", {
    fields: ["name", "buku", "nomor_inventaris", "kondisi", "status"],
    filters: { buku: bukuName },
    limit_page_length: RELATED_PAGE_LENGTH,
  });
  const eksemplarNames = (kopiQ.data ?? []).map((e) => e.name);
  // Peminjaman Buku is the loan parent; eksemplar links live on its child
  // rows (Item Peminjaman). Use the 4-tuple `[child_doctype, field, op, val]`
  // filter so Frappe joins on the child without an extra round-trip.
  const pinjQ = useResourceList<PeminjamanDoc>("Peminjaman Buku", {
    fields: ["name", "anggota", "tanggal_pinjam", "tanggal_kembali_rencana", "status"],
    filters: [["Item Peminjaman", "eksemplar", "in", eksemplarNames]],
    limit_page_length: RELATED_PAGE_LENGTH,
  }, { enabled: eksemplarNames.length > 0 });
  // Enrich the demo fixture by the resolved doc's own isbn (PERP-GAP-01): the
  // route param is a docname, so matching the fixture needs the doc's isbn,
  // falling back to the param for direct ISBN deep-links with no backend.
  const mock = findBuku(bukuEnrichIsbn(isbn, docQ.data), sekolah);
  const buku: Buku | undefined = (() => {
    const d = docQ.data;
    // Backend-only path: no mock fixture but doc exists → render from backend.
    if (!mock) {
      if (!d) return undefined;
      const kopi = kopiQ.data ? mapEksemplarToKopi(kopiQ.data, DEFAULT_RAK) : [];
      const peminjaman = pinjQ.data ? mapPeminjamanRows(pinjQ.data) : [];
      // sekolah is the active route slug; Buku.sekolah is a presentation-only,
      // mock-typed field, so the slug is valid by construction here. PERP-GAP-14
      return bukuFromBackend(d, kopi, peminjaman, sekolah as Buku["sekolah"]);
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
      kategori: d.kategori ? normalizeKategori(d.kategori) : mock.kategori,
      deskripsi: d.deskripsi ?? mock.deskripsi,
      kopi: kopiBackend,
      peminjaman: pinjBackend,
    };
  })();
  const navigate = useNavigate();
  const [returnFor, setReturnFor] = useState<string | null>(null);
  const tab: TabKey = VALID_TABS.has(search.tab as TabKey) ? (search.tab as TabKey) : "ringkasan";
  const setTab = (next: TabKey) => {
    navigate({ to: "/sch/$sekolah/perpustakaan/$isbn", params: { sekolah, isbn }, search: { tab: next === "ringkasan" ? undefined : next } });
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
      case "kopi": return <EksemplarTable buku={buku} />;
      case "peminjaman": return <RiwayatPeminjamanTable buku={buku} />;
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
              { label: "Dashboard", render: ({ className, children }) => <Link to="/sch/$sekolah" params={{ sekolah }} className={className}>{children}</Link> },
              { label: "Perpustakaan", render: ({ className, children }) => <Link to="/sch/$sekolah/perpustakaan" params={{ sekolah }} className={className}>{children}</Link> },
              { label: buku.judul },
            ]}
          />
          <PageHeader
            eyebrow="Detail Buku"
            title={buku.judul}
            description={`ISBN ${buku.isbn} · ${buku.kategori} · ${buku.status}`}
            actions={
              <Button variant="outline" onClick={() => navigate({ to: "/sch/$sekolah/perpustakaan", params: { sekolah } })}>
                <IconArrowLeft className="mr-1.5 h-4 w-4 shrink-0" />
                Kembali ke daftar
              </Button>
            }
          />
        </div>
      }
      hero={<BukuDetailHeader buku={buku} onEdit={() => stubAction(`Edit Buku ${buku.kodeBuku}`)} />}
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

export const Route = createFileRoute("/sch/$sekolah/perpustakaan/$isbn")({
  component: BukuDetailPage,
  validateSearch: (raw: Record<string, unknown>): SearchParams => {
    const t = typeof raw.tab === "string" ? raw.tab : undefined;
    return { tab: t && VALID_TABS.has(t as TabKey) ? (t as TabKey) : undefined };
  },
  notFoundComponent: function NotFound() {
    const { sekolah } = useParams({ from: "/sch/$sekolah" });
    return (
    <div className="py-16">
      <EmptyState
        title="Buku tidak ditemukan"
        description="ISBN yang diminta tidak ada di sistem. Periksa kembali atau kembali ke daftar buku."
        action={
          <Link to="/sch/$sekolah/perpustakaan" params={{ sekolah }} className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
            <IconArrowLeft className="h-4 w-4 shrink-0" /> Kembali ke daftar
          </Link>
        }
      />
    </div>
  ); },
});
