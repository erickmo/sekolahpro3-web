# Situs Template Trio — Design

Date: 2026-06-03
Status: Approved (user: "continue silently")
Scope: Add 3 SPA-only situs templates, mirroring the existing `aurora` pattern.

## Goal

The public school website (`apps/situs`) renders one of a registry of templates.
Today there are 4: `klasik`, `modern`, `ceria`, `aurora`. Add 3 more — `elegan`,
`akademik`, `alam` — each covering a distinct school segment the current set
misses (prestige, academic/college-prep, eco/adiwiyata).

## Constraints

- Mirror `aurora`: a template is a homepage composition + skin class + demo
  preset. `aurora` is SPA-only (not in backend `TEMPLATE_KEYS`); the 3 new ones
  follow the same status. Backend persistence is a follow-up, identical to aurora.
- Open/closed: no existing template changes. New template = new module + one
  registry entry + one skin class + one demo preset + one label.
- Reuse existing Hero variants (`split`/`fullbleed`/`centered`/`playful`) and
  section components. No new Hero code, no new block renderers.
- Accent color stays per-tenant (`--situs-brand`). Skins only set
  radius / fonts / border / shadow / soft-bg tokens.

## The 3 templates

| Key | Label | Segment | Nav | Hero | sectionStyle | Skin character |
|-----|-------|---------|-----|------|--------------|----------------|
| `elegan` | Elegan | Private / international (prestige) | klasik | split | card | serif display (Fraunces), radius 10/20, refined soft shadow, ivory soft-bg #faf9f7 |
| `akademik` | Akademik | SMA / SMK / college-prep | modern | split | bordered | bold sans, radius 8/14, slate soft-bg #f1f5f9, tight tracking, structured |
| `alam` | Alam | Green / adiwiyata / nature | modern | fullbleed | card | rounded radius 18/28, green-glow shadow, mint soft-bg #f3faf4, photo-forward |

### HomeBody composition (empty-layout fallback)

- `elegan`: hero → profil → prestasi → berita → galeri → agenda
- `akademik`: hero → prestasi → berita → ppdb → profil → agenda
- `alam`: hero → galeri → prestasi → berita → profil → agenda

### Demo presets (block engine)

- `elegan`: hero split, profil, keunggulan grid, prestasi, berita cards, galeri masonry, testimoni grid, kontak
- `akademik`: hero split, statistik row, keunggulan grid, prestasi, berita list, ppdb banner, profil, kontak
- `alam`: hero fullbleed, galeri masonry, keunggulan cards, statistik tiles, prestasi, berita cards, agenda, kontak

## Files touched

- `apps/situs/src/constants.ts` — `TEMPLATE_KEYS` += 3
- `apps/situs/src/templates/Elegan.tsx` / `Akademik.tsx` / `Alam.tsx` — new TemplateDefs
- `apps/situs/src/templates/registry.ts` — register 3
- `apps/situs/src/templates/skins.css` — `.tpl-elegan` / `.tpl-akademik` / `.tpl-alam`
- `apps/situs/src/demo/DemoSwitcher.tsx` — LABELS += 3
- `apps/situs/src/demo/templatePresets.ts` — TEMPLATE_PRESETS += 3
- `apps/situs/src/__tests__/contract.test.ts` — per-template assertions

## Verification

`pnpm --filter situs typecheck` (tsc 0) · `pnpm --filter situs test` (vitest green) ·
`pnpm --filter situs build` ok. Contract test asserts registry == TEMPLATE_KEYS.

## Out of scope

- Backend `Template Situs` fixtures / `template` Select option (follow-up; same as aurora).
- app-school CMS template picker (none exists today).
