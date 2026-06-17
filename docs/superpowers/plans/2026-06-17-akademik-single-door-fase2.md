# Akademik Single-Door Fase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Relocate `siswa/rombel`, `siswa/pendaftaran`, and `absensi/**` into the Akademik single-door workspace (FE IA-only), leaving permanent redirect stubs.

**Architecture:** Mirror the Fase 1 pattern. `rombel` is a duplicate → hub redirect stub. `pendaftaran` ×3 → workspace pages under `/akademik/$ta/pendaftaran` (akademik chrome). `absensi` ×5 → chrome-bypass submodule under `/akademik/$ta/absensi` with its own ModuleShell, sourcing TA from the akademik `$ta` context (drop self-managed `usePeriodeSwitcher`).

**Tech Stack:** TanStack Router (flat dot-routes), React, `@sekolahpro/ui`, `@sekolahpro/api-client`, vitest.

**Spec:** `docs/superpowers/specs/2026-06-17-akademik-single-door-fase2-design.md`

---

### Task 1: Extend akademikNav (roots, submodule regex, workspace nav)

**Files:** Modify `apps/school/src/lib/akademikNav.ts`

- [ ] **Step 1** — Extend `WORKSPACE_MODULE_ROOTS` (line 132) to add the two new `?go=` roots:

```ts
export const WORKSPACE_MODULE_ROOTS = ["kelas", "jadwal", "ekskul", "absensi", "pendaftaran"] as const;
```

- [ ] **Step 2** — Extend `isSubmodulePath` regex (line 168) to add `absensi` ONLY (pendaftaran keeps akademik chrome):

```ts
export function isSubmodulePath(pathname: string): boolean {
  return /\/akademik\/[^/]+\/(kelas|jadwal|ekskul|absensi)(\/|$)/.test(pathname);
}
```

Update its doc comment to mention absensi (and that pendaftaran is intentionally excluded).

- [ ] **Step 3** — Add two groups to `buildWorkspaceNavGroups()` return (after "Kegiatan"), and fix the stale comment at lines 200–202 (absensi now carries `$ta`):

```ts
    {
      label: "Kehadiran",
      items: [{ to: "/sch/$sekolah/akademik/$ta/absensi", label: "Absensi" }],
    },
    {
      label: "Penerimaan",
      items: [{ to: "/sch/$sekolah/akademik/$ta/pendaftaran", label: "Pendaftaran Siswa" }],
    },
```

- [ ] **Step 4** — Typecheck the lib in isolation later (Task 7). Commit with Task 2+3.

---

### Task 2: Extend legacyRedirects (new roots + fixed-target hub stub)

**Files:** Modify `apps/school/src/lib/legacyRedirects.ts`

- [ ] **Step 1** — Widen the `workspaceStubBeforeLoad` root union (line 29):

```ts
export function workspaceStubBeforeLoad(root: "kelas" | "jadwal" | "ekskul" | "absensi" | "pendaftaran") {
```

Update its `@param` doc line accordingly.

- [ ] **Step 2** — Add a fixed-target hub stub factory (rombel needs `?go=kelas/anggota`, not derived from a splat). Append after `directStubBeforeLoad`:

```ts
/**
 * Factory for a beforeLoad that redirects a legacy URL into the Akademik hub
 * with a FIXED `?go=` target (not derived from a splat). Use when a legacy route
 * maps to one specific workspace sub-path — e.g. /siswa/rombel → kelas/anggota.
 *
 * @param go - The exact `?go=` value (validated by parseGoParam at the hub).
 * @returns A beforeLoad function ready to drop into createFileRoute().
 */
export function hubGoStubBeforeLoad(go: string) {
  return ({ params }: StubCtx): never => {
    throw redirect({
      to: "/sch/$sekolah/akademik",
      params: { sekolah: params.sekolah },
      search: { go },
      replace: true,
    });
  };
}
```

---

### Task 3: Unit tests for Task 1 + 2

**Files:** Create `apps/school/src/routes/__tests__/akademik-fase2.test.ts`

- [ ] **Step 1** — Write the test file:

