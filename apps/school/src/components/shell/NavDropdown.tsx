import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  label: string;
  active: boolean;
  /** Current pathname — the dropdown closes whenever it changes (navigation). */
  pathname: string;
  /** Menu items: `<li role="none"><Link role="menuitem" …/></li>`. */
  children: ReactNode;
}

const TRIGGER =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40";
const TRIGGER_ACTIVE = "bg-brand text-white shadow-sm";
const TRIGGER_IDLE = "text-muted-fg hover:bg-muted hover:text-fg";

/**
 * Minimal accessible dropdown for the unified Akademik menu (the design system
 * ships no Menu/Popover). Closes on outside-click, Escape, and navigation.
 */
export function NavDropdown({ label, active, pathname, children }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close when the route changes (a child Link was clicked).
  useEffect(() => setOpen(false), [pathname]);

  // Close on outside click + Escape while open.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`${TRIGGER} ${active ? TRIGGER_ACTIVE : TRIGGER_IDLE}`}
      >
        {label}
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
          <path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul
          role="menu"
          className="absolute left-0 z-30 mt-1 min-w-44 rounded-lg border border-border bg-bg p-1 shadow-lg"
        >
          {children}
        </ul>
      )}
    </div>
  );
}
