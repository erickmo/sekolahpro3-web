import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

// Verified fields on `Anggota Koperasi` doctype:
// nomor_anggota (Data), nasabah (Link Nasabah), jenis_anggota (Select),
// tanggal_masuk (Date), status (Select), simpanan_pokok_lunas (Check).
// Display name lives in linked Nasabah (TODO: enrich via a join/extra fetch).
type Row = {
  name: string;
  nomor_anggota?: string;
  nasabah?: string;
  jenis_anggota?: string;
  tanggal_masuk?: string;
  status?: string;
};

const STATUS_TONE: Record<string, "success" | "neutral" | "danger" | "warning"> = {
  Aktif: "success",
  "Non-aktif": "neutral",
  Keluar: "danger",
  Pending: "warning",
};

const JENIS_TONE: Record<string, "brand" | "success" | "neutral" | "warning"> = {
  Siswa: "brand",
  Guru: "success",
  Staff: "neutral",
  "Orang Tua": "warning",
};

const COLUMNS: Column<Row>[] = [
  {
    key: "nomor_anggota",
    header: "No Anggota",
    sortable: true,
    cell: (r) => <span className="font-mono text-xs">{r.nomor_anggota ?? r.name}</span>,
  },
  {
    key: "nasabah",
    header: "Nasabah",
    sortable: true,
    cell: (r) => <span className="text-sm">{r.nasabah ?? "—"}</span>,
  },
  {
    key: "jenis_anggota",
    header: "Jenis",
    sortable: true,
    cell: (r) =>
      r.jenis_anggota ? (
        <Badge tone={JENIS_TONE[r.jenis_anggota] ?? "neutral"}>{r.jenis_anggota}</Badge>
      ) : (
        <span className="text-xs text-muted-fg">—</span>
      ),
  },
  {
    key: "tanggal_masuk",
    header: "Tgl Masuk",
    sortable: true,
    cell: (r) => <span className="text-sm tabular-nums">{r.tanggal_masuk ?? "—"}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    cell: (r) =>
      r.status ? (
        <Badge tone={STATUS_TONE[r.status] ?? "neutral"} dot>
          {r.status}
        </Badge>
      ) : (
        <span className="text-xs text-muted-fg">—</span>
      ),
  },
];

function KoperasiDaftarPage() {
  const navigate = useNavigate();
  return (
    <ResourceListPage<Row>
      eyebrow="Layanan"
      title="Koperasi"
      description="Kelola keanggotaan, simpanan, dan pinjaman koperasi sekolah."
      doctype="Anggota Koperasi"
      fields={["name", "nomor_anggota", "nasabah", "jenis_anggota", "tanggal_masuk", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "tanggal_masuk", dir: "desc" }}
      searchFields={["name", "nomor_anggota", "nasabah"]}
      selectFilters={[
        {
          key: "status",
          label: "Status",
          field: "status",
          options: ["Semua", "Aktif", "Non-aktif", "Keluar", "Pending"].map((v) => ({
            value: v,
            label: v,
          })),
        },
        {
          key: "jenis",
          label: "Jenis",
          field: "jenis_anggota",
          options: ["Semua", "Siswa", "Guru", "Staff", "Orang Tua"].map((v) => ({
            value: v,
            label: v,
          })),
        },
      ]}
      addLabel="Tambah Anggota"
      onAdd={() => alert("Form anggota koperasi (TODO)")}
      onRowClick={(r) =>
        navigate({ to: "/koperasi/$noAnggota", params: { noAnggota: r.nomor_anggota ?? r.name } })
      }
    />
  );
}

export const Route = createFileRoute("/koperasi/daftar")({ component: KoperasiDaftarPage });
