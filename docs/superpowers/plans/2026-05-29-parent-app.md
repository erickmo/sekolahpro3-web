# Parent App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `@sekolahpro/app-parent` SPA under `apps/parent/` so a parent (wali) can view dashboard, jadwal, nilai, absensi, pesan, and pembayaran for every child linked to their Frappe account, with a header child switcher.

**Architecture:** Mirror `apps/student/` skeleton. Add `ActiveChildProvider` context + `<ChildSwitcher>` in topbar. Per-child queries hit new whitelisted Frappe methods under `sekolahpro.api.parent.*` — gated by `VITE_USE_MOCKS=true` fixtures until backend ships. React Query cache partitions per child automatically via query keys.

**Tech Stack:** React 18, TanStack Router v1, TanStack Query v5, Vite 5, Tailwind 3, TypeScript 5, pnpm workspaces + Turborepo, Vitest. Workspace packages: `@sekolahpro/{api-client,auth,config,tenant,ui}`.

**Spec:** `docs/superpowers/specs/2026-05-29-parent-app-design.md`

---

## File Structure

Created files:
```
apps/parent/
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ tailwind.config.js
├─ postcss.config.js
├─ index.html
└─ src/
   ├─ main.tsx
   ├─ styles.css
   ├─ vite-env.d.ts
   ├─ routeTree.gen.ts           (generated — do not hand-edit)
   ├─ data/
   │  ├─ types.ts
   │  ├─ children.ts
   │  ├─ dashboard.ts
   │  ├─ jadwal.ts
   │  ├─ nilai.ts
   │  ├─ absensi.ts
   │  ├─ pesan.ts
   │  ├─ tagihan.ts
   │  ├─ notifikasi.ts
   │  └─ mock/index.ts
   ├─ lib/
   │  ├─ activeChild.tsx
   │  └─ __tests__/activeChild.test.tsx
   ├─ components/
   │  ├─ ChildSwitcher.tsx
   │  └─ __tests__/ChildSwitcher.test.tsx
   └─ routes/
      ├─ __root.tsx
      ├─ login.tsx
      ├─ index.tsx
      ├─ jadwal.tsx
      ├─ nilai.tsx
      ├─ absensi.tsx
      ├─ pesan.tsx
      ├─ pembayaran.tsx
      └─ profil.tsx
```

Modified files: none required (root `pnpm-workspace.yaml` already globs `apps/*`).

---

### Task 1: Scaffold workspace + package.json

**Files:**
- Create: `apps/parent/package.json`

- [ ] **Step 1: Create package manifest**

```json
{
  "name": "@sekolahpro/app-parent",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "lint": "ESLINT_USE_FLAT_CONFIG=true eslint 'src/**/*.{ts,tsx}'",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --passWithNoTests"
  },
  "dependencies": {
    "@sekolahpro/api-client": "workspace:*",
    "@sekolahpro/auth": "workspace:*",
    "@sekolahpro/config": "workspace:*",
    "@sekolahpro/tenant": "workspace:*",
    "@sekolahpro/ui": "workspace:*",
    "@tanstack/react-query": "^5.51.0",
    "@tanstack/react-router": "^1.45.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@sekolahpro/tsconfig": "workspace:*",
    "@tanstack/router-vite-plugin": "^1.45.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "jsdom": "^24.0.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "vite": "^5.3.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Install + verify workspace picks app up**

Run: `pnpm install`
Expected: `+ @sekolahpro/app-parent 0.0.0` in install output, no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/parent/package.json pnpm-lock.yaml
git commit -m "feat(parent): scaffold app-parent workspace package"
```

---

### Task 2: Build configs (vite, tsconfig, tailwind, postcss, html, styles)

**Files:**
- Create: `apps/parent/vite.config.ts`
- Create: `apps/parent/tsconfig.json`
- Create: `apps/parent/tailwind.config.js`
- Create: `apps/parent/postcss.config.js`
- Create: `apps/parent/index.html`
- Create: `apps/parent/src/styles.css`
- Create: `apps/parent/src/vite-env.d.ts`

- [ ] **Step 1: vite.config.ts**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";

export default defineConfig({
  plugins: [TanStackRouterVite(), react()],
  base: process.env.VITE_BASE_PATH ?? "/",
  server: {
    port: 5184,
    host: "0.0.0.0",
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        headers: { Host: "sekolahpro.localhost" },
        cookieDomainRewrite: { "*": "" },
        cookiePathRewrite: { "*": "/" },
      },
      "/assets": {
        target: "http://localhost:8080",
        changeOrigin: true,
        headers: { Host: "sekolahpro.localhost" },
        cookieDomainRewrite: { "*": "" },
        cookiePathRewrite: { "*": "/" },
      },
    },
  },
  build: { outDir: "dist", sourcemap: true },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
```

- [ ] **Step 2: tsconfig.json**

```json
{ "extends": "@sekolahpro/tsconfig/react.json", "include": ["src"] }
```

- [ ] **Step 3: tailwind.config.js**

```js
import preset from "@sekolahpro/ui/tailwind-preset";
export default {
  presets: [preset],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};
```

- [ ] **Step 4: postcss.config.js**

```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

- [ ] **Step 5: index.html**

```html
<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SekolahPro · Orang Tua</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: src/styles.css**

```css
@import "@sekolahpro/config/tokens.css";
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 7: src/vite-env.d.ts**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 8: Commit**

```bash
git add apps/parent/{vite.config.ts,tsconfig.json,tailwind.config.js,postcss.config.js,index.html,src/styles.css,src/vite-env.d.ts}
git commit -m "feat(parent): add build configs and html entry"
```

---

### Task 3: Domain types

**Files:**
- Create: `apps/parent/src/data/types.ts`

- [ ] **Step 1: Define wire + UI types**

```ts
export interface ChildSummary {
  nis: string;
  nama: string;
  kelas: string;
  sekolahId: string;
  avatarUrl: string | null;
}

export interface ChildDashboard {
  rerataNilai: string;
  kehadiranPct: string;
  tugasPending: number;
  infoTerkini: Array<{ id: string; title: string; body: string; ago: string }>;
}

export interface JadwalItem {
  id: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  mapel: string;
  guru: string;
  ruang: string;
}

export interface NilaiItem {
  id: string;
  mapel: string;
  semester: string;
  nilaiAngka: number;
  nilaiHuruf: string;
  catatan: string | null;
}

export interface AbsensiItem {
  id: string;
  tanggal: string;
  status: "hadir" | "izin" | "sakit" | "alpa";
  catatan: string | null;
}

export interface PesanItem {
  id: string;
  nis: string | null;
  pengirim: string;
  judul: string;
  isi: string;
  dikirim: string;
  dibaca: boolean;
}

export interface TagihanItem {
  id: string;
  nis: string;
  judul: string;
  jumlah: number;
  jatuhTempo: string;
  status: "lunas" | "belum_lunas" | "terlambat";
}

export interface TagihanDetail extends TagihanItem {
  rincian: Array<{ label: string; jumlah: number }>;
  metodePembayaran: string[];
  catatan: string | null;
}
```

