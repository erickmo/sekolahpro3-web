# GLOBAL-ADR-0001: Tenant scoping berbasis header + blocklist doctype global

- Status: Accepted
- Tanggal: 2026-06-03
- Cakupan: Global (semua domain bertenant `sekolah`)
- Sumber kebenaran sisi web: `packages/api-client/src/frappeResource.ts`

## Konteks

SekolahPro multi-tenant: satu site Frappe melayani banyak `Sekolah`. Hampir semua
doctype domain (siswa, akademik, perpustakaan, koperasi, aset, dst.) di-anchor ke
satu sekolah lewat field `sekolah`. Tanpa scoping yang konsisten, daftar/deep-link
bisa membocorkan data antar-sekolah.

Tidak semua doctype punya field `sekolah`: data master/global (Tahun Ajaran, User,
Role, Sekolah, Organisasi), doctype platform `vernon_ads`, tier ORG_ONLY yang
di-anchor `organisasi`, child table (`istable=1`, scope lewat induk), dan doctype
akuntansi yang di-scope `company`. Menyuntik filter `sekolah` ke doctype-doctype ini
menarget kolom yang tidak ada → query kosong / error.

## Keputusan

1. **Header tenant aktif.** Setiap request mengirim `X-Active-Sekolah`
   (`ACTIVE_SEKOLAH_HEADER`) berisi doc-ID sekolah aktif. Backend
   `sekolahpro.api.tenant_scope.auto_set_tenant` membaca header ini untuk mengisi
   `sekolah`/`organisasi` pada write dan memvalidasinya terhadap keanggotaan user.
   Dikirim di SEMUA request agar server tak pernah menebak tenant dari sesi.

2. **Blocklist doctype global** (`TENANT_BLOCKLIST`). Injeksi auto-scope `sekolah`
   dilewati untuk: master/global, 7 doctype `vernon_ads`
   (Property, Property Group, Ad Slot, Campaign, Ad Creative, Ad Event, Ads Customer),
   tier ORG_ONLY (`Langganan`, `Invoice Tenant`), child table, dan doctype akuntansi
   (`company`-scoped).

3. **Cross-tenant deep-link → 404.** Dokumen yang tak masuk sekolah aktif melempar
   `TenantMismatchError`; route menangkapnya dan merender halaman 404 agar data
   tak bocor lewat URL.

## Konsekuensi

### Positif
- Scoping konsisten di seluruh domain tanpa tiap pemanggil mengulang filter.
- Doctype baru cukup punya field `sekolah` untuk otomatis ter-scope.

### Negatif / kewajiban
- **Doctype anchored baru WAJIB didaftarkan** ke `tenant_registry.py`
  `DOCTYPES['SCHOOL']` di backend; bila tidak, scoping bocor diam-diam.
  (Lihat insiden manajemen-aset: 6 doctype lupa didaftarkan → cross-tenant leak.)
- Doctype tanpa `sekolah` WAJIB masuk `TENANT_BLOCKLIST`; bila tidak, list rusak
  karena filter menarget kolom tak ada.

### Trade-off ditunda (YAGNI)
- Pemetaan `Sekolah ↔ Company` untuk akuntansi belum diwire; pemanggil masih
  mengoper filter `company` eksplisit.

## Referensi
- `packages/api-client/src/frappeResource.ts` (`ACTIVE_SEKOLAH_HEADER`, `TENANT_BLOCKLIST`, `TenantMismatchError`)
- `packages/api-client/src/frappeResource.test.ts` (kontrak blocklist vernon_ads)
- Backend: `tenant_registry.py` `DOCTYPES['SCHOOL']`, `sekolahpro.api.tenant_scope` (repo terpisah), ADR-0043 (tier ORG_ONLY)
