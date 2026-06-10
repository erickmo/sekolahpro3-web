# Akademik Single-Door — Fase 1 (IA Restructure) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse Kelas, Jadwal, Ekstrakurikuler, and PPDB into the period-first `/akademik` workspace, remove the Koperasi cross-link, and leave permanent redirect stubs — sidebar shrinks 21 → 16 doors.

**Architecture:** Move 39 route files under `sch.$sekolah.akademik.*` via `git mv` + path edits. The `$ta` workspace layout keeps providing `AkademikContextProvider` but bypasses its own chrome for sub-modules (they keep their `ModuleShell`s). Old paths become redirect stubs (index + splat per module, built from a shared lib factory) that funnel through the hub with a `?go=` param; the hub resolves the TA then forwards. Sub-modules take **TA identity** from the workspace context but keep **local Semester-document resolution** — akademik's `semester` is `"Ganjil"|"Genap"` while ekskul/jadwal filter by `Semester` docnames (`SEM-####`); the two value spaces must never be mixed. Spec: `docs/superpowers/specs/2026-06-10-akademik-single-door-ia-design.md` (v2, with research corrections).

**Tech Stack:** React 18, TanStack Router **1.170.x** (file-based; `routeTree.gen.ts` generated, gitignored; `throw redirect()` → thrown value carries `.options.{to,search,replace,href}`; splat param key `_splat`; `navigate({ href })` supported), Vitest + Testing Library (jsdom, `globals:false` → every RTL file needs `afterEach(cleanup)`), pnpm workspace.

**Package/commands (exact — `pnpm --filter school` matches NOTHING and exits 0):**
- typecheck: `pnpm --filter @sekolahpro/app-school typecheck`
- lint: `pnpm --filter @sekolahpro/app-school lint`
- tests: `pnpm --filter @sekolahpro/app-school test [path]` (script sets `VITE_USE_MOCKS=true`; bare `vitest` drops it)
- route tree: `pnpm --filter @sekolahpro/app-school generate`
- build: `pnpm --filter @sekolahpro/app-school build`

**Repo/paths:** all paths relative to `apps/school/` in `sekolahpro-web`. Work in an isolated git worktree branched from **`origin/main`** (not local main). After `pnpm install`, run generate before any typecheck — a fresh worktree shows hundreds of phantom tsc errors otherwise.

**Backend Fase 0** (separate repo `apps/sekolahpro`, NOT this plan): `tahun_ajaran` on Absensi Harian/Pelajaran + write-lock. Gates Fase 2 only.

---

## Period-context ground truth (read before Tasks 3–5)

- Kelas/Jadwal/Ekskul layouts currently resolve their period via
  `usePeriodeSwitcher(sekolah, "kelas"|"jadwal"|"ekskul")` (`lib/periodeSwitcher.ts`)
  and feed `KelasPeriodProvider` / `JadwalPeriodProvider` / `EkskulContextProvider`.
  Pages read context hooks (`useKelasPeriode`, `useKelasReadOnly`, …), not props.
- `AkademikContextValue`, `EkskulContextValue`, kelas/jadwal period values are all
  aliases of the same `PeriodContextValue` shape.
- **Semester value spaces differ:** akademik context `semester` = `"Ganjil"|"Genap"`
  (`computeSemester`). Ekskul/jadwal pages filter and insert `Semester` **docnames**
  (e.g. `Sesi Ekstrakurikuler.semester` is a required Link). Rewiring rule:
  - `tahunAjaran`, `isPastPeriod`, `noActiveTa` → from `useAkademikContext()`.
  - `semester` for ekskul/jadwal → local state over `Semester` docs fetched with
    `filters: { tahun_ajaran: <workspace TA> }` (keep the existing semester dropdown).
  - Kelas has no semester axis → pass the akademik value through untouched.
- **Cross-TA exemptions (by design, see comment in old `kelas.tsx:32-36`):** the
  kepsek approval queue (`kelas/index`), wali cockpit (`kelas/saya`), and
  `$kodeKelas` drilldown deliberately ignore the period (approvals span TA
  rollover; kelasku is guru-personal). These pages move under `$ta` for URL
  consistency but DO NOT gain a `tahun_ajaran` filter. Only `daftar`, `rombel`,
  `anggota` become TA-filtered.

---

## Pre-flight

- [ ] **Step 0.1:** `git fetch origin main`; create worktree + branch `feat/akademik-single-door-fase1` from `origin/main`; `pnpm install`; `pnpm --filter @sekolahpro/app-school generate`; confirm typecheck is clean BEFORE changes.
- [ ] **Step 0.2: Period-resolution inventory.** Record every hit; each is either rewired (Tasks 3–5) or explicitly exempted (list above):

```bash
grep -rnE "usePeriodeSwitcher|readStoredPeriode|resolveTahunAjaran|PeriodProvider|StripTahun|is_current" \
  src/routes src/components src/lib --include="*.ts*" | grep -iE "kelas|jadwal|ekskul"
```

---

### Task 1: lib groundwork — nav model, `go` param, next-TA picker, stub factory, hub search passthrough

**Files:**
- Modify: `src/lib/akademikNav.ts`
- Create: `src/lib/legacyRedirects.ts`
- Modify: `src/routes/sch.$sekolah.akademik.index.tsx` (validateSearch ONLY — consumption is Task 7)
- Test: `src/lib/akademikNav.test.ts` (extend/create), `src/lib/legacyRedirects.test.ts` (create)

