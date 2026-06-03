import { useMemo } from "react";
import { createFileRoute, Link, useParams} from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { PageGuide } from "../components/guide";
import { SISWA_PAGE_GUIDES } from "../components/siswa/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

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
      <div className="mb-4">
        <PageGuide
          storageNamespace="siswa-guide:"
          storageId="wali"
          title={SISWA_PAGE_GUIDES.wali.title}
          intro={SISWA_PAGE_GUIDES.wali.intro}
          steps={SISWA_PAGE_GUIDES.wali.steps}
          tips={SISWA_PAGE_GUIDES.wali.tips}
          roleLabels={SCHOOL_ROLE_LABEL}
        />
      </div>
      <ResourceListPage<Row>
        eyebrow="Siswa"
        title="Direktori Wali"
        doctype="Wali Siswa"
        fields={["name", "parent", "nama", "hubungan", "nik", "is_primary", "no_hp"]}
        rowKey={(r) => r.name}
        columns={columns}
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
