import { Link } from "react-router-dom";
import { useSiteContent, whatsappHref } from "../lib/site";

export function Footer() {
  const site = useSiteContent();
  const year = new Date().getFullYear();
  const copyright = site.footer_copyright.replace("{year}", String(year));

  return (
    <footer className="relative mt-24 border-t border-fg/20 bg-fg text-bg overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent" />
      <div
        className="absolute -right-24 -top-24 w-[28rem] h-[28rem] rounded-full opacity-20 pointer-events-none"
        style={{
          background:
            "conic-gradient(from 120deg, hsl(var(--color-brand)) 0deg, transparent 120deg, hsl(var(--color-brand)) 240deg, transparent 360deg)",
          filter: "blur(60px)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1400px] px-6 lg:px-10 pt-20 pb-10">
        <div className="grid gap-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-baseline gap-3">
              <span className="relative inline-flex items-center justify-center w-10 h-10">
                <span className="absolute inset-0 rotate-3 bg-brand" aria-hidden />
                <span className="relative font-display italic text-bg text-2xl leading-none">S</span>
              </span>
              <span className="font-display text-3xl font-medium">
                Sekolah<em className="not-italic text-brand">Pro</em>
              </span>
            </div>
            <p className="mt-6 font-display text-2xl leading-snug text-bg/85 max-w-lg">
              {site.footer_blurb}
            </p>
            <a
              href={whatsappHref(site.whatsapp_number)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-3 group"
            >
              <span className="w-10 h-10 grid place-items-center rounded-full bg-brand text-bg group-hover:rotate-12 transition-transform">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.17 1.6 5.99L0 24l6.18-1.62A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.18-3.48-8.52ZM12 22a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.67.96.98-3.57-.23-.37A9.9 9.9 0 1 1 22 12c0 5.51-4.49 10-10 10Z" />
                </svg>
              </span>
              <span className="font-mono text-xs uppercase tracking-widest border-b border-bg/40 group-hover:border-brand pb-0.5">
                Chat WhatsApp Sekarang
              </span>
            </a>
          </div>

          {site.footer_columns.map((col, idx) => (
            <div key={col.title} className="md:col-span-2">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[10px] text-brand">{String(idx + 1).padStart(2, "0")}</span>
                <h4 className="font-display italic text-lg">{col.title}</h4>
              </div>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      to={l.href}
                      className="group inline-flex items-center gap-2 text-sm text-bg/75 hover:text-brand transition-colors"
                    >
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      <span>{l.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20 pt-6 border-t border-bg/15 flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
          <div className="font-mono text-[11px] uppercase tracking-widest text-bg/55">
            {copyright}
          </div>
          <div className="font-display italic text-bg/65 text-sm">
            {site.footer_legal_note}
          </div>
        </div>
      </div>
    </footer>
  );
}
