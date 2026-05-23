import { Link } from "react-router-dom";

const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Produk",
    links: [
      { label: "Fitur", href: "/fitur" },
      { label: "Berita", href: "/berita" },
      { label: "Partner", href: "/partner" },
    ],
  },
  {
    title: "Perusahaan",
    links: [
      { label: "Kontak", href: "/kontak" },
      { label: "Masuk Dasbor", href: "/login" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Kebijakan Privasi", href: "/privasi" },
      { label: "Syarat Layanan", href: "/syarat" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid gap-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-semibold text-fg text-lg">
            <span className="inline-block w-7 h-7 rounded-md bg-brand" aria-hidden />
            SekolahPro
          </div>
          <p className="text-sm text-muted-fg mt-3 max-w-xs">
            Sistem informasi sekolah yang dibangun di Indonesia, untuk ritme sekolah Indonesia.
          </p>
          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-sm text-brand hover:underline"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.17 1.6 5.99L0 24l6.18-1.62A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.18-3.48-8.52ZM12 22a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.67.96.98-3.57-.23-.37A9.9 9.9 0 1 1 22 12c0 5.51-4.49 10-10 10Z" />
            </svg>
            Chat WhatsApp
          </a>
        </div>

        {COLS.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-semibold text-fg">{col.title}</h4>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="text-sm text-muted-fg hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-fg">
          <span>© {new Date().getFullYear()} SekolahPro. Dibangun di Indonesia 🇮🇩.</span>
          <span>v.2026.05 · Edisi Kurikulum Merdeka</span>
        </div>
      </div>
    </footer>
  );
}
