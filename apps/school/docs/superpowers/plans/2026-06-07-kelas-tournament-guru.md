# Kelas Module Redesign — Tournament Plan (POV: Guru / Wali Kelas)

> Design-tournament output. **Proposal only — NOT implemented.** Human approves before `implement plan`.
> Date: 2026-06-07 · Feature: Kelas module (full redesign) · POV/Judge: **Guru / Wali Kelas (homeroom teacher)**
> Sibling plans: `2026-06-07-kelas-tournament-tu.md`, `2026-06-07-kelas-tournament-kepsek.md`,
> reconcile: `2026-06-07-kelas-tournament-reconcile.md` (read the reconcile FIRST — all three slice ONE module).

## POV brief (job-to-be-done)

Wali Kelas manages OWN single class day-to-day. Needs: roster (who is in my class, seat `no_urut`), who is
absent today, who is at academic risk, contact wali murid. Read-mostly on structure but **owns the human
relationship + reporting**. Today this is scattered across kelas-detail + akademik + absensi.
**GOOD = ONE cockpit for "kelasku": presence, risk flags, roster, quick notes. Mobile-ish, glanceable.**

## Winner — C4 Reimagine: "Kelasku" people-cards homeroom cockpit (score 37/45)

Kill "Kelas as an admin records module with a 7-tab detail page" and reframe it as **"Kelasku"**: ONE
self-routing live homeroom cockpit keyed to the logged-in wali kelas, where the class is a roster of
**PEOPLE-in-states** (present / absent / at-risk) — student cards with seat `no_urut`, a live presence chip,
a risk dot, one-tap "Hubungi Wali" (wa.me/tel), a slide-over student sheet, and a real **Catatan Wali**
quick-notes store — not a Rombongan Belajar config record behind tabs.

### Why it won (judged)

- **SF-A:** C1 (Simplest-path) 41 vs C2 (Power-user) 26 · **SF-B:** C4 41 vs C3 (Native-first) 36
- The two semifinal winners tied at 41 → **final re-run as a proper head-to-head: C4 37 vs C1 36.**
- Decisive tiebreak (teacher-judge voice): *"My notes ARE my job. C1's Catatan tab has no persistent store →
  my most important relationship work evaporates on refresh, which is worse than useless because it pretends
  to remember and doesn't."* C4 is the only design that gives quick-notes a **real home** (`Catatan Wali` doctype),
  deletes navigation entirely (zero-click self-route), and reads on a phone in the hallway (people-cards). It also
  wins the edge cases outright: explicit wali-of-zero / wali-of-two fallbacks + per-student note history that
  survives a mid-year transfer/reseat.
- C1 deservedly scored 5 on Simplicity + Feasibility (redirect + cockpit on existing doctypes, lowest blast radius);
  C4 was docked to 3 on Feasibility (its bespoke join method partly duplicates session-scoping). Phone-first-and-
  remembers beat cheap-and-forgetful by one point for the person who owns the human relationship.

### ⚠️ Verification facts surfaced by the judge (fold into build)

- **`useSession` already self-routes user→rombel** in beranda (precedent exists) → C4 should adopt C1's zero-click
  redirect and **DROP the bespoke `get_kelas_saya` whitelisted method** in favor of the existing session-scoping
  path. `wali_kelas` is a real field → "my class" is a 1-filter query, no new method strictly needed.
