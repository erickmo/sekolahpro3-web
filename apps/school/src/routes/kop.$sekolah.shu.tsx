import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { ShuWizard } from "../components/koperasi/ShuWizard";
import { KoperasiPageGuide } from "../components/koperasi/KoperasiPageGuide";

type Row = {
  name: string;
  periode: string;
  shu_total: number;
  pct_cadangan?: number;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "periode", header: "Periode", sortable: true, cell: (r) => r.periode },
  { key: "shu_total", header: "Total SHU", align: "right",
    cell: (r) => <span className="tabular-nums">Rp {r.shu_total.toLocaleString("id-ID")}</span> },
  { key: "pct_cadangan", header: "Cadangan", align: "right",
    cell: (r) => r.pct_cadangan !== undefined ? <span className="tabular-nums">{r.pct_cadangan.toLocaleString("id-ID")}%</span> : "—" },
];

function ShuPage() {
  const [wizardOpen, setWizardOpen] = useState(false);
  return (
    <>
      <KoperasiPageGuide id="shu" />
      <ResourceListPage<Row>
        eyebrow="Koperasi"
        title="Pembagian SHU"
        description="Sisa Hasil Usaha tahunan setelah RAT."
        doctype="Pembagian SHU"
        fields={["name", "periode", "shu_total", "pct_cadangan"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "periode", dir: "desc" }}
        searchFields={["name", "periode"]}
        addLabel="Buat Periode SHU"
        onAdd={() => setWizardOpen(true)}
      />
      <ShuWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </>
  );
}

export const Route = createFileRoute("/kop/$sekolah/shu")({ component: ShuPage });