- [ ] **Step 1.1: Write failing tests** (`akademikNav.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import {
  buildWorkspaceNavGroups,
  isSubmodulePath,
  parseGoParam,
  pickNextTa,
} from "./akademikNav";

describe("parseGoParam", () => {
  it("accepts whitelisted module subpaths", () => {
    expect(parseGoParam("kelas")).toBe("kelas");
    expect(parseGoParam("kelas/rombel")).toBe("kelas/rombel");
    expect(parseGoParam("jadwal/papan")).toBe("jadwal/papan");
    expect(parseGoParam("ekskul/program")).toBe("ekskul/program");
  });
  it("rejects unknown roots, absolute URLs, traversal, odd segments", () => {
    expect(parseGoParam("keuangan")).toBeNull();
    expect(parseGoParam("https://evil")).toBeNull();
    expect(parseGoParam("kelas/../pengaturan")).toBeNull();
    expect(parseGoParam("kelas/%2e%2e/x")).toBeNull();
    expect(parseGoParam("kelas//x")).toBeNull();
    expect(parseGoParam("/kelas")).toBeNull();
    expect(parseGoParam("")).toBeNull();
    expect(parseGoParam(undefined)).toBeNull();
  });
});

describe("isSubmodulePath", () => {
  it("matches module pages under a TA workspace", () => {
    expect(isSubmodulePath("/sch/a/akademik/2025%2F2026/kelas")).toBe(true);
    expect(isSubmodulePath("/sch/a/akademik/2025%2F2026/jadwal/papan")).toBe(true);
    expect(isSubmodulePath("/sch/a/akademik/2025%2F2026/ekskul")).toBe(true);
  });
  it("does not match workspace dashboard or penilaian pages", () => {
    expect(isSubmodulePath("/sch/a/akademik/2025%2F2026")).toBe(false);
    expect(isSubmodulePath("/sch/a/akademik/2025%2F2026/asesmen")).toBe(false);
  });
});

describe("pickNextTa", () => {
  const rows = [
    { name: "2024/2025", tanggal_mulai: "2024-07-01" },
    { name: "2025/2026", tanggal_mulai: "2025-07-01" },
    { name: "2026/2027", tanggal_mulai: "2026-07-01" },
  ];
  it("returns the nearest TA starting after refDate (local-date string compare)", () => {
    expect(pickNextTa(rows, "2026-06-10")?.name).toBe("2026/2027");
  });
  it("treats a TA starting today as not upcoming", () => {
    expect(pickNextTa(rows, "2026-07-01")).toBeNull();
  });
  it("returns null when none upcoming", () => {
    expect(pickNextTa(rows, "2027-01-01")).toBeNull();
  });
});

describe("buildWorkspaceNavGroups", () => {
  it("contains Pengaturan and Kegiatan groups with module links", () => {
    const groups = buildWorkspaceNavGroups();
    expect(groups.map((g) => g.label)).toEqual(["Ringkasan", "Pengaturan", "Penilaian", "Kegiatan"]);
    const pengaturan = groups.find((g) => g.label === "Pengaturan")!;
    expect(pengaturan.items.map((i) => i.to)).toEqual([
      "/sch/$sekolah/akademik/$ta/kelas",
      "/sch/$sekolah/akademik/$ta/jadwal/papan",
      "/sch/$sekolah/akademik/$ta/ekskul/program",
    ]);
  });
});
```

(`NavTabItem.to` is a plain `string` — these paths compiling before the routes exist is fine.)

`legacyRedirects.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { directStubBeforeLoad, workspaceStubBeforeLoad } from "./legacyRedirects";

/** The factories throw the TanStack redirect; catch and inspect `.options`. */
function catchRedirect(fn: () => void) {
  try {
    fn();
  } catch (err) {
    return (err as { options: { to?: string; href?: string; search?: { go?: string }; replace?: boolean } }).options;
  }
  throw new Error("expected redirect");
}

describe("workspaceStubBeforeLoad", () => {
  it("sends the module root through the hub go param", () => {
    const o = catchRedirect(() =>
      workspaceStubBeforeLoad("kelas")({ params: { sekolah: "demo" } } as never),
    );
    expect(o.to).toBe("/sch/$sekolah/akademik");
    expect(o.search?.go).toBe("kelas");
    expect(o.replace).toBe(true);
  });
  it("appends the splat subpath when present", () => {
    const o = catchRedirect(() =>
      workspaceStubBeforeLoad("ekskul")({ params: { sekolah: "demo", _splat: "program" } } as never),
    );
    expect(o.search?.go).toBe("ekskul/program");
  });
});

describe("directStubBeforeLoad", () => {
  it("rewrites the path from parts, preserving query string", () => {
    const o = catchRedirect(() =>
      directStubBeforeLoad("akademik/ppdb")({
        params: { sekolah: "demo", _splat: "PPDB-0001" },
        location: { searchStr: "?tab=berkas" },
      } as never),
    );
    expect(o.href).toBe("/sch/demo/akademik/ppdb/PPDB-0001?tab=berkas");
  });
  it("targets the module root when no splat", () => {
    const o = catchRedirect(() =>
      directStubBeforeLoad("akademik/ppdb")({ params: { sekolah: "demo" }, location: { searchStr: "" } } as never),
    );
    expect(o.href).toBe("/sch/demo/akademik/ppdb");
  });
});
```

- [ ] **Step 1.2:** Run `pnpm --filter @sekolahpro/app-school test src/lib/akademikNav.test.ts src/lib/legacyRedirects.test.ts` — expect FAIL (exports missing).
- [ ] **Step 1.3: Implement `akademikNav.ts` additions** (append; existing exports untouched):

```ts
import { type NavTabGroup } from "../components/GroupedNavTabs";

/** Module roots that live inside the per-TA workspace (spec §1.2). */
export const WORKSPACE_MODULE_ROOTS = ["kelas", "jadwal", "ekskul"] as const;
export type WorkspaceModuleRoot = (typeof WORKSPACE_MODULE_ROOTS)[number];

/** Validate a `?go=` redirect target coming from a legacy-URL stub.
 * Whitelist by module root; reject anything that could escape the workspace
 * (absolute URL, empty/dot segments, encoded traversal). Returns the cleaned
 * subpath or null. */
export function parseGoParam(go: string | undefined): string | null {
  if (!go || go.startsWith("/") || go.includes("://")) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(go);
  } catch {
    return null;
  }
  const segments = decoded.split("/");
  if (segments.some((s) => s === "" || s === "." || s === "..")) return null;
  return (WORKSPACE_MODULE_ROOTS as readonly string[]).includes(segments[0]) ? go : null;
}

/** True when the pathname is inside a sub-module under the TA workspace —
 * the workspace layout then skips its own chrome (spec §1.7). */
export function isSubmodulePath(pathname: string): boolean {
  return /\/akademik\/[^/]+\/(kelas|jadwal|ekskul)(\/|$)/.test(pathname);
}

/** Nearest Tahun Ajaran starting strictly after the reference local date.
 * Compares date STRINGS (YYYY-MM-DD) — never `new Date(...)` on date-only
 * values, which parse as UTC and skew +7h in Asia/Jakarta (same rule as
 * akademikPeriode). `refDateStr` must already be a local YYYY-MM-DD string. */
export function pickNextTa<T extends { tanggal_mulai?: string }>(
  rows: T[],
  refDateStr: string,
): T | null {
  const upcoming = rows
    .filter((r) => (r.tanggal_mulai ?? "") > refDateStr)
    .sort((a, b) => String(a.tanggal_mulai).localeCompare(String(b.tanggal_mulai)));
  return upcoming[0] ?? null;
}

/** Workspace sub-nav: Pengaturan = annual setup; Penilaian + Kegiatan = the
 * spec's "Data" group split for presentation (spec §1.2 implementation note).
 * Absensi/Laporan/PPDB can't join the pill bar — their routes carry no `$ta`;
 * they link from the workspace dashboard instead (Task 9). */
export function buildWorkspaceNavGroups(): NavTabGroup[] {
  return [
    {
      label: "Ringkasan",
      items: [{ to: "/sch/$sekolah/akademik/$ta", label: "Dashboard", exact: true }],
    },
    {
      label: "Pengaturan",
      items: [
        { to: "/sch/$sekolah/akademik/$ta/kelas", label: "Kelas & Rombel" },
        { to: "/sch/$sekolah/akademik/$ta/jadwal/papan", label: "Susun Jadwal" },
        { to: "/sch/$sekolah/akademik/$ta/ekskul/program", label: "Program Ekskul" },
      ],
    },
    {
      label: "Penilaian",
      items: [
        { to: "/sch/$sekolah/akademik/$ta/asesmen", label: "Input Nilai Test" },
        { to: "/sch/$sekolah/akademik/$ta/entri-nilai", label: "Entri Nilai" },
        { to: "/sch/$sekolah/akademik/$ta/raport", label: "Raport" },
      ],
    },
    {
      label: "Kegiatan",
      items: [
        { to: "/sch/$sekolah/akademik/$ta/jadwal/agenda", label: "Agenda Jadwal" },
        { to: "/sch/$sekolah/akademik/$ta/ekskul/pendaftaran", label: "Pendaftaran Ekskul" },
        { to: "/sch/$sekolah/akademik/$ta/ekskul/sesi", label: "Sesi Ekskul" },
      ],
    },
  ];
}
```

- [ ] **Step 1.4: Implement `src/lib/legacyRedirects.ts`** (whole file):

```ts
import { redirect } from "@tanstack/react-router";

/** beforeLoad factories for legacy-URL stubs left behind by the akademik
 * single-door move (spec §1.6). Two flavours:
 * - workspaceStubBeforeLoad: target lives under /akademik/$ta — the TA isn't
 *   known at redirect time, so we route through the hub with ?go= and let it
 *   resolve the TA (Task 7 consumes it).
 * - directStubBeforeLoad: target has no $ta (PPDB) — rewrite from URL parts
 *   (never string-replace on pathname: a sekolah slug could equal the segment). */

type StubCtx = {
  params: { sekolah: string; _splat?: string };
  location: { searchStr: string };
};

export function workspaceStubBeforeLoad(root: "kelas" | "jadwal" | "ekskul") {
  return ({ params }: StubCtx): never => {
    const splat = params._splat;
    throw redirect({
      to: "/sch/$sekolah/akademik",
      params: { sekolah: params.sekolah },
      search: { go: splat ? `${root}/${splat}` : root },
      replace: true,
    });
  };
}

export function directStubBeforeLoad(newBase: string) {
  return ({ params, location }: StubCtx): never => {
    const splat = params._splat;
    const path = splat ? `/sch/${params.sekolah}/${newBase}/${splat}` : `/sch/${params.sekolah}/${newBase}`;
    throw redirect({ href: `${path}${location.searchStr ?? ""}`, replace: true });
  };
}
```

- [ ] **Step 1.5: Hub `validateSearch` passthrough** in `sch.$sekolah.akademik.index.tsx`: extend the `HubSearch` interface with `go?: string` and pass it through `validateSearch` (string check only, sanitisation stays at the consumption site in Task 7). This MUST land before any stub exists or the typed `redirect({ search: { go } })` fails tsc.
- [ ] **Step 1.6:** Run both test files → PASS. `pnpm --filter @sekolahpro/app-school test src/lib` → no regressions. Typecheck clean.
- [ ] **Step 1.7:** Commit: `feat(akademik): fondasi nav workspace, parser go, stub redirect legacy`

---

### Task 2: `$ta` workspace layout — chrome bypass + nav from lib

**Files:**
- Modify: `src/routes/sch.$sekolah.akademik.$ta.tsx`

- [ ] **Step 2.1:** Replace the inline `NAV_GROUPS` const with module-level `const NAV_GROUPS = buildWorkspaceNavGroups();` imported from `../lib/akademikNav`.
- [ ] **Step 2.2:** Chrome bypass — sub-modules keep their own `ModuleShell`:

```tsx
const submodule = isSubmodulePath(pathname);
```

  - Render: when `submodule`, return `<AkademikContextProvider value={...}><Outlet /></AkademikContextProvider>` only; otherwise the existing `ModuleShell` tree unchanged. ALL hooks stay above the conditional (rules-of-hooks).
  - Effects: the unknown-`$ta` redirect and `writeStoredPeriode` persistence stay active for sub-modules. The **semester URL-normalisation effect becomes `if (submodule) return;`** — kelas has no semester axis and ekskul/jadwal use Semester docnames, so appending `?semester=Ganjil` to their URLs is noise (reviewer finding).
- [ ] **Step 2.3:** Typecheck clean. Layout behaviour is exercised by Task 3 tests.
- [ ] **Step 2.4:** Commit: `feat(akademik): bypass chrome workspace untuk sub-modul`

---

### Task 3: Move Kelas under the workspace + stubs

**Files:**
- Rename (git mv) 7 files:

| Old (`src/routes/`) | New (`src/routes/`) |
|---|---|
| `sch.$sekolah.kelas.tsx` | `sch.$sekolah.akademik.$ta.kelas.tsx` |
| `sch.$sekolah.kelas.index.tsx` | `sch.$sekolah.akademik.$ta.kelas.index.tsx` |
| `sch.$sekolah.kelas.$kodeKelas.tsx` | `sch.$sekolah.akademik.$ta.kelas.$kodeKelas.tsx` |
| `sch.$sekolah.kelas.anggota.tsx` | `sch.$sekolah.akademik.$ta.kelas.anggota.tsx` |
| `sch.$sekolah.kelas.daftar.tsx` | `sch.$sekolah.akademik.$ta.kelas.daftar.tsx` |
| `sch.$sekolah.kelas.rombel.tsx` | `sch.$sekolah.akademik.$ta.kelas.rombel.tsx` |
| `sch.$sekolah.kelas.saya.tsx` | `sch.$sekolah.akademik.$ta.kelas.saya.tsx` |

- Create stubs: `src/routes/sch.$sekolah.kelas.index.tsx` + `src/routes/sch.$sekolah.kelas.$.tsx` (NO `sch.$sekolah.kelas.tsx` layout file — a parent beforeLoad that throws would shadow the splat; index + splat as siblings each own their redirect)
- Test: `src/routes/__tests__/legacyStubs.test.ts`

- [ ] **Step 3.1:** `git mv` each file per the table.
- [ ] **Step 3.2:** In each moved file update: the `createFileRoute("...")` id, every `useParams/useSearch/useNavigate({ from: ... })`, every intra-module `<Link to="/sch/$sekolah/kelas...">` → `/sch/$sekolah/akademik/$ta/kelas...`. Links between kelas pages inherit `$ta`; typed `Link`s passing explicit `params` add `ta` (from `useParams`).
- [ ] **Step 3.3: Period rewire (provider swap, not props).** In the new `...akademik.$ta.kelas.tsx` layout: delete the `usePeriodeSwitcher(sekolah, "kelas")` call; feed the provider from the workspace —

```tsx
const akademik = useAkademikContext();
// Kelas has no semester axis — the akademik value passes through untouched.
return <KelasPeriodProvider value={akademik}>{/* existing shell */}</KelasPeriodProvider>;
```

  - Replace the layout's TA dropdown (`StripTahun`/`taOptions` select) with a static TA badge (`akademik.tahunAjaran` label) — TA switching now happens via the hub/breadcrumb, mirroring the workspace model.
  - `useKelasReadOnly`-style gates now key off `akademik.isPastPeriod` (route-true).
  - TA-filtered pages (`daftar`, `rombel`, `anggota`): rombel queries gain/keep `{ tahun_ajaran: <context TA> }` from the provider value.
  - **Exempt pages (cross-TA by design — do NOT add a TA filter):** `index` (approval queue), `saya` (wali cockpit), `$kodeKelas` (drilldown). They render identically under any `$ta`.
- [ ] **Step 3.4: Stub files.**

`src/routes/sch.$sekolah.kelas.index.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { workspaceStubBeforeLoad } from "../lib/legacyRedirects";

/** Permanent redirect stub — /kelas moved under /akademik/$ta/kelas (spec §1.6). */
export const Route = createFileRoute("/sch/$sekolah/kelas/")({
  beforeLoad: workspaceStubBeforeLoad("kelas"),
});
```

`src/routes/sch.$sekolah.kelas.$.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { workspaceStubBeforeLoad } from "../lib/legacyRedirects";

/** Splat stub: deep links like /kelas/rombel keep working after the move. */
export const Route = createFileRoute("/sch/$sekolah/kelas/$")({
  beforeLoad: workspaceStubBeforeLoad("kelas"),
});
```

- [ ] **Step 3.5: Stub wiring tests** (`legacyStubs.test.ts`) — the factory logic is covered in Task 1; here assert each stub file wires the right factory/root:

```ts
import { describe, expect, it } from "vitest";
import { Route as KelasIndexStub } from "../sch.$sekolah.kelas.index";
import { Route as KelasSplatStub } from "../sch.$sekolah.kelas.$";

function goOf(route: { options: { beforeLoad?: (ctx: never) => unknown } }, params: Record<string, string>) {
  try {
    route.options.beforeLoad?.({ params, location: { searchStr: "" } } as never);
    return null;
  } catch (err) {
    return (err as { options: { search?: { go?: string } } }).options.search?.go ?? null;
  }
}

describe("legacy /kelas stubs", () => {
  it("index stub forwards go=kelas", () => {
    expect(goOf(KelasIndexStub, { sekolah: "demo" })).toBe("kelas");
  });
  it("splat stub carries the deep subpath", () => {
    expect(goOf(KelasSplatStub, { sekolah: "demo", _splat: "rombel" })).toBe("kelas/rombel");
  });
});
```

- [ ] **Step 3.6:** `pnpm --filter @sekolahpro/app-school generate`; run the stub tests → PASS. After generation, eyeball `routeTree.gen.ts` once to confirm the index+splat stubs are siblings (no parent layout shadowing) — the repo's first splat route.
- [ ] **Step 3.7:** External-ref sweep: `grep -rn '"/sch/\$sekolah/kelas' src/ | grep -v 'routes/sch.\$sekolah.kelas'` → update each hit to `to="/sch/$sekolah/akademik" search={{ go: "kelas..." }}` or the direct workspace path where `$ta` is in scope. Typecheck → 0.
- [ ] **Step 3.8:** Run kelas-related tests (`pnpm --filter @sekolahpro/app-school test src/components/kelas src/routes/__tests__/legacyStubs.test.ts` plus any kelas route tests) — green; update fixtures to provide the akademik context/provider value where they previously relied on `usePeriodeSwitcher` mocks.
- [ ] **Step 3.9:** Commit: `feat(akademik): pindahkan modul kelas ke workspace tahun ajaran + stub redirect`

---

### Task 4: Move Jadwal (13 files) + stubs

**Files:** rename per table; stubs `sch.$sekolah.jadwal.index.tsx` + `sch.$sekolah.jadwal.$.tsx`; extend `legacyStubs.test.ts`.

| Old | New |
|---|---|
| `sch.$sekolah.jadwal.tsx` | `sch.$sekolah.akademik.$ta.jadwal.tsx` |
| `sch.$sekolah.jadwal.index.tsx` | `sch.$sekolah.akademik.$ta.jadwal.index.tsx` |
| `sch.$sekolah.jadwal.agenda.tsx` | `sch.$sekolah.akademik.$ta.jadwal.agenda.tsx` |
| `sch.$sekolah.jadwal.daftar.tsx` | `sch.$sekolah.akademik.$ta.jadwal.daftar.tsx` |
| `sch.$sekolah.jadwal.kotak.tsx` | `sch.$sekolah.akademik.$ta.jadwal.kotak.tsx` |
| `sch.$sekolah.jadwal.override.tsx` | `sch.$sekolah.akademik.$ta.jadwal.override.tsx` |
| `sch.$sekolah.jadwal.pantauan.tsx` | `sch.$sekolah.akademik.$ta.jadwal.pantauan.tsx` |
| `sch.$sekolah.jadwal.papan.tsx` | `sch.$sekolah.akademik.$ta.jadwal.papan.tsx` |
| `sch.$sekolah.jadwal.permintaan.tsx` | `sch.$sekolah.akademik.$ta.jadwal.permintaan.tsx` |
| `sch.$sekolah.jadwal.persetujuan.tsx` | `sch.$sekolah.akademik.$ta.jadwal.persetujuan.tsx` |
| `sch.$sekolah.jadwal.slot-override.tsx` | `sch.$sekolah.akademik.$ta.jadwal.slot-override.tsx` |
| `sch.$sekolah.jadwal.slot.tsx` | `sch.$sekolah.akademik.$ta.jadwal.slot.tsx` |
| `sch.$sekolah.jadwal.slot.$name.tsx` | `sch.$sekolah.akademik.$ta.jadwal.slot.$name.tsx` |

- [ ] **Step 4.1:** `git mv` per table; route ids, `from:` paths, intra-module `Link`s (Step 3.2 mechanics).
- [ ] **Step 4.2: Period rewire with local Semester docs.** In the new jadwal layout: delete `usePeriodeSwitcher(sekolah, "jadwal")`; build the provider value from the workspace TA + a local Semester-document resolver:

```tsx
const akademik = useAkademikContext();
// Jadwal filters by Semester DOCNAMES (SEM-####) — akademik.semester is
// "Ganjil"/"Genap", a different value space. Resolve Semester docs for this TA
// locally and keep the existing semester dropdown.
const semQ = useResourceList<{ name: string; nama?: string }>("Semester", {
  filters: { tahun_ajaran: akademik.tahunAjaran },
  limit_page_length: 0,
});
const semOptions = semQ.data ?? [];
const [semesterDoc, setSemesterDoc] = useState<string>("");
useEffect(() => {
  if (!semesterDoc && semOptions.length > 0) setSemesterDoc(semOptions[0].name);
}, [semOptions, semesterDoc]);

const value = useMemo(
  () => ({
    ...akademik,
    semester: semesterDoc,
    setSemester: setSemesterDoc,
  }),
  [akademik, semesterDoc],
);
return <JadwalPeriodProvider value={value}>{/* existing shell */}</JadwalPeriodProvider>;
```

  (Adapt the exact default-semester pick to what `usePeriodeSwitcher` did — read `lib/periodeSwitcher.ts` first and preserve its active-semester preference if it has one. TA dropdown in the jadwal bar → static badge, same as Task 3.3.)
  - Pages querying `Jadwal Pelajaran` filter `{ tahun_ajaran: akademik.tahunAjaran }` via the provider (verify each `is_current`/switcher site from Step 0.2).
  - Permintaan/kotak/persetujuan flows: check whether `Permintaan Jadwal` carries a TA field; if not, they are TA-agnostic — leave their queries unfiltered (record in the commit message which pages were exempted).
- [ ] **Step 4.3:** Stubs — same two-file shape as Step 3.4 with route ids `/sch/$sekolah/jadwal/` + `/sch/$sekolah/jadwal/$` and `workspaceStubBeforeLoad("jadwal")`. Add 2 wiring cases to `legacyStubs.test.ts` (deep case `_splat: "papan"` → `"jadwal/papan"`).
- [ ] **Step 4.4:** `pnpm --filter @sekolahpro/app-school generate`; sweep `grep -rn '"/sch/\$sekolah/jadwal' src/ | grep -v 'routes/sch.\$sekolah.jadwal'`; typecheck 0; jadwal tests green (mirror Step 3.8 fixture note — switcher mocks → provider values; URL assertions must not expect `?semester=`).
- [ ] **Step 4.5:** Commit: `feat(akademik): pindahkan modul jadwal ke workspace tahun ajaran + stub redirect`

---

### Task 5: Move Ekstrakurikuler (8 files, segment → `ekskul`) + context rewire + stubs

**Files:** rename per table; stubs `sch.$sekolah.ekstrakurikuler.index.tsx` + `.$.tsx`.

| Old | New |
|---|---|
| `sch.$sekolah.ekstrakurikuler.tsx` | `sch.$sekolah.akademik.$ta.ekskul.tsx` |
| `sch.$sekolah.ekstrakurikuler.index.tsx` | `sch.$sekolah.akademik.$ta.ekskul.index.tsx` |
| `sch.$sekolah.ekstrakurikuler.mitra.index.tsx` | `sch.$sekolah.akademik.$ta.ekskul.mitra.index.tsx` |
| `sch.$sekolah.ekstrakurikuler.pendaftaran.index.tsx` | `sch.$sekolah.akademik.$ta.ekskul.pendaftaran.index.tsx` |
| `sch.$sekolah.ekstrakurikuler.program.index.tsx` | `sch.$sekolah.akademik.$ta.ekskul.program.index.tsx` |
| `sch.$sekolah.ekstrakurikuler.raport.index.tsx` | `sch.$sekolah.akademik.$ta.ekskul.raport.index.tsx` |
| `sch.$sekolah.ekstrakurikuler.sesi.index.tsx` | `sch.$sekolah.akademik.$ta.ekskul.sesi.index.tsx` |
| `sch.$sekolah.ekstrakurikuler.sesi.$id.tsx` | `sch.$sekolah.akademik.$ta.ekskul.sesi.$id.tsx` |

- [ ] **Step 5.1:** `git mv` + route id/from/Link updates (URL segment changes `ekstrakurikuler` → `ekskul` everywhere in the new ids).
- [ ] **Step 5.2: Context rewire.** Same pattern as Task 4.2 — `EkskulContextProvider` stays (children untouched); value = `{ ...useAkademikContext(), semester: <local Semester docname>, setSemester: <local setter> }` with the Semester docs fetched by `tahun_ajaran`. The ekskul bar's TA `SearchableSelect` (`taOptions`) is removed → static TA badge; the semester `SearchableSelect` stays, backed by the local `semOptions`. Sesi auto-create keeps receiving a valid Semester docname (the reviewer's LinkValidationError scenario is the regression test: creating a Sesi from the workspace must succeed).
- [ ] **Step 5.3:** Stubs at the OLD segment: route ids `/sch/$sekolah/ekstrakurikuler/` + `/sch/$sekolah/ekstrakurikuler/$`, both `workspaceStubBeforeLoad("ekskul")` — `go` uses the NEW segment. 2 wiring cases (deep: `_splat: "program"` → `"ekskul/program"`).
- [ ] **Step 5.4:** Generate; sweep `grep -rn '"/sch/\$sekolah/ekstrakurikuler' src/ | grep -v 'routes/sch.\$sekolah.ekstrakurikuler'`; typecheck 0; ekskul tests green (PageGuide storageIds `ekskul-*` unchanged).
- [ ] **Step 5.5:** Commit: `feat(akademik): pindahkan ekstrakurikuler ke workspace tahun ajaran + rewire konteks`

