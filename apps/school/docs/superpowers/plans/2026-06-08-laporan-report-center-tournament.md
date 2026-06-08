# Laporan → unified Report Center — Tournament Plan (POV: Tata Usaha)

> Design-tournament output. **Proposal only — NOT implemented.** Human approves before `implement plan`.
> Date: 2026-06-08 · Feature: `/laporan` → unified Report Center · POV/Judge: **Tata Usaha (Admin TU)**
> Twist (user): winner UPGRADED with the best of **every** losing contestant (comprehensive grafting).

## POV brief (job-to-be-done)

Tata Usaha runs **operational + compliance reporting**. Periodic: generate rekap absensi siswa, buku induk,
data Dapodik (siswa missing NISN), TPG, rekap siswa per rombel; export in the format Dinas/yayasan wants
(Excel/PDF); schedule + dispatch routine reports. The 36+ reports are scattered with NO single place to find
or run them. **GOOD = one report center: find ANY report fast, run with a period + scope, export CSV/Excel/PDF,
manage recurring schedules.** Measured on: **on-time, complete, correct-format, NISN-clean, auditable** — not aesthetics.

## Winner — C4 Reimagine: "Pusat Lapor" (final judged 41/45 · synth holistic 39.5/45)

**Reject the "browse a 36-report catalog" framing.** TU's real job is *"ship the Dinas/yayasan compliance packet
ON TIME, complete, right format, no NISN holes, with a receipt."* So `/laporan` becomes **Pusat Lapor** — a
deadline-first cockpit whose primary objects are **Kewajiban** (recurring obligations with a due date + target)
and **Paket** (bundles of 2-6 reports submitted together). Overdue/due-soon obligations shout at the top; one-click
**"Susun & Kirim"** bulk-runs the packet's member reports, **gates on data-quality (missing NISN)**, exports in the
Dinas-mandated format, dispatches to recipients, logs an audit receipt. The full 36-report catalog survives as a
secondary **"Semua Laporan"** drawer. Every run flows through the **existing** engine/Dinas export path +
Laporan Terjadwal — no new run path invented.

### Why it won (judged)

- **SF-A:** C1 vs C2 → **C2** (38-38, tiebreak: C2 honest about the registry gap). **SF-B:** C3 vs C4 → **C4** (39-31).
  **FINAL:** C2 vs C4 → **C4 41-33.**
- TU is **not** graded on "did I find a report" — on "did the submission go out complete, correct-format, before the
  deadline, NISN-clean, with proof for an auditor." C4 makes the **obligation** (not the catalog) the unit of work.
- **Decisive codebase-verified fact:** `generate()`/`engine` only know the **6 KNOWN_REPORTS** (`is_registered()` throws
  "tidak terdaftar" for everything else) — so the catalog-first competitors (C1/C3) ship a hero whose primary "run"
  button is a **dead end for precisely TU's 6 compliance reports**. C4 is **run-path-agnostic** and reuses the EXISTING
  TU-gated Dinas export path (`akademik/api/laporan_dinas.py` — role-locked, emits XLSX/PDF/JSON/XML, runs via dynamic
  `module.execute` that bypasses the 6-report registry).
- C4's **Kotak Masalah Data** pre-flight gate (run `siswa_missing_nisn`, BLOCK submit until NISN gaps = 0) prevents the
  #1 real TU failure: a Dapodik rejection. Keeps the full catalog as a drawer + schedule manager as a tab → loses no completeness.
- Dinged on Feasibility/Vernon: Kewajiban+Paket are FE-config at launch (not yet backend objects); run-path split across two channels.

## Grafted ideas — COMPREHENSIVE (best of ALL 3 losers, per the twist)

