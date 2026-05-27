import { useState, type ReactNode } from "react";
import { Badge, SectionCard, Tabs, type TabItem } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";

interface Props {
  mapelName: string;
}

type TabKey = "kkm" | "komponen" | "konfigurasi" | "entri";

interface TabConfig {
  key: TabKey;
  label: string;
  doctype: string;
  render: () => ReactNode;
}

export function MapelRelatedTabs({ mapelName }: Props) {
  const [active, setActive] = useState<TabKey>("kkm");

  const tabs: TabConfig[] = [
    { key: "kkm", label: "KKM", doctype: "KKM", render: () => <KkmTab mapelName={mapelName} /> },
    { key: "komponen", label: "Komponen Nilai", doctype: "Komponen Nilai", render: () => <KomponenTab mapelName={mapelName} /> },
    { key: "konfigurasi", label: "Konfigurasi Penilaian", doctype: "Konfigurasi Penilaian", render: () => <KonfigurasiTab mapelName={mapelName} /> },
    { key: "entri", label: "Entri Nilai", doctype: "Entri Nilai", render: () => <EntriTab mapelName={mapelName} /> },
  ];

  const items: TabItem[] = tabs.map((t) => ({
    key: t.key,
    label: t.label,
    active: active === t.key,
    render: ({ className, children }) => (
      <button type="button" onClick={() => setActive(t.key)} className={className}>
        {children}
      </button>
    ),
  }));

  const current = tabs.find((t) => t.key === active);

  return (
    <SectionCard
      title="Data Terkait"
      description="Konfigurasi penilaian dan entri nilai untuk mata pelajaran ini."
    >
      <div className="-mt-1">
        <Tabs items={items} />
        <div className="pt-4">{current?.render()}</div>
      </div>
    </SectionCard>
  );
}

const TABLE_HEADER_CLS = "bg-muted text-xs uppercase tracking-wider text-muted-fg";
const TABLE_CELL_CLS = "px-3 py-2 text-sm";

interface MiniTableProps<T> {
  rows: T[];
  isLoading: boolean;
  isError: boolean;
  columns: { header: string; cell: (r: T) => ReactNode; align?: "left" | "right" | "center" }[];
  emptyLabel: string;
  keyFn: (r: T) => string;
}

