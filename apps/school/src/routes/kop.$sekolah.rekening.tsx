import { useState } from "react";
import { createFileRoute, useNavigate, useParams} from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { PermohonanModal } from "../components/koperasi-simpanan/permohonanForms";
import { KoperasiPageGuide } from "../components/koperasi/KoperasiPageGuide";

type Row = {
  name: string;
  anggota?: string;
  nasabah?: string;
  produk?: string;
  produk_simpanan?: string;
  akad?: string;
  saldo?: number;
  status: string;
  tanggal_buka: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "No. Rekening", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nasabah", header: "Anggota", sortable: true, cell: (r) => r.nasabah ?? "—" },
  { key: "produk_simpanan", header: "Produk", cell: (r) => r.produk_simpanan ?? "—" },
  { key: "akad", header: "Akad", cell: (r) => <Badge tone="neutral">{r.akad ?? "—"}</Badge> },
  { key: "saldo", header: "Saldo", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums">Rp {(r.saldo ?? 0).toLocaleString("id-ID")}</span> },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : r.status === "Dormant" ? "warning" : r.status === "Blokir" ? "danger" : "neutral"} dot>{r.status}</Badge> },
  { key: "tanggal_buka", header: "Tgl Buka", sortable: true, cell: (r) => r.tanggal_buka },
];

function RekeningPage() {
  const { sekolah } = useParams({ from: "/kop/$sekolah" });

  const navigate = useNavigate();
  const [openBuka, setOpenBuka] = useState(false);
  return (
    <>
      <KoperasiPageGuide id="rekening" />
      <ResourceListPage<Row>
        eyebrow="Koperasi"
        title="Rekening Simpanan"
        description="Kelola rekening simpanan anggota (Wadiah / Mudharabah)."
        doctype="Rekening Simpanan"
        fields={["name", "nasabah", "produk_simpanan", "saldo", "status", "tanggal_buka"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "tanggal_buka", dir: "desc" }}
        searchFields={["name", "nasabah"]}
        selectFilters={[
          { key: "status", label: "Status", field: "status",
            options: ["Semua", "Aktif", "Dormant", "Blokir", "Tutup"].map((v) => ({ value: v, label: v })) },
        ]}
        addLabel="Buka Rekening"
        onAdd={() => setOpenBuka(true)}
        onRowClick={(r) => navigate({ to: "/kop/$sekolah/rekening/$name", params: { sekolah, name: r.name } })}
      />
      <PermohonanModal kind="buka" open={openBuka} onClose={() => setOpenBuka(false)} />
    </>
  );
}

export const Route = createFileRoute("/kop/$sekolah/rekening")({ component: RekeningPage });
