import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { KategoriFormModal } from "../components/aset/KategoriFormModal";

type Row = { name: string; nama_kategori: string; kode?: string; deskripsi?: string };

const FIELDS = ["name", "nama_kategori", "kode", "deskripsi"];

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama_kategori", header: "Nama Kategori", sortable: true, cell: (r) => r.nama_kategori },
  { key: "kode", header: "Kode", cell: (r) => r.kode ?? "—" },
  { key: "deskripsi", header: "Deskripsi", cell: (r) => <span className="text-muted-fg">{r.deskripsi ?? "—"}</span> },
];

function KategoriPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Manajemen Aset"
        title="Kategori Aset"
        description="Master pengelompokan aset (mis. Alat Olahraga, Elektronik)."
        doctype="Kategori Aset"
        fields={FIELDS}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "nama_kategori", dir: "asc" }}
        searchFields={["name", "nama_kategori"]}
        onAdd={() => setShowCreate(true)}
        addLabel="Tambah Kategori"
      />
      <KategoriFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

export const Route = createFileRoute("/sch/$sekolah/aset/kategori")({ component: KategoriPage });
