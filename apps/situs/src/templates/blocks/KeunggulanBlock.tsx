// KeunggulanBlock — "why choose us" feature grid. Reads keunggulan rows from the
// site context (no fetch of its own) and lays them out as branded cards with a
// subtle hover lift. Color comes from --situs-brand* vars; radius/shadow from
// the skin tokens (.situs-card / .situs-round-lg).

import { useSite } from "../../SiteContext";
import { Container, SectionHeading } from "../../sections/primitives";
import type { BlockProps } from "./registry";

/** Number of leading characters of an icon token used as a glyph fallback. */
const ICON_GLYPH_LEN = 2;
/** Default heading when the block supplies none. */
const DEFAULT_TITLE = "Mengapa Memilih Kami";

/**
 * Render the keunggulan feature grid.
 * @param block - Layout block; judul overrides the heading, subjudul the eyebrow.
 * @returns A section of feature cards; a muted "belum diisi" hint when empty.
 */
export function KeunggulanBlock({ block }: BlockProps) {
  const { keunggulan } = useSite();
  return (
    <section className="situs-section">
      <Container>
        <SectionHeading eyebrow={block.subjudul ?? "Keunggulan"} title={block.judul || DEFAULT_TITLE} align="center" />
        {!keunggulan.length ? (
          <p className="mt-6 text-center text-sm" style={{ color: "var(--situs-muted)" }}>
            Keunggulan sekolah belum diisi.
          </p>
        ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {keunggulan.map((k, i) => (
            <div key={`${k.judul}-${i}`} className="situs-card situs-round-lg p-7 transition duration-200 hover:-translate-y-1">
              <div className="situs-brand-soft situs-brand-text situs-round-lg mb-5 flex h-12 w-12 items-center justify-center text-xl font-bold">
                {k.ikon ? <span aria-hidden>{k.ikon.slice(0, ICON_GLYPH_LEN)}</span> : <span aria-hidden>★</span>}
              </div>
              <h3 className="text-lg font-bold" style={{ color: "var(--situs-ink)" }}>{k.judul}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--situs-muted)" }}>{k.deskripsi}</p>
            </div>
          ))}
        </div>
        )}
      </Container>
    </section>
  );
}
