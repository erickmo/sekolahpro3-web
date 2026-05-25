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
      parentTo="/akademik/kurikulum"
      titleField="nama_kurikulum"
      statusField="status"
      fields={[
        { label: "Nama", field: "nama_kurikulum" },
        { label: "Tahun Berlaku", field: "tahun_berlaku" },
        { label: "Jenjang", field: "jenjang" },
        { label: "Status", field: "status" },
      ]}
    />
  );
}

export const Route = createFileRoute("/akademik/kurikulum/$name")({ component: KurikulumDetailPage });
