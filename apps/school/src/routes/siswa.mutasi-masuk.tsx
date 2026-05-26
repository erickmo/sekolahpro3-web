import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = {
  name: string;
  siswa_baru: string;
  nisn: string;
  npsn_asal: string;
  nama_sekolah_asal: string;
  tanggal_masuk: string;
  rombel_tujuan: string;
  status: "Diajukan" | "Diverifikasi Dapodik" | "Diterima" | "Ditolak";
};

const STATUS_TONE: Record<Row["status"], "success" | "warning" | "danger" | "neutral"> = {
  Diterima: "success",
  Ditolak: "danger",
  "Diverifikasi Dapodik": "warning",
  Diajukan: "neutral",
};

const COLUMNS: Column<Row>[] = [
  {
    key: "name",
    header: "ID",
    sortable: true,
    cell: (r) => (
      <Link
        to="/siswa/mutasi-masuk/$id"
        params={{ id: r.name }}
        className="font-mono text-xs text-brand hover:underline"
      >
        {r.name}
      </Link>
    ),
  },
  { key: "siswa_baru", header: "Nama", sortable: true, cell: (r) => r.siswa_baru },
  { key: "nisn", header: "NISN", cell: (r) => <span className="font-mono text-xs">{r.nisn}</span> },
  { key: "nama_sekolah_asal", header: "Sekolah Asal", cell: (r) => r.nama_sekolah_asal },
  { key: "tanggal_masuk", header: "Tgl Masuk", sortable: true, cell: (r) => r.tanggal_masuk },
  { key: "rombel_tujuan", header: "Rombel Tujuan", cell: (r) => r.rombel_tujuan ?? "—" },
  {
    key: "status",
    header: "Status",
    cell: (r) => (
      <Badge tone={STATUS_TONE[r.status]} dot>
        {r.status}
      </Badge>
    ),
  },
];

function MutasiMasukPage() {
  const navigate = useNavigate();
  return (
    <ResourceListPage<Row>
      eyebrow="Siswa"
      title="Mutasi Masuk"
      doctype="Mutasi Masuk"
      fields={["name", "siswa_baru", "nisn", "npsn_asal", "nama_sekolah_asal", "tanggal_masuk", "rombel_tujuan", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "name", dir: "desc" }}
      searchFields={["name", "siswa_baru", "nisn"]}
      selectFilters={[
        {
          key: "status",
          label: "Status",
          field: "status",
          options: ["Semua", "Diajukan", "Diverifikasi Dapodik", "Diterima", "Ditolak"].map((v) => ({
            value: v,
            label: v,
          })),
        },
      ]}
      addLabel="Terima Pindahan"
      onAdd={() => navigate({ to: "/siswa/mutasi-masuk/new" })}
    />
  );
}

export const Route = createFileRoute("/siswa/mutasi-masuk")({ component: MutasiMasukPage });
