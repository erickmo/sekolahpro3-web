import { useSite } from "../SiteContext";
import { Container, SectionHeading } from "./primitives";
import { RichText } from "./RichText";

/** Visi/misi + kepala sekolah welcome. `full` shows the long-form misi/sambutan. */
export function ProfilSection({ full = false }: { full?: boolean }) {
  const site = useSite();
  const p = site.profil;

  return (
    <section className="situs-section">
      <Container className="grid gap-10 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow="Profil" title="Visi & Misi" />
          {p.visi ? (
            <div className="situs-card situs-round-lg mt-5 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--situs-muted)" }}>Visi</h3>
              <p className="mt-2 text-lg" style={{ color: "var(--situs-ink)" }}>{p.visi}</p>
            </div>
          ) : null}
          {p.misi ? (
            <div className="mt-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--situs-muted)" }}>Misi</h3>
              <RichText html={p.misi} className="situs-prose mt-2" />
            </div>
          ) : null}
        </div>

        <div>
          <SectionHeading eyebrow="Sambutan" title="Kepala Sekolah" />
          <div className="situs-card situs-round-lg mt-5 p-6">
            <RichText html={p.sambutanKepsek || "<p>—</p>"} />
            {p.namaKepsek ? (
              <p className="mt-4 font-semibold" style={{ color: "var(--situs-brand)" }}>{p.namaKepsek}</p>
            ) : null}
            <p className="text-sm" style={{ color: "var(--situs-muted)" }}>Kepala Sekolah</p>
          </div>
          {full && site.contact.alamat ? (
            <p className="mt-4 text-sm" style={{ color: "var(--situs-muted)" }}>{site.contact.alamat}</p>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
