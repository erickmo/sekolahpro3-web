// Block renderer registry: maps a BlockType + variant to a React component.
// Open/closed — adding a block renderer = add a module + one entry here.
// The contract test (src/__tests__/blockRegistry.test.ts) asserts every
// BLOCK_TYPE has at least one renderer and that variant fallback works.
//
// Renderers are filled in across Tasks 15-17. Until a real renderer lands, a
// shared no-op (`Empty`) holds the slot so the contract test stays green and
// the Composer never crashes on a configured-but-unbuilt block. The first entry
// per tipe is the fallback for an unknown/blank variant (see resolveBlockRenderer).

import type { FC } from "react";
import {
  BERITA_VARIANTS,
  CTA_VARIANTS,
  GALERI_VARIANTS,
  HERO_VARIANTS,
  KEUNGGULAN_VARIANTS,
  PPDB_VARIANTS,
  STATISTIK_VARIANTS,
  TESTIMONI_VARIANTS,
} from "../../constants";
import type { BlockType, LayoutBlock } from "../../types";
import { HeroBlock } from "./HeroBlock";
import { RichTextBlock } from "./RichTextBlock";

/** Every block renderer receives its own block config. Site data is read
 *  from context via useSite(); the block carries per-block overrides. */
export interface BlockProps {
  block: LayoutBlock;
}

export type BlockRenderer = FC<BlockProps>;

/** tipe -> (variant -> renderer). The first entry per tipe is the fallback. */
export type BlockRegistry = Record<BlockType, Record<string, BlockRenderer>>;

/** Placeholder renderer for block variants whose real renderer is not built yet.
 *  Renders nothing so a configured-but-unbuilt block never crashes the page. */
const Empty: BlockRenderer = () => null;

/** Build a variant map where every variant resolves to the same renderer. Used
 *  to register a block's full variant surface against placeholders until the
 *  real per-variant renderers land. Preserves list order (first = fallback). */
function mapVariants(variants: readonly string[], renderer: BlockRenderer): Record<string, BlockRenderer> {
  return Object.fromEntries(variants.map((v) => [v, renderer]));
}

/** profil/agenda/prestasi/kontak ship only the `default` variant for now. */
const DEFAULT_ONLY = ["default"] as const;

export const blockRegistry: BlockRegistry = {
  hero: mapVariants(HERO_VARIANTS, HeroBlock),
  keunggulan: mapVariants(KEUNGGULAN_VARIANTS, Empty),
  statistik: mapVariants(STATISTIK_VARIANTS, Empty),
  testimoni: mapVariants(TESTIMONI_VARIANTS, Empty),
  profil: mapVariants(DEFAULT_ONLY, Empty),
  berita: mapVariants(BERITA_VARIANTS, Empty),
  agenda: mapVariants(DEFAULT_ONLY, Empty),
  galeri: mapVariants(GALERI_VARIANTS, Empty),
  prestasi: mapVariants(DEFAULT_ONLY, Empty),
  ppdb: mapVariants(PPDB_VARIANTS, Empty),
  cta: mapVariants(CTA_VARIANTS, Empty),
  kontak: mapVariants(DEFAULT_ONLY, Empty),
  richtext: { default: RichTextBlock },
};

/**
 * Resolve the renderer for a block. Falls back to the first registered variant
 * when the requested variant is unknown/blank so an unrecognized variant never
 * yields a blank slot.
 * @param tipe - The block type discriminator.
 * @param variant - The requested variant key.
 * @returns The matching renderer, or the tipe's first variant as a fallback.
 */
export function resolveBlockRenderer(tipe: BlockType, variant: string): BlockRenderer {
  const variants = blockRegistry[tipe];
  // Every tipe is registered with at least one variant (asserted by the
  // contract test), so the first entry is always present; fall back to the
  // shared no-op only to satisfy the type checker, never at runtime.
  return variants[variant] ?? Object.values(variants)[0] ?? Empty;
}
