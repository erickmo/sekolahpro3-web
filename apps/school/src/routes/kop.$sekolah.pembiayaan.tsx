import { useState } from "react";
import { createFileRoute, useNavigate, useParams} from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { AkadCreateModal } from "../components/koperasi-pembiayaan/akadForm";
import { KoperasiPageGuide } from "../components/koperasi/KoperasiPageGuide";

// Row mirrors backend Akad Pembiayaan fields (akad_pembiayaan.json).
type Row = {
  name: string;
  nasabah?: string;
  produk_pembiayaan?: string;
  jumlah_pokok?: number;
  tenor?: number;
  kolektibilitas?: string;
  status: string;
  tanggal_akad: string;
};

const STATUS_TONE: Record<string, "brand" | "success" | "danger" | "neutral"> = {
  Aktif: "brand",
  Lunas: "success",
  Macet: "danger",
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "No. Akad", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nasabah", header: "Nasabah", sortable: true, cell: (r) => r.nasabah ?? "—" },
  { key: "produk_pembiayaan", header: "Produk", cell: (r) => r.produk_pembiayaan ?? "—" },
  { key: "jumlah_pokok", header: "Pokok", align: "right", sortable: true,
    cell: (r) => r.jumlah_pokok !== undefined ? <span className="tabular-nums">Rp {r.jumlah_pokok.toLocaleString("id-ID")}</span> : "—" },
  { key: "tenor", header: "Tenor", align: "right",
    cell: (r) => r.tenor ? <span className="tabular-nums">{r.tenor} bln</span> : "—" },
  { key: "kolektibilitas", header: "Kolektibilitas",
    cell: (r) => r.kolektibilitas ? <Badge tone={r.kolektibilitas.startsWith("1") ? "success" : r.kolektibilitas.startsWith("2") ? "warning" : "danger"}>{r.kolektibilitas}</Badge> : <span className="text-xs text-muted-fg">—</span> },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={STATUS_TONE[r.status] ?? "neutral"} dot>{r.status}</Badge> },
  { key: "tanggal_akad", header: "Tgl Akad", sortable: true, cell: (r) => r.tanggal_akad },
];

function PembiayaanPage() {
  const { sekolah } = useParams({ from: "/kop/$sekolah" });

  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  return (
    <>
      <KoperasiPageGuide id="pembiayaan" />
      <ResourceListPage<Row>
        eyebrow="Koperasi"
        title="Pembiayaan"
        description="Akad pembiayaan: Murabahah, Ijarah, Qardh, Musyarakah."
        doctype="Akad Pembiayaan"
        fields={["name", "nasabah", "produk_pembiayaan", "jumlah_pokok", "tenor", "kolektibilitas", "status", "tanggal_akad"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "tanggal_akad", dir: "desc" }}
        searchFields={["name", "nasabah"]}
        selectFilters={[
          { key: "status", label: "Status", field: "status",
            options: ["Semua", "Aktif", "Lunas", "Macet"].map((v) => ({ value: v, label: v })) },
        ]}
        addLabel="Ajukan Pembiayaan"
        onAdd={() => setCreateOpen(true)}
        onRowClick={(r) => navigate({ to: "/kop/$sekolah/pembiayaan/$name", params: { sekolah, name: r.name } })}
      />
      <AkadCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(name) => navigate({ to: "/kop/$sekolah/pembiayaan/$name", params: { sekolah, name } })}
      />
    </>
  );
}

export const Route = createFileRoute("/kop/$sekolah/pembiayaan")({ component: PembiayaanPage });
