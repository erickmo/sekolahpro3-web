# Phase D — Web /staff Merge Against Real Pegawai API

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the parallel `/guru` and `/staff` route trees with a single `/staff` namespace that queries the real `Pegawai` doctype (introduced by Phase A backend) and renders role-driven tabs based on the `roles` Table MultiSelect.

**Architecture:** All real-data pages (index, $nip) call `useResourceList<Pegawai>("Pegawai", ...)` and `useResourceDoc<Pegawai>("Pegawai", nip)` from `@sekolahpro/api-client`. Role discrimination comes from the `roles` child rows (`{role: "Pegawai Guru"}` / `{role: "Pegawai Staff"}`). Existing mock `PEGAWAI_LIST` becomes a test fixture only — production pages use the API. Sub-routes (`daftar`, `berkas`, `jabatan`, `sk-jabatan`, `mapel-pengampu`, `penugasan`, `sk-mengajar`) all move under `/staff/` and query `Pegawai`.

**Tech Stack:** React 18, TanStack Router, `@sekolahpro/api-client` (`useResourceList`, `useResourceDoc`), `@sekolahpro/ui`, Tailwind, vitest.

**Spec:** `docs/superpowers/specs/2026-05-29-merge-guru-staff-design.md`
**Phase A backend:** `feat/pegawai-rename-claude` (Pegawai doctype + roles MultiSelect)
**Worktree:** `apps/sekolahpro-web/.worktrees/merge-guru-staff` on `feat/merge-guru-staff`
**Current HEAD:** `82ee5b3` (T1–T5 done: entity, fixtures, UI components)

---

## Pegawai Schema (from Phase A spec)

Fields a Web client reads:
```
name (autoname PEGAWAI-####)
nama_lengkap, nip, nik, nuptk
jenis_kelamin, tempat_lahir, tanggal_lahir, agama
status_kepegawaian, sekolah, is_aktif, tmt_pertama_kerja
jabatan_fungsional
roles[]    // child table Pegawai Role, each row: { role: string }
```

Role discriminators in this PR:
- `"Pegawai Guru"` → render Mengajar tab + Guru badge
- `"Pegawai Staff"` → render Staff tab + Staff badge

Helper (declared once in this PR, used in every consumer):

```ts
// apps/school/src/features/pegawai/roles.ts
import type { Pegawai } from "../../data/pegawai";

export type PegawaiApi = {
  name: string;
  nama_lengkap?: string;
  nip?: string;
  nik?: string;
  nuptk?: string;
  jenis_kelamin?: "Laki-laki" | "Perempuan";
  status_kepegawaian?: string;
  jabatan_fungsional?: string;
  sekolah?: string;
  is_aktif?: 0 | 1;
  tmt_pertama_kerja?: string;
  roles?: Array<{ role: string }>;
};

const ROLE_GURU = "Pegawai Guru";
const ROLE_STAFF = "Pegawai Staff";

export function apiIsGuru(p: PegawaiApi): boolean {
  return (p.roles ?? []).some((r) => r.role === ROLE_GURU);
}

export function apiIsStaff(p: PegawaiApi): boolean {
  return (p.roles ?? []).some((r) => r.role === ROLE_STAFF);
}

export function apiIsDualRole(p: PegawaiApi): boolean {
  return apiIsGuru(p) && apiIsStaff(p);
}

export function apiRoleBadges(p: PegawaiApi): Array<"guru" | "staff"> {
  const out: Array<"guru" | "staff"> = [];
  if (apiIsGuru(p)) out.push("guru");
  if (apiIsStaff(p)) out.push("staff");
  return out;
}

// Bridge to existing Pegawai mock type used by tab components.
// Returns null if essential fields missing.
export function pegawaiApiToMock(p: PegawaiApi): Pegawai | null {
  if (!p.nama_lengkap || !p.nip) return null;
  // Minimal stub — most fields default. Tab components tolerate missing data.
  // (UI in this PR shows real data where present, "—" otherwise.)
  return null; // unused — tabs in Phase D bind directly to PegawaiApi via thin adapter components
}
```

(`pegawaiApiToMock` is a placeholder for documentation only — tab components in this PR get adapted, not bridged.)

---

## File Structure

**New files:**
- `apps/school/src/features/pegawai/roles.ts` — API role helpers (above).
- `apps/school/src/features/pegawai/ApiPegawaiHeader.tsx` — header bound to `PegawaiApi`.
- `apps/school/src/features/pegawai/ApiProfilTab.tsx`
- `apps/school/src/features/pegawai/ApiBerkasSection.tsx` — queries Berkas Guru list filtered by `parent_pegawai`.
- `apps/school/src/features/pegawai/ApiKehadiranSection.tsx` — queries Detail Absensi Guru list.
- `apps/school/src/features/pegawai/ApiMengajarTab.tsx` — queries Mapel Pengampu Guru, Jadwal Pelajaran, SK Mengajar.
- `apps/school/src/features/pegawai/ApiStaffTab.tsx` — uses jabatan_fungsional + Berkas + SK Jabatan.

