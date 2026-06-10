import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { AbsensiGuruFormModal } from "../components/absensi/AbsensiGuruFormModal";
import { PageGuide } from "../components/guide";
import { ABSENSI_PAGE_GUIDES } from "../components/absensi/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";
import { useAbsensiPeriode } from "../lib/absensiPeriode";

type Row = { name: string; tanggal: string; guru?: string; jam_masuk?: string; jam_pulang?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "tanggal", header: "Tanggal", sortable: true, cell: (r) => r.tanggal },
  { key: "guru", header: "Guru", sortable: true, cell: (r) => r.guru ?? "—" },
  { key: "jam_masuk", header: "Masuk", cell: (r) => r.jam_masuk ?? "—" },
  { key: "jam_pulang", header: "Pulang", cell: (r) => r.jam_pulang ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Hadir" ? "success" : r.status === "Izin" ? "warning" : r.status === "Alpa" ? "danger" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function AbsensiGuruPage() {
  const [showCreate, setShowCreate] = useState(false);
  // Absensi Guru is the one TA-keyed absensi surface: scope to the selected year
  // and gate creation in an archived year (don't back-date teacher presence).
  const { tahunAjaran, isPastPeriod } = useAbsensiPeriode();
  return (
    <>
      <PageGuide
        storageNamespace="absensi-guide:"
        storageId="guru"
        title={ABSENSI_PAGE_GUIDES.guru.title}
        intro={ABSENSI_PAGE_GUIDES.guru.intro}
        steps={ABSENSI_PAGE_GUIDES.guru.steps}
        tips={ABSENSI_PAGE_GUIDES.guru.tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />
      <ResourceListPage<Row>
        eyebrow="Absensi"
        title="Absensi Guru"
        doctype="Absensi Guru"
        fields={["name", "tanggal"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "tanggal", dir: "desc" }}
        searchFields={["name"]}
        {...(tahunAjaran ? { baseFilters: [["tahun_ajaran", "=", tahunAjaran]] } : {})}
        addLabel="Input Absensi"
        {...(isPastPeriod ? {} : { onAdd: () => setShowCreate(true) })}
      />
      <AbsensiGuruFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

export const Route = createFileRoute("/sch/$sekolah/absensi/guru")({ component: AbsensiGuruPage });
