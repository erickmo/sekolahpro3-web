import { Fragment } from "react";
import { useSite } from "../SiteContext";
import { getTemplate } from "./registry";
import { resolveBlockRenderer } from "./blocks/registry";

/**
 * Block-driven homepage. Renders site.layoutBlocks in order, skipping inactive
 * ones, resolving each to a renderer via the block registry. When a school has
 * no configured blocks we fall back to the chosen template's HomeBody, which is
 * the per-template default layout generator (Klasik/Modern/Ceria).
 *
 * The root wrapper carries `data-section-style` so the skins.css
 * `[data-section-style="flat"|"bordered"]` rules fire. It mirrors the
 * `--situs-section-style` CSS var that theme.ts emits from the same
 * site.theme.sectionStyle value, keeping attribute and var in agreement.
 *
 * @returns The composed homepage body wrapped in the section-style root.
 */
export function Composer() {
  const site = useSite();
  const blocks = site.layoutBlocks.filter((b) => b.aktif);

  return <div data-section-style={site.theme.sectionStyle}>{renderBody(site, blocks)}</div>;
}

/** Render the homepage body: the ordered active blocks, or the template default
 *  composition when no blocks are configured. Split out so the section-style
 *  wrapper stays a single root regardless of which branch renders. */
function renderBody(
  site: ReturnType<typeof useSite>,
  blocks: ReturnType<typeof useSite>["layoutBlocks"],
) {
  if (blocks.length === 0) {
    const tpl = getTemplate(site.templateKey);
    return <tpl.HomeBody />;
  }

  return blocks.map((block, i) => {
    const Renderer = resolveBlockRenderer(block.tipe, block.variant);
    return (
      <Fragment key={`${block.tipe}-${i}`}>
        <Renderer block={block} />
      </Fragment>
    );
  });
}
