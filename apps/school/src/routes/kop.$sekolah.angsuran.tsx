import { useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { ResourceCreateModal } from "../components/shared/ResourceCreateModal";
import {
  JADWAL_ANGSURAN_BASE_VALUES,
  JADWAL_ANGSURAN_FIELDS,
} from "../data/create-schemas";
import { KoperasiPageGuide } from "../components/koperasi/KoperasiPageGuide";

// Jadwal Angsuran rows are CHILDREN of Akad Pembiayaan — the list query needs
// the `parent` param (listParent) and the akad reference is the `parent` field.
type Row = {
  name: string;
  parent?: string;
  ke?: number;
  tanggal_jatuh_tempo?: string;
  total?: number;
  status: string;
};

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  Belum: "warning",
  Lunas: "success",
  Terlambat: "danger",
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "parent", header: "Ref Akad", cell: (r) => <span className="font-mono text-xs">{r.parent ?? "—"}</span> },
  { key: "ke", header: "Angsuran #", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums">{r.ke ?? "—"}</span> },
  { key: "tanggal_jatuh_tempo", header: "Jatuh Tempo", sortable: true, cell: (r) => r.tanggal_jatuh_tempo ?? "—" },
  { key: "total", header: "Nominal", align: "right",
    cell: (r) => r.total !== undefined ? <span className="tabular-nums">Rp {r.total.toLocaleString("id-ID")}</span> : "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={STATUS_TONE[r.status] ?? "neutral"} dot>{r.status}</Badge> },
];

function AngsuranPage() {
  const { sekolah } = useParams({ from: "/kop/$sekolah" });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <>
    <KoperasiPageGuide id="angsuran" />
    <ResourceListPage<Row>
      eyebrow="Koperasi"
      title="Jadwal & Pembayaran Angsuran"
      doctype="Jadwal Angsuran"
      listParent="Akad Pembiayaan"
      fields={["name", "parent", "ke", "tanggal_jatuh_tempo", "total", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "tanggal_jatuh_tempo", dir: "asc" }}
      searchFields={["name", "parent"]}
      selectFilters={[
        { key: "status", label: "Status", field: "status",
          options: ["Semua", "Belum", "Lunas", "Terlambat"].map((v) => ({ value: v, label: v })) },
      ]}
      addLabel="Tambah Baris Angsuran"
      onAdd={() => setOpen(true)}
      onRowClick={(r) => navigate({ to: "/kop/$sekolah/angsuran/$name", params: { sekolah, name: r.name } })}
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