**Modified:**
- `apps/school/src/routes/$sekolah.staff.tsx` (layout — labels + tab list)
- `apps/school/src/routes/$sekolah.staff.index.tsx` (rewrite — Pegawai dashboard)
- `apps/school/src/routes/$sekolah.staff.daftar.tsx` (rewrite — Pegawai list w/ role filter)
- `apps/school/src/routes/$sekolah.staff.$nip.tsx` (rewrite — detail w/ role-driven tabs)
- `apps/school/src/routes/$sekolah.staff.berkas.tsx` (repoint to Pegawai)
- `apps/school/src/routes/$sekolah.staff.jabatan.tsx` (repoint)
- `apps/school/src/routes/$sekolah.staff.sk-jabatan.tsx` (repoint)
- `apps/school/src/routes/__root.tsx` (sidebar + ROLE_MENU_MAP)
- `apps/school/src/lib/global-search.ts` (Pegawai query)

**Created (moved-from-guru):**
- `apps/school/src/routes/$sekolah.staff.mapel-pengampu.tsx`
- `apps/school/src/routes/$sekolah.staff.penugasan.tsx`
- `apps/school/src/routes/$sekolah.staff.sk-mengajar.tsx`

**Deleted:**
- `apps/school/src/routes/$sekolah.guru.tsx` and all `$sekolah.guru.*.tsx` (11 files)

---

## Task PD-1: API role helpers + ApiPegawaiHeader + ApiProfilTab

**Files:**
- Create: `apps/school/src/features/pegawai/roles.ts`
- Create: `apps/school/src/features/pegawai/ApiPegawaiHeader.tsx`
- Create: `apps/school/src/features/pegawai/ApiProfilTab.tsx`

- [ ] **Step 1: Create `roles.ts`**

Use the content shown in the "Pegawai Schema" section above. Drop the `pegawaiApiToMock` placeholder (unused). Keep the type, three predicates, and `apiRoleBadges`.

- [ ] **Step 2: Create `ApiPegawaiHeader.tsx`**

```tsx
import { Avatar, Badge } from "@sekolahpro/ui";
import { RoleBadges } from "./RoleBadges";
import { apiRoleBadges, type PegawaiApi } from "./roles";

const STATUS_TONE = {
  active: "success" as const,
  inactive: "neutral" as const,
};

export function ApiPegawaiHeader({ pegawai }: { pegawai: PegawaiApi }) {
  const isActive = pegawai.is_aktif === 1;
  const badges = apiRoleBadges(pegawai);
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-bg p-4">
      <Avatar name={pegawai.nama_lengkap ?? pegawai.name} size="lg" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-fg truncate">
            {pegawai.nama_lengkap ?? pegawai.name}
          </h1>
          <Badge tone={isActive ? STATUS_TONE.active : STATUS_TONE.inactive}>
            {isActive ? "Aktif" : "Non-aktif"}
          </Badge>
        </div>
        <div className="text-sm text-muted-fg">
          NIP {pegawai.nip ?? "—"} · {pegawai.jabatan_fungsional ?? "—"} · {pegawai.status_kepegawaian ?? "—"}
        </div>
        <div className="mt-2">
          <RoleBadges roles={badges} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `ApiProfilTab.tsx`**

```tsx
import type { PegawaiApi } from "./roles";