- [ ] **Step 2: typecheck**

Run: `pnpm --filter @sekolahpro/app-parent typecheck`
Expected: PASS (no source consumers yet, types compile clean).

- [ ] **Step 3: Commit**

```bash
git add apps/parent/src/data/types.ts
git commit -m "feat(parent): define wire and UI types"
```

---

### Task 4: Mock fixtures

**Files:**
- Create: `apps/parent/src/data/mock/index.ts`
- Create: `apps/parent/src/data/notifikasi.ts`

- [ ] **Step 1: mock/index.ts**

```ts
import type {
  ChildSummary, ChildDashboard, JadwalItem, NilaiItem,
  AbsensiItem, PesanItem, TagihanItem, TagihanDetail,
} from "../types";

const childA: ChildSummary = { nis: "1001", nama: "Andi Pratama", kelas: "XI IPA 2", sekolahId: "SMK01", avatarUrl: null };
const childB: ChildSummary = { nis: "1002", nama: "Bunga Pratami", kelas: "VIII B", sekolahId: "SMK01", avatarUrl: null };

export const mockChildren: ChildSummary[] = [childA, childB];

export const mockDashboard: Record<string, ChildDashboard> = {
  "1001": {
    rerataNilai: "87,5", kehadiranPct: "98%", tugasPending: 3,
    infoTerkini: [
      { id: "i1", title: "Nilai Matematika diumumkan", body: "Skor 92 (A)", ago: "1 hari lalu" },
    ],
  },
  "1002": {
    rerataNilai: "82,1", kehadiranPct: "95%", tugasPending: 1,
    infoTerkini: [
      { id: "i2", title: "Rapat orang tua", body: "Sabtu 09:00", ago: "2 hari lalu" },
    ],
  },
};

export const mockJadwal: Record<string, JadwalItem[]> = {
  "1001": [
    { id: "j1", hari: "Senin", jamMulai: "07:30", jamSelesai: "09:00", mapel: "Matematika", guru: "Bu Siti", ruang: "R. 204" },
    { id: "j2", hari: "Senin", jamMulai: "09:00", jamSelesai: "10:30", mapel: "Fisika", guru: "Pak Andi", ruang: "Lab Fisika" },
  ],
  "1002": [
    { id: "j3", hari: "Senin", jamMulai: "07:30", jamSelesai: "09:00", mapel: "IPA", guru: "Bu Rina", ruang: "R. 101" },
  ],
};

export const mockNilai: Record<string, NilaiItem[]> = {
  "1001": [
    { id: "n1", mapel: "Matematika", semester: "Ganjil 2025/2026", nilaiAngka: 92, nilaiHuruf: "A", catatan: null },
    { id: "n2", mapel: "Fisika", semester: "Ganjil 2025/2026", nilaiAngka: 85, nilaiHuruf: "B+", catatan: null },
  ],
  "1002": [
    { id: "n3", mapel: "IPA", semester: "Ganjil 2025/2026", nilaiAngka: 80, nilaiHuruf: "B+", catatan: null },
  ],
};

export const mockAbsensi: Record<string, AbsensiItem[]> = {
  "1001": [
    { id: "a1", tanggal: "2026-05-26", status: "hadir", catatan: null },
    { id: "a2", tanggal: "2026-05-27", status: "izin", catatan: "Acara keluarga" },
  ],
  "1002": [
    { id: "a3", tanggal: "2026-05-26", status: "hadir", catatan: null },
  ],
};

export const mockPesan: PesanItem[] = [
  { id: "p1", nis: "1001", pengirim: "Wali Kelas XI IPA 2", judul: "Pengumuman rapat orang tua", isi: "Sabtu pukul 09:00 di aula.", dikirim: "2026-05-27", dibaca: false },
  { id: "p2", nis: "1002", pengirim: "Tata Usaha", judul: "Tagihan SPP Mei", isi: "Mohon dilunasi sebelum tanggal 30.", dikirim: "2026-05-26", dibaca: true },
  { id: "p3", nis: null, pengirim: "Kepala Sekolah", judul: "Libur nasional", isi: "Senin libur — Hari Raya.", dikirim: "2026-05-25", dibaca: true },
];

export const mockTagihan: TagihanItem[] = [
  { id: "t1", nis: "1001", judul: "SPP Mei 2026", jumlah: 750000, jatuhTempo: "2026-05-30", status: "belum_lunas" },
  { id: "t2", nis: "1002", judul: "SPP Mei 2026", jumlah: 600000, jatuhTempo: "2026-05-30", status: "lunas" },
];

export const mockTagihanDetail: Record<string, TagihanDetail> = {
  t1: {
    ...mockTagihan[0],
    rincian: [
      { label: "SPP bulanan", jumlah: 700000 },
      { label: "Ekstrakurikuler", jumlah: 50000 },
    ],
    metodePembayaran: ["Transfer Bank", "Virtual Account"],
    catatan: null,
  },
  t2: {
    ...mockTagihan[1],
    rincian: [{ label: "SPP bulanan", jumlah: 600000 }],
    metodePembayaran: ["Transfer Bank"],
    catatan: "Sudah lunas via VA.",
  },
};
```

- [ ] **Step 2: notifikasi.ts (copy student pattern, parent-themed)**

```ts
export type NotifikasiTone = "info" | "warning" | "success";

export interface NotifikasiItem {
  id: string;
  title: string;
  body: string;
  ago: string;
  tone: NotifikasiTone;
  read: boolean;
}

export const notifikasiOrangTua: NotifikasiItem[] = [
  { id: "n1", title: "Tagihan SPP jatuh tempo", body: "Andi — SPP Mei jatuh tempo 30 Mei.", ago: "1 hari lalu", tone: "warning", read: false },
  { id: "n2", title: "Nilai Matematika diumumkan", body: "Andi: 92 (A).", ago: "2 hari lalu", tone: "success", read: false },
  { id: "n3", title: "Rapat orang tua", body: "Sabtu 09:00 di aula.", ago: "3 hari lalu", tone: "info", read: true },
];
```

