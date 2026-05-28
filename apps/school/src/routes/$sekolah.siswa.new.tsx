import { createFileRoute, Link, useNavigate, useParams} from "@tanstack/react-router";
import {
  Breadcrumb,
  PageHeader,
  IconArrowLeft,
  Button,
} from "@sekolahpro/ui";
import { SiswaForm, type SiswaFormValues } from "../components/SiswaForm";

function SiswaNewPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const navigate = useNavigate();

  const handleSubmit = (values: SiswaFormValues) => {
    // TODO: integrate @sekolahpro/api-client.createSiswa(values)
    console.info("[siswa.new] submit", values);
    navigate({ to: "/$sekolah/siswa", params: { sekolah } });
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", render: ({ className, children }) => <Link to="/$sekolah" params={{ sekolah }} className={className}>{children}</Link> },
          { label: "Siswa", render: ({ className, children }) => <Link to="/$sekolah/siswa" params={{ sekolah }} className={className}>{children}</Link> },
          { label: "Tambah" },
        ]}
      />
      <PageHeader
        eyebrow="Direktori"
        title="Tambah Siswa Baru"
        description="Lengkapi data identitas, administrasi, dapodik, alamat, dan kontak."
        actions={
          <Button variant="outline" onClick={() => navigate({ to: "/$sekolah/siswa", params: { sekolah } })}>
            <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
            Batal
          </Button>
        }
      />
      <SiswaForm mode="create" onCancel={() => navigate({ to: "/$sekolah/siswa", params: { sekolah } })} onSubmit={handleSubmit} />
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/siswa/new")({ component: SiswaNewPage });
