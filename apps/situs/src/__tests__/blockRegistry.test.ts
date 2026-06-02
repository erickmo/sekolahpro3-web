// Contract: the block renderer registry must cover every BLOCK_TYPE and resolve
// variants with a first-entry fallback. Keeps the registry in lockstep with the
// constants list so a new block type can never ship without a renderer.

import { describe, expect, it } from "vitest";
import { BLOCK_TYPES } from "../constants";
import { blockRegistry, resolveBlockRenderer } from "../templates/blocks/registry";

describe("block renderer registry contract", () => {
  it("registers at least one renderer for every BLOCK_TYPE", () => {
    for (const tipe of BLOCK_TYPES) {
      const variants = blockRegistry[tipe];
      expect(variants, `missing renderer map for "${tipe}"`).toBeDefined();
      expect(Object.keys(variants).length).toBeGreaterThan(0);
    }
  });

  it("resolves a known variant", () => {
    expect(resolveBlockRenderer("hero", "overlay")).toBe(blockRegistry.hero.overlay);
  });

  it("falls back to the first registered variant for an unknown variant", () => {
    const first = Object.values(blockRegistry.hero)[0];
    expect(resolveBlockRenderer("hero", "does-not-exist")).toBe(first);
  });
});
