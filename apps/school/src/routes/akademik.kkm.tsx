import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { CreateResourceModal, type FieldSpec } from "../components/akademik/CreateResourceModal";

type Row = { name: string; mata_pelajaran: string; kelas?: string; nilai_kkm: number; tahun_ajaran?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "mata_pelajaran", header: "Mata Pelajaran", sortable: true, cell: (r) => r.mata_pelajaran },
  { key: "kelas", header: "Kelas", cell: (r) => r.kelas ?? "—" },
  { key: "nilai_kkm", header: "KKM", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums">{r.nilai_kkm}</span> },
  { key: "tahun_ajaran", header: "TA", cell: (r) => r.tahun_ajaran ?? "—" },
];

const FIELDS: FieldSpec[] = [
  { name: "mata_pelajaran", label: "Mata Pelajaran", required: true, placeholder: "Mata Pelajaran ID" },
  { name: "kelas", label: "Kelas", placeholder: "Kode Kelas" },
  { name: "nilai_kkm", label: "Nilai KKM", kind: "number", required: true, placeholder: "75" },
  { name: "tahun_ajaran", label: "Tahun Ajaran", placeholder: "2024/2025" },
];

function KkmPage() {
  const navigate = useNavigate();
  const [openCreate, setOpenCreate] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Akademik"
        title="KKM (Kriteria Ketuntasan Minimal)"
        doctype="KKM"
        fields={["name", "mata_pelajaran", "nilai_kkm", "tahun_ajaran"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "mata_pelajaran", dir: "asc" }}
        searchFields={["name", "mata_pelajaran"]}
        addLabel="Set KKM"
        onAdd={() => setOpenCreate(true)}
        onRowClick={(r) => navigate({ to: "/akademik/kkm/$name", params: { name: r.name } })}
      />
      <CreateResourceModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        doctype="KKM"
        title="Set KKM"
        description="Tetapkan Kriteria Ketuntasan Minimal untuk mapel & kelas."
        fields={FIELDS}
      />
    </>
  );
}

export const Route = createFileRoute("/akademik/kkm")({ component: KkmPage });
