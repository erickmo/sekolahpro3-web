import { useMemo } from "react";
import { createFileRoute, Link, useParams} from "@tanstack/react-router";
import { Badge, EmptyState, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { summarizeWali } from "../lib/orang/siswaListSummaries";

// Summary buckets the directory by relationship (Ayah/Ibu/Wali).
const SUMMARY_FIELDS = ["name", "hubungan"];
// Styling for the EmptyState's primary link (mirrors the brand button look).
const PRIMARY_LINK_CLASS =
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-5 bg-brand text-white hover:bg-brand/90";

type Row = {
  name: string;
  parent?: string;
  nama: string;
  hubungan?: "Ayah" | "Ibu" | "Wali";
  nik?: string;
  is_primary?: 0 | 1;
  no_hp?: string;
};

function makeColumns(sekolah: string): Column<Row>[] {
  return [
  {
    key: "primary",
    header: "Utama",
    cell: (r) => (r.is_primary ? <Badge tone="success" dot>Utama</Badge> : <span className="text-muted-fg">—</span>),
  },
  {
    key: "parent",
    header: "Siswa",
    sortable: true,
    cell: (r) =>
      r.parent ? (
        <Link
          to="/sch/$sekolah/siswa/$nis"
          params={{ sekolah, nis: r.parent }}
          className="font-mono text-xs text-brand hover:underline"
        >
          {r.parent}
        </Link>
      ) : (
        "—"
      ),
  },
  { key: "nama", header: "Nama Wali", sortable: true, cell: (r) => r.nama },
  {
    key: "hubungan",
    header: "Hubungan",
    cell: (r) => <Badge tone="brand">{r.hubungan ?? "—"}</Badge>,
  },
  { key: "no_hp", header: "Telepon", cell: (r) => r.no_hp ?? "—" },
  ];
}

function WaliPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const columns = useMemo(() => makeColumns(sekolah), [sekolah]);

  return (
    <>
      <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-800">
        Wali sekarang adalah <strong>child table</strong> dari Siswa. Halaman ini hanya direktori
        read-only (cari wali, jump ke siswa). Untuk tambah/edit/hapus wali, buka detail siswa →
        tab <strong>Wali</strong>.
      </div>
      <ResourceListPage<Row>
        eyebrow="Siswa"
        title="Direktori Wali"
        doctype="Wali Siswa"
        fields={["name", "parent", "nama", "hubungan", "nik", "is_primary", "no_hp"]}
        rowKey={(r) => r.name}
        columns={columns}
        summarize={summarizeWali}
        summaryFields={SUMMARY_FIELDS}
        gettingStarted={
          <EmptyState
            title="Belum ada data wali"
            description="Wali ditambahkan dari detail siswa. Buka direktori siswa, pilih siswa, lalu isi tab Wali."
            action={
              <Link to="/sch/$sekolah/siswa/daftar" params={{ sekolah }} className={PRIMARY_LINK_CLASS}>
                Buka Direktori Siswa
              </Link>
            }
          />
        }
        defaultSort={{ key: "nama", dir: "asc" }}
        searchFields={["nama", "no_hp"]}
        selectFilters={[
          {
            key: "hubungan",
            label: "Hubungan",
            field: "hubungan",
            options: ["Semua", "Ayah", "Ibu", "Wali"].map((v) => ({ value: v, label: v })),
          },
          {
            key: "primary",
            label: "Wali Utama",
            field: "is_primary",
            options: [
              { value: "Semua", label: "Semua" },
              { value: "1", label: "Hanya Utama" },
              { value: "0", label: "Bukan Utama" },
            ],
          },
        ]}
      />
    </>
  );
}

export const Route = createFileRoute("/sch/$sekolah/siswa/wali")({ component: WaliPage });
