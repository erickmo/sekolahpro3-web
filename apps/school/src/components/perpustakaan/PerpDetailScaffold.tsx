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

// Generic detail scaffold reused by perpustakaan sub-domain detail pages (P2).
// Keeps each detail route small and focused on domain-specific InfoFields + actions.

export interface PerpInfoItem {
  label: string;
  value: ReactNode;
}

export interface PerpDetailScaffoldProps {
  eyebrow: string;
  sekolah?: string | undefined;
  title: string;
  backTo: string;
  backLabel?: string;
  crumbParent: { label: string; to: string };
  crumbSelf: string;
  status?: { label: string; tone: "success" | "brand" | "warning" | "danger" | "neutral" } | undefined;
  description?: string | undefined;
  loading?: boolean;
  errorMessage?: string | undefined;
  primaryInfo: PerpInfoItem[];
  secondaryInfo?: PerpInfoItem[] | undefined;
  actions?: ReactNode;
  extraSections?: ReactNode;
}

export function PerpDetailScaffold(props: PerpDetailScaffoldProps) {
  const navigate = useNavigate();
  const {
    eyebrow,
    sekolah,
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
              <IconArrowLeft className="h-4 w-4 shrink-0" />
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
              { label: "Perpustakaan", render: ({ className, children }) => <Link {...scopedLinkProps(sekolah, "/perpustakaan")} className={className}>{children}</Link> },
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
                  <IconArrowLeft className="mr-1.5 h-4 w-4 shrink-0" />
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
