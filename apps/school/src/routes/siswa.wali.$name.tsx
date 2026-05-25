import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@sekolahpro/ui";
import { useResourceDoc } from "@sekolahpro/api-client";
import { ExtraDetailScaffold } from "../components/extra-shared/ExtraDetailScaffold";

interface WaliDoc {
  name: string;
  nama_wali?: string;
  hubungan?: string;
  siswa?: string;
  nomor_telepon?: string;
  status?: string;
  email?: string;
  alamat?: string;
}

function WaliDetailPage() {
  const { name } = Route.useParams();
  const q = useResourceDoc<WaliDoc>("Wali Siswa", name);
  const doc = q.data;
  const tone = doc?.status === "Aktif" ? "success" : "neutral";

  return (
    <ExtraDetailScaffold
      eyebrow="Wali Siswa"
      title={doc?.nama_wali ?? name}
      crumbs={[{ label: "Siswa", to: "/siswa" }, { label: "Wali", to: "/siswa/wali" }]}
      crumbSelf={name}
      backTo="/siswa/wali"
      loading={q.isLoading}
      errorMessage={q.isError ? (q.error as Error).message : undefined}
      status={doc?.status ? { label: doc.status, tone } : undefined}
      description={doc?.hubungan ? `Hubungan: ${doc.hubungan}` : undefined}
      primaryInfo={[
        { label: "Nama Wali", value: doc?.nama_wali ?? "—" },
        { label: "Hubungan", value: <Badge tone="neutral">{doc?.hubungan ?? "—"}</Badge> },
        { label: "Siswa", value: doc?.siswa ?? "—" },
        { label: "No. Telepon", value: doc?.nomor_telepon ?? "—" },
        { label: "Email", value: doc?.email ?? "—" },
        { label: "Status", value: <Badge tone={tone} dot>{doc?.status ?? "—"}</Badge> },
      ]}
      secondaryInfo={[{ label: "Alamat", value: doc?.alamat ?? "—" }]}
    />
  );
}

export const Route = createFileRoute("/siswa/wali/$name")({ component: WaliDetailPage });
