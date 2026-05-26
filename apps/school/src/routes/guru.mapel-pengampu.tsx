import { createFileRoute } from "@tanstack/react-router";
import { type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; guru: string; mata_pelajaran?: string; kelas?: string; tahun_ajaran?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "guru", header: "Guru", sortable: true, cell: (r) => r.guru },
  { key: "mata_pelajaran", header: "Mapel", cell: (r) => r.mata_pelajaran ?? "—" },
  { key: "kelas", header: "Kelas", cell: (r) => r.kelas ?? "—" },
  { key: "tahun_ajaran", header: "TA", cell: (r) => r.tahun_ajaran ?? "—" },
];

function MapelPengampuPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Guru"
      title="Mapel Pengampu"
      description="Pemetaan guru ↔ mata pelajaran ↔ kelas."
      doctype="Mapel Pengampu Guru"
      fields={["name", "mata_pelajaran"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "name", dir: "asc" }}
      searchFields={["name", "mata_pelajaran"]}
      addLabel="Tetapkan Pengampu"
      onAdd={() => alert("Form mapel pengampu (P2)")}
    />
  );
}

export const Route = createFileRoute("/guru/mapel-pengampu")({ component: MapelPengampuPage });