---

### Task 6: Move PPDB under `/akademik/ppdb` (no `$ta`) + stubs

**Files:** rename per table; stubs `sch.$sekolah.ppdb.index.tsx` + `sch.$sekolah.ppdb.$.tsx`.

| Old | New |
|---|---|
| `sch.$sekolah.ppdb.tsx` | `sch.$sekolah.akademik.ppdb.tsx` |
| `sch.$sekolah.ppdb.index.tsx` | `sch.$sekolah.akademik.ppdb.index.tsx` |
| `sch.$sekolah.ppdb.$noPendaftaran.tsx` | `sch.$sekolah.akademik.ppdb.$noPendaftaran.tsx` |
| `sch.$sekolah.ppdb.buat.tsx` | `sch.$sekolah.akademik.ppdb.buat.tsx` |
| `sch.$sekolah.ppdb.calon-siswa.tsx` | `sch.$sekolah.akademik.ppdb.calon-siswa.tsx` |
| `sch.$sekolah.ppdb.daftar-ulang.tsx` | `sch.$sekolah.akademik.ppdb.daftar-ulang.tsx` |
| `sch.$sekolah.ppdb.daftar.tsx` | `sch.$sekolah.akademik.ppdb.daftar.tsx` |
| `sch.$sekolah.ppdb.gelombang.tsx` | `sch.$sekolah.akademik.ppdb.gelombang.tsx` |
| `sch.$sekolah.ppdb.pembayaran.tsx` | `sch.$sekolah.akademik.ppdb.pembayaran.tsx` |
| `sch.$sekolah.ppdb.pengaturan.tsx` | `sch.$sekolah.akademik.ppdb.pengaturan.tsx` |
| `sch.$sekolah.ppdb.seleksi.tsx` | `sch.$sekolah.akademik.ppdb.seleksi.tsx` |

