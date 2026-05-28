# Parent App — Design Spec

**Date:** 2026-05-29
**Status:** Approved
**Owner:** Frontend

## Goal

Add a new SPA `@sekolahpro/app-parent` under `apps/parent/` so a parent (wali) can view academic, attendance, message, and billing data for every child linked to their account in one portal.

## Scope

In:
- Multi-child portal scoped by Frappe `session.user` (parent) → linked `Siswa` records.
- Header child switcher with persistent selection.
- Read-only surfaces: Dashboard, Jadwal, Nilai, Absensi, Pesan, Pembayaran, Profil.
- Reuse `@sekolahpro/{api-client,auth,config,tenant,ui}`.
- Mock data fallback gated by `VITE_USE_MOCKS=true` until backend lands.

Out:
- Editing/mutations (no excuse submission, no payment processing in MVP).
- Chat with teachers (use existing pesan inbox model only).
- Push notifications.

## Architecture

### App Skeleton

Mirror `apps/student/`:

```
apps/parent/
├─ package.json            # name: "@sekolahpro/app-parent", port 5176
├─ vite.config.ts          # copy student
├─ tsconfig.json
├─ tailwind.config.ts
├─ postcss.config.cjs
├─ index.html
└─ src/
   ├─ main.tsx             # configure({ baseUrl }), QueryClient, RouterProvider
   ├─ styles.css
   ├─ routeTree.gen.ts     # generated
   ├─ data/                # hooks + types + mock fixtures
   │  ├─ children.ts
   │  ├─ dashboard.ts
   │  ├─ jadwal.ts
   │  ├─ nilai.ts
   │  ├─ absensi.ts
   │  ├─ pesan.ts
   │  ├─ tagihan.ts
   │  ├─ notifikasi.ts
   │  └─ mock/             # fixtures used when VITE_USE_MOCKS=true
   ├─ lib/
   │  └─ activeChild.tsx   # ActiveChildProvider + useActiveChild
   └─ routes/
      ├─ __root.tsx        # AppShell, SidebarNav, header ChildSwitcher
      ├─ login.tsx
      ├─ index.tsx
      ├─ jadwal.tsx
      ├─ nilai.tsx
      ├─ absensi.tsx
      ├─ pesan.tsx
      ├─ pembayaran.tsx
      └─ profil.tsx
```

Same Vite/Tailwind/Tanstack-Router setup as student. Dev port `5176` (student is `5174`, school `5173`, saas `5175` by convention — adjust if conflict).

### Workspace Wiring

- Add `apps/parent` to root `pnpm-workspace.yaml` (already covered by `apps/*` glob — verify).
- Add `"@sekolahpro/app-parent"` build/dev/lint/typecheck/test scripts at root if root scripts enumerate apps.

### Active Child Context

```ts
// src/lib/activeChild.tsx
interface ActiveChildCtx {
  activeNis: string | null;
  setActiveNis: (nis: string) => void;
  children: ChildSummary[];
  isLoading: boolean;
}
```

- Provider wraps `<RouterProvider>` inside `main.tsx` (above router).
- Reads `sessionStorage["activeChildNis"]`; falls back to `children[0].nis`.
- Writes through to `sessionStorage` on `setActiveNis`.
- Switching child invalidates queries with key prefix `["sekolahpro.api.parent."]` to refetch per-child data.

### Header Child Switcher

`<ChildSwitcher>` rendered in `__root.tsx` topbar, left of notification bell. Popover lists children with name + kelas + avatar; selecting one calls `setActiveNis`.

When `children.length === 1`: render static badge (no popover).

When `children.length === 0`: show empty state route guard ("Akun belum ditautkan ke siswa — hubungi sekolah").

## Data Layer

### Backend Contract (to be implemented by backend team)

All methods whitelisted under `sekolahpro.api.parent.*`. Server derives parent from `frappe.session.user` and authorizes the requested `nis` against the parent's linked `Siswa` table. Unauthorized `nis` → `403`.

| Method | Args | Returns |
|---|---|---|
| `list_children` | `{}` | `Array<ChildSummary>` |
| `child_dashboard` | `{ nis }` | `ChildDashboard` |
| `child_jadwal` | `{ nis, week?: ISODate }` | `Array<JadwalItem>` |
| `child_nilai` | `{ nis, semester?: string }` | `Array<NilaiItem>` |
| `child_absensi` | `{ nis, month?: "YYYY-MM" }` | `Array<AbsensiItem>` |
| `list_pesan` | `{}` | `Array<PesanItem>` |
| `list_tagihan` | `{ nis?: string }` | `Array<TagihanItem>` |
| `tagihan_detail` | `{ id: string }` | `TagihanDetail` |

Types live in `src/data/types.ts`. Field naming: snake_case from backend, camelCase in app — mapped in hook layer (same convention as `useTenant`).

### Hooks

```ts
useChildren()                          // list_children
useChildDashboard(nis)                 // child_dashboard
useChildJadwal(nis, week?)             // child_jadwal
useChildNilai(nis, semester?)          // child_nilai
useChildAbsensi(nis, month?)           // child_absensi
usePesanList()                         // list_pesan
useTagihanList(nis?)                   // list_tagihan
useTagihanDetail(id)                   // tagihan_detail
```

All use `useFrappeMethod` from `@sekolahpro/api-client`. Cache keys = `[method, args]` → automatic per-child partitioning.

Each child-scoped hook short-circuits when `nis` is `null` (`enabled: !!nis`).

### Mock Fallback

`src/data/mock/index.ts` exports fixtures. Each hook:

```ts
if (import.meta.env.VITE_USE_MOCKS === "true") {
  return useQuery({ queryKey: [...], queryFn: async () => mock.children, staleTime: Infinity });
}
return useFrappeMethod(...);
```

Removed once backend endpoints are live.

## Routes

| Path | Content |
|---|---|
| `/login` | Reuse student login layout; same `@sekolahpro/auth` flow. |
| `/` | Dashboard for active child: rerata nilai, kehadiran %, tugas pending, info terkini. |
| `/jadwal` | Weekly schedule table, week picker. |
| `/nilai` | Grades grouped by mapel, semester filter. |
| `/absensi` | Month grid + status legend. |
| `/pesan` | Parent-wide inbox; each item tagged with child name. |
| `/pembayaran` | Tagihan list, filter by child or "Semua". Detail drawer. |
| `/profil` | Parent identity + linked children list + logout. |

All non-login routes wrapped in `<RequireAuth>` from `@sekolahpro/auth`.

## Error Handling

- `FrappeError 401` → redirect to `/login` (handled by existing `RequireAuth`).
- `FrappeError 403` on per-child fetch → toast "Tidak punya akses ke siswa ini" + reset active child to first authorized.
- Loading states: skeleton placeholders matching student app patterns.
- Empty states: localized Indonesian copy, no children/links → contact-school CTA.

## Testing

- `vitest run --passWithNoTests` baseline (same as student).
- Add unit test for `ActiveChildProvider` (default selection + persistence).
- Add unit test for `ChildSwitcher` (renders list, fires `setActiveNis`).
- Add a smoke test for at least one data hook using mock mode.

## Open Questions (for backend team, non-blocking)

- Exact shape of `Wali ↔ Siswa` link doctype.
- Whether `list_pesan` should also filter by active child (vs parent-wide).
- Pagination strategy for `list_tagihan` and `list_pesan`.

## Out of Scope (Future)

- Payment gateway integration.
- Push/email notification preferences.
- Multi-parent collaboration on the same child.
