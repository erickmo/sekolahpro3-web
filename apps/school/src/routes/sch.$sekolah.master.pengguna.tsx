import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { MasterResourcePage } from "../components/master/MasterResourcePage";
import { PENGGUNA_FIELDS } from "../components/master/schemas";
import { PageGuide } from "../components/guide";
import { MASTER_PAGE_GUIDES } from "../components/master/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

type Row = { name: string; user?: string; role_sekolah?: string; sekolah?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "user", header: "User", cell: (r) => <span className="font-mono text-xs">{r.user ?? "—"}</span> },
  { key: "role_sekolah", header: "Peran", cell: (r) => <Badge tone="neutral">{r.role_sekolah ?? "—"}</Badge> },
  { key: "sekolah", header: "Sekolah", cell: (r) => r.sekolah ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function PenggunaPage() {
  return (
    <div className="space-y-6">
      <PageGuide
        storageNamespace="master-guide:"
        storageId="pengguna"
        title={MASTER_PAGE_GUIDES.pengguna.title}
        intro={MASTER_PAGE_GUIDES.pengguna.intro}
        steps={MASTER_PAGE_GUIDES.pengguna.steps}
        tips={MASTER_PAGE_GUIDES.pengguna.tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />
      <MasterResourcePage<Row>
        eyebrow="Master Data"
        title="Pengguna Sekolah"
        doctype="Pengguna Sekolah"
        fields={["name", "user", "role_sekolah", "sekolah", "status"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "name", dir: "asc" }}
        searchFields={["name", "user"]}
        addLabel="Undang Pengguna"
        detailRoute="/sch/$sekolah/master/pengguna/$name"
        detailParams={(r) => ({ name: r.name })}
        formTitle="Tambah Pengguna Sekolah"
        formFields={PENGGUNA_FIELDS}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/master/pengguna")({ component: PenggunaPage });
