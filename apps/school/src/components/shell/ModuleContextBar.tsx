/**
 * ModuleContextBar — the shared role/framing context row for module headers.
 *
 * Generalizes the per-module bars (perpustakaan, aset) into one dumb, router-free
 * component: an uppercase "Konteks {label}" eyebrow, an optional one-line framing
 * sentence, and an optional right-aligned group holding a role badge and/or a CTA.
 * Period modules (akademik, ekstrakurikuler) keep their own data-bound bar and
 * pass it to ModuleShell via the `context` slot instead of using this one.
 *
 * Layout mirrors the existing context-row contract so it sits flush inside the
 * ModuleHeader panel exactly like the ekstrakurikuler bar.
 */
import type { ReactNode } from "react";
import { Badge } from "@sekolahpro/ui";

export interface ModuleContextBarProps {
  /** Module name shown after "Konteks " (e.g. "Absensi" → "Konteks Absensi"). */
  label: string;
  /** Optional one-line audience/purpose framing. */
  framing?: string;
  /** Optional role badge text (right-aligned). */
  roleLabel?: string;
  /** Optional action slot (right-aligned), e.g. a router <Link>. */
  cta?: ReactNode;
}

/** Role/framing context row; renders only the parts it is given. */
export function ModuleContextBar({ label, framing, roleLabel, cta }: ModuleContextBarProps) {
  const hasRight = roleLabel != null || cta != null;
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-fg shrink-0">
        Konteks {label}
      </span>
      {framing ? <p className="min-w-0 text-xs text-muted-fg">{framing}</p> : null}
      {hasRight ? (
        <div className="ml-auto flex items-center gap-2">
          {roleLabel ? <Badge tone="brand">{roleLabel}</Badge> : null}
          {cta}
        </div>
      ) : null}
    </div>
  );
}
