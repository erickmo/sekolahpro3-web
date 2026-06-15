# Design — Struktur Biaya Sekolah (School Fee Structure Setup)

- **Date:** 2026-06-15
- **Domain:** Keuangan (FE: `apps/school`) + Accounting (BE: `vernon_accounting`)
- **Task size:** L (new BE doctypes + generator + scheduler + new FE module, spans 2 repos)
- **Status:** Approved design — pending implementation plan

## 1. Problem

The Keuangan hub can already list, pay, and track student bills (`School Fee Invoice` /
`School Fee Payment`), but every invoice is created **manually, one student at a time**.
There is no way to:

- define the school's fee components (SPP, Uang Pangkal, Seragam, …) once,
- price them per grade level (`tingkat`),
- generate the matching bills for a whole cohort in one action.

The onboarding step "Konfigurasi SPP" is a dead stub pointing at `/keuangan`.

This design adds a **fee-structure configuration layer** plus a **generator** that
fans out into the existing `School Fee Invoice` doctype.

## 2. Goals / Non-goals

**Goals**
- Define reusable fee components per `company` + `tahun_ajaran`, priced per `tingkat`.
- Each component carries a billing rhythm (`ritme`): `Bulanan` / `Per Semester` / `Sekali`.
- Generate `School Fee Invoice` rows for a chosen period, manually, with a dry-run preview.
- Optional per-component auto-generation on a monthly schedule.
- A FE setup screen under the Keuangan hub + a "Generate Tagihan" modal.

**Non-goals (YAGNI)**
- No per-student discount/beasiswa in this iteration (explicitly deferred — earlier option
  not chosen). Revisit later as a `School Fee Adjustment` doctype.
- No change to the payment flow (`School Fee Payment` stays as-is).
- No parent/wali-facing fee view (separate future feature).
- No proration for mid-period enrollment.

## 3. Existing-state facts (verified)

- `vernon_accounting` module `Accounting` already has `School Fee Invoice`,
  `School Fee Payment`, `School Expense`. No fee-structure doctype, no generator.
- `School Fee Invoice` fields: `naming_series` (`TAG-.YYYY.-`), `posting_date`, `due_date`,
  `company` (Link Company), `student` (Data id), `student_name`, `kelas`, `judul`,
  `tahun_ajaran` (**Data, free text**), `jumlah`, `dibayar`, `receivable_account`,
  `income_account`, `status` (`Draft\nBelum Dibayar\nSebagian\nLunas\nDibatalkan`),
  `remarks`. Submittable. Roles: Accounts Manager, Accounts User, Bendahara, Kasir.
- Student → grade resolution lives in `sekolahpro` module `siswa`:
  - `Rombongan Belajar` (rombel): `tahun_ajaran` (**Link** Tahun Ajaran), `jenjang`
    (Link Unit Jenjang), `tingkat` (**Int**), `sekolah` (**Link Sekolah**),
    `status` (`Aktif\nDitutup`), child `anggota` (Table → Anggota Rombel).
  - `Anggota Rombel` (istable child): `siswa` (Link Siswa), `status` (`Aktif\nKeluar`).
  - `Siswa` holds no direct `tingkat`; grade comes from the active rombel membership.
- FE Keuangan hub: routes `keuangan.{index,tagihan,pembayaran,pengeluaran,kas}.tsx`,
  shared chrome `components/keuangan/*`, live layer `data/keuangan-live.ts`
  (`useResourceList` + `useActiveCompany`), mock layer `data/keuangan.ts`.
- Onboarding step `id: "spp"` ("Konfigurasi SPP") currently `href: "/keuangan"`, `done: false`.

## 4. Two integration risks (must be handled, not assumed)

1. **Scope axis mismatch.** Rombel/Siswa are scoped by **`Sekolah`** (Link Sekolah),
   but `School Fee Invoice` is scoped by **`Company`** (Link Company). The generator must
   resolve `company → sekolah(s)` before querying rombel. A resolver helper is required;
   its exact mapping (Sekolah→Company link field, or Company→Sekolah) is the **top item to
   verify during planning** by inspecting the `Sekolah` and `Company` doctypes.
2. **`tahun_ajaran` type mismatch.** Link on rombel, free-text Data on invoice. The fee
   component stores a **Link Tahun Ajaran** (so it joins cleanly to rombel); the generator
   writes the TA's name string onto the generated invoice's `tahun_ajaran` Data field.

