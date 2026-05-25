import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

// Verified fields on `Buku` doctype:
// judul (Data), isbn (Data), pengarang (Data), penerbit (Data),
// tahun_terbit (Int), kategori (Link Kategori Buku), deskripsi, cover.
// NOTE: stock/availability is on `Eksemplar Buku` (per-copy), not Buku itself —
// TODO: compute stok via a child-list fetch or backend report.
type Row = {
  name: string;
  judul?: string;
  isbn?: string;
  pengarang?: string;
  penerbit?: string;
  tahun_terbit?: number;
  kategori?: string;
};

const COLUMNS: Column<Row>[] = [
  {
    key: "judul",
    header: "Judul",
    sortable: true,
    cell: (r) => (
      <div className="min-w-0">
        <div className="font-medium text-fg truncate">{r.judul ?? r.name}</div>
        <div className="text-xs text-muted-fg truncate">{r.pengarang ?? "—"}</div>
      </div>
    ),
  },
  {
    key: "isbn",
    header: "ISBN",
    sortable: true,
    cell: (r) => <span className="font-mono text-xs">{r.isbn ?? "—"}</span>,
  },
  {
    key: "kategori",
    header: "Kategori",
    sortable: true,
    cell: (r) =>
      r.kategori ? <Badge tone="neutral">{r.kategori}</Badge> : <span className="text-xs text-muted-fg">—</span>,
  },
  {
    key: "penerbit",
    header: "Penerbit",
    sortable: true,
    cell: (r) => <span className="text-sm">{r.penerbit ?? "—"}</span>,
  },
  {
    key: "tahun_terbit",
    header: "Tahun",
    sortable: true,
    align: "right",
    cell: (r) => <span className="text-sm tabular-nums">{r.tahun_terbit ?? "—"}</span>,
  },
];

function PerpustakaanListPage() {
  const navigate = useNavigate();
  return (
    <ResourceListPage<Row>
      eyebrow="Layanan"
      title="Perpustakaan"
      description="Kelola koleksi buku, peminjaman, dan pengembalian."
      doctype="Buku"
      fields={["name", "judul", "isbn", "pengarang", "penerbit", "tahun_terbit", "kategori"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "judul", dir: "asc" }}
      searchFields={["name", "judul", "isbn", "pengarang"]}
      addLabel="Tambah Buku"
      onAdd={() => alert("Form buku (TODO)")}
      onRowClick={(r) => navigate({ to: "/perpustakaan/$isbn", params: { isbn: r.isbn ?? r.name } })}
    />
  );
}

export const Route = createFileRoute("/perpustakaan/daftar")({ component: PerpustakaanListPage });
