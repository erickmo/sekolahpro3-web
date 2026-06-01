/**
 * Shared form section wrapper for Manajemen Aset modals: a titled, bordered
 * group around a FormGrid. Extracted so every modal renders identical section
 * chrome instead of redefining it locally.
 */
import type { ReactNode } from "react";
import { FormGrid } from "@sekolahpro/ui";

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string | undefined;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-muted/20 p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {description ? <p className="text-xs text-muted-fg mt-0.5">{description}</p> : null}
      </div>
      <FormGrid>{children}</FormGrid>
    </section>
  );
}

/** Inline error banner used at the foot of every modal body. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">
      {message}
    </div>
  );
}
