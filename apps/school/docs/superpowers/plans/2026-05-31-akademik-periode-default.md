# Default & Hardening Periode Akademik — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Periode Akademik (Tahun Ajaran + Semester) terpilih otomatis ke TA aktif saat masuk, persist antar-sesi, tampil jelas, dan aman dari input ke periode salah.

**Architecture:** Modul pure `akademikPeriode.ts` meresolusi periode dari (URL → localStorage → is_current → status Aktif+window → terbaru) dan menghitung semester dari window tanggal. Layout Akademik menjalankan resolusi, redirect URL agar ter-isi, lalu menyalurkan periode + flag keamanan via React context. `AkademikContextBar` menampilkan periode terpilih + banner peringatan + nudge, dan menjaga perpindahan periode saat ada edit belum tersimpan.

**Tech Stack:** React + TanStack Router (file routes, search params), `@sekolahpro/api-client` (`listResource`/`useResourceList`), `@sekolahpro/ui` (`SearchableSelect`, `SetupBanner`), Vitest + Testing Library.

---

## File Structure

| File | Aksi | Tanggung jawab |
|------|------|----------------|
| `src/lib/akademikPeriode.ts` | Create | Pure: tipe `TahunAjaranRow`, `resolveTahunAjaran`, `computeSemester`, `isPastPeriod`, `readStoredPeriode`/`writeStoredPeriode` |
| `src/lib/akademikPeriode.test.ts` | Create | Unit test modul pure |
| `src/lib/akademikContext.tsx` | Modify | Tambah `isPastPeriod`, `noActiveTa`, `dirty`, `setDirty` ke context value |
| `src/routes/sch.$sekolah.akademik.tsx` | Modify | Fetch daftar TA, resolusi, redirect URL, sync localStorage, sediakan context |
| `src/components/akademik/AkademikContextBar.tsx` | Modify | Banner past-period, nudge no-active-TA, guard ganti periode saat dirty |
| `src/components/akademik/AkademikContextBar.test.tsx` | Create | Test banner/nudge/guard |
| `src/components/akademik/EntriNilaiGrid.tsx` | Modify | Lapor `dirty` ke context; echo periode di ringkasan simpan |

---

## Task 1: Modul pure resolusi periode

**Files:**
- Create: `src/lib/akademikPeriode.ts`
- Test: `src/lib/akademikPeriode.test.ts`

- [ ] **Step 1: Tulis test gagal**

