# Situs Sekolah — Per-School Website + CMS + Template Marketplace

Built overnight 2026-06-02. Branch `feat/situs-sekolah` in **both** repos
(`sekolahpro-web` web + `sekolahpro` backend), each in its own git worktree.
Nothing pushed; nothing merged to `main` — see **Status & next steps**.

## What this delivers

Every school gets its own public website on its own **subdomain or custom
domain**, with a **chosen template**, managed through a no-code **CMS** — covering
profil, berita, agenda, galeri, prestasi, fasilitas, **PPDB pendaftaran**, and
kontak. Admins (provider) can add **more templates** for schools to choose from.

```
Visitor → smp-pelita.sekolahpro.id (or custom domain)
  apps/situs SPA  →  resolve_site(host)  →  school's template + brand + live content
School admin → app-school /sch/$sekolah/situs/*  →  pick template, edit content, set domain, publish
Provider     → add a row to "Template Situs" + a template component  →  new template available
```

## 🎬 Demo in the morning (no backend needed)

The public site runs fully offline against a rich demo school (`SMP Pelita
Bangsa`) — perfect for a walkthrough without Docker/bench.

```bash
cd /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web/.worktrees/situs-sekolah
pnpm install            # if not already done
pnpm --filter @sekolahpro/app-situs dev      # → http://localhost:5184
```

Then open:
- `http://localhost:5184/` — the demo school's homepage (Klasik template)
- Try a different template live: `…/?sekolah=SMP%20Pelita%20Bangsa` then change
  `demoSite.templateKey` in `apps/situs/src/data/demo-site.ts` to `modern` /
  `ceria` (or pick per-school once the backend is up).
- Browse `/berita`, `/profil`, `/agenda`, `/galeri`, `/prestasi`, `/kontak`
- **`/ppdb`** — fill + submit the registration form → success receipt (offline
  returns a demo nomor; live writes a real Pendaftaran PPDB).

The **CMS** (admin side) lives in app-school:
```bash
pnpm --filter @sekolahpro/app-school dev     # → http://localhost:5181
# sidebar → "Situs Web" → Ringkasan / Tampilan / Berita / … / Domain
```
(CMS data calls need the backend; see below to bring it up.)

## The 3 templates (extensible)

`apps/situs/src/templates/` — `Klasik` (formal/akademik), `Modern`
(marketing-forward), `Ceria` (playful, TK/SD). Each is a homepage composition +
nav variant + skin class, composing the **shared** `src/sections/*`. Per-school
brand colors flow through every template via CSS variables (`src/theme.ts`).

**To add a template:** (1) add a row to the `Template Situs` doctype (or
`fixtures/template_situs.json`), (2) add a `TemplateDef` module under
`apps/situs/src/templates/` + register it in `templates/registry.ts`, (3) add a
skin class in `templates/skins.css`, (4) add the key to `TEMPLATE_KEYS` in both
`apps/situs/src/constants.ts` and `sekolahpro/website_sekolah/constants.py`. No
existing template changes (open/closed). A contract test guards key drift.

## Architecture (short)

- **Tenancy:** existing multi-tenancy resolves host→Organisasi (ADR-0042). This
  adds a **parallel per-Sekolah** host namespace for public sites, sharing the
  `*.sekolahpro.id` wildcard. Subdomain uniqueness enforced **cross-table**
  (Organisasi + Situs Sekolah). Resolver precedence: custom_domain → subdomain.
- **Backend module `website_sekolah`:** 7 doctypes (Template Situs + Situs
  Sekolah + Berita/Halaman/Agenda/Galeri/Prestasi Sekolah), `services/
  situs_resolver.py`, `services/situs_content.py`, guest `api/situs.py`, admin
  `api/situs_admin.py`.
- **Security:** guest reads are NOT auto-scoped by Frappe → every public read
  filters `{sekolah, status:Terbit}` explicitly + re-checks row ownership. PPDB
  submit asserts the gelombang belongs to the resolved school (anti-tamper).
  Contact Inbox / PPDB Lead lost their guest-read (cross-tenant leak) + are now
  tenant-registered.
- **SEO caveat:** `vite-react-ssg` pre-renders routes, not tenants, so per-school
  content hydrates client-side and `<meta>` is set client-side. Real crawler SEO
  needs a small server meta-injection (Caddy/Frappe) — documented as follow-up.

Full design + the 13 locked decisions: `apps/sekolahpro/.worktrees/
situs-sekolah/docs/superpowers/plans/2026-06-02-situs-sekolah.md`.
PRD / ADR-0050 / domain README under `docs/`.

## Verification status

| Area | tsc | lint | build | tests |
|------|-----|------|-------|-------|
| apps/situs (public SPA) | ✅ | ✅ | ✅ | ✅ 17 vitest |
| apps/school (CMS) | ✅ | ✅ | ✅ | ✅ KontenManager |
| backend website_sekolah | — | ✅ ruff | — | ⏳ authored, bench-run pending |

Backend Python is `ruff`-clean + `py_compile`-clean; all doctype JSON valid.
Bench tests (`api/test_situs.py`) are authored but **not yet run** — the Docker
bench container mounts the main checkout, not this worktree (see next steps).

## Status & next steps (for you)

1. **Bring the backend up** (to migrate the new doctypes + run tests). Because
   Docker mounts the main `sekolahpro` checkout, merge this branch there first
   OR run bench against a checkout that has it:
   ```bash
   # in the sekolahpro repo, on feat/situs-sekolah:
   docker exec frappe-backend-1 bench --site sekolahpro.localhost migrate
   docker exec frappe-backend-1 bench --site sekolahpro.localhost \
     run-tests --app sekolahpro --module sekolahpro.api.test_situs
   docker exec frappe-backend-1 bench --site sekolahpro.localhost \
     export-fixtures --app sekolahpro      # picks up Template Situs
   ```
2. **Create a demo Situs Sekolah** in Desk (or via the CMS) for a real Sekolah,
   set a subdomain, pick a template, add a few Berita, then **Terbitkan**.
3. **Merge + push** when you're happy (not done automatically — outward-facing).
4. Optional follow-ups (in the ADR): server-side SEO meta injection; shared
   PPDB-wizard package; reconsider Berita Sekolah vs News Article once the
   backend is runnable here; Caddy on-demand-TLS automation for custom domains.
```
