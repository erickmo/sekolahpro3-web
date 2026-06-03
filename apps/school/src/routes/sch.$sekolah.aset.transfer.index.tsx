import { useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { TransferFormModal } from "../components/aset/TransferFormModal";
import { PageGuide } from "../components/guide";
import { ASET_PAGE_GUIDES } from "../components/aset/pageGuides";
import { ROLE_LABEL } from "../lib/aset/role";

type Row = {
  name: string;
  nama_aset?: string;
  lokasi_asal?: string;
  lokasi_tujuan?: string;
  tanggal?: string;
  status?: string;
};

const FIELDS = ["name", "nama_aset", "lokasi_asal", "lokasi_tujuan", "tanggal", "status"];

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama_aset", header: "Aset", cell: (r) => r.nama_aset ?? "—" },
  { key: "lokasi_asal", header: "Dari", cell: (r) => r.lokasi_asal ?? "—" },
  { key: "lokasi_tujuan", header: "Ke", cell: (r) => r.lokasi_tujuan ?? "—" },
  { key: "tanggal", header: "Tanggal", cell: (r) => r.tanggal ?? "—" },
  { key: "status", header: "Status", cell: (r) => <Badge tone={r.status === "Selesai" ? "success" : "warning"} dot>{r.status ?? "—"}</Badge> },
];

function TransferListPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  return (
    <div className="space-y-6">
      <PageGuide
        storageId="aset-transfer"
        storageNamespace="aset-guide:"
        title={ASET_PAGE_GUIDES.transfer.title}
        intro={ASET_PAGE_GUIDES.transfer.intro}
        steps={ASET_PAGE_GUIDES.transfer.steps}
        tips={ASET_PAGE_GUIDES.transfer.tips}
        roleLabels={ROLE_LABEL}
      />
      <ResourceListPage<Row>
        eyebrow="Manajemen Aset"
        title="Transfer Aset"
        description="Pemindahan aset antar lokasi penyimpanan (mutasi gudang)."
        doctype="Transfer Aset"
        fields={FIELDS}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "modified", dir: "desc" }}
        searchFields={["name", "nama_aset"]}
        selectFilters={[
          {
            key: "status",
            label: "Status",
            field: "status",
            options: ["Semua", "Draft", "Selesai"].map((v) => ({ value: v, label: v })),
          },
        ]}
        onAdd={() => setShowCreate(true)}
        addLabel="Buat Transfer"
        onRowClick={(r) => navigate({ to: "/sch/$sekolah/aset/transfer/$name", params: { sekolah, name: r.name } })}
      />
      <TransferFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/aset/transfer/")({ component: TransferListPage });