```ts
// src/lib/akademikPeriode.test.ts
import { describe, it, expect } from "vitest";
import {
  resolveTahunAjaran,
  computeSemester,
  isPastPeriod,
  type TahunAjaranRow,
} from "./akademikPeriode";

const TA: TahunAjaranRow[] = [
  { name: "S-2024", nama: "2024/2025", is_current: 0, status: "Closed",
    tanggal_mulai: "2024-07-01", tanggal_selesai: "2025-06-30",
    semester_ganjil_mulai: "2024-07-01", semester_ganjil_akhir: "2024-12-31",
    semester_genap_mulai: "2025-01-01", semester_genap_akhir: "2025-06-30" },
  { name: "S-2025", nama: "2025/2026", is_current: 0, status: "Aktif",
    tanggal_mulai: "2025-07-01", tanggal_selesai: "2026-06-30",
    semester_ganjil_mulai: "2025-07-01", semester_ganjil_akhir: "2025-12-31",
    semester_genap_mulai: "2026-01-01", semester_genap_akhir: "2026-06-30" },
  { name: "S-2026", nama: "2026/2027", is_current: 0, status: "Draft",
    tanggal_mulai: "2026-07-01", tanggal_selesai: "2027-06-30",
    semester_ganjil_mulai: "2026-07-01", semester_ganjil_akhir: "2026-12-31",
    semester_genap_mulai: "2027-01-01", semester_genap_akhir: "2027-06-30" },
];
const REF = new Date("2026-05-31");

describe("resolveTahunAjaran", () => {
  it("URL param menang bila valid", () => {
    expect(resolveTahunAjaran(TA, { urlTa: "S-2024", refDate: REF }).ta).toBe("S-2024");
  });
  it("localStorage menang atas is_current/status", () => {
    expect(resolveTahunAjaran(TA, { storedTa: "S-2024", refDate: REF }).ta).toBe("S-2024");
  });
  it("is_current menang atas status Aktif", () => {
    const list = TA.map((t) => (t.name === "S-2026" ? { ...t, is_current: 1 as const } : t));
    expect(resolveTahunAjaran(list, { refDate: REF }).ta).toBe("S-2026");
  });
  it("fallback status Aktif + hari ini dalam window", () => {
    expect(resolveTahunAjaran(TA, { refDate: REF }).ta).toBe("S-2025");
  });
  it("fallback TA terbaru bila tak ada is_current/Aktif-in-window", () => {
    const list = TA.map((t) => ({ ...t, status: "Draft" as const }));
    expect(resolveTahunAjaran(list, { refDate: REF }).ta).toBe("S-2026");
    expect(resolveTahunAjaran(list, { refDate: REF }).noActiveTa).toBe(true);
  });
  it("URL TA tak dikenal diabaikan", () => {
    expect(resolveTahunAjaran(TA, { urlTa: "X", refDate: REF }).ta).toBe("S-2025");
  });
  it("daftar kosong → ta kosong + noActiveTa", () => {
    expect(resolveTahunAjaran([], { refDate: REF })).toEqual({ ta: "", noActiveTa: true });
  });
});

describe("computeSemester", () => {
  it("hari ini dalam window genap → Genap", () => {
    expect(computeSemester(TA[1], { refDate: REF })).toBe("Genap");
  });
  it("URL/stored menang atas hitung tanggal", () => {
    expect(computeSemester(TA[1], { urlSemester: "Ganjil", refDate: REF })).toBe("Ganjil");
  });
  it("fallback bulan bila window kosong (Mei → Genap)", () => {
    const bare = { ...TA[1], semester_ganjil_mulai: undefined, semester_ganjil_akhir: undefined,
      semester_genap_mulai: undefined, semester_genap_akhir: undefined };
    expect(computeSemester(bare, { refDate: REF })).toBe("Genap");
  });
});

describe("isPastPeriod", () => {
  it("status Closed → true", () => {
    expect(isPastPeriod(TA[0], REF)).toBe(true);
  });
  it("hari ini di luar window TA → true", () => {
    expect(isPastPeriod(TA[2], REF)).toBe(true); // TA 2026/2027 belum mulai per REF
  });
  it("Aktif + dalam window → false", () => {
    expect(isPastPeriod(TA[1], REF)).toBe(false);
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `pnpm vitest run src/lib/akademikPeriode.test.ts`
Expected: FAIL — "Cannot find module './akademikPeriode'".

- [ ] **Step 3: Implementasi modul**

```ts
// src/lib/akademikPeriode.ts
// Pure helpers untuk meresolusi & memvalidasi periode Akademik (Tahun Ajaran +
// Semester). Tanpa akses DB/session/React — gampang di-test, dipakai oleh layout
// Akademik dan AkademikContextBar (≥2 pemakai → modul terpisah dibenarkan).

export type SemesterValue = "Ganjil" | "Genap";

export interface TahunAjaranRow {
  name: string;
  nama?: string;
  is_current?: 0 | 1;
  status?: string; // "Draft" | "Aktif" | "Closed"
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  semester_ganjil_mulai?: string;
  semester_ganjil_akhir?: string;
  semester_genap_mulai?: string;
  semester_genap_akhir?: string;
}

const STATUS_AKTIF = "Aktif";
const STATUS_CLOSED = "Closed";

function inWindow(ref: Date, start?: string, end?: string): boolean {
  if (!start || !end) return false;
  const t = ref.getTime();
  return t >= new Date(start).getTime() && t <= new Date(end).getTime();
}

// TA "terbaru" = tanggal_mulai terbesar; fallback urutan nama desc bila tanggal kosong.
function newest(list: TahunAjaranRow[]): TahunAjaranRow | undefined {
  return [...list].sort((a, b) => {
    const am = a.tanggal_mulai ?? "";
    const bm = b.tanggal_mulai ?? "";
    if (am !== bm) return am < bm ? 1 : -1;
    return (a.nama ?? a.name) < (b.nama ?? b.name) ? 1 : -1;
  })[0];
}

