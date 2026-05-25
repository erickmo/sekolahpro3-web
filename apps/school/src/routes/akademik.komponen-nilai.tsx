import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; nama_komponen: string; jenis?: string; bobot?: number; tahun_ajaran?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama_komponen", header: "Komponen", sortable: true, cell: (r) => r.nama_komponen },
  { key: "jenis", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis ?? "—"}</Badge> },
  { key: "bobot", header: "Bobot %", align: "right", sortable: true,
    cell: (r) => r.bobot !== undefined ? <span className="tabular-nums">{r.bobot}%</span> : "—" },
  { key: "tahun_ajaran", header: "TA", cell: (r) => r.tahun_ajaran ?? "—" },
];

function KomponenNilaiPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Akademik"
      title="Komponen Nilai"
      description="Definisi komponen penilaian (UH, UTS, UAS, Tugas, dll)."
      doctype="Komponen Nilai"
      fields={["name", "nama_komponen", "jenis", "bobot", "tahun_ajaran"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "nama_komponen", dir: "asc" }}
      searchFields={["name", "nama_komponen"]}
      addLabel="Tambah Komponen"
      onAdd={() => alert("Form komponen nilai (P2)")}
    />
  );
}

export const Route = createFileRoute("/akademik/komponen-nilai")({ component: KomponenNilaiPage });
