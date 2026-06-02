# Koperasi Menu by Type — Design Spec

- **Date:** 2026-06-02
- **Status:** Approved (design)
- **Domain:** koperasi (frontend `apps/school`)
- **Task size:** M (~7 files; new pure lib fn + hook + 1 new route/page + menu restructure + tests)
- **Base branch:** `main`

## Problem

The koperasi sidebar (`KOPERASI_NAV` in `apps/school/src/lib/koperasi-nav.ts`) is static and identical for every koperasi. But a koperasi runs in one of two modes, stored backend-side in the `Pengaturan Koperasi` Single doctype field `mode_koperasi`:

- `"Konvensional"` — conventional cooperative. Financing is an interest-bearing loan (bunga). No Islamic social funds.
- `"Syariah (BMT)"` — Baitul Maal wat Tamwil. Has a *Baitul Maal* social side (ZIS, Wakaf) and *Tamwil* financing via syariah akad.

The frontend does not read `mode_koperasi` at all today. The menu must adapt to the type so Konvensional users do not see syariah-only items and vice versa.

## Source of truth (verified)

| Thing | Location |
|---|---|
| Menu definition | `apps/school/src/lib/koperasi-nav.ts:19` `KOPERASI_NAV` |
| Sidebar render | `apps/school/src/routes/__root.tsx:495` (`KOPERASI_NAV.map`), `:585` select, `:606` render |
| Type field | `apps/sekolahpro/.../pengaturan_koperasi/pengaturan_koperasi.json:31` `mode_koperasi` (Select), `:284` `"issingle": 1` |
| Type constants / helper | `pengaturan_koperasi.py:6-8` `_MODE_KONVENSIONAL`/`_MODE_SYARIAH`, `:78` `is_syariah()` |
| Singleton fetch hook | `packages/api-client/src/frappeResource.ts:236` `useResourceDoc`; example `sch.$sekolah.ppdb.pengaturan.tsx:70` |

## Approach

Declarative tagging + pure filter (chosen over inline `if` in render, and over duplicated per-mode arrays).

### 1. Menu model — `lib/koperasi-nav.ts`

Extend the existing interfaces:

```ts
type KoperasiMode = "syariah" | "konvensional"; // absent = both

interface KoperasiNavItem {
  to: string;
  label: string;
  mode?: KoperasiMode;
  labelKonvensional?: string; // label override when mode is konvensional
}

interface KoperasiNavSection {
  title: string;
  items: KoperasiNavItem[];
  mode?: KoperasiMode; // section-level gate
}
```

### 2. Differentiation rules

| Change | Konvensional | BMT (Syariah) |
|---|---|---|
| Rename section `"Sosial"` → `"Baitul Maal"`, `mode: "syariah"` (items: ZIS, Wakaf) | hidden | shown |
| Move `SHU` item out of that section into `"Admin"` (no mode → both) | shown | shown |
| Pembiayaan item: `label: "Akad"`, `labelKonvensional: "Pinjaman"` (same route `/pembiayaan`) | "Pinjaman" | "Akad" |
| New item `"Suku Bunga"` in Pembiayaan, `mode: "konvensional"`, route `/suku-bunga` | shown | hidden |

### 3. Pure filter — `lib/koperasi/filterKoperasiNav.ts`

```ts
function filterKoperasiNav(
  sections: KoperasiNavSection[],
  isSyariah: boolean,
): KoperasiNavSection[]
```

- Drop a section whose `mode` mismatches the active mode.
- Within a kept section, drop items whose `mode` mismatches.
- When `isSyariah === false` and an item has `labelKonvensional`, return it with `label` replaced.
- Drop sections left with zero items.
- Pure, no I/O — the unit-test seam.

### 4. Type source — `lib/koperasi/useKoperasiMode.ts`

```ts
function useKoperasiMode(enabled: boolean): { isSyariah: boolean; isLoading: boolean }
```

- Uses `useResourceDoc<{ mode_koperasi?: string }>("Pengaturan Koperasi", "Pengaturan Koperasi")`, gated by `enabled` so non-koperasi routes never fetch it.
- `isSyariah = mode_koperasi === "Syariah (BMT)"`.
- **Fallback (loading / unknown / error) = `isSyariah: true` (superset).** Rationale: a BMT must never briefly lose ZIS/Wakaf; a Konvensional briefly seeing them is harmless. The mode string is duplicated from backend `_MODE_SYARIAH`; declare it as a named constant `MODE_SYARIAH = "Syariah (BMT)"` in this file.

### 5. Render — `__root.tsx`

- Call `const { isSyariah } = useKoperasiMode(isKop)` near the existing `isKop` computation (`:462`).
- Replace `KOPERASI_NAV.map(...)` at `:495` with `filterKoperasiNav(KOPERASI_NAV, isSyariah).map(...)`.

### 6. New route/page — `kop.$sekolah.suku-bunga.tsx`

- Konvensional-only (hidden from BMT via the menu filter; page itself renders for anyone who navigates directly — acceptable, no guard needed for MVP).
- **Minimal read-only** overview: list Produk Simpanan + Produk Pembiayaan with their `bunga` rate via `useResourceList`, with a `PageGuide` header consistent with sibling kop routes. Explicitly NOT a CRUD editor — keeps scope at M.

## Testing (TDD)

Unit tests on the pure `filterKoperasiNav`:

1. `isSyariah = true` → "Baitul Maal" section present with ZIS + Wakaf; Pembiayaan label is "Akad"; no "Suku Bunga"; "SHU" present in Admin.
2. `isSyariah = false` → no "Baitul Maal"; Pembiayaan label is "Pinjaman"; "Suku Bunga" present; "SHU" present in Admin.
3. Section emptied by item filtering is dropped.

## Out of scope

- Backend changes (mode already exists + validated server-side).
- Suku Bunga editing / interest CRUD.
- Route-level access guard on `/suku-bunga` (menu hide only).

## Files touched

| File | Change |
|---|---|
| `lib/koperasi-nav.ts` | interfaces + tag items, rename section, move SHU, add Suku Bunga |
| `lib/koperasi/filterKoperasiNav.ts` | new pure filter |
| `lib/koperasi/useKoperasiMode.ts` | new hook |
| `routes/__root.tsx` | wire hook + filter into kop sidebar |
| `routes/kop.$sekolah.suku-bunga.tsx` | new read-only page |
| `lib/koperasi/filterKoperasiNav.test.ts` | unit tests |
| `routeTree.gen.ts` | auto-generated |
