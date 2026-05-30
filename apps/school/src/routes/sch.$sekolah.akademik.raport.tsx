import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { useAkademikContextOptional } from "../lib/akademikContext";
import { GenerateRaportModal } from "../components/akademik/GenerateRaportModal";

type RaportStatus =
  | "Draft"
  | "Review"
  | "Submitted"
  | "Final"
  | "Locked"
  | "Revised"
  | "Tercetak";

type Row = {
  name: string;
  siswa: string;
  semester?: string;
  tahun_ajaran?: string;
  status?: RaportStatus;
  rekap_hadir?: number;
  rekap_izin?: number;
  rekap_sakit?: number;
  rekap_alpha?: number;
};

const STATUS_OPTIONS: { value: RaportStatus; label: string }[] = [
  { value: "Draft", label: "Draft" },
  { value: "Review", label: "Review" },
  { value: "Submitted", label: "Submitted" },
  { value: "Final", label: "Final" },
  { value: "Locked", label: "Locked" },
  { value: "Revised", label: "Revised" },
  { value: "Tercetak", label: "Tercetak" },
];

const STATUS_TONE: Record<RaportStatus, "warning" | "brand" | "success" | "neutral" | "danger"> = {
  Draft: "warning",
  Review: "brand",
  Submitted: "brand",
  Final: "success",
  Locked: "neutral",
  Revised: "danger",
  Tercetak: "success",
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID Raport", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "siswa", header: "Siswa", sortable: true, cell: (r) => r.siswa },
  { key: "semester", header: "Semester", cell: (r) => r.semester ?? "—" },
  { key: "tahun_ajaran", header: "TA", cell: (r) => r.tahun_ajaran ?? "—" },
  {
    key: "rekap_hadir",
    header: "Kehadiran",
    align: "right",
    cell: (r) => {
      const h = r.rekap_hadir ?? 0;
      const i = r.rekap_izin ?? 0;
      const s = r.rekap_sakit ?? 0;
      const a = r.rekap_alpha ?? 0;
      const total = h + i + s + a;
      if (total === 0) return <span className="text-muted-fg">—</span>;
      return (
        <span className="tabular-nums text-xs" title={`H:${h} I:${i} S:${s} A:${a}`}>
          {h}/{total}
        </span>
      );
    },
  },
  {
    key: "status",
    header: "Status",
    cell: (r) =>
      r.status ? (
        <Badge tone={STATUS_TONE[r.status] ?? "neutral"} dot>
          {r.status}
        </Badge>
      ) : (
        "—"
      ),
  },
];

function RaportPage() {
  const ctx = useAkademikContextOptional();
  const [openGenerate, setOpenGenerate] = useState(false);

  const baseFilters = useMemo(() => {
    const out: Array<[string, string, string]> = [];
    if (ctx?.tahunAjaran) out.push(["tahun_ajaran", "=", ctx.tahunAjaran]);
    if (ctx?.semester) out.push(["semester", "=", ctx.semester]);
    return out.length > 0 ? out : undefined;
  }, [ctx?.tahunAjaran, ctx?.semester]);

  return (
    <>
    <ResourceListPage<Row>
      eyebrow="Akademik"
      title="Raport"
      description="Kelola raport siswa per semester. Status mengikuti alur Draft → Review → Submitted → Final → Locked/Tercetak."
      doctype="Raport"
      fields={[
        "name",
        "siswa",
        "semester",
        "tahun_ajaran",
        "status",
        "rekap_hadir",
        "rekap_izin",
        "rekap_sakit",
        "rekap_alpha",
      ]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "name", dir: "desc" }}
      searchFields={["name", "siswa"]}
      selectFilters={[
        {
          key: "status",
          field: "status",
          label: "Status",
          options: STATUS_OPTIONS,
        },
      ]}
      {...(baseFilters ? { baseFilters } : {})}
      addLabel="Generate Raport"
      onAdd={() => setOpenGenerate(true)}
    />
    <GenerateRaportModal
      open={openGenerate}
      onClose={() => setOpenGenerate(false)}
      initial={{
        ...(ctx?.semester ? { semester: ctx.semester } : {}),
        ...(ctx?.tahunAjaran ? { tahunAjaran: ctx.tahunAjaran } : {}),
      }}
    />
    </>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/raport")({ component: RaportPage });
