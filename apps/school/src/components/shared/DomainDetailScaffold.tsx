import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { scopedLinkProps } from "../../lib/scoped";
import {
  Badge,
  Breadcrumb,
  Button,
  DetailPageTemplate,
  EmptyState,
  IconArrowLeft,
  InfoField,
  InfoGrid,
  PageHeader,
  SectionCard,
} from "@sekolahpro/ui";

// Generic detail scaffold parameterised by domain breadcrumb root (e.g. "Jadwal" -> /jadwal).

export interface DomainInfoItem {
  label: string;
  value: ReactNode;
}

export interface DomainDetailScaffoldProps {
  eyebrow: string;
  // Slug of the active sekolah; when set, scaffold scopes all links to
  // `/sch/$sekolah/...`. Pull from `useParams({ from: "/sch/$sekolah" })`.
  sekolah?: string | undefined;
  domain: { label: string; to: string };
  title: string;
  backTo: string;
  backLabel?: string;
  crumbParent: { label: string; to: string };
  crumbSelf: string;
  status?: { label: string; tone: "success" | "brand" | "warning" | "danger" | "neutral" } | undefined;
  description?: string | undefined;
  loading?: boolean;
  errorMessage?: string | undefined;
  primaryInfo: DomainInfoItem[];
  secondaryInfo?: DomainInfoItem[] | undefined;
  actions?: ReactNode;
  extraSections?: ReactNode;
}

export function DomainDetailScaffold(props: DomainDetailScaffoldProps) {
  const navigate = useNavigate();
  const {
    eyebrow,
    sekolah,
    domain,
    title,
    backTo,
    backLabel = "Kembali ke daftar",
    crumbParent,
    crumbSelf,
    status,
    description,
    loading,
    errorMessage,
    primaryInfo,
    secondaryInfo,
    actions,
    extraSections,
  } = props;

  if (errorMessage) {
    return (
      <div className="py-12">
        <EmptyState
          title="Gagal memuat data"
          description={errorMessage}
          action={
            <Link {...scopedLinkProps(sekolah, backTo)} className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
              <span className="h-4 w-4"><IconArrowLeft /></span>
              {backLabel}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <DetailPageTemplate
      header={
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: "Dashboard", render: ({ className, children }) => <Link {...scopedLinkProps(sekolah, "/")} className={className}>{children}</Link> },
              { label: domain.label, render: ({ className, children }) => <Link {...scopedLinkProps(sekolah, domain.to)} className={className}>{children}</Link> },
              { label: crumbParent.label, render: ({ className, children }) => <Link {...scopedLinkProps(sekolah, crumbParent.to)} className={className}>{children}</Link> },
              { label: crumbSelf },
            ]}
          />
          <PageHeader
            eyebrow={eyebrow}
            title={title}
            {...(description ? { description } : {})}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                {status ? <Badge tone={status.tone} dot>{status.label}</Badge> : null}
                {actions}
                <Button variant="outline" onClick={() => navigate(scopedLinkProps(sekolah, backTo) as never)}>
                  <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
                  {backLabel}
                </Button>
              </div>
            }
          />
        </div>
      }
      primary={
        <>
          <SectionCard title="Informasi Utama">
            {loading ? (
              <div className="py-6 text-sm text-muted-fg">Memuat...</div>
            ) : (
              <InfoGrid cols={3}>
                {primaryInfo.map((it) => (
                  <InfoField key={it.label} label={it.label} value={it.value} />
                ))}
              </InfoGrid>
            )}
          </SectionCard>
          {extraSections}
        </>
      }
      side={
        secondaryInfo && secondaryInfo.length ? (
          <SectionCard title="Detail Tambahan">
            <InfoGrid cols={1}>
              {secondaryInfo.map((it) => (
                <InfoField key={it.label} label={it.label} value={it.value} />
              ))}
            </InfoGrid>
          </SectionCard>
        ) : undefined
      }
    />
  );
}
