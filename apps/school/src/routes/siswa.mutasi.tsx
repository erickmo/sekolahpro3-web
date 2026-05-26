import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; siswa: string; jenis_mutasi: string; tanggal_efektif: string; status: string; alasan?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "siswa", header: "Siswa", sortable: true, cell: (r) => r.siswa },
  { key: "jenis_mutasi", header: "Jenis",
    cell: (r) => <Badge tone={r.jenis_mutasi === "Masuk" ? "success" : r.jenis_mutasi === "Keluar" ? "danger" : "neutral"}>{r.jenis_mutasi}</Badge> },
  { key: "tanggal_efektif", header: "Tgl Efektif", sortable: true, cell: (r) => r.tanggal_efektif },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Disetujui" ? "success" : r.status === "Pengajuan" ? "warning" : r.status === "Ditolak" ? "danger" : "neutral"} dot>{r.status}</Badge> },
];

function MutasiPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Siswa"
      title="Mutasi Siswa"
      doctype="Mutasi Siswa"
      fields={["name", "siswa", "jenis_mutasi"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "name", dir: "desc" }}
      searchFields={["name", "siswa"]}
      selectFilters={[
        { key: "jenis", label: "Jenis", field: "jenis_mutasi",
          options: ["Semua", "Masuk", "Keluar", "Naik Kelas", "Pindah Kelas"].map((v) => ({ value: v, label: v })) },
      ]}
      addLabel="Ajukan Mutasi"
      onAdd={() => alert("Form mutasi (P2)")}
    />
  );
}

export const Route = createFileRoute("/siswa/mutasi")({ component: MutasiPage });
