/**
 * Stock Opname Perpustakaan — daftar sesi audit inventaris.
 * Buka sesi baru → langsung masuk scan mode. Lihat PERP-ADR-0004.
 */
import { createFileRoute, useNavigate, useParams} from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = {
  name: string;
  tanggal: string;
  lokasi_rak_filter?: string;
  auditor?: string;
  total_scan?: number;
  total_hilang?: number;
  total_rusak?: number;
  docstatus?: number;
};

const STATUS_TONE: Record<number, "neutral" | "success" | "warning"> = {
  0: "neutral",
  1: "success",
  2: "warning",
};

function statusLabel(ds?: number): string {
  if (ds === 1) return "Selesai";
  if (ds === 2) return "Batal";
  return "Draft";
}

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "No. Opname", sortable: true,
    cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "tanggal", header: "Tanggal", sortable: true, cell: (r) => r.tanggal },
  { key: "lokasi_rak_filter", header: "Filter Rak",
    cell: (r) => r.lokasi_rak_filter ?? <span className="text-muted-fg">— semua —</span> },
  { key: "auditor", header: "Auditor", cell: (r) => r.auditor ?? "—" },
  { key: "total_scan", header: "Discan", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums">{r.total_scan ?? 0}</span> },
  { key: "total_hilang", header: "Hilang", align: "right",
    cell: (r) => <span className="tabular-nums text-rose-600">{r.total_hilang ?? 0}</span> },
  { key: "total_rusak", header: "Rusak", align: "right",
    cell: (r) => <span className="tabular-nums text-amber-600">{r.total_rusak ?? 0}</span> },
  { key: "docstatus", header: "Status",
    cell: (r) => <Badge tone={STATUS_TONE[r.docstatus ?? 0] ?? "neutral"} dot>{statusLabel(r.docstatus)}</Badge> },
];

function OpnameListPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const navigate = useNavigate();
  return (
    <ResourceListPage<Row>
      eyebrow="Perpustakaan / Inventaris"
      title="Stock Opname"
      description="Audit inventaris koleksi via scan eksemplar. Draft disimpan otomatis — bisa dilanjutkan kapan saja."
      doctype="Stock Opname Perpustakaan"
      fields={["name", "tanggal", "lokasi_rak_filter", "auditor", "total_scan", "total_hilang", "total_rusak", "docstatus"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "tanggal", dir: "desc" }}
      searchFields={["name", "lokasi_rak_filter", "auditor"]}
      addLabel="Mulai Opname"
      onAdd={() => navigate({ to: "/$sekolah/perpustakaan/inventaris/opname/$name", params: { sekolah, name: "new" } })}
      onRowClick={(r) => navigate({ to: "/$sekolah/perpustakaan/inventaris/opname/$name", params: { sekolah, name: r.name } })}
    />
  );
}

export const Route = createFileRoute("/$sekolah/perpustakaan/inventaris/opname")({ component: OpnameListPage });