- [ ] **Step 3: typecheck**

Run: `pnpm --filter @sekolahpro/app-parent typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/parent/src/data/mock apps/parent/src/data/notifikasi.ts
git commit -m "feat(parent): add mock fixtures and notifikasi data"
```

---

### Task 5: Data hooks (children + per-child + parent-wide)

**Files:**
- Create: `apps/parent/src/data/children.ts`
- Create: `apps/parent/src/data/dashboard.ts`
- Create: `apps/parent/src/data/jadwal.ts`
- Create: `apps/parent/src/data/nilai.ts`
- Create: `apps/parent/src/data/absensi.ts`
- Create: `apps/parent/src/data/pesan.ts`
- Create: `apps/parent/src/data/tagihan.ts`

Each hook checks `import.meta.env.VITE_USE_MOCKS === "true"` and returns mock fixture via `useQuery`. Real path uses `useFrappeMethod`. Snake_case → camelCase mapping in the wire→UI layer.

- [ ] **Step 1: children.ts**

```ts
import { useQuery } from "@tanstack/react-query";
import { useFrappeMethod } from "@sekolahpro/api-client";
import type { ChildSummary } from "./types";
import { mockChildren } from "./mock";

interface WireChild {
  nis: string;
  nama: string;
  kelas: string;
  sekolah_id: string;
  avatar_url: string | null;
}

const METHOD = "sekolahpro.api.parent.list_children";
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

function fromWire(w: WireChild): ChildSummary {
  return {
    nis: w.nis,
    nama: w.nama,
    kelas: w.kelas,
    sekolahId: w.sekolah_id,
    avatarUrl: w.avatar_url,
  };
}

export function useChildren() {
  const real = useFrappeMethod<WireChild[]>(METHOD, {}, { enabled: !USE_MOCKS });
  const mock = useQuery<ChildSummary[]>({
    queryKey: [METHOD, "mock"],
    queryFn: async () => mockChildren,
    enabled: USE_MOCKS,
    staleTime: Infinity,
  });
  if (USE_MOCKS) return mock;
  return {
    ...real,
    data: real.data?.map(fromWire),
  } as typeof mock;
}
```

- [ ] **Step 2: dashboard.ts**

```ts
import { useQuery } from "@tanstack/react-query";
import { useFrappeMethod } from "@sekolahpro/api-client";
import type { ChildDashboard } from "./types";
import { mockDashboard } from "./mock";

interface WireDashboard {
  rerata_nilai: string;
  kehadiran_pct: string;
  tugas_pending: number;
  info_terkini: Array<{ id: string; title: string; body: string; ago: string }>;
}

const METHOD = "sekolahpro.api.parent.child_dashboard";
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

function fromWire(w: WireDashboard): ChildDashboard {
  return {
    rerataNilai: w.rerata_nilai,
    kehadiranPct: w.kehadiran_pct,
    tugasPending: w.tugas_pending,
    infoTerkini: w.info_terkini,
  };
}

export function useChildDashboard(nis: string | null) {
  const real = useFrappeMethod<WireDashboard>(METHOD, { nis }, { enabled: !USE_MOCKS && !!nis });
  const mock = useQuery<ChildDashboard | undefined>({
    queryKey: [METHOD, { nis }, "mock"],
    queryFn: async () => (nis ? mockDashboard[nis] : undefined),
    enabled: USE_MOCKS && !!nis,
    staleTime: Infinity,
  });
  if (USE_MOCKS) return mock;
  return { ...real, data: real.data ? fromWire(real.data) : undefined } as typeof mock;
}
```

- [ ] **Step 3: jadwal.ts**

```ts
import { useQuery } from "@tanstack/react-query";
import { useFrappeMethod } from "@sekolahpro/api-client";
import type { JadwalItem } from "./types";
import { mockJadwal } from "./mock";

interface WireJadwal {
  id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  mapel: string;
  guru: string;
  ruang: string;
}

const METHOD = "sekolahpro.api.parent.child_jadwal";
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

function fromWire(w: WireJadwal): JadwalItem {
  return {
    id: w.id, hari: w.hari, jamMulai: w.jam_mulai, jamSelesai: w.jam_selesai,
    mapel: w.mapel, guru: w.guru, ruang: w.ruang,
  };
}

export function useChildJadwal(nis: string | null, week?: string) {
  const real = useFrappeMethod<WireJadwal[]>(METHOD, { nis, week }, { enabled: !USE_MOCKS && !!nis });
  const mock = useQuery<JadwalItem[]>({
    queryKey: [METHOD, { nis, week }, "mock"],
    queryFn: async () => (nis ? mockJadwal[nis] ?? [] : []),
    enabled: USE_MOCKS && !!nis,
    staleTime: Infinity,
  });
  if (USE_MOCKS) return mock;
  return { ...real, data: real.data?.map(fromWire) } as typeof mock;
}
```

- [ ] **Step 4: nilai.ts**

```ts
import { useQuery } from "@tanstack/react-query";
import { useFrappeMethod } from "@sekolahpro/api-client";
import type { NilaiItem } from "./types";
import { mockNilai } from "./mock";

interface WireNilai {
  id: string; mapel: string; semester: string;
  nilai_angka: number; nilai_huruf: string; catatan: string | null;
}

const METHOD = "sekolahpro.api.parent.child_nilai";
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

function fromWire(w: WireNilai): NilaiItem {
  return {
    id: w.id, mapel: w.mapel, semester: w.semester,
    nilaiAngka: w.nilai_angka, nilaiHuruf: w.nilai_huruf, catatan: w.catatan,
  };
}

export function useChildNilai(nis: string | null, semester?: string) {
  const real = useFrappeMethod<WireNilai[]>(METHOD, { nis, semester }, { enabled: !USE_MOCKS && !!nis });
  const mock = useQuery<NilaiItem[]>({
    queryKey: [METHOD, { nis, semester }, "mock"],
    queryFn: async () => (nis ? mockNilai[nis] ?? [] : []),
    enabled: USE_MOCKS && !!nis,
    staleTime: Infinity,
  });
  if (USE_MOCKS) return mock;
  return { ...real, data: real.data?.map(fromWire) } as typeof mock;
}
```

- [ ] **Step 5: absensi.ts**

