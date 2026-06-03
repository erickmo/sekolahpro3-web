# Akademik — Tahun Ajaran Hub + Workspace (period-first IA)

Date: 2026-06-03
Status: Approved (brainstorm) → ready for plan
Scope size: L (new route layer, ~8 route files restructured, new hub page, context bar simplified)

## Problem

Navigasi modul Akademik terasa berserakan. Tahun Ajaran (TA) hari ini hanya filter
dropdown kecil di context bar; submenu fitur (`Dashboard | Input Nilai Test | Entri
Nilai | Raport`) berdiri sendiri. User ingin **satu pintu masuk** yang dimulai dari
memilih Tahun Ajaran dulu, dengan TA berjalan menonjol dan arsip tetap terlihat.

Catatan penting: data sudah period-scoped lewat `?ta=&semester=` + `useAkademikContext`.
Perubahan ini **murni Information Architecture / navigasi**, bukan fitur data baru.

## Decisions (dari brainstorm)

1. **Bentuk nav** = Hub TA → Workspace. Halaman akademik jadi daftar TA; klik satu TA
   masuk workspace TA itu dengan submenu datar + breadcrumb.
2. **Model URL** = TA jadi segmen path: `/akademik/$ta/<submenu>`. Breadcrumb natural,
   tiap TA bisa di-bookmark/di-share (penting untuk arsip), back antar-TA jelas.
3. **Friksi harian** = Auto-buka TA terakhir. User dengan TA tersimpan langsung masuk
   workspace (0 klik tambahan). Hub diakses lewat breadcrumb "Akademik" / tombol
   "Ganti TA". User tanpa memori → mampir hub.
4. **Semester** = tetap selector kecil di header workspace (`?semester=`), bukan di path
   (sering ganti dalam satu TA).

## Architecture — route restructure (TanStack file-based)

Sisipkan lapisan dinamis `$ta` di bawah akademik. Halaman fitur lama turun satu level.

```
sch.$sekolah.akademik.tsx                 layout tipis: <Outlet/> saja (no shell)
sch.$sekolah.akademik.index.tsx           HUB — daftar TA (berjalan + arsip) + auto-redirect
sch.$sekolah.akademik.$ta.tsx             WORKSPACE layout: AkademikContextProvider
                                          (TA dari param) + ModuleShell sub-nav +
                                          breadcrumb + semester selector
sch.$sekolah.akademik.$ta.index.tsx       Dashboard      (eks akademik.index.tsx)
sch.$sekolah.akademik.$ta.asesmen.index.tsx   Input Nilai Test
sch.$sekolah.akademik.$ta.asesmen.$id.tsx     detail asesmen
sch.$sekolah.akademik.$ta.entri-nilai.tsx     Entri Nilai
sch.$sekolah.akademik.$ta.entri-nilai.edit.tsx editor grid (periode self-managed)
sch.$sekolah.akademik.$ta.raport.tsx          Raport
sch.$sekolah.akademik.$ta.raport.$id.tsx       detail raport
```

`$ta` = `name` doctype Tahun Ajaran (autoname `format:{sekolah}-{nama}`). `nama` bisa
mengandung `/` (mis. "2025/2026") → **wajib `encodeURIComponent` saat membuat Link**
dan andalkan TanStack men-decode param di loader; match `taList.find(name === decoded)`.
(Verifikasi format `name` nyata saat implementasi.)

### Param reuse di sub-nav

`GroupedNavTabs` memakai `<Link to={t.to}>` tanpa `params` dan TanStack mewarisi param
lokasi sekarang untuk nama param yang sama (terbukti dipakai `$sekolah` hari ini). Saat
render di dalam `$ta`, `$ta` sudah jadi param aktif → pill bar otomatis mewarisinya.
NAV_GROUPS cukup ubah template `to` jadi `/sch/$sekolah/akademik/$ta/...`.
**Risiko utama untuk diverifikasi:** tsc + nav nyata membuktikan pewarisan `$ta` jalan;
bila tidak, GroupedNavTabs diberi dukungan `params` opsional.

## Hub page (`akademik.index.tsx`)

- Ambil `Tahun Ajaran` (fields: name, nama, is_current, status, tanggal_mulai/selesai).
- **Seksi "Tahun Ajaran Berjalan"**: kartu TA `is_current` menonjol → tombol `Buka →`
  ke `/akademik/$ta` (dashboard). Bila tak ada `is_current`, fallback TA terbaru.
