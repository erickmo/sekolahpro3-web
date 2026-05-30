import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { CreateResourceModal, type FieldSpec } from "../components/akademik/CreateResourceModal";
import { useAkademikContextOptional } from "../lib/akademikContext";

type Row = {
  name: string;
  mata_pelajaran: string;
  tingkat?: string;
  tahun_ajaran?: string;
  tipe_kkm?: "Angka" | "Interval" | "Deskriptif";
  nilai_kkm?: number | null;
  interval_bawah?: number | null;
  interval_atas?: number | null;
  deskripsi_kkm?: string;
};

const TINGKAT_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const v = String(i + 1);
  return { value: v, label: `Tingkat ${v}` };
});

const TIPE_OPTIONS = [
  { value: "Angka", label: "Angka" },
  { value: "Interval", label: "Interval" },
  { value: "Deskriptif", label: "Deskriptif" },
];

const TIPE_TONE: Record<string, "neutral" | "brand" | "success" | "warning"> = {
  Angka: "brand",
  Interval: "success",
  Deskriptif: "warning",
};

function formatKkm(r: Row): string {
  if (r.tipe_kkm === "Interval" && r.interval_bawah != null && r.interval_atas != null) {
    return `${r.interval_bawah}–${r.interval_atas}`;
  }
  if (r.tipe_kkm === "Deskriptif" && r.deskripsi_kkm) {
    const t = r.deskripsi_kkm;
    return t.length > 30 ? `${t.slice(0, 30)}…` : t;
  }
  if (r.nilai_kkm != null) return String(r.nilai_kkm);
  return "—";
}

const COLUMNS: Column<Row>[] = [
  { key: "mata_pelajaran", header: "Mata Pelajaran", sortable: true, cell: (r) => r.mata_pelajaran },
  {
    key: "tingkat",
    header: "Tingkat",
    align: "center",
    cell: (r) => <span className="tabular-nums">{r.tingkat ?? "—"}</span>,
  },
  { key: "tahun_ajaran", header: "TA", cell: (r) => r.tahun_ajaran ?? "—" },
  {
    key: "tipe_kkm",
    header: "Tipe",
    cell: (r) =>
      r.tipe_kkm ? (
        <Badge tone={TIPE_TONE[r.tipe_kkm] ?? "neutral"}>{r.tipe_kkm}</Badge>
      ) : (
        "—"
      ),
  },
  {
    key: "nilai_kkm",
    header: "KKM",
    align: "right",
    cell: (r) => <span className="tabular-nums" title={r.deskripsi_kkm ?? undefined}>{formatKkm(r)}</span>,
  },
];

const FIELDS: FieldSpec[] = [
  {
    name: "mata_pelajaran",
    label: "Mata Pelajaran",
    kind: "link",
    required: true,
    linkDoctype: "Mata Pelajaran",
    linkLabelField: "nama_mapel",
    linkHintField: "kode_mapel",
  },
  {
    name: "tingkat",
    label: "Tingkat",
    kind: "select",
    required: true,
    options: TINGKAT_OPTIONS,
  },
  {
    name: "tahun_ajaran",
    label: "Tahun Ajaran",
    kind: "link",
    required: true,
    linkDoctype: "Tahun Ajaran",
    linkLabelField: "nama",
  },
  {
    name: "tipe_kkm",
    label: "Tipe KKM",
    kind: "select",
    required: true,
    defaultValue: "Angka",
    options: TIPE_OPTIONS,
  },
  {
    name: "nilai_kkm",
    label: "Nilai KKM (0–100)",
    kind: "number",
    required: true,
    showWhen: { field: "tipe_kkm", equals: "Angka" },
    validate: (v) => {
      const n = typeof v === "number" ? v : Number(v);
      if (Number.isNaN(n)) return "Harus angka";
      if (n < 0 || n > 100) return "Rentang 0–100";
      return null;
    },
  },
  {
    name: "interval_bawah",
    label: "Batas Bawah",
    kind: "number",
    required: true,
    showWhen: { field: "tipe_kkm", equals: "Interval" },
  },
  {
    name: "interval_atas",
    label: "Batas Atas",
    kind: "number",
    required: true,
    showWhen: { field: "tipe_kkm", equals: "Interval" },
    validate: (v, all) => {
      const atas = typeof v === "number" ? v : Number(v);
      const bawah = Number(all.interval_bawah);
      if (Number.isNaN(atas)) return "Harus angka";
      if (!Number.isNaN(bawah) && atas <= bawah) return "Harus > batas bawah";
      return null;
    },
  },
  {
    name: "deskripsi_kkm",
    label: "Deskripsi KKM",
    kind: "textarea",
    required: true,
    colSpan: 2,
    showWhen: { field: "tipe_kkm", equals: "Deskriptif" },
  },
];

function KkmPage() {
  const ctx = useAkademikContextOptional();
  const [openCreate, setOpenCreate] = useState(false);
  const initialValues = useMemo<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = { tipe_kkm: "Angka" };
    if (ctx?.tahunAjaran) init.tahun_ajaran = ctx.tahunAjaran;
    return init;
  }, [ctx?.tahunAjaran]);

  const baseFilters = useMemo(() => {
    if (!ctx?.tahunAjaran) return undefined;
    return [["tahun_ajaran", "=", ctx.tahunAjaran]] as Array<[string, string, string]>;
  }, [ctx?.tahunAjaran]);

  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Akademik"
        title="KKM (Kriteria Ketuntasan Minimal)"
        doctype="KKM"
        fields={[
          "name",
          "mata_pelajaran",
          "tingkat",
          "tahun_ajaran",
          "tipe_kkm",
          "nilai_kkm",
          "interval_bawah",
          "interval_atas",
          "deskripsi_kkm",
        ]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "mata_pelajaran", dir: "asc" }}
        searchFields={["name", "mata_pelajaran"]}
        selectFilters={[
          {
            key: "tingkat",
            field: "tingkat",
            label: "Tingkat",
            options: TINGKAT_OPTIONS,
          },
          {
            key: "tipe_kkm",
            field: "tipe_kkm",
            label: "Tipe",
            options: TIPE_OPTIONS,
          },
        ]}
        {...(baseFilters ? { baseFilters } : {})}
        addLabel="Set KKM"
        onAdd={() => setOpenCreate(true)}
      />
      <CreateResourceModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        doctype="KKM"
        title="Set KKM"
        description="Tetapkan Kriteria Ketuntasan Minimal untuk mapel & tingkat."
        fields={FIELDS}
        initialValues={initialValues}
      />
    </>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/kkm")({ component: KkmPage });
