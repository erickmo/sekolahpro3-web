import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { CreateResourceModal, type FieldSpec } from "../components/akademik/CreateResourceModal";

type Row = {
  name: string;
  kurikulum?: string;
  mata_pelajaran?: string;
  tingkat?: string;
  tipe?: "Angka" | "Huruf" | "Deskriptif";
  nilai_min?: number;
  nilai_maks?: number;
};

const TIPE_OPTIONS = [
  { value: "Angka", label: "Angka" },
  { value: "Huruf", label: "Huruf" },
  { value: "Deskriptif", label: "Deskriptif" },
];

const TIPE_TONE: Record<string, "brand" | "success" | "warning"> = {
  Angka: "brand",
  Huruf: "success",
  Deskriptif: "warning",
};

const COLUMNS: Column<Row>[] = [
  { key: "kurikulum", header: "Kurikulum", cell: (r) => r.kurikulum ?? "—" },
  {
    key: "mata_pelajaran",
    header: "Mata Pelajaran",
    cell: (r) => r.mata_pelajaran ?? <span className="text-muted-fg">Semua</span>,
  },
  {
    key: "tingkat",
    header: "Tingkat",
    align: "center",
    cell: (r) => r.tingkat ?? <span className="text-muted-fg">Semua</span>,
  },
  {
    key: "tipe",
    header: "Tipe",
    cell: (r) => (r.tipe ? <Badge tone={TIPE_TONE[r.tipe] ?? "neutral"}>{r.tipe}</Badge> : "—"),
  },
  {
    key: "nilai_min",
    header: "Rentang",
    align: "right",
    cell: (r) =>
      r.tipe === "Angka" && r.nilai_min != null && r.nilai_maks != null ? (
        <span className="tabular-nums">{r.nilai_min}–{r.nilai_maks}</span>
      ) : (
        <span className="text-muted-fg">—</span>
      ),
  },
];

const FIELDS: FieldSpec[] = [
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
    name: "mata_pelajaran",
    label: "Mata Pelajaran (opsional)",
    kind: "link",
    linkDoctype: "Mata Pelajaran",
    linkLabelField: "nama_mapel",
    linkHintField: "kode_mapel",
    help: "Kosongkan untuk konfigurasi default semua mapel pada kurikulum ini.",
  },
  {
    name: "tingkat",
    label: "Tingkat (opsional)",
    placeholder: "1..12 atau kosong = semua",
  },
  {
    name: "tipe",
    label: "Tipe Penilaian",
    kind: "select",
    required: true,
    defaultValue: "Angka",
    options: TIPE_OPTIONS,
  },
  {
    name: "nilai_min",
    label: "Nilai Minimum",
    kind: "number",
    showWhen: { field: "tipe", equals: "Angka" },
    defaultValue: 0,
  },
  {
    name: "nilai_maks",
    label: "Nilai Maksimum",
    kind: "number",
    showWhen: { field: "tipe", equals: "Angka" },
    defaultValue: 100,
    validate: (v, all) => {
      const maks = typeof v === "number" ? v : Number(v);
      const min = Number(all.nilai_min);
      if (Number.isNaN(maks)) return "Harus angka";
      if (!Number.isNaN(min) && maks <= min) return "Harus > nilai minimum";
      return null;
    },
  },
];

function KonfigPage() {
  const [openCreate, setOpenCreate] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Akademik"
        title="Konfigurasi Penilaian"
        description="Atur tipe penilaian (Angka/Huruf/Deskriptif) per kurikulum, mapel, atau tingkat."
        doctype="Konfigurasi Penilaian"
        fields={["name", "kurikulum", "mata_pelajaran", "tingkat", "tipe", "nilai_min", "nilai_maks"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "kurikulum", dir: "asc" }}
        searchFields={["name", "mata_pelajaran"]}
        selectFilters={[
          { key: "tipe", field: "tipe", label: "Tipe", options: TIPE_OPTIONS },
        ]}
        addLabel="Tambah Konfigurasi"
        onAdd={() => setOpenCreate(true)}
      />
      <CreateResourceModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        doctype="Konfigurasi Penilaian"
        title="Tambah Konfigurasi Penilaian"
        description="Buat konfigurasi untuk kurikulum, dengan opsi scope ke mapel / tingkat tertentu."
        fields={FIELDS}
      />
    </>
  );
}

export const Route = createFileRoute("/$sekolah/akademik/konfigurasi")({ component: KonfigPage });
