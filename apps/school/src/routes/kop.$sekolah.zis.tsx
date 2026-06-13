import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { ResourceListPage } from "../components/ResourceListPage";
import { ResourceCreateModal } from "../components/shared/ResourceCreateModal";
import { PENERIMAAN_ZIS_FIELDS } from "../data/create-schemas";
import { KoperasiPageGuide } from "../components/koperasi/KoperasiPageGuide";

// Field contract per backend Penerimaan ZIS: jenis_dana = Link "Jenis Dana
// ZIS" (filter options dimuat dari master), TIDAK ada field status.
type Row = {
  name: string;
  jenis_dana: string;
  nasabah?: string;
  program_penyaluran?: string;
  jumlah: number;
  tanggal: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "jenis_dana", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis_dana}</Badge> },
  { key: "nasabah", header: "Muzakki/Sumber", cell: (r) => r.nasabah ?? "—" },
  { key: "program_penyaluran", header: "Program", cell: (r) => r.program_penyaluran ?? "—" },
  { key: "jumlah", header: "Nominal", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums">Rp {r.jumlah.toLocaleString("id-ID")}</span> },
  { key: "tanggal", header: "Tanggal", sortable: true, cell: (r) => r.tanggal },
];

function ZisPage() {
  const [open, setOpen] = useState(false);
  // Opsi filter jenis dana dimuat dari master (Link, bukan enum statis).
  const jenisQ = useResourceList<{ name: string }>("Jenis Dana ZIS", {
    fields: ["name"],
    order_by: "name asc",
    limit_page_length: 50,
  });
  const jenisOptions = useMemo(
    () => [
      { value: "Semua", label: "Semua" },
      ...(jenisQ.data ?? []).map((j) => ({ value: j.name, label: j.name })),
    ],
    [jenisQ.data],
  );
  return (
    <>
      <KoperasiPageGuide id="zis" />
      <ResourceListPage<Row>
        eyebrow="Koperasi"
        title="Penerimaan ZIS"
        description="Dana zakat, infak, sedekah, dan wakaf tunai yang diterima."
        doctype="Penerimaan ZIS"
        fields={["name", "jenis_dana", "nasabah", "program_penyaluran", "jumlah", "tanggal"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "tanggal", dir: "desc" }}
        searchFields={["name", "nasabah"]}
        selectFilters={[
          { key: "jenis", label: "Jenis", field: "jenis_dana", options: jenisOptions },
        ]}
        addLabel="Catat Penerimaan"
        onAdd={() => setOpen(true)}
      />
      <ResourceCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="Penerimaan ZIS"
        title="Catat Penerimaan ZIS"
        description="Catat dana zakat, infak, sedekah, atau wakaf yang diterima."
        fields={PENERIMAAN_ZIS_FIELDS}
        submitLabel="Simpan Penerimaan"
      />
    </>
  );
}

export const Route = createFileRoute("/kop/$sekolah/zis")({ component: ZisPage });
