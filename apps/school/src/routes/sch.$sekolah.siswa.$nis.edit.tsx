import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate, useParams } from "@tanstack/react-router";
import {
  Breadcrumb,
  Button,
  EmptyState,
  PageHeader,
  IconArrowLeft,
} from "@sekolahpro/ui";
import { useQueryClient } from "@tanstack/react-query";
import {
  useResourceDoc,
  useResourceList,
  useResourceUpdate,
} from "@sekolahpro/api-client";
import { SiswaForm, type SiswaFormValues } from "../components/SiswaForm";
import { siswaDocToForm, siswaFormToDoc, type SiswaDoc } from "../lib/orang/siswaMapper";
import { isMissingResource } from "../lib/resourceError";

function SiswaEditPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const { nis } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const docQ = useResourceDoc<SiswaDoc>("Siswa", nis);
  const update = useResourceUpdate("Siswa");
  const jenjangQ = useResourceList<{ name: string }>("Unit Jenjang", { fields: ["name"], limit_page_length: 200 });
  const tahunQ = useResourceList<{ name: string }>("Tahun Ajaran", { fields: ["name"], order_by: "name desc", limit_page_length: 50 });
  const [error, setError] = useState<string | null>(null);

  const jenjangOptions = (jenjangQ.data ?? []).map((j) => ({ value: j.name, label: j.name }));
  const tahunOptions = (tahunQ.data ?? []).map((t) => ({ value: t.name, label: t.name }));

  if (docQ.isLoading) {
    return <div className="py-16 text-sm text-muted-fg">Memuat data siswa…</div>;
  }
  if (isMissingResource(docQ.error) || (!docQ.isLoading && !docQ.data)) {
    throw notFound();
  }
  if (docQ.isError) {
    return (
      <div className="py-16">
        <EmptyState title="Gagal memuat siswa" description={(docQ.error as Error)?.message ?? "Terjadi kesalahan."} />
      </div>
    );
  }

  const doc = docQ.data!;
  const initial = siswaDocToForm(doc);
  const nama = initial.namaLengkap ?? nis;

  const handleSubmit = async (values: SiswaFormValues) => {
    setError(null);
    try {
      await update.mutateAsync({ name: nis, patch: siswaFormToDoc(values) });
      // Update hook does not auto-invalidate; refresh this doc + the list.
      qc.invalidateQueries({ queryKey: ["resource:doc", "Siswa"] });
      qc.invalidateQueries({ queryKey: ["resource:list", "Siswa"] });
      navigate({ to: "/sch/$sekolah/siswa/$nis", params: { sekolah, nis } });
    } catch (err) {
      setError(`Gagal menyimpan perubahan: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", render: ({ className, children }) => <Link to="/sch/$sekolah" params={{ sekolah }} className={className}>{children}</Link> },
          { label: "Siswa", render: ({ className, children }) => <Link to="/sch/$sekolah/siswa" params={{ sekolah }} className={className}>{children}</Link> },
          { label: nama, render: ({ className, children }) => <Link to="/sch/$sekolah/siswa/$nis" params={{ sekolah, nis }} className={className}>{children}</Link> },
          { label: "Edit" },
        ]}
      />
      <PageHeader
        eyebrow="Detail Siswa"
        title={`Edit · ${nama}`}
        description={`NIS ${nis}`}
        actions={
          <Button variant="outline" onClick={() => navigate({ to: "/sch/$sekolah/siswa/$nis", params: { sekolah, nis } })}>
            <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
            Batal
          </Button>
        }
      />
      {error ? (
        <div role="alert" className="rounded-md border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}
      <SiswaForm
        mode="edit"
        initial={initial}
        jenjangOptions={jenjangOptions}
        tahunOptions={tahunOptions}
        submitting={update.isPending}
        onCancel={() => navigate({ to: "/sch/$sekolah/siswa/$nis", params: { sekolah, nis } })}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/siswa/$nis/edit")({
  component: SiswaEditPage,
  notFoundComponent: () => {
    return (
    <div className="py-16">
      <EmptyState title="Siswa tidak ditemukan" description="NIS tidak ada di sistem." />
    </div>
  ); },
});
