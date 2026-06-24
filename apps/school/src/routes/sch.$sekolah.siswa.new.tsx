import { useState } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  Breadcrumb,
  PageHeader,
  IconArrowLeft,
  Button,
} from "@sekolahpro/ui";
import { useResourceCreate, useResourceList } from "@sekolahpro/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { SiswaForm, type SiswaFormValues } from "../components/SiswaForm";
import { siswaFormToDoc } from "../lib/orang/siswaMapper";
import { PageGuide } from "../components/guide";
import { SISWA_PAGE_GUIDES } from "../components/siswa/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

/** Map a duplicate-NIS / validation failure to a human message; falls back to
 *  the raw error text for anything else. */
function createErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/duplicate|already exists|exists/i.test(msg)) return "NIS sudah terdaftar. Gunakan NIS lain.";
  return `Gagal menyimpan siswa: ${msg}`;
}

function SiswaNewPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Siswa");
  const [error, setError] = useState<string | null>(null);

  // Real Link options so jenjang / tahun_masuk resolve to actual doc names
  // (both are reqd Links on the Siswa doctype — free text would hard-fail).
  const jenjangQ = useResourceList<{ name: string }>("Unit Jenjang", { fields: ["name"], limit_page_length: 200 });
  const tahunQ = useResourceList<{ name: string }>("Tahun Ajaran", { fields: ["name"], order_by: "name desc", limit_page_length: 50 });
  const jenjangOptions = (jenjangQ.data ?? []).map((j) => ({ value: j.name, label: j.name }));
  const tahunOptions = (tahunQ.data ?? []).map((t) => ({ value: t.name, label: t.name }));

  const handleSubmit = async (values: SiswaFormValues) => {
    setError(null);
    try {
      await create.mutateAsync(siswaFormToDoc(values));
      // Create hook does not auto-invalidate; refresh the directory list.
      qc.invalidateQueries({ queryKey: ["resource:list", "Siswa"] });
      navigate({ to: "/sch/$sekolah/siswa/$nis", params: { sekolah, nis: values.nis } });
    } catch (err) {
      setError(createErrorMessage(err));
    }
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
      {error ? (
        <div role="alert" className="rounded-md border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}
      <SiswaForm
        mode="create"
        jenjangOptions={jenjangOptions}
        tahunOptions={tahunOptions}
        submitting={create.isPending}
        onCancel={() => navigate({ to: "/sch/$sekolah/siswa", params: { sekolah } })}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/siswa/new")({ component: SiswaNewPage });
