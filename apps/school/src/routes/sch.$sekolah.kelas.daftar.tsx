import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { RombelFormModal } from "../components/kelas/RombelFormModal";
import { PageGuide } from "../components/guide";
import { KELAS_PAGE_GUIDES } from "../components/kelas/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";
import { useKelasPeriode } from "../lib/kelasPeriode";

type Row = {
  name: string;
  nama_rombel?: string;
  tingkat?: number | string;
  jumlah_siswa?: number;
  wali_kelas?: string;
  kapasitas?: number;
  tahun_ajaran?: string;
  status?: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama_rombel", header: "Nama Rombel", sortable: true, cell: (r) => r.nama_rombel ?? "—" },
  { key: "tingkat", header: "Tingkat", align: "right", cell: (r) => r.tingkat ?? "—" },
  { key: "wali_kelas", header: "Wali Kelas", cell: (r) => r.wali_kelas ?? "—" },
  { key: "jumlah_siswa", header: "Siswa", align: "right",
    cell: (r) => <span className="tabular-nums">{r.jumlah_siswa ?? 0}{r.kapasitas ? ` / ${r.kapasitas}` : ""}</span> },
  { key: "tahun_ajaran", header: "TA", cell: (r) => r.tahun_ajaran ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : r.status === "Ditutup" ? "neutral" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function KelasListPage() {
  const [showCreate, setShowCreate] = useState(false);
  // Scope to the selected Tahun Ajaran; gate creation in an archived year.
  const { tahunAjaran, isPastPeriod } = useKelasPeriode();
  return (
    <div className="space-y-6">
      <PageGuide
        storageNamespace="kelas-guide:"
        storageId="daftar"
        title={KELAS_PAGE_GUIDES.daftar.title}
        intro={KELAS_PAGE_GUIDES.daftar.intro}
        steps={KELAS_PAGE_GUIDES.daftar.steps}
        tips={KELAS_PAGE_GUIDES.daftar.tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />
      <ResourceListPage<Row>
        eyebrow="Akademik"
        title="Kelas"
        description="Atur rombongan belajar, kapasitas, dan wali kelas."
        doctype="Rombongan Belajar"
        fields={["name", "nama_rombel", "tingkat", "jumlah_siswa", "wali_kelas", "kapasitas", "tahun_ajaran", "status"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "name", dir: "asc" }}
        searchFields={["name", "nama_rombel", "wali_kelas"]}
        {...(tahunAjaran ? { baseFilters: [["tahun_ajaran", "=", tahunAjaran]] } : {})}
        addLabel="Tambah Kelas"
        {...(isPastPeriod ? {} : { onAdd: () => setShowCreate(true) })}
      />
      <RombelFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/kelas/daftar")({ component: KelasListPage });
