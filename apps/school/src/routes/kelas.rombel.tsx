import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; nama_rombel: string; tingkat?: string; wali_kelas?: string; jumlah_siswa?: number; tahun_ajaran?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama_rombel", header: "Nama Rombel", sortable: true, cell: (r) => r.nama_rombel },
  { key: "tingkat", header: "Tingkat", cell: (r) => <Badge tone="neutral">{r.tingkat ?? "—"}</Badge> },
  { key: "wali_kelas", header: "Wali Kelas", cell: (r) => r.wali_kelas ?? "—" },
  { key: "jumlah_siswa", header: "Siswa", align: "right", cell: (r) => r.jumlah_siswa ?? 0 },
  { key: "tahun_ajaran", header: "TA", cell: (r) => r.tahun_ajaran ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function RombelPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Kelas"
      title="Rombongan Belajar"
      doctype="Rombongan Belajar"
      fields={["name", "nama_rombel", "tingkat", "wali_kelas", "jumlah_siswa", "tahun_ajaran", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "nama_rombel", dir: "asc" }}
      searchFields={["name", "nama_rombel"]}
      addLabel="Buat Rombel"
      onAdd={() => alert("Form rombel (P2)")}
    />
  );
}

export const Route = createFileRoute("/kelas/rombel")({ component: RombelPage });