export interface ResolveTaInput {
  urlTa?: string;
  storedTa?: string;
  refDate: Date;
}

export interface ResolveTaResult {
  ta: string;
  noActiveTa?: boolean;
}

// Chain (berhenti di match pertama): URL → localStorage → is_current →
// status Aktif & ref dalam window → TA terbaru (tandai noActiveTa).
export function resolveTahunAjaran(
  list: TahunAjaranRow[],
  { urlTa, storedTa, refDate }: ResolveTaInput,
): ResolveTaResult {
  const has = (name?: string) => !!name && list.some((t) => t.name === name);
  if (has(urlTa)) return { ta: urlTa! };
  if (has(storedTa)) return { ta: storedTa! };

  const current = list.find((t) => t.is_current === 1);
  if (current) return { ta: current.name };

  const aktif = list.find(
    (t) => t.status === STATUS_AKTIF && inWindow(refDate, t.tanggal_mulai, t.tanggal_selesai),
  );
  if (aktif) return { ta: aktif.name };

  const latest = newest(list);
  if (latest) return { ta: latest.name, noActiveTa: true };
  return { ta: "", noActiveTa: true };
}

export interface ComputeSemesterInput {
  urlSemester?: string;
  storedSemester?: string;
  refDate: Date;
}

function monthFallback(ref: Date): SemesterValue {
  // Jul–Des (bulan 6–11) → Ganjil; Jan–Jun → Genap.
  return ref.getMonth() >= 6 ? "Ganjil" : "Genap";
}

// Semester: URL → localStorage → window tanggal TA → fallback bulan.
export function computeSemester(
  ta: TahunAjaranRow | undefined,
  { urlSemester, storedSemester, refDate }: ComputeSemesterInput,
): SemesterValue {
  if (urlSemester === "Ganjil" || urlSemester === "Genap") return urlSemester;
  if (storedSemester === "Ganjil" || storedSemester === "Genap") return storedSemester;
  if (ta) {
    if (inWindow(refDate, ta.semester_ganjil_mulai, ta.semester_ganjil_akhir)) return "Ganjil";
    if (inWindow(refDate, ta.semester_genap_mulai, ta.semester_genap_akhir)) return "Genap";
  }
  return monthFallback(refDate);
}

// Periode "lampau/ditutup": status Closed ATAU ref di luar window TA.
export function isPastPeriod(ta: TahunAjaranRow | undefined, refDate: Date): boolean {
  if (!ta) return false;
  if (ta.status === STATUS_CLOSED) return true;
  if (ta.tanggal_mulai && ta.tanggal_selesai) {
    return !inWindow(refDate, ta.tanggal_mulai, ta.tanggal_selesai);
  }
  return false;
}

export interface StoredPeriode {
  ta?: string;
  semester?: string;
}

function storageKey(sekolah: string): string {
  return `akademik:periode:${sekolah}`;
}

