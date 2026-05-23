import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Button, cn } from "@sekolahpro/ui";

const LINKS = [
  { to: "/", label: "Beranda" },
  { to: "/fitur", label: "Fitur" },
  { to: "/berita", label: "Berita" },
  { to: "/partner", label: "Partner" },
  { to: "/kontak", label: "Kontak" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-fg text-lg">
          <span className="inline-block w-7 h-7 rounded-md bg-brand" aria-hidden />
          SekolahPro
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "text-brand font-medium"
                    : "text-fg/80 hover:text-fg hover:bg-muted",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm">Masuk</Button>
          </Link>
          <Link to="/kontak?utm=nav">
            <Button size="sm">Coba Gratis</Button>
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md text-fg hover:bg-muted"
          aria-label="Buka menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <><line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" /></>
                  : <><line x1="4" y1="7"  x2="20" y2="7"  /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-border bg-bg">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex flex-col gap-1">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2 rounded-md text-base",
                    isActive ? "text-brand font-medium bg-muted" : "text-fg/80 hover:bg-muted",
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="flex-1" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full">Masuk</Button>
              </Link>
              <Link to="/kontak?utm=nav" className="flex-1" onClick={() => setOpen(false)}>
                <Button className="w-full">Coba Gratis</Button>
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
