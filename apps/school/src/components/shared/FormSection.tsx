// Shared heading + FormGrid wrapper for one logical group of modal fields.
// Single source for the visual section style used across create modals
// (previously copy-pasted in 4+ files).
import type { ReactNode } from "react";
import { FormGrid } from "@sekolahpro/ui";

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-muted/20 p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {description ? (
          <p className="text-xs text-muted-fg mt-0.5">{description}</p>
        ) : null}
      </div>
      <FormGrid>{children}</FormGrid>
    </section>
  );
}
