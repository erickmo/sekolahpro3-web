import { Link } from "react-router-dom";
import { useSite } from "../SiteContext";
import { Container, initials } from "./primitives";

/** Site footer shared by all templates. */
export function Footer() {
  const site = useSite();
  const year = new Date().getFullYear();
  const socials = Object.entries({
    instagram: site.social.instagram,
    facebook: site.social.facebook,
    youtube: site.social.youtube,
    tiktok: site.social.tiktok,
  }).filter(([, v]) => v) as [string, string][];

  return (
    <footer className="mt-8 border-t" style={{ background: "var(--situs-ink)", color: "#e2e8f0", borderColor: "var(--situs-border)" }}>
      <Container className="grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            {site.brand.logo ? (
              <img src={site.brand.logo} alt={site.nama} className="h-10 w-10 rounded object-contain" />
            ) : (
              <span className="situs-brand-bg flex h-10 w-10 items-center justify-center rounded text-sm font-bold">
                {initials(site.nama)}
              </span>
            )}
            <span className="font-display text-lg font-bold text-white">{site.nama}</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-slate-300">{site.profil.tagline}</p>
          {site.contact.alamat ? <p className="mt-3 text-sm text-slate-400">{site.contact.alamat}</p> : null}
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">Tautan</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {site.nav.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="text-slate-300 hover:text-white">{n.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">Kontak</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {site.contact.telepon ? <li>{site.contact.telepon}</li> : null}
            {site.contact.email ? <li>{site.contact.email}</li> : null}
          </ul>
          {socials.length ? (
            <ul className="mt-4 flex flex-wrap gap-3 text-sm">
              {socials.map(([k, href]) => (
                <li key={k}>
                  <a href={href} target="_blank" rel="noreferrer" className="capitalize text-slate-300 hover:text-white">
                    {k}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-400">
        © {year} {site.nama}. Ditenagai oleh SekolahPro.
      </div>
    </footer>
  );
}