- **Seksi "Arsip"** (collapsible, default tertutup): TA non-current, list ringkas dengan
  badge status, klik → workspace (read-only banner via logika lama).
- **Auto-redirect**: `useEffect` — jika ada `readStoredPeriode(sekolah).ta` yang valid di
  taList, `navigate(replace)` ke `/akademik/$ta` (submenu terakhir bila disimpan, default
  dashboard). Tanpa memori → render hub. Flag anti-loop agar hub bisa dibuka manual
  (mis. `?pick=1` dari tombol "Ganti TA" mematikan auto-redirect).
- **Empty state**: 0 TA → ajakan "Tambah Tahun Ajaran di Master Data".
- PageGuide hub: "Mulai dari pilih Tahun Ajaran".

## Workspace layout (`akademik.$ta.tsx`)

Pindahan inti dari `akademik.tsx` sekarang, dengan TA dari **param path** bukan `?ta=`:

- Resolve `taRow = taList.find(name === decode($ta))`; param invalid → redirect ke hub.
- `AkademikContextProvider` value: `tahunAjaran = $ta`, `semester` dari `?semester=`
  (resolve via `computeSemester` + storage), `isPastPeriod`, `noActiveTa`, `dirty`.
- `setTahunAjaran` → navigate ke `/akademik/$newTa/<submenu sekarang>` (pindah TA = ganti
  path, bukan query). `setSemester` → set `?semester=`.
- `ModuleShell navGroups={NAV_GROUPS}` (template `to` ber-`$ta`), `context=` diisi
  `AkademikContextBar` yang disederhanakan.
- **Breadcrumb** di atas/di dalam header: `Akademik › {nama TA} › {submenu aktif}`,
  "Akademik" = Link ke hub (`?pick=1`).
- Simpan `{ta, semester}` ke storage (driver auto-redirect hub). Editor grid tetap
  self-managed (lewati persist + bar, seperti sekarang) — TA-nya kini dari path.

## Context bar simplification (`AkademikContextBar.tsx`)

- **Buang**: `SearchableSelect` Tahun Ajaran + `loadTA` + guarded TA switch (pindah TA
  sekarang via hub/breadcrumb).
- **Pertahankan**: status badge periode (berjalan/lampau/belum-aktif), role badge,
  **semester selector** (guarded oleh `dirty`), banner lampau/belum-aktif.
- Tambah: label TA aktif (nama) sebagai teks/badge (read-only).

## Reuse (tanpa perubahan logika)

`lib/akademikPeriode.ts` (resolve/semester/storage), `lib/akademikRole`, `lib/akademikContext`,
`ModuleShell`, `GroupedNavTabs`, komponen viz/guide. Halaman fitur (dashboard/asesmen/
entri-nilai/raport) baca TA via `useAkademikContext(Optional)` → isi internal nyaris tak
berubah; yang berubah hanya `createFileRoute(path)` + path turun ke `$ta`.

## Edge cases

- **Nama TA tak URL-safe** (`/`) → `encodeURIComponent` + decode; verifikasi data nyata.
- **Deep-link arsip** → workspace muncul + banner read-only (`isPastPeriod`).
- **Param `$ta` tak dikenal** → redirect hub.
- **0 TA / tak ada is_current** → hub empty / fallback TA terbaru; banner `noActiveTa`.
- **localStorage** `{ta,semester}` kini juga driver auto-redirect; skema tetap.
- **Editor grid** `entri-nilai/edit`: `$ta` dari path, semester/rombel/mapel tetap
  dikelola sendiri; "Ubah Konteks" tetap; persist/redirect periode tetap dilewati.

## Testing

- `akademikPeriode` resolve/semester/storage — tetap hijau (tak diubah).
- Hub: render kartu berjalan + arsip; auto-redirect saat ada stored TA valid; empty state;
  `?pick=1` menonaktifkan auto-redirect.
- Workspace: resolve taRow dari param; redirect saat param invalid; breadcrumb label;
  context bar tanpa dropdown TA; setTahunAjaran pindah path.
- Nav pills mewarisi `$ta` (active-state per submenu).
- Regression: semua test akademik existing lulus setelah path turun ke `$ta`.

## Out of scope

- Tak ubah backend / doctype / data scoping.
- Tak pindahkan TA setup (tetap di Master Data).
- Semester tetap query, tidak jadi path.
- Tak ubah modul lain (ekstrakurikuler dsb).

## Verification gates

`pnpm tsc` 0, `pnpm lint` 0, `pnpm vitest` hijau, `pnpm build` ok (worktree, sequential).
