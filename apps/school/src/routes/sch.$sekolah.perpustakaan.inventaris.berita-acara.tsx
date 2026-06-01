/**
 * Berita Acara Kerusakan Buku — daftar insiden kerusakan / hilang per eksemplar.
 * 1 BA = 1 eksemplar. Lihat PERP-ADR-0006.
 */
import { createFileRoute, useNavigate, useParams} from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { perpFormatRupiah } from "../components/perpustakaan/perpFormatters";

type Row = {
  name: string;
  tanggal_kejadian: string;
  eksemplar: string;
  pelapor?: string;
  jenis_kerusakan?: string;
  keputusan?: string;
  nilai_ganti_rugi?: number;
  docstatus?: number;
};

const KEPUTUSAN_TONE: Record<string, "success" | "danger" | "warning" | "neutral"> = {
  Diperbaiki: "success",
  Hapus: "danger",
  "Ganti Rugi": "warning",
};

const JENIS_TONE: Record<string, "warning" | "danger" | "neutral"> = {
  "Rusak Ringan": "warning",
  "Rusak Berat": "danger",
  "Hilang": "danger",
};

/** Frappe docstatus → label/tone, mirroring the Record-map pattern above. */
const DOCSTATUS_LABEL: Record<number, string> = { 0: "Draft", 1: "Approved", 2: "Batal" };
const DOCSTATUS_TONE: Record<number, "neutral" | "success" | "warning"> = { 0: "neutral", 1: "success", 2: "warning" };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "No. BA", sortable: true,
    cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "tanggal_kejadian", header: "Tanggal", sortable: true, cell: (r) => r.tanggal_kejadian },
  { key: "eksemplar", header: "Eksemplar",
    cell: (r) => <span className="font-mono text-xs">{r.eksemplar}</span> },
  { key: "pelapor", header: "Pelapor", cell: (r) => r.pelapor ?? "—" },
  { key: "jenis_kerusakan", header: "Jenis",
    cell: (r) => r.jenis_kerusakan ? <Badge tone={JENIS_TONE[r.jenis_kerusakan] ?? "neutral"} dot>{r.jenis_kerusakan}</Badge> : <span className="text-muted-fg">—</span> },
  { key: "keputusan", header: "Keputusan",
    cell: (r) => r.keputusan ? <Badge tone={KEPUTUSAN_TONE[r.keputusan] ?? "neutral"} dot>{r.keputusan}</Badge> : <span className="text-muted-fg">— pending —</span> },
  { key: "nilai_ganti_rugi", header: "Ganti Rugi", align: "right", sortable: true,
    cell: (r) => r.nilai_ganti_rugi ? <span className="tabular-nums">{perpFormatRupiah(r.nilai_ganti_rugi)}</span> : <span className="text-muted-fg">—</span> },
  { key: "docstatus", header: "Status",
    cell: (r) => {
      const ds = r.docstatus ?? 0;
      return <Badge tone={DOCSTATUS_TONE[ds] ?? "neutral"} dot>{DOCSTATUS_LABEL[ds] ?? "Draft"}</Badge>;
    } },
];

function BAListPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  const navigate = useNavigate();
  return (
    <ResourceListPage<Row>
      eyebrow="Perpustakaan / Inventaris"
      title="Berita Acara Kerusakan"
      description="Insiden kerusakan / hilang per eksemplar. Draft oleh pustakawan, approve oleh Kepala Perpustakaan."
      doctype="Berita Acara Kerusakan Buku"
      fields={["name", "tanggal_kejadian", "eksemplar", "pelapor", "jenis_kerusakan", "keputusan", "nilai_ganti_rugi", "docstatus"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "tanggal_kejadian", dir: "desc" }}
      searchFields={["name", "eksemplar", "pelapor"]}
      selectFilters={[
        { key: "jenis_kerusakan", label: "Jenis", field: "jenis_kerusakan",
          options: ["Semua", "Rusak Ringan", "Rusak Berat", "Hilang"].map((v) => ({ value: v, label: v })) },
        { key: "keputusan", label: "Keputusan", field: "keputusan",
          options: ["Semua", "Diperbaiki", "Hapus", "Ganti Rugi"].map((v) => ({ value: v, label: v })) },
      ]}
      addLabel="BA Baru"
      onAdd={() => navigate({ to: "/sch/$sekolah/perpustakaan/inventaris/berita-acara/$name", params: { sekolah, name: "new" } })}
      onRowClick={(r) => navigate({ to: "/sch/$sekolah/perpustakaan/inventaris/berita-acara/$name", params: { sekolah, name: r.name } })}
    />
  );
}

export const Route = createFileRoute("/sch/$sekolah/perpustakaan/inventaris/berita-acara")({ component: BAListPage });
