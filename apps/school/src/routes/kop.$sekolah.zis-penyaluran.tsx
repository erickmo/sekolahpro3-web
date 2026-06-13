import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { PenyaluranZisModal } from "../components/koperasi-sosial/PenyaluranZisModal";
import { KoperasiPageGuide } from "../components/koperasi/KoperasiPageGuide";

// Field contract per backend Penyaluran ZIS (penyaluran_zis.json).
type Row = {
  name: string;
  program_penyaluran?: string;
  asnaf?: string;
  penerima_tipe?: string;
  penerima?: string;
  jumlah: number;
  tanggal: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "program_penyaluran", header: "Program", cell: (r) => r.program_penyaluran ?? "—" },
  { key: "asnaf", header: "Asnaf", cell: (r) => r.asnaf ? <Badge tone="neutral">{r.asnaf}</Badge> : <span className="text-xs text-muted-fg">—</span> },
  { key: "penerima", header: "Penerima",
    cell: (r) => r.penerima ? (
      <span className="text-sm">{r.penerima}{r.penerima_tipe ? <span className="ml-1 text-xs text-muted-fg">({r.penerima_tipe})</span> : null}</span>
    ) : <span className="text-xs text-muted-fg">Kolektif</span> },
  { key: "jumlah", header: "Nominal", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums">Rp {r.jumlah.toLocaleString("id-ID")}</span> },
  { key: "tanggal", header: "Tanggal", sortable: true, cell: (r) => r.tanggal },
];

export function ZisPenyaluranPage() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <KoperasiPageGuide id="zis-penyaluran" />
      <ResourceListPage<Row>
        eyebrow="Koperasi"
        title="Penyaluran ZIS"
        description="Dana sosial yang disalurkan ke penerima manfaat per program."
        doctype="Penyaluran ZIS"
        fields={["name", "program_penyaluran", "asnaf", "penerima_tipe", "penerima", "jumlah", "tanggal"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "tanggal", dir: "desc" }}
        searchFields={["name", "program_penyaluran", "penerima"]}
        selectFilters={[
          { key: "asnaf", label: "Asnaf", field: "asnaf",
            options: ["Semua", "Fakir", "Miskin", "Amil", "Mualaf", "Riqab", "Gharimin", "Fi Sabilillah", "Ibnu Sabil"].map((v) => ({ value: v, label: v })) },
        ]}
        addLabel="Catat Penyaluran"
        onAdd={() => setOpen(true)}
      />
      <PenyaluranZisModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export const Route = createFileRoute("/kop/$sekolah/zis-penyaluran")({ component: ZisPenyaluranPage });