- [ ] **Step 6.1:** `git mv` + route id/from/Link updates. PPDB keeps its own `ModuleShell` and its own TA handling (targets the NEXT intake year — do NOT wire to `useAkademikContext`); it nests under the plain `akademik` passthrough layout, not `$ta`.
- [ ] **Step 6.2:** Stubs use the direct factory (no TA to resolve; query strings survive):

```tsx
// sch.$sekolah.ppdb.index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { directStubBeforeLoad } from "../lib/legacyRedirects";

/** Permanent redirect stub — /ppdb moved to /akademik/ppdb (spec §1.4). */
export const Route = createFileRoute("/sch/$sekolah/ppdb/")({
  beforeLoad: directStubBeforeLoad("akademik/ppdb"),
});

// sch.$sekolah.ppdb.$.tsx — same import/factory:
export const Route = createFileRoute("/sch/$sekolah/ppdb/$")({
  beforeLoad: directStubBeforeLoad("akademik/ppdb"),
});
```

Add 2 wiring cases to `legacyStubs.test.ts` (exact → href `/sch/demo/akademik/ppdb`; deep `_splat: "PPDB-0001"` + `searchStr: "?tab=berkas"` → href with subpath + query).

- [ ] **Step 6.3:** Generate; sweep `grep -rn '"/sch/\$sekolah/ppdb' src/ | grep -v 'routes/sch.\$sekolah.ppdb'` (expect dashboard/beranda quick links, siswa flows) → point at `/sch/$sekolah/akademik/ppdb...`; typecheck 0; ppdb tests green (storageIds `ppdb-*` unchanged).
- [ ] **Step 6.4:** Commit: `feat(akademik): pindahkan ppdb ke bawah akademik + stub redirect`

