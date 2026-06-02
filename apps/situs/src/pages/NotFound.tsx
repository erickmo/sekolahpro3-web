import { Link } from "react-router-dom";
import { Container } from "../sections/primitives";

/** 404 within a resolved site. */
export function NotFound() {
  return (
    <section className="situs-section">
      <Container className="max-w-lg text-center">
        <p className="situs-brand-text font-display text-6xl font-bold">404</p>
        <h1 className="mt-3 text-2xl font-bold" style={{ color: "var(--situs-ink)" }}>Halaman tidak ditemukan</h1>
        <p className="mt-2" style={{ color: "var(--situs-muted)" }}>Maaf, halaman yang Anda cari tidak tersedia.</p>
        <Link to="/" className="situs-brand-bg situs-round mt-6 inline-block px-6 py-3 text-sm font-semibold">
          Kembali ke Beranda
        </Link>
      </Container>
    </section>
  );
}
