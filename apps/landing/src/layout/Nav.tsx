import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { cn } from "@sekolahpro/ui";
import { useSiteContent } from "../lib/site";

export function Nav() {
  const [open, setOpen] = useState(false);
  const site = useSiteContent();
  const links = site.nav_links;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-bg/85 border-b border-fg/15">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 h-20 flex items-end justify-between pb-3 pt-4">
        <Link to="/" className="group flex items-baseline gap-3 leading-none">
          <span className="relative inline-flex items-center justify-center w-9 h-9">
            <span className="absolute inset-0 rotate-3 bg-brand" aria-hidden />
            <span className="relative font-display italic text-bg text-xl leading-none">S</span>
          </span>
          <span className="font-display text-2xl font-medium tracking-tight">
            Sekolah<em className="not-italic text-brand">Pro</em>
          </span>
          <span className="hidden lg:inline rule-label ml-3 mb-1">est. nusantara</span>
        </Link>

        <nav className="hidden md:flex items-end gap-6">
          {links.map((l) => (
            <NavLink
              key={l.url}
              to={l.url}
              end={l.match_end}
              className={({ isActive }) =>
                cn(
                  "group relative font-display text-[15px] tracking-tight transition-colors pb-1",
                  isActive
                    ? "text-brand italic"
                    : "text-fg/80 hover:text-fg",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  <span
                    className={cn(
                      "absolute left-0 right-0 -bottom-0.5 h-px bg-brand origin-left transition-transform duration-300",
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link
            to={site.nav_cta_login_url}
            className="font-mono text-xs uppercase tracking-widest text-fg/70 hover:text-fg"
          >
            {site.nav_cta_login_label} →
          </Link>
          <Link
            to={site.nav_cta_primary_url}
            className="group relative inline-flex items-center gap-2 bg-fg text-bg px-5 py-2.5 font-medium text-sm hover:bg-brand transition-colors"
          >
            <span>{site.nav_cta_primary_label}</span>
            <span className="font-display italic">→</span>
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center w-10 h-10 text-fg hover:text-brand"
          aria-label="Buka menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            {open ? <><line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" /></>
                  : <><line x1="3" y1="7"  x2="21" y2="7"  /><line x1="3" y1="13" x2="21" y2="13" /><line x1="3" y1="19" x2="15" y2="19" /></>}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-fg/15 bg-bg">
          <div className="px-6 py-4 flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.url}
                to={l.url}
                end={l.match_end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "py-2 font-display text-xl border-b border-fg/10",
                    isActive ? "text-brand italic" : "text-fg/85",
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="flex gap-3 pt-4">
              <Link
                to={site.nav_cta_login_url}
                className="flex-1 text-center border border-fg/30 py-3 font-mono text-xs uppercase tracking-widest"
                onClick={() => setOpen(false)}
              >
                {site.nav_cta_login_label}
              </Link>
              <Link
                to={site.nav_cta_primary_url}
                className="flex-1 text-center bg-fg text-bg py-3 font-medium text-sm"
                onClick={() => setOpen(false)}
              >
                {site.nav_cta_primary_label} →
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
