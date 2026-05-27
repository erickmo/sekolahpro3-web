import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { RombelFormModal } from "../components/kelas/RombelFormModal";

type Row = {
  name: string;
  nama_rombel?: string;
  tingkat?: number | string;
  jumlah_siswa?: number;
  wali_kelas?: string;
  kapasitas?: number;
  status?: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama_rombel", header: "Nama Rombel", sortable: true, cell: (r) => r.nama_rombel ?? "—" },
  { key: "tingkat", header: "Tingkat", align: "right", cell: (r) => r.tingkat ?? "—" },
  { key: "wali_kelas", header: "Wali Kelas", cell: (r) => r.wali_kelas ?? "—" },
  { key: "jumlah_siswa", header: "Siswa", align: "right",
    cell: (r) => <span className="tabular-nums">{r.jumlah_siswa ?? 0}{r.kapasitas ? ` / ${r.kapasitas}` : ""}</span> },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : r.status === "Ditutup" ? "neutral" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function KelasListPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Akademik"
        title="Kelas"
        description="Atur rombongan belajar, kapasitas, dan wali kelas."
        doctype="Rombongan Belajar"
        fields={["name", "nama_rombel", "tingkat", "jumlah_siswa", "wali_kelas", "kapasitas", "status"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "name", dir: "asc" }}
        searchFields={["name", "nama_rombel", "wali_kelas"]}
        addLabel="Tambah Kelas"
        onAdd={() => setShowCreate(true)}
      />
      <RombelFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

export const Route = createFileRoute("/kelas/daftar")({ component: KelasListPage });
