import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@sekolahpro/ui";
import { SimpleDetailPage } from "../components/akademik/SimpleDetailPage";

function MapelDetailPage() {
  const { name } = Route.useParams();
  return (
    <SimpleDetailPage
      doctype="Mata Pelajaran"
      name={name}
      eyebrow="Detail Mata Pelajaran"
      parentLabel="Mata Pelajaran"
      parentTo="/akademik"
      titleField="nama_mapel"
      statusField="status"
      fields={[
        { label: "Kode", field: "kode_mapel", format: (v) => <span className="font-mono">{v ? String(v) : "—"}</span> },
        { label: "Nama", field: "nama_mapel" },
        { label: "Kelompok", field: "kelompok_mapel", format: (v) => v ? <Badge tone="neutral">{String(v)}</Badge> : "—" },
      ]}
    />
  );
}

export const Route = createFileRoute("/akademik/mapel/$name")({ component: MapelDetailPage });
