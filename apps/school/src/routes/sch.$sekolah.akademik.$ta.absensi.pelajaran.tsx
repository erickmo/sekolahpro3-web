import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { AbsensiPelajaranFormModal } from "../components/absensi/AbsensiPelajaranFormModal";
import { PageGuide } from "../components/guide";
import { ABSENSI_PAGE_GUIDES } from "../components/absensi/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

type Row = { name: string; tanggal: string; mata_pelajaran?: string; kelas?: string; guru?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "tanggal", header: "Tanggal", sortable: true, cell: (r) => r.tanggal },
  { key: "mata_pelajaran", header: "Mapel", cell: (r) => r.mata_pelajaran ?? "—" },
  { key: "kelas", header: "Kelas", cell: (r) => r.kelas ?? "—" },
  { key: "guru", header: "Guru", cell: (r) => r.guru ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Final" ? "success" : "warning"} dot>{r.status ?? "—"}</Badge> },
];

function AbsensiPelajaranPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <>
      <PageGuide
        storageNamespace="absensi-guide:"
        storageId="pelajaran"
        title={ABSENSI_PAGE_GUIDES.pelajaran.title}
        intro={ABSENSI_PAGE_GUIDES.pelajaran.intro}
        steps={ABSENSI_PAGE_GUIDES.pelajaran.steps}
        tips={ABSENSI_PAGE_GUIDES.pelajaran.tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />
      <ResourceListPage<Row>
        eyebrow="Absensi"
        title="Absensi per Pelajaran"
        doctype="Absensi Pelajaran"
        fields={["name", "tanggal", "mata_pelajaran", "guru"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "tanggal", dir: "desc" }}
        searchFields={["name", "mata_pelajaran"]}
        addLabel="Input Absensi"
        onAdd={() => setShowCreate(true)}
      />
      <AbsensiPelajaranFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/$ta/absensi/pelajaran")({ component: AbsensiPelajaranPage });