```ts
/**
 * Fase 2 single-door additions: parseGoParam accepts the absensi/pendaftaran
 * roots, isSubmodulePath treats absensi as a chrome-bypass submodule but NOT
 * pendaftaran, the workspace pill bar exposes both new entries, and the new
 * redirect stubs throw the right hub redirect.
 */
import { describe, it, expect } from "vitest";
import { parseGoParam, isSubmodulePath, buildWorkspaceNavGroups } from "../../lib/akademikNav";
import { hubGoStubBeforeLoad, workspaceStubBeforeLoad } from "../../lib/legacyRedirects";

describe("parseGoParam — Fase 2 roots", () => {
  it("accepts absensi, pendaftaran and nested sub-paths", () => {
    expect(parseGoParam("absensi")).toBe("absensi");
    expect(parseGoParam("absensi/guru")).toBe("absensi/guru");
    expect(parseGoParam("pendaftaran")).toBe("pendaftaran");
    expect(parseGoParam("pendaftaran/new")).toBe("pendaftaran/new");
    expect(parseGoParam("kelas/anggota")).toBe("kelas/anggota");
  });
  it("still rejects unknown roots and traversal", () => {
    expect(parseGoParam("siswa")).toBeNull();
    expect(parseGoParam("absensi/../siswa")).toBeNull();
  });
});

describe("isSubmodulePath — Fase 2", () => {
  it("treats absensi as a submodule (own shell)", () => {
    expect(isSubmodulePath("/sch/A/akademik/2024/absensi")).toBe(true);
    expect(isSubmodulePath("/sch/A/akademik/2024/absensi/guru")).toBe(true);
  });
  it("does NOT treat pendaftaran as a submodule (keeps akademik chrome)", () => {
    expect(isSubmodulePath("/sch/A/akademik/2024/pendaftaran")).toBe(false);
    expect(isSubmodulePath("/sch/A/akademik/2024/pendaftaran/new")).toBe(false);
  });
});

describe("buildWorkspaceNavGroups — Fase 2 entries", () => {
  it("exposes Absensi and Pendaftaran Siswa pill entries", () => {
    const all = buildWorkspaceNavGroups().flatMap((g) => g.items);
    expect(all.some((i) => i.to === "/sch/$sekolah/akademik/$ta/absensi")).toBe(true);
    expect(all.some((i) => i.to === "/sch/$sekolah/akademik/$ta/pendaftaran")).toBe(true);
  });
});

describe("redirect stubs — Fase 2", () => {
  function caughtRedirect(fn: () => never, sekolah = "A", _splat?: string) {
    try {
      fn({ params: { sekolah, ...(_splat ? { _splat } : {}) }, location: { searchStr: "" } } as never);
    } catch (e) {
      return e as { to?: string; search?: { go?: string }; params?: { sekolah?: string } };
    }
    throw new Error("expected redirect to throw");
  }
  it("hubGoStubBeforeLoad routes a fixed go target through the hub", () => {
    const r = caughtRedirect(hubGoStubBeforeLoad("kelas/anggota"));
    expect(r.to).toBe("/sch/$sekolah/akademik");
    expect(r.search?.go).toBe("kelas/anggota");
    expect(r.params?.sekolah).toBe("A");
  });
  it("workspaceStubBeforeLoad('pendaftaran') forwards the splat", () => {
    const r = caughtRedirect(workspaceStubBeforeLoad("pendaftaran"), "A", "new");
    expect(r.search?.go).toBe("pendaftaran/new");
  });
  it("workspaceStubBeforeLoad('absensi') forwards bare root", () => {
    const r = caughtRedirect(workspaceStubBeforeLoad("absensi"), "A");
    expect(r.search?.go).toBe("absensi");
  });
});
```

- [ ] **Step 2** — Run: `pnpm --filter @sekolahpro/school test -- akademik-fase2` → expect PASS.
- [ ] **Step 3** — Commit Tasks 1–3: `feat(akademik): perluas workspace roots + stub hub utk Fase 2`.

---

### Task 4: rombel → hub redirect stub

**Files:** Modify `apps/school/src/routes/sch.$sekolah.siswa.rombel.tsx`, `apps/school/src/lib/orang/nav.ts`

- [ ] **Step 1** — Replace the ENTIRE content of `sch.$sekolah.siswa.rombel.tsx` with:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { hubGoStubBeforeLoad } from "../lib/legacyRedirects";

/** Permanent redirect stub — Anggota Rombel now lives at
 * /akademik/$ta/kelas/anggota (Fase 2 single-door). Routes through the hub so
 * the running TA is resolved before landing. */
