# ASE-ADR-0001: Tenant Registry & Transfer Isolation

- Status: Accepted
- Tanggal: 2026-06-03
- Domain: Manajemen Aset

## Konteks

Pada Q1 2026, domain Manajemen Aset mengalami cross-tenant data leak: doctype transaksional (Aset, Permintaan Peminjaman Aset, Permintaan Maintenance Aset, Transfer Aset, Kategori Aset, Lokasi Aset) tidak terdaftar di `sekolahpro.api.tenant_registry.DOCTYPES["SCHOOL"]`, sehingga row-level security Frappe (berdasarkan ownership field `sekolah` → `organisasi`) tidak diterapkan. Pengguna Sekolah A bisa lihat/edit aset Sekolah B via REST API atau direct DB query.

Auditor keamanan & team infrastruktur flagged ini sebagai critical: multi-tenant SaaS tidak boleh ada unscoped doctype. Data model (constants.py, test fixtures) sudah correct; masalah pure registry omission.

## Keputusan

1. **Register 6 Doctype ke Tenant Registry:**
   - `Aset`, `Kategori Aset`, `Lokasi Aset`, `Permintaan Peminjaman Aset`, `Permintaan Maintenance Aset`, `Transfer Aset` (istable child Item Peminjaman Aset excluded; warisi dari parent).
   - Ownership field: `sekolah` (string link ke doctype Sekolah, self-anchored ke organisasi via sekolah.organisasi fetch_from).
   - Tier: `SCHOOL` (sekolah-anchored, bukan org-only atau global).

2. **Transfer Isolation:** Selesaikan Transfer Aset hanya boleh jika both_location (asal & tujuan) sama organisasi. Guard di transfer.py endpoint: throw ValidationError jika lokasi_asal.sekolah ≠ lokasi_tujuan.sekolah.

3. **Testing:** Backend DB test suite di sekolahpro/manajemen_aset/doctype/*/test_*.py validate invariant stok, enum, reserve/release, maintenance lock, transfer endpoint. Test coverage termasuk multi-tenant isolation + cross-tenant rejection.

## Konsekuensi

### Positif
- Eliminasi cross-tenant leak; data isolation now enforced at DB row level + app layer.
- Consistent dengan architecture ADR-0042 (tenant tiering); tenant_registry menjadi SSoT semua doctype.
- Regression test coverage: backend test suite termasuk isolation validation; vitest web lib 24 test unchanged.

### Negatif
- Backward compat: production DB sudah punya cross-scoped records (Aset, Peminjaman, etc.). Migration script needed untuk retro-assign sekolah ke orphan rows (audit data, fallback to dummy "MIGRASI" sekolah). Defer ke hotfix sprint.
- Pengaturan Manajemen Aset (Single, global) tetap out-of-scope tenant_registry (Single doctype tidak di-row-security). Acceptable trade-off: setting scope per sekolah, not per organisasi; sekolah already tenant-aware.

### Trade-off ditunda (YAGNI)
- **Cross-School Transfer (Future Feature):** Sekarang lock transfer ke same sekolah. If future requirement = share aset antar sekolah (mis. cluster pesantren), design Cross-School Transfer doctype + org-level audit trail. Defer sampai requirement clear.
- **Notification Routing:** Scheduler tandai_peminjaman_terlambat & maintenance notification belum send email/SMS; placeholder Pengaturan fields only. Defer ke Notification Module v2 sprint.

## Referensi

- **Tenant Registry:** `sekolahpro/sekolahpro/api/tenant_registry.py` (lines 108–113: Manajemen Aset doctype list)
- **Backend Tests:** `sekolahpro/sekolahpro/manajemen_aset/doctype/*/test_*.py` (127 test methods across 8 doctype)
- **Transfer Endpoint:** `sekolahpro/sekolahpro/manajemen_aset/api/transfer.py` (selesaikan action)
- **Constants:** `sekolahpro/sekolahpro/manajemen_aset/constants.py` (status/kondisi enum, limits)
