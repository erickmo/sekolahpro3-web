import { Link } from "react-router-dom";
import type { TemplateKey } from "../constants";
import { useSite } from "../SiteContext";
import { Container } from "./primitives";

/**
 * Hero section. The `variant` (= template key) switches the layout/personality
 * while the same site data + brand vars drive the content + color.
 */
export function Hero({ variant }: { variant: TemplateKey }) {
  const site = useSite();
  const p = site.profil;

  const cta = (
    <div className="mt-6 flex flex-wrap gap-3">
      <Link to={p.heroCtaUrl || "/ppdb"} className="situs-brand-bg situs-round px-6 py-3 text-sm font-semibold shadow-sm">
        {p.heroCtaLabel || "Informasi PPDB"}
      </Link>
      <Link
        to="/profil"
        className="situs-round border px-6 py-3 text-sm font-semibold"
        style={{ borderColor: "var(--situs-border)", color: "var(--situs-ink)" }}
      >
        Tentang Kami
      </Link>
    </div>
  );

  if (variant === "modern") {
    return (
      <section className="situs-section situs-soft-bg overflow-hidden">
        <Container className="grid items-center gap-10 lg:grid-cols-2">
          <div className="situs-rise">
            {p.tagline ? <p className="situs-brand-text text-sm font-semibold uppercase tracking-widest">{p.tagline}</p> : null}
            <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl" style={{ color: "var(--situs-ink)" }}>
              {p.heroJudul}
            </h1>
            <p className="mt-4 text-lg" style={{ color: "var(--situs-muted)" }}>{p.heroSubjudul}</p>
            {cta}
          </div>
          <div className="situs-round-lg relative aspect-square w-full overflow-hidden situs-brand-soft">
            {site.brand.heroImage ? (
              <img src={site.brand.heroImage} alt={site.nama} className="h-full w-full object-cover" />
            ) : (
              <div className="situs-brand-bg flex h-full w-full items-center justify-center">
                <span className="font-display text-6xl font-bold opacity-80">{site.nama.slice(0, 1)}</span>
              </div>
            )}
          </div>
        </Container>
      </section>
    );
  }

  if (variant === "ceria") {
    return (
      <section className="situs-section relative overflow-hidden" style={{ background: "rgba(var(--situs-brand-rgb),0.10)" }}>
        <Container className="text-center">
          <div className="situs-rise mx-auto max-w-2xl">
            {p.tagline ? (
              <span className="situs-brand-bg situs-pill inline-block px-4 py-1 text-xs font-bold uppercase tracking-wide">
                {p.tagline}
              </span>
            ) : null}
            <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl" style={{ color: "var(--situs-ink)" }}>
              {p.heroJudul}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg" style={{ color: "var(--situs-muted)" }}>{p.heroSubjudul}</p>
            <div className="flex justify-center">{cta}</div>
          </div>
        </Container>
      </section>
    );
  }

  // klasik (default): formal, centered, serif headings via skin.
  return (
    <section className="situs-section border-b" style={{ borderColor: "var(--situs-border)" }}>
      <Container className="max-w-3xl text-center situs-rise">
        {p.tagline ? <p className="situs-brand-text text-sm font-semibold uppercase tracking-[0.2em]">{p.tagline}</p> : null}
        <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl" style={{ color: "var(--situs-ink)" }}>
          {p.heroJudul}
        </h1>
        <p className="mx-auto mt-5 text-lg" style={{ color: "var(--situs-muted)" }}>{p.heroSubjudul}</p>
        <div className="flex justify-center">{cta}</div>
      </Container>
    </section>
  );
}