```ts
import { useQuery } from "@tanstack/react-query";
import { useFrappeMethod } from "@sekolahpro/api-client";
import type { AbsensiItem } from "./types";
import { mockAbsensi } from "./mock";

const METHOD = "sekolahpro.api.parent.child_absensi";
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export function useChildAbsensi(nis: string | null, month?: string) {
  const real = useFrappeMethod<AbsensiItem[]>(METHOD, { nis, month }, { enabled: !USE_MOCKS && !!nis });
  const mock = useQuery<AbsensiItem[]>({
    queryKey: [METHOD, { nis, month }, "mock"],
    queryFn: async () => (nis ? mockAbsensi[nis] ?? [] : []),
    enabled: USE_MOCKS && !!nis,
    staleTime: Infinity,
  });
  return USE_MOCKS ? mock : real;
}
```

- [ ] **Step 6: pesan.ts**

```ts
import { useQuery } from "@tanstack/react-query";
import { useFrappeMethod } from "@sekolahpro/api-client";
import type { PesanItem } from "./types";
import { mockPesan } from "./mock";

const METHOD = "sekolahpro.api.parent.list_pesan";
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export function usePesanList() {
  const real = useFrappeMethod<PesanItem[]>(METHOD, {}, { enabled: !USE_MOCKS });
  const mock = useQuery<PesanItem[]>({
    queryKey: [METHOD, "mock"],
    queryFn: async () => mockPesan,
    enabled: USE_MOCKS,
    staleTime: Infinity,
  });
  return USE_MOCKS ? mock : real;
}
```

- [ ] **Step 7: tagihan.ts**

```ts
import { useQuery } from "@tanstack/react-query";
import { useFrappeMethod } from "@sekolahpro/api-client";
import type { TagihanItem, TagihanDetail } from "./types";
import { mockTagihan, mockTagihanDetail } from "./mock";

const LIST_METHOD = "sekolahpro.api.parent.list_tagihan";
const DETAIL_METHOD = "sekolahpro.api.parent.tagihan_detail";
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export function useTagihanList(nis?: string) {
  const real = useFrappeMethod<TagihanItem[]>(LIST_METHOD, { nis }, { enabled: !USE_MOCKS });
  const mock = useQuery<TagihanItem[]>({
    queryKey: [LIST_METHOD, { nis }, "mock"],
    queryFn: async () => (nis ? mockTagihan.filter((t) => t.nis === nis) : mockTagihan),
    enabled: USE_MOCKS,
    staleTime: Infinity,
  });
  return USE_MOCKS ? mock : real;
}

export function useTagihanDetail(id: string | null) {
  const real = useFrappeMethod<TagihanDetail>(DETAIL_METHOD, { id }, { enabled: !USE_MOCKS && !!id });
  const mock = useQuery<TagihanDetail | undefined>({
    queryKey: [DETAIL_METHOD, { id }, "mock"],
    queryFn: async () => (id ? mockTagihanDetail[id] : undefined),
    enabled: USE_MOCKS && !!id,
    staleTime: Infinity,
  });
  return USE_MOCKS ? mock : real;
}
```

- [ ] **Step 8: typecheck**

Run: `pnpm --filter @sekolahpro/app-parent typecheck`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/parent/src/data/{children,dashboard,jadwal,nilai,absensi,pesan,tagihan}.ts
git commit -m "feat(parent): add data hooks with mock fallback"
```

---

### Task 6: ActiveChildProvider (test-first)

**Files:**
- Test: `apps/parent/src/lib/__tests__/activeChild.test.tsx`
- Create: `apps/parent/src/lib/activeChild.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ActiveChildProvider, useActiveChild } from "../activeChild";

function Probe() {
  const { activeNis, setActiveNis, children, isLoading } = useActiveChild();
  return (
    <div>
      <span data-testid="nis">{activeNis ?? "none"}</span>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="count">{children.length}</span>
      <button onClick={() => setActiveNis("1002")}>switch</button>
    </div>
  );
}

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}><ActiveChildProvider>{ui}</ActiveChildProvider></QueryClientProvider>);
}

describe("ActiveChildProvider", () => {
  beforeEach(() => {
    sessionStorage.clear();
    import.meta.env.VITE_USE_MOCKS = "true";
  });

  it("defaults activeNis to first child once loaded", async () => {
    wrap(<Probe />);
    await screen.findByText("1001");
    expect(screen.getByTestId("count").textContent).toBe("2");
  });

  it("persists selection to sessionStorage", async () => {
    wrap(<Probe />);
    await screen.findByText("1001");
    act(() => screen.getByText("switch").click());
    expect(sessionStorage.getItem("activeChildNis")).toBe("1002");
  });

  it("restores selection from sessionStorage", async () => {
    sessionStorage.setItem("activeChildNis", "1002");
    wrap(<Probe />);
    await screen.findByText("1002");
  });
});
```

- [ ] **Step 2: Run test — fails (no module)**

Run: `pnpm --filter @sekolahpro/app-parent test -- lib/__tests__/activeChild`
Expected: FAIL "Cannot find module '../activeChild'".

- [ ] **Step 3: Implement provider**

```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChildren } from "../data/children";
import type { ChildSummary } from "../data/types";

const STORAGE_KEY = "activeChildNis";

interface ActiveChildCtx {
  activeNis: string | null;
  setActiveNis: (nis: string) => void;
  children: ChildSummary[];
  isLoading: boolean;
}

const Ctx = createContext<ActiveChildCtx | null>(null);

export function ActiveChildProvider({ children: kids }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { data, isLoading } = useChildren();
  const list = useMemo(() => data ?? [], [data]);

  const [activeNis, setActiveNisState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(STORAGE_KEY);
  });

  useEffect(() => {
    if (activeNis || list.length === 0) return;
    const first = list[0].nis;
    setActiveNisState(first);
    window.sessionStorage.setItem(STORAGE_KEY, first);
  }, [activeNis, list]);

  const setActiveNis = useCallback(
    (nis: string) => {
      setActiveNisState(nis);
      window.sessionStorage.setItem(STORAGE_KEY, nis);
      qc.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && typeof q.queryKey[0] === "string" && q.queryKey[0].startsWith("sekolahpro.api.parent.child_") });
    },
    [qc],
  );

  const value = useMemo<ActiveChildCtx>(
    () => ({ activeNis, setActiveNis, children: list, isLoading }),
    [activeNis, setActiveNis, list, isLoading],
  );

  return <Ctx.Provider value={value}>{kids}</Ctx.Provider>;
}

