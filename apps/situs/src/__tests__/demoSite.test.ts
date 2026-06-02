// Guards the offline demo dataset: the homepage Composer renders from
// demoSite.layoutBlocks, so the demo must ship a non-empty, ordered, valid block
// set plus the keunggulan/statistik/testimoni content + theme those blocks read.
// Keeps the :5184 offline preview showing the modern block-driven templates.

import { describe, expect, it } from "vitest";
import { BLOCK_TYPES, SECTION_STYLES } from "../constants";
import { demoSite } from "../data/demo-site";

describe("demoSite block layout", () => {
  it("ships an ordered layout starting with a hero block", () => {
    expect(demoSite.layoutBlocks.length).toBeGreaterThan(3);
    expect(demoSite.layoutBlocks[0]?.tipe).toBe("hero");
  });
  it("only uses known block types", () => {
    const allowed = new Set<string>(BLOCK_TYPES);
    for (const b of demoSite.layoutBlocks) expect(allowed.has(b.tipe)).toBe(true);
  });
  it("ships keunggulan, statistik, testimoni content + a theme", () => {
    expect(demoSite.keunggulan.length).toBeGreaterThan(0);
    expect(demoSite.statistik.length).toBeGreaterThan(0);
    expect(demoSite.testimoni.length).toBeGreaterThan(0);
    expect(SECTION_STYLES).toContain(demoSite.theme.sectionStyle);
  });
});
