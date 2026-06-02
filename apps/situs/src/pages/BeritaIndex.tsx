import { useState } from "react";
import { KATEGORI_BERITA } from "../constants";
import { useSite } from "../SiteContext";
import { useBeritaList } from "../lib/berita";
import { BeritaCard } from "../sections/BeritaPreview";
import { Container, SectionHeading, Spinner } from "../sections/primitives";

const FILTERS = ["Semua", ...KATEGORI_BERITA] as const;

/** Full news listing with category filter. */
export function BeritaIndex() {
  const site = useSite();
  const [active, setActive] = useState<(typeof FILTERS)[number]>("Semua");
  const { data, isLoading } = useBeritaList(site.sekolah);
  const items = (data ?? []).filter((b) => active === "Semua" || b.kategori === active);

  return (
    <section className="situs-section">
      <Container>
        <SectionHeading eyebrow="Informasi" title="Berita & Pengumuman" lead="Kabar terbaru dari sekolah kami." />
        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActive(f)}
              aria-pressed={active === f}
              className="situs-pill px-3 py-1.5 text-sm font-medium"
              style={
                active === f
                  ? { background: "var(--situs-brand)", color: "var(--situs-brand-fg)" }
                  : { background: "var(--situs-soft)", color: "var(--situs-muted)" }
              }
            >
              {f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <Spinner />
        ) : items.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((b) => <BeritaCard key={b.name} b={b} />)}
          </div>
        ) : (
          <p className="mt-6 text-sm" style={{ color: "var(--situs-muted)" }}>Tidak ada berita pada kategori ini.</p>
        )}
      </Container>
    </section>
  );
}
