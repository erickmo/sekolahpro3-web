import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { PerpCreateModal, type PerpFieldDef } from "../components/perpustakaan/PerpCreateModal";

// Verified fields on `Buku` doctype:
// judul (Data), isbn (Data), pengarang (Data), penerbit (Data),
// tahun_terbit (Int), kategori (Link Kategori Buku), deskripsi, cover.
// Stok/availability lives on `Eksemplar Buku` (per-copy) — surfaced on the
// detail page, not aggregated here to avoid an N+1 list fetch.
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

const CREATE_FIELDS: PerpFieldDef[] = [
  { name: "judul", label: "Judul", type: "text", required: true },
  { name: "isbn", label: "ISBN", type: "text" },
  { name: "pengarang", label: "Pengarang", type: "text" },
  { name: "penerbit", label: "Penerbit", type: "text" },
  { name: "tahun_terbit", label: "Tahun Terbit", type: "number" },
  {
    name: "kategori",
    label: "Kategori",
    type: "link",
    linkDoctype: "Kategori Buku",
    linkLabelField: "nama_kategori",
  },
  { name: "deskripsi", label: "Deskripsi", type: "textarea" },
];

function PerpustakaanListPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <>
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
        onAdd={() => setOpen(true)}
        onRowClick={(r) => navigate({ to: "/perpustakaan/$isbn", params: { isbn: r.isbn ?? r.name } })}
      />
      <PerpCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="Buku"
        title="Tambah Buku"
        description="Catat koleksi baru. Tambahkan eksemplar lewat halaman detail buku."
        fields={CREATE_FIELDS}
        submitLabel="Simpan"
        onCreated={(doc) => {
          const isbn = (doc as { isbn?: string; name?: string }).isbn;
          const name = (doc as { name?: string }).name;
          const target = isbn ?? name;
          if (target) navigate({ to: "/perpustakaan/$isbn", params: { isbn: target } });
        }}
      />
    </>
  );
}

export const Route = createFileRoute("/perpustakaan/daftar")({ component: PerpustakaanListPage });