export function ApiProfilTab({ pegawai }: { pegawai: PegawaiApi }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <section className="rounded-lg border border-border bg-bg p-4 space-y-2">
        <h2 className="text-sm font-semibold text-fg">Data Pribadi</h2>
        <dl className="grid grid-cols-[140px_1fr] gap-y-1 text-sm">
          <dt className="text-muted-fg">Tempat lahir</dt><dd>{pegawai.tempat_lahir ?? "—"}</dd>
          <dt className="text-muted-fg">Tanggal lahir</dt><dd>{pegawai.tanggal_lahir ?? "—"}</dd>
          <dt className="text-muted-fg">Jenis kelamin</dt><dd>{pegawai.jenis_kelamin ?? "—"}</dd>
          <dt className="text-muted-fg">Agama</dt><dd>{pegawai.agama ?? "—"}</dd>
          <dt className="text-muted-fg">NIK</dt><dd>{pegawai.nik ?? "—"}</dd>
          <dt className="text-muted-fg">NUPTK</dt><dd>{pegawai.nuptk ?? "—"}</dd>
        </dl>
      </section>
      <section className="rounded-lg border border-border bg-bg p-4 space-y-2">
        <h2 className="text-sm font-semibold text-fg">Kepegawaian</h2>
        <dl className="grid grid-cols-[140px_1fr] gap-y-1 text-sm">
          <dt className="text-muted-fg">Status</dt><dd>{pegawai.status_kepegawaian ?? "—"}</dd>
          <dt className="text-muted-fg">Jabatan fungsional</dt><dd>{pegawai.jabatan_fungsional ?? "—"}</dd>
          <dt className="text-muted-fg">TMT pertama kerja</dt><dd>{pegawai.tmt_pertama_kerja ?? "—"}</dd>
          <dt className="text-muted-fg">Sekolah</dt><dd>{pegawai.sekolah ?? "—"}</dd>
        </dl>
      </section>
    </div>
  );
}
```

`ApiProfilTab` extends `PegawaiApi` consumers: also add optional fields used here.

Update `roles.ts` `PegawaiApi`:
```ts
export type PegawaiApi = {
  name: string;
  nama_lengkap?: string;
  nip?: string;
  nik?: string;
  nuptk?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: "Laki-laki" | "Perempuan";
  agama?: string;
  status_kepegawaian?: string;
  jabatan_fungsional?: string;
  sekolah?: string;
  is_aktif?: 0 | 1;
  tmt_pertama_kerja?: string;
  roles?: Array<{ role: string }>;
};
```

Also adjust `RoleBadges` to accept either `RolePegawai[]` or `Array<"guru" | "staff">` — they are the same string literal union. (`RoleBadges` already accepts `RolePegawai[]`; the two arrays are structurally identical because `RolePegawai = "guru" | "staff"`.)

- [ ] **Step 4: Typecheck**

```
cd /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web/.worktrees/merge-guru-staff
pnpm --filter @sekolahpro/app-school typecheck 2>&1 | grep -E "features/pegawai/(roles|Api)" || echo ok
```
Expected: `ok`.

- [ ] **Step 5: Commit**

```
git add apps/school/src/features/pegawai/roles.ts apps/school/src/features/pegawai/ApiPegawaiHeader.tsx apps/school/src/features/pegawai/ApiProfilTab.tsx
git commit -m "feat(school): API role helpers + ApiPegawaiHeader + ApiProfilTab for Pegawai"
```

---

## Task PD-2: Rewrite `$sekolah.staff.index.tsx` to Pegawai dashboard

**Files:**
- Modify: `apps/school/src/routes/$sekolah.staff.index.tsx`
- Modify: `apps/school/src/routes/$sekolah.staff.tsx` (layout — relabel "Daftar Staff" → "Daftar Pegawai" and headline)

- [ ] **Step 1: Update layout `$sekolah.staff.tsx`**

Read the file. Inside the `TABS` array:
- Change `{ to: "/$sekolah/staff/daftar", label: "Daftar Staff" }` → `label: "Daftar Pegawai"`.
- Add `{ to: "/$sekolah/staff/mapel-pengampu", label: "Mapel Pengampu" }`,
  `{ to: "/$sekolah/staff/penugasan", label: "Penugasan" }`,
  `{ to: "/$sekolah/staff/sk-mengajar", label: "SK Mengajar" }` so the layout exposes the moved sub-routes.
- Final TABS order: Dashboard, Daftar Pegawai, Mapel Pengampu, Penugasan, SK Mengajar, SK Jabatan, Jabatan, Berkas.

If the file has a page heading string `"Staff"`, change to `"Guru & Staff"`.

- [ ] **Step 2: Rewrite `$sekolah.staff.index.tsx`**

Replace the file contents:

```tsx
import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  PageHeader,
  StatCard,
  SectionCard,
  IconUsers,
  IconCheck,
  IconAlert,
  IconFile,
  IconPlus,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { scopedTo, scopedParams } from "../lib/scoped";
import { apiIsGuru, apiIsStaff, apiIsDualRole, type PegawaiApi } from "../features/pegawai/roles";

const PEGAWAI_LIST_LIMIT = 200;

export const Route = createFileRoute("/$sekolah/staff/")({
  component: StaffIndex,
});

function StaffIndex() {
  const { sekolah } = Route.useParams();

  const q = useResourceList<PegawaiApi>("Pegawai", {
    fields: ["name", "nama_lengkap", "nip", "jabatan_fungsional", "status_kepegawaian", "sekolah", "is_aktif", "tmt_pertama_kerja", "roles.role"],
    filters: { sekolah },
    order_by: "modified desc",
    limit_page_length: PEGAWAI_LIST_LIMIT,
  });

  const list = q.data ?? [];

  const counts = useMemo(() => ({
    total: list.length,
    guru: list.filter(apiIsGuru).length,
    staff: list.filter(apiIsStaff).length,
    dual: list.filter(apiIsDualRole).length,
    aktif: list.filter((p) => p.is_aktif === 1).length,
  }), [list]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Guru & Staff"
        description="Ringkasan tenaga pendidik dan kependidikan."
        actions={
          <Link
            to={scopedTo(sekolah, "/staff/daftar")}
            params={scopedParams(sekolah)}
            className="inline-flex items-center h-9 px-3 rounded-md bg-brand text-white text-sm hover:opacity-90"
          >
            <IconPlus className="h-4 w-4 mr-1" />
            Lihat Daftar
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={<IconUsers />} label="Total Pegawai" value={counts.total} />
        <StatCard icon={<IconCheck />} label="Guru" value={counts.guru} />
        <StatCard icon={<IconCheck />} label="Staff" value={counts.staff} />
        <StatCard icon={<IconAlert />} label="Dual-role" value={counts.dual} />
        <StatCard icon={<IconCheck />} label="Aktif" value={counts.aktif} />
      </div>

      {q.isLoading ? (
        <SectionCard title="Memuat data...">
          <div className="text-sm text-muted-fg">Memuat daftar pegawai dari server.</div>
        </SectionCard>
      ) : null}

      {q.error ? (
        <SectionCard title="Gagal memuat">
          <div className="text-sm text-danger">{String(q.error)}</div>
        </SectionCard>
      ) : null}
    </div>
  );
}
```

(Confirm `PageHeader`, `StatCard`, `SectionCard` exports exist in `@sekolahpro/ui`. They were imported by the legacy `$sekolah.guru.index.tsx` so they exist.)

- [ ] **Step 3: Typecheck**

```
pnpm --filter @sekolahpro/app-school typecheck 2>&1 | grep -E "\\\$sekolah.staff" || echo ok
```
Expected: `ok`.

- [ ] **Step 4: Commit**

```
git add apps/school/src/routes/\$sekolah.staff.tsx apps/school/src/routes/\$sekolah.staff.index.tsx
git commit -m "feat(school): rewrite /staff index as Pegawai dashboard with role counts"
```

---

## Task PD-3: Rewrite `$sekolah.staff.daftar.tsx` (real API + filters)

**Files:**
- Modify: `apps/school/src/routes/$sekolah.staff.daftar.tsx`

- [ ] **Step 1: Replace contents**

```tsx
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { scopedTo, scopedParams } from "../lib/scoped";
import { RoleBadges } from "../features/pegawai/RoleBadges";
import { apiRoleBadges, apiIsGuru, apiIsStaff, apiIsDualRole, type PegawaiApi } from "../features/pegawai/roles";

type RoleFilter = "semua" | "guru" | "staff" | "dual";
type StatusFilter = "semua" | "aktif" | "nonaktif";

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "guru", label: "Guru" },
  { value: "staff", label: "Staff" },
  { value: "dual", label: "Dual-role" },
];

