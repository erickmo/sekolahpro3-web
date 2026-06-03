import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { PageGuide } from "../components/guide";
import { INFRASTRUKTUR_PAGE_GUIDES } from "../components/infrastruktur/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

// Read-only. Pembuatan/edit Lantai dilakukan lewat modul terkait; di sini hanya
// untuk melihat & menelusuri. Klik baris membuka detail gedung pemiliknya.
type Row = { name: string; gedung?: string; nomor_lantai?: number; nama?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "gedung", header: "Gedung", sortable: true, cell: (r) => r.gedung ?? "—" },
  { key: "nomor_lantai", header: "Nomor", align: "right", cell: (r) => r.nomor_lantai ?? "—" },
  { key: "nama", header: "Nama", cell: (r) => r.nama ?? "—" },
];

function LantaiPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageGuide
        storageNamespace="infrastruktur-guide:"
        storageId="lantai"
        title={INFRASTRUKTUR_PAGE_GUIDES.lantai.title}
        intro={INFRASTRUKTUR_PAGE_GUIDES.lantai.intro}
        steps={INFRASTRUKTUR_PAGE_GUIDES.lantai.steps}
        tips={INFRASTRUKTUR_PAGE_GUIDES.lantai.tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />
      <ResourceListPage<Row>
      eyebrow="Infrastruktur"
      title="Lantai"
      description="Read-only. Klik baris untuk membuka detail gedung."
      doctype="Lantai"
      fields={["name", "gedung", "nomor_lantai", "nama"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "gedung", dir: "asc" }}
      searchFields={["name", "gedung"]}
      onRowClick={(r) =>
        r.gedung &&
        navigate({ to: "/sch/$sekolah/infrastruktur/daftar-gedung/$gedungId", params: { sekolah, gedungId: r.gedung } })
      }
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/infrastruktur/lantai")({ component: LantaiPage });