// localStorage tak tersedia/korup → kembalikan {} (jangan throw).
export function readStoredPeriode(sekolah: string): StoredPeriode {
  try {
    const raw = globalThis.localStorage?.getItem(storageKey(sekolah));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredPeriode;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeStoredPeriode(sekolah: string, value: StoredPeriode): void {
  try {
    globalThis.localStorage?.setItem(storageKey(sekolah), JSON.stringify(value));
  } catch {
    /* ignore quota/unavailable */
  }
}
```

- [ ] **Step 4: Jalankan test, pastikan lulus**

Run: `pnpm vitest run src/lib/akademikPeriode.test.ts`
Expected: PASS (semua case).

- [ ] **Step 5: Commit**

```bash
git add src/lib/akademikPeriode.ts src/lib/akademikPeriode.test.ts
git commit -m "feat(akademik): modul pure resolusi periode + semester"
```

---

## Task 2: Perluas context value

**Files:**
- Modify: `src/lib/akademikContext.tsx`

- [ ] **Step 1: Tambah field ke interface + memo deps**

Ganti isi `AkademikContextValue` dan `AkademikContextProvider` memo:

```tsx
export interface AkademikContextValue {
  tahunAjaran: string;
  semester: string;
  setTahunAjaran: (v: string) => void;
  setSemester: (v: string) => void;
  // Keamanan periode + UX (diisi oleh layout):
  isPastPeriod: boolean;
  noActiveTa: boolean;
  // Edit belum tersimpan — halaman entri melapor lewat setDirty; bar memakai
  // untuk konfirmasi sebelum ganti periode.
  dirty: boolean;
  setDirty: (v: boolean) => void;
}
```

Dan perbarui memo agar ikut field baru:

```tsx
export function AkademikContextProvider({ value, children }: ProviderProps) {
  const memo = useMemo(
    () => value,
    [value.tahunAjaran, value.semester, value.isPastPeriod, value.noActiveTa, value.dirty],
  );
  return <Ctx.Provider value={memo}>{children}</Ctx.Provider>;
}
```

- [ ] **Step 2: Verifikasi typecheck (akan ada error sementara di layout)**

Run: `pnpm tsc --noEmit`
Expected: error HANYA di `sch.$sekolah.akademik.tsx` (value belum punya field baru) — diperbaiki di Task 3. Tidak ada error di file lain (consumer pakai field baru bersifat opsional dipakai).

- [ ] **Step 3: Commit**

```bash
git add src/lib/akademikContext.tsx
git commit -m "feat(akademik): perluas context periode (past/noActive/dirty)"
```

---

## Task 3: Resolusi + redirect + provider di layout

**Files:**
- Modify: `src/routes/sch.$sekolah.akademik.tsx`

- [ ] **Step 1: Fetch daftar TA + resolusi + redirect + sediakan context**

Ganti seluruh isi `AkademikLayout` (dan import) menjadi:

```tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createFileRoute,
  Outlet,
  useNavigate,
  useParams,
  useRouterState,
  useSearch,
} from "@tanstack/react-router";
import { useResourceList } from "@sekolahpro/api-client";
import { AkademikContextProvider } from "../lib/akademikContext";
import { AkademikContextBar } from "../components/akademik/AkademikContextBar";
import { GroupedNavTabs, type NavTabGroup } from "../components/GroupedNavTabs";
import {
  resolveTahunAjaran,
  computeSemester,
  isPastPeriod,
  readStoredPeriode,
  writeStoredPeriode,
  type TahunAjaranRow,
} from "../lib/akademikPeriode";

const TA_FIELDS = [
  "name", "nama", "is_current", "status",
  "tanggal_mulai", "tanggal_selesai",
  "semester_ganjil_mulai", "semester_ganjil_akhir",
  "semester_genap_mulai", "semester_genap_akhir",
];
```

(NAV_GROUPS, CONTEXT_BAR_PREFIXES, showContextBar tetap seperti semula — tidak diubah.)

Lalu `AkademikLayout`:

```tsx
function AkademikLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const search = useSearch({ from: "/sch/$sekolah/akademik" });
  const navigate = useNavigate({ from: "/sch/$sekolah/akademik" });
  const [dirty, setDirty] = useState(false);

  const taQ = useResourceList<TahunAjaranRow>("Tahun Ajaran", {
    fields: TA_FIELDS,
    order_by: "`tanggal_mulai` desc",
    limit_page_length: 0,
  });
  const taList = useMemo(() => taQ.data ?? [], [taQ.data]);

  // Acuan tanggal stabil per mount (hindari re-resolusi tiap render).
  const refDate = useRef(new Date()).current;

  // Resolusi periode dari URL → localStorage → data TA.
  const resolved = useMemo(() => {
    if (taList.length === 0) return null;
    const stored = readStoredPeriode(sekolah);
    const { ta, noActiveTa } = resolveTahunAjaran(taList, {
      urlTa: search.ta,
      storedTa: stored.ta,
      refDate,
    });
    const taRow = taList.find((t) => t.name === ta);
    const semester = computeSemester(taRow, {
      urlSemester: search.semester,
      storedSemester: stored.semester,
      refDate,
    });
    return { ta, semester, taRow, noActiveTa: !!noActiveTa };
  }, [taList, search.ta, search.semester, sekolah, refDate]);

  // Redirect (replace) ke URL ter-resolve bila param belum lengkap → satu sumber kebenaran.
  useEffect(() => {
    if (!resolved || !resolved.ta) return;
    if (search.ta === resolved.ta && search.semester === resolved.semester) return;
    navigate({
      to: ".",
      search: (prev) => ({ ...prev, ta: resolved.ta, semester: resolved.semester }),
      replace: true,
    });
  }, [resolved, search.ta, search.semester, navigate]);

  // Sinkron pilihan aktif ke localStorage.
  useEffect(() => {
    if (search.ta && search.semester) {
      writeStoredPeriode(sekolah, { ta: search.ta, semester: search.semester });
    }
  }, [sekolah, search.ta, search.semester]);

  const setTahunAjaran = useCallback(
    (v: string) => navigate({ to: ".", search: (prev) => ({ ...prev, ta: v }), replace: true }),
    [navigate],
  );
  const setSemester = useCallback(
    (v: string) => navigate({ to: ".", search: (prev) => ({ ...prev, semester: v }), replace: true }),
    [navigate],
  );

  const tahunAjaran = search.ta ?? resolved?.ta ?? "";
  const semester = search.semester ?? resolved?.semester ?? "";
  const past = isPastPeriod(resolved?.taRow, refDate);

  return (
    <AkademikContextProvider
      value={{
        tahunAjaran,
        semester,
        setTahunAjaran,
        setSemester,
        isPastPeriod: past,
        noActiveTa: resolved?.noActiveTa ?? false,
        dirty,
        setDirty,
      }}
    >
      <div className="space-y-4">
        {showContextBar(pathname) ? <AkademikContextBar /> : null}
        <GroupedNavTabs groups={NAV_GROUPS} pathname={pathname} variant="inline" />
        <Outlet />
      </div>
    </AkademikContextProvider>
  );
}
```

(`Route` + `validateSearch` tetap seperti semula.)

- [ ] **Step 2: Typecheck**

Run: `pnpm tsc --noEmit`
Expected: "No errors found".

- [ ] **Step 3: Verifikasi manual resolusi (devserver)**

Run: `pnpm dev` lalu buka `/sch/sd-aletheia-malang/akademik/entri-nilai` tanpa query.
Expected: URL otomatis jadi `?ta=<TA aktif>&semester=Genap`; bar terisi; data tidak kosong.

- [ ] **Step 4: Commit**

```bash
git add src/routes/sch.$sekolah.akademik.tsx
git commit -m "feat(akademik): auto-default periode + redirect + persistence"
```

---

## Task 4: Bar — banner past-period, nudge, guard dirty

**Files:**
- Modify: `src/components/akademik/AkademikContextBar.tsx`
- Test: `src/components/akademik/AkademikContextBar.test.tsx`

- [ ] **Step 1: Tulis test gagal**

```tsx
// src/components/akademik/AkademikContextBar.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { AkademikContextProvider, type AkademikContextValue } from "../../lib/akademikContext";
import { AkademikContextBar } from "./AkademikContextBar";

