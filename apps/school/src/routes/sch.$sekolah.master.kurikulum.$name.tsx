import { createFileRoute } from "@tanstack/react-router";
import { SimpleDetailPage } from "../components/akademik/SimpleDetailPage";

function KurikulumDetailPage() {
  const { name, sekolah } = Route.useParams();
  return (
    <SimpleDetailPage
      sekolah={sekolah}
      doctype="Kurikulum"
      name={name}
      eyebrow="Detail Kurikulum"
      parentLabel="Kurikulum"
      parentTo="/sch/$sekolah/master/kurikulum"
      titleField="nama"
      fields={[
        { label: "Nama", field: "nama" },
        { label: "Tahun Berlaku", field: "tahun_berlaku" },
      ]}
    />
  );
}

export const Route = createFileRoute("/sch/$sekolah/master/kurikulum/$name")({ component: KurikulumDetailPage });