function MiniTable<T>({ rows, isLoading, isError, columns, emptyLabel, keyFn }: MiniTableProps<T>) {
  if (isLoading) {
    return <div className="py-6 text-center text-sm text-muted-fg">Memuat…</div>;
  }
  if (isError) {
    return <div className="py-6 text-center text-sm text-rose-700">Gagal memuat data.</div>;
  }
  if (rows.length === 0) {
    return <div className="py-6 text-center text-sm text-muted-fg">{emptyLabel}</div>;
  }
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="min-w-full divide-y divide-border">
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th
                key={i}
                className={`${TABLE_CELL_CLS} ${TABLE_HEADER_CLS} text-${c.align ?? "left"}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={keyFn(r)} className="hover:bg-muted/50">
              {columns.map((c, i) => (
                <td key={i} className={`${TABLE_CELL_CLS} text-${c.align ?? "left"}`}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type KkmRow = {
  name: string;
  tingkat?: string;
  tahun_ajaran?: string;
  tipe_kkm?: string;
  nilai_kkm?: number;
  interval_bawah?: number;
  interval_atas?: number;
  deskripsi_kkm?: string;
};

function formatKkm(r: KkmRow): string {
  if (r.tipe_kkm === "Interval" && r.interval_bawah != null && r.interval_atas != null) {
    return `${r.interval_bawah}–${r.interval_atas}`;
  }
  if (r.tipe_kkm === "Deskriptif" && r.deskripsi_kkm) {
    return r.deskripsi_kkm.slice(0, 30);
  }
  if (r.nilai_kkm != null) return String(r.nilai_kkm);
  return "—";
}

function KkmTab({ mapelName }: { mapelName: string }) {
  const q = useResourceList<KkmRow>("KKM", {
    fields: ["name", "tingkat", "tahun_ajaran", "tipe_kkm", "nilai_kkm", "interval_bawah", "interval_atas", "deskripsi_kkm"],
    filters: [["mata_pelajaran", "=", mapelName]],
    order_by: "`tingkat` asc",
    limit_page_length: 50,
  });
  return (
    <MiniTable<KkmRow>
      rows={q.data ?? []}
      isLoading={q.isLoading}
      isError={q.isError}
      emptyLabel="Belum ada KKM untuk mapel ini."
      keyFn={(r) => r.name}
      columns={[
        { header: "Tingkat", cell: (r) => r.tingkat ?? "—", align: "center" },
        { header: "TA", cell: (r) => r.tahun_ajaran ?? "—" },
        { header: "Tipe", cell: (r) => (r.tipe_kkm ? <Badge tone="brand">{r.tipe_kkm}</Badge> : "—") },
        { header: "Nilai", cell: (r) => <span className="tabular-nums">{formatKkm(r)}</span>, align: "right" },
      ]}
    />
  );
}

type KomponenRow = { name: string; nama: string; bobot?: number; kurikulum?: string };

function KomponenTab({ mapelName }: { mapelName: string }) {
  const q = useResourceList<KomponenRow>("Komponen Nilai", {
    fields: ["name", "nama", "bobot", "kurikulum"],
    filters: [["mata_pelajaran", "=", mapelName]],
    order_by: "`nama` asc",
    limit_page_length: 50,
  });
  const rows = q.data ?? [];
  const total = rows.reduce((acc, r) => acc + Number(r.bobot ?? 0), 0);
  return (
    <div className="space-y-3">
      {rows.length > 0 ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-bg px-3 py-2">
          <div className="text-xs text-muted-fg">Total bobot</div>
          <Badge tone={Math.abs(total - 100) < 0.001 ? "success" : total > 100 ? "danger" : "warning"}>
            {total.toFixed(1)}%
          </Badge>
        </div>
      ) : null}
      <MiniTable<KomponenRow>
        rows={rows}
        isLoading={q.isLoading}
        isError={q.isError}
        emptyLabel="Belum ada komponen nilai untuk mapel ini."
        keyFn={(r) => r.name}
        columns={[
          { header: "Komponen", cell: (r) => r.nama },
          { header: "Kurikulum", cell: (r) => r.kurikulum ?? "—" },
          {
            header: "Bobot",
            cell: (r) => <span className="tabular-nums">{r.bobot ?? "—"}%</span>,
            align: "right",
          },
        ]}
      />
    </div>
  );
}

type KonfigRow = {
  name: string;
  kurikulum?: string;
  tingkat?: string;
  tipe?: string;
  nilai_min?: number;
  nilai_maks?: number;
};

function KonfigurasiTab({ mapelName }: { mapelName: string }) {
  const q = useResourceList<KonfigRow>("Konfigurasi Penilaian", {
    fields: ["name", "kurikulum", "tingkat", "tipe", "nilai_min", "nilai_maks"],
    filters: [["mata_pelajaran", "=", mapelName]],
    order_by: "`kurikulum` asc",
    limit_page_length: 50,
  });
  return (
    <MiniTable<KonfigRow>
      rows={q.data ?? []}
      isLoading={q.isLoading}
      isError={q.isError}
      emptyLabel="Belum ada konfigurasi penilaian khusus mapel ini."
      keyFn={(r) => r.name}
      columns={[
        { header: "Kurikulum", cell: (r) => r.kurikulum ?? "—" },
        { header: "Tingkat", cell: (r) => r.tingkat ?? "Semua", align: "center" },
        { header: "Tipe", cell: (r) => (r.tipe ? <Badge tone="brand">{r.tipe}</Badge> : "—") },
        {
          header: "Rentang",
          cell: (r) =>
            r.tipe === "Angka" && r.nilai_min != null && r.nilai_maks != null ? (
              <span className="tabular-nums">{r.nilai_min}–{r.nilai_maks}</span>
            ) : (
              "—"
            ),
          align: "right",
        },
      ]}
    />
  );
}

type EntriRow = { name: string; modified?: string; semester?: string; tahun_ajaran?: string };

function EntriTab({ mapelName }: { mapelName: string }) {
  const q = useResourceList<EntriRow>("Entri Nilai", {
    fields: ["name", "modified", "semester", "tahun_ajaran"],
    filters: [["mata_pelajaran", "=", mapelName]],
    order_by: "`modified` desc",
    limit_page_length: 25,
  });
  return (
    <MiniTable<EntriRow>
      rows={q.data ?? []}
      isLoading={q.isLoading}
      isError={q.isError}
      emptyLabel="Belum ada entri nilai untuk mapel ini."
      keyFn={(r) => r.name}
      columns={[
        { header: "ID", cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
        { header: "Semester", cell: (r) => r.semester ?? "—" },
        { header: "TA", cell: (r) => r.tahun_ajaran ?? "—" },
        {
          header: "Diperbarui",
          cell: (r) =>
            r.modified ? new Date(r.modified).toLocaleDateString("id-ID") : "—",
          align: "right",
        },
      ]}
    />
  );
}
