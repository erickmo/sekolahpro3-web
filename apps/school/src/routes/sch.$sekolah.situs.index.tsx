import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge, Button, Card, PageHeader, StatCard } from "@sekolahpro/ui";
import { useSitus, usePublish } from "../data/situs";
import { situsPreviewUrl } from "../lib/situsPreview";
import { PageGuide } from "../components/guide";
import { SITUS_PAGE_GUIDES } from "../components/situs/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

/** Situs overview: publish toggle, preview link, and status/template/domain stats. */
export function SitusOverviewPage({ sekolah }: { sekolah: string }) {
  const { data, isLoading } = useSitus(sekolah);
  const publish = usePublish(sekolah);

  const terbit = data?.status === "Terbit";
  const previewUrl = situsPreviewUrl(data?.subdomain ?? null, sekolah);

  // Publishing flips public visibility, so confirm before toggling either way to
  // avoid an accidental publish/unpublish.
  const togglePublish = () => {
    const msg = terbit
      ? "Jadikan situs draft? Situs tidak lagi terlihat publik."
      : "Terbitkan situs? Situs akan dapat diakses publik.";
    if (window.confirm(msg)) publish.mutate({ status: terbit ? "Draft" : "Terbit" });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Situs Sekolah"
        eyebrow="Website Publik"
        description="Kelola tampilan, konten, dan domain situs publik sekolah Anda."
        actions={
          <div className="flex gap-2">
            <a href={previewUrl} target="_blank" rel="noreferrer">
              <Button variant="ghost">Lihat Situs ↗</Button>
            </a>
            <Button
              onClick={togglePublish}
              disabled={publish.isPending || isLoading}
            >
              {terbit ? "Jadikan Draft" : "Terbitkan"}
            </Button>
          </div>
        }
      />

      <PageGuide
        storageNamespace="situs-guide:"
        storageId="dashboard"
        title={SITUS_PAGE_GUIDES.dashboard.title}
        intro={SITUS_PAGE_GUIDES.dashboard.intro}
        steps={SITUS_PAGE_GUIDES.dashboard.steps}
        tips={SITUS_PAGE_GUIDES.dashboard.tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Status"
          value={terbit ? "Terbit" : "Draft"}
          hint={terbit ? "Situs dapat diakses publik" : "Belum dipublikasikan"}
        />
        <StatCard label="Template" value={data?.template ?? "Belum dipilih"} hint="Tema tampilan situs" />
        <StatCard
          label="Domain"
          value={data?.subdomain ? `${data.subdomain}` : data?.custom_domain ?? "Default"}
          hint={data?.domain_verified ? "Terverifikasi" : "Subdomain SekolahPro"}
        />
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-700">Langkah Cepat</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/sch/$sekolah/situs/tampilan" params={{ sekolah }}>
            <Button variant="ghost" size="sm">1 · Pilih Template & Brand</Button>
          </Link>
          <Link to="/sch/$sekolah/situs/berita" params={{ sekolah }}>
            <Button variant="ghost" size="sm">2 · Tulis Berita</Button>
          </Link>
          <Link to="/sch/$sekolah/situs/halaman" params={{ sekolah }}>
            <Button variant="ghost" size="sm">3 · Lengkapi Profil</Button>
          </Link>
          <Link to="/sch/$sekolah/situs/domain" params={{ sekolah }}>
            <Button variant="ghost" size="sm">4 · Atur Domain</Button>
          </Link>
        </div>
        <div className="mt-4">
          {terbit ? (
            <Badge tone="success" dot>Situs aktif & terlihat publik</Badge>
          ) : (
            <Badge tone="warning" dot>Situs masih draft — terbitkan saat siap</Badge>
          )}
        </div>
      </Card>
    </div>
  );
}

function SitusOverview() {
  const { sekolah } = Route.useParams();
  return <SitusOverviewPage sekolah={sekolah} />;
}

export const Route = createFileRoute("/sch/$sekolah/situs/")({ component: SitusOverview });
