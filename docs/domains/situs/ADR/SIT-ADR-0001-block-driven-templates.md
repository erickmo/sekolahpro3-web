# SIT-ADR-0001: Block-Driven Templates + No-Code Block CMS

- **Status:** Accepted
- **Tanggal:** 2026-06-03
- **Domain:** Situs Sekolah (Per-School Public Website + CMS)

## Konteks

Every school needed a public website on its own subdomain/custom domain with editable content and template choice. Prior explorations considered:

- **Hardcoded per-template code:** Each new template required frontend code change + deploy. Not scalable for provider-managed template catalog.
- **Full Frappe Builder server-side HTML:** Heavyweight; blocks are Frappe documents, every render fetches metadata. SPA hydration + SEO harder.
- **Drag-drop visual WYSIWYG:** Rich UX but high complexity; visual correctness hard to maintain across template variants.

**Decision:** Adopt a **hybrid model (C)** — library of pre-built block renderers (code, built once) + block *composition* as data (child table + data-driven). This allows:

1. Schools compose homepage by adding/ordering/toggling blocks from CMS (no-code).
2. Provider adds template by creating Template Situs + JSON default_layout, no frontend code (data-driven).
3. New block types still require 1 React renderer (cost paid once, reused by all templates).

## Keputusan

### Data Model (A1)
- Situs Sekolah.`layout_blocks` = child table of Situs Layout Block (tipe, variant, aktif, judul, subjudul, cta_label, cta_url, konten).
- Situs Sekolah.`keunggulan`, `statistik`, `testimoni` = parallel child tables for presentational content.
- Situs Sekolah.`template` field references Template Situs key (klasik/modern/ceria/aurora).
- Template Situs carries token fields (radius, font_heading, font_body, shadow, section_style) + default_layout (JSON seed for new schools).

### Render Engine (B1)
- SPA **Composer** iterates `layoutBlocks`, resolves per-variant renderer from **blockRegistry** (block type → variant → React FC).
- 13 block types: hero, keunggulan, statistik, testimoni, profil, berita, agenda, galeri, prestasi, ppdb, cta, kontak, richtext.
- 5 hero variants: split, centered, fullbleed, overlay, playful. 3 keunggulan variants: default, grid, cards. Variants per-type locked in CMS schema.
- List-type blocks (berita, agenda, galeri, prestasi, profil, kontak, ppdb) wrap existing section components as block renderers.
- Fallback: No layoutBlocks → render per-template HomeBody (backward-compat for existing schools).

### CMS Tabs (School-Admin Interface)
- **Tampilan:** Template picker (card UI, preview token metadata), brand colors (brand_color, brand_color_2), hero fields (judul, subjudul, eyebrow, cta_label/url, cta2_label/url), visibility toggles (tampilkan_berita, tampilkan_agenda, etc.).
- **Tata Letak:** Add/reorder/toggle/delete blocks. Per-block modal: select variant (dropdown per tipe), set heading/subjudul/cta override, edit richtext konten. Save sends `{layout_blocks: [...]}.`
- **Sorotan:** Tab switcher (Keunggulan | Statistik | Testimoni). ChildArrayManager CRUD rows, reorder, save per-table.

### Theme Tokens
- `theme.ts` **applyTheme()** reads Template Situs token fields → emits CSS vars (`--situs-radius`, `--situs-heading-font`, `--situs-card-shadow`, `--situs-section-style`).
- Skins.css declares default token values (fallback when tokens empty).
- New template = no code change; token values + default_layout JSON from fixture suffice.

### Security & Tenant Isolation
- Guest reads NOT auto-scoped → every public endpoint re-checks row ownership (sekolah + status:Terbit).
- PPDB submit validates gelombang.sekolah = resolved school (anti-tamper).
- Child table inheritance prevents tenant-registry bloat (no new tenant docs = no leak vectors).
- Contact Inbox / PPDB Lead lost guest-read; now tenant-registered.

## Konsekuensi

### Positif
- **Template extensibility:** Adding template = 1 fixture row (Template Situs) + optionally 1 new block renderer (React component). No frontend redeploy required for data-only templates (aurora).
- **No-code composition:** Schools click buttons to assemble homepage. Block order/toggle/variant all saved to data layer.
- **Backward-compatible:** Schools without layoutBlocks render default template HomeBody (per-template layout generator still in code). No migration forced.
- **Scalable:** 10 schools, 3 templates, 3 block variants per type = combo explosion manageable because variant list is static (schema-driven), not per-school per-block.
- **Hybrid sweet spot:** Code cost (new block type) paid once, data cost (template config) paid per template, UI cost (schools picking blocks) trivial (click/dropdown/toggle).

### Negatif
- **Variant rigidity:** Adding a new hero variant (e.g., "wavy") requires React code + blockSchemas.ts update + test. Not pure data-driven.
- **CMS learning curve:** Tata Letak UI with variant picker + multiple text fields per block is denser than "just edit existing template HTML." Training needed.
- **Token-aware theme application:** CSS vars only work if renderer HTML applies them correctly; misconfigured renderer = token fallback silently fires. Needs design-system discipline.
- **SEO caveat:** SPA pre-renders routes, not tenants. Per-school `<meta>` title/description set client-side. Crawler SEO requires Caddy/Frappe server meta-injection (follow-up).

### Trade-off ditunda (YAGNI)
- **Drag-drop visual DnD:** Tata Letak reorder via button (↑/↓), not drag-drop. DnD library saved; UX is slower but stable.
- **Fasilitas block renderer:** Block type registered, but no content model (doctype, child table) yet. Skip in CMS picker until provider defines Fasilitas.
- **Shared PPDB-wizard package:** PPDB form UI in apps/situs stays local. Extract to @sekolahpro/components deferred (would require separate form schema, zod validators, etc.).
- **Server-side SEO middleware:** Per-school `<meta>` hydration moved to Caddy/Frappe layer (not in this sprint).
- **Template migration UI:** Existing schools can't "re-seed" layout_blocks from default_layout. Manual block setup required if switching template.

## Referensi

- **Spec:** `docs/superpowers/specs/2026-06-02-situs-modern-template-cms-design.md`
- **Backend module:** `sekolahpro/sekolahpro/website_sekolah/` (11 doctypes, services/, api/)
- **CMS routes:** `apps/school/src/routes/sch.$sekolah.situs*.tsx`
- **SPA Composer:** `apps/situs/src/templates/Composer.tsx`
- **Block registry:** `apps/situs/src/templates/blocks/` (HeroBlock, KeunggulanBlock, StatistikBlock, etc.)
- **Test coverage:** 17 vitest (apps/situs), backend tests authored (test_situs.py, bench-run pending)
- **SITUS-SEKOLAH.md:** `SITUS-SEKOLAH.md` (status, next steps, demo walkthrough)
