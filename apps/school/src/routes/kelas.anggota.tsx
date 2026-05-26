import { createFileRoute } from "@tanstack/react-router";
import { type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

// TODO(/kelas/anggota): Anggota Rombel is a child table doctype.
// Actual fields: {siswa, no_urut, tanggal_masuk_rombel, status}.
// `rombongan_belajar` + `nomor_absen` + `tahun_ajaran` are best-guesses for
// a future flattened/view endpoint; may need parent lookup via `parent`.
type Row = { name: string; rombongan_belajar?: string; siswa?: string; nomor_absen?: number; tahun_ajaran?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "rombongan_belajar", header: "Rombel", sortable: true, cell: (r) => r.rombongan_belajar ?? "—" },
  { key: "siswa", header: "Siswa", cell: (r) => r.siswa ?? "—" },
  { key: "nomor_absen", header: "No. Absen", align: "right", cell: (r) => r.nomor_absen ?? "—" },
  { key: "tahun_ajaran", header: "TA", cell: (r) => r.tahun_ajaran ?? "—" },
];

function AnggotaRombelPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Kelas"
      title="Anggota Rombel"
      doctype="Anggota Rombel"
      fields={["name", "siswa"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "name", dir: "asc" }}
      searchFields={["name", "siswa"]}
      addLabel="Tambah Anggota"
      onAdd={() => alert("Form anggota rombel (P2)")}
    />
  );
}

export const Route = createFileRoute("/kelas/anggota")({ component: AnggotaRombelPage });
