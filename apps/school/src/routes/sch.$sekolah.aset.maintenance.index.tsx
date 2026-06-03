import { useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { MaintenanceFormModal } from "../components/aset/MaintenanceFormModal";
import { PageGuide } from "../components/guide";
import { ASET_PAGE_GUIDES } from "../components/aset/pageGuides";
import { maintenanceStatusTone, prioritasTone } from "../lib/aset/badges";
import { ROLE_LABEL } from "../lib/aset/role";

type Row = {
  name: string;
  nama_aset?: string;
  aset?: string;
  prioritas?: string;
  jenis?: string;
  tanggal_lapor?: string;
  status?: string;
};

const FIELDS = ["name", "nama_aset", "aset", "prioritas", "jenis", "tanggal_lapor", "status"];

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama_aset", header: "Aset", cell: (r) => r.nama_aset ?? r.aset ?? "—" },
  { key: "prioritas", header: "Prioritas", cell: (r) => <Badge tone={prioritasTone(r.prioritas)} dot>{r.prioritas ?? "—"}</Badge> },
  { key: "jenis", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis ?? "—"}</Badge> },
  { key: "tanggal_lapor", header: "Lapor", cell: (r) => r.tanggal_lapor ?? "—" },
  { key: "status", header: "Status", cell: (r) => <Badge tone={maintenanceStatusTone(r.status)} dot>{r.status ?? "—"}</Badge> },
];

function MaintenanceListPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  return (
    <div className="space-y-6">
      <PageGuide
        storageId="aset-maintenance"
        storageNamespace="aset-guide:"
        title={ASET_PAGE_GUIDES.maintenance.title}
        intro={ASET_PAGE_GUIDES.maintenance.intro}
        steps={ASET_PAGE_GUIDES.maintenance.steps}
        tips={ASET_PAGE_GUIDES.maintenance.tips}
        roleLabels={ROLE_LABEL}
      />
      <ResourceListPage<Row>
        eyebrow="Manajemen Aset"
        title="Maintenance Aset"
        description="Tiket perbaikan & servis aset."
        doctype="Permintaan Maintenance Aset"
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
            options: ["Semua", "Dilaporkan", "Dijadwalkan", "Dikerjakan", "Selesai", "Dibatalkan"].map((v) => ({ value: v, label: v })),
          },
          {
            key: "prioritas",
            label: "Prioritas",
            field: "prioritas",
            options: ["Semua", "Rendah", "Sedang", "Tinggi", "Kritis"].map((v) => ({ value: v, label: v })),
          },
        ]}
        onAdd={() => setShowCreate(true)}
        addLabel="Lapor Maintenance"
        onRowClick={(r) => navigate({ to: "/sch/$sekolah/aset/maintenance/$name", params: { sekolah, name: r.name } })}
      />
      <MaintenanceFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/aset/maintenance/")({ component: MaintenanceListPage });