export const Route = createFileRoute("/sch/$sekolah/siswa/rombel")({
  beforeLoad: hubGoStubBeforeLoad("kelas/anggota"),
});
```

- [ ] **Step 2** — In `lib/orang/nav.ts`, remove the "Anggota Rombel" item (line 32) from the "Data Pokok" group, and drop `rombel` from the "Routes confirmed present" comment.

- [ ] **Step 3** — Commit: `feat(siswa): rombel redirect ke akademik/kelas/anggota (Fase 2)`.

---

### Task 5: pendaftaran → /akademik/$ta/pendaftaran + stubs

**Files:**
- Move: `siswa.pendaftaran.tsx` → `akademik.$ta.pendaftaran.index.tsx`; `siswa.pendaftaran.new.tsx` → `akademik.$ta.pendaftaran.new.tsx`; `siswa.pendaftaran.$id.tsx` → `akademik.$ta.pendaftaran.$id.tsx`
- Create: `sch.$sekolah.siswa.pendaftaran.index.tsx`, `sch.$sekolah.siswa.pendaftaran.$.tsx`
- Modify: `lib/orang/nav.ts`

- [ ] **Step 1** — `git mv` the three files (exact commands in execution).
- [ ] **Step 2** — In each moved file: change `createFileRoute("/sch/$sekolah/siswa/pendaftaran...")` id → `"/sch/$sekolah/akademik/$ta/pendaftaran..."`; update every `useParams({ from })` to the new id and destructure `ta`; update internal `Link`/`navigate` `to`+`params` that point at `/sch/$sekolah/siswa/pendaftaran/...` to the new `/akademik/$ta/pendaftaran/...` carrying `{ sekolah, ta }`. Links to the created Siswa record (`/sch/$sekolah/siswa/$nis`) stay unchanged.
- [ ] **Step 3** — Create the two stubs:

```tsx
// sch.$sekolah.siswa.pendaftaran.index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { workspaceStubBeforeLoad } from "../lib/legacyRedirects";

/** Permanent stub — Pendaftaran Siswa moved to /akademik/$ta/pendaftaran (Fase 2). */
export const Route = createFileRoute("/sch/$sekolah/siswa/pendaftaran/")({
  beforeLoad: workspaceStubBeforeLoad("pendaftaran"),
});
```

```tsx
// sch.$sekolah.siswa.pendaftaran.$.tsx
import { createFileRoute } from "@tanstack/react-router";
import { workspaceStubBeforeLoad } from "../lib/legacyRedirects";

