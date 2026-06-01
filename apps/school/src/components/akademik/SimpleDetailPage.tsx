import { type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
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
import { useResourceDoc } from "@sekolahpro/api-client";

export interface DetailFieldSpec {
  label: string;
  field: string;
  format?: (v: unknown) => ReactNode;
}

interface SimpleDetailPageProps {
  doctype: string;
  name: string;
  eyebrow: string;
  parentLabel: string;
  parentTo: string;
  /** Title accessor — picks display name from doc */
  titleField?: string;
  /** Status field name (for badge) */
  statusField?: string;
  fields: DetailFieldSpec[];
  /** Extra sections rendered after the primary identity card. */
  extra?: ReactNode;
  actions?: ReactNode;
  sekolah?: string;
}

type DetailTone = "success" | "warning" | "neutral" | "danger" | "brand";

const STATUS_TONE: Record<string, DetailTone> = {
  Aktif: "success",
  Nonaktif: "neutral",
  Draft: "warning",
  Final: "success",
  Dikunci: "neutral",
  Disetujui: "brand",
  Diterbitkan: "success",
};

/** Badge tone for a status value; neutral when unknown or absent. */
export function resolveDetailStatusTone(statusVal: string | undefined): DetailTone {
  return statusVal ? (STATUS_TONE[statusVal] ?? "neutral") : "neutral";
}

/** Render a field value: custom formatter wins, else stringify with an em-dash for empty. */
export function formatDetailValue(raw: unknown, format?: (v: unknown) => ReactNode): ReactNode {
  if (format) return format(raw);
  return raw == null || raw === "" ? "—" : String(raw);
}

export function SimpleDetailPage(props: SimpleDetailPageProps) {
  const {
    doctype, name, eyebrow, parentLabel, parentTo,
    titleField = "name", statusField, fields, extra, actions, sekolah,
  } = props;
  const navigate = useNavigate();
  const q = useResourceDoc<Record<string, unknown>>(doctype, name);

  if (q.isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted-fg">Memuat data...</div>
    );
  }
  if (q.isError || !q.data) {
    return (
      <div className="py-16">
        <EmptyState
          title="Data tidak ditemukan"
          description={q.error instanceof Error ? q.error.message : `${doctype} ${name} tidak ada di sistem.`}
          action={
            <Link to={parentTo as "/sch/$sekolah"} params={{ sekolah: sekolah ?? "" }} className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
              <span className="h-4 w-4"><IconArrowLeft /></span> Kembali ke {parentLabel}
            </Link>
          }
        />
      </div>
    );
  }

  const doc = q.data;
  const title = (doc[titleField] as string | undefined) ?? name;
  const statusVal = statusField ? (doc[statusField] as string | undefined) : undefined;
  const tone = resolveDetailStatusTone(statusVal);

  return (
    <DetailPageTemplate
      header={
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: "Dashboard", render: ({ className, children }) => <Link to={(sekolah ? "/sch/$sekolah" : "/") as "/sch/$sekolah"} params={{ sekolah: sekolah ?? "" }} className={className}>{children}</Link> },
              { label: parentLabel, render: ({ className, children }) => <Link to={parentTo as "/sch/$sekolah"} params={{ sekolah: sekolah ?? "" }} className={className}>{children}</Link> },
              { label: title },
            ]}
          />
          <PageHeader
            eyebrow={eyebrow}
            title={title}
            description={`${doctype} · ${name}`}
            actions={
              <div className="flex gap-2">
                {actions}
                <Button variant="outline" onClick={() => navigate({ to: parentTo })}>
                  <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
                  Kembali
                </Button>
              </div>
            }
          />
        </div>
      }
      primary={
        <>
          <SectionCard
            title="Identitas"
            action={statusVal ? <Badge tone={tone} dot>{statusVal}</Badge> : null}
          >
            <InfoGrid cols={2}>
              {fields.map((f) => (
                <InfoField key={f.field} label={f.label} value={formatDetailValue(doc[f.field], f.format)} />
              ))}
            </InfoGrid>
          </SectionCard>
          {extra}
        </>
      }
    />
  );
}
