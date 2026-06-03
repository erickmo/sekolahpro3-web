# PGT-ADR-0001: Gating Fitur via Feature Flag dan Modul Aktif (Global Doctype, bukan Per-Sekolah)

- Status: Accepted
- Tanggal: 2026-06-03
- Domain: Pengaturan

## Konteks

SekolahPro adalah SaaS multi-tenant dengan per-sekolah (per-tenant) konfigurasi. Beberapa fitur perlu di-gate (enable/disable) pada level SaaS global atau per-tenant karena:

1. **Rollout bertahap:** Fitur baru (mis. Mobile PWA, Payments V2) dirilis ke subset sekolah dulu.
2. **Feature completeness:** Beberapa modul (Asrama, Pesantren) hanya relevan untuk subset sekolah.
3. **Compliance / licensing:** Billing tier menentukan modul apa yang tersedia (Plus tier dapat Integrasi EMIS, Enterprise mendapat SSO SAML).

Pilihan arsitektur:
- **Opsi A (dipilih):** Feature Flag dan Modul Aktif adalah doctypes global (tidak per-sekolah). Audience filtering via JSON (roles/sites) memungkinkan scoping per-tenant. Modul Aktif adalah child table dalam Organisasi doctype.
- **Opsi B (ditolak):** Setiap sekolah punya instance Feature Flag dan Modul Aktif terpisah. Kompleks, duplikasi master data, sulit sync.
- **Opsi C (ditolak):** Hardcode flag di code + redeploy. Inflexible, tidak bisa hot-toggle.

## Keputusan

Implementasi Feature Flag dan Modul Aktif sebagai master data global dengan scoping:

1. **Feature Flag Doctype** (global):
   - Field: `key` (unique), `enabled` (checkbox), `rollout_pct` (0–100), `audience_json` (JSON filter: roles[], sites[]).
   - Evaluation di backend via `is_enabled(key, user)` function. Cache 60s per flag.
   - Stable hash bucketing untuk consistent rollout % per user.

2. **Modul Aktif** (child table dalam Organisasi):
   - Field: `nama_modul` (select enum), `aktif` (checkbox).
   - Per-tenant toggle; Organisasi doctype hold list modul aktif setiap tenant.

3. **Frontend UI:**
   - Tab "Feature Flag" dan "Modul Aktif" di Pengaturan dashboard.
   - Inline toggle untuk quick enable/disable.
   - Detail page untuk edit audience_json (Feature Flag) dan deskripsi.

4. **Backend Integration:**
   - Feature Flag cache di process-local dict, invalidate on doctype update.
   - Modul Aktif tidak ada cache; direct DB query saat diperlukan (jarang berubah).
   - Routes yang perlukan gate menjalankan `is_enabled()` check atau `modul in aktif_list()`.

## Konsekuensi

### Positif
- **Flexibility:** Hot-toggle fitur tanpa redeploy.
- **Granular rollout:** Rollout % + audience filter untuk canary/phased rollout.
- **Multi-tenant safe:** Global master data dengan audience scoping mencegah duplikasi per-tenant.
- **Audit trail:** Setiap flag change tercatat (doctype track_changes=1).
- **Cache efficiency:** 60s TTL cegah DB hammering; invalidate on update cegah stale state.

### Negatif
- **Audience JSON complexity:** Developer perlu understand JSON schema (roles[], sites[]); risk typo. Mitigasi: schema validation di doctype controller.
- **Rollout % non-deterministic:** User dalam same bucket konsisten (stable hash), tetapi tidak bisa guarantee exact % karena user distribution. Mitigasi: document behavior + monitoring.
- **Global vs tenant scope confusion:** Doctype global tetapi gating is per-tenant. Mitigasi: naming (Feature Flag, bukan "School Feature Flag") + doc comments jelas.

### Trade-off ditunda (YAGNI)
- **Scheduled rollout:** No time-based gradual rollout (10% day 1 → 100% day 7). Bisa di-add later via cron + rollout_pct update.
- **Per-user override:** No explicit user-level flag override (mis. QA tester gets feature before rollout %). Bisa di-add via audience_json roles filter (QA role gets early access).
- **Dependency validation:** No constraint bahwa modul B requires modul A aktif. Bisa di-add via child table validation rules.

## Referensi

- apps/sekolahpro/sekolahpro/pengaturan/doctype/feature_flag/feature_flag.json
- apps/sekolahpro/sekolahpro/pengaturan/doctype/modul_aktif/modul_aktif.json
- apps/sekolahpro/sekolahpro/utils/feature_flags.py (is_enabled, feature_flag decorator, cache logic)
- apps/sekolahpro-web/apps/school/src/routes/sch.$sekolah.pengaturan.feature-flag.tsx
- apps/sekolahpro-web/apps/school/src/routes/sch.$sekolah.pengaturan.modul.tsx