export function useActiveChild(): ActiveChildCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useActiveChild must be used within ActiveChildProvider");
  return v;
}
```

- [ ] **Step 4: Run test — passes**

Run: `pnpm --filter @sekolahpro/app-parent test -- lib/__tests__/activeChild`
Expected: PASS 3 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/parent/src/lib
git commit -m "feat(parent): ActiveChildProvider with sessionStorage persistence"
```

---

### Task 7: ChildSwitcher component (test-first)

**Files:**
- Test: `apps/parent/src/components/__tests__/ChildSwitcher.test.tsx`
- Create: `apps/parent/src/components/ChildSwitcher.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ActiveChildProvider, useActiveChild } from "../../lib/activeChild";
import { ChildSwitcher } from "../ChildSwitcher";

function Active() {
  const { activeNis } = useActiveChild();
  return <span data-testid="active">{activeNis}</span>;
}

function wrap() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <ActiveChildProvider>
        <ChildSwitcher />
        <Active />
      </ActiveChildProvider>
    </QueryClientProvider>,
  );
}

describe("ChildSwitcher", () => {
  beforeEach(() => {
    sessionStorage.clear();
    import.meta.env.VITE_USE_MOCKS = "true";
  });

  it("renders active child name", async () => {
    wrap();
    expect(await screen.findByText(/Andi Pratama/)).toBeInTheDocument();
  });

  it("switches active child on selection", async () => {
    const user = userEvent.setup();
    wrap();
    await screen.findByText(/Andi Pratama/);
    await user.click(screen.getByRole("button", { name: /pilih anak/i }));
    await user.click(screen.getByRole("menuitem", { name: /Bunga Pratami/ }));
    expect(screen.getByTestId("active").textContent).toBe("1002");
  });
});
```

- [ ] **Step 2: Run test — fails**

Run: `pnpm --filter @sekolahpro/app-parent test -- components/__tests__/ChildSwitcher`
Expected: FAIL.

- [ ] **Step 3: Implement ChildSwitcher**

```tsx
import { useEffect, useRef, useState } from "react";
import { useActiveChild } from "../lib/activeChild";

export function ChildSwitcher() {
  const { activeNis, setActiveNis, children, isLoading } = useActiveChild();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (isLoading) return <div className="text-xs text-muted-fg">Memuat anak…</div>;
  if (children.length === 0) {
    return <div className="text-xs text-amber-600">Belum ada siswa tertaut</div>;
  }
  const active = children.find((c) => c.nis === activeNis) ?? children[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Pilih anak"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-bg px-2.5 py-1.5 text-sm hover:bg-muted"
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand/15 text-[11px] font-semibold text-brand">
          {active.nama.charAt(0)}
        </span>
        <span className="font-medium text-fg">{active.nama}</span>
        <span className="text-[11px] text-muted-fg">· {active.kelas}</span>
      </button>
      {open ? (
        <div role="menu" className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border border-border bg-bg shadow-lg">
          {children.map((c) => (
            <button
              key={c.nis}
              role="menuitem"
              type="button"
              onClick={() => { setActiveNis(c.nis); setOpen(false); }}
              className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted ${c.nis === active.nis ? "bg-muted/50" : ""}`}
            >
              <span className="text-fg">{c.nama}</span>
              <span className="text-[11px] text-muted-fg">{c.kelas}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Run test — passes**

Run: `pnpm --filter @sekolahpro/app-parent test -- components/__tests__/ChildSwitcher`
Expected: PASS 2 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/parent/src/components
git commit -m "feat(parent): ChildSwitcher dropdown component"
```

---

### Task 8: main.tsx entry

**Files:**
- Create: `apps/parent/src/main.tsx`

- [ ] **Step 1: Write main.tsx**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { configure, createQueryClient } from "@sekolahpro/api-client";
import { parseEnv } from "@sekolahpro/config";
import { ActiveChildProvider } from "./lib/activeChild";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

const env = parseEnv(import.meta.env);
configure({ baseUrl: env.VITE_API_BASE });

const qc = createQueryClient();
const router = createRouter({ routeTree, context: {} });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <ActiveChildProvider>
        <RouterProvider router={router} />
      </ActiveChildProvider>
    </QueryClientProvider>
  </StrictMode>,
);
```

- [ ] **Step 2: Commit (routeTree.gen.ts will be created by vite plugin on first dev/build)**

```bash
git add apps/parent/src/main.tsx
git commit -m "feat(parent): wire app entry with providers"
```

---

### Task 9: Root route + AppShell

**Files:**
- Create: `apps/parent/src/routes/__root.tsx`

- [ ] **Step 1: Write root route**

```tsx
import { createRootRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  AppShell, SidebarNav, type SidebarNavSection,
  IconHome, IconCalendar, IconChart, IconCheck, IconChat, IconLogout,
} from "@sekolahpro/ui";
import { logout, useSession } from "@sekolahpro/auth";
import { useTenant } from "@sekolahpro/tenant";
import { ChildSwitcher } from "../components/ChildSwitcher";

function Brand({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white font-bold shadow-sm"
        style={{ background: "linear-gradient(135deg, hsl(222 89% 55%), hsl(262 83% 58%))" }}
      >
        P
      </span>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-fg truncate max-w-[150px]">{name}</div>
        <div className="text-[11px] text-muted-fg">Portal Orang Tua</div>
      </div>
    </div>
  );
}

function RootLayout() {
  const { data: tenant } = useTenant();
  const session = useSession();
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (path === "/login") return <Outlet />;
  if (session.status === "guest") {
    return <Outlet />;
  }

  const sections: SidebarNavSection[] = [
    {
      items: [
        { label: "Dashboard", to: "/", icon: <IconHome /> },
        { label: "Jadwal", to: "/jadwal", icon: <IconCalendar /> },
        { label: "Nilai", to: "/nilai", icon: <IconChart /> },
        { label: "Absensi", to: "/absensi", icon: <IconCheck /> },
        { label: "Pesan", to: "/pesan", icon: <IconChat /> },
        { label: "Pembayaran", to: "/pembayaran", icon: <IconChart /> },
        { label: "Profil", to: "/profil", icon: <IconHome /> },
      ],
    },
  ];

  return (
    <AppShell
      brand={<Brand name={tenant?.name ?? "SekolahPro"} />}
      sidebar={<SidebarNav sections={sections} LinkComponent={Link} activePath={path} />}
      topbar={
        <div className="flex items-center gap-3">
          <ChildSwitcher />
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted text-muted-fg"
            aria-label="Keluar"
          >
            <span className="h-4 w-4"><IconLogout /></span>
          </button>
        </div>
      }
    >
      <Outlet />
    </AppShell>
  );
}

export const Route = createRootRoute({ component: RootLayout });
```