1. **Catalog-manifest channel badge + Antrean Batch ZIP** — *from C2 (also the final judge's "one thing it does better").*
   Per-report "runnable channel" badge (Jalankan inline / Dinas export / Buka di Desk) driven by registry + Dinas-map
   membership; bulk-run N reports → single ZIP with per-report success/skip-empty/blocked status. **VERIFIED the gap is
   worse than the brief:** `generate()` runs only 6; Dinas `_REPORT_MAP` covers only 3 — so dapodik/missing_nisn/buku_induk/
   rekap_per_rombel run through NEITHER today. The badge stops Susun Paket showing silently-dead rows; ZIP = how a monthly
   packet actually ships. **Highest-value graft.**
2. **Server-truth catalog** — *from C3 (judge sfB's named graft).* Source the "Semua Laporan" drawer from
   `frappe.client.get_list('Report', fields=[name,module,report_type,ref_doctype,disabled,roles])` filtered by the user's
   roles — never a hardcoded array (drop a Report JSON → it appears). VERIFIED all 36 are Report JSON with `roles[]`. Also
   fixes a real bug: `accessible_reports()` only applies the finance gate, NOT per-report `Report.roles`.
3. **Role-gating fallback hardening** — *from C3 (its flagged "roles[] blank → 403" risk, confirmed real).* When
   `Report.roles[]` is blank (`laporan_tpg`=[]) OR mis-scoped (`siswa_missing_nisn`=[System Manager, Operator Dapodik] —
   NOT Tata Usaha), fall back to a `TU_COMPLIANCE_REPORTS` allowlist + finance gate so the data-quality gate report stays
   reachable. **Protects the winner's killer feature** (the gate depends on a report TU can't otherwise run).
4. **⌘K Quick-Run + Saved Views** — *from C1 (⌘K) + C2 (Saved Views).* `lib/global-search.ts` "Laporan" category with sane
   defaults (periode=Bulanan, ref=today, fmt=Excel/Dinas-XLSX) → ad-hoc "just give me this month's Excel" skips the cockpit;
   named presets ("Paket Bulanan Dinas") run in one keystroke. Makes the "always-present drawer + ⌘K" mitigation concrete.
5. **Riwayat & Bukti audit drawer** — *from C2/C3.* Read-only submission log (who/report/periode/scope/fmt/row_count/
   watermark/target/timestamp) from `Laporan Terjadwal.last_run` + a lightweight receipt record. Auditability is one of TU's
   four explicit priorities ("a receipt I can show an auditor").
6. **Inline Run Panel single-page minimalism (ad-hoc path)** — *from C1.* The "Semua Laporan" drawer opens an inline Run
   Panel (period + ref + scope + big default "Unduh" split-button + live row_count + watermark chip), not a wizard — keeps
   the secondary surface as low-friction as C1's whole product.

## Bracket result

| Competitor | Angle | Eliminated | Note |
|---|---|---|---|
| **C4 Reimagine — Pusat Lapor** | Obligation (not catalog) is the unit of work: Kewajiban + Paket + data-quality gate + audit receipt | **Winner** | Won SF-B + Final (41-33). Aligns with how TU is measured; run-path-agnostic (reuses working Dinas export). Upgraded w/ grafts from all 3 losers. |
| C2 Power-user — Report Console | Keyboard-first ops cockpit, ⌘K, batch queue, Saved Views, audit drawer | Final | Won SF-A (most honest about the registry gap: per-row runnable badge + batch-ZIP). Lost final: a cockpit still makes TU remember packet membership/due-dates/data-cleanliness. **Grafted heavily.** |
| C1 Simplest-path — catalog + inline Run Panel | type-to-find, Enter-to-run, file lands; fewest clicks | Semifinal | Best Simplicity/Feasibility/Vernon, but optimizes the wrong verb (browse). Fatal verified flaw: its "mostly wiring existing endpoints" is false — `generate()` 400s on all 6 TU reports. Grafted: ⌘K + sane defaults + inline Run Panel. |
| C3 Native-first — Report doctype IS the catalog | server-truth `get_list` catalog, role-gated, thinnest SPA | Semifinal | Strongest completeness backbone + flagged the 2 real risks (blank roles, 6-vs-30 registry). But hero "run" 400s on TU reports. Grafted: server-truth catalog + role fallback + audit drawer. |

## Data model sketch (native-first — reuse run path)

**REUSE (no change):** `generate(report,periode,ref,fmt,sekolah)` → {filename,mime,content_b64,meta,watermark,row_count}
(6 engine reports + watermark/periode pipeline); `engine.run_report`/`_REGISTRY`/`is_registered`/KNOWN_REPORTS(6);
`periode.PERIODE_CHOICES` (Harian/Mingguan/Bulanan/Semesteran/Tahunan) + `resolve_periode` + `watermark_for`;
**`akademik/api/laporan_dinas.export_xlsx/export_pdf/export_data`** (TU-role-gated, XLSX/PDF/JSON/XML via dynamic
`module.execute` — **the primary channel for TU's compliance Script Reports**); `Laporan Terjadwal` (+ child Recipient +
`run_now` + `schedule.dispatch_due`); `frappe.client.get_list('Report', …)` (server-truth catalog).

**NEW FE config (launch, no DB) — `lib/laporan/kewajiban.ts`:**
`Kewajiban = { id, nama, target:'Dinas'|'Yayasan'|'Internal', dueDayRule:{periode,dueDay}, paket: ReportRef[] }`;
`ReportRef = { reportName, channel:'engine'|'dinas'|'desk' (resolved by reportChannel.ts), defaultFmt, scope?:'sekolah'|'rombel' }`;
status (Belum/Tersusun/Terkirim) derived per-period from `Laporan Terjadwal.last_run` + local receipt log.

**NEW BACKEND (minimal):**
- `access.accessible_reports()`: add per-report `Report.roles[]` ∩ `frappe.get_roles()` **on top of** the finance gate;
  `TU_COMPLIANCE_REPORTS` allowlist fallback (named const) for blank/mis-scoped roles. *(Closes a verified bug.)*
- `laporan_dinas._REPORT_MAP` / `print_format_map`: add 4 entries (data_siswa_dapodik, siswa_missing_nisn,
  buku_induk_siswa, rekap_siswa_per_rombel) → their existing `module.execute` paths, so all 6 TU reports export via Dinas.

**DEFERRED follow-up (winner's stated tradeoff):** `Paket Lapor` doctype (nama, target, periode, due_day, members[child],
sekolah/organisasi → register in `tenant_registry.py DOCTYPES['SCHOOL']`) + `Laporan Submission Receipt` doctype to persist
Kewajiban/Paket + audit receipts cross-device. FE config map is the launch stand-in.

## Files likely touched

**FRONTEND — rewrite hero, keep schedule as tab:**
- `src/routes/sch.$sekolah.laporan.tsx` — REWRITE: hero = Pusat Lapor / Kalender Wajib Lapor; current Laporan Terjadwal table → "Jadwal Otomatis" sub-nav tab
- `src/components/laporan/PusatLaporHero.tsx` *(NEW)* — deadline-sorted Kewajiban (overdue / minggu ini / mendatang)
- `src/components/laporan/KalenderWajibLapor.tsx` *(NEW)* — month strip of submission deadlines
- `src/components/laporan/SusunPaket.tsx` *(NEW)* — packet assembler: periode+ref+scope, member checklist w/ channel badge, run-all, per-report row_count, single-ZIP
- `src/components/laporan/KotakMasalahData.tsx` *(NEW)* — pre-flight gate runs `siswa_missing_nisn`, blocks submit until zero, deep-links to fix
- `src/components/laporan/KirimDanBukti.tsx` *(NEW)* — dispatch: download ZIP OR send via Laporan Terjadwal recipients, log receipt
- `src/components/laporan/SemuaLaporanDrawer.tsx` *(NEW)* — secondary catalog from server-truth get_list + inline Run Panel + channel badge *(graft C1+C3)*
- `src/components/laporan/RunPanel.tsx` *(NEW, graft C1)* · `AntreanBatch.tsx` *(NEW, graft C2)* · `RiwayatBukti.tsx` *(NEW, graft C2/C3)*

**FRONTEND — lib:**
- `src/lib/laporan/kewajiban.ts` *(NEW)* — Kewajiban + Paket config map · `reportChannel.ts` *(NEW, graft C2)* — per-report channel resolver
- `src/lib/laporan/reportCatalog.ts` *(NEW, graft C3 + role-fallback)* · `zipBundle.ts` *(NEW, graft C2)* · `download.ts` *(NEW)* (reuse GenerateRaportModal pattern)
- `src/lib/global-search.ts` — EDIT: add "Laporan" category (Quick-Run + Saved Views, mirror financeActions) *(graft C1+C2)*
- `src/components/guide/miscPageGuides.ts` — EDIT: `MISC_PAGE_GUIDES.laporan` "Cara pakai Pusat Lapor"

**BACKEND — minimal, native-first:**
- `sekolahpro/laporan/access.py` — EDIT: per-report Report.roles filter + TU_COMPLIANCE allowlist fallback *(closes verified bug)*
- `sekolahpro/akademik/api/laporan_dinas.py` — EDIT: extend `_REPORT_MAP`/`print_format_map` to cover the other 4 TU reports *(closes verified gap)*
- `sekolahpro/laporan/api/generate.py` — OPTIONAL: `list_catalog()` returning get_list metadata + channel hint
- `sekolahpro/laporan/doctype/paket_lapor/` *(OPTIONAL FOLLOW-UP)* — persist Kewajiban/Paket + receipts

## Open questions for the human

1. **Channel split (verified):** 6 TU reports don't run through `generate()`; Dinas `_REPORT_MAP` covers only 3. (a) Extend `_REPORT_MAP` for the other 4 *(recommended minimal)*, or (b) register all 6 as real engine readers (cleaner, more BE, loses legacy Dinas XML/JSON)?
2. **`siswa_missing_nisn` roles** = [System Manager, Operator Dapodik] — NOT Tata Usaha, yet the gate depends on TU running it. Add 'Tata Usaha' to the Report JSON, keep the FE allowlist fallback, or grant TU 'Operator Dapodik'? (`laporan_tpg` roles=[] — same question.)
3. **Kewajiban/Paket persistence:** ship as FE config at launch (fast, no cross-device edit) with the `Paket Lapor` doctype as fast-follow — or is server-side + a Kepsek-editable bundle UI required for v1? (Winner accepted FE-config-first.)
4. **Dinas deadlines:** does periode+ref model every obligation, or do some Dapodik cutoffs need an arbitrary custom date window the fixed PERIODE_CHOICES can't express (→ per-Kewajiban dueDate override)?
5. **Per-rombel scope:** which TU reports must support per-rombel scope at launch vs sekolah-wide only? (affects RunPanel/SusunPaket scope picker.)
6. **Audit receipts:** is a `Laporan Submission Receipt` doctype required for auditor sign-off at launch, or is `Laporan Terjadwal.last_run` + a local FE log enough for v1?
7. **Bulk-run = N sequential client-side round-trips** (no batch endpoint, to preserve role gate + watermark). 6-report packet = 6 round-trips — acceptable for TU volumes, or add a server-side batch endpoint later? *(Note: workflow-concurrent-build-stall memory favors sequential.)*

---

Tournament done. Winner: **C4 Reimagine — Pusat Lapor**, POV = Tata Usaha, final 41/45 · synth 39.5/45.
Grafted comprehensively from **all 3 losers** (C1 ⌘K/Run Panel · C2 channel-badge/ZIP/Saved-Views/audit · C3 server-truth catalog/role-fallback).
→ Run `implement plan 2026-06-08-laporan-report-center-tournament.md` or `full cycle` to build it.
