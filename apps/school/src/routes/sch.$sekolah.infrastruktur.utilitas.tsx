import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { PageGuide } from "../components/guide";
import { INFRASTRUKTUR_PAGE_GUIDES } from "../components/infrastruktur/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

// Read-only. Klik baris membuka detail gedung pemiliknya.
type Row = { name: string; gedung?: string; jenis?: string; provider?: string; nomor_pelanggan?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "gedung", header: "Gedung", sortable: true, cell: (r) => r.gedung ?? "—" },
  { key: "jenis", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis ?? "—"}</Badge> },
  { key: "provider", header: "Provider", cell: (r) => r.provider ?? "—" },
  { key: "nomor_pelanggan", header: "No. Pelanggan", cell: (r) => <span className="font-mono text-xs">{r.nomor_pelanggan ?? "—"}</span> },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function UtilitasPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageGuide
        storageNamespace="infrastruktur-guide:"
        storageId="utilitas"
        title={INFRASTRUKTUR_PAGE_GUIDES.utilitas.title}
        intro={INFRASTRUKTUR_PAGE_GUIDES.utilitas.intro}
        steps={INFRASTRUKTUR_PAGE_GUIDES.utilitas.steps}
        tips={INFRASTRUKTUR_PAGE_GUIDES.utilitas.tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />
      <ResourceListPage<Row>
      eyebrow="Infrastruktur"
      title="Utilitas Gedung"
      description="Read-only. PLN, PDAM, internet, gas, dll. Klik baris untuk membuka detail gedung."
      doctype="Utilitas Gedung"
      fields={["name", "gedung", "jenis", "provider", "nomor_pelanggan", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "gedung", dir: "asc" }}
      searchFields={["name", "gedung", "provider"]}
      selectFilters={[
        { key: "jenis", label: "Jenis", field: "jenis",
          options: ["Semua", "Listrik", "Air", "Internet", "Gas", "Lainnya"].map((v) => ({ value: v, label: v })) },
      ]}
      onRowClick={(r) =>
        r.gedung &&
        navigate({ to: "/sch/$sekolah/infrastruktur/daftar-gedung/$gedungId", params: { sekolah, gedungId: r.gedung } })
      }
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/infrastruktur/utilitas")({ component: UtilitasPage });