- [ ] **Step 2: Verify dev server starts and route tree regenerates**

Run: `pnpm --filter @sekolahpro/app-parent dev`
Expected: server starts on 5184, `src/routeTree.gen.ts` is auto-generated, no console errors. Stop after verifying.

- [ ] **Step 3: Commit**

```bash
git add apps/parent/src/routes/__root.tsx apps/parent/src/routeTree.gen.ts
git commit -m "feat(parent): root route with shell + sidebar + child switcher"
```

---

### Task 10: Login route

**Files:**
- Create: `apps/parent/src/routes/login.tsx`

- [ ] **Step 1: Write login (Portal Orang Tua variant of student login)**

```tsx
import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Input } from "@sekolahpro/ui";
import { login } from "@sekolahpro/auth";

function LoginPage() {
  const navigate = useNavigate();
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(usr, pwd);
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-bg">
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-10 text-white bg-gradient-to-br from-sky-600 via-indigo-600 to-violet-600">
        <div className="relative font-semibold tracking-tight">SekolahPro · Orang Tua</div>
        <div className="relative space-y-4 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Pantau perkembangan anak Anda.</h1>
          <p className="text-white/80 text-lg">Nilai, kehadiran, jadwal, pesan, dan tagihan — satu portal untuk semua anak.</p>
        </div>
        <p className="relative text-sm text-white/70">© {new Date().getFullYear()} SekolahPro</p>
      </aside>
      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-fg">Masuk ke akun orang tua</h2>
            <p className="text-sm text-muted-fg">Gunakan kredensial yang diberikan sekolah.</p>
          </div>
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium text-fg">Username</label>
              <Input id="username" type="text" autoComplete="username" value={usr} onChange={(e) => setUsr(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-fg">Kata sandi</label>
                <button type="button" onClick={() => setShowPwd((v) => !v)} className="text-xs text-muted-fg hover:text-fg">
                  {showPwd ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
              <Input id="password" type={showPwd ? "text" : "password"} autoComplete="current-password" value={pwd} onChange={(e) => setPwd(e.target.value)} required />
            </div>
            {error ? (
              <div role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
            ) : null}
            <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-to-r from-sky-600 to-violet-600 hover:opacity-95 disabled:opacity-60">
              {loading ? "Memuat..." : "Masuk"}
            </Button>
          </form>
          <p className="text-center text-xs text-muted-fg">Lupa kata sandi? Hubungi admin sekolah.</p>
        </div>
      </main>
    </div>
  );
}

export const Route = createFileRoute("/login")({ component: LoginPage });
```

- [ ] **Step 2: Commit**

```bash
git add apps/parent/src/routes/login.tsx
git commit -m "feat(parent): login route"
```

---

### Task 11: Dashboard (index) route

**Files:**
- Create: `apps/parent/src/routes/index.tsx`

- [ ] **Step 1: Write index route**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@sekolahpro/auth";
import { PageHeader, SectionCard, StatCard, IconChart, IconCheck, IconBook, IconCalendar } from "@sekolahpro/ui";
import { useActiveChild } from "../lib/activeChild";
import { useChildDashboard } from "../data/dashboard";

