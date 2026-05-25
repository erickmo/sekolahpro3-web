import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { KartuCreateModal } from "../components/koperasi-kartu/KartuCreateModal";

type Row = {
  name: string;
  uid_rfid: string;
  anggota: string;
  status: string;
  tanggal_terbit: string;
  tanggal_kedaluwarsa?: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "No. Kartu", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "uid_rfid", header: "UID RFID", cell: (r) => <span className="font-mono text-xs">{r.uid_rfid}</span> },
  { key: "anggota", header: "Anggota", sortable: true, cell: (r) => r.anggota },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : r.status === "Blokir" ? "danger" : r.status === "Hilang" ? "warning" : "neutral"} dot>{r.status}</Badge> },
  { key: "tanggal_terbit", header: "Tgl Terbit", sortable: true, cell: (r) => r.tanggal_terbit },
  { key: "tanggal_kedaluwarsa", header: "Kedaluwarsa", cell: (r) => r.tanggal_kedaluwarsa ?? "—" },
];

function KartuPage() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Koperasi"
        title="Kartu RFID"
        description="Kartu pakai bersama Koperasi & Perpustakaan."
        doctype="Kartu"
        fields={["name", "uid_rfid", "anggota", "status", "tanggal_terbit", "tanggal_kedaluwarsa"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "tanggal_terbit", dir: "desc" }}
        searchFields={["name", "uid_rfid", "anggota"]}
        selectFilters={[
          { key: "status", label: "Status", field: "status",
            options: ["Semua", "Aktif", "Blokir", "Hilang", "Kedaluwarsa"].map((v) => ({ value: v, label: v })) },
        ]}
        addLabel="Terbitkan Kartu"
        onAdd={() => setOpen(true)}
        onRowClick={(r) => navigate({ to: "/koperasi/kartu/$name", params: { name: r.name } })}
      />
      <KartuCreateModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export const Route = createFileRoute("/koperasi/kartu")({ component: KartuPage });
