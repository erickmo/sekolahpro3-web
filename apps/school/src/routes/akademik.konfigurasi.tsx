import { createFileRoute } from "@tanstack/react-router";
import { type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; jenjang?: string; tahun_ajaran?: string; skala_nilai?: string; metode?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "jenjang", header: "Jenjang", cell: (r) => r.jenjang ?? "—" },
  { key: "tahun_ajaran", header: "TA", cell: (r) => r.tahun_ajaran ?? "—" },
  { key: "skala_nilai", header: "Skala", cell: (r) => r.skala_nilai ?? "—" },
  { key: "metode", header: "Metode", cell: (r) => r.metode ?? "—" },
];

function KonfigPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Akademik"
      title="Konfigurasi Penilaian"
      doctype="Konfigurasi Penilaian"
      fields={["name", "jenjang", "tahun_ajaran", "skala_nilai", "metode"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "tahun_ajaran", dir: "desc" }}
      searchFields={["name"]}
      addLabel="Tambah Konfigurasi"
      onAdd={() => alert("Form konfigurasi (P2)")}
    />
  );
}

export const Route = createFileRoute("/akademik/konfigurasi")({ component: KonfigPage });
