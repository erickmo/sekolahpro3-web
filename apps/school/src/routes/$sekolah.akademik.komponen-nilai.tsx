import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, SectionCard, type Column } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { ResourceListPage } from "../components/ResourceListPage";
import { CreateResourceModal, type FieldSpec } from "../components/akademik/CreateResourceModal";

type Row = {
  name: string;
  nama: string;
  kurikulum?: string;
  mata_pelajaran?: string;
  bobot?: number;
};

const COLUMNS: Column<Row>[] = [
  { key: "nama", header: "Komponen", sortable: true, cell: (r) => r.nama },
  {
    key: "kurikulum",
    header: "Kurikulum",
    cell: (r) => (r.kurikulum ? <Badge tone="brand">{r.kurikulum}</Badge> : "—"),
  },
  { key: "mata_pelajaran", header: "Mata Pelajaran", cell: (r) => r.mata_pelajaran ?? <span className="text-muted-fg">Semua</span> },
  {
    key: "bobot",
    header: "Bobot",
    align: "right",
    sortable: true,
    cell: (r) =>
      r.bobot !== undefined ? (
        <span className="tabular-nums font-medium">{r.bobot}%</span>
      ) : (
        "—"
      ),
  },
];

const FIELDS: FieldSpec[] = [
  { name: "nama", label: "Nama Komponen", required: true, colSpan: 2, placeholder: "UH, UTS, UAS, Tugas…" },
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
    help: "Kosongkan untuk komponen umum semua mapel pada kurikulum ini.",
  },
  {
    name: "bobot",
    label: "Bobot (%)",
    kind: "number",
    required: true,
    placeholder: "30",
    validate: (v) => {
      const n = typeof v === "number" ? v : Number(v);
      if (Number.isNaN(n)) return "Harus angka";
      if (n <= 0) return "Harus > 0";
      if (n > 100) return "Maks 100";
      return null;
    },
  },
];

interface BobotGroup {
  kurikulum: string;
  mata_pelajaran: string;
  total: number;
  count: number;
}

function groupBobot(rows: Row[]): BobotGroup[] {
  const map = new Map<string, BobotGroup>();
  for (const r of rows) {
    const kur = r.kurikulum ?? "—";
    const mapel = r.mata_pelajaran ?? "(Semua mapel)";
    const key = `${kur}::${mapel}`;
    const cur = map.get(key) ?? { kurikulum: kur, mata_pelajaran: mapel, total: 0, count: 0 };
    cur.total += Number(r.bobot ?? 0);
    cur.count += 1;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => Math.abs(b.total - 100) - Math.abs(a.total - 100));
}

function statusOf(total: number): { tone: "success" | "warning" | "danger"; label: string; bar: string } {
  if (Math.abs(total - 100) < 0.001) return { tone: "success", label: "100% lengkap", bar: "bg-emerald-500" };
  if (total > 100) return { tone: "danger", label: `Lebih ${(total - 100).toFixed(1)}%`, bar: "bg-rose-500" };
  return { tone: "warning", label: `Kurang ${(100 - total).toFixed(1)}%`, bar: "bg-amber-500" };
}

function BobotSummary({ rows }: { rows: Row[] }) {
  const groups = useMemo(() => groupBobot(rows), [rows]);
  if (groups.length === 0) return null;
  return (
    <SectionCard
      title="Validasi Bobot Komponen"
      description="Total bobot per (Kurikulum, Mata Pelajaran). Idealnya 100%."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groups.slice(0, 9).map((g) => {
          const st = statusOf(g.total);
          const widthPct = Math.min(100, g.total);
          return (
            <div
              key={`${g.kurikulum}::${g.mata_pelajaran}`}
              className="rounded-lg border border-border bg-bg p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-fg truncate">{g.mata_pelajaran}</div>
                  <div className="text-[11px] text-muted-fg truncate">{g.kurikulum}</div>
                </div>
                <Badge tone={st.tone}>{g.total.toFixed(1)}%</Badge>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${st.bar}`} style={{ width: `${widthPct}%` }} />
              </div>
              <div className="mt-1 text-[11px] text-muted-fg">
                {g.count} komponen · {st.label}
              </div>
            </div>
          );
        })}
      </div>
      {groups.length > 9 ? (
        <div className="mt-2 text-xs text-muted-fg">
          +{groups.length - 9} grup lain — gunakan filter kurikulum untuk fokus.
        </div>
      ) : null}
    </SectionCard>
  );
}

function KomponenNilaiPage() {
  const [openCreate, setOpenCreate] = useState(false);
  const allQ = useResourceList<Row>("Komponen Nilai", {
    fields: ["name", "nama", "kurikulum", "mata_pelajaran", "bobot"],
    limit_page_length: 500,
  });
  const rows = allQ.data ?? [];

  return (
    <div className="space-y-4">
      <BobotSummary rows={rows} />
      <ResourceListPage<Row>
        eyebrow="Akademik"
        title="Komponen Nilai"
        description="Definisi komponen penilaian (UH, UTS, UAS, Tugas) + bobot."
        doctype="Komponen Nilai"
        fields={["name", "nama", "kurikulum", "mata_pelajaran", "bobot"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "nama", dir: "asc" }}
        searchFields={["name", "nama", "mata_pelajaran"]}
        addLabel="Tambah Komponen"
        onAdd={() => setOpenCreate(true)}
      />
      <CreateResourceModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        doctype="Komponen Nilai"
        title="Tambah Komponen Nilai"
        description="Definisikan komponen + bobotnya. Total bobot per mapel harus 100%."
        fields={FIELDS}
      />
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/akademik/komponen-nilai")({ component: KomponenNilaiPage });
