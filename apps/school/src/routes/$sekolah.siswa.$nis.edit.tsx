import { createFileRoute, Link, notFound, useNavigate, useParams} from "@tanstack/react-router";
import {
  Breadcrumb,
  Button,
  EmptyState,
  PageHeader,
  IconArrowLeft,
} from "@sekolahpro/ui";
import { SiswaForm, type SiswaFormValues } from "../components/SiswaForm";
import { useResourceDoc } from "@sekolahpro/api-client";
import { findSiswa, type Siswa } from "../data/siswa";

function SiswaEditPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const { nis } = Route.useParams();
  // Primary lookup from backend; SiswaForm still consumes the camelCase mock shape.
  // TODO real backend join: map snake_case doc -> SiswaFormValues
  const docQ = useResourceDoc<Partial<Siswa> & { name: string }>("Siswa", nis);
  const siswa = findSiswa(nis);
  const navigate = useNavigate();
  void docQ;

  if (!siswa) throw notFound();

  const handleSubmit = (values: SiswaFormValues) => {
    // TODO: integrate @sekolahpro/api-client.updateSiswa(values)
    console.info("[siswa.edit] submit", values);
    navigate({ to: "/$sekolah/siswa/$nis", params: { sekolah, nis } });
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", render: ({ className, children }) => <Link to="/$sekolah" params={{ sekolah }} className={className}>{children}</Link> },
          { label: "Siswa", render: ({ className, children }) => <Link to="/$sekolah/siswa" params={{ sekolah }} className={className}>{children}</Link> },
          { label: siswa.namaLengkap, render: ({ className, children }) => <Link to="/$sekolah/siswa/$nis" params={{ sekolah, nis }} className={className}>{children}</Link> },
          { label: "Edit" },
        ]}
      />
      <PageHeader
        eyebrow="Detail Siswa"
        title={`Edit · ${siswa.namaLengkap}`}
        description={`NIS ${siswa.nis} · ${siswa.kelas}`}
        actions={
          <Button variant="outline" onClick={() => navigate({ to: "/$sekolah/siswa/$nis", params: { sekolah, nis } })}>
            <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
            Batal
          </Button>
        }
      />
      <SiswaForm
        mode="edit"
        initial={siswa}
        onCancel={() => navigate({ to: "/$sekolah/siswa/$nis", params: { sekolah, nis } })}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/siswa/$nis/edit")({
  component: SiswaEditPage,
  notFoundComponent: () => {
    const { sekolah } = useParams({ from: "/$sekolah" });
    return (
    <div className="py-16">
      <EmptyState title="Siswa tidak ditemukan" description="NIS tidak ada di sistem." />
    </div>
  ); },
});