## 5. Data model (BE — `vernon_accounting`, module `Accounting`)

### 5.1 `School Fee Component` (new doctype, non-submittable, company-scoped)

Mirrors `School Fee Invoice` scoping/permissions exactly (company filter, same role set).

| Field | Type | Notes |
|-------|------|-------|
| `company` | Link Company | reqd |
| `tahun_ajaran` | Link Tahun Ajaran | reqd — joins to rombel |
| `jenjang` | Link Unit Jenjang | optional — disambiguates `tingkat` when a school spans multiple jenjang |
| `nama_komponen` | Data | reqd — "SPP", "Uang Pangkal", "Seragam" |
| `ritme` | Select | `Bulanan\nPer Semester\nSekali`, reqd |
| `receivable_account` | Link Account | reqd — copied onto generated invoices |
| `income_account` | Link Account | reqd — copied onto generated invoices |
| `due_day` | Int | day-of-month for due date (used by `Bulanan`); 1–28 guard |
| `auto_generate` | Check | default 0 — schedule opt-in |
| `is_active` | Check | default 1 |
| `rates` | Table → School Fee Component Rate | per-tingkat pricing |

- **Naming:** by field combination, e.g. autoname `format:{nama_komponen}-{tahun_ajaran}`
  (final format confirmed in plan; must stay unique per company+TA+nama).
- **Validation (controller `validate`):** at least one `rates` row; `due_day` in 1–28;
  `nama_komponen` unique within (company, tahun_ajaran); accounts belong to `company`.

### 5.2 `School Fee Component Rate` (new child doctype, `istable`)

| Field | Type | Notes |
|-------|------|-------|
| `tingkat` | Int | reqd, in_list_view |
| `nominal` | Currency | reqd, in_list_view |

Validation: `tingkat` unique within the parent's `rates`.

### 5.3 `School Fee Invoice` — additive change (backward compatible)

Add two optional fields for idempotency + reporting:

| Field | Type | Notes |
|-------|------|-------|
| `fee_component` | Data | source component name (nullable for manual invoices) |
| `periode` | Data | normalized period marker, e.g. `2026-05` / `2026-Ganjil` / `2026-Sekali` |

Dedupe key for the generator = (`student`, `fee_component`, `periode`, `company`).
Existing manual invoices have both null → never collide with generated ones.

## 6. Generator

A module-level function in the `School Fee Component` controller file (justified by a
doc comment: it orchestrates **across** components and is invoked by **two** callers —
the manual whitelisted endpoint and the scheduler — so it is not an instance method).

```
generate_fee_invoices(company, tahun_ajaran, periode, ritme=None,
                      components=None, dry_run=False) -> Summary
```

