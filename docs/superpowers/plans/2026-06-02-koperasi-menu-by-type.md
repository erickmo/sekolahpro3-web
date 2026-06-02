# Koperasi Menu by Type — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the koperasi sidebar adapt to the cooperative's type — Konvensional vs Syariah (BMT) — hiding/showing items and swapping labels accordingly.

**Architecture:** Declarative `mode` tags on the existing `KOPERASI_NAV` data, a pure `filterKoperasiNav(nav, isSyariah)` filter (the unit-test seam), and a thin `useKoperasiMode()` hook that reads the backend `Pengaturan Koperasi` Single doctype. `__root.tsx` wires the hook into the existing sidebar map. One new read-only route (`Suku Bunga`) for the Konvensional-only entry.

**Tech Stack:** React 18, TanStack Router, react-query via `@sekolahpro/api-client`, vitest. Package `@sekolahpro/app-school` (`apps/school`).

---

## Setup (once, before Task 1)

Worktree is at `.worktrees/koperasi-menu-by-type` on branch `feat/koperasi-menu-by-type`.

- [ ] **S1: Install deps in the worktree**

Run from worktree root:
```bash
pnpm install
```
If it errors (shared store / concurrent run), fall back to the worktree recipe: symlink `node_modules` from the main checkout and copy `apps/school/src/routeTree.gen.ts` from main.

- [ ] **S2: Baseline test run**

```bash
cd apps/school && pnpm test
```
Expected: existing suite passes (baseline green). Note the count.

---

## File Structure

| File | Responsibility |
|---|---|
| `apps/school/src/lib/koperasi-nav.ts` | nav data + types (add `mode`, `labelKonvensional`; retag items; rename section; move SHU) |
| `apps/school/src/lib/koperasi/filterKoperasiNav.ts` | pure filter — the test seam |
| `apps/school/src/lib/koperasi/filterKoperasiNav.test.ts` | unit tests for the filter |
| `apps/school/src/lib/koperasi/useKoperasiMode.ts` | `deriveIsSyariah` pure helper + `useKoperasiMode` hook |
| `apps/school/src/lib/koperasi/useKoperasiMode.test.ts` | unit tests for `deriveIsSyariah` |
| `apps/school/src/routes/__root.tsx` | wire hook + filter into kop sidebar |
| `apps/school/src/routes/kop.$sekolah.suku-bunga.tsx` | new read-only Suku Bunga page |
| `apps/school/src/routeTree.gen.ts` | auto-generated on build/dev (do not hand-edit) |

---

### Task 1: Extend nav model + retag KOPERASI_NAV

**Files:**
- Modify: `apps/school/src/lib/koperasi-nav.ts`

