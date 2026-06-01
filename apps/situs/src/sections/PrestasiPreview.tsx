import { useSite } from "../SiteContext";
import { usePrestasiList } from "../lib/prestasi";
import { Container, SectionHeading, Spinner } from "./primitives";

/** Achievements / awards showcase. */
export function PrestasiPreview({ limit = 3 }: { limit?: number }) {
  const site = useSite();
  const { data, isLoading } = usePrestasiList(site.sekolah);
  const items = (data ?? []).slice(0, limit);

  return (
    <section className="situs-section">
      <Container>
        <SectionHeading eyebrow="Kebanggaan Kami" title="Prestasi Terkini" />
        {isLoading ? (
          <Spinner />
        ) : items.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {items.map((p) => (
              <article key={p.name} className="situs-card situs-round-lg p-5">
                <div className="situs-brand-2-bg situs-pill mb-3 inline-flex h-10 w-10 items-center justify-center text-lg">🏆</div>
                <p className="situs-brand-text text-xs font-semibold uppercase tracking-wide">{p.tingkat} · {p.tahun}</p>
                <h3 className="mt-1 font-semibold" style={{ color: "var(--situs-ink)" }}>{p.judul}</h3>
                {p.peraih ? <p className="mt-1 text-sm" style={{ color: "var(--situs-muted)" }}>{p.peraih}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm" style={{ color: "var(--situs-muted)" }}>Belum ada data prestasi.</p>
        )}
      </Container>
    </section>
  );
}
