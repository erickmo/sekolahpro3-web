import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
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

// Generic detail scaffold reused by Phase 2 sub-routes (siswa/kelas/staff extras).
// Domain-agnostic: takes breadcrumb chain, primary/secondary info fields, and
// arbitrary action buttons (workflow buttons live in the actions slot).

export interface ExtraInfoItem {
  label: string;
  value: ReactNode;
}

export interface ExtraCrumb {
  label: string;
  to: string;
}

export interface ExtraDetailScaffoldProps {
  eyebrow: string;
  title: string;
  backTo: string;
  backLabel?: string;
  crumbs: ExtraCrumb[];
  crumbSelf: string;
  status?: { label: string; tone: "success" | "brand" | "warning" | "danger" | "neutral" } | undefined;
  description?: string | undefined;
  loading?: boolean;
  errorMessage?: string | undefined;
  primaryInfo: ExtraInfoItem[];
  secondaryInfo?: ExtraInfoItem[] | undefined;
  actions?: ReactNode;
  extraSections?: ReactNode;
}

export function ExtraDetailScaffold(props: ExtraDetailScaffoldProps) {
  const navigate = useNavigate();
  const {
    eyebrow,
    title,
    backTo,
    backLabel = "Kembali",
    crumbs,
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
            <Link to={backTo} className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
              <span className="h-4 w-4"><IconArrowLeft /></span>
              {backLabel}
            </Link>
          }
        />
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Dashboard", render: ({ className, children }: { className: string; children: ReactNode }) => <Link to="/" className={className}>{children}</Link> },
    ...crumbs.map((c) => ({
      label: c.label,
      render: ({ className, children }: { className: string; children: ReactNode }) => <Link to={c.to} className={className}>{children}</Link>,
    })),
    { label: crumbSelf },
  ];

  return (
    <DetailPageTemplate
      header={
        <div className="space-y-3">
          <Breadcrumb items={breadcrumbItems} />
          <PageHeader
            eyebrow={eyebrow}
            title={title}
            {...(description ? { description } : {})}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                {status ? <Badge tone={status.tone} dot>{status.label}</Badge> : null}
                {actions}
                <Button variant="outline" onClick={() => navigate({ to: backTo })}>
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
