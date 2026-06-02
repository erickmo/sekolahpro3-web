import { useSite } from "../SiteContext";
import { useGaleriList } from "../lib/galeri";
import { Container, ImageOrFallback, SectionHeading, Spinner } from "./primitives";

/** Photo gallery grid. */
export function GaleriPreview({ limit = 6 }: { limit?: number }) {
  const site = useSite();
  const { data, isLoading } = useGaleriList(site.sekolah);
  const items = (data ?? []).slice(0, limit);

  return (
    <section className="situs-section situs-soft-bg">
      <Container>
        <SectionHeading eyebrow="Dokumentasi" title="Galeri Kegiatan" />
        {isLoading ? (
          <Spinner />
        ) : items.length ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((g) => (
              <figure key={g.name} className="situs-round-lg overflow-hidden">
                <ImageOrFallback src={g.gambar || null} alt={g.judul} label={g.judul} ratio="aspect-square" />
                <figcaption className="mt-1 truncate text-xs" style={{ color: "var(--situs-muted)" }}>{g.judul}</figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm" style={{ color: "var(--situs-muted)" }}>Belum ada foto.</p>
        )}
      </Container>
    </section>
  );
}
