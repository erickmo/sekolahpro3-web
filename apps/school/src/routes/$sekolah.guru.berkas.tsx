import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { ResourceCreateModal } from "../components/shared/ResourceCreateModal";
import { BERKAS_GURU_FIELDS } from "../components/guru-extra/sub-fields";

type Row = { name: string; guru: string; jenis_berkas?: string; nomor_berkas?: string; tanggal_terbit?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "guru", header: "Guru", sortable: true, cell: (r) => r.guru },
  { key: "jenis_berkas", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis_berkas ?? "—"}</Badge> },
  { key: "nomor_berkas", header: "Nomor", cell: (r) => <span className="font-mono text-xs">{r.nomor_berkas ?? "—"}</span> },
  { key: "tanggal_terbit", header: "Tgl Terbit", sortable: true, cell: (r) => r.tanggal_terbit ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Valid" ? "success" : r.status === "Kedaluwarsa" ? "warning" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function BerkasPage() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Guru"
        title="Berkas Guru"
        description="Ijazah, sertifikat, NUPTK, kontrak, dll."
        doctype="Berkas Guru"
        fields={["name", "guru", "jenis_berkas"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "name", dir: "desc" }}
        searchFields={["name", "guru"]}
        addLabel="Unggah Berkas"
        onAdd={() => setOpen(true)}
      />
      <ResourceCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="Berkas Guru"
        title="Unggah Berkas Guru"
        description="Catat berkas guru baru."
        fields={BERKAS_GURU_FIELDS}
      />
    </>
  );
}

export const Route = createFileRoute("/guru/berkas")({ component: BerkasPage });
