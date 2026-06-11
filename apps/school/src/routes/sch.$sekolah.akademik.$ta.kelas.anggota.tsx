import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { AnggotaRombelFormModal } from "../components/kelas/AnggotaRombelFormModal";
import { PageGuide } from "../components/guide";
import { KELAS_PAGE_GUIDES } from "../components/kelas/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";
import { useKelasPeriode } from "../lib/kelasPeriode";

type Row = { name: string; parent?: string; siswa?: string; no_urut?: number; tanggal_masuk_rombel?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "parent", header: "Rombel", sortable: true, cell: (r) => r.parent ?? "—" },
  { key: "siswa", header: "Siswa", cell: (r) => r.siswa ?? "—" },
  { key: "no_urut", header: "No. Urut", align: "right", cell: (r) => r.no_urut ?? "—" },
  { key: "tanggal_masuk_rombel", header: "Masuk", cell: (r) => r.tanggal_masuk_rombel ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : r.status === "Keluar" ? "neutral" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function AnggotaRombelPage() {
  const [showCreate, setShowCreate] = useState(false);
  // Anggota Rombel (istable child) has no tahun_ajaran field, so this list is
  // NOT year-filtered (membership spans years). Only the create action is gated
  // when an archived year is selected.
  const { isPastPeriod } = useKelasPeriode();
  return (
    <div className="space-y-6">
      <PageGuide
        storageNamespace="kelas-guide:"
        storageId="anggota"
        title={KELAS_PAGE_GUIDES.anggota.title}
        intro={KELAS_PAGE_GUIDES.anggota.intro}
        steps={KELAS_PAGE_GUIDES.anggota.steps}
        tips={KELAS_PAGE_GUIDES.anggota.tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />
      <p className="text-xs text-muted-fg">
        Daftar anggota menampilkan semua tahun ajaran (keanggotaan lintas tahun).
      </p>
      <ResourceListPage<Row>
        eyebrow="Kelas"
        title="Anggota Rombel"
        doctype="Anggota Rombel"
        fields={["name", "parent", "siswa", "no_urut", "tanggal_masuk_rombel", "status"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "parent", dir: "asc" }}
        searchFields={["name", "siswa", "parent"]}
        baseFilters={[["parenttype", "=", "Rombongan Belajar"]]}
        addLabel="Tambah Anggota"
        {...(isPastPeriod ? {} : { onAdd: () => setShowCreate(true) })}
      />
      <AnggotaRombelFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/$ta/kelas/anggota")({ component: AnggotaRombelPage });
