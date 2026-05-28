import { createFileRoute, useNavigate, useParams} from "@tanstack/react-router";
import { Badge, Button, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { useAkademikContextOptional } from "../lib/akademikContext";
import { useMemo } from "react";

type Row = {
  name: string;
  siswa: string;
  mata_pelajaran: string;
  semester?: string;
  tahun_ajaran?: string;
  tingkat?: string;
  nilai_akhir?: number;
  predikat?: string;
};

const PREDIKAT_TONE: Record<string, "success" | "brand" | "warning" | "danger"> = {
  A: "success",
  B: "brand",
  C: "warning",
  D: "danger",
};

const COLUMNS: Column<Row>[] = [
  { key: "siswa", header: "Siswa", sortable: true, cell: (r) => r.siswa },
  { key: "mata_pelajaran", header: "Mata Pelajaran", sortable: true, cell: (r) => r.mata_pelajaran },
  { key: "tingkat", header: "Tingkat", align: "center", cell: (r) => r.tingkat ?? "—" },
  { key: "semester", header: "Semester", cell: (r) => r.semester ?? "—" },
  { key: "tahun_ajaran", header: "TA", cell: (r) => r.tahun_ajaran ?? "—" },
  {
    key: "nilai_akhir",
    header: "Nilai Akhir",
    align: "right",
    sortable: true,
    cell: (r) => (r.nilai_akhir != null ? <span className="tabular-nums">{r.nilai_akhir.toFixed(2)}</span> : "—"),
  },
  {
    key: "predikat",
    header: "Predikat",
    align: "center",
    cell: (r) => (r.predikat ? <Badge tone={PREDIKAT_TONE[r.predikat] ?? "neutral"}>{r.predikat}</Badge> : "—"),
  },
];

function EntriNilaiPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const navigate = useNavigate();
  const ctx = useAkademikContextOptional();

  const baseFilters = useMemo(() => {
    const out: Array<[string, string, string]> = [];
    if (ctx?.tahunAjaran) out.push(["tahun_ajaran", "=", ctx.tahunAjaran]);
    if (ctx?.semester) out.push(["semester", "=", ctx.semester]);
    return out.length > 0 ? out : undefined;
  }, [ctx?.tahunAjaran, ctx?.semester]);

  const openEditor = () => {
    const search: Record<string, string> = {};
    if (ctx?.semester) search.semester = ctx.semester;
    if (ctx?.tahunAjaran) search.ta = ctx.tahunAjaran;
    navigate({ to: "/$sekolah/akademik/entri-nilai/edit", params: { sekolah }, search });
  };

  return (
    <ResourceListPage<Row>
      eyebrow="Akademik"
      title="Entri Nilai"
      description="Rekap dokumen entri nilai per siswa × mapel × semester. Gunakan editor grid untuk input cepat."
      doctype="Entri Nilai"
      fields={[
        "name",
        "siswa",
        "mata_pelajaran",
        "tingkat",
        "semester",
        "tahun_ajaran",
        "nilai_akhir",
        "predikat",
      ]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "modified", dir: "desc" }}
      searchFields={["name", "siswa", "mata_pelajaran"]}
      {...(baseFilters ? { baseFilters } : {})}
      addLabel="Buka Editor Grid"
      onAdd={openEditor}
      extraActions={
        <Button variant="outline" onClick={openEditor}>
          Editor Grid
        </Button>
      }
    />
  );
}

export const Route = createFileRoute("/$sekolah/akademik/entri-nilai")({ component: EntriNilaiPage });