**Algorithm**
1. Resolve `sekolah` set from `company` (risk #1 resolver).
2. Select active `School Fee Component` for (company, tahun_ajaran[, ritme][, components]).
3. For each component, for each `rates` row (`tingkat → nominal`):
   - Find `Rombongan Belajar` where `sekolah ∈ resolved`, `tahun_ajaran = TA`,
     `tingkat = rate.tingkat`, `jenjang = component.jenjang` (if set), `status = "Aktif"`.
   - Collect `Anggota Rombel` with `status = "Aktif"` → student list.
   - For each student: build dedupe key; **skip** if a matching invoice exists.
   - Build a `School Fee Invoice`:
     - `posting_date` = period start; `due_date` from `due_day` + period;
     - `judul` = human label e.g. `"SPP Mei 2026"` (from `nama_komponen` + period);
     - `tahun_ajaran` = TA **name string**; `kelas` = rombel name;
     - `jumlah` = `nominal`; `status` = `"Belum Dibayar"`;
     - `receivable_account` / `income_account` from component;
     - `fee_component` = component name; `periode` = normalized marker;
     - `remarks` = generation provenance.
4. `dry_run=True` → do not insert; accumulate
   `{created, skipped, total_amount, by_component:[{nama, count, amount}], warnings}`.
   Warnings (not errors): a `tingkat` with a rate but no active rombel/students.
5. `dry_run=False` → insert inside one transaction; collect per-invoice errors without
   aborting the whole batch; return the same Summary shape + `errors`.

**Period normalization** (`periode` arg → marker + label + dates) is a small pure helper,
keyed by `ritme`:
- `Bulanan`: arg `"2026-05"` → marker `2026-05`, label `"<Komponen> Mei 2026"`.
- `Per Semester`: arg `"2026-Ganjil"` → marker `2026-Ganjil`, label `"<Komponen> Ganjil 2026"`.
- `Sekali`: arg ignored/period of TA → marker `<TA>-Sekali`, label `"<Komponen> <TA>"`.

**Whitelisted wrapper** (`@frappe.whitelist()`, ≤10 lines) validates args, enforces the
same permission as `School Fee Invoice` create, delegates to `generate_fee_invoices`.

## 7. Scheduler (auto-generate opt-in)

`hooks.py` `scheduler_events["daily"]` → a thin job that, for every `School Fee Component`
with `auto_generate = 1` and `ritme = "Bulanan"` whose `due_day` matches today's day,
calls `generate_fee_invoices(..., periode=current_month, dry_run=False)`. Idempotency makes
re-runs safe. Hooks-first compliant (no OS cron).

## 8. FE (app-school — Keuangan hub)

- **Route** `sch.$sekolah.keuangan.biaya.tsx` — "Struktur Biaya" setup screen
  (ModuleShell/keuangan chrome): list of components + editor with a per-`tingkat` rate grid,
  `ritme`/accounts/`due_day`/`auto_generate`/`is_active` controls.
- **`GenerateTagihanModal`** (`components/keuangan/`): pick period + components → call the
  generator with `dry_run=true` → preview affected student count + total per component →
  confirm → `dry_run=false` → refetch Tagihan list.
- **Data layer**
  - `data/fee-structure.ts` — UI types + mock fixtures (offline/demo parity, like `keuangan.ts`).
  - `data/fee-structure-live.ts` — `useResourceList<FeeComponentDoc>("School Fee Component")`
    scoped by `useActiveCompany`; create/update via `runDocMethod`/REST; `generate` via the
    whitelisted call. Mock fallback mirrors `keuangan-live.ts`.
- **Wiring**
  - Onboarding `id:"spp"` → `href:"/keuangan/biaya"`, `done` = component count > 0.
  - Add to `KeuanganHubNav` + `lib/global-search.ts`.

## 9. Error handling & permissions

- Generator never hard-fails on "no students in a tingkat" → returns a warning; the modal
  surfaces warnings before confirm.
- Batch insert is transactional with per-invoice error collection; `dry_run` is always safe.
- Validation guards on the component (rates present, `due_day` range, name uniqueness,
  account↔company consistency).
- Roles reuse the `School Fee Invoice` set: Accounts Manager / Bendahara create+write
  components and generate; Kasir / Accounts User read.

## 10. Testing

**BE — `FrappeTestCase`** (CI gate is `bench run-tests` unittest, **not** pytest):
- generator idempotency (re-run creates 0 new),
- per-`tingkat` fan-out (right students, right nominal),
- `dry_run` counts/total without inserts,
- `ritme` filter selects the right components,
- company→sekolah scope correctness (no cross-school leak),
- period normalization for all three `ritme`.
- Reuse `make_*` fixtures (TA, rombel, siswa); add fixtures for components/rates.

**FE — vitest:**
- doc ↔ UI row mapping,
- preview total/count math from a dry-run summary,
- role gating of setup + generate actions,
- render of setup screen + generate modal.

## 11. Documentation (vernon mandatory)

- `docs/domains/keuangan/README.html` — new fields/rules + Cross-Domain Events
  (generator emits an internal "fee.invoices.generated" notion; document listeners).
- `docs/implementation-tracker.md` — PRD/TRD rows + Tests/Test-Data columns + Summary recalculation.
- ADR — record the component-centric model choice and the company↔sekolah resolver decision.

## 12. Open items to resolve in planning

1. **company↔sekolah resolver** — inspect `Sekolah` / `Company` doctypes for the link field
   (top risk; blocks the generator).
2. `School Fee Component` autoname final format (uniqueness vs readability).
3. Whether `tahun_ajaran` "name" written to the invoice should be the doc name or a label
   field on Tahun Ajaran (match what existing invoices store).
4. Tenant-registry: confirm `vernon_accounting` scoping pattern (company filter) needs no
   separate registry entry — mirror `School Fee Invoice` exactly.
