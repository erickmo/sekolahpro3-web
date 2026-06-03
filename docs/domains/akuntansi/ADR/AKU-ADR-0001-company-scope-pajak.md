# AKU-ADR-0001: Scoping Akuntansi per-Company, Bukan per-Sekolah

- Status: Accepted
- Tanggal: 2026-06-03
- Domain: Akuntansi

## Konteks

SekolahPro adalah multi-tenant per Sekolah. Ketika modul Keuangan & Akuntansi (Vernon Accounting) diintegrasikan, muncul pertanyaan: doctype akuntansi (Journal Entry, Account, Budget, dll) harus di-tenant oleh **Sekolah** atau **Company** (Frappe master)?

Alternatif:
1. **Company-scoped** (pilihan sekarang): Setiap doctype akuntansi punya `company` link field. Backend doctype di-define di vernon_accounting app (repo terpisah), independent dari sekolah schema. Frontend route parameter `$sekolah` auto-map ke active Company (dengan konvensi doc-id Company = doc-id Sekolah).
2. **Sekolah-scoped**: Tambah `sekolah` field ke semua doctype akuntansi. Share/reuse logic dengan modul akademik (sama-sama tenanted by Sekolah). Frappe tenantization simpler.
3. **Hybrid**: Sekolah → Company link; doctype primary-key Company; query dari frontend auto-filter by active Sekolah via Company.

Pertimbangan:
- **Vernon Accounting modularity**: Accounting app harus bisa standalone untuk multi-tenant SaaS (multiple schools / companies). Company adalah standard Frappe anchor untuk financial data.
- **Sekolah independence**: Fitur akademik/operasional scoped Sekolah (Student, Class, dll); akuntansi scoped Company membuatnya terpisah. Risknya: mapping Sekolah↔Company tidak tersambung.
- **API Filter Complexity**: Backend api-client TENANT_BLOCKLIST menempatkan semua accounting doctypes — skip auto-inject sekolah filter. Callers harus pass company filter eksplisit.

## Keputusan

Akuntansi scoped **per-Company**. Convention: active Sekolah name = Company name (misal `sd-aletheia-malang`). Frontend hook `useActiveCompany()` auto-derive company dari `useSessionStore().activeSekolah.name`. Utility `withCompanyFilter()` ensure setiap query punya `["company", "=", value]`.

## Konsekuensi

### Positif
- **Reusable module**: Vernon Accounting berdiri independent — bisa dipakai untuk multiple school SaaS atau diubah ke multi-tenant per organisasi.
- **Frappe standard**: Company adalah conventional anchor untuk GL, budget, tax; minimal mapping/mismatch dengan Frappe docs.
- **Modular backend**: Backend vernon_accounting tidak perlu ketahu tentang sekolah logic (student, kelas, akademik).
- **Clear separation**: Akuntansi bukan bagian of academic domain — clear boundary.

### Negatif
- **Sekolah↔Company mapping overhead**: Kalau Company name berbeda dari Sekolah, perlu sync logic. Saat ini, admin manual ensure kesamaan.
- **API complexity**: Callers harus remember `withCompanyFilter()`; forget to pass, result empty atau cross-tenant leak. TENANT_BLOCKLIST guards frontend, tapi backend still at risk jika dev lupa.
- **Tidak ada auto-propagation ke GL dari transaksi Sekolah**: School Fee Invoice (Operasional Keuangan) post GL via company scope, bukan sekolah scope. Integrasi harus explicit (payload mapping).

### Trade-off Ditunda (YAGNI)
- **Auto Sekolah→Company provisioning**: Deferred. Setup harus manual (admin create Company matching Sekolah name sebelum akuntansi bisa mulai).
- **Cross-company consolidation**: Deferred. Tidak ada group/parent company support.
- **Company rename sync**: Deferred. Rename Company atau Sekolah harus handle manual.

## Referensi
- `apps/school/src/lib/akuntansi-scope.ts` — Hook dan utility company scoping.
- `apps/school/src/data/akuntansi.ts` — DOCTYPE constants, setiap doctype punya `company` field.
- `packages/api-client/src/frappeResource.ts` — TENANT_BLOCKLIST, skip auto-inject sekolah untuk accounting doctypes.
- `docs/keuangan-redesign.md` — Backend wiring School Fee Invoice & School Expense; keduanya post GL via company.
