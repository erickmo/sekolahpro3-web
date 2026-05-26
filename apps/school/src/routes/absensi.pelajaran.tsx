import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; tanggal: string; mata_pelajaran?: string; kelas?: string; guru?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "tanggal", header: "Tanggal", sortable: true, cell: (r) => r.tanggal },
  { key: "mata_pelajaran", header: "Mapel", cell: (r) => r.mata_pelajaran ?? "—" },
  { key: "kelas", header: "Kelas", cell: (r) => r.kelas ?? "—" },
  { key: "guru", header: "Guru", cell: (r) => r.guru ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Final" ? "success" : "warning"} dot>{r.status ?? "—"}</Badge> },
];

function AbsensiPelajaranPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Absensi"
      title="Absensi per Pelajaran"
      doctype="Absensi Pelajaran"
      fields={["name", "tanggal", "mata_pelajaran", "guru"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "tanggal", dir: "desc" }}
      searchFields={["name", "mata_pelajaran"]}
      addLabel="Input Absensi"
      onAdd={() => alert("Form absensi pelajaran (P2)")}
    />
  );
}

export const Route = createFileRoute("/absensi/pelajaran")({ component: AbsensiPelajaranPage });