const PEGAWAI_LIMIT = 500;

export const Route = createFileRoute("/$sekolah/staff/daftar")({
  component: DaftarPegawai,
});

function DaftarPegawai() {
  const { sekolah } = Route.useParams();
  const [role, setRole] = useState<RoleFilter>("semua");
  const [status, setStatus] = useState<StatusFilter>("semua");
  const [query, setQuery] = useState("");

  const q = useResourceList<PegawaiApi>("Pegawai", {
    fields: ["name", "nama_lengkap", "nip", "jabatan_fungsional", "status_kepegawaian", "is_aktif", "roles.role"],
    filters: { sekolah },
    order_by: "nama_lengkap asc",
    limit_page_length: PEGAWAI_LIMIT,
  });

  const list = q.data ?? [];

  const filtered = useMemo(() => list.filter((p) => {
    if (role === "guru" && !(apiIsGuru(p) && !apiIsDualRole(p))) return false;
    if (role === "staff" && !(apiIsStaff(p) && !apiIsDualRole(p))) return false;
    if (role === "dual" && !apiIsDualRole(p)) return false;
    if (status === "aktif" && p.is_aktif !== 1) return false;
    if (status === "nonaktif" && p.is_aktif === 1) return false;
    if (query) {
      const t = query.toLowerCase();
      const hay = `${p.nama_lengkap ?? ""} ${p.nip ?? ""}`.toLowerCase();
      if (!hay.includes(t)) return false;
    }
    return true;
  }), [list, role, status, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {ROLE_OPTIONS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setRole(f.value)}
            className={`h-8 px-3 rounded-md text-sm border ${role === f.value ? "border-brand bg-brand/10 text-brand" : "border-border text-fg hover:bg-muted"}`}
          >
            {f.label}
          </button>
        ))}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="h-8 px-2 rounded-md border border-border text-sm bg-bg"
        >
          <option value="semua">Semua status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Non-aktif</option>
        </select>
        <input
          type="search"
          placeholder="Cari nama atau NIP"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 px-2 rounded-md border border-border text-sm bg-bg flex-1 min-w-[180px]"
        />
        <span className="text-xs text-muted-fg ml-auto">
          {q.isLoading ? "Memuat..." : `${filtered.length} pegawai`}
        </span>
      </div>

      <div className="rounded-lg border border-border bg-bg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-fg bg-muted/40">
            <tr>
              <th className="text-left px-3 py-2">NIP</th>
              <th className="text-left px-3 py-2">Nama</th>
              <th className="text-left px-3 py-2">Role</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Jabatan / Mapel</th>
              <th className="text-left px-3 py-2">Kepegawaian</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.name} className="border-t border-border hover:bg-muted/30">
                <td className="px-3 py-2 font-mono text-xs">{p.nip ?? "—"}</td>
                <td className="px-3 py-2">
                  <Link
                    to={scopedTo(sekolah, `/staff/${p.name}`)}
                    params={scopedParams(sekolah)}
                    className="text-brand hover:underline"
                  >
                    {p.nama_lengkap ?? p.name}
                  </Link>
                </td>
                <td className="px-3 py-2"><RoleBadges roles={apiRoleBadges(p)} /></td>
                <td className="px-3 py-2">
                  <Badge tone={p.is_aktif === 1 ? "success" : "neutral"}>
                    {p.is_aktif === 1 ? "Aktif" : "Non-aktif"}
                  </Badge>
                </td>
                <td className="px-3 py-2">{p.jabatan_fungsional ?? "—"}</td>
                <td className="px-3 py-2">{p.status_kepegawaian ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !q.isLoading ? (
          <div className="px-3 py-6 text-center text-sm text-muted-fg">
            {q.error ? `Gagal memuat: ${String(q.error)}` : "Tidak ada pegawai sesuai filter."}
          </div>
        ) : null}
      </div>
    </div>
  );
}
```

**Note:** Link target uses `p.name` (Pegawai autoname like `PEGAWAI-0001`), not `p.nip`. The detail route `$sekolah.staff.$nip` will accept the Pegawai `name` as the URL param — semantically rename in T4 to `$pegawai` is overkill; keep `$nip` param but treat it as the Pegawai `name`. Document this with a comment in T4.

- [ ] **Step 2: Typecheck + commit**

```
pnpm --filter @sekolahpro/app-school typecheck 2>&1 | grep -E "staff.daftar" || echo ok
git add apps/school/src/routes/\$sekolah.staff.daftar.tsx
git commit -m "feat(school): rewrite /staff/daftar as Pegawai list with role+status+search filters"
```

---

## Task PD-4: Rewrite `$sekolah.staff.$nip.tsx` (detail w/ role-driven tabs)

**Files:**
- Modify: `apps/school/src/routes/$sekolah.staff.$nip.tsx`

- [ ] **Step 1: Replace contents**

The route param `$nip` historically meant NIP; in Phase D it carries the Pegawai `name` (autoname). We rename usage but keep the param key for URL stability across the migration.

```tsx
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useResourceDoc } from "@sekolahpro/api-client";
import { ApiPegawaiHeader } from "../features/pegawai/ApiPegawaiHeader";
import { ApiProfilTab } from "../features/pegawai/ApiProfilTab";
import { ApiMengajarTab } from "../features/pegawai/ApiMengajarTab";
import { ApiStaffTab } from "../features/pegawai/ApiStaffTab";
import { ApiBerkasSection } from "../features/pegawai/ApiBerkasSection";
import { ApiKehadiranSection } from "../features/pegawai/ApiKehadiranSection";
import { apiIsGuru, apiIsStaff, type PegawaiApi } from "../features/pegawai/roles";

