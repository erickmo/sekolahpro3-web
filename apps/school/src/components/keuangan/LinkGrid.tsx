/**
 * Shared quick-link grid for Keuangan hub stage screens.
 *
 * Extracted (verbatim behaviour) from the akuntansi overview so every pipeline
 * stage can render its sibling subpages as a labelled grid. Each tile is a
 * scoped TanStack Link built from a bare route via scopedLinkProps.
 */
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { IconWallet } from "@sekolahpro/ui";
import { scopedLinkProps } from "../../lib/scoped";

/** A single tile destination: a bare route (no /sch/$sekolah prefix) + copy. */
export interface QuickLink {
  to: string;
  label: string;
  hint: string;
  /** Optional custom icon; defaults to a wallet glyph. */
  icon?: ReactNode;
}

export interface LinkGridProps {
  items: readonly QuickLink[];
  sekolah: string;
}

/** Render a responsive 2-column grid of quick-link tiles. */
export function LinkGrid({ items, sekolah }: LinkGridProps): ReactNode {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map((it) => (
        <Link
          key={it.to}
          {...scopedLinkProps(sekolah, it.to.replace("/sch/$sekolah", ""))}
          className="group flex items-start gap-3 rounded-md border border-border p-3 hover:bg-muted/60 transition-colors"
        >
          <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand/10 text-brand">
            {it.icon ?? <IconWallet />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-fg group-hover:text-brand truncate">{it.label}</div>
            <div className="text-xs text-muted-fg truncate">{it.hint}</div>
          </div>
          <span className="text-muted-fg text-xs">→</span>
        </Link>
      ))}
    </div>
  );
}
