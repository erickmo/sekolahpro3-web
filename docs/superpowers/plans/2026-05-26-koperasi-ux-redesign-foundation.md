# Koperasi UX Redesign — Foundation Batch

**Date:** 2026-05-26
**Branch:** `feat/koperasi-ux-redesign`
**Scope:** Top backlog items #4, #9, #3, #2 (S+M tier)
**Strategy:** 1 PR, all changes on this branch, squash merge

## Source UX audit
See conversation history (UX agent audit 2026-05-26) — 4 persona, 10-item backlog.

## In-scope changes

### Item #4 — Nav konsolidasi 14→6 group + drop dashboard stub (S)
**Files:**
- `apps/school/src/routes/koperasi.tsx` — restructure `TABS` array into 6 groups
- `apps/school/src/routes/koperasi.index.tsx` — remove `SALDO_KAS_STUB`, remove `KAS_TELLER_BELUM_CLOSING_STUB`, mark mock aggregation explicit with banner

**6 groups:**
1. **Dashboard** → `/koperasi`
2. **Anggota & Rekening** → `/koperasi/daftar`, `/koperasi/rekening`
3. **Operasional** → `/koperasi/transaksi`, `/koperasi/kas-teller`, `/koperasi/kartu`, `/koperasi/emoney`
4. **Pembiayaan** → `/koperasi/pembiayaan`, `/koperasi/angsuran`
5. **Sosial** → `/koperasi/zis`, `/koperasi/wakaf`, `/koperasi/shu`
6. **Admin** → `/koperasi/persetujuan` (new), `/koperasi/laporan`, `/koperasi/pengaturan`

Implementation: keep `Tabs` for top-level group; add secondary sub-tab inside group when child present.

### Item #9 — Skeleton + Alert primitives + replace alert() stubs (S)
**Files:**
- `packages/ui/src/primitives/skeleton.tsx` (new)
- `packages/ui/src/primitives/alert.tsx` (new)
- `packages/ui/src/index.ts` (export)
- `apps/school/src/routes/koperasi.kas-teller.tsx` — replace `alert("Form buka sesi kas (P2)")` with proper modal (see Item #3)
- `apps/school/src/routes/koperasi.shu.tsx` — replace `alert("Form pembagian SHU (P2)")` with disabled button + tooltip "Tersedia di sprint berikutnya"
- `apps/school/src/routes/koperasi.zis.tsx`, `koperasi.wakaf.tsx` — same pattern
- `apps/school/src/routes/koperasi.index.tsx` — use `Skeleton` for anggota loading state, `Alert` for error

**Tests:** `packages/ui/src/primitives/__tests__/skeleton.test.tsx`, `alert.test.tsx` — render variants, a11y role.

### Item #3 — Sesi Kas form (Buka + Tutup) + persistent banner (M)
**Files:**
- `apps/school/src/components/koperasi/SesiKasForm.tsx` (new) — form Buka (shift, modal_kas, denominasi_buka table) + Tutup (denominasi_tutup, catatan_selisih)
- `apps/school/src/components/koperasi/SesiKasBanner.tsx` (new) — persistent banner (top of `koperasi.tsx` layout) showing aktif sesi: nomor, modal, durasi, button "Tutup Kas"
- `apps/school/src/routes/koperasi.tsx` — render `SesiKasBanner` above tabs
- `apps/school/src/routes/koperasi.kas-teller.tsx` — wire `onAdd` to open `SesiKasForm` modal in Buka mode
- `apps/school/src/lib/koperasi/sesiKas.ts` (new) — `computeSelisih`, `computeTotalDenominasi`, `validateBukaSesi`, `validateTutupSesi`

**Schema reference:** `docs/domains/koperasi/entities/sesi-kas-teller.html`
- Fields: `teller, tanggal, shift, status, supervisor_buka, modal_kas, denominasi_buka[], denominasi_tutup[], catatan_selisih, supervisor_tutup`
- Lifecycle: Draft → Aktif → Pending Approval → Selesai
- Rule: `total_denominasi_buka == modal_kas` (validate buka)
- Rule: `selisih = total_denominasi_tutup − saldo_seharusnya`; if `!= 0` → `catatan_selisih` mandatory

**Tests:** `apps/school/src/lib/koperasi/__tests__/sesiKas.test.ts` — pure functions only.

### Item #2 — Approval Inbox `/koperasi/persetujuan` + reason-on-reject modal (M)
**Files:**
- `apps/school/src/routes/koperasi.persetujuan.tsx` (new) — Tabs with badge count: Buka Rekening, Tutup Rekening, Blokir, Unblokir, Aktivasi Dormant, Pembiayaan
- `apps/school/src/components/koperasi/PermohonanRow.tsx` (new) — row with Avatar nasabah + ringkasan + ApprovalBar inline
- `apps/school/src/routes/koperasi.tsx` — add to nav under group "Admin"

**Schema reference:** `docs/domains/koperasi/entities/permohonan-*.html` (5 doctypes, all share lifecycle Draft → Diajukan → Disetujui/Ditolak; `alasan_penolakan` mandatory if Ditolak)

Use existing `@sekolahpro/ui` `ApprovalBar` + `RejectModal` (recently added on perpustakaan branch, available here).

**Tests:** `apps/school/src/routes/__tests__/koperasi.persetujuan.test.tsx` — render, badge count derivation, tab switching.

## Out-of-scope (deferred to next sprint)
Items #1, #5, #6, #7, #8, #10 — see audit doc.

## Test strategy
- New pure utilities in `lib/koperasi/` → unit tests required.
- New UI primitives → smoke render tests.
- New routes → 1 happy-path render test each.
- Existing route mutations → skip unit, rely on type-check + visual designqc.

## Acceptance criteria (DoD)
- [ ] All `alert("...P2")` calls removed from koperasi routes.
- [ ] `SALDO_KAS_STUB`, `KAS_TELLER_BELUM_CLOSING_STUB` removed; dashboard no longer shows fake numbers as authoritative.
- [ ] Nav shows 6 groups; tablet 1024px no horizontal overflow.
- [ ] `/koperasi/persetujuan` route renders; rejecting any permohonan requires `alasan_penolakan` text.
- [ ] Buka Sesi Kas form validates `total_denominasi_buka == modal_kas` client-side before submit.
- [ ] Tutup Sesi Kas form requires `catatan_selisih` when selisih != 0.
- [ ] `tsc --noEmit` passes.
- [ ] `vitest run` passes (≥ 4 new test files).
- [ ] `eslint` passes (warnings allowed, no errors).

## Cerebrum + memory updates after merge
- `.wolf/cerebrum.md` → Key Learning: koperasi UI 4-persona pattern.
- `.wolf/anatomy.md` → new files registered.
- `.wolf/memory.md` → session log entry.
