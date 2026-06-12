import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { ResourceCreateModal } from "../components/shared/ResourceCreateModal";
import { ASET_WAKAF_FIELDS } from "../data/create-schemas";
import { KoperasiPageGuide } from "../components/koperasi/KoperasiPageGuide";

type Row = {
  name: string;
  nama_aset: string;
  jenis_wakaf: string;
  nilai: number;
  wakif?: string;
  status: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama_aset", header: "Nama Aset", sortable: true, cell: (r) => r.nama_aset },
  { key: "jenis_wakaf", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis_wakaf}</Badge> },
  { key: "nilai", header: "Nilai", align: "right",
    cell: (r) => <span className="tabular-nums">Rp {r.nilai.toLocaleString("id-ID")}</span> },
  { key: "wakif", header: "Wakif", cell: (r) => r.wakif ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Produktif" ? "success" : r.status === "Tidak Produktif" ? "warning" : "neutral"} dot>{r.status}</Badge> },
];

function WakafPage() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <KoperasiPageGuide id="wakaf" />
      <ResourceListPage<Row>
        eyebrow="Koperasi"
        title="Aset Wakaf"
        doctype="Aset Wakaf"
        fields={["name", "nama_aset", "jenis_wakaf", "nilai", "wakif", "status"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "name", dir: "desc" }}
        searchFields={["name", "nama_aset", "wakif"]}
        addLabel="Catat Wakaf"
        onAdd={() => setOpen(true)}
      />
      <ResourceCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="Aset Wakaf"
        title="Catat Aset Wakaf"
        description="Daftarkan aset wakaf yang dikelola koperasi."
        fields={ASET_WAKAF_FIELDS}
        submitLabel="Simpan Aset"
      />
    </>
  );
}

export const Route = createFileRoute("/kop/$sekolah/wakaf")({ component: WakafPage });