---

### Task 7: Hub — consume `?go=`, PPDB card

**Files:**
- Modify: `src/routes/sch.$sekolah.akademik.index.tsx`
- Test: hub's existing test file, or create `src/routes/__tests__/akademikHub.test.tsx` (RTL: `afterEach(cleanup)`)

- [ ] **Step 7.1: Failing tests.** (a) with `search.go = "kelas/rombel"` and a resolvable TA, the hub forwards to `/sch/demo/akademik/<encoded-ta>/kelas/rombel` (assert the `navigate`/`href` call — mock the router hooks per the repo's route-test convention); invalid `go` ("keuangan") falls back to the workspace root. (b) PPDB card: with an upcoming TA and N tagged pendaftar, shows the count; with zero TA-tagged rows but >0 total, shows the card WITHOUT a count badge (optional-field honesty — reviewer finding); always links to `/sch/$sekolah/akademik/ppdb`.
- [ ] **Step 7.2: Implement.**
  - Forwarding: where the hub currently auto-redirects (`pickAutoRedirectTa` effect) and where TA pick-links navigate, append the sanitised subpath: `const go = parseGoParam(search.go)`; if set, navigate with `href` built as `` `/sch/${encodeURIComponent(sekolah)}/akademik/${taPath(target)}/${go}` `` (typed `to` can't template arbitrary children); else the existing workspace-root navigation. Pick-links (`?pick=1` state) carry `go` through their `search` so a user who must choose a TA still lands on the requested page.
  - PPDB card: `pickNextTa(taList, <local YYYY-MM-DD of today>)`; count via `useResourceList("Pendaftaran PPDB", { filters: { tahun_ajaran: nextTa.name }, limit_page_length: 0 })`; suppress the numeric badge when that count is 0; card always renders with `Link` → `/sch/$sekolah/akademik/ppdb`. Reuse the hub's existing card components (`SectionCard`/stat patterns) — no new visual primitives.
- [ ] **Step 7.3:** Hub tests PASS; typecheck 0.
- [ ] **Step 7.4:** Commit: `feat(akademik): hub meneruskan tujuan go + kartu ppdb tahun ajaran berikutnya`

---

### Task 8: Sidebar + role map → lib extraction

**Files:**
- Create: `src/lib/menuGating.ts` (move `ROLE_MENU_MAP` + `canSee` out of `__root.tsx` — repo pattern is lib extraction, and `__root.tsx` is already god-file-sized; do NOT export internals from the route file)
- Modify: `src/routes/__root.tsx`
- Test: `src/lib/menuGating.test.ts`

- [ ] **Step 8.1: Failing tests** (`menuGating.test.ts`): operator can see `/akademik` and `/absensi` but not `/kelas`-as-door; bendahara sees `/akademik`; no role resolves a sidebar "Koperasi" item (assert via `canSee("/koperasi", ...)` still true for petugas_koperasi — the `/pilih` cards depend on the role mapping — while the SIDEBAR list no longer contains it; test the exported `ROLE_MENU_MAP` keys directly).
- [ ] **Step 8.2:** Move `ROLE_MENU_MAP` + `canSee` verbatim into `src/lib/menuGating.ts` (doc comment: sidebar visibility gating, NOT a security boundary — backend permissions are authoritative). Add `"/akademik"` to **operator** and **bendahara** role lists (they lose their only doors to kelas/jadwal/ekskul/ppdb otherwise — spec §1.6). Keep `"/koperasi"` entries (kop shell + `/pilih` cards still key off them). `__root.tsx` imports both.
- [ ] **Step 8.3:** Delete from `rawSections`: `mk("/kelas", ...)`, `mk("/ekstrakurikuler", ...)`, `mk("/jadwal", ...)`, `mk("/ppdb", ...)`, and the `koperasiCrossLink` const + its usage. Resulting sections: Utama = Dashboard/Siswa/Guru & Staff; Akademik = Akademik/Absensi; Layanan = Perpustakaan.
- [ ] **Step 8.4:** Tests PASS; typecheck 0; any existing `__root`/sidebar tests updated.
- [ ] **Step 8.5:** Commit: `feat(sidebar): satu pintu akademik, hapus tautan silang koperasi`

---

### Task 9: Workspace dashboard links (PPDB, Absensi, Laporan)

**Files:**
- Modify: `src/routes/sch.$sekolah.akademik.$ta.index.tsx` (workspace dashboard)

- [ ] **Step 9.1:** Add a "Tautan modul" `SectionCard` with three link-outs (none can join the pill bar — their routes carry no `$ta`):
  - **PPDB** → `/sch/$sekolah/akademik/ppdb` — required here because the hub auto-redirects past itself into the workspace, which otherwise has no PPDB path (reviewer finding).
  - **Absensi** → `/sch/$sekolah/absensi` (caption: "pintu sendiri sampai Fase 2").
  - **Laporan TA ini** → `/sch/$sekolah/laporan`. Plain link; prefiltering Pusat Lapor by TA is deferred until the Report Center lands (documented spec deviation).
- [ ] **Step 9.2:** Typecheck + dashboard test file (getByText on the three link labels; don't reuse the exact link text inside any PageGuide copy — bug-032).
- [ ] **Step 9.3:** Commit: `feat(akademik): tautan ppdb, absensi, laporan di dasbor workspace`

---

### Task 10: Full gates + docs

- [ ] **Step 10.1:** Ref sweep — ZERO hits outside stub files:

```bash
grep -rnE '"/sch/\$sekolah/(kelas|jadwal|ekstrakurikuler|ppdb)[/"]' src/ --include="*.ts*" \
  | grep -vE 'routes/sch\.\$sekolah\.(kelas|jadwal|ekstrakurikuler|ppdb)\.(index\.tsx|\$\.tsx)'
```

- [ ] **Step 10.2:** `pnpm --filter @sekolahpro/app-school generate && pnpm --filter @sekolahpro/app-school typecheck` → 0 errors (retry on exit 137 — OOM from concurrent worktrees, not a type error; never run two tsc at once; `pkill -9 -f typescript/bin/tsc` if orphaned).
- [ ] **Step 10.3:** `pnpm --filter @sekolahpro/app-school lint` → 0 (watch rules-of-hooks on the Task 2 conditional).
- [ ] **Step 10.4:** `pnpm --filter @sekolahpro/app-school test` → all green (baseline ~1059+; fix every failure, no skips).
- [ ] **Step 10.5:** `pnpm --filter @sekolahpro/app-school build` → ok.
- [ ] **Step 10.6:** Update docs: akademik/kelas/jadwal/ekskul/ppdb domain READMEs (routes moved, nav model, stub URLs), `docs/implementation-tracker.md` row, spec status → "Fase 1 implemented".
- [ ] **Step 10.7:** Commit docs: `docs(akademik): perbarui rute satu pintu akademik fase 1` — push branch + open PR (template filled, link spec + this plan). Never push to main directly.

---

## Review-findings ledger (all addressed in v2)

System Analyst: 1 semester value-space → ground-truth section + Tasks 4.2/5.2; 2 stub shadowing → index+splat siblings, no layout stub; 3 kelas/jadwal provider rewire → Tasks 3.3/4.2; 4 inventory grep → Step 0.2 pattern; 5 cross-TA exemptions → ground-truth + Task 3.3; 6 PPDB reachability → Task 9.1; 7 `go` ordering → Step 1.5; 8 PPDB count honesty → Task 7.2; 9 local-date compare → `pickNextTa` string compare; 10 semester-effect gating → Step 2.2 (TA-switch same-pathname: dropped with the dropdowns themselves).

Code Reviewer: 1 stub architecture → same fix; 2 `go` validateSearch ordering → Step 1.5; 3 package-filter no-op → command block in header; 4 ekskul bar contradiction → Task 5.2 (TA badge + local semester select); 5 value-plumbing duplication → spread + semester override only (kelas: straight passthrough); 6 stub DRY → `lib/legacyRedirects.ts` factories; 7 ppdb replace-collision → parts-built href; 8 spec label deviation → spec §1.2 implementation note (updated); 9 `workspaceSubLabel` dead ext → dropped; 10 ROLE_MENU_MAP export → `lib/menuGating.ts`; 11 sub-module URL assertions → Steps 4.4/3.8 notes; 12 `parseGoParam` hardening → segment checks.

## Self-review checklist (run after Task 10)

- Spec §1.1–§1.7 map: 1.1→T8, 1.2→T1/T2/T9, 1.3→T3.3/T4.2/T5.2 (+ exemption list), 1.4→T6/T7, 1.5→T8.3, 1.6→T3–T6 stubs + T10.1, 1.7→T2/T5.2.
- No moved page resolves its own TA via `usePeriodeSwitcher`/stored periode (Step 0.2 list crossed off or exempted).
- Quality rules: no fn > 40 lines, constants named, every new function doc-commented.
