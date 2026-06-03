import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { MasterResourcePage } from "../components/master/MasterResourcePage";
import { UNIT_JENJANG_FIELDS } from "../components/master/schemas";
import { PageGuide } from "../components/guide";
import { MASTER_PAGE_GUIDES } from "../components/master/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

type Row = { name: string; nama: string; tingkat?: string; sekolah?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama", header: "Nama Unit", sortable: true, cell: (r) => r.nama },
  { key: "tingkat", header: "Jenjang", cell: (r) => <Badge tone="neutral">{r.tingkat ?? "—"}</Badge> },
  { key: "sekolah", header: "Sekolah", cell: (r) => r.sekolah ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function UnitJenjangPage() {
  return (
    <div className="space-y-6">
      <PageGuide
        storageNamespace="master-guide:"
        storageId="unit-jenjang"
        title={MASTER_PAGE_GUIDES["unit-jenjang"].title}
        intro={MASTER_PAGE_GUIDES["unit-jenjang"].intro}
        steps={MASTER_PAGE_GUIDES["unit-jenjang"].steps}
        tips={MASTER_PAGE_GUIDES["unit-jenjang"].tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />
      <MasterResourcePage<Row>
        eyebrow="Master Data"
        title="Unit Jenjang"
        doctype="Unit Jenjang"
        fields={["name", "nama", "tingkat", "sekolah", "status"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "nama", dir: "asc" }}
        searchFields={["name", "nama"]}
        addLabel="Tambah Unit"
        detailRoute="/sch/$sekolah/master/unit-jenjang/$name"
        detailParams={(r) => ({ name: r.name })}
        formTitle="Tambah Unit Jenjang"
        formFields={UNIT_JENJANG_FIELDS}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/master/unit-jenjang")({ component: UnitJenjangPage });
