import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { PerpCreateModal, type PerpFieldDef } from "../components/perpustakaan/PerpCreateModal";
import { perpToday } from "../components/perpustakaan/perpFormatters";

type Row = {
  name: string;
  anggota: string;
  peminjaman?: string;
  jenis: string;
  nominal: number;
  status: string;
  tanggal_diterbitkan: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "No. Denda", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "anggota", header: "Anggota", sortable: true, cell: (r) => r.anggota },
  { key: "jenis", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis}</Badge> },
  { key: "nominal", header: "Nominal", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums">Rp {r.nominal.toLocaleString("id-ID")}</span> },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Lunas" ? "success" : r.status === "Belum Lunas" ? "warning" : "neutral"} dot>{r.status}</Badge> },
  { key: "tanggal_diterbitkan", header: "Tanggal", sortable: true, cell: (r) => r.tanggal_diterbitkan },
];

const CREATE_FIELDS: PerpFieldDef[] = [
  { name: "anggota", label: "Anggota (ID)", type: "text", required: true },
  { name: "peminjaman", label: "Ref Peminjaman", type: "text" },
  {
    name: "jenis", label: "Jenis", type: "select", required: true,
    options: ["Keterlambatan", "Kerusakan", "Kehilangan"].map((v) => ({ value: v, label: v })),
  },
  { name: "nominal", label: "Nominal (Rp)", type: "number", required: true },
  { name: "tanggal_diterbitkan", label: "Tgl Terbit", type: "date", required: true, defaultValue: perpToday() },
  { name: "catatan", label: "Catatan", type: "textarea" },
];

function DendaPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Perpustakaan"
        title="Denda Perpustakaan"
        description="Tagihan denda keterlambatan & ganti rugi."
        doctype="Denda Perpustakaan"
        fields={["name", "anggota", "peminjaman", "jenis", "nominal", "status", "tanggal_diterbitkan"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "tanggal_diterbitkan", dir: "desc" }}
        searchFields={["name", "anggota"]}
        selectFilters={[
          { key: "status", label: "Status", field: "status",
            options: ["Semua", "Belum Lunas", "Lunas", "Diputihkan"].map((v) => ({ value: v, label: v })) },
          { key: "jenis", label: "Jenis", field: "jenis",
            options: ["Semua", "Keterlambatan", "Kerusakan", "Kehilangan"].map((v) => ({ value: v, label: v })) },
        ]}
        addLabel="Terbitkan Denda"
        onAdd={() => setOpen(true)}
        onRowClick={(r) => navigate({ to: "/perpustakaan/denda/$name", params: { name: r.name } })}
      />
      <PerpCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="Denda Perpustakaan"
        title="Terbitkan Denda"
        fields={CREATE_FIELDS}
        submitLabel="Terbitkan"
        onCreated={(doc) => {
          const name = (doc as { name?: string }).name;
          if (name) navigate({ to: "/perpustakaan/denda/$name", params: { name } });
        }}
      />
    </>
  );
}

export const Route = createFileRoute("/perpustakaan/denda")({ component: DendaPage });
