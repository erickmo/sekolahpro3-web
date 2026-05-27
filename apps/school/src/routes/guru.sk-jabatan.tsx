import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { ResourceCreateModal } from "../components/shared/ResourceCreateModal";
import { SK_JABATAN_FIELDS } from "../components/guru-extra/sub-fields";

type Row = { name: string; guru: string; jabatan?: string; nomor_sk?: string; tanggal_sk?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "guru", header: "Guru/Staff", sortable: true, cell: (r) => r.guru },
  { key: "jabatan", header: "Jabatan", cell: (r) => r.jabatan ?? "—" },
  { key: "nomor_sk", header: "No. SK", cell: (r) => <span className="font-mono text-xs">{r.nomor_sk ?? "—"}</span> },
  { key: "tanggal_sk", header: "Tgl SK", sortable: true, cell: (r) => r.tanggal_sk ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function SkJabatanPage() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Guru"
        title="SK Jabatan"
        doctype="SK Jabatan"
        fields={["name", "guru", "tanggal_sk", "status"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "tanggal_sk", dir: "desc" }}
        searchFields={["name", "guru"]}
        addLabel="Terbitkan SK"
        onAdd={() => setOpen(true)}
      />
      <ResourceCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="SK Jabatan"
        title="Terbitkan SK Jabatan"
        description="Buat draft SK Jabatan baru."
        fields={SK_JABATAN_FIELDS}
      />
    </>
  );
}

export const Route = createFileRoute("/guru/sk-jabatan")({ component: SkJabatanPage });
