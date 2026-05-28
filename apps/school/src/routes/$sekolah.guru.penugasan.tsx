import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { ResourceCreateModal } from "../components/shared/ResourceCreateModal";
import { PENUGASAN_GURU_FIELDS } from "../components/guru-extra/sub-fields";

type Row = { name: string; guru: string; jenis_penugasan?: string; tahun_ajaran?: string; status?: string; tanggal_mulai?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "guru", header: "Guru", sortable: true, cell: (r) => r.guru },
  { key: "jenis_penugasan", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis_penugasan ?? "—"}</Badge> },
  { key: "tahun_ajaran", header: "TA", cell: (r) => r.tahun_ajaran ?? "—" },
  { key: "tanggal_mulai", header: "Tgl Mulai", sortable: true, cell: (r) => r.tanggal_mulai ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function PenugasanPage() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Guru"
        title="Penugasan Guru"
        doctype="Penugasan Guru"
        fields={["name", "guru", "tahun_ajaran", "status"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "name", dir: "desc" }}
        searchFields={["name", "guru"]}
        addLabel="Buat Penugasan"
        onAdd={() => setOpen(true)}
      />
      <ResourceCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="Penugasan Guru"
        title="Buat Penugasan Guru"
        description="Header penugasan. Detail per-mapel diisi via halaman detail/desk."
        fields={PENUGASAN_GURU_FIELDS}
      />
    </>
  );
}

export const Route = createFileRoute("/guru/penugasan")({ component: PenugasanPage });
