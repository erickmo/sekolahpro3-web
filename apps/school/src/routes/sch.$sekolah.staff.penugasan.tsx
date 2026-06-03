import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { PageGuide } from "../components/guide";
import { STAFF_PAGE_GUIDES } from "../components/staff/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";
import { ResourceCreateModal } from "../components/shared/ResourceCreateModal";
import { PENUGASAN_GURU_FIELDS } from "../components/guru-extra/sub-fields";
import { BuatSkMengajarButton } from "../features/pegawai/PegawaiActions";

type Row = {
  name: string;
  guru: string;
  tahun_ajaran?: string;
  semester?: string;
  total_jjm?: number;
  status?: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "guru", header: "Guru", sortable: true, cell: (r) => r.guru },
  { key: "tahun_ajaran", header: "TA", cell: (r) => r.tahun_ajaran ?? "—" },
  { key: "semester", header: "Semester", cell: (r) => <Badge tone="neutral">{r.semester ?? "—"}</Badge> },
  { key: "total_jjm", header: "Total JJM", sortable: true, cell: (r) => r.total_jjm ?? 0 },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
  { key: "sk", header: "SK Mengajar",
    cell: (r) => <BuatSkMengajarButton penugasan={r.name} status={r.status} /> },
];

function PenugasanPage() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-6">
      <PageGuide
        storageNamespace="staff-guide:"
        storageId="penugasan"
        title={STAFF_PAGE_GUIDES.penugasan.title}
        intro={STAFF_PAGE_GUIDES.penugasan.intro}
        steps={STAFF_PAGE_GUIDES.penugasan.steps}
        tips={STAFF_PAGE_GUIDES.penugasan.tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />
      <ResourceListPage<Row>
        eyebrow="Guru"
        title="Penugasan Guru"
        doctype="Penugasan Guru"
        fields={["name", "guru", "tahun_ajaran", "semester", "total_jjm", "status"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "name", dir: "desc" }}
        searchFields={["name", "guru"]}
        addLabel="Buat Penugasan"
        onAdd={() => setOpen(true)}
      />
      <ResourceCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="Penugasan Guru"
        title="Buat Penugasan Guru"
        description="Header penugasan. Detail per-mapel diisi via halaman detail/desk."
        fields={PENUGASAN_GURU_FIELDS}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/staff/penugasan")({ component: PenugasanPage });
