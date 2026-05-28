import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { PerpCreateModal, type PerpFieldDef } from "../components/perpustakaan/PerpCreateModal";

// Backend DocType: `Kategori Buku`. Minimal taxonomy used as Link target on
// `Buku.kategori`. Detail view is not yet wired — only list + create here.
type Row = {
  name: string;
  nama?: string;
  keterangan?: string;
};

const COLUMNS: Column<Row>[] = [
  {
    key: "name",
    header: "ID",
    sortable: true,
    cell: (r) => <span className="font-mono text-xs text-muted-fg">{r.name}</span>,
  },
  {
    key: "nama",
    header: "Nama Kategori",
    sortable: true,
    cell: (r) => <span className="font-medium text-fg">{r.nama ?? r.name}</span>,
  },
  {
    key: "keterangan",
    header: "Keterangan",
    cell: (r) => <span className="text-sm text-muted-fg line-clamp-1">{r.keterangan ?? "—"}</span>,
  },
];

const CREATE_FIELDS: PerpFieldDef[] = [
  { name: "nama", label: "Nama Kategori", type: "text", required: true },
  { name: "keterangan", label: "Keterangan", type: "textarea" },
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
        fields={["name", "nama", "keterangan"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "nama", dir: "asc" }}
        searchFields={["name", "nama"]}
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

export const Route = createFileRoute("/$sekolah/perpustakaan/kategori")({ component: KategoriPage });