- **`catatan` today is mock-only** (string on a fake row) — there is genuinely NO persistent quick-notes store.
- **Absensi is NOT yet wired into kelas** (the detail file's own TODO admits it) → "Hadir Hari Ini" presence strip
  is net-new wiring in ANY design, not free.
- Query Report prior art exists (`laporan/report/`), tenant_registry exists → C4's report + doctype are buildable
  the native Frappe way.

## Grafted ideas (from eliminated designs + final)

1. **Report-backed risk** — *from C3 Native-first.* Power the Antrean Perhatian off the EXISTING native Script
   Report `rekap_absensi_siswa` (already aggregates Detail Absensi Harian by siswa/rombel/date, joins Entri Nilai<KKM,
   test-covered by `test_rekap_absensi_siswa.py`) instead of a fresh bespoke `get_kelas_saya` cross-doctype join.
   Keep a thin resolver ONLY for wali→rombel identity + roster + today-presence; delegate risk math to the report.
2. **Class-switcher + seat-map** — *from C2 Power-user.* Thin chip row for the co-wali / teacher-owns-2+-rombel edge,
   and a `no_urut` seat-map reorder that gracefully absorbs mid-year transfers/re-seating.
3. **Auditable parent contact** — *from C2 Power-user.* Log every "Hubungi Wali" tap as a structured `Catatan Wali`
   row (`kategori=Kontak`) so contact history is reviewable, not a fire-and-forget wa.me link.
4. **Honest empty-states** — *from C1 Simplest-path.* Where today's `$kodeKelas.tsx` pairs real anggota rows with
   mock-by-index data, show "Belum ada absensi hari ini" / "Belum ada nilai" instead of fabricated numbers.
5. **Zero-click auto-redirect** — *from C1 (final loser-did-better).* Self-route the wali into the cockpit with NO
   navigation/class-picker, reusing the beranda `useSession`→rombel path (and drop the bespoke join method).

## Bracket result

| Competitor | Angle | Eliminated | Score | Note |
|---|---|---|---|---|
| **C4 Reimagine — Kelasku** | Self-routing people-cards cockpit + Catatan Wali store; class = people-in-states | **Winner** | **37** | Won SF-B 41-36 then FINAL 37-36 (tie-break re-run). Catatan Wali store + phone-first surface = decisive. |
| C1 Simplest-path | Zero-config auto-redirect into one cockpit; collapse 5 routes + 7 tabs → 1 redirect + 1 cockpit, no new BE | Final | 36 | Won SF-A (zero clicks to "who's absent", honest empty-states, lowest blast radius). Lost final: quick-notes had no real store. Graft: the zero-click redirect. |
| C3 Native-first | Thin SPA over native Query Reports + Notifications; reuse $kodeKelas tabs reordered | Semifinal | 36 | Most disciplined/cheapest; foundation verified solid (`rekap_absensi_siswa`). But report-row list ≠ glanceable; notes degrade to Comment/ToDo. Graft: report-reuse. |
| C2 Power-user | Keyboard-first ⌘K cockpit: dense roster grid, j/k/x nav, bulk Absensi writes | Semifinal | 26 | Engineered for a desktop bulk-attendance operator; admits "hostile on a phone" — the persona's actual device. Grafts: co-wali switcher, seat-map, contact-log. |

## Data model sketch (native-first)

Reads only (no schema change) for the whole cockpit EXCEPT one new note doctype; risk delegated to an existing report.

**Reads (all real, verified):**
- `Rombongan Belajar` filter `{wali_kelas == session.user, status: Aktif, sekolah}` → name, nama_rombel, tingkat,
  jenjang, tahun_ajaran, ruangan, kapasitas, jumlah_siswa, wali_kelas, anggota(child)
- `Anggota Rombel` (child, inline on doc fetch): siswa, **no_urut (roster sort key)**, status (filter Aktif), tanggal_masuk_rombel
- `Absensi Harian` filters `[[rombel,=,name],[tanggal,=,today]]`; child **`detail`** (Detail Absensi Harian: siswa,
  status ∈ Hadir/Izin/Sakit/Alpa/Terlambat, keterangan). NOTE the child field on the parent is `detail`, not `detail_absensi_harian`.
- `Entri Nilai`: siswa, mata_pelajaran, nilai_akhir, predikat, is_remedial, tahun_ajaran → risk flags (predikat D or is_remedial=1)
- `Siswa`: nama, jenis_kelamin, foto; wali contact (no_hp/email) for wa.me/tel/mailto deep-links

**NEW doctype — `Catatan Wali`** (module Siswa, alongside rombongan_belajar):
fields siswa(Link, reqd), rombel(Link Rombongan Belajar, reqd), tanggal(Date, default Today),
kategori(Select: Umum/Kontak/Akademik/Perilaku, default Umum), isi(Small Text, reqd), sekolah(Link, reqd, tenant anchor), organisasi(Link).
Perms: Wali Kelas + Guru = create+read own; TU + Kepsek = read. No Workflow (free-text note).
**MUST be added to `sekolahpro/api/tenant_registry.py` DOCTYPES['SCHOOL']** or scoping silently leaks (CI test gate exists).

**Endpoint — `sekolahpro/siswa/api/kelasku.py` `get_kelasku(sekolah, rombel=None)`:** thin identity+roster+today-presence
assembler ONLY. Does NOT recompute risk — calls the existing `Rekap Absensi Siswa` report for the at-risk shortlist *(graft C3)*.
*(Per the final graft, prefer reusing the beranda session→rombel resolver; keep this endpoint minimal or drop if the
client-side resource filter + report suffice.)*

No bulk-write controllers (C2's `bulk_set_presensi` rejected — attendance writing stays in absensi/PWA).
VIZ uses app-local `src/components/viz/charts.tsx` (ProgressRing/Sparkline) — NOT @sekolahpro/ui.

## Files likely touched

**Web:**
- `src/routes/sch.$sekolah.kelas.index.tsx` — add role redirect: if primary role is `wali_kelas` (and not also TU/admin) → `navigate('./saya')`; else render TU dashboard unchanged
- `src/routes/sch.$sekolah.kelas.saya.tsx` *(NEW)* — cockpit route; resolves wali's own rombel; handles wali-of-zero (fallback) + wali-of-2+ (chip switcher via `?rombel=`)
- `src/routes/sch.$sekolah.kelas.tsx` — ModuleShell sub-nav: prepend a role-primary "Kelasku" pill when session has wali_kelas
- `src/routes/sch.$sekolah.kelas.$kodeKelas.tsx` — remove mock-by-index fallback → honest empty-states (deferred-safe, not required v1)
- `src/components/kelas/KelasSayaCockpit.tsx` *(NEW)* — vertical mobile-first scroll: StripHariIni + AntreanPerhatian + RosterKartu + optional switcher
- `src/components/kelas/StripHariIni.tsx` *(NEW)* — today's Hadir/Sakit/Izin/Alpa/Terlambat from Absensi Harian + absent names inline + "belum diabsen" nudge
- `src/components/kelas/AntreanPerhatian.tsx` *(NEW)* — 3-5 risk cards fed by `rekap_absensi_siswa` report + Entri Nilai predikat D / is_remedial
- `src/components/kelas/RosterCard.tsx` *(NEW)* — per-anggota card by no_urut: seat#, nama, JK, presence chip, risk dot, one-tap Hubungi Wali + Catat
- `src/components/kelas/StudentSheet.tsx` *(NEW)* — slide-over: kehadiran trend (viz charts), last nilai, wali contact, this student's Catatan Wali history
- `src/components/kelas/CatatCepat.tsx` *(NEW)* — single-textarea sheet writing a Catatan Wali doc
- `src/lib/kelasRole.ts` *(NEW, SHARED — see reconcile)* — `deriveKelasRoles` over `lib/sessionRole.ts`; adds wali_kelas bucket; priority places wali_kelas BELOW TU/admin
- `src/lib/kelasku.ts` *(NEW)* — pure helpers: resolveKelasku(one/zero/many), presence aggregation, wa/tel link builders, risk-row mapping
- `src/components/kelas/pageGuides.ts` — add a 'saya' / wali_kelas-tagged guide

**Backend:**
- `sekolahpro/siswa/doctype/catatan_wali/` *(NEW doctype)* + `test_catatan_wali.py` (**FrappeTestCase** — CI gate is `bench run-tests`/unittest, NOT pytest; reuse `make_*_fixture` helpers)
- `sekolahpro/api/tenant_registry.py` — register 'Catatan Wali' in DOCTYPES['SCHOOL']
- `sekolahpro/siswa/api/kelasku.py` *(NEW, minimal — or drop per final graft)*

## Open questions for the human

1. **Multi-class wali:** is one teacher ever wali_kelas of 2+ ACTIVE rombel in real data? Cockpit defaults to one class + thin chip switcher; confirm rare enough to stay a fallback vs first-class picker.
2. **Risk thresholds:** `rekap_absensi_siswa` needs a KKM / attendance% threshold — per-school config (a Pengaturan singleton field) or ship a sensible default report param? Avoid hardcoding a magic number.
3. **Dual-role precedence:** a user who is BOTH wali_kelas AND TU/Kurikulum — land on Kelasku or admin dashboard? Proposed: wali_kelas BELOW admin → dual-role keeps admin dashboard, reaches cockpit via the "Kelasku" pill. Confirm. *(Cross-cuts all 3 plans — see reconcile.)*
4. **Catatan Wali privacy:** private to authoring wali, or readable by next year's wali / Kepsek / BK counselor? Drives the perms matrix (currently wali+guru create/read-own, TU+Kepsek read).
5. **"Hubungi Wali" channel:** is wa.me canonical for all schools, or tel:/mailto fallback ordering? And is the contact phone on `Siswa.no_hp`, a Wali Murid child table, or a separate Wali doctype — verify exact field path before wiring deep-links.
6. **Honest empty-state vs existing $kodeKelas mock fallback:** confirm we may remove the mock-by-index data (a visible behavior change for TU).
7. **Today-boundary:** "tanggal = today" uses server date — confirm timezone (school-local vs UTC) so an early-morning "belum diabsen" nudge doesn't mis-fire across midnight.
