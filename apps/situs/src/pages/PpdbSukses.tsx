import { Link, useSearchParams } from "react-router-dom";
import { useSite } from "../SiteContext";
import { Container } from "../sections/primitives";

/** PPDB success confirmation. */
export function PpdbSukses() {
  const site = useSite();
  const [params] = useSearchParams();
  const nomor = params.get("no") ?? "";

  return (
    <section className="situs-section">
      <Container className="max-w-xl text-center">
        <div className="situs-brand-text mx-auto flex h-16 w-16 items-center justify-center situs-brand-soft situs-pill text-3xl">✓</div>
        <h1 className="mt-5 text-2xl font-bold" style={{ color: "var(--situs-ink)" }}>Pendaftaran Berhasil!</h1>
        <p className="mt-3" style={{ color: "var(--situs-muted)" }}>
          Terima kasih telah mendaftar di {site.nama}. Panitia akan menghubungi Anda melalui WhatsApp/telepon untuk
          langkah selanjutnya.
        </p>
        {nomor ? (
          <div className="situs-card situs-round-lg mt-6 p-5">
            <p className="text-sm" style={{ color: "var(--situs-muted)" }}>Nomor Pendaftaran</p>
            <p className="font-mono text-xl font-bold" style={{ color: "var(--situs-brand)" }}>{nomor}</p>
          </div>
        ) : null}
        <Link to="/" className="situs-brand-bg situs-round mt-6 inline-block px-6 py-3 text-sm font-semibold">
          Kembali ke Beranda
        </Link>
      </Container>
    </section>
  );
}
