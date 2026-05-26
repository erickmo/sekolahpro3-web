import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { PerpCreateModal, type PerpFieldDef } from "../components/perpustakaan/PerpCreateModal";

// Backend DocType: `Kategori Buku`. Minimal taxonomy used as Link target on
// `Buku.kategori`. Detail view is not yet wired — only list + create here.
type Row = {
  name: string;
  nama_kategori?: string;
  parent_kategori?: string;
  deskripsi?: string;
};

const COLUMNS: Column<Row>[] = [
  {
    key: "name",
    header: "ID",
    sortable: true,
    cell: (r) => <span className="font-mono text-xs text-muted-fg">{r.name}</span>,
  },
  {
    key: "nama_kategori",
    header: "Nama Kategori",
    sortable: true,
    cell: (r) => <span className="font-medium text-fg">{r.nama_kategori ?? r.name}</span>,
  },
  {
    key: "parent_kategori",
    header: "Induk",
    cell: (r) =>
      r.parent_kategori ? (
        <Badge tone="neutral">{r.parent_kategori}</Badge>
      ) : (
        <span className="text-xs text-muted-fg">—</span>
      ),
  },
  {
    key: "deskripsi",
    header: "Deskripsi",
    cell: (r) => <span className="text-sm text-muted-fg line-clamp-1">{r.deskripsi ?? "—"}</span>,
  },
];

const CREATE_FIELDS: PerpFieldDef[] = [
  { name: "nama_kategori", label: "Nama Kategori", type: "text", required: true },
  {
    name: "parent_kategori",
    label: "Kategori Induk",
    type: "link",
    linkDoctype: "Kategori Buku",
    linkLabelField: "nama_kategori",
    hint: "Opsional — kosongkan untuk kategori puncak.",
  },
  { name: "deskripsi", label: "Deskripsi", type: "textarea" },
];

function KategoriPage() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Perpustakaan"
        title="Kategori Buku"
        description="Klasifikasi koleksi. Digunakan sebagai filter dan label pada katalog."
        doctype="Kategori Buku"
        fields={["name", "nama_kategori", "parent_kategori", "deskripsi"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "nama_kategori", dir: "asc" }}
        searchFields={["name", "nama_kategori"]}
        addLabel="Tambah Kategori"
        onAdd={() => setOpen(true)}
      />
      <PerpCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="Kategori Buku"
        title="Tambah Kategori Buku"
        description="Buat klasifikasi baru untuk mengelompokkan koleksi."
        fields={CREATE_FIELDS}
      />
    </>
  );
}

export const Route = createFileRoute("/perpustakaan/kategori")({ component: KategoriPage });
