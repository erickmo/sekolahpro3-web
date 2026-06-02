import { describe, expect, it } from "vitest";
import {
  BLOCK_TYPES,
  HERO_VARIANTS,
  SECTION_STYLES,
  DEFAULT_HERO_VARIANT,
  DEFAULT_VARIANT,
  KEUNGGULAN_VARIANTS,
  STATISTIK_VARIANTS,
  TESTIMONI_VARIANTS,
  BERITA_VARIANTS,
  GALERI_VARIANTS,
  PPDB_VARIANTS,
  CTA_VARIANTS,
} from "../constants";

describe("block constants", () => {
  it("declares all 13 block types", () => {
    expect(BLOCK_TYPES).toHaveLength(13);
    expect(BLOCK_TYPES).toContain("hero");
    expect(BLOCK_TYPES).toContain("keunggulan");
    expect(BLOCK_TYPES).toContain("richtext");
  });

  it("declares the five hero variants including the ceria template's playful", () => {
    expect([...HERO_VARIANTS]).toEqual(["split", "centered", "fullbleed", "overlay", "playful"]);
    expect(HERO_VARIANTS).toContain(DEFAULT_HERO_VARIANT);
    expect(HERO_VARIANTS).toContain("playful");
  });

  it("declares the section styles matching the backend Select", () => {
    expect([...SECTION_STYLES]).toEqual(["card", "flat", "bordered"]);
  });

  it("covers every section variant the backend template_situs fixtures use", () => {
    // default_layout JSON in fixtures references these per-type variants.
    expect(KEUNGGULAN_VARIANTS).toEqual(expect.arrayContaining(["grid", "cards"]));
    expect(STATISTIK_VARIANTS).toEqual(expect.arrayContaining(["row"]));
    expect(BERITA_VARIANTS).toEqual(expect.arrayContaining(["cards", "list"]));
    expect(GALERI_VARIANTS).toEqual(expect.arrayContaining(["grid", "masonry"]));
    expect(TESTIMONI_VARIANTS).toEqual(expect.arrayContaining(["carousel"]));
    expect(PPDB_VARIANTS).toEqual(expect.arrayContaining(["banner"]));
    expect(CTA_VARIANTS).toEqual(expect.arrayContaining(["banner"]));
  });

  it("keeps `default` as the universal fallback variant key in every list", () => {
    expect(DEFAULT_VARIANT).toBe("default");
    for (const list of [
      KEUNGGULAN_VARIANTS,
      STATISTIK_VARIANTS,
      TESTIMONI_VARIANTS,
      BERITA_VARIANTS,
      GALERI_VARIANTS,
      PPDB_VARIANTS,
      CTA_VARIANTS,
    ]) {
      expect(list).toContain(DEFAULT_VARIANT);
    }
  });
});