// Route param `$nip` carries the Pegawai `name` (autoname like PEGAWAI-0001).
type TabKey = "profil" | "mengajar" | "staff" | "berkas" | "kehadiran";

export const Route = createFileRoute("/$sekolah/staff/$nip")({
  component: PegawaiDetail,
});

function PegawaiDetail() {
  const { nip } = Route.useParams();
  const q = useResourceDoc<PegawaiApi>("Pegawai", nip);

  if (q.isLoading) {
    return <div className="text-sm text-muted-fg p-4">Memuat...</div>;
  }
  if (q.error || !q.data) {
    return (
      <div className="rounded-lg border border-border bg-bg p-6 text-center">
        <h1 className="text-lg font-semibold text-fg">Pegawai tidak ditemukan</h1>
        <p className="text-sm text-muted-fg">{nip} tidak terdaftar.</p>
      </div>
    );
  }
  const pegawai = q.data;
  const guruActive = apiIsGuru(pegawai);
  const staffActive = apiIsStaff(pegawai);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "profil", label: "Profil" },
    ...(guruActive ? [{ key: "mengajar" as const, label: "Mengajar" }] : []),
    ...(staffActive ? [{ key: "staff" as const, label: "Kepegawaian Staff" }] : []),
    { key: "berkas", label: "Berkas" },
    { key: "kehadiran", label: "Kehadiran" },
  ];

  const initial: TabKey = guruActive ? "mengajar" : staffActive ? "staff" : "profil";
  const [active, setActive] = useState<TabKey>(initial);

  return (
    <div className="space-y-4">
      <ApiPegawaiHeader pegawai={pegawai} />

      <div className="border-b border-border flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={`px-3 py-2 text-sm border-b-2 ${active === t.key ? "border-brand text-brand" : "border-transparent text-muted-fg hover:text-fg"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === "profil" ? <ApiProfilTab pegawai={pegawai} /> : null}
      {active === "mengajar" ? <ApiMengajarTab pegawai={pegawai} /> : null}
      {active === "staff" ? <ApiStaffTab pegawai={pegawai} /> : null}
      {active === "berkas" ? <ApiBerkasSection pegawai={pegawai} /> : null}
      {active === "kehadiran" ? <ApiKehadiranSection pegawai={pegawai} /> : null}
    </div>
  );
}
```

- [ ] **Step 2: Create stub tab components**

Implement `ApiMengajarTab`, `ApiStaffTab`, `ApiBerkasSection`, `ApiKehadiranSection` as minimum-viable stubs that query the relevant child resources by `pegawai.name`. For Phase D MVP, each shows a "Memuat" / "Belum ada data" state plus a table.

```tsx
// apps/school/src/features/pegawai/ApiMengajarTab.tsx
import { useResourceList } from "@sekolahpro/api-client";
import type { PegawaiApi } from "./roles";