No test gate (pure data change; validated by Task 2's filter tests).

- [ ] **Step 1: Add types**

Replace the two interfaces (lines 8–17) with:

```ts
export type KoperasiMode = "syariah" | "konvensional";

export interface KoperasiNavItem {
  /** Suffix bare relatif `/kop/$sekolah` (mis. "/daftar", "/" untuk dashboard). */
  to: string;
  label: string;
  /** Hanya tampil untuk mode ini; absen = kedua mode. */
  mode?: KoperasiMode;
  /** Label alternatif saat mode konvensional (mis. "Akad" → "Pinjaman"). */
  labelKonvensional?: string;
}

export interface KoperasiNavSection {
  title: string;
  items: KoperasiNavItem[];
  /** Section hanya tampil untuk mode ini; absen = kedua mode. */
  mode?: KoperasiMode;
}
```

- [ ] **Step 2: Retag Pembiayaan section**

Replace the `Pembiayaan` section (lines 42–48) with:

```ts
  {
    title: "Pembiayaan",
    items: [
      { to: "/pembiayaan", label: "Akad", labelKonvensional: "Pinjaman" },
      { to: "/angsuran", label: "Angsuran" },
      { to: "/suku-bunga", label: "Suku Bunga", mode: "konvensional" },
    ],
  },
```

- [ ] **Step 3: Rename Sosial → Baitul Maal (syariah-only), move SHU to Admin**

Replace the `Sosial` section (lines 49–56) with:

```ts
  {
    title: "Baitul Maal",
    mode: "syariah",
    items: [
      { to: "/zis", label: "ZIS" },
      { to: "/wakaf", label: "Wakaf" },
    ],
  },
```

Then add SHU into the `Admin` section items (so both modes keep it). The Admin section items become:

```ts
    items: [
      { to: "/persetujuan", label: "Persetujuan" },
      { to: "/period-close", label: "Period Close" },
      { to: "/shu", label: "SHU" },
      { to: "/ppatk", label: "PPATK" },
      { to: "/laporan", label: "Laporan" },
      { to: "/pengaturan", label: "Pengaturan" },
    ],
```

- [ ] **Step 4: Typecheck**

```bash
cd apps/school && pnpm typecheck
```
Expected: PASS (data + types only).

- [ ] **Step 5: Commit**

```bash
git add apps/school/src/lib/koperasi-nav.ts
git commit -m "feat(koperasi): tag menu nav per mode + pindah SHU ke Admin"
```

---

### Task 2: Pure filter `filterKoperasiNav`

**Files:**
- Create: `apps/school/src/lib/koperasi/filterKoperasiNav.ts`
- Test: `apps/school/src/lib/koperasi/filterKoperasiNav.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/school/src/lib/koperasi/filterKoperasiNav.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { KOPERASI_NAV, type KoperasiNavSection } from "../koperasi-nav";
import { filterKoperasiNav } from "./filterKoperasiNav";

function titles(sections: KoperasiNavSection[]): string[] {
  return sections.map((s) => s.title);
}
function itemLabels(sections: KoperasiNavSection[], title: string): string[] {
  return sections.find((s) => s.title === title)?.items.map((i) => i.label) ?? [];
}

describe("filterKoperasiNav", () => {
  it("syariah: Baitul Maal (ZIS+Wakaf), Akad label, no Suku Bunga, SHU in Admin", () => {
    const out = filterKoperasiNav(KOPERASI_NAV, true);
    expect(titles(out)).toContain("Baitul Maal");
    expect(itemLabels(out, "Baitul Maal")).toEqual(["ZIS", "Wakaf"]);
    expect(itemLabels(out, "Pembiayaan")).toContain("Akad");
    expect(itemLabels(out, "Pembiayaan")).not.toContain("Suku Bunga");
    expect(itemLabels(out, "Admin")).toContain("SHU");
  });

  it("konvensional: no Baitul Maal, Pinjaman label, Suku Bunga present, SHU in Admin", () => {
    const out = filterKoperasiNav(KOPERASI_NAV, false);
    expect(titles(out)).not.toContain("Baitul Maal");
    expect(itemLabels(out, "Pembiayaan")).toContain("Pinjaman");
    expect(itemLabels(out, "Pembiayaan")).not.toContain("Akad");
    expect(itemLabels(out, "Pembiayaan")).toContain("Suku Bunga");
    expect(itemLabels(out, "Admin")).toContain("SHU");
  });

  it("drops a section emptied by item filtering", () => {
    const out = filterKoperasiNav(
      [{ title: "X", items: [{ to: "/a", label: "A", mode: "syariah" }] }],
      false,
    );
    expect(titles(out)).not.toContain("X");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/school && pnpm test src/lib/koperasi/filterKoperasiNav.test.ts
```
Expected: FAIL — `filterKoperasiNav` not found / module missing.

- [ ] **Step 3: Write the implementation**

Create `apps/school/src/lib/koperasi/filterKoperasiNav.ts`:

```ts
// Filter murni: petakan KOPERASI_NAV ke menu sesuai jenis koperasi.
// - Section/item ber-`mode` hanya tampil bila cocok dengan mode aktif.
// - Item ber-`labelKonvensional` memakai label itu saat mode konvensional.
// - Section yang kosong setelah filter item dibuang.
import type { KoperasiMode, KoperasiNavSection } from "../koperasi-nav";

/**
 * Saring sections sidebar koperasi menurut mode (syariah vs konvensional).
 * @param sections daftar section mentah (KOPERASI_NAV)
 * @param isSyariah true untuk BMT/syariah, false untuk konvensional
 * @returns sections terfilter dengan label sudah disesuaikan
 */
export function filterKoperasiNav(
  sections: KoperasiNavSection[],
  isSyariah: boolean,
): KoperasiNavSection[] {
  const mode: KoperasiMode = isSyariah ? "syariah" : "konvensional";
  return sections
    .filter((s) => !s.mode || s.mode === mode)
    .map((s) => ({
      ...s,
      items: s.items
        .filter((it) => !it.mode || it.mode === mode)
        .map((it) =>
          !isSyariah && it.labelKonvensional
            ? { ...it, label: it.labelKonvensional }
            : it,
        ),
    }))
    .filter((s) => s.items.length > 0);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/school && pnpm test src/lib/koperasi/filterKoperasiNav.test.ts
```
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/school/src/lib/koperasi/filterKoperasiNav.ts apps/school/src/lib/koperasi/filterKoperasiNav.test.ts
git commit -m "feat(koperasi): filter murni filterKoperasiNav per mode"
```

---

### Task 3: `useKoperasiMode` hook + `deriveIsSyariah`

**Files:**
- Create: `apps/school/src/lib/koperasi/useKoperasiMode.ts`
- Test: `apps/school/src/lib/koperasi/useKoperasiMode.test.ts`

Logic lives in the pure `deriveIsSyariah` (unit-tested); the hook is a thin react-query wrapper.

- [ ] **Step 1: Write the failing test**

Create `apps/school/src/lib/koperasi/useKoperasiMode.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { deriveIsSyariah } from "./useKoperasiMode";

describe("deriveIsSyariah", () => {
  it("Syariah (BMT) → true", () => expect(deriveIsSyariah("Syariah (BMT)")).toBe(true));
  it("Konvensional → false", () => expect(deriveIsSyariah("Konvensional")).toBe(false));
  it("undefined → true (superset fallback)", () => expect(deriveIsSyariah(undefined)).toBe(true));
  it("empty/unknown → true (superset fallback)", () => expect(deriveIsSyariah("")).toBe(true));
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/school && pnpm test src/lib/koperasi/useKoperasiMode.test.ts
```
Expected: FAIL — module / `deriveIsSyariah` not found.

- [ ] **Step 3: Write the implementation**

Create `apps/school/src/lib/koperasi/useKoperasiMode.ts`:

```ts
// Baca jenis koperasi (Konvensional vs Syariah/BMT) dari singleton backend
// `Pengaturan Koperasi` (field mode_koperasi). Dipakai untuk menyesuaikan menu.
import { useResourceDoc } from "@sekolahpro/api-client";

/** Nilai mode_koperasi backend untuk koperasi konvensional. */
export const MODE_KONVENSIONAL = "Konvensional";
/** Nilai mode_koperasi backend untuk koperasi syariah (BMT). */
export const MODE_SYARIAH = "Syariah (BMT)";

const PENGATURAN_KOPERASI = "Pengaturan Koperasi";

interface PengaturanKoperasiDoc {
  mode_koperasi?: string;
}

/**
 * Turunkan flag syariah dari nilai mode_koperasi.
 * Hanya nilai eksplisit "Konvensional" yang dianggap konvensional; selainnya
 * (undefined/unknown/loading) → true (superset) supaya BMT tak pernah
 * kehilangan menu ZIS/Wakaf sebelum data termuat.
 * @param mode nilai mentah field mode_koperasi
 */
export function deriveIsSyariah(mode: string | undefined): boolean {
  return mode !== MODE_KONVENSIONAL;
}

/**
 * Hook: baca mode koperasi dari singleton Pengaturan Koperasi.
 * @param enabled false mematikan fetch (mis. di luar shell /kop)
 * @returns isSyariah (dengan fallback superset) + isLoading
 */
export function useKoperasiMode(enabled: boolean): { isSyariah: boolean; isLoading: boolean } {
  const q = useResourceDoc<PengaturanKoperasiDoc>(
    PENGATURAN_KOPERASI,
    PENGATURAN_KOPERASI,
    { enabled },
  );
  return { isSyariah: deriveIsSyariah(q.data?.mode_koperasi), isLoading: q.isLoading };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/school && pnpm test src/lib/koperasi/useKoperasiMode.test.ts
```
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/school/src/lib/koperasi/useKoperasiMode.ts apps/school/src/lib/koperasi/useKoperasiMode.test.ts
git commit -m "feat(koperasi): hook useKoperasiMode baca mode_koperasi singleton"
```

---

### Task 4: Wire into `__root.tsx` sidebar

**Files:**
- Modify: `apps/school/src/routes/__root.tsx` (imports; line ~463 add hook; line ~492 icon key; lines 496–499 map)

No new unit test (render-layer glue; covered by typecheck + Task 2 logic test). Verify by typecheck.

- [ ] **Step 1: Add imports**

Near the other `../lib/...` imports at the top of `__root.tsx`, add:

```ts
import { filterKoperasiNav } from "../lib/koperasi/filterKoperasiNav";
import { useKoperasiMode } from "../lib/koperasi/useKoperasiMode";
```

(`KOPERASI_NAV` is already imported — leave it.)

- [ ] **Step 2: Call the hook**

Directly after `const isKop = pathname.startsWith("/kop/");` (line ~463), add:

```ts
  const { isSyariah } = useKoperasiMode(isKop);
```

- [ ] **Step 3: Add Baitul Maal icon, drop Sosial key**

In `KOP_SECTION_ICON` (lines 487–494) replace the `Sosial` entry with `Baitul Maal`:

```ts
    "Baitul Maal": <IconCheck />,
```

(SHU now lives under Admin → `IconSettings`, already covered.)

- [ ] **Step 4: Apply the filter in the map**

Replace `kopSections` (lines 496–499) with:

```ts
  const kopSections: SidebarNavSection[] = filterKoperasiNav(KOPERASI_NAV, isSyariah).map((s) => ({
    title: s.title,
    items: s.items.map((it) => mkKop(it.to, it.label, KOP_SECTION_ICON[s.title] ?? <IconWallet />)),
  }));
```

- [ ] **Step 5: Typecheck**

```bash
cd apps/school && pnpm typecheck
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/school/src/routes/__root.tsx
git commit -m "feat(koperasi): sidebar koperasi mengikuti jenis koperasi"
```

---

### Task 5: New read-only `Suku Bunga` page

**Files:**
- Create: `apps/school/src/routes/kop.$sekolah.suku-bunga.tsx`
- Auto: `apps/school/src/routeTree.gen.ts` (regenerated by the router plugin)

- [ ] **Step 1: Confirm `ResourceListPage` props are optional**

Open `apps/school/src/components/ResourceListPage.tsx` and confirm `onAdd`, `addLabel`, and `selectFilters` are optional props (the `zis` route passes them, this page omits them). If `onAdd` is required, the page below must add a no-op — but expect optional.

- [ ] **Step 2: Create the route**

Create `apps/school/src/routes/kop.$sekolah.suku-bunga.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = {
  name: string;
  nama_produk: string;
  mode: string;
  margin_pa?: number;
  skema_angsuran?: string;
  maksimal_tenor?: number;
};

const COLUMNS: Column<Row>[] = [
  { key: "nama_produk", header: "Produk", sortable: true, cell: (r) => r.nama_produk },
  { key: "mode", header: "Mode", cell: (r) => <Badge tone="neutral">{r.mode}</Badge> },
  { key: "margin_pa", header: "Bunga/Margin p.a.", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums">{r.margin_pa != null ? `${r.margin_pa}%` : "—"}</span> },
  { key: "skema_angsuran", header: "Skema", cell: (r) => r.skema_angsuran ?? "—" },
  { key: "maksimal_tenor", header: "Tenor maks (bln)", align: "right",
    cell: (r) => (r.maksimal_tenor != null ? String(r.maksimal_tenor) : "—") },
];

function SukuBungaPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Koperasi"
      title="Suku Bunga"
      description="Daftar suku bunga / margin produk pembiayaan koperasi konvensional."
      doctype="Produk Pembiayaan"
      fields={["name", "nama_produk", "mode", "margin_pa", "skema_angsuran", "maksimal_tenor"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "nama_produk", dir: "asc" }}
      searchFields={["name", "nama_produk"]}
    />
  );
}

export const Route = createFileRoute("/kop/$sekolah/suku-bunga")({ component: SukuBungaPage });
```

- [ ] **Step 3: Regenerate the route tree**

The TanStack router plugin regenerates `routeTree.gen.ts` on dev/build. Trigger it:
```bash
cd apps/school && pnpm build
```
Expected: build succeeds; `routeTree.gen.ts` now includes the `suku-bunga` route. (If only typecheck is run without regen, the route reference will error — the build step is required here.)

- [ ] **Step 4: Commit**

```bash
git add apps/school/src/routes/kop.$sekolah.suku-bunga.tsx apps/school/src/routeTree.gen.ts
git commit -m "feat(koperasi): halaman Suku Bunga (read-only) khusus konvensional"
```

---

### Task 6: Full verification + docs

- [ ] **Step 1: Full test suite**

```bash
cd apps/school && pnpm test
```
Expected: all pass (baseline count + 7 new: 3 filter + 4 deriveIsSyariah).

- [ ] **Step 2: Typecheck**

```bash
cd apps/school && pnpm typecheck
```
Expected: PASS.

- [ ] **Step 3: Lint**

```bash
cd apps/school && pnpm lint
```
Expected: 0 errors on the touched files. Fix any.

- [ ] **Step 4: Update OpenWolf anatomy + memory**

Append the new files to `.wolf/anatomy.md` and a one-line entry to `.wolf/memory.md` (per project rules).

- [ ] **Step 5: Final commit (if docs changed)**

```bash
git add .wolf/anatomy.md .wolf/memory.md
git commit -m "docs(koperasi): catat menu adaptif per jenis koperasi di anatomy"
```

---

## Self-Review (done)

- **Spec coverage:** Baitul Maal BMT-only (Task 1/2), SHU→Admin both (Task 1/2), Akad→Pinjaman swap (Task 1/2), Suku Bunga konvensional-only page (Task 1/5), type source via singleton w/ superset fallback (Task 3), render wiring (Task 4). All spec sections mapped.
- **Placeholder scan:** none — every code step has full code, every command has expected output.
- **Type consistency:** `KoperasiMode`/`KoperasiNavItem`/`KoperasiNavSection` defined Task 1, used unchanged in Tasks 2/4; `filterKoperasiNav(sections, isSyariah)` and `useKoperasiMode(enabled)`/`deriveIsSyariah(mode)` signatures consistent across tasks and tests.
