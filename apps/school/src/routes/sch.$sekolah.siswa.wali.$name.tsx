import { useEffect } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useResourceDoc } from "@sekolahpro/api-client";
import { Badge, PageHeader, SectionCard } from "@sekolahpro/ui";

interface WaliChildDoc {
  name: string;
  parent?: string;
  parenttype?: string;
  parentfield?: string;
  nama: string;
  hubungan?: string;
  no_hp?: string;
}

function WaliDetailPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  const { name } = useParams({ from: "/sch/$sekolah/siswa/wali/$name" });
  const navigate = useNavigate();
  const q = useResourceDoc<WaliChildDoc>("Wali Siswa", name);
  const doc = q.data;

  useEffect(() => {
    if (doc?.parent && doc.parenttype === "Siswa") {
      void navigate({ to: "/sch/$sekolah/siswa/$nis", params: { sekolah, nis: doc.parent } });
    }
  }, [doc?.parent, doc?.parenttype, navigate]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Wali Siswa"
        title={doc?.nama ?? name}
        description="Wali kini dikelola sebagai child table dari Siswa."
        actions={<Badge tone="warning" dot>Deprecated route</Badge>}
      />

      <SectionCard title="Halaman ini sudah dipindahkan">
        <p className="text-sm text-fg/90">
          Data Wali tidak lagi punya halaman detail standalone — perubahan, primary, dan hapus
          dilakukan di tab <strong>Wali</strong> pada detail siswa pemilik.
        </p>
        {doc?.parent ? (
          <div className="mt-4">
            <Link
              to="/sch/$sekolah/siswa/$nis"
              params={{ sekolah, nis: doc.parent }}
              className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand/90"
            >
              → Buka {doc.parent}
            </Link>
          </div>
        ) : q.isLoading ? (
          <div className="mt-4 text-sm text-muted-fg">Memuat data parent…</div>
        ) : (
          <div className="mt-4">
            <Link to="/sch/$sekolah/siswa/wali" params={{ sekolah }} className="text-brand hover:underline">
              ← Kembali ke direktori wali
            </Link>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/siswa/wali/$name")({ component: WaliDetailPage });
