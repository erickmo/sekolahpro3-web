import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { TemplateKey } from "../constants";
import { useSite } from "../SiteContext";
import { Container, initials } from "./primitives";

const LOGIN_URL = (import.meta.env.VITE_SCHOOL_LOGIN_URL as string | undefined) ?? "/app";

/** Top navigation shared by all templates; `variant` only tweaks shape. */
export function Nav({ variant = "klasik" }: { variant?: TemplateKey }) {
  const site = useSite();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const pill = variant === "ceria" ? "situs-pill" : "situs-round";

  return (
    <header className="sticky top-0 z-40 border-b backdrop-blur" style={{ background: "rgba(255,255,255,0.85)", borderColor: "var(--situs-border)" }}>
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          {site.brand.logo ? (
            <img src={site.brand.logo} alt={site.nama} className="h-9 w-9 rounded object-contain" />
          ) : (
            <span className={`situs-brand-bg flex h-9 w-9 items-center justify-center text-sm font-bold ${pill}`}>
              {initials(site.nama)}
            </span>
          )}
          <span className="font-display text-base font-bold leading-tight" style={{ color: "var(--situs-ink)" }}>
            {site.nama}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {site.nav.map((n) => {
            const active = location.pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3 py-2 text-sm font-medium transition ${pill}`}
                style={{ color: active ? "var(--situs-brand)" : "var(--situs-muted)" }}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={LOGIN_URL}
            className={`hidden px-3 py-2 text-sm font-semibold sm:inline-block ${pill}`}
            style={{ color: "var(--situs-brand)" }}
          >
            Masuk
          </a>
          <Link to="/ppdb" className={`situs-brand-bg px-4 py-2 text-sm font-semibold ${pill}`}>
            PPDB
          </Link>
          <button
            type="button"
            className={`p-2 lg:hidden ${pill}`}
            aria-label="Buka menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            style={{ color: "var(--situs-ink)" }}
          >
            ☰
          </button>
        </div>
      </Container>

      {open ? (
        <nav className="border-t lg:hidden" style={{ borderColor: "var(--situs-border)" }}>
          <Container className="flex flex-col py-2">
            {site.nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="px-2 py-2 text-sm font-medium"
                style={{ color: "var(--situs-ink)" }}
              >
                {n.label}
              </Link>
            ))}
          </Container>
        </nav>
      ) : null}
    </header>
  );
}