vi.mock("@sekolahpro/api-client", () => ({
  listResource: vi.fn().mockResolvedValue([]),
}));

const base: AkademikContextValue = {
  tahunAjaran: "S-2025", semester: "Genap",
  setTahunAjaran: vi.fn(), setSemester: vi.fn(),
  isPastPeriod: false, noActiveTa: false, dirty: false, setDirty: vi.fn(),
};

function renderBar(over: Partial<AkademikContextValue> = {}) {
  return render(
    <AkademikContextProvider value={{ ...base, ...over }}>
      <AkademikContextBar />
    </AkademikContextProvider>,
  );
}

describe("AkademikContextBar", () => {
  afterEach(() => cleanup());

  it("banner muncul saat periode lampau/ditutup", () => {
    renderBar({ isPastPeriod: true });
    expect(screen.getByText(/periode lampau/i)).toBeTruthy();
  });

  it("nudge muncul saat tak ada TA aktif", () => {
    renderBar({ noActiveTa: true });
    expect(screen.getByText(/Belum ada Tahun Ajaran aktif/i)).toBeTruthy();
  });

  it("tanpa flag, tak ada banner/nudge", () => {
    renderBar();
    expect(screen.queryByText(/periode lampau/i)).toBeNull();
    expect(screen.queryByText(/Belum ada Tahun Ajaran aktif/i)).toBeNull();
  });

  it("ganti semester saat dirty → konfirmasi dulu", () => {
    const setSemester = vi.fn();
    const confirmSpy = vi.spyOn(globalThis, "confirm").mockReturnValue(false);
    renderBar({ dirty: true, setSemester });
    fireEvent.focus(screen.getByLabelText("Semester", { exact: false }));
    const opt = screen.getAllByRole("option").find((o) => o.textContent === "Ganjil");
    if (opt) fireEvent.mouseDown(opt);
    expect(confirmSpy).toHaveBeenCalled();
    expect(setSemester).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `pnpm vitest run src/components/akademik/AkademikContextBar.test.tsx`
Expected: FAIL (banner/nudge/guard belum ada; `AkademikContextValue` belum diekspor sbg type bila perlu).

- [ ] **Step 3: Implementasi**

Pastikan `akademikContext.tsx` mengekspor type `AkademikContextValue` (sudah, via `export interface`). Lalu ganti isi `AkademikContextBar.tsx`:

```tsx
import { useCallback } from "react";
import { SearchableSelect, SetupBanner, type SearchableOption } from "@sekolahpro/ui";
import { listResource } from "@sekolahpro/api-client";
import { useAkademikContext } from "../../lib/akademikContext";

const SEMESTER_OPTIONS: SearchableOption[] = [
  { value: "Ganjil", label: "Ganjil" },
  { value: "Genap", label: "Genap" },
];

const TA_FIELDS = ["name", "nama", "is_current", "status"];
const TA_PAGE = 50;
const SWITCH_CONFIRM = "Pindah periode? Perubahan yang belum disimpan akan hilang.";

type TahunAjaranRow = { name: string; nama?: string; is_current?: 0 | 1; status?: string };

export function AkademikContextBar() {
  const { tahunAjaran, semester, setTahunAjaran, setSemester, isPastPeriod, noActiveTa, dirty } =
    useAkademikContext();

  const loadTA = useCallback(async (q: string): Promise<SearchableOption[]> => {
    const filters: Array<[string, string, string]> = q ? [["nama", "like", `%${q}%`]] : [];
    const rows = await listResource<TahunAjaranRow>("Tahun Ajaran", {
      fields: TA_FIELDS, filters, order_by: "`nama` desc", limit_page_length: TA_PAGE,
    });
    return rows.map((r): SearchableOption => {
      const opt: SearchableOption = { value: r.name, label: r.nama ?? r.name };
      const tags: string[] = [];
      if (r.is_current) tags.push("Berjalan");
      if (r.status && r.status !== "Aktif") tags.push(r.status);
      if (tags.length > 0) opt.hint = tags.join(" · ");
      return opt;
    });
  }, []);

  // Konfirmasi sebelum ganti periode bila ada edit belum tersimpan.
  const guarded = useCallback(
    (fn: (v: string) => void) => (v: string) => {
      if (dirty && !globalThis.confirm(SWITCH_CONFIRM)) return;
      fn(v);
    },
    [dirty],
  );

  return (
    <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 mb-4 border-b border-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/75">
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center gap-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-fg shrink-0">
          Konteks
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <label className="text-xs text-muted-fg shrink-0" htmlFor="akademik-ta">Tahun Ajaran</label>
          <SearchableSelect
            id="akademik-ta"
            value={tahunAjaran}
            onChange={guarded(setTahunAjaran)}
            loadOptions={loadTA}
            placeholder="Pilih TA…"
            className="w-48"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-fg shrink-0" htmlFor="akademik-semester">Semester</label>
          <SearchableSelect
            id="akademik-semester"
            value={semester}
            onChange={guarded(setSemester)}
            options={SEMESTER_OPTIONS}
            placeholder="Pilih semester…"
            className="w-36"
          />
        </div>
      </div>
      {(isPastPeriod || noActiveTa) && (
        <div className="px-4 sm:px-6 lg:px-8 pb-2.5">
          {noActiveTa ? (
            <SetupBanner
              tone="info"
              title="Belum ada Tahun Ajaran aktif"
              description="Atur Tahun Ajaran aktif di Master Data agar periode terpilih otomatis."
            />
          ) : (
            <SetupBanner
              tone="warning"
              title="Anda mengedit periode lampau/ditutup"
              description="Tahun Ajaran ini sudah ditutup atau di luar rentang tanggalnya. Pastikan periode benar sebelum input."
            />
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Jalankan test, pastikan lulus**

Run: `pnpm vitest run src/components/akademik/AkademikContextBar.test.tsx`
Expected: PASS (4 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/akademik/AkademikContextBar.tsx src/components/akademik/AkademikContextBar.test.tsx
git commit -m "feat(akademik): banner periode lampau + nudge TA aktif + guard ganti periode"
```

---

## Task 5: Grid — lapor dirty + echo periode di ringkasan simpan

**Files:**
- Modify: `src/components/akademik/EntriNilaiGrid.tsx`

> Konteks file: `dirtyRows` (array siswa yang berubah) sudah dihitung (~baris 293).
> Tombol simpan & `saveSummary` ada (~baris 436 & 458). Komponen sudah meng-import
> `useAkademikContextOptional`? Cek: bila belum, tambahkan import.

- [ ] **Step 1: Import context (jika belum) di bagian import EntriNilaiGrid.tsx**

```tsx
import { useAkademikContextOptional } from "../../lib/akademikContext";
```

- [ ] **Step 2: Lapor status dirty ke context**

Di dalam komponen grid, setelah `dirtyRows` didefinisikan (`const dirtyRows = useMemo(...)`), tambahkan:

```tsx
const akademik = useAkademikContextOptional();
useEffect(() => {
  akademik?.setDirty(dirtyRows.length > 0);
  return () => akademik?.setDirty(false);
}, [dirtyRows.length, akademik]);
```

Pastikan `useEffect` ada di import React grid (tambah bila belum).

- [ ] **Step 3: Echo periode di teks ringkasan simpan**

Ubah teks ringkasan (saat ini ~baris 458: `Simpan selesai: {saveSummary.ok} baris berhasil, {saveSummary.fail} gagal.`) menjadi menyertakan periode:

```tsx
Simpan selesai: {saveSummary.ok} baris berhasil, {saveSummary.fail} gagal
{akademik?.tahunAjaran ? ` · ${akademik.tahunAjaran} ${akademik.semester}` : ""}.
```

- [ ] **Step 4: Typecheck + test grid (bila ada)**

Run: `pnpm tsc --noEmit && pnpm vitest run src/components/akademik`
Expected: "No errors found"; test akademik PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/akademik/EntriNilaiGrid.tsx
git commit -m "feat(akademik): grid lapor dirty + echo periode di ringkasan simpan"
```

---

## Task 6: Echo periode di header halaman operasional

**Files:**
- Modify: `src/routes/sch.$sekolah.akademik.entri-nilai.tsx`
- Modify: `src/routes/sch.$sekolah.akademik.asesmen.index.tsx`
- Modify: `src/routes/sch.$sekolah.akademik.raport.tsx`

> Tujuan: tampilkan periode aktif di deskripsi header tiap halaman sebagai echo
> sekunder (bar pill = echo utama). Pola: sisipkan suffix periode dari ctx.

- [ ] **Step 1: entri-nilai — suffix periode di `description`**

File pakai `ResourceListPage` dengan prop `description`. Bangun suffix dari ctx:

```tsx
const periodeSuffix = ctx?.tahunAjaran ? ` · Periode: ${ctx.tahunAjaran} ${ctx.semester}` : "";
```

dan ubah prop:

```tsx
description={`Rekap dokumen entri nilai per siswa × mapel × semester. Gunakan editor grid untuk input cepat.${periodeSuffix}`}
```

- [ ] **Step 2: asesmen — suffix periode di `PageHeader` description**

Di `AsesmenPage` (sudah ada `const ctx = useAkademikContextOptional()`), tambah sebelum return:

```tsx
const periodeSuffix = ctx?.tahunAjaran ? ` · Periode: ${ctx.tahunAjaran} ${ctx.semester}` : "";
```

dan ubah `description` PageHeader:

```tsx
description={`Pilih kelas & mapel, lalu buka/buat test untuk input nilai cepat satu kelas.${periodeSuffix}`}
```

- [ ] **Step 3: raport — suffix periode di `description`**

Di `RaportPage` (sudah ada `const ctx = useAkademikContextOptional()`), tambah:

```tsx
const periodeSuffix = ctx?.tahunAjaran ? ` · Periode: ${ctx.tahunAjaran} ${ctx.semester}` : "";
```

dan ubah `description`:

```tsx
description={`Kelola raport siswa per semester. Status mengikuti alur Draft → Review → Submitted → Final → Locked/Tercetak.${periodeSuffix}`}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm tsc --noEmit`
Expected: "No errors found".

- [ ] **Step 5: Commit**

```bash
git add src/routes/sch.$sekolah.akademik.entri-nilai.tsx src/routes/sch.$sekolah.akademik.asesmen.index.tsx src/routes/sch.$sekolah.akademik.raport.tsx
git commit -m "feat(akademik): echo periode aktif di header halaman operasional"
```

---

## Task 7: Verifikasi akhir + dokumentasi

**Files:**
- Modify: `docs/superpowers/specs/2026-05-31-akademik-tahun-ajaran-default-design.md` (set Status: Implemented)

- [ ] **Step 1: Suite lengkap + lint + typecheck**

Run: `pnpm tsc --noEmit && pnpm lint && pnpm vitest run`
Expected: tsc clean; lint tak ada isu baru di file yang disentuh; semua test PASS kecuali kegagalan pre-existing `PinFallbackForm` (tak terkait).

- [ ] **Step 2: Verifikasi manual end-to-end (devserver)**

Run: `pnpm dev`
Checklist di `/sch/sd-aletheia-malang/akademik/entri-nilai`:
- Masuk tanpa query → URL terisi `?ta=…&semester=Genap`, data muncul (bukan kosong).
- Reload / buka tab baru → periode sama (localStorage).
- Pilih TA ber-status Closed/di luar window → banner kuning "periode lampau" muncul.
- Ada edit di grid lalu ganti TA → konfirmasi muncul; batal → periode tak berubah.
- Bila tak ada TA aktif → nudge info "Belum ada Tahun Ajaran aktif".

- [ ] **Step 3: Tandai spec Implemented + commit**

Ubah baris `**Status:** Draft — awaiting user review` → `**Status:** Implemented`.

```bash
git add docs/superpowers/specs/2026-05-31-akademik-tahun-ajaran-default-design.md
git commit -m "docs(akademik): tandai spec periode default sebagai implemented"
```

---

## Self-Review (penulis plan)

**Spec coverage:**
- §1 Resolution chain → Task 1 (`resolveTahunAjaran`) + Task 3 (pakai di layout). ✓
- §1 Semester compute → Task 1 (`computeSemester`). ✓
- §2 Scope pill (stated value, bukan kosong) → Task 3 mengisi value default + Task 4 mempertahankan SearchableSelect yang kini menampilkan nilai terpilih. ✓ (popover pill kustom tidak dibuat — YAGNI; SearchableSelect sudah menampilkan nilai terpilih sebagai pernyataan scope.)
- §3 Persistence (URL sumber kebenaran + localStorage) → Task 1 (read/write) + Task 3 (redirect + sync). ✓
- §4 Wrong-period safety: echo → Task 5 (ringkasan simpan) + Task 6 (header); banner → Task 4; guard dirty → Task 4 + Task 5. ✓
- §5 No active TA → Task 1 (`noActiveTa`) + Task 4 (nudge). ✓
- Testing (akademikPeriode.test, AkademikContextBar.test) → Task 1 & Task 4. ✓

**Placeholder scan:** Tidak ada TBD/TODO; semua step berisi kode konkret. ✓

**Type consistency:** `TahunAjaranRow` (Task 1) dipakai konsisten di Task 3. `AkademikContextValue` field baru (`isPastPeriod`, `noActiveTa`, `dirty`, `setDirty`) konsisten antara Task 2, 3, 4, 5. `resolveTahunAjaran`/`computeSemester`/`isPastPeriod`/`readStoredPeriode`/`writeStoredPeriode` nama sama di definisi & pemakaian. ✓

**Catatan eksekutor:** Task 2 sengaja meninggalkan error tsc sementara (hanya di layout) yang ditutup Task 3 — jangan commit Task 2 berharap tsc full-clean; lanjut ke Task 3.
