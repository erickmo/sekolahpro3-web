# Design — "Cara pakai halaman ini" untuk semua halaman School

**Tanggal:** 2026-06-03
**Status:** Approved
**Modul:** apps/school

## Tujuan

Tambahkan panel onboarding "Cara pakai halaman ini" (komponen `PageGuide`) ke
setiap halaman konten di app School, meniru pola yang sudah ada di modul
Keuangan / Perpustakaan / Aset, supaya pengguna baru paham fungsi tiap halaman.

## Scope

- **Target:** 83 halaman konten di 16 modul yang belum punya guide.
- **Exclude:** layout `<Outlet>` murni, halaman `$param` detail/edit, file test.
- **Modul baru (konten + wiring):** absensi, infrastruktur, jadwal, kelas,
  master, pengaturan, siswa, situs, staff.
- **Modul existing (extend + wiring):** perpustakaan (5 id baru: denda,
  pengembalian, kolektif, inventaris-berita-acara, inventaris-opname).
- **Aset (wiring saja):** `ASET_PAGE_GUIDES` sudah punya semua id; 7 route
  tinggal dipasang `<PageGuide>`.
- **Singleton:** audit, laporan, pesan, pickup-verify, dashboard `index` →
  digabung di `components/guide/miscPageGuides.ts`.

## Arsitektur (ikut pola `aset`)

1. **Content module per domain** — `components/<domain>/pageGuides.ts`:
   ```ts
   export const <DOMAIN>_PAGE_GUIDES: Record<GuideId, {
     title: string; intro: string; steps: PageGuideStep[]; tips: string[];
   }> = { ... }
   ```
2. **Role label terpusat** — `lib/schoolGuideRole.ts` (`SCHOOL_ROLE_LABEL`).
   Step di-tag pakai key coarse (admin, guru, wali_kelas, kurikulum, ...).
   PageGuide resolve key tak dikenal → key itu sendiri (permissive).
3. **Wiring tiap route** — sisip dekat atas konten (setelah `PageHeader`/header,
   sebelum grid utama):
   ```tsx
   <PageGuide
     storageNamespace="<domain>-guide:" storageId="<pageId>"
     title={X_PAGE_GUIDES.pageId.title} intro={X_PAGE_GUIDES.pageId.intro}
     steps={X_PAGE_GUIDES.pageId.steps} tips={X_PAGE_GUIDES.pageId.tips}
     roleLabels={SCHOOL_ROLE_LABEL}
   />
   ```

## Isi guide

Kaya per-halaman: intro 1 kalimat + 3-4 langkah ber-tag peran + 1-3 tips.
Bahasa Indonesia, POV staf yang memakai halaman. Tidak menyembunyikan fungsi —
role tag hanya membingkai audiens.

## Test (TDD)

- Unit test per content module: semua `GuideId` ada, tiap entri well-formed
  (title & intro non-kosong, ≥1 step, tiap `roles` ⊆ key role yang valid).
- 1 test untuk `schoolGuideRole` (semua key ter-label).
- Tanpa render-test per route — `PageGuide` sendiri sudah ada unit test.

## Delivery

1 branch `feat/school-page-guides` (worktree isolasi). Implement per-domain
(workflow fan-out, 1 agent/domain). Verify final tsc + vitest + build
**inline/sequential** (workflow build paralel terbukti bikin stall). 1 PR.

## Gate

tsc 0 · eslint clean · vitest green · build ok · file <300 baris.
