import { createFileRoute, Link, useNavigate, useParams} from "@tanstack/react-router";
import {
  Breadcrumb,
  PageHeader,
  IconArrowLeft,
  Button,
} from "@sekolahpro/ui";
import { SiswaForm, type SiswaFormValues } from "../components/SiswaForm";
import { PageGuide } from "../components/guide";
import { SISWA_PAGE_GUIDES } from "../components/siswa/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

function SiswaNewPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  const navigate = useNavigate();

  const handleSubmit = (values: SiswaFormValues) => {
    // TODO: integrate @sekolahpro/api-client.createSiswa(values)
    console.info("[siswa.new] submit", values);
    navigate({ to: "/sch/$sekolah/siswa", params: { sekolah } });
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", render: ({ className, children }) => <Link to="/sch/$sekolah" params={{ sekolah }} className={className}>{children}</Link> },
          { label: "Siswa", render: ({ className, children }) => <Link to="/sch/$sekolah/siswa" params={{ sekolah }} className={className}>{children}</Link> },
          { label: "Tambah" },
        ]}
      />
      <PageHeader
        eyebrow="Direktori"
        title="Tambah Siswa Baru"
        description="Lengkapi data identitas, administrasi, dapodik, alamat, dan kontak."
        actions={
          <Button variant="outline" onClick={() => navigate({ to: "/sch/$sekolah/siswa", params: { sekolah } })}>
            <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
            Batal
          </Button>
        }
      />
      <PageGuide
        storageNamespace="siswa-guide:"
        storageId="siswa-baru"
        title={SISWA_PAGE_GUIDES["siswa-baru"].title}
        intro={SISWA_PAGE_GUIDES["siswa-baru"].intro}
        steps={SISWA_PAGE_GUIDES["siswa-baru"].steps}
        tips={SISWA_PAGE_GUIDES["siswa-baru"].tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />
      <SiswaForm mode="create" onCancel={() => navigate({ to: "/sch/$sekolah/siswa", params: { sekolah } })} onSubmit={handleSubmit} />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/siswa/new")({ component: SiswaNewPage });
