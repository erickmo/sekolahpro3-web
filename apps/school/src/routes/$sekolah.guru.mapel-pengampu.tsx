import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { ResourceCreateModal } from "../components/shared/ResourceCreateModal";
import {
  MAPEL_PENGAMPU_BASE_VALUES,
  MAPEL_PENGAMPU_GURU_FIELDS,
} from "../components/guru-extra/sub-fields";

type Row = { name: string; guru: string; mata_pelajaran?: string; kelas?: string; tahun_ajaran?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "guru", header: "Guru", sortable: true, cell: (r) => r.guru },
  { key: "mata_pelajaran", header: "Mapel", cell: (r) => r.mata_pelajaran ?? "—" },
  { key: "kelas", header: "Kelas", cell: (r) => r.kelas ?? "—" },
  { key: "tahun_ajaran", header: "TA", cell: (r) => r.tahun_ajaran ?? "—" },
];

function MapelPengampuPage() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Guru"
        title="Mapel Pengampu"
        description="Pemetaan guru ↔ mata pelajaran ↔ kelas."
        doctype="Mapel Pengampu Guru"
        fields={["name", "mata_pelajaran"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "name", dir: "asc" }}
        searchFields={["name", "mata_pelajaran"]}
        addLabel="Tetapkan Pengampu"
        onAdd={() => setOpen(true)}
      />
      <ResourceCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="Mapel Pengampu Guru"
        title="Tetapkan Mapel Pengampu"
        description="Tambahkan baris mapel pengampu pada guru terpilih."
        fields={MAPEL_PENGAMPU_GURU_FIELDS}
        baseValues={MAPEL_PENGAMPU_BASE_VALUES}
      />
    </>
  );
}

export const Route = createFileRoute("/$sekolah/guru/mapel-pengampu")({ component: MapelPengampuPage });
