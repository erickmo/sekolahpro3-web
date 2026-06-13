import { useState } from "react";
import { createFileRoute, useNavigate, useParams} from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { TransaksiModal } from "../components/koperasi-simpanan/transaksiForm";
import { KoperasiPageGuide } from "../components/koperasi/KoperasiPageGuide";

type Row = {
  name: string;
  rekening_simpanan: string;
  jenis: string;
  jumlah: number;
  tanggal: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID Transaksi", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "rekening_simpanan", header: "Rekening", cell: (r) => <span className="font-mono text-xs">{r.rekening_simpanan}</span> },
  { key: "jenis", header: "Jenis",
    cell: (r) => <Badge tone={r.jenis === "Setoran" ? "success" : r.jenis === "Penarikan" ? "warning" : r.jenis === "Bagi Hasil" ? "brand" : "neutral"}>{r.jenis}</Badge> },
  { key: "jumlah", header: "Nominal", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums">Rp {r.jumlah.toLocaleString("id-ID")}</span> },
  { key: "tanggal", header: "Tanggal", sortable: true, cell: (r) => r.tanggal },
];

function TransaksiPage() {
  const { sekolah } = useParams({ from: "/kop/$sekolah" });

  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <>
      <KoperasiPageGuide id="transaksi" />
      <ResourceListPage<Row>
        eyebrow="Koperasi"
        title="Transaksi Simpanan"
        description="Setoran, penarikan, dan mutasi rekening."
        doctype="Transaksi Simpanan"
        fields={["name", "rekening_simpanan", "jenis", "jumlah", "tanggal"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "tanggal", dir: "desc" }}
        searchFields={["name", "rekening_simpanan"]}
        selectFilters={[
          { key: "jenis", label: "Jenis", field: "jenis",
            options: ["Semua", "Setoran", "Penarikan", "Bagi Hasil", "Bunga", "Biaya Admin Dormant", "Pelunasan Denda Perpus"].map((v) => ({ value: v, label: v })) },
        ]}
        addLabel="Transaksi Baru"
        onAdd={() => setOpen(true)}
        onRowClick={(r) => navigate({ to: "/kop/$sekolah/transaksi/$name", params: { sekolah, name: r.name } })}
      />
      <TransaksiModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export const Route = createFileRoute("/kop/$sekolah/transaksi")({ component: TransaksiPage });
