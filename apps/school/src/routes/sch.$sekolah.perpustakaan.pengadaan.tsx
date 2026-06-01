/**
 * Pengadaan Buku — daftar pengadaan koleksi (Pembelian / Hibah / Sumbangan).
 * Submit pengadaan auto-generate N Eksemplar Buku per item; lihat PERP-ADR-0005.
 */
import { createFileRoute, useNavigate, useParams} from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { PerpPageGuide } from "../components/perpustakaan/PerpPageGuide";
import { perpFormatRupiah } from "../components/perpustakaan/perpFormatters";

type Row = {
  name: string;
  tanggal_pengadaan: string;
  sumber: string;
  vendor?: string;
  nomor_dokumen?: string;
  total_biaya?: number;
  total_eksemplar?: number;
  docstatus?: number;
};

const SUMBER_TONE: Record<string, "brand" | "success" | "warning" | "neutral"> = {
  Pembelian: "brand",
  Hibah: "success",
  Sumbangan: "warning",
};

const STATUS_TONE: Record<number, "neutral" | "brand" | "success"> = {
  0: "neutral",
  1: "success",
  2: "warning" as never,
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "No. Pengadaan", sortable: true,
    cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "tanggal_pengadaan", header: "Tanggal", sortable: true, cell: (r) => r.tanggal_pengadaan },
  { key: "sumber", header: "Sumber",
    cell: (r) => <Badge tone={SUMBER_TONE[r.sumber] ?? "neutral"} dot>{r.sumber}</Badge> },
  { key: "vendor", header: "Vendor / Penyumbang", cell: (r) => r.vendor ?? "—" },
  { key: "nomor_dokumen", header: "No. Dokumen",
    cell: (r) => <span className="font-mono text-xs">{r.nomor_dokumen ?? "—"}</span> },
  { key: "total_eksemplar", header: "Eksemplar", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums">{r.total_eksemplar ?? 0}</span> },
  { key: "total_biaya", header: "Total Biaya", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums">{perpFormatRupiah(r.total_biaya)}</span> },
  { key: "docstatus", header: "Status",
    cell: (r) => {
      const ds = r.docstatus ?? 0;
      const label = ds === 1 ? "Submit" : ds === 2 ? "Batal" : "Draft";
      return <Badge tone={STATUS_TONE[ds] ?? "neutral"} dot>{label}</Badge>;
    } },
];

function PengadaanPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  const navigate = useNavigate();
  return (
    <>
    <PerpPageGuide id="pengadaan" />
    <ResourceListPage<Row>
      eyebrow="Perpustakaan"
      title="Pengadaan Buku"
      description="Catat pembelian, hibah, atau sumbangan koleksi. Submit akan generate eksemplar otomatis."
      doctype="Pengadaan Buku"
      fields={["name", "tanggal_pengadaan", "sumber", "vendor", "nomor_dokumen", "total_biaya", "total_eksemplar", "docstatus"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "tanggal_pengadaan", dir: "desc" }}
      searchFields={["name", "vendor", "nomor_dokumen"]}
      selectFilters={[
        { key: "sumber", label: "Sumber", field: "sumber",
          options: ["Semua", "Pembelian", "Hibah", "Sumbangan"].map((v) => ({ value: v, label: v })) },
      ]}
      addLabel="Pengadaan Baru"
      onAdd={() => navigate({ to: "/sch/$sekolah/perpustakaan/pengadaan/$name", params: { sekolah, name: "new" } })}
      onRowClick={(r) => navigate({ to: "/sch/$sekolah/perpustakaan/pengadaan/$name", params: { sekolah, name: r.name } })}
    />
    </>
  );
}

export const Route = createFileRoute("/sch/$sekolah/perpustakaan/pengadaan")({ component: PengadaanPage });
