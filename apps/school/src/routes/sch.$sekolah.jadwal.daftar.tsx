import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { ResourceCreateModal } from "../components/shared/ResourceCreateModal";
import { JADWAL_PELAJARAN_FIELDS } from "../data/create-schemas";
import { PageGuide } from "../components/guide";
import { JADWAL_PAGE_GUIDES } from "../components/jadwal/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";
import { useJadwalPeriode } from "../lib/jadwalPeriode";

// TODO(/jadwal/daftar): Jadwal Pelajaran header doctype only has
// {name, rombel, semester, tahun_ajaran, kurikulum, is_aktif}.
// Per-slot detail (hari/jam_mulai/jam_selesai/mapel/guru) lives in child
// table `slots` (Slot Jadwal). Field names below assume future flatten/view.
type Row = {
  name: string;
  hari?: string;
  jam_mulai?: string;
  jam_selesai?: string;
  mapel?: string;
  kelas?: string;
  guru?: string;
  rombel?: string;
  tahun_ajaran?: string;
  is_aktif?: number;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "hari", header: "Hari", sortable: true, cell: (r) => r.hari ?? "—" },
  { key: "jam_mulai", header: "Mulai", cell: (r) => r.jam_mulai ?? "—" },
  { key: "jam_selesai", header: "Selesai", cell: (r) => r.jam_selesai ?? "—" },
  { key: "mapel", header: "Mapel", sortable: true, cell: (r) => r.mapel ?? "—" },
  { key: "kelas", header: "Kelas", cell: (r) => r.kelas ?? r.rombel ?? "—" },
  { key: "guru", header: "Guru", cell: (r) => r.guru ?? "—" },
  { key: "is_aktif", header: "Status",
    cell: (r) => <Badge tone={r.is_aktif ? "success" : "neutral"} dot>{r.is_aktif ? "Aktif" : "Nonaktif"}</Badge> },
];

function JadwalDaftarPage() {
  const [open, setOpen] = useState(false);
  // Scope the list to the selected Tahun Ajaran; gate creation when it's an
  // archived/past year (read-only). The strip above explains the archive state.
  const { tahunAjaran, isPastPeriod } = useJadwalPeriode();
  return (
    <div className="space-y-6">
      <PageGuide
        storageNamespace="jadwal-guide:"
        storageId="daftar"
        title={JADWAL_PAGE_GUIDES.daftar.title}
        intro={JADWAL_PAGE_GUIDES.daftar.intro}
        steps={JADWAL_PAGE_GUIDES.daftar.steps}
        tips={JADWAL_PAGE_GUIDES.daftar.tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />
      <ResourceListPage<Row>
        eyebrow="Akademik"
        title="Jadwal Pelajaran"
        doctype="Jadwal Pelajaran"
        fields={["name", "rombel", "tahun_ajaran", "semester", "kurikulum", "is_aktif"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "name", dir: "asc" }}
        searchFields={["name", "rombel"]}
        {...(tahunAjaran ? { baseFilters: [["tahun_ajaran", "=", tahunAjaran]] } : {})}
        addLabel="Tambah Jadwal"
        {...(isPastPeriod ? {} : { onAdd: () => setOpen(true) })}
      />
      <ResourceCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="Jadwal Pelajaran"
        title="Tambah Jadwal Pelajaran"
        description="Buat header jadwal. Slot per-jam diisi via halaman detail/desk."
        fields={JADWAL_PELAJARAN_FIELDS}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/jadwal/daftar")({ component: JadwalDaftarPage });
