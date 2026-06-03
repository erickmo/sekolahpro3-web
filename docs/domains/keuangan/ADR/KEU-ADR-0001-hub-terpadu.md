# KEU-ADR-0001: Hub Terpadu Keuangan + Akuntansi, Mock→Live Fallback

- Status: Accepted
- Tanggal: 2026-06-03
- Domain: Keuangan

## Konteks

Sistem lama memiliki dua menu terpisah (Keuangan operasional + Akuntansi) dengan duplikasi fitur (Jurnal muncul di kedua tempat), navigasi yang membingungkan, dan tidak ada visualisasi atau onboarding untuk staf baru. Backend vernon_accounting telah menyediakan doctype standar untuk invoice, expense, dan payment, tetapi frontend masih menggunakan mock data fixtures.

Keputusan perlu dibuat untuk:
1. Menyatukan dua UI tree (`/keuangan` dan `/akuntansi`) agar terasa satu modul
2. Menentukan apakah mengalihkan `/akuntansi/*` → `/keuangan/akuntansi/*` (URL migration) atau menyatukannya hanya di shell/nav
3. Menentukan strategi transisi mock → live data untuk Tagihan dan Pengeluaran

## Keputusan

1. **Hub terpadu dalam shell + nav, TANPA URL migration:** Kedua route-tree (`/keuangan` dan `/akuntansi`) tetap di lokasi URL asli. Penyatuan dilakukan di:
   - Sidebar: satu entri "Keuangan & Akuntansi" dengan icon tunggal
   - KeuanganHubNav: nav-group yang digunakan layout di `/keuangan` DAN `/akuntansi` (cross-tree nav sharing)
   - Visual continuity: sama styling, peran/chip, PageGuide bertingkat

   Alasan TANPA URL migration:
   - TanStack file-based routing: rename 35 file akuntansi + 100+ referensi `to=` terlalu rapuh & memecah deep link
   - Test coverage & maintenance: 35 halaman test harus di-repoint
   - External reference stability: deeplink `/akuntansi/buku-besar` sudah di-share ke user, bookmark, LMS
   - Risk: NONE — feature parity tanpa teknis berisiko tinggi

2. **Live data untuk Tagihan, Pengeluaran, dan Pembayaran:**
   - Tagihan via `useTagihanLive()` → School Fee Invoice doctype (status: Draft|Belum Dibayar|Sebagian|Lunas|Dibatalkan)
   - Pengeluaran via `usePengeluaranLive()` → School Expense doctype (status: Draft|Approval|Disetujui|Ditolak|Dibayar)
   - Pembayaran via `usePembayaranLive()` → School Fee Payment doctype (references School Fee Invoice via `invoice` field)
   - Buku Kas derived from live payments & expenses, not mock fixtures
   - All queries filtered by `useActiveCompany()` for company scoping

3. **Company scoping untuk vernon_accounting doctype:**
   - Konvensi: Company doc-id = Sekolah doc-id (misal `sd-aletheia-malang`)
   - Semua `useResourceList` Tagihan/Pengeluaran/Pembayaran filter: `["company", "=", useActiveCompany()]`
   - Backend admin setup: pastikan Company ada untuk setiap Sekolah sebelum go-live
   - Alasan: vernon_accounting multi-tenant by company (standar Frappe); menghindari cross-school data leak

## Konsekuensi

### Positif
- Staf melihat satu hub "Keuangan" tanpa perlu tahu dua route-tree berbeda
- Tidak ada URL migration → deeplink stabil, test tidak berubah, commit history clean
- Semua data live (tidak ada mock fallback) — mengurangi gap antara development dan production
- Role-adaptive UI (PageGuide, nav emphasis) konsisten lintas Operasional/Akuntansi
- Company scoping selaras dengan pola vernon_accounting yang sudah terbukti di modul lain

### Negatif
- Nav logic sedikit lebih kompleks: `resolveActiveSection()` harus handle dua pathname pattern (`/keuangan` vs `/akuntansi`)
- User mungkin bingung ketika refresh atau bookmark halaman akuntansi (URL masih `/akuntansi`, bukan `/keuangan/akuntansi`)
— *Mitigasi:* NavBar + breadcrumb selalu jelas menunjukkan "Keuangan > Akuntansi > Buku Besar"
- Company mismatch di backend → data tidak muncul, user bingung
— *Mitigasi:* Admin onboarding doc + test coverage untuk Company setup

### Trade-off ditunda (YAGNI)
- URL migration `/akuntansi → /keuangan/akuntansi`: Re-evaluate Q3 2026 jika URL menjadi pain point (mereka tidak sekarang)
- Fully automated reconciliation (match Pembayaran ke Invoice otomatis): Deferred; manual UI selection cukup untuk MVP
- Multi-currency support: Future (enterprise feature)

## Referensi

- `apps/school/src/lib/keuanganHub.ts` — IA hub, `resolveActiveSection()`, nav groups
- `apps/school/src/lib/keuanganRole.ts` — peran presentasi, fallback permisif
- `apps/school/docs/keuangan-redesign.md` — spec lengkap fase 1 (TDD 42 test, 5 halaman)
- `apps/school/src/data/keuangan-live.ts` — doctype wiring, Company scoping via `useActiveCompany()`
- `apps/school/src/lib/akuntansi-scope.ts` — Company filter pattern
- Backend: `vernon_accounting` module (terpisah) — School Fee Invoice, School Expense, School Fee Payment doctypes + GL controller
