import { type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
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
  IconCheck,
  IconEdit,
} from "@sekolahpro/ui";
import { useResourceDoc, useResourceDelete } from "@sekolahpro/api-client";

export interface DetailFieldDef<T> {
  label: string;
  render: (doc: T) => ReactNode;
}

export interface MasterDetailPageProps<T extends Record<string, unknown>> {
  doctype: string;
  name: string;
  eyebrow: string;
  parentLabel: string;
  parentPath: string;
  title: (doc: T) => string;
  subtitle?: (doc: T) => string;
  fields: Array<DetailFieldDef<T>>;
  extraSections?: (doc: T) => ReactNode;
  workflowActions?: (doc: T, refresh: () => void) => ReactNode;
}

export function MasterDetailPage<T extends Record<string, unknown>>(props: MasterDetailPageProps<T>) {
  const {
    doctype,
    name,
    eyebrow,
    parentLabel,
    parentPath,
    title,
    subtitle,
    fields,
    extraSections,
    workflowActions,
  } = props;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const q = useResourceDoc<T>(doctype, name);
  const del = useResourceDelete(doctype);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["resource:doc", doctype, name] });
    qc.invalidateQueries({ queryKey: ["resource:list", doctype] });
  };

  if (q.isLoading) {
    return <div className="py-16 text-center text-sm text-muted-fg">Memuat...</div>;
  }
  if (q.isError || !q.data) {
    return (
      <div className="py-16">
        <EmptyState
          title="Data tidak ditemukan"
          description={(q.error as Error | null)?.message ?? "Tidak ada data."}
          action={
            <Link to={parentPath} className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
              <span className="h-4 w-4"><IconArrowLeft /></span> Kembali ke daftar
            </Link>
          }
        />
      </div>
    );
  }

  const doc = q.data;
  const handleDelete = async () => {
    if (!window.confirm(`Hapus ${name}? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await del.mutateAsync(name);
      qc.invalidateQueries({ queryKey: ["resource:list", doctype] });
      navigate({ to: parentPath });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal menghapus.");
    }
  };

  return (
    <DetailPageTemplate
      header={
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: "Dashboard", render: ({ className, children }) => <Link to="/" className={className}>{children}</Link> },
              { label: parentLabel, render: ({ className, children }) => <Link to={parentPath} className={className}>{children}</Link> },
              { label: title(doc) },
            ]}
          />
          <PageHeader
            eyebrow={eyebrow}
            title={title(doc)}
            {...(subtitle ? { description: subtitle(doc) } : {})}
            actions={
              <Button variant="outline" onClick={() => navigate({ to: parentPath })}>
                <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
                Kembali
              </Button>
            }
          />
        </div>
      }
      primary={
        <>
          <SectionCard title="Detail" action={<Badge tone="neutral">{doctype}</Badge>}>
            <InfoGrid cols={2}>
              {fields.map((f, i) => (
                <InfoField key={i} label={f.label} value={f.render(doc)} />
              ))}
            </InfoGrid>
          </SectionCard>
          {extraSections?.(doc)}
        </>
      }
      side={
        <>
          {workflowActions ? (
            <SectionCard title="Workflow">
              <div className="flex flex-col gap-2">{workflowActions(doc, refresh)}</div>
            </SectionCard>
          ) : null}
          <SectionCard title="Aksi">
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={() => window.alert("Edit master (P3)")}>
                <span className="h-4 w-4 mr-1.5"><IconEdit /></span>Edit
              </Button>
              <Button variant="outline" size="sm" onClick={handleDelete} disabled={del.isPending}>
                {del.isPending ? "Menghapus..." : "Hapus"}
              </Button>
            </div>
          </SectionCard>
        </>
      }
    />
  );
}

// Convenience badge for "Aktif" status
export function StatusBadge({ status }: { status?: string }) {
  return (
    <Badge tone={status === "Aktif" ? "success" : "neutral"} dot>
      {status === "Aktif" ? (
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3"><IconCheck /></span>
          {status}
        </span>
      ) : (
        status ?? "—"
      )}
    </Badge>
  );
}
