import { Link } from "react-router-dom";
import { useSite } from "../SiteContext";
import { formatRupiah, usePpdbInfo } from "../lib/ppdb";
import { Container, Spinner } from "./primitives";

/** PPDB call-to-action band with the active wave summary. */
export function PpdbPreview() {
  const site = useSite();
  const { data, isLoading } = usePpdbInfo(site.sekolah);

  return (
    <section className="situs-section situs-brand-bg">
      <Container>
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest opacity-80">Penerimaan Peserta Didik Baru</p>
            <h2 className="mt-2 text-3xl font-bold">Bergabung dengan {site.nama}</h2>
            <p className="mt-3 max-w-md opacity-90">
              {data?.dibuka
                ? "Pendaftaran sedang dibuka. Daftarkan putra-putri Anda secara daring sekarang."
                : "Informasi pendaftaran peserta didik baru tahun ajaran mendatang."}
            </p>
            <Link to="/ppdb" className="situs-round mt-6 inline-block bg-white px-6 py-3 text-sm font-bold" style={{ color: "var(--situs-brand)" }}>
              {data?.dibuka ? "Daftar Sekarang" : "Lihat Informasi PPDB"}
            </Link>
          </div>

          <div className="situs-round-lg bg-white/10 p-5 backdrop-blur">
            {isLoading ? (
              <Spinner label="Memuat info PPDB…" />
            ) : data?.gelombang.length ? (
              <ul className="space-y-3">
                {data.gelombang.map((g) => (
                  <li key={g.name} className="situs-round flex items-center justify-between bg-white/10 px-4 py-3">
                    <div>
                      <p className="font-semibold">{g.nama}</p>
                      <p className="text-xs opacity-80">Biaya {formatRupiah(g.biayaPendaftaran)} · Sisa {g.sisaKuota} kursi</p>
                    </div>
                    <span className="situs-pill bg-white/20 px-3 py-1 text-xs font-semibold">Tingkat {g.tingkat}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm opacity-90">Belum ada gelombang aktif. Pantau terus halaman ini.</p>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
