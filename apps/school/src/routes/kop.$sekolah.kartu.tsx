import { useState } from "react";
import { createFileRoute, useNavigate, useParams} from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { KartuCreateModal } from "../components/koperasi-kartu/KartuCreateModal";
import { KoperasiPageGuide } from "../components/koperasi/KoperasiPageGuide";

type Row = {
  name: string;
  uid_nfc: string;
  tipe_kartu?: string;
  anggota: string;
  status: string;
  tanggal_expired?: string;
};

const STATUS_LABEL: Record<string, string> = {
  aktif: "Aktif",
  blokir: "Blokir",
  expired: "Kedaluwarsa",
};

const TIPE_KARTU_LABEL: Record<string, string> = {
  debit: "Debit",
  emoney: "E-Money",
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "No. Kartu", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "uid_nfc", header: "UID NFC", cell: (r) => <span className="font-mono text-xs">{r.uid_nfc}</span> },
  { key: "tipe_kartu", header: "Tipe", cell: (r) => r.tipe_kartu ? <Badge tone="neutral">{TIPE_KARTU_LABEL[r.tipe_kartu] ?? r.tipe_kartu}</Badge> : "—" },
  { key: "anggota", header: "Anggota", sortable: true, cell: (r) => r.anggota },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "aktif" ? "success" : r.status === "blokir" ? "danger" : "neutral"} dot>{STATUS_LABEL[r.status] ?? r.status}</Badge> },
  { key: "tanggal_expired", header: "Kedaluwarsa", cell: (r) => r.tanggal_expired ?? "—" },
];

function KartuPage() {
  const { sekolah } = useParams({ from: "/kop/$sekolah" });

  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      <KoperasiPageGuide id="kartu" />
      <ResourceListPage<Row>
        eyebrow="Koperasi"
        title="Kartu RFID"
        description="Kartu pakai bersama Koperasi & Perpustakaan."
        doctype="Kartu"
        fields={["name", "uid_nfc", "tipe_kartu", "anggota", "status", "tanggal_expired"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "name", dir: "desc" }}
        searchFields={["name", "uid_nfc", "anggota"]}
        selectFilters={[
          { key: "status", label: "Status", field: "status",
            options: [
              { value: "Semua", label: "Semua" },
              { value: "aktif", label: "Aktif" },
              { value: "blokir", label: "Blokir" },
              { value: "expired", label: "Kedaluwarsa" },
            ] },
        ]}
        addLabel="Terbitkan Kartu"
        onAdd={() => setOpen(true)}
        onRowClick={(r) => navigate({ to: "/kop/$sekolah/kartu/$name", params: { sekolah, name: r.name } })}
      />
      <KartuCreateModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export const Route = createFileRoute("/kop/$sekolah/kartu")({ component: KartuPage });