function DashboardPage() {
  const { activeNis, children } = useActiveChild();
  const { data, isLoading } = useChildDashboard(activeNis);
  const active = children.find((c) => c.nis === activeNis);

  return (
    <div className="space-y-6">
      <PageHeader
        title={active ? `Dashboard ${active.nama}` : "Dashboard"}
        subtitle={active ? `${active.kelas} · NIS ${active.nis}` : ""}
      />
      {isLoading || !data ? (
        <div className="text-sm text-muted-fg">Memuat…</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Rata-rata Nilai" value={data.rerataNilai} icon={<IconChart />} accent="brand" />
            <StatCard label="Kehadiran" value={data.kehadiranPct} icon={<IconCheck />} accent="emerald" />
            <StatCard label="Tugas Pending" value={String(data.tugasPending)} icon={<IconBook />} accent="amber" />
            <StatCard label="Jadwal Hari Ini" value="—" icon={<IconCalendar />} accent="brand" />
          </div>
          <SectionCard title="Info terkini">
            <ul className="space-y-3">
              {data.infoTerkini.map((i) => (
                <li key={i.id} className="text-sm">
                  <div className="font-medium text-fg">{i.title}</div>
                  <div className="text-muted-fg">{i.body}</div>
                  <div className="text-[11px] text-muted-fg/80">{i.ago}</div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </>
      )}
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: () => (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  ),
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/parent/src/routes/index.tsx
git commit -m "feat(parent): dashboard route for active child"
```

---

### Task 12: Jadwal route

**Files:**
- Create: `apps/parent/src/routes/jadwal.tsx`

- [ ] **Step 1: Write route**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@sekolahpro/auth";
import { PageHeader, SectionCard } from "@sekolahpro/ui";
import { useActiveChild } from "../lib/activeChild";
import { useChildJadwal } from "../data/jadwal";

function JadwalPage() {
  const { activeNis, children } = useActiveChild();
  const { data, isLoading } = useChildJadwal(activeNis);
  const active = children.find((c) => c.nis === activeNis);

  return (
    <div className="space-y-6">
      <PageHeader title="Jadwal Pelajaran" subtitle={active?.nama ?? ""} />
      <SectionCard title="Minggu ini">
        {isLoading || !data ? (
          <div className="text-sm text-muted-fg">Memuat…</div>
        ) : data.length === 0 ? (
          <div className="text-sm text-muted-fg">Belum ada jadwal.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-muted-fg">
              <tr>
                <th className="py-2">Hari</th><th>Jam</th><th>Mapel</th><th>Guru</th><th>Ruang</th>
              </tr>
            </thead>
            <tbody>
              {data.map((j) => (
                <tr key={j.id} className="border-t border-border">
                  <td className="py-2">{j.hari}</td>
                  <td>{j.jamMulai}–{j.jamSelesai}</td>
                  <td className="text-fg">{j.mapel}</td>
                  <td>{j.guru}</td>
                  <td>{j.ruang}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/jadwal")({
  component: () => (<RequireAuth><JadwalPage /></RequireAuth>),
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/parent/src/routes/jadwal.tsx
git commit -m "feat(parent): jadwal route"
```

---

### Task 13: Nilai route

**Files:**
- Create: `apps/parent/src/routes/nilai.tsx`

- [ ] **Step 1: Write route**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@sekolahpro/auth";
import { PageHeader, SectionCard, Badge } from "@sekolahpro/ui";
import { useActiveChild } from "../lib/activeChild";
import { useChildNilai } from "../data/nilai";

function NilaiPage() {
  const { activeNis, children } = useActiveChild();
  const { data, isLoading } = useChildNilai(activeNis);
  const active = children.find((c) => c.nis === activeNis);

  return (
    <div className="space-y-6">
      <PageHeader title="Nilai" subtitle={active?.nama ?? ""} />
      <SectionCard title="Daftar nilai">
        {isLoading || !data ? (
          <div className="text-sm text-muted-fg">Memuat…</div>
        ) : data.length === 0 ? (
          <div className="text-sm text-muted-fg">Belum ada nilai.</div>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((n) => (
              <li key={n.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium text-fg">{n.mapel}</div>
                  <div className="text-[11px] text-muted-fg">{n.semester}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-fg">{n.nilaiAngka}</span>
                  <Badge>{n.nilaiHuruf}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/nilai")({
  component: () => (<RequireAuth><NilaiPage /></RequireAuth>),
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/parent/src/routes/nilai.tsx
git commit -m "feat(parent): nilai route"
```

---

### Task 14: Absensi route

**Files:**
- Create: `apps/parent/src/routes/absensi.tsx`

- [ ] **Step 1: Write route**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@sekolahpro/auth";
import { PageHeader, SectionCard, Badge } from "@sekolahpro/ui";
import { useActiveChild } from "../lib/activeChild";
import { useChildAbsensi } from "../data/absensi";

const TONE: Record<string, string> = {
  hadir: "bg-emerald-100 text-emerald-700",
  izin: "bg-amber-100 text-amber-700",
  sakit: "bg-sky-100 text-sky-700",
  alpa: "bg-rose-100 text-rose-700",
};

function AbsensiPage() {
  const { activeNis, children } = useActiveChild();
  const { data, isLoading } = useChildAbsensi(activeNis);
  const active = children.find((c) => c.nis === activeNis);

  return (
    <div className="space-y-6">
      <PageHeader title="Absensi" subtitle={active?.nama ?? ""} />
      <SectionCard title="Riwayat">
        {isLoading || !data ? (
          <div className="text-sm text-muted-fg">Memuat…</div>
        ) : data.length === 0 ? (
          <div className="text-sm text-muted-fg">Belum ada catatan.</div>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-medium text-fg">{a.tanggal}</div>
                  {a.catatan ? <div className="text-[11px] text-muted-fg">{a.catatan}</div> : null}
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${TONE[a.status] ?? ""}`}>
                  {a.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/absensi")({
  component: () => (<RequireAuth><AbsensiPage /></RequireAuth>),
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/parent/src/routes/absensi.tsx
git commit -m "feat(parent): absensi route"
```

---

### Task 15: Pesan route

**Files:**
- Create: `apps/parent/src/routes/pesan.tsx`

- [ ] **Step 1: Write route**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@sekolahpro/auth";
import { PageHeader, SectionCard } from "@sekolahpro/ui";
import { useActiveChild } from "../lib/activeChild";
import { usePesanList } from "../data/pesan";

function PesanPage() {
  const { children } = useActiveChild();
  const { data, isLoading } = usePesanList();
  const nameByNis = new Map(children.map((c) => [c.nis, c.nama]));

  return (
    <div className="space-y-6">
      <PageHeader title="Pesan" subtitle="Pesan dari sekolah" />
      <SectionCard title="Kotak masuk">
        {isLoading || !data ? (
          <div className="text-sm text-muted-fg">Memuat…</div>
        ) : data.length === 0 ? (
          <div className="text-sm text-muted-fg">Kotak masuk kosong.</div>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((p) => (
              <li key={p.id} className="py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-fg">{p.judul}</span>
                  <span className="text-[11px] text-muted-fg">{p.dikirim}</span>
                </div>
                <div className="text-[11px] text-muted-fg">
                  {p.pengirim}
                  {p.nis ? ` · ${nameByNis.get(p.nis) ?? p.nis}` : ""}
                </div>
                <div className="text-sm text-fg/90 mt-1">{p.isi}</div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/pesan")({
  component: () => (<RequireAuth><PesanPage /></RequireAuth>),
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/parent/src/routes/pesan.tsx
git commit -m "feat(parent): pesan inbox route"
```

---

### Task 16: Pembayaran route

**Files:**
- Create: `apps/parent/src/routes/pembayaran.tsx`

- [ ] **Step 1: Write route**

```tsx
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@sekolahpro/auth";
import { PageHeader, SectionCard, Badge } from "@sekolahpro/ui";
import { useActiveChild } from "../lib/activeChild";
import { useTagihanList, useTagihanDetail } from "../data/tagihan";

const STATUS_TONE: Record<string, string> = {
  lunas: "bg-emerald-100 text-emerald-700",
  belum_lunas: "bg-amber-100 text-amber-700",
  terlambat: "bg-rose-100 text-rose-700",
};

function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function PembayaranPage() {
  const { children } = useActiveChild();
  const [filterNis, setFilterNis] = useState<string | undefined>(undefined);
  const { data: list, isLoading } = useTagihanList(filterNis);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: detail } = useTagihanDetail(openId);
  const nameByNis = new Map(children.map((c) => [c.nis, c.nama]));

  return (
    <div className="space-y-6">
      <PageHeader title="Pembayaran" subtitle="Tagihan sekolah" />
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-fg">Anak:</span>
        <select
          value={filterNis ?? ""}
          onChange={(e) => setFilterNis(e.target.value || undefined)}
          className="rounded-md border border-border bg-bg px-2 py-1 text-sm"
        >
          <option value="">Semua</option>
          {children.map((c) => (<option key={c.nis} value={c.nis}>{c.nama}</option>))}
        </select>
      </div>
      <SectionCard title="Daftar tagihan">
        {isLoading || !list ? (
          <div className="text-sm text-muted-fg">Memuat…</div>
        ) : list.length === 0 ? (
          <div className="text-sm text-muted-fg">Tidak ada tagihan.</div>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-medium text-fg">{t.judul}</div>
                  <div className="text-[11px] text-muted-fg">{nameByNis.get(t.nis) ?? t.nis} · jatuh tempo {t.jatuhTempo}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-fg">{formatRupiah(t.jumlah)}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_TONE[t.status] ?? ""}`}>
                    {t.status.replace("_", " ")}
                  </span>
                  <button type="button" className="text-xs text-brand hover:underline" onClick={() => setOpenId(t.id)}>Detail</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
      {detail ? (
        <SectionCard title={`Detail · ${detail.judul}`}>
          <ul className="space-y-2 text-sm">
            {detail.rincian.map((r, i) => (
              <li key={i} className="flex justify-between">
                <span className="text-muted-fg">{r.label}</span>
                <span className="text-fg">{formatRupiah(r.jumlah)}</span>
              </li>
            ))}
            <li className="flex justify-between border-t border-border pt-2 font-semibold">
              <span>Total</span><span>{formatRupiah(detail.jumlah)}</span>
            </li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            {detail.metodePembayaran.map((m) => (<Badge key={m}>{m}</Badge>))}
          </div>
          {detail.catatan ? <p className="mt-3 text-xs text-muted-fg">{detail.catatan}</p> : null}
          <button type="button" className="mt-3 text-xs text-muted-fg hover:text-fg" onClick={() => setOpenId(null)}>Tutup</button>
        </SectionCard>
      ) : null}
    </div>
  );
}

export const Route = createFileRoute("/pembayaran")({
  component: () => (<RequireAuth><PembayaranPage /></RequireAuth>),
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/parent/src/routes/pembayaran.tsx
git commit -m "feat(parent): pembayaran route with tagihan list + detail"
```

---

### Task 17: Profil route

**Files:**
- Create: `apps/parent/src/routes/profil.tsx`

- [ ] **Step 1: Write route**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth, useSession, logout } from "@sekolahpro/auth";
import { PageHeader, SectionCard, Button } from "@sekolahpro/ui";
import { useActiveChild } from "../lib/activeChild";

function ProfilPage() {
  const session = useSession();
  const { children } = useActiveChild();
  const user = session.status === "authenticated" ? session : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Profil" subtitle="Akun orang tua" />
      <SectionCard title="Identitas">
        <div className="text-sm space-y-1">
          <div><span className="text-muted-fg">Nama: </span><span className="text-fg">{user?.fullName ?? "—"}</span></div>
          <div><span className="text-muted-fg">Username: </span><span className="text-fg">{user?.user ?? "—"}</span></div>
        </div>
      </SectionCard>
      <SectionCard title="Anak tertaut">
        {children.length === 0 ? (
          <div className="text-sm text-muted-fg">Belum ada siswa tertaut.</div>
        ) : (
          <ul className="divide-y divide-border">
            {children.map((c) => (
              <li key={c.nis} className="flex items-center justify-between py-2 text-sm">
                <span className="text-fg">{c.nama}</span>
                <span className="text-[11px] text-muted-fg">{c.kelas} · NIS {c.nis}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
      <Button onClick={() => void logout()} className="bg-danger text-white">Keluar</Button>
    </div>
  );
}

export const Route = createFileRoute("/profil")({
  component: () => (<RequireAuth><ProfilPage /></RequireAuth>),
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/parent/src/routes/profil.tsx
git commit -m "feat(parent): profil route with parent + linked children"
```

---

### Task 18: Smoke test for a data hook in mock mode

**Files:**
- Create: `apps/parent/src/data/__tests__/children.test.tsx`

- [ ] **Step 1: Write test**

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useChildren } from "../children";

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useChildren (mock mode)", () => {
  beforeEach(() => { import.meta.env.VITE_USE_MOCKS = "true"; });

  it("returns mocked child list", async () => {
    const { result } = renderHook(() => useChildren(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.length).toBe(2);
    expect(result.current.data?.[0].nis).toBe("1001");
  });
});
```

- [ ] **Step 2: Run test**

Run: `pnpm --filter @sekolahpro/app-parent test`
Expected: all tests PASS (activeChild, ChildSwitcher, children).

- [ ] **Step 3: Commit**

```bash
git add apps/parent/src/data/__tests__
git commit -m "test(parent): smoke test useChildren in mock mode"
```

---

### Task 19: Full build verification

- [ ] **Step 1: Typecheck**

Run: `pnpm --filter @sekolahpro/app-parent typecheck`
Expected: PASS.

- [ ] **Step 2: Lint**

Run: `pnpm --filter @sekolahpro/app-parent lint`
Expected: 0 errors.

- [ ] **Step 3: Build**

Run: `VITE_USE_MOCKS=true pnpm --filter @sekolahpro/app-parent build`
Expected: `dist/` created, no errors.

- [ ] **Step 4: Manual smoke (mock mode)**

Run: `VITE_USE_MOCKS=true pnpm --filter @sekolahpro/app-parent dev`
Open `http://localhost:5184` and:
- Verify child switcher renders both mock children
- Switch child → dashboard data updates
- Navigate all routes; no console errors

- [ ] **Step 5: Final commit (if any lint fixes)**

```bash
git add -A
git commit -m "chore(parent): final lint + build pass"
```

---

## Self-Review

**Spec coverage:**
- Multi-child portal via `session.user` → Task 5 (`useChildren` + backend `list_children`), Task 6 (`ActiveChildProvider`).
- Header child switcher with persistent selection → Tasks 6, 7, 9.
- Read-only surfaces (Dashboard, Jadwal, Nilai, Absensi, Pesan, Pembayaran, Profil) → Tasks 11–17.
- Reuse workspace packages → Task 1 deps + Task 8 wiring.
- Mock fallback gated by `VITE_USE_MOCKS=true` → Task 4 fixtures + Task 5 hooks.
- Backend contract documented → mirrored in Task 5 hook METHOD constants and types.
- Tests for `ActiveChildProvider`, `ChildSwitcher`, one data hook → Tasks 6, 7, 18.
- Error handling (`RequireAuth` redirect, loading states) → routes wrap in `RequireAuth` (Tasks 11–17).
- Empty states (no children → contact-school CTA) → handled in `ChildSwitcher` (Task 7).
- Dev port 5184 (5176 was illustrative; student uses 5182 → 5184 avoids collision) → Task 2.

**Placeholder scan:** None. Every step has concrete code or commands.

**Type consistency:** `ChildSummary.nis` used consistently; `useChildDashboard(nis: string | null)` matches usage in routes; all wire→UI mapping functions defined where needed.

**FrappeError 403 handling:** spec mentions resetting active child on 403; not wired explicitly in MVP (routes show whatever React Query returns). Acceptable for read-only MVP; can add interceptor later when backend lands. Noted as known gap — does not block plan.

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-29-parent-app.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
