import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = {
  name: string;
  status?: string;
  gelombang_ppdb?: string;
  calon_siswa?: string;
  tanggal_daftar?: string;
};

const TONE_BY_STATUS: Record<string, "success" | "brand" | "neutral" | "warning" | "danger"> = {
  Diterima: "success",
  Lulus: "success",
  Verifikasi: "brand",
  Tes: "brand",
  "Daftar Ulang": "brand",
  "Tidak Lulus": "danger",
  "Mengundurkan Diri": "danger",
  Draft: "neutral",
  Terkirim: "warning",
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "No. Pendaftaran", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "calon_siswa", header: "Calon Siswa", sortable: true, cell: (r) => r.calon_siswa ?? "—" },
  { key: "gelombang_ppdb", header: "Gelombang", cell: (r) => r.gelombang_ppdb ?? "—" },
  { key: "tanggal_daftar", header: "Tanggal Daftar", sortable: true, cell: (r) => r.tanggal_daftar ?? "—" },
  {
    key: "status",
    header: "Status",
    cell: (r) => <Badge tone={TONE_BY_STATUS[r.status ?? ""] ?? "neutral"} dot>{r.status ?? "—"}</Badge>,
  },
];

function PpdbListPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Penerimaan"
      title="Pendaftaran PPDB"
      doctype="Pendaftaran PPDB"
      fields={["name", "status", "gelombang_ppdb", "calon_siswa", "tanggal_daftar"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "tanggal_daftar", dir: "desc" }}
      searchFields={["name", "calon_siswa"]}
      selectFilters={[
        {
          key: "status",
          label: "Status",
          field: "status",
          options: ["Semua", "Draft", "Terkirim", "Verifikasi", "Tes", "Lulus", "Tidak Lulus", "Daftar Ulang", "Diterima", "Mengundurkan Diri"].map((v) => ({ value: v, label: v })),
        },
      ]}
      addLabel="Tambah Pendaftar"
      onAdd={() => alert("Form pendaftaran (P2)")}
    />
  );
}

export const Route = createFileRoute("/ppdb/daftar")({ component: PpdbListPage });
