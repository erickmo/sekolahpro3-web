# @sekolahpro/app-situs — Public School Website (SPA)

Block-driven public website rendered per school. Resolves the school from the
request host (or a `?sekolah=` dev override), maps the backend payload to the
`SiteData` contract, and renders a homepage composed from layout blocks plus
section pages (berita, agenda, galeri, prestasi, profil, PPDB, kontak).

Runs offline against a bundled demo dataset when the backend is unreachable, so
the app and its tests never hard-depend on a live Frappe site.

## Architecture

```
resolve_site (backend) ──► mapSite() ──► SiteData (context) ──► Composer ──► blocks
        │                                                          │
        └── offline/error ──► demoSite (data/demo-site.ts)         └── template HomeBody (fallback)
```

- **`lib/site.ts`** — `resolveSiteData()` calls `situs.resolve_site`, falls back to
  `demoSite`. `mapSite()` converts the backend's snake_case + Frappe Check (0/1)
  payload to the renderer's camelCase + boolean `SiteData`. This conversion is the
  editor↔renderer contract (pinned by `__tests__/editorContract.test.ts`).
- **`SiteContext.tsx`** — provides the resolved `SiteData` to every block/section.
- **`templates/Composer.tsx`** — renders `site.layoutBlocks` in order, skipping
  inactive ones; falls back to the chosen template's default `HomeBody` when no
  blocks are configured.
- **`templates/registry.ts`** — template registry (Klasik / Modern / Ceria /
  Aurora), each with its own skin class; unknown keys fall back to Klasik.
- **`templates/blocks/registry.ts`** — maps `tipe` + `variant` to a block
  renderer; an unknown variant resolves to the block's first (default) entry.

## Block types

13 types (see `constants.ts` `BLOCK_TYPES`). Variants per type live in
`BLOCK_VARIANTS` (mirrored in the CMS at `apps/school/.../blockSchemas.ts`):

| Type | Reads per-block fields | Notes |
|------|------------------------|-------|
| `hero` | judul, subjudul, ctaLabel, ctaUrl | 5 variants; overrides school profil |
| `cta` | judul, subjudul, ctaLabel, ctaUrl | gradient closing panel |
| `keunggulan` | judul, subjudul | feature grid from `site.keunggulan` |
| `testimoni` | judul, subjudul | quote cards from `site.testimoni` |
| `statistik` | judul | gradient stat band from `site.statistik` |
| `richtext` | judul, konten | sanitized admin HTML |
| `profil`, `berita`, `agenda`, `galeri`, `prestasi`, `ppdb`, `kontak` | — | adapter blocks; pull global section data, ignore per-block fields |

Data-driven blocks render a muted "… belum diisi" hint when their array is empty
(matching the section previews) instead of vanishing.

## Theme

Per-tenant colors flow through `--situs-brand*` / `--situs-*` CSS vars (never
hardcoded hex); radius/shadow/fonts come from the template skin tokens
(`templates/skins.css`). See `theme.ts`.

## Adding a new block

1. Create `templates/blocks/FooBlock.tsx` reading `block` props / `useSite()`.
2. Register it in `templates/blocks/registry.ts` (`blockRegistry`) with its variants.
3. Add the `tipe` to `BLOCK_TYPES` (and variants) in `constants.ts`.
4. Mirror in the CMS: `apps/school/src/features/situs/blockSchemas.ts`
   (`BLOCK_TIPE_OPTIONS`, `BLOCK_TIPE_LABELS`, `BLOCK_VARIANTS`,
   `BLOCK_FIELDS_BY_TYPE`).
5. Add a render assertion to `__tests__/contentBlocks.test.tsx` /
   `composer.test.tsx`.

## Tests

`npm test` (vitest). See `__tests__/`: `composer` (ordering/skip/fallback),
`contentBlocks` (block render + empty state), `editorContract` (mapSite), `site`,
`blockRegistry`, `contract` (template registry).
