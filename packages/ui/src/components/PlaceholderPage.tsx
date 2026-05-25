import type { ReactNode } from "react";
import { PageHeader } from "./PageHeader";
import { SectionCard } from "./SectionCard";
import { EmptyState } from "./EmptyState";

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  cta?: ReactNode;
}

export function PlaceholderPage({ eyebrow, title, description, icon, cta }: Props) {
  return (
    <div className="space-y-6">
      <PageHeader
        {...(eyebrow !== undefined ? { eyebrow } : {})}
        title={title}
        {...(description !== undefined ? { description } : {})}
      />
      <SectionCard>
        <EmptyState
          title={`Modul ${title} sedang disiapkan`}
          description="Halaman ini akan segera tersedia. Pantau pembaruan berikutnya."
          action={
            cta ?? (
              <div className="flex items-center justify-center text-muted-fg">
                {icon ? <span className="h-12 w-12">{icon}</span> : null}
              </div>
            )
          }
        />
      </SectionCard>
    </div>
  );
}
