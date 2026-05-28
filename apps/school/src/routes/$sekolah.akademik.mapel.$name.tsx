import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@sekolahpro/ui";
import { SimpleDetailPage } from "../components/akademik/SimpleDetailPage";
import { MapelRelatedTabs } from "../components/akademik/MapelRelatedTabs";

const KELOMPOK_TONE: Record<string, "brand" | "success" | "warning" | "neutral" | "danger"> = {
  Umum: "brand",
  Pilihan: "warning",
  "Muatan Lokal": "neutral",
  P5: "success",
  Kejuruan: "danger",
};

function MapelDetailPage() {
  const { name, sekolah } = Route.useParams();
  return (
    <SimpleDetailPage
      sekolah={sekolah}
      doctype="Mata Pelajaran"
      name={name}
      eyebrow="Detail Mata Pelajaran"
      parentLabel="Mata Pelajaran"
      parentTo="/$sekolah/akademik/daftar"
      titleField="nama_mapel"
      fields={[
        {
          label: "Kode",
          field: "kode_mapel",
          format: (v) => (
            <span className="font-mono uppercase">{v ? String(v) : "—"}</span>
          ),
        },
        { label: "Nama Mata Pelajaran", field: "nama_mapel" },
        {
          label: "Kurikulum",
          field: "kurikulum",
          format: (v) => (v ? <Badge tone="brand">{String(v)}</Badge> : "—"),
        },
        {
          label: "Kelompok",
          field: "kelompok_mapel",
          format: (v) =>
            v ? (
              <Badge tone={KELOMPOK_TONE[String(v)] ?? "neutral"}>{String(v)}</Badge>
            ) : (
              "—"
            ),
        },
        {
          label: "Wajib",
          field: "is_wajib",
          format: (v) =>
            v ? (
              <Badge tone="success" dot>
                Wajib
              </Badge>
            ) : (
              <span className="text-muted-fg">Tidak</span>
            ),
        },
        { label: "Keterangan", field: "keterangan" },
      ]}
      extra={<MapelRelatedTabs mapelName={name} />}
    />
  );
}

export const Route = createFileRoute("/$sekolah/akademik/mapel/$name")({ component: MapelDetailPage });
