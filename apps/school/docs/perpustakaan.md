# Perpustakaan — Sirkulasi (v0.6.0)

One hub: `/perpustakaan/peminjaman`. Pinjam → Kembali → Denda all live here.

## Routes

| Route | Purpose |
|---|---|
| `/perpustakaan/peminjaman` | List + filter + row actions (Kembalikan, Bayar Denda) |
| `/perpustakaan/peminjaman/$name` | Detail; opens `ReturnModal` + `DendaDrawer` |
| `/perpustakaan/anggota/$name` | Section "Peminjaman Aktif" with per-row return trigger |
| `/perpustakaan/$isbn` | Section "Sedang Dipinjam" with per-row return trigger |
| `/perpustakaan/pengembalian[/$name]` | **Redirect** → `…/peminjaman?status=Selesai` (or resolved detail) |
| `/perpustakaan/denda[/$name]` | **Redirect** → `…/peminjaman?denda=ada` (or resolved detail) |

## Write paths

- **Pinjam:** `PerpCreateModal` → `frappe.client.insert` on `Peminjaman Buku`.
- **Kembali:** `ReturnModal` → `frappe.client.insert` then `frappe.client.submit` on `Pengembalian Buku`. Backend `on_submit` releases eksemplar, generates `Denda Perpustakaan` when late, promotes reservasi. **Do not** `db.set_value(status="Selesai")` — bypasses hooks.
- **Bayar denda:** `DendaDrawer` → `updateResource("Denda Perpustakaan", name, { status_bayar: "Lunas", tanggal_lunas })`.

## Denda summary

List view enriches rows via `fetchDendaSummary(names)` → whitelisted `sekolahpro.perpustakaan.api.denda.get_denda_summary`. Cap: 100 names per call. Failures surface in the list (commit `237fb35`); table still renders, denda column shows error state.

## Invalidation contract

After return submit, invalidate query keys:
- `["resource:list", "Peminjaman Buku"]`
- `["resource:doc", "Peminjaman Buku", <name>]`
- `["resource:list", "Denda Perpustakaan"]`

After mark-lunas, invalidate `["resource:list", "Denda Perpustakaan"]`.

## See also

- ADR: [`docs/adr/PERP-ADR-0001-sirkulasi-merge.md`](../../../docs/adr/PERP-ADR-0001-sirkulasi-merge.md)
- Spec: [`docs/superpowers/specs/2026-05-25-perpustakaan-sirkulasi-merge-design.md`](../../../docs/superpowers/specs/2026-05-25-perpustakaan-sirkulasi-merge-design.md)
