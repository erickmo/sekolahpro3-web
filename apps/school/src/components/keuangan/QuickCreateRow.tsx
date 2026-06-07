/**
 * Footer quick-create row on the hub — the 4 highest-frequency "buat baru"
 * actions plus a ⌘K hint. Presentational: plain scoped Links (NOT the koperasi
 * QuickActionGrid, to avoid coupling). Keyboard reach is the global ⌘K palette,
 * so no F-key scheme here (browser-collision-free by design).
 */
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { IconPlus } from "@sekolahpro/ui";
import { scopedLinkProps } from "../../lib/scoped";

/** A single quick-create destination (bare route). */
export interface QuickCreate {
  label: string;
  to: string;
}

export interface QuickCreateRowProps {
  actions: readonly QuickCreate[];
  sekolah: string;
}

function bareRoute(to: string): string {
  return to.replace("/sch/$sekolah", "");
}

/** Render the quick-create button row. */
export function QuickCreateRow({ actions, sekolah }: QuickCreateRowProps): ReactNode {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((a) => (
        <Link
          key={a.to}
          {...scopedLinkProps(sekolah, bareRoute(a.to))}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors hover:border-brand hover:bg-brand/5"
        >
          <span className="inline-flex h-4 w-4 text-brand"><IconPlus /></span>
          {a.label}
        </Link>
      ))}
      <span className="ml-auto hidden items-center gap-1 text-xs text-muted-fg sm:inline-flex">
        Tekan
        <kbd className="rounded border border-border bg-bg px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
        untuk lompat ke mana saja
      </span>
    </div>
  );
}
