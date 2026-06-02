// Block renderer registry: maps a BlockType + variant to a React component.
// Open/closed — adding a block renderer = add a module + one entry here.
// The contract test (src/__tests__/blockRegistry.test.ts) asserts every
// BLOCK_TYPE has at least one renderer and that variant fallback works.
//
// All block types now resolve to a real renderer (Tasks 15-17). Each variant
// listed in constants maps to a concrete component via mapVariants; the first
// entry per tipe (`default`/`split`) is the fallback for an unknown/blank
// variant (see resolveBlockRenderer). The shared no-op `Empty` survives only as
// the type-checker safety net inside resolveBlockRenderer — never at runtime.

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
import { CtaBlock } from "./CtaBlock";
import { HeroBlock } from "./HeroBlock";
import { KeunggulanBlock } from "./KeunggulanBlock";
import { RichTextBlock } from "./RichTextBlock";
import { StatistikBlock } from "./StatistikBlock";
import { TestimoniBlock } from "./TestimoniBlock";
import {
  AgendaBlock,
  BeritaBlock,
  GaleriBlock,
  KontakBlock,
  PpdbBlock,
  PrestasiBlock,
  ProfilBlock,
} from "./sectionBlocks";

/** Every block renderer receives its own block config. Site data is read
 *  from context via useSite(); the block carries per-block overrides. */
export interface BlockProps {
  block: LayoutBlock;
}

export type BlockRenderer = FC<BlockProps>;

/** tipe -> (variant -> renderer). The first entry per tipe is the fallback. */
export type BlockRegistry = Record<BlockType, Record<string, BlockRenderer>>;

/** Type-checker safety net for resolveBlockRenderer. Renders nothing; never
 *  reached at runtime because every tipe is registered with ≥ 1 real variant. */
const Empty: BlockRenderer = () => null;

/** Build a variant map where every variant key resolves to the SAME renderer.
 *  A block's distinct fixture variants (grid/cards/row/banner/…) currently share
 *  one modern layout; this registers the full variant surface so no fixture
 *  variant falls through to a blank slot. Preserves list order (first = fallback). */
function mapVariants(variants: readonly string[], renderer: BlockRenderer): Record<string, BlockRenderer> {
  return Object.fromEntries(variants.map((v) => [v, renderer]));
}

/** profil/agenda/prestasi/kontak ship only the `default` variant. */
const DEFAULT_ONLY = ["default"] as const;

export const blockRegistry: BlockRegistry = {
  hero: mapVariants(HERO_VARIANTS, HeroBlock),
  keunggulan: mapVariants(KEUNGGULAN_VARIANTS, KeunggulanBlock),
  statistik: mapVariants(STATISTIK_VARIANTS, StatistikBlock),
  testimoni: mapVariants(TESTIMONI_VARIANTS, TestimoniBlock),
  profil: mapVariants(DEFAULT_ONLY, ProfilBlock),
  berita: mapVariants(BERITA_VARIANTS, BeritaBlock),
  agenda: mapVariants(DEFAULT_ONLY, AgendaBlock),
  galeri: mapVariants(GALERI_VARIANTS, GaleriBlock),
  prestasi: mapVariants(DEFAULT_ONLY, PrestasiBlock),
  ppdb: mapVariants(PPDB_VARIANTS, PpdbBlock),
  cta: mapVariants(CTA_VARIANTS, CtaBlock),
  kontak: mapVariants(DEFAULT_ONLY, KontakBlock),
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
