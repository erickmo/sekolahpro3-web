# KOP-ADR-0001: Mode Menu Per Jenis Koperasi

- **Status:** Accepted
- **Tanggal:** 2026-06-03
- **Domain:** Koperasi (frontend `apps/school`, shell `/kop/$sekolah`)

## Konteks

Setiap koperasi dalam SekolahPro berjalan dalam salah satu dari dua mode operasi, disimpan di backend singleton `Pengaturan Koperasi` field `mode_koperasi`:
- **Konvensional**: Koperasi simpan-pinjam konvensional dengan bunga. Tidak memiliki layanan sosial syariah.
- **Syariah (BMT)**: Baitul Maal wat Tamwil. Memiliki sisi sosial (Baitul Maal: ZIS, Wakaf) dan sisi pembiayaan syariah (Tamwil: akad).

Frontend saat ini tidak membaca `mode_koperasi` sama sekali. Menu sidebar (`KOPERASI_NAV` di `/lib/koperasi-nav.ts`) bersifat statis dan identik untuk semua koperasi, yang berarti:
- Pengguna Konvensional melihat menu ZIS dan Wakaf (tidak relevan).
- Pengguna Syariah/BMT melihat label "Akad" (benar) tetapi juga melihat item "Suku Bunga" yang seharusnya hanya untuk Konvensional.

Ini menciptakan kebingungan UX dan potensi akses ke fitur yang tidak sesuai jenis koperasi.

**Verified source of truth:**
- Menu definition: `/apps/school/src/lib/koperasi-nav.ts` `KOPERASI_NAV`
- Sidebar render: `/apps/school/src/routes/__root.tsx` lines 462–606 (layout koperasi)
- Type field: Backend singleton `Pengaturan Koperasi`, field `mode_koperasi` (Select: "Konvensional" | "Syariah (BMT)")
- Constant mode values: Backend `sekolahpro.koperasi.pengaturan_koperasi.MODE_KONVENSIONAL` / `MODE_SYARIAH`

## Keputusan

**Implementasikan menu adaptif via deklaratif mode tagging + pure filter.**

1. **Extend menu model** (`KOPERASI_NAV` interfaces):
   - Add `KoperasiMode = "syariah" | "konvensional"` type.
   - Add optional `mode` field ke `KoperasiNavItem` dan `KoperasiNavSection` (absen = kedua mode).
   - Add optional `labelKonvensional` field ke item untuk override label saat mode konvensional (mis. "Akad" → "Pinjaman").

2. **Retag data**:
   - Rename section "Sosial" → "Baitul Maal", set `mode: "syariah"` (hanya BMT).
   - Move item "SHU" dari Sosial ke Admin (kedua mode).
   - Tag item Pembiayaan "Akad": `labelKonvensional: "Pinjaman"`.
   - Add item "Suku Bunga": `mode: "konvensional"`, route `/suku-bunga` (read-only, hanya Konvensional).

3. **Pure filter function** `filterKoperasiNav(sections, isSyariah)`:
   - Drop section atau item yang `mode` tidak match active mode.
   - Replace label item yang punya `labelKonvensional` saat mode konvensional.
   - Drop section kosong setelah filter item.
   - Pure, no I/O → unit-testable seam.

4. **Hook `useKoperasiMode(enabled)`**:
   - Read singleton `Pengaturan Koperasi.mode_koperasi` via `useResourceDoc()`.
   - Pure helper `deriveIsSyariah(mode_string)`: `mode !== "Konvensional"` → true (BMT fallback/superset).
   - Return `{ isSyariah, isLoading }`.
   - Fallback syariah saat loading/error → BMT tidak pernah kehilangan menu ZIS/Wakaf; Konvensional brief seeing mereka harmless.

5. **Render wiring** (`__root.tsx`):
   - Call `const { isSyariah } = useKoperasiMode(isKop)` near existing `isKop` logic.
   - Replace `KOPERASI_NAV.map()` dengan `filterKoperasiNav(KOPERASI_NAV, isSyariah).map()`.
   - Add icon "Baitul Maal" to `KOP_SECTION_ICON` (menggantikan "Sosial").

6. **New read-only page** `kop.$sekolah.suku-bunga.tsx`:
   - Tampilkan list `Produk Pembiayaan` + `Produk Simpanan` dengan `margin_pa`, `skema_angsuran`, `maksimal_tenor`.
   - Read-only (no edit form); consistent dengan sibling routes via `ResourceListPage`.
   - Hidden dari menu untuk BMT via filter; navigasi langsung masih render (acceptable MVP, no route-level guard).

## Konsekuensi

### Positif
- **UX jelas per jenis**: Pengguna Konvensional tidak bingung dengan menu ZIS/Wakaf; pengguna BMT tidak ragu dengan "Pinjaman" (jelas: "Akad").
- **Reuse same routes**: Semua rute `/kop/$sekolah/*` tetap sama (mis. `/pembiayaan` untuk akad syariah & pinjaman konvensional); hanya menu & label adaptif.
- **Pure, testable filter**: `filterKoperasiNav()` pure function → 3 unit tests, tidak ada fixture DB, deterministic.
- **Minimal backend change**: Backend mode sudah exist & validated; frontend hanya baca.
- **Scalable**: Jika ada mode ketiga (mis. Hibrid), cukup retag `KOPERASI_NAV` + tambah enum `KoperasiMode`.

### Negatif
- **Label duplication**: Backend `MODE_SYARIAH = "Syariah (BMT)"` hard-coded di frontend (`useKoperasiMode.ts`) → jika backend value berubah, frontend break. **Mitigation:** Declare frontend constant `MODE_SYARIAH` yang mirror backend; document coupling.
- **Fallback superset logic**: Defaulting `isSyariah = true` saat loading berarti BMT-only pages (ZIS) akan mount & query sebelum mode known. **Mitigation:** Accept ini — data load parallel, no extra latency; fallback only masks until data arrive.
- **Route-level guard deferred**: `/suku-bunga` render untuk siapa saja (menu hide only). **Mitigation:** MVP acceptable; if strict, add middleware guard on route (Phase 2).

### Trade-off Ditunda (YAGNI)
- **Suku Bunga form editing**: Frontend read-only hanya. Full CRUD editing via Frappe desk. Scope keep di M (7 files, 1 new route, menu restructure, tests).
- **Dynamic mode switch**: One-time oncreate per sekolah. No mode-switch workflow untuk existing koperasi (would need wizard, data migration). Backend only.
- **Audit trail mode change**: Logging backend untuk mode switch deferred (Phase 3 compliance).

## Referensi

- **Spec:** `docs/superpowers/specs/2026-06-02-koperasi-menu-by-type-design.md`
- **Plan:** `docs/superpowers/plans/2026-06-02-koperasi-menu-by-type.md`
- **Menu data:** `apps/school/src/lib/koperasi-nav.ts`
- **Filter impl:** `apps/school/src/lib/koperasi/filterKoperasiNav.ts`
- **Hook impl:** `apps/school/src/lib/koperasi/useKoperasiMode.ts`
- **Tests:** `filterKoperasiNav.test.ts` (3 cases), `useKoperasiMode.test.ts` (4 cases)
