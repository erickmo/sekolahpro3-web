import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { ResourceCreateModal } from "../components/shared/ResourceCreateModal";
import {
  JADWAL_ANGSURAN_BASE_VALUES,
  JADWAL_ANGSURAN_FIELDS,
} from "../data/create-schemas";
import { KoperasiPageGuide } from "../components/koperasi/KoperasiPageGuide";

type Row = {
  name: string;
  akad?: string;
  ke?: number;
  jatuh_tempo?: string;
  total?: number;
  status: string;
  tanggal_bayar?: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "akad", header: "Ref Akad", cell: (r) => <span className="font-mono text-xs">{r.akad ?? "—"}</span> },
  { key: "ke", header: "Angsuran #", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums">{r.ke ?? "—"}</span> },
  { key: "jatuh_tempo", header: "Jatuh Tempo", sortable: true, cell: (r) => r.jatuh_tempo ?? "—" },
  { key: "total", header: "Nominal", align: "right",
    cell: (r) => r.total !== undefined ? <span className="tabular-nums">Rp {r.total.toLocaleString("id-ID")}</span> : "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Lunas" ? "success" : r.status === "Tunggakan" ? "danger" : r.status === "Belum" ? "warning" : "neutral"} dot>{r.status}</Badge> },
];

function AngsuranPage() {
  const [open, setOpen] = useState(false);
  return (
    <>
    <KoperasiPageGuide id="angsuran" />
    <ResourceListPage<Row>
      eyebrow="Koperasi"
      title="Jadwal & Pembayaran Angsuran"
      doctype="Jadwal Angsuran"
      fields={["name", "ke", "total", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "ke", dir: "asc" }}
      searchFields={["name"]}
      selectFilters={[
        { key: "status", label: "Status", field: "status",
          options: ["Semua", "Belum", "Lunas", "Tunggakan"].map((v) => ({ value: v, label: v })) },
      ]}
      addLabel="Tambah Baris Angsuran"
      onAdd={() => setOpen(true)}
    />
      <ResourceCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="Jadwal Angsuran"
        title="Tambah Baris Jadwal Angsuran"
        description="Baris angsuran pada Akad Pembiayaan terpilih."
        fields={JADWAL_ANGSURAN_FIELDS}
        baseValues={JADWAL_ANGSURAN_BASE_VALUES}
      />
    </>
  );
}

export const Route = createFileRoute("/kop/$sekolah/angsuran")({ component: AngsuranPage });
