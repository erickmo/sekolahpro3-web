import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { AnggotaRombelFormModal } from "../components/siswa/AnggotaRombelFormModal";

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
