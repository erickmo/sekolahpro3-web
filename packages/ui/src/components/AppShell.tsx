import type { ReactNode } from "react";
import { cn } from "../lib/cn";

interface Props {
  sidebar: ReactNode;
  topbar: ReactNode;
  brand?: ReactNode;
  children: ReactNode;
  className?: string;
  /**
   * Classes for the <main> content region. Defaults to the standard page inset
   * (`p-6 lg:p-8`). Pass "" to drop the padding when the page provides its own
   * spacing via child margins instead (lets a full-bleed sticky header sit flush
   * while sibling content stays inset). Other apps omit it and keep the default.
   */
  mainClassName?: string;
}

export function AppShell({
  sidebar,
  topbar,
  brand,
  children,
  className,
  mainClassName = "p-6 lg:p-8",
}: Props) {
  return (
    <div
      className={cn(
        // `minmax(0,1fr)` (not a bare `1fr`, which means `minmax(auto,1fr)`):
        // the `auto` minimum of a bare fr track is the content's min-content size,
        // so an unshrinkable child (e.g. a module's wide sub-nav/charts) expands
        // the column past the viewport → page-wide horizontal scroll. Capping the
        // minimum at 0 makes the column authoritative; wide content scrolls/wraps
        // locally instead of pushing the viewport.
        "min-h-screen grid grid-cols-[260px_minmax(0,1fr)] grid-rows-[64px_1fr]",
        "bg-[hsl(220_20%_97%)] text-fg font-sans",
        className,
      )}
    >
      <aside className="row-span-2 border-r border-border bg-bg flex flex-col">
        {brand ? (
          <div className="h-16 px-5 flex items-center border-b border-border">{brand}</div>
        ) : null}
        <div className="flex-1 overflow-y-auto py-4">{sidebar}</div>
      </aside>
      <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur flex items-center px-6">
        {topbar}
      </header>
      {/* `min-w-0`: as a grid item, <main> defaults to min-width:auto, which would
          let its content re-expand the column even with a minmax(0,1fr) track.
          Pinning it to 0 keeps the content box bounded so children fit/scroll. */}
      <main className={cn("min-w-0", mainClassName)}>{children}</main>
    </div>
  );
}
