import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { KartuCreateModal } from "../components/koperasi-kartu/KartuCreateModal";

type Row = {
  name: string;
  uid_nfc: string;
  anggota: string;
  status: string;
  tanggal_terbit?: string;
  tanggal_expired?: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "No. Kartu", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "uid_nfc", header: "UID RFID", cell: (r) => <span className="font-mono text-xs">{r.uid_nfc}</span> },
  { key: "anggota", header: "Anggota", sortable: true, cell: (r) => r.anggota },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : r.status === "Blokir" ? "danger" : r.status === "Hilang" ? "warning" : "neutral"} dot>{r.status}</Badge> },
  { key: "tanggal_terbit", header: "Tgl Terbit", sortable: true, cell: (r) => r.tanggal_terbit ?? "—" },
  { key: "tanggal_expired", header: "Kedaluwarsa", cell: (r) => r.tanggal_expired ?? "—" },
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
        fields={["name", "uid_nfc", "anggota", "status", "tanggal_expired"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "name", dir: "desc" }}
        searchFields={["name", "uid_nfc", "anggota"]}
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
