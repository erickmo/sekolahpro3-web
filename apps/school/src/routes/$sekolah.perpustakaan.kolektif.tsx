/**
 * Pinjam Kolektif Kelas — daftar pinjam paket bacaan rombongan.
 * Doctype paralel Peminjaman Buku — beda aturan (tanpa kuota, tanpa denda harian).
 * Lihat PERP-ADR-0007.
 */
import { createFileRoute, Link, useNavigate, useParams} from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = {
  name: string;
  tanggal_pinjam: string;
  tanggal_kembali_rencana?: string;
  guru_penanggung_jawab: string;
  rombongan: string;
  status?: string;
  tujuan?: string;
};

const STATUS_TONE: Record<string, "brand" | "success" | "warning" | "neutral"> = {
  Aktif: "brand",
  Selesai: "success",
  Terlambat: "warning",
  Batal: "neutral",
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "No. Pinjam", sortable: true,
    cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "tanggal_pinjam", header: "Tgl Pinjam", sortable: true, cell: (r) => r.tanggal_pinjam },
  { key: "tanggal_kembali_rencana", header: "Rencana Kembali",
    cell: (r) => r.tanggal_kembali_rencana ?? "—" },
  { key: "guru_penanggung_jawab", header: "Guru PJ", cell: (r) => r.guru_penanggung_jawab },
  { key: "rombongan", header: "Rombel", cell: (r) => r.rombongan },
  { key: "tujuan", header: "Tujuan", cell: (r) => r.tujuan ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={STATUS_TONE[r.status ?? ""] ?? "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function KolektifListPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const navigate = useNavigate();
  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-md border border-border bg-card p-1">
        <Link to="/$sekolah/perpustakaan/peminjaman" params={{ sekolah }}
          className="rounded px-3 py-1.5 text-sm text-muted-fg hover:text-fg">
          Individu
        </Link>
        <span className="rounded bg-brand px-3 py-1.5 text-sm text-white">Kolektif Kelas</span>
      </div>
      <ResourceListPage<Row>
        eyebrow="Perpustakaan"
        title="Pinjam Kolektif Kelas"
        description="Paket bacaan rombongan via guru penanggung jawab. Tanpa kuota maks, tanpa denda harian."
        doctype="Pinjam Kolektif Kelas"
        fields={["name", "tanggal_pinjam", "tanggal_kembali_rencana", "guru_penanggung_jawab", "rombongan", "status", "tujuan"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "tanggal_pinjam", dir: "desc" }}
        searchFields={["name", "guru_penanggung_jawab", "rombongan", "tujuan"]}
        selectFilters={[
          { key: "status", label: "Status", field: "status",
            options: ["Semua", "Aktif", "Selesai", "Terlambat", "Batal"].map((v) => ({ value: v, label: v })) },
        ]}
        addLabel="Pinjam Kolektif Baru"
        onAdd={() => navigate({ to: "/$sekolah/perpustakaan/kolektif/$name", params: { sekolah, name: "new" } })}
        onRowClick={(r) => navigate({ to: "/$sekolah/perpustakaan/kolektif/$name", params: { sekolah, name: r.name } })}
      />
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/perpustakaan/kolektif")({ component: KolektifListPage });
