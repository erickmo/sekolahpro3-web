import { Link } from "react-router-dom";
import { useSite } from "../SiteContext";
import { formatTanggal, useBeritaList } from "../lib/berita";
import type { Berita } from "../types";
import { Container, ImageOrFallback, SectionHeading, Spinner } from "./primitives";

export function BeritaCard({ b }: { b: Berita }) {
  return (
    <Link to={`/berita/${b.slug}`} className="situs-card situs-round-lg group block overflow-hidden">
      <ImageOrFallback src={b.gambarSampul} alt={b.judul} label={b.judul} />
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--situs-muted)" }}>
          <span className="situs-brand-soft situs-brand-text situs-pill px-2 py-0.5 font-semibold">{b.kategori}</span>
          <span>{formatTanggal(b.tanggalTerbit)}</span>
        </div>
        <h3 className="mt-2 line-clamp-2 text-base font-semibold transition group-hover:underline" style={{ color: "var(--situs-ink)" }}>
          {b.judul}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm" style={{ color: "var(--situs-muted)" }}>{b.ringkasan}</p>
      </div>
    </Link>
  );
}

/** Latest news grid (Home preview). */
export function BeritaPreview({ limit = 3 }: { limit?: number }) {
  const site = useSite();
  const { data, isLoading } = useBeritaList(site.sekolah);
  const items = (data ?? []).slice(0, limit);

  return (
    <section className="situs-section situs-soft-bg">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <SectionHeading eyebrow="Kabar Terbaru" title="Berita & Pengumuman" />
          <Link to="/berita" className="situs-brand-text shrink-0 text-sm font-semibold">Lihat semua →</Link>
        </div>
        {isLoading ? (
          <Spinner />
        ) : items.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((b) => <BeritaCard key={b.name} b={b} />)}
          </div>
        ) : (
          <p className="mt-6 text-sm" style={{ color: "var(--situs-muted)" }}>Belum ada berita.</p>
        )}
      </Container>
    </section>
  );
}
