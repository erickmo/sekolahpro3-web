# Situs CMS (school admin)

No-code editor for each school's public website (rendered by `apps/situs`). Every
mutation persists to the Frappe backend (`sekolahpro.api.situs_admin.*`) via
`frappeFetch`; state is React Query. Field names are stored snake_case and
converted to the renderer's camelCase by `mapSite()` in `apps/situs`
(contract pinned by `apps/situs/.../editorContract.test.ts`).

## Routes (`apps/school/src/routes/sch.$sekolah.situs.*`)

Each route exports a prop-driven `*Page({ sekolah })` (testable) plus a thin
wrapper that reads `Route.useParams()`.

| Route | Page | Purpose |
|-------|------|---------|
| `index` | `SitusOverviewPage` | status stats, publish/draft toggle (confirmed), preview link |
| `tampilan` | `TampilanPage` | template, brand colors, hero copy, section toggles |
| `tataletak` | `TataLetakPage` | order/toggle/configure homepage layout blocks |
| `berita`/`halaman`/`agenda`/`galeri`/`prestasi` | `*Page` | content CRUD via `KontenManager` |
| `sorotan` | — | keunggulan/statistik/testimoni child arrays via `ChildArrayManager` |
| `domain` | `DomainPage` | subdomain, custom domain, DNS hints, verify/SSL badges |

## Components

- **`KontenManager`** — generic list + create/edit/delete for one content doctype,
  driven by a `KontenSchema`. Required-field validation (blocks save + inline
  errors), loading skeleton / error card, and image fields via `ImageInput`.
- **`ChildArrayManager`** — add/edit/delete/reorder rows of one Situs Sekolah child
  table; saves the whole array under `schema.field`. Guards unsaved local edits
  against background refetches (`useUnsavedChanges` + `syncedRef`).
- **`ImageInput`** — URL input + live thumbnail preview for `image` fields
  (shared by both managers). File upload needs the backend upload endpoint.
- **`BlockEditor`** (in `tataletak`) — variant picker + only the presentational
  fields the block tipe actually uses (`BLOCK_FIELDS_BY_TYPE`).
- **`schemas.ts`** — `KontenSchema`/`ChildSchema` definitions per doctype.
- **`blockSchemas.ts`** — layout-block catalogue: `BLOCK_TIPE_OPTIONS`,
  `BLOCK_TIPE_LABELS`, `BLOCK_VARIANTS`, `BLOCK_FIELDS_BY_TYPE`. **Keep in sync**
  with the SPA block registry in `apps/situs`.

## Data hooks (`apps/school/src/data/situs.ts`)

`useSitus`, `useSaveSitus`, `useTemplates`, `usePublish`, `useSetDomain`,
`useKontenList`, `useSaveKonten`, `useDeleteKonten`. All tenant-scoped server-side
via `_assert_owns(sekolah)`.

## Tests

`__tests__/` (components) + `routes/__tests__/situs.*` (routes). Run with
`VITE_USE_MOCKS=true vitest run`.
