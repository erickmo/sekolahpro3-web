import { Link, useParams } from "react-router-dom";
import { useSite } from "../SiteContext";
import { formatTanggal, useBeritaDetail } from "../lib/berita";
import { RichText } from "../sections/RichText";
import { Container, ImageOrFallback, Spinner } from "../sections/primitives";

/** Single news article. */
export function BeritaDetail() {
  const site = useSite();
  const { slug } = useParams();
  const { data, isLoading } = useBeritaDetail(site.sekolah, slug ?? "");

  return (
    <article className="situs-section">
      <Container className="max-w-3xl">
        <Link to="/berita" className="situs-brand-text text-sm font-semibold">← Kembali ke Berita</Link>
        {isLoading ? (
          <Spinner />
        ) : data ? (
          <>
            <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: "var(--situs-muted)" }}>
              <span className="situs-brand-soft situs-brand-text situs-pill px-2 py-0.5 font-semibold">{data.kategori}</span>
              <span>{formatTanggal(data.tanggalTerbit)}</span>
              {data.penulis ? <span>· {data.penulis}</span> : null}
            </div>
            <h1 className="mt-3 text-3xl font-bold leading-tight" style={{ color: "var(--situs-ink)" }}>{data.judul}</h1>
            {data.gambarSampul ? (
              <div className="situs-round-lg mt-5 overflow-hidden">
                <ImageOrFallback src={data.gambarSampul} alt={data.judul} label={data.judul} ratio="aspect-[16/9]" />
              </div>
            ) : null}
            <RichText html={data.konten ?? `<p>${data.ringkasan}</p>`} className="situs-prose mt-6" />
          </>
        ) : (
          <p className="mt-6 text-sm" style={{ color: "var(--situs-muted)" }}>Berita tidak ditemukan.</p>
        )}
      </Container>
    </article>
  );
}