/** Splat stub: deep links like /siswa/pendaftaran/new keep working post-move. */
export const Route = createFileRoute("/sch/$sekolah/siswa/pendaftaran/$")({
  beforeLoad: workspaceStubBeforeLoad("pendaftaran"),
});
```

- [ ] **Step 4** — In `lib/orang/nav.ts`, remove the "Pendaftaran" item (line 38) from "Penerimaan" (keeps "Mutasi Masuk"); drop `pendaftaran` from the comment.
- [ ] **Step 5** — `pnpm generate` then `pnpm --filter @sekolahpro/school typecheck`. Commit: `feat(akademik): pindah Pendaftaran Siswa ke /akademik/$ta (Fase 2)`.

---

### Task 6: absensi → /akademik/$ta/absensi submodule + stubs

**Files:**
- Move: `absensi.tsx` → `akademik.$ta.absensi.tsx`; `absensi.index.tsx` → `akademik.$ta.absensi.index.tsx`; `absensi.daftar.tsx` → `akademik.$ta.absensi.daftar.tsx`; `absensi.guru.tsx` → `akademik.$ta.absensi.guru.tsx`; `absensi.pelajaran.tsx` → `akademik.$ta.absensi.pelajaran.tsx`
- Create: `sch.$sekolah.absensi.index.tsx`, `sch.$sekolah.absensi.$.tsx`
- Modify: `routes/__root.tsx` (sidebar)

- [ ] **Step 1** — `git mv` the five files.
- [ ] **Step 2** — Rewrite the layout `akademik.$ta.absensi.tsx` to source TA from the akademik context (mirror `akademik.$ta.kelas.tsx`): drop `usePeriodeSwitcher`/`periodeSwitcher` import, read `useAkademikContext()`, feed `AbsensiPeriodProvider value={akademik}`, point NAV_GROUPS `to` at `/sch/$sekolah/akademik/$ta/absensi/*`, and render `StripTahun` as a read-only badge (no `taSwitch`) on `/guru`, `TahunChip` on daily surfaces. New file body:

```tsx
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { ModuleShell } from "../components/shell/ModuleShell";
import { StripTahun } from "../components/shell/StripTahun";
import { TahunChip } from "../components/shell/TahunChip";
import type { NavTabGroup } from "../components/GroupedNavTabs";
import { useGenericRoleLabel } from "../lib/genericRole";
import { useAkademikContext } from "../lib/akademikContext";
import { AbsensiPeriodProvider } from "../lib/absensiPeriode";

const NAV_GROUPS: NavTabGroup[] = [
  { label: "Ringkasan", items: [{ to: "/sch/$sekolah/akademik/$ta/absensi", label: "Dashboard", exact: true }] },
  {
    label: "Kehadiran",
    items: [
      { to: "/sch/$sekolah/akademik/$ta/absensi/daftar", label: "Harian Siswa" },
      { to: "/sch/$sekolah/akademik/$ta/absensi/pelajaran", label: "Per Pelajaran" },
      { to: "/sch/$sekolah/akademik/$ta/absensi/guru", label: "Absensi Guru" },
    ],
  },
];

const CHIP_HINT = "otomatis ikut tanggal";

// Layout shell for Absensi, now a sub-module inside the per-Tahun-Ajaran Akademik
// workspace (Fase 2 single-door). The TA is fixed by the route `$ta` and passes
// through the akademik context to AbsensiPeriodProvider (so Absensi Guru still
// scopes/gates by year). Only Absensi Guru is TA-keyed; the date-driven daily
// surfaces show a passive TahunChip. Switching TA happens via the Akademik
// hub/breadcrumb, so the strip is a read-only badge.
function AbsensiLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const roleLabel = useGenericRoleLabel();
  const akademik = useAkademikContext();
  const onGuru = pathname.endsWith("/guru");

  const context = onGuru ? (
    <StripTahun
      moduleLabel="Absensi"
      taLabel={akademik.tahunAjaran}
      isPastPeriod={akademik.isPastPeriod}
      noActiveTa={akademik.noActiveTa}
      {...(roleLabel ? { roleLabel } : {})}
    />
  ) : akademik.tahunAjaran ? (
    <TahunChip label={akademik.tahunAjaran} hint={CHIP_HINT} {...(roleLabel ? { roleLabel } : {})} />
  ) : undefined;

  return (
    <AbsensiPeriodProvider value={akademik}>
      <ModuleShell navGroups={NAV_GROUPS} pathname={pathname} {...(context ? { context } : {})}>
        <Outlet />
      </ModuleShell>
    </AbsensiPeriodProvider>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/$ta/absensi")({ component: AbsensiLayout });
```

- [ ] **Step 3** — In each moved page file, change the `createFileRoute` id to the `/akademik/$ta/absensi/...` form. In `akademik.$ta.absensi.index.tsx` (dashboard), update internal `Link`/`navigate` targets that point at `/sch/$sekolah/absensi/...` to `/sch/$sekolah/akademik/$ta/absensi/...` and add `ta` to their `params` (read `ta` via `useParams({ from: "/sch/$sekolah/akademik/$ta/absensi" })`). Cross-links to `/sch/$sekolah/siswa/...` stay. `guru`/`daftar`/`pelajaran` only need the id change (they read period via `useAbsensiPeriode`, unchanged).
- [ ] **Step 4** — Create the two stubs:

```tsx
// sch.$sekolah.absensi.index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { workspaceStubBeforeLoad } from "../lib/legacyRedirects";

/** Permanent stub — Absensi moved under /akademik/$ta/absensi (Fase 2). */
export const Route = createFileRoute("/sch/$sekolah/absensi/")({
  beforeLoad: workspaceStubBeforeLoad("absensi"),
});
```

```tsx
// sch.$sekolah.absensi.$.tsx
import { createFileRoute } from "@tanstack/react-router";
import { workspaceStubBeforeLoad } from "../lib/legacyRedirects";

/** Splat stub: deep links like /absensi/guru keep working post-move. */
export const Route = createFileRoute("/sch/$sekolah/absensi/$")({
  beforeLoad: workspaceStubBeforeLoad("absensi"),
});
```

- [ ] **Step 5** — In `routes/__root.tsx`, remove `mk("/absensi", "Absensi", <IconCheck />)` (line 478) from the "Akademik" sidebar section.
- [ ] **Step 6** — `pnpm generate` then typecheck. Commit: `feat(akademik): pindah Absensi ke /akademik/$ta submodule (Fase 2)`.

---

### Task 7: Verify + regression sweep

- [ ] **Step 1** — Grep tests/components for stale old paths (`/siswa/rombel`, `/siswa/pendaftaran`, `to="/sch/$sekolah/absensi`) and fix any test/page that links to a moved route directly.
- [ ] **Step 2** — Run sequentially (memory: no concurrent full builds): `pnpm generate` → `pnpm --filter @sekolahpro/school typecheck` (0) → `pnpm --filter @sekolahpro/school lint` (0) → `pnpm --filter @sekolahpro/school test` (no regressions) → `pnpm --filter @sekolahpro/school build` (ok).
- [ ] **Step 3** — Fix any failure; re-run until green.

---

### Task 8: Docs + spec status

- [ ] **Step 1** — Flip the spec `Status:` to "Implemented" and add the PR link once opened.
- [ ] **Step 2** — If `docs/implementation-tracker.md` tracks an akademik single-door / IA item, mark Fase 2 done with the test count.
- [ ] **Step 3** — Commit: `docs(akademik): tandai Fase 2 single-door selesai`.
