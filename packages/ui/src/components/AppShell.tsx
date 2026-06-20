import { useEffect, useState, type ReactNode } from "react";
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

/** Hamburger glyph for the < lg drawer toggle (ui ships no Menu icon). */
function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

/** Close glyph for the open drawer header. */
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function AppShell({
  sidebar,
  topbar,
  brand,
  children,
  className,
  mainClassName = "p-6 lg:p-8",
}: Props) {
  // The sidebar is a fixed 260px rail at lg+, but an off-canvas drawer below lg
  // (otherwise the rail eats too much of a narrow viewport and the topbar
  // overflows). `navOpen` only ever matters below lg — at lg+ the rail is static
  // and always visible regardless of this state.
  const [navOpen, setNavOpen] = useState(false);

  // Dismiss the open drawer with Escape (mobile/tablet affordance).
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  return (
    <div
      className={cn(
        // Single column below lg (the sidebar floats as a drawer, out of flow);
        // the 260px rail + content column only apply at lg+.
        // `minmax(0,1fr)` (not a bare `1fr`, which means `minmax(auto,1fr)`):
        // the `auto` minimum of a bare fr track is the content's min-content size,
        // so an unshrinkable child (e.g. a module's wide sub-nav/charts) expands
        // the column past the viewport → page-wide horizontal scroll. Capping the
        // minimum at 0 makes the column authoritative; wide content scrolls/wraps
        // locally instead of pushing the viewport.
        "min-h-screen grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] grid-rows-[64px_1fr]",
        "bg-[hsl(220_20%_97%)] text-fg font-sans",
        className,
      )}
    >
      {/* Drawer backdrop — only present (and only below lg) while open. */}
      {navOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-hidden="true"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      {/* Off-canvas drawer < lg / static rail lg+. A click anywhere inside closes
          the drawer (so tapping a nav link dismisses it); harmless no-op at lg+. */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] border-r border-border bg-bg flex flex-col",
          "transition-transform duration-200 ease-out",
          navOpen ? "translate-x-0" : "-translate-x-full",
          "lg:static lg:z-auto lg:row-span-2 lg:w-auto lg:translate-x-0 lg:transition-none",
        )}
        onClick={() => setNavOpen(false)}
      >
        {/* Close affordance floats top-right so the brand bar below stays exactly
            as it renders at lg+ (and absent-brand apps gain no empty bar). */}
        <button
          type="button"
          onClick={() => setNavOpen(false)}
          aria-label="Tutup menu navigasi"
          className="lg:hidden absolute right-3 top-3 z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-fg hover:bg-muted hover:text-fg"
        >
          <CloseIcon />
        </button>
        {brand ? (
          <div className="h-16 px-5 flex items-center border-b border-border">{brand}</div>
        ) : null}
        <div className="flex-1 overflow-y-auto py-4">{sidebar}</div>
      </aside>

      <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur flex items-center gap-3 px-6">
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label="Buka menu navigasi"
          aria-expanded={navOpen}
          className="lg:hidden -ml-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-fg hover:bg-muted hover:text-fg"
        >
          <MenuIcon />
        </button>
        {topbar}
      </header>
      {/* `min-w-0`: as a grid item, <main> defaults to min-width:auto, which would
          let its content re-expand the column even with a minmax(0,1fr) track.
          Pinning it to 0 keeps the content box bounded so children fit/scroll. */}
      <main className={cn("min-w-0", mainClassName)}>{children}</main>
    </div>
  );
}
