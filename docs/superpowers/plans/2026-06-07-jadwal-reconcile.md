# Jadwal Tournament — Cross-Persona Reconcile (2026-06-07)

Three separate design tournaments ran for the Jadwal module (6 competitors each), one per persona. This note reconciles the three winners so they compose into ONE coherent module instead of three forks.

## Winners

- **Tata Usaha (Admin TU)** -> winner **C1** (Simplest-path), runner-up C4
- **Guru (Teacher)** -> winner **C4** (Reimagine — kill the grid, personal Agenda feed where every change is a diffed inline event), runner-up C1
- **Kepala Sekolah (Headmaster)** -> winner **C1** (Simplest-path), runner-up C6

## Conflicts (overlap / collision risk)

### Phantom Workflow doctype
- Personas: Tata Usaha, Kepala Sekolah
- TU and Kepala both assume a native Workflow on Jadwal Pelajaran; none exists, workflowActions.ts is fake. Contradictory state machines on one column.

### Override delete vs re-surface vs keep
- Personas: Tata Usaha, Guru, Kepala Sekolah
- TU deletes the split, Guru shows rows as diffs, Kepala keeps CRUD. Guru/Kepala must read the doctype, not TU's route.

### Invented fields + rebuilt validate
- Personas: Tata Usaha, Guru, Kepala Sekolah
- Real fields are mata_pelajaran/ruangan, no tipe/durasi_menit. Conflict detection already in jadwal_conflict.py (is_aktif=1-gated).

### Request doctype + permissions
- Personas: Tata Usaha, Guru, Kepala Sekolah
- Guru Permintaan, TU Kotak, Kepala approval are one lifecycle; register in tenant_registry. Three role-perm sets need one matrix.

### Approver collision
- Personas: Guru, Kepala Sekolah, Tata Usaha
- Guru/TU use kurikulum, Kepala uses kepala_sekolah; reconcile transition roles.

### NAV + resolver duplicated
- Personas: Tata Usaha, Guru, Kepala Sekolah
- Flat 5-item NAV; three want different slices. All need override-over-base resolution but no resolver exists.

## Shared spine (reuse across all 3)

- Reuse 4 existing doctypes, real fields mata_pelajaran/ruangan.
- Add durasi_menit + optional tipe to Slot Jadwal.
- ONE Workflow on Jadwal Pelajaran; replace fake workflowActions.ts.
- ONE doctype Permintaan Jadwal for all 3 roles; register in tenant_registry.
- ONE resolver jadwal_resolver.py.
- Reuse jadwal_conflict.py via dry-run endpoint.
- Query Reports Cakupan + Beban Mengajar Guru reused by all.
- Role-filtered NAV in lib/jadwalNav.ts; reuse ModuleShell/StatCard/PageGuide.
- ONE Notification config.
- guru = Pegawai.user = session user.
- ONE DocPerm matrix.

## Recommendation

Ship ONE role-sliced Jadwal module, not three forks. Build the spine first, then personas as thin layers.

## Build order

1. SPINE-0 migration: durasi_menit + tipe on Slot Jadwal.
2. SPINE-1 Workflow on Jadwal Pelajaran; replace fake workflowActions.ts.
3. SPINE-2 doctype Permintaan Jadwal; register in tenant_registry.
4. SPINE-3 jadwal_resolver.py + dry-run endpoint + 2 Query Reports + Notification.
5. SPINE-4 DocPerm matrix + role-filtered NAV + PageGuide.
6. TU: Papan Susun grid + Kotak inbox.
7. Guru: Agenda feed + JTM StatCards + Permintaan Saya.
8. Kepala: Pantauan landing + Persetujuan inbox.
9. Integration: NAV slicing, Override reachable, bench run-tests, tenant-leak, build green.

## Plan files

- `docs/superpowers/plans/2026-06-07-jadwal-tata-usaha-tournament.md` — POV Tata Usaha (Admin TU)
- `docs/superpowers/plans/2026-06-07-jadwal-guru-tournament.md` — POV Guru (Teacher)
- `docs/superpowers/plans/2026-06-07-jadwal-kepala-sekolah-tournament.md` — POV Kepala Sekolah (Headmaster)