type MapelRow = { name: string; mata_pelajaran?: string };

export function ApiMengajarTab({ pegawai }: { pegawai: PegawaiApi }) {
  const q = useResourceList<MapelRow>("Mapel Pengampu Guru", {
    fields: ["name", "mata_pelajaran"],
    filters: { parent: pegawai.name },
    limit_page_length: 100,
  });
  const rows = q.data ?? [];
  return (
    <section className="rounded-lg border border-border bg-bg p-4">
      <h2 className="text-sm font-semibold text-fg mb-2">Mata Pelajaran Pengampu</h2>
      {q.isLoading ? <div className="text-sm text-muted-fg">Memuat...</div> : null}
      {!q.isLoading && rows.length === 0 ? <div className="text-sm text-muted-fg">Belum ada data.</div> : null}
      <ul className="text-sm">
        {rows.map((r) => <li key={r.name}>{r.mata_pelajaran ?? r.name}</li>)}
      </ul>
    </section>
  );
}
```

```tsx
// apps/school/src/features/pegawai/ApiStaffTab.tsx
import type { PegawaiApi } from "./roles";

export function ApiStaffTab({ pegawai }: { pegawai: PegawaiApi }) {
  return (
    <section className="rounded-lg border border-border bg-bg p-4">
      <h2 className="text-sm font-semibold text-fg mb-2">Kepegawaian Staff</h2>
      <dl className="grid grid-cols-[160px_1fr] gap-y-1 text-sm">
        <dt className="text-muted-fg">Jabatan fungsional</dt><dd>{pegawai.jabatan_fungsional ?? "—"}</dd>
        <dt className="text-muted-fg">Status kepegawaian</dt><dd>{pegawai.status_kepegawaian ?? "—"}</dd>
      </dl>
    </section>
  );
}
```

```tsx
// apps/school/src/features/pegawai/ApiBerkasSection.tsx
import { useResourceList } from "@sekolahpro/api-client";
import type { PegawaiApi } from "./roles";

type BerkasRow = { name: string; jenis_berkas?: string; tanggal_unggah?: string };

export function ApiBerkasSection({ pegawai }: { pegawai: PegawaiApi }) {
  const q = useResourceList<BerkasRow>("Berkas Guru", {
    fields: ["name", "jenis_berkas", "tanggal_unggah"],
    filters: { pegawai: pegawai.name },
    limit_page_length: 100,
  });
  const rows = q.data ?? [];
  return (
    <section className="rounded-lg border border-border bg-bg p-4">
      <h2 className="text-sm font-semibold text-fg mb-2">Berkas</h2>
      {q.isLoading ? <div className="text-sm text-muted-fg">Memuat...</div> : null}
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-fg">
          <tr><th className="text-left p-1">Nama</th><th className="text-left p-1">Jenis</th><th className="text-left p-1">Diunggah</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-t border-border">
              <td className="p-1">{r.name}</td><td className="p-1">{r.jenis_berkas ?? "—"}</td><td className="p-1">{r.tanggal_unggah ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!q.isLoading && rows.length === 0 ? <div className="text-sm text-muted-fg">Belum ada berkas.</div> : null}
    </section>
  );
}
```

```tsx
// apps/school/src/features/pegawai/ApiKehadiranSection.tsx
import { useResourceList } from "@sekolahpro/api-client";
import type { PegawaiApi } from "./roles";

type AbsensiRow = { name: string; tanggal?: string; status_kehadiran?: string };

