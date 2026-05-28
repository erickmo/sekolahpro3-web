import { createFileRoute } from "@tanstack/react-router";
import { SimpleDetailPage } from "../components/akademik/SimpleDetailPage";

function KurikulumDetailPage() {
  const { name } = Route.useParams();
  return (
    <SimpleDetailPage
      doctype="Kurikulum"
      name={name}
      eyebrow="Detail Kurikulum"
      parentLabel="Kurikulum"
      parentTo="/$sekolah/akademik/kurikulum"
      titleField="nama"
      fields={[
        { label: "Nama", field: "nama" },
        { label: "Tahun Berlaku", field: "tahun_berlaku" },
      ]}
    />
  );
}

export const Route = createFileRoute("/$sekolah/akademik/kurikulum/$name")({ component: KurikulumDetailPage });
