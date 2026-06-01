import { createFileRoute, useNavigate, useParams} from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { SiswaGettingStarted } from "../components/siswa/SiswaGettingStarted";
import { summarizeMutasiMasuk, SISWA_STATUS_FIELDS } from "../lib/orang/siswaListSummaries";

// Onboarding steps shown when no incoming transfer has been recorded yet.
const ONBOARDING_STEPS = [
  "Siapkan NISN dan data sekolah asal calon siswa pindahan",
  "Klik Terima Pindahan untuk membuat pengajuan masuk",
  "Verifikasi Dapodik lalu tetapkan rombel tujuan",
];

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
    cell: (r) => <span className="font-mono text-xs">{r.name}</span>,
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
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  const navigate = useNavigate();
  return (
    <ResourceListPage<Row>
      eyebrow="Siswa"
      title="Mutasi Masuk"
      doctype="Mutasi Masuk"
      fields={["name", "siswa_baru", "nisn", "npsn_asal", "nama_sekolah_asal", "tanggal_masuk", "rombel_tujuan", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      summarize={summarizeMutasiMasuk}
      summaryFields={SISWA_STATUS_FIELDS}
      gettingStarted={
        <SiswaGettingStarted
          sekolah={sekolah}
          title="Belum ada mutasi masuk"
          description="Terima siswa pindahan dari sekolah lain dan tempatkan ke rombel."
          steps={ONBOARDING_STEPS}
          primaryAction={{ label: "Terima Pindahan", href: "/sch/$sekolah/siswa/mutasi-masuk/new" }}
        />
      }
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
      onAdd={() => navigate({ to: "/sch/$sekolah/siswa/mutasi-masuk/new", params: { sekolah } })}
    />
  );
}

export const Route = createFileRoute("/sch/$sekolah/siswa/mutasi-masuk")({ component: MutasiMasukPage });
