import { useSite } from "../SiteContext";
import { formatRupiah, usePpdbInfo } from "../lib/ppdb";
import { formatTanggal } from "../lib/berita";
import { PpdbForm } from "../features/ppdb/PpdbForm";
import { Container, SectionHeading, Spinner } from "../sections/primitives";

/** PPDB landing: wave info + required documents + the registration form. */
export function PpdbPage() {
  const site = useSite();
  const { data, isLoading } = usePpdbInfo(site.sekolah);

  return (
    <section className="situs-section">
      <Container>
        <SectionHeading
          eyebrow="Penerimaan Peserta Didik Baru"
          title={`PPDB ${site.nama}`}
          lead={data?.catatan || "Lengkapi formulir di bawah untuk mendaftar."}
        />

        {isLoading ? (
          <Spinner />
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <aside className="space-y-4 lg:col-span-1">
              <div className="situs-card situs-round-lg p-5">
                <h3 className="font-semibold" style={{ color: "var(--situs-ink)" }}>Gelombang Aktif</h3>
                {data?.gelombang.length ? (
                  <ul className="mt-3 space-y-3 text-sm">
                    {data.gelombang.map((g) => (
                      <li key={g.name} className="situs-round situs-brand-soft p-3">
                        <p className="font-semibold" style={{ color: "var(--situs-ink)" }}>{g.nama}</p>
                        <p style={{ color: "var(--situs-muted)" }}>
                          {formatTanggal(g.tanggalBuka)} – {formatTanggal(g.tanggalTutup)}
                        </p>
                        <p style={{ color: "var(--situs-muted)" }}>Biaya {formatRupiah(g.biayaPendaftaran)} · Sisa {g.sisaKuota} kursi</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm" style={{ color: "var(--situs-muted)" }}>Belum ada gelombang aktif.</p>
                )}
              </div>

              <div className="situs-card situs-round-lg p-5">
                <h3 className="font-semibold" style={{ color: "var(--situs-ink)" }}>Dokumen yang Disiapkan</h3>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm" style={{ color: "var(--situs-muted)" }}>
                  {(data?.dokumen ?? []).map((d) => <li key={d}>{d}</li>)}
                </ul>
              </div>
            </aside>

            <div className="lg:col-span-2">
              <PpdbForm />
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
