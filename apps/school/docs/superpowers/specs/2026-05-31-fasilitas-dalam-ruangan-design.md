# Fasilitas dalam Ruangan — Design Spec

Date: 2026-05-31
Status: Approved
Scope: Frontend only (TanStack React, `apps/school`). No Frappe Python changes.

## Problem

On the building detail page (`/sch/$sekolah/infrastruktur/daftar-gedung/$gedungId`),
the "Ruangan & Fasilitas" tab renders two independent tables: Ruangan and
Fasilitas Ruangan. Each has its own Tambah/Edit/Hapus. Adding a facility opens a
separate modal that forces the user to re-pick the target room. Conceptually a
facility belongs to a room — `Fasilitas Ruangan` is already a Frappe child table
of `Ruangan` (`parentfield = "fasilitas"`, `parenttype = "Ruangan"`).

## Goal

Move facility management into the room. The room form becomes the sole write path
for facilities. The detail page shows facilities read-only, expanded under their
room.

## Changes (3 files)

### 1. `packages/ui/src/components/DataTable.tsx` — additive expandable rows

- Add optional prop `renderExpanded?: (row: T) => ReactNode`.
- When present, prepend a chevron toggle cell per row; clicking toggles an
  internal expanded set keyed by `rowKey(row)`.
- Expanded row renders as a full-width `<tr>` directly beneath its parent row,
  cell `colSpan` spanning all columns, containing `renderExpanded(row)`.
- Prop absent → table renders exactly as today. No existing caller changes.

### 2. `src/components/infrastruktur/RuanganFormModal.tsx` — inline facility editor

- New state: `fasilitas` array of `{ nama_fasilitas, jumlah, kondisi }`.
- Below the room fields, a Fasilitas section: one editable row per facility
  (nama text, jumlah number, kondisi select Baik/Rusak), per-row delete, and a
  "Tambah baris" button.
- On edit: hydrate `fasilitas` from `docQ.data.fasilitas` (child rows returned by
  `get_doc`).
- On submit: include `patch.fasilitas = rows` (mapped, blank-name rows dropped).
  Frappe replaces the child table set in a single create/update. Parent linkage
  set server-side; no client `parent`/`parenttype` wiring.

### 3. `src/routes/sch.$sekolah.infrastruktur.daftar-gedung.$gedungId.tsx`

- Remove the standalone "Fasilitas Ruangan" SectionCard, its action column, and
  the `FasilitasRuanganFormModal` usage + state.
- Keep `fasilitasQ` (read-only). Group rows by `parent`.
- Pass `renderExpanded` to the Ruangan `DataTable` → expanded room row lists that
  room's facilities (nama, jumlah, kondisi badge), or an empty hint.

### Cleanup

- `FasilitasRuanganFormModal.tsx` becomes unused → delete (git retains history).

## Data flow

```
Room form (create/edit)  --patch.fasilitas[]-->  Ruangan doc (child table)
Detail page              --read fasilitasQ-->     expanded room rows (read-only)
```

Delete a facility = remove its row in the room form, then save.

## Edge cases

- Ruangan autoname `{lantai}-{kode}`; facility child rows need no client parent id.
- Blank-name facility rows are dropped before submit.
- Update with empty `fasilitas` array clears all facilities for that room (expected).

## Out of scope

- Per-facility inline editing on the detail page (now only via room form).
- Backend/doctype changes.
