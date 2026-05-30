import { useState } from "react";
import { createFileRoute, useNavigate, useParams} from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { AkadCreateModal } from "../components/koperasi-pembiayaan/akadForm";

type Row = {
  name: string;
  anggota?: string;
  produk?: string;
  akad?: string;
  pokok_pembiayaan?: number;
  jumlah_pokok?: number;
  margin?: number;
  tenor_bulan?: number;
  status: string;
  tanggal_akad: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "No. Akad", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "anggota", header: "Anggota", sortable: true, cell: (r) => r.anggota ?? "—" },
  { key: "produk", header: "Produk", cell: (r) => r.produk ?? "—" },
  { key: "akad", header: "Akad", cell: (r) => <Badge tone="neutral">{r.akad ?? "—"}</Badge> },
  { key: "jumlah_pokok", header: "Pokok", align: "right", sortable: true,
    cell: (r) => r.jumlah_pokok !== undefined ? <span className="tabular-nums">Rp {r.jumlah_pokok.toLocaleString("id-ID")}</span> : "—" },
  { key: "tenor_bulan", header: "Tenor", align: "right",
    cell: (r) => r.tenor_bulan ? <span className="tabular-nums">{r.tenor_bulan} bln</span> : "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Berjalan" ? "brand" : r.status === "Lunas" ? "success" : r.status === "Macet" ? "danger" : "neutral"} dot>{r.status}</Badge> },
  { key: "tanggal_akad", header: "Tgl Akad", sortable: true, cell: (r) => r.tanggal_akad },
];

function PembiayaanPage() {
  const { sekolah } = useParams({ from: "/kop/$sekolah" });

  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Koperasi"
        title="Pembiayaan"
        description="Akad pembiayaan: Murabahah, Ijarah, Qardh, Musyarakah."
        doctype="Akad Pembiayaan"
        fields={["name", "jumlah_pokok", "status", "tanggal_akad"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "tanggal_akad", dir: "desc" }}
        searchFields={["name"]}
        selectFilters={[
          { key: "status", label: "Status", field: "status",
            options: ["Semua", "Pengajuan", "Disetujui", "Berjalan", "Lunas", "Macet", "Batal"].map((v) => ({ value: v, label: v })) },
        ]}
        addLabel="Ajukan Pembiayaan"
        onAdd={() => setCreateOpen(true)}
        onRowClick={(r) => navigate({ to: "/kop/$sekolah/pembiayaan/$name", params: { sekolah, name: r.name } })}
      />
      <AkadCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(name) => navigate({ to: "/kop/$sekolah/pembiayaan/$name", params: { sekolah, name } })}
      />
    </>
  );
}

export const Route = createFileRoute("/kop/$sekolah/pembiayaan")({ component: PembiayaanPage });
