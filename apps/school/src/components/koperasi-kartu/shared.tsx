import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Badge,
  Breadcrumb,
  Button,
  DetailPageTemplate,
  EmptyState,
  PageHeader,
  IconArrowLeft,
} from "@sekolahpro/ui";

export function formatRupiah(v: number | undefined | null): string {
  if (v === undefined || v === null) return "—";
  return `Rp ${Number(v).toLocaleString("id-ID")}`;
}

export function formatTanggal(v: string | undefined | null): string {
  if (!v) return "—";
  return v.length > 10 ? v.slice(0, 16).replace("T", " ") : v;
}

export interface DetailShellProps {
  eyebrow: string;
  title: string;
  description?: string;
  backTo: string;
  backLabel: string;
  crumbParentLabel: string;
  crumbParentTo: string;
  hero?: ReactNode;
  children: ReactNode;
}

export function DetailShell(props: DetailShellProps) {
  const navigate = useNavigate();
  const { eyebrow, title, description, backTo, backLabel, crumbParentLabel, crumbParentTo, hero, children } = props;
  return (
    <DetailPageTemplate
      header={
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: "Dashboard", render: ({ className, children }) => <Link to="/" className={className}>{children}</Link> },
              { label: "Koperasi", render: ({ className, children }) => <Link to="/koperasi" className={className}>{children}</Link> },
              { label: crumbParentLabel, render: ({ className, children }) => <Link to={crumbParentTo} className={className}>{children}</Link> },
              { label: title },
            ]}
          />
          <PageHeader
            eyebrow={eyebrow}
            title={title}
            {...(description ? { description } : {})}
            actions={
              <Button variant="outline" onClick={() => navigate({ to: backTo })}>
                <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
                {backLabel}
              </Button>
            }
          />
        </div>
      }
      {...(hero ? { hero } : {})}
      primary={children}
    />
  );
}

export function LoadingState({ label = "Memuat..." }: { label?: string }) {
  return <div className="py-16 text-center text-sm text-muted-fg">{label}</div>;
}

export function ErrorState({ error }: { error: unknown }) {
  return (
    <div className="py-16">
      <EmptyState
        title="Gagal memuat"
        description={(error as Error)?.message ?? "Terjadi kesalahan tak terduga."}
      />
    </div>
  );
}

export function StatusBadge({ value, toneMap }: { value: string; toneMap?: Record<string, "success" | "brand" | "neutral" | "warning" | "danger"> }) {
  const tone = toneMap?.[value] ?? "neutral";
  return <Badge tone={tone} dot>{value}</Badge>;
}
