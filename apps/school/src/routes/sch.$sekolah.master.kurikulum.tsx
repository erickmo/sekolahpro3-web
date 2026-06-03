import { useState } from "react";
import { createFileRoute, useNavigate, useParams} from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { CreateResourceModal, type FieldSpec } from "../components/akademik/CreateResourceModal";
import { PageGuide } from "../components/guide";
import { MASTER_PAGE_GUIDES } from "../components/master/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

type Row = {
  name: string;
  nama: string;
  tipe_kurikulum?: "K13" | "Merdeka";
  unit_jenjang?: string;
  tahun_berlaku?: string;
  is_aktif?: 0 | 1;
};

const TIPE_OPTIONS = [
  { value: "K13", label: "K13" },
  { value: "Merdeka", label: "Merdeka" },
];

const TIPE_TONE: Record<string, "brand" | "success"> = {
  K13: "brand",
  Merdeka: "success",
};

const COLUMNS: Column<Row>[] = [
  { key: "nama", header: "Nama Kurikulum", sortable: true, cell: (r) => r.nama },
  {
    key: "tipe_kurikulum",
    header: "Tipe",
    cell: (r) =>
      r.tipe_kurikulum ? (
        <Badge tone={TIPE_TONE[r.tipe_kurikulum] ?? "neutral"}>{r.tipe_kurikulum}</Badge>
      ) : (
        "—"
      ),
  },
  { key: "unit_jenjang", header: "Unit Jenjang", cell: (r) => r.unit_jenjang ?? "—" },
  { key: "tahun_berlaku", header: "Tahun Berlaku", cell: (r) => r.tahun_berlaku ?? "—" },
  {
    key: "is_aktif",
    header: "Status",
    cell: (r) =>
      r.is_aktif ? (
        <Badge tone="success" dot>Aktif</Badge>
      ) : (
        <Badge tone="neutral" dot>Nonaktif</Badge>
      ),
  },
];

const FIELDS: FieldSpec[] = [
  { name: "nama", label: "Nama Kurikulum", required: true, colSpan: 2, placeholder: "Kurikulum Merdeka SMA 2024/2025" },
  {
    name: "tipe_kurikulum",
    label: "Tipe Kurikulum",
    kind: "select",
    required: true,
    options: TIPE_OPTIONS,
  },
  {
    name: "unit_jenjang",
    label: "Unit Jenjang",
    kind: "link",
    required: true,
    linkDoctype: "Unit Jenjang",
    linkLabelField: "nama",
  },
  {
    name: "tahun_berlaku",
    label: "Tahun Berlaku",
    kind: "link",
    required: true,
    linkDoctype: "Tahun Ajaran",
    linkLabelField: "nama",
  },
  { name: "is_aktif", label: "Aktifkan kurikulum ini", kind: "checkbox", defaultValue: true },
  { name: "keterangan", label: "Keterangan", kind: "textarea", colSpan: 2 },
];

function KurikulumPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  const navigate = useNavigate();
  const [openCreate, setOpenCreate] = useState(false);
  return (
    <div className="space-y-6">
      <PageGuide
        storageNamespace="master-guide:"
        storageId="kurikulum"
        title={MASTER_PAGE_GUIDES.kurikulum.title}
        intro={MASTER_PAGE_GUIDES.kurikulum.intro}
        steps={MASTER_PAGE_GUIDES.kurikulum.steps}
        tips={MASTER_PAGE_GUIDES.kurikulum.tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />
      <ResourceListPage<Row>
        eyebrow="Akademik"
        title="Kurikulum"
        doctype="Kurikulum"
        fields={["name", "nama", "tipe_kurikulum", "unit_jenjang", "tahun_berlaku", "is_aktif"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "tahun_berlaku", dir: "desc" }}
        searchFields={["name", "nama"]}
        selectFilters={[
          {
            key: "tipe_kurikulum",
            field: "tipe_kurikulum",
            label: "Tipe",
            options: TIPE_OPTIONS,
          },
        ]}
        addLabel="Tambah Kurikulum"
        onAdd={() => setOpenCreate(true)}
        onRowClick={(r) => navigate({ to: "/sch/$sekolah/master/kurikulum/$name", params: { sekolah, name: r.name } })}
      />
      <CreateResourceModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        doctype="Kurikulum"
        title="Tambah Kurikulum"
        description="Buat versi kurikulum baru per unit jenjang & tahun ajaran."
        fields={FIELDS}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/master/kurikulum")({ component: KurikulumPage });
