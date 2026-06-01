# Ekstrakurikuler — Execution Plan (TDD)

Design: [2026-06-02-ekstrakurikuler-design.md](../specs/2026-06-02-ekstrakurikuler-design.md)
Branch: `feat/ekstrakurikuler` (backend in docker-mounted main checkout; frontend in `extracuriculer` worktree)

## DocTypes (6) — module `Ekstrakurikuler`

| # | DocType | folder | istable | autoname | registry |
|---|---------|--------|---------|----------|----------|
| 1 | Ekstrakurikuler | ekstrakurikuler | no | EKSK-.#### | SCHOOL |
| 2 | Mitra Ekstrakurikuler | mitra_ekstrakurikuler | no | MITRA-.#### | SCHOOL |
| 3 | Pendaftaran Ekstrakurikuler | pendaftaran_ekstrakurikuler | no | DAFT-.#### | SCHOOL |
| 4 | Sesi Ekstrakurikuler | sesi_ekstrakurikuler | no | SESI-.#### | SCHOOL |
| 5 | Kehadiran Ekstrakurikuler | kehadiran_ekstrakurikuler | **yes** | — | NOT registered |
| 6 | Raport Ekstrakurikuler | raport_ekstrakurikuler | no | RAPK-.#### | SCHOOL |

Every anchored doctype: `sekolah` (Link reqd) + `organisasi` (Link read_only,
fetch_from sekolah.organisasi). Child carries neither.

## Backend order (red test → json+py → docker test green)

P0-1. Register doctypes 1,2,3,4,6 in `tenant_registry.py DOCTYPES["SCHOOL"]`.
1. **Ekstrakurikuler**: jam_selesai>jam_mulai; status Aktif⇒pembina set; penyelenggara
   Mitra⇒mitra set; master editable in closed TA.
2. **Mitra Ekstrakurikuler**: tanggal_akhir_mou>=tanggal_mulai_mou; no silent status flip.
3. **Pendaftaran**: kuota FOR-UPDATE block at active≥kuota; kuota 0 unlimited;
   duplicate active blocked; rejoin=new row; siswa same-sekolah; enroll blocked closed TA.
4. **Sesi + Kehadiran**: tahun_ajaran fetched from semester; kehadiran rejects
   non-enrolled siswa; no dup siswa; pertemuan_ke auto; child has no tenant fields;
   Sesi never touches Raport; immutable closed TA.
5. **Raport**: recap single GROUP BY snapshot matches kehadiran; denominator = student
   own rows; zero sessions→0%; unique (siswa,program,ta,semester); predikat required
   only when Final; tahun_ajaran from semester; immutable closed TA.

Run: `docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests sekolahpro.ekstrakurikuler.doctype.<dt>.test_<dt>`

## Frontend order (vitest red → impl green) — worktree `extracuriculer`

Pure libs first:
- `ekskulRole.ts` (+test) — DONE (16 green).
- `predikatFromKehadiran.ts` (+test): ≥90/≥75/≥50 thresholds (named constants), boundaries.
- `ekskulRecap.ts` (+test): persentase from {hadir,total}, zero-session, dashboard stats.
- `ekskulContext.tsx` (+test): clone akademikContext (TA+semester+dirty).

Then screens under `/sch/$sekolah/ekstrakurikuler`:
- layout (`.tsx`): EkskulContextProvider + period bar (reuse akademikPeriode) + GroupedNavTabs + role bar.
- index (`.index.tsx`): dashboard — stats strip + kuota + role focus + PageGuide.
- `program.index.tsx`: list + minimal create (nama+pembina+hari+jam+kuota).
- `mitra.index.tsx`: partnership list + create.
- `pendaftaran.index.tsx`: enroll into a program, kuota meter (display gate).
- `sesi-hari-ini.index.tsx` (PRIMARY): pembina one-tap today's session → attendance roster autosave.
- `kehadiran.$id.tsx`: a session's attendance grid (autosave, default Hadir).
- `raport.index.tsx`: per program+semester — Generate all + inline predikat grid.

Verify: `pnpm typecheck` + `pnpm test` + `pnpm build` (worktree).

## Docs (after green)

Backend `apps/sekolahpro/docs`: `domains/ekstrakurikuler/README.html` + `spec.html` +
`ADR/0001-no-sesi-raport-feeder.html` + index.html card + implementation-tracker rows.
Frontend `apps/sekolahpro-web/docs`: `adr/EKS-ADR-0001-lazy-recap.md` + this plan/spec.

## Definition of done

- All backend doctype tests green in docker; existing tenant-scope suite stays green.
- Frontend `pnpm typecheck` 0, `pnpm test` all pass, `pnpm build` ok.
- Docs updated both roots. Commit per repo, merge to main.
