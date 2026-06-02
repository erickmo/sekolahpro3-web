import { useSite } from "../SiteContext";
import { formatRentang, useAgendaList } from "../lib/agenda";
import { Container, SectionHeading, Spinner } from "./primitives";

/** Upcoming agenda list. */
export function AgendaPreview({ limit = 4 }: { limit?: number }) {
  const site = useSite();
  const { data, isLoading } = useAgendaList(site.sekolah);
  const items = (data ?? []).slice(0, limit);

  return (
    <section className="situs-section">
      <Container>
        <SectionHeading eyebrow="Kalender" title="Agenda Sekolah" />
        {isLoading ? (
          <Spinner />
        ) : items.length ? (
          <ul className="mt-6 space-y-3">
            {items.map((a) => (
              <li key={a.name} className="situs-card situs-round-lg flex items-center gap-4 p-4">
                <div className="situs-brand-soft situs-round flex h-14 w-14 shrink-0 flex-col items-center justify-center text-center">
                  <span className="situs-brand-text text-lg font-bold leading-none">{new Date(a.tanggalMulai).getDate() || "—"}</span>
                  <span className="text-[10px] uppercase" style={{ color: "var(--situs-muted)" }}>
                    {a.tanggalMulai ? new Date(a.tanggalMulai).toLocaleDateString("id-ID", { month: "short" }) : ""}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold" style={{ color: "var(--situs-ink)" }}>{a.judul}</h3>
                  <p className="text-sm" style={{ color: "var(--situs-muted)" }}>
                    {formatRentang(a.tanggalMulai, a.tanggalSelesai)}
                    {a.lokasi ? ` · ${a.lokasi}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm" style={{ color: "var(--situs-muted)" }}>Belum ada agenda.</p>
        )}
      </Container>
    </section>
  );
}
