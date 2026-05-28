import { useState } from "react";
import { createFileRoute, useNavigate, useParams} from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { CreateResourceModal, type FieldSpec } from "../components/akademik/CreateResourceModal";

type Row = {
  name: string;
  nama_mapel: string;
  kode_mapel: string;
  kelompok_mapel?: string;
  kurikulum?: string;
  is_wajib?: 0 | 1;
};

const KELOMPOK_OPTIONS = [
  { value: "Umum", label: "Umum" },
  { value: "Pilihan", label: "Pilihan" },
  { value: "Muatan Lokal", label: "Muatan Lokal" },
  { value: "P5", label: "P5" },
  { value: "Kejuruan", label: "Kejuruan" },
];

const KELOMPOK_TONE: Record<string, "neutral" | "success" | "warning" | "brand" | "danger"> = {
  Umum: "brand",
  Pilihan: "warning",
  "Muatan Lokal": "neutral",
  P5: "success",
  Kejuruan: "danger",
};

const COLUMNS: Column<Row>[] = [
  {
    key: "kode_mapel",
    header: "Kode",
    sortable: true,
    cell: (r) => <span className="font-mono text-xs uppercase">{r.kode_mapel}</span>,
  },
  { key: "nama_mapel", header: "Nama Mata Pelajaran", sortable: true, cell: (r) => r.nama_mapel },
  { key: "kurikulum", header: "Kurikulum", cell: (r) => r.kurikulum ?? "—" },
  {
    key: "kelompok_mapel",
    header: "Kelompok",
    cell: (r) =>
      r.kelompok_mapel ? (
        <Badge tone={KELOMPOK_TONE[r.kelompok_mapel] ?? "neutral"}>{r.kelompok_mapel}</Badge>
      ) : (
        "—"
      ),
  },
  {
    key: "is_wajib",
    header: "Wajib",
    cell: (r) => (r.is_wajib ? <Badge tone="success" dot>Wajib</Badge> : <span className="text-muted-fg">—</span>),
  },
];

const FIELDS: FieldSpec[] = [
  { name: "nama_mapel", label: "Nama Mata Pelajaran", required: true, colSpan: 2 },
  { name: "kode_mapel", label: "Kode", required: true, placeholder: "MAT-01", uppercase: true },
  {
    name: "kurikulum",
    label: "Kurikulum",
    kind: "link",
    required: true,
    linkDoctype: "Kurikulum",
    linkLabelField: "nama",
    linkHintField: "tipe_kurikulum",
  },
  {
    name: "kelompok_mapel",
    label: "Kelompok",
    kind: "select",
    required: true,
    options: KELOMPOK_OPTIONS,
  },
  { name: "is_wajib", label: "Mata pelajaran wajib", kind: "checkbox", defaultValue: true },
  { name: "keterangan", label: "Keterangan", kind: "textarea", colSpan: 2 },
];

function MapelPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const navigate = useNavigate();
  const [openCreate, setOpenCreate] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Akademik"
        title="Mata Pelajaran"
        doctype="Mata Pelajaran"
        fields={["name", "nama_mapel", "kode_mapel", "kelompok_mapel", "kurikulum", "is_wajib"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "kode_mapel", dir: "asc" }}
        searchFields={["name", "nama_mapel", "kode_mapel"]}
        selectFilters={[
          {
            key: "kelompok_mapel",
            field: "kelompok_mapel",
            label: "Kelompok",
            options: KELOMPOK_OPTIONS,
          },
        ]}
        addLabel="Tambah Mapel"
        onAdd={() => setOpenCreate(true)}
        onRowClick={(r) => navigate({ to: "/$sekolah/akademik/mapel/$name", params: { sekolah, name: r.name } })}
      />
      <CreateResourceModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        doctype="Mata Pelajaran"
        title="Tambah Mata Pelajaran"
        description="Buat entri mata pelajaran baru."
        fields={FIELDS}
      />
    </>
  );
}

export const Route = createFileRoute("/$sekolah/akademik/daftar")({ component: MapelPage });
