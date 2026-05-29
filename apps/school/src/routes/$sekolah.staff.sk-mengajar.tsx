import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { ResourceCreateModal } from "../components/shared/ResourceCreateModal";
import { SK_MENGAJAR_FIELDS } from "../components/guru-extra/sub-fields";
import { BulkGenerateSkButton } from "../features/pegawai/PegawaiActions";

type Row = {
  name: string;
  guru: string;
  guru_nama?: string;
  nomor_sk_manual?: string;
  tanggal_sk?: string;
  tanggal_mulai_berlaku?: string;
  status?: string;
};

function skTone(status?: string): "success" | "danger" | "warning" | "neutral" {
  if (status === "Diterbitkan") return "success";
  if (status === "Dicabut") return "danger";
  if (status === "Diajukan" || status === "Disetujui Kepsek") return "warning";
  return "neutral";
}

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "guru", header: "Guru", sortable: true, cell: (r) => r.guru_nama ?? r.guru },
  { key: "nomor_sk_manual", header: "No. SK", cell: (r) => <span className="font-mono text-xs">{r.nomor_sk_manual ?? "—"}</span> },
  { key: "tanggal_sk", header: "Tgl SK", sortable: true, cell: (r) => r.tanggal_sk ?? "—" },
  { key: "tanggal_mulai_berlaku", header: "Berlaku Mulai", cell: (r) => r.tanggal_mulai_berlaku ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={skTone(r.status)} dot>{r.status ?? "—"}</Badge> },
];

function SkMengajarPage() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Guru"
        title="SK Mengajar"
        doctype="SK Mengajar"
        fields={["name", "guru", "guru_nama", "nomor_sk_manual", "tanggal_sk", "tanggal_mulai_berlaku", "status"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "tanggal_sk", dir: "desc" }}
        searchFields={["name", "guru"]}
        addLabel="Terbitkan SK"
        onAdd={() => setOpen(true)}
        extraActions={<BulkGenerateSkButton />}
      />
      <ResourceCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="SK Mengajar"
        title="Terbitkan SK Mengajar"
        description="Buat draft SK Mengajar baru."
        fields={SK_MENGAJAR_FIELDS}
      />
    </>
  );
}

export const Route = createFileRoute("/$sekolah/staff/sk-mengajar")({ component: SkMengajarPage });
