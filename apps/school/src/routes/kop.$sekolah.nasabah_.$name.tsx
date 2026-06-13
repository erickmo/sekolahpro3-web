import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  Badge,
  Breadcrumb,
  Button,
  DetailPageTemplate,
  EmptyState,
  InfoField,
  InfoGrid,
  PageHeader,
  SectionCard,
  IconArrowLeft,
} from "@sekolahpro/ui";
import { humanizeFrappeError, useResourceDoc, useResourceUpdate } from "@sekolahpro/api-client";
import { KycPanel, KYC_TIER_TONE } from "../components/koperasi-nasabah/KycPanel";
import { NasabahRelatedLists } from "../components/koperasi-nasabah/NasabahRelatedLists";
import type { NasabahDoc } from "../components/koperasi-nasabah/types";

const DOCTYPE = "Nasabah";

export function NasabahDetailPage() {
  const { sekolah } = useParams({ from: "/kop/$sekolah" });
  const { name } = Route.useParams();
  const navigate = useNavigate();
  const docQ = useResourceDoc<NasabahDoc>(DOCTYPE, name);
  const update = useResourceUpdate(DOCTYPE);

  const doc = docQ.data;

  if (docQ.isLoading) {
    return <div className="py-16 text-center text-sm text-muted-fg">Memuat nasabah...</div>;
  }
  if (docQ.isError || !doc) {
    return (
      <div className="py-16">
        <EmptyState
          title="Nasabah tidak ditemukan"
          description={(docQ.error as Error | undefined)?.message ?? "Periksa nomor nasabah atau kembali ke daftar."}
          action={
            <Link to="/kop/$sekolah/nasabah" params={{ sekolah }} className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
              <span className="h-4 w-4"><IconArrowLeft /></span> Kembali ke daftar
            </Link>
          }
        />
      </div>
    );
  }

  const isAktif = doc.status === "Aktif";
  const toggleStatus = () => {
    update.mutate(
      { name, patch: { status: isAktif ? "Tidak Aktif" : "Aktif" } },
      { onSuccess: () => void docQ.refetch() },
    );
  };

  return (
    <DetailPageTemplate
      header={
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: "Dashboard", render: ({ className, children }) => <Link to="/kop/$sekolah" params={{ sekolah }} className={className}>{children}</Link> },
              { label: "Nasabah", render: ({ className, children }) => <Link to="/kop/$sekolah/nasabah" params={{ sekolah }} className={className}>{children}</Link> },
              { label: doc.name },
            ]}
          />
          <PageHeader
            eyebrow="Detail Nasabah"
            title={doc.nomor_nasabah ?? doc.name}
            description={`${doc.pihak ?? "—"} (${doc.pihak_tipe ?? "—"})`}
            actions={
              <Button variant="outline" onClick={() => navigate({ to: "/kop/$sekolah/nasabah", params: { sekolah } })}>
                <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
                Kembali
              </Button>
            }
          />
        </div>
      }
      hero={
        <div className="rounded-2xl border border-border bg-gradient-to-br from-brand/5 via-bg to-emerald-500/5 p-6 shadow-sm">
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-fg truncate">{doc.pihak ?? doc.name}</h2>
                <Badge tone={isAktif ? "success" : "neutral"} dot>{doc.status ?? "—"}</Badge>
                {doc.kyc_tier ? <Badge tone={KYC_TIER_TONE[doc.kyc_tier] ?? "neutral"}>KYC {doc.kyc_tier}</Badge> : null}
                {doc.is_anggota ? <Badge tone="brand" dot>Anggota Koperasi</Badge> : null}
                {doc.kyc_review_overdue ? <Badge tone="danger" dot>Review Overdue</Badge> : null}
              </div>
              <div className="mt-1 text-sm text-muted-fg">
                <span className="font-mono">{doc.name}</span>
                <span className="mx-2">·</span>
                <span>Registrasi {doc.tanggal_registrasi ?? "—"}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={update.isPending} onClick={toggleStatus}>
                {isAktif ? "Nonaktifkan" : "Aktifkan"}
              </Button>
            </div>
          </div>
          {update.isError ? (
            <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {humanizeFrappeError(update.error) ?? (update.error as Error).message}
            </div>
          ) : null}
        </div>
      }
      primary={
        <>
          <KycPanel doc={doc} onSaved={() => void docQ.refetch()} />
          <NasabahRelatedLists nasabah={doc.name} />
        </>
      }
      side={
        <SectionCard title="Informasi Nasabah">
          <InfoGrid cols={1}>
            <InfoField label="No. Nasabah" value={<span className="font-mono">{doc.nomor_nasabah ?? doc.name}</span>} />
            <InfoField label="Tipe Pihak" value={doc.pihak_tipe ?? "—"} />
            <InfoField label="Pihak" value={doc.pihak ?? "—"} />
            <InfoField label="Tanggal Registrasi" value={doc.tanggal_registrasi ?? "—"} />
            <InfoField label="Status" value={<Badge tone={isAktif ? "success" : "neutral"} dot>{doc.status ?? "—"}</Badge>} />
            <InfoField label="Keanggotaan" value={doc.is_anggota ? "Anggota koperasi" : "Bukan anggota"} />
            <InfoField label="Sekolah" value={doc.sekolah ?? "—"} />
          </InfoGrid>
        </SectionCard>
      }
    />
  );
}

export const Route = createFileRoute("/kop/$sekolah/nasabah_/$name")({
  component: NasabahDetailPage,
});
