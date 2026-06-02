// RichText block renderer: renders admin-authored HTML from a layout block's
// `konten` field inside a standard section shell. Sanitization is handled by the
// shared RichText section component (DOMPurify). This is the simplest block and
// the one the Composer ordering tests assert against.

import { useSite } from "../../SiteContext";
import { Container } from "../../sections/primitives";
import { RichText } from "../../sections/RichText";
import type { BlockProps } from "./registry";

/**
 * Render a richtext layout block.
 * @param block - The layout block; `konten` carries the HTML body, `judul` an
 *                optional section heading.
 * @returns A section wrapping the sanitized HTML, or null when there is no body.
 */
export function RichTextBlock({ block }: BlockProps) {
  // useSite is read so the block participates in the site context like every
  // other renderer (future variants may pull brand tokens / profile data).
  useSite();
  const html = block.konten ?? "";
  if (!html) return null;
  return (
    <section className="situs-section">
      <Container>
        {block.judul ? (
          <h2 className="mb-6 text-2xl font-bold" style={{ color: "var(--situs-ink)" }}>
            {block.judul}
          </h2>
        ) : null}
        <RichText html={html} />
      </Container>
    </section>
  );
}
