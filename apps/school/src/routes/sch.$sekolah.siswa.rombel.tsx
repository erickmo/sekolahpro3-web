import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { AnggotaRombelFormModal } from "../components/siswa/AnggotaRombelFormModal";
import { PageGuide } from "../components/guide";
import { SISWA_PAGE_GUIDES } from "../components/siswa/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

type Row = { name: string; siswa: string; rombongan_belajar?: string; tahun_ajaran?: string; nomor_absen?: number };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "siswa", header: "Siswa", sortable: true, cell: (r) => r.siswa },
  { key: "rombongan_belajar", header: "Rombel", cell: (r) => r.rombongan_belajar ?? "—" },
  { key: "tahun_ajaran", header: "TA", cell: (r) => r.tahun_ajaran ?? "—" },
  { key: "nomor_absen", header: "No. Absen", align: "right", cell: (r) => r.nomor_absen ?? "—" },
];

function RombelPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <>
      <div className="mb-4">
        <PageGuide
          storageNamespace="siswa-guide:"
          storageId="rombel"
          title={SISWA_PAGE_GUIDES.rombel.title}
          intro={SISWA_PAGE_GUIDES.rombel.intro}
          steps={SISWA_PAGE_GUIDES.rombel.steps}
          tips={SISWA_PAGE_GUIDES.rombel.tips}
          roleLabels={SCHOOL_ROLE_LABEL}
        />
      </div>
      <ResourceListPage<Row>
        eyebrow="Siswa"
        title="Anggota Rombel"
        doctype="Anggota Rombel"
        fields={["name", "siswa"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "name", dir: "asc" }}
        searchFields={["name", "siswa"]}
        addLabel="Tambah Anggota"
        onAdd={() => setShowCreate(true)}
      />
      <AnggotaRombelFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

export const Route = createFileRoute("/sch/$sekolah/siswa/rombel")({ component: RombelPage });