export function ApiKehadiranSection({ pegawai }: { pegawai: PegawaiApi }) {
  const q = useResourceList<AbsensiRow>("Detail Absensi Guru", {
    fields: ["name", "tanggal", "status_kehadiran"],
    filters: { pegawai: pegawai.name },
    order_by: "tanggal desc",
    limit_page_length: 30,
  });
  const rows = q.data ?? [];
  return (
    <section className="rounded-lg border border-border bg-bg p-4">
      <h2 className="text-sm font-semibold text-fg mb-2">Kehadiran (30 terakhir)</h2>
      {q.isLoading ? <div className="text-sm text-muted-fg">Memuat...</div> : null}
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-fg">
          <tr><th className="text-left p-1">Tanggal</th><th className="text-left p-1">Status</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-t border-border">
              <td className="p-1">{r.tanggal ?? "—"}</td><td className="p-1">{r.status_kehadiran ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!q.isLoading && rows.length === 0 ? <div className="text-sm text-muted-fg">Belum ada catatan kehadiran.</div> : null}
    </section>
  );
}
```

**NOTE on Berkas Guru / Detail Absensi Guru parent field:** these sibling doctypes still use the field name `guru` (Link to Pegawai) post-Phase A — only the Link's `options` changed. The filter key here uses `pegawai` as a guess; if the actual field name is still `guru`, edit the filter to `{ guru: pegawai.name }`. Subagent must read the doctype JSON before finalizing:

```bash
grep -E '"fieldname":\s*"(guru|pegawai)"' /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro/.claude/worktrees/pegawai-rename-claude/sekolahpro/akademik/doctype/berkas_guru/berkas_guru.json
```

Use whatever fieldname surfaces. Same for `detail_absensi_guru` and `mapel_pengampu_guru`.

- [ ] **Step 3: Typecheck**

```
pnpm --filter @sekolahpro/app-school typecheck 2>&1 | grep -E "(staff.\\\$nip|features/pegawai/Api)" || echo ok
```
Expected: `ok`.

- [ ] **Step 4: Commit**

```
git add apps/school/src/routes/\$sekolah.staff.\$nip.tsx apps/school/src/features/pegawai/Api*.tsx
git commit -m "feat(school): /staff/\$nip Pegawai detail with role-conditional tabs (real API)"
```

---

## Task PD-5: Move guru sub-routes into `/staff` namespace

**Files:**
- Create: `apps/school/src/routes/$sekolah.staff.mapel-pengampu.tsx`
- Create: `apps/school/src/routes/$sekolah.staff.penugasan.tsx`
- Create: `apps/school/src/routes/$sekolah.staff.sk-mengajar.tsx`

- [ ] **Step 1: For each new file, copy from the legacy `$sekolah.guru.<name>.tsx`**

```bash
cp apps/school/src/routes/\$sekolah.guru.mapel-pengampu.tsx apps/school/src/routes/\$sekolah.staff.mapel-pengampu.tsx
cp apps/school/src/routes/\$sekolah.guru.penugasan.tsx apps/school/src/routes/\$sekolah.staff.penugasan.tsx
cp apps/school/src/routes/\$sekolah.guru.sk-mengajar.tsx apps/school/src/routes/\$sekolah.staff.sk-mengajar.tsx
```

- [ ] **Step 2: In each copy, update the route path and Pegawai references**

For each file:
- `createFileRoute("/$sekolah/guru/<name>")` → `createFileRoute("/$sekolah/staff/<name>")`
- Any `useResourceList<GuruRow>("Guru", ...)` → `useResourceList<PegawaiApi>("Pegawai", ...)` (import `PegawaiApi` from `../features/pegawai/roles`)
- If a query filters child rows by `guru` field name, leave field name alone (Phase B handles sibling field renames). Only the doctype `"Guru"` → `"Pegawai"` and `tabGuru` → `tabPegawai` change.
- Any imports from `../data/guru` → `../data/pegawai`

- [ ] **Step 3: Typecheck**

```
pnpm --filter @sekolahpro/app-school typecheck 2>&1 | grep "staff.\\(mapel-pengampu\\|penugasan\\|sk-mengajar\\)" || echo ok
```
Expected: `ok`.

- [ ] **Step 4: Commit**

```
git add apps/school/src/routes/\$sekolah.staff.mapel-pengampu.tsx apps/school/src/routes/\$sekolah.staff.penugasan.tsx apps/school/src/routes/\$sekolah.staff.sk-mengajar.tsx
git commit -m "feat(school): move guru sub-routes (mapel, penugasan, sk-mengajar) under /staff with Pegawai backing"
```

---

## Task PD-6: Repoint `$sekolah.staff.{berkas,jabatan,sk-jabatan}.tsx` to Pegawai

**Files:**
- Modify: `apps/school/src/routes/$sekolah.staff.berkas.tsx`
- Modify: `apps/school/src/routes/$sekolah.staff.jabatan.tsx`
- Modify: `apps/school/src/routes/$sekolah.staff.sk-jabatan.tsx`

- [ ] **Step 1: For each file, update queries**

Replace any `useResourceList<...>("Guru", ...)` or `useResourceList<...>("Staff", ...)` with `useResourceList<PegawaiApi>("Pegawai", ...)`. Replace any mock imports from `../data/guru` or `../data/staff` with `../data/pegawai` (or the real API via `useResourceList`).

For sibling doctype queries (`SK Jabatan`, `Berkas Guru`), the doctype strings stay (Phase B), but their Link options now point at Pegawai — so where the page filters by `guru: someName`, leave the field name `guru` alone (Phase B), only confirm the value is a Pegawai name now.

- [ ] **Step 2: Typecheck + commit**

```
pnpm --filter @sekolahpro/app-school typecheck 2>&1 | grep "staff.\\(berkas\\|jabatan\\|sk-jabatan\\)" || echo ok
git add apps/school/src/routes/\$sekolah.staff.berkas.tsx apps/school/src/routes/\$sekolah.staff.jabatan.tsx apps/school/src/routes/\$sekolah.staff.sk-jabatan.tsx
git commit -m "feat(school): repoint /staff/{berkas,jabatan,sk-jabatan} to Pegawai queries"
```

---

## Task PD-7: Update sidebar + ROLE_MENU_MAP + GlobalSearch + global-search.ts

**Files:**
- Modify: `apps/school/src/routes/__root.tsx`
- Modify: `apps/school/src/lib/global-search.ts`

- [ ] **Step 1: Sidebar — merge "Guru" + "Staff" into "Guru & Staff"**

In `rawSections` "Utama" section, replace:
```tsx
mk("/guru", "Guru", <IconGrad />),
mk("/staff", "Staff", <IconId />),
```
With:
```tsx
mk("/staff", "Guru & Staff", <IconGrad />),
```

- [ ] **Step 2: `ROLE_MENU_MAP`**

In `kepala_sekolah`, remove `"/guru"` (keep `"/staff"`).
In `operator`, replace `"/guru"` with `"/staff"`.
`guru` role unchanged (it doesn't list `/guru` or `/staff`).

- [ ] **Step 3: Search placeholder**

`placeholder="Cari siswa, guru, kelas..."` → `placeholder="Cari siswa, pegawai, kelas..."` (one occurrence inside `GlobalSearch`).
`Ketik minimal {SEARCH_MIN_QUERY} karakter untuk mencari siswa, guru, atau kelas.` → `... mencari siswa, pegawai, atau kelas.`

- [ ] **Step 4: `lib/global-search.ts`**

Read the file. Replace `import { GURU_LIST } from "../data/guru";` (if present) with `import { PEGAWAI_LIST, isGuru, isStaff } from "../data/pegawai";`. Where `GURU_LIST` is iterated, iterate `PEGAWAI_LIST`. For each pegawai:
- Emit a hit with `category: "Guru"` if `isGuru(p)`, `href: "/staff/" + p.nip`.
- Additionally emit `category: "Staff"` if `isStaff(p)`, same href (dual-role yields two hits).
- Adjust hit `id` to `"pegawai:" + p.nip`.

Note: `lib/global-search.ts` uses the mock fixtures because there is no streaming search API. This keeps Phase D's global search wired to the same mock data — fine for this PR.

- [ ] **Step 5: Typecheck + commit**

```
pnpm --filter @sekolahpro/app-school typecheck 2>&1 | grep -E "__root|global-search" || echo ok
git add apps/school/src/routes/__root.tsx apps/school/src/lib/global-search.ts
git commit -m "feat(school): merge sidebar Guru+Staff into /staff, repoint search to PEGAWAI_LIST"
```

---

## Task PD-8: Delete legacy `/guru` routes + final cleanup

**Files:**
- Delete: `apps/school/src/routes/$sekolah.guru.*.tsx` (11 files)

- [ ] **Step 1: Confirm no remaining importers**

```
grep -rln "\\$sekolah.guru\\|/guru\"" apps/school/src/ --include="*.tsx" --include="*.ts" | grep -v "guru:\\|GuruRow\\|guru_" | head -10
```
Expected: zero hits.

- [ ] **Step 2: Delete files**

```bash
git rm apps/school/src/routes/\$sekolah.guru.tsx
git rm apps/school/src/routes/\$sekolah.guru.index.tsx
git rm apps/school/src/routes/\$sekolah.guru.daftar.tsx
git rm apps/school/src/routes/\$sekolah.guru.berkas.tsx
git rm apps/school/src/routes/\$sekolah.guru.jabatan.tsx
git rm apps/school/src/routes/\$sekolah.guru.sk-jabatan.tsx
git rm apps/school/src/routes/\$sekolah.guru.mapel-pengampu.tsx
git rm apps/school/src/routes/\$sekolah.guru.penugasan.tsx
git rm apps/school/src/routes/\$sekolah.guru.sk-mengajar.tsx
git rm apps/school/src/routes/\$sekolah.guru.\$nip.tsx
```

- [ ] **Step 3: Repoint `absensi.guru.tsx` if it imports from `data/guru`**

```
grep -l "data/guru" apps/school/src/routes/\$sekolah.absensi.guru.tsx 2>/dev/null
```
If output non-empty, edit: replace `data/guru` imports with `data/pegawai` + `isGuru` filter for the guru subset.

- [ ] **Step 4: Repoint other importers of `data/guru` / `data/staff`**

```
grep -rln "from .*data/guru\\|from .*data/staff" apps/school/src/ --include="*.ts" --include="*.tsx"
```
Repoint each to `data/pegawai`. Then delete the mock files:

```bash
git rm apps/school/src/data/guru.ts
git rm apps/school/src/data/staff.ts
```

- [ ] **Step 5: Full typecheck + test + lint**

```
pnpm --filter @sekolahpro/app-school typecheck 2>&1 | tail -10
pnpm --filter @sekolahpro/app-school test 2>&1 | tail -5
pnpm --filter @sekolahpro/app-school lint 2>&1 | tail -5
```
All must pass. Fix any fallout inline.

- [ ] **Step 6: Commit**

```
git add -u
git commit -m "feat(school): remove legacy /guru route tree + mock data, complete Pegawai merge"
```

---

## Spec Coverage

| Spec section | Task |
| --- | --- |
| Single `/staff` namespace | PD-2 (layout), PD-3, PD-4, PD-5, PD-6 |
| Role chips (semua/guru/staff/dual) | PD-3 |
| Detail page conditional tabs | PD-4 |
| Real Pegawai API queries (not mock) | PD-2, PD-3, PD-4 |
| Sub-routes under /staff | PD-5, PD-6 |
| Sidebar merge | PD-7 |
| ROLE_MENU_MAP cleanup | PD-7 |
| Global search Pegawai | PD-7 |
| Legacy /guru routes deletion | PD-8 |
| Legacy mock `data/guru.ts`/`data/staff.ts` deletion | PD-8 |
