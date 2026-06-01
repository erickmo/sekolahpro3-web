import { useParams } from "react-router-dom";
import { useSite } from "../SiteContext";
import { useHalaman } from "../lib/halaman";
import { ProfilSection } from "../sections/ProfilSection";
import { RichText } from "../sections/RichText";
import { Container, SectionHeading, Spinner } from "../sections/primitives";

/** Profil page: visi/misi/sambutan, plus an optional CMS page by slug. */
export function ProfilPage() {
  const site = useSite();
  const { slug } = useParams();
  const { data, isLoading } = useHalaman(site.sekolah, slug ?? "");

  if (slug) {
    return (
      <section className="situs-section">
        <Container className="max-w-3xl">
          {isLoading ? (
            <Spinner />
          ) : data ? (
            <>
              <SectionHeading eyebrow="Profil" title={data.judul} />
              <RichText html={data.konten} className="situs-prose mt-5" />
            </>
          ) : (
            <p className="text-sm" style={{ color: "var(--situs-muted)" }}>Halaman tidak ditemukan.</p>
          )}
        </Container>
      </section>
    );
  }

  return <ProfilSection full />;
}
