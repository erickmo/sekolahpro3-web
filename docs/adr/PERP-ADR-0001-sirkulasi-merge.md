# PERP-ADR-0001 — Merge perpustakaan sirkulasi into single Peminjaman hub

- **Status:** Accepted, implemented 2026-05-25
- **Scope:** `apps/school` (frontend) + backend doctype `Denda Perpustakaan` & whitelisted method (repo `apps/sekolahpro`)
- **Branch:** `feat/perpustakaan-sirkulasi-merge`
- **Spec:** [2026-05-25-perpustakaan-sirkulasi-merge-design](../superpowers/specs/2026-05-25-perpustakaan-sirkulasi-merge-design.md)
- **Plan:** [2026-05-25-perpustakaan-sirkulasi-merge](../superpowers/plans/2026-05-25-perpustakaan-sirkulasi-merge.md)

## Context

Three parallel routes `/perpustakaan/peminjaman`, `/perpustakaan/pengembalian`, `/perpustakaan/denda` forced staff to tab-hop for one workflow. The detail "Kembalikan" action wrote `status="Selesai"` directly on `Peminjaman Buku` via `db.set_value`, bypassing `Pengembalian Buku.on_submit` — so eksemplar were not released, denda was not generated, and reservasi was not promoted. Manual create modals for `Pengembalian Buku` / `Denda Perpustakaan` invited drift between FE and backend invariants.

## Decision

1. Collapse circulation into one hub: `/perpustakaan/peminjaman` owns list, return, and denda payment. Drop the standalone `pengembalian` and `denda` tabs.
2. Return flow always goes through `Pengembalian Buku` insert + submit (`frappe.client.insert` → `frappe.client.submit`) so backend hooks run. No more `db.set_value` shortcut.
3. Denda surfaces inline as a drawer scoped to a single peminjaman; mark-lunas patches `status_bayar` + `tanggal_lunas`.
4. Denormalize `peminjaman` (Link → Peminjaman Buku) onto `Denda Perpustakaan`. Backfill historical rows from `Pengembalian Buku.peminjaman`. List view aggregates via one whitelisted method `sekolahpro.perpustakaan.api.denda.get_denda_summary(names)` (capped at 100 names per call).
5. Old URLs redirect: `/perpustakaan/pengembalian[/$name]` → `/perpustakaan/peminjaman?status=Selesai` (or `…/$peminjaman` when resolvable); `/perpustakaan/denda[/$name]` → `/perpustakaan/peminjaman?denda=ada`.
6. Cross-context return triggers added in detail anggota and detail buku — same `ReturnModal`, same mutation invalidations.

## Consequences

**Positive:**
- One mental model for sirkulasi; the "Kembalikan" button is the single write-path.
- Backend invariants (eksemplar release, denda generation, reservasi promotion) are no longer skippable from the UI.
- List view shows `total_denda` + `status_bayar` per row via one batched call instead of N reads.

**Trade-offs:**
- `Denda Perpustakaan.peminjaman` is denormalized — kept consistent at insert (`pengembalian_buku.py _buat_denda_jika_terlambat`) + backfill patch `v0_6_0.backfill_denda_peminjaman`. Drift risk if a future code path bypasses that helper; mitigated by tests in `test_denda.py` + `test_pengembalian_buku.py`.
- `decorateRows` on `ResourceListPage` now performs a follow-up POST per page fetch. Tolerates failure (table renders without the denda column) — see commit `237fb35` for the surfaced-error variant.
- TanStack `redirect` runs client-side; deep links to deleted routes show a brief flash before redirect. Acceptable.

## Files of record

- FE components: `apps/school/src/components/perpustakaan/{ReturnModal,DendaDrawer,dendaSummary}.{tsx,ts}`
- FE routes touched: `perpustakaan.tsx`, `perpustakaan.peminjaman.tsx`, `perpustakaan.peminjaman.$name.tsx`, `perpustakaan.anggota.$name.tsx`, `perpustakaan.$isbn.tsx`, redirect stubs for `perpustakaan.pengembalian[.$name].tsx` and `perpustakaan.denda[.$name].tsx`
- Backend (separate repo): `denda_perpustakaan.json`, `pengembalian_buku.py`, `patches/v0_6_0/backfill_denda_peminjaman.py`, `perpustakaan/api/denda.py`

## Commits

`9f5da06` `e77e725` `5ba0cd4` `487aae6` `199de85` `ae22a16` `341e959` `041a916` `b70688c` `bc6aea7` `ab1281a` `237fb35`
