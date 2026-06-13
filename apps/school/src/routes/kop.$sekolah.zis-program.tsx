import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { ResourceCreateModal } from "../components/shared/ResourceCreateModal";
import { PROGRAM_PENYALURAN_FIELDS } from "../data/create-schemas";
import { KoperasiPageGuide } from "../components/koperasi/KoperasiPageGuide";

// Field contract per backend Program Penyaluran; terkumpul/tersalurkan
// adalah agregat read-only yang dihitung controller.
type Row = {
  name: string;
  jenis_dana?: string;
  target_dana?: number;
  terkumpul?: number;
  tersalurkan?: number;
  status: string;
  periode_mulai?: string;
  periode_selesai?: string;
};

function rupiah(n: number | undefined): string {
  return n !== undefined ? `Rp ${n.toLocaleString("id-ID")}` : "—";
}

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "Program", sortable: true, cell: (r) => <span className="text-sm font-medium">{r.name}</span> },
  { key: "jenis_dana", header: "Jenis Dana", cell: (r) => r.jenis_dana ? <Badge tone="neutral">{r.jenis_dana}</Badge> : "—" },
  { key: "target_dana", header: "Target", align: "right", cell: (r) => <span className="tabular-nums">{rupiah(r.target_dana)}</span> },
  { key: "terkumpul", header: "Terkumpul", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums">{rupiah(r.terkumpul)}</span> },
  { key: "tersalurkan", header: "Tersalurkan", align: "right",
    cell: (r) => <span className="tabular-nums">{rupiah(r.tersalurkan)}</span> },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status}</Badge> },
];

export function ZisProgramPage() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <KoperasiPageGuide id="zis-program" />
      <ResourceListPage<Row>
        eyebrow="Koperasi"
        title="Program Penyaluran"
        description="Wadah target & realisasi penyaluran dana sosial per jenis dana."
        doctype="Program Penyaluran"
        fields={["name", "jenis_dana", "target_dana", "terkumpul", "tersalurkan", "status", "periode_mulai", "periode_selesai"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "modified", dir: "desc" }}
        searchFields={["name", "jenis_dana"]}
        selectFilters={[
          { key: "status", label: "Status", field: "status",
            options: ["Semua", "Aktif", "Selesai"].map((v) => ({ value: v, label: v })) },
        ]}
        addLabel="Buat Program"
        onAdd={() => setOpen(true)}
      />
      <ResourceCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="Program Penyaluran"
        title="Buat Program Penyaluran"
        description="Program baru untuk menampung penerimaan & penyaluran dana sosial."
        fields={PROGRAM_PENYALURAN_FIELDS}
        submitLabel="Simpan Program"
      />
    </>
  );
}

export const Route = createFileRoute("/kop/$sekolah/zis-program")({ component: ZisProgramPage });
