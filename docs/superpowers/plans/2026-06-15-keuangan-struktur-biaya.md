# Struktur Biaya Sekolah — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a school define fee components (SPP, Uang Pangkal, …) priced per `tingkat`, then generate `School Fee Invoice` rows for a chosen period in one action (manual + optional monthly schedule).

**Architecture:** New config doctypes `School Fee Component` (+ child `School Fee Component Rate`) in `vernon_accounting`. A module-level generator fans out into the existing `School Fee Invoice`, resolving students via `sekolahpro`'s `Rombongan Belajar`/`Anggota Rombel`. A FE "Struktur Biaya" screen + "Generate Tagihan" modal in the Keuangan hub drive it via REST + a whitelisted method.

**Tech Stack:** Frappe (Python doctypes, controllers, hooks scheduler, FrappeTestCase) · React + TanStack Router + `@sekolahpro/api-client` · vitest.

**Cross-repo:** BE = `apps/vernon_accounting` (Phase A). FE = `apps/sekolahpro-web/apps/school` (Phase B). Two branches, two PRs. Spec: `docs/superpowers/specs/2026-06-15-keuangan-struktur-biaya-design.md`.

---

## Verified codebase facts (do not re-derive)

- `Company.name == Sekolah.name` by convention (`vernon_accounting/.../company/company.py`, FE `lib/akuntansi-scope.ts`). Resolver = identity; guard with `frappe.db.exists("Sekolah", company)`.
- `Tahun Ajaran` autoname = `format:{sekolah}-{nama}`; `nama` = human label (e.g. `"2025/2026"`). `Rombongan Belajar.tahun_ajaran` is a **Link** storing the TA doc name → fee component `tahun_ajaran` (also Link) joins by equality, no translation.
- `Rombongan Belajar` (module `siswa`): `nama_rombel`, `tahun_ajaran` (Link Tahun Ajaran), `jenjang` (Link Unit Jenjang), `tingkat` (Int), `sekolah` (Link Sekolah), `status` (`Aktif`/`Ditutup`), child `anggota` (Table → `Anggota Rombel`).
- `Anggota Rombel` (istable): `siswa` (Link Siswa), `status` (`Aktif`/`Keluar`).
- `Siswa` autoname `field:nis` → **doc name == NIS**; display name field = `nama_lengkap`.
- `School Fee Invoice` (module `Accounting`): `naming_series` `TAG-.YYYY.-`, `posting_date`, `due_date`, `company`, `student` (Data), `student_name`, `kelas`, `judul`, `tahun_ajaran` (Data), `jumlah`, `dibayar`, `receivable_account`, `income_account`, `status` (`Draft\nBelum Dibayar\nSebagian\nLunas\nDibatalkan`), `remarks`. Submittable. Roles: Accounts Manager, Accounts User, Bendahara, Kasir.
- FE keuangan live layer: `data/keuangan-live.ts` (`useResourceList` + `useActiveCompany`). Method-call helpers: `frappeFetch(method,args)`, `useFrappeMutation(method)`, `runDocMethod`, `useResourceList` (all from `@sekolahpro/api-client`).
- `vernon_accounting/hooks.py`: `scheduler_events` currently commented out; `fixtures = [...]` already present at line 8.

---

## Worktree setup (do this first)

Concurrent sessions run in this shared checkout (see memory). Work in isolated worktrees.

- [ ] **Step 0a — BE worktree.** From `apps/vernon_accounting`:
```bash
cd /Users/erickmo/Desktop/Project/frappe/apps/vernon_accounting
git fetch origin && git worktree add ../vernon_accounting-fee feat/struktur-biaya origin/HEAD 2>/dev/null || \
  git worktree add ../vernon_accounting-fee -b feat/struktur-biaya
```
- [ ] **Step 0b — FE worktree** already on branch `feat/keuangan-struktur-biaya` (created during brainstorming). If a fresh worktree is preferred, create one off that branch and `pnpm install` inside it (symlinked node_modules go stale across versions — see memory).
- [ ] **Step 0c — bench is dockerized.** Migrations/tests run via:
```bash
docker exec frappe-backend-1 bench --site sekolahpro.localhost migrate
docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --app vernon_accounting
```
The `vernon_accounting` app is bind-mounted from the MAIN checkout — edits in a worktree may be invisible to docker bench (see memory: OCR feature). If so, develop on the bind-mounted path or copy the doctype dirs over before migrate/test. Verify with `docker exec frappe-backend-1 ls /home/frappe/frappe-bench/apps/vernon_accounting/...` before relying on it.

---

# PHASE A — Backend (`vernon_accounting`)

Base path: `apps/vernon_accounting/vernon_accounting/accounting/`

### Task A1: Child doctype `School Fee Component Rate`

**Files:**
- Create: `accounting/doctype/school_fee_component_rate/school_fee_component_rate.json`
- Create: `accounting/doctype/school_fee_component_rate/__init__.py` (empty)
- Create: `accounting/doctype/school_fee_component_rate/school_fee_component_rate.py`

- [ ] **Step 1: Write the doctype JSON**

`school_fee_component_rate.json`:
```json
{
 "actions": [],
 "creation": "2026-06-15 00:00:00.000000",
 "doctype": "DocType",
 "engine": "InnoDB",
 "field_order": ["tingkat", "nominal"],
 "fields": [
  {"fieldname": "tingkat", "fieldtype": "Int", "label": "Tingkat", "reqd": 1, "in_list_view": 1},
  {"fieldname": "nominal", "fieldtype": "Currency", "label": "Nominal", "reqd": 1, "in_list_view": 1}
 ],
 "istable": 1,
 "links": [],
 "module": "Accounting",
 "name": "School Fee Component Rate",
 "owner": "Administrator",
 "permissions": [],
 "sort_field": "modified",
 "sort_order": "DESC"
}
```

- [ ] **Step 2: Write the controller stub**

`school_fee_component_rate.py`:
```python
# Child row: one per-tingkat price line on a School Fee Component.
import frappe
from frappe.model.document import Document


class SchoolFeeComponentRate(Document):
    pass
```

- [ ] **Step 3: Commit**
```bash
git add accounting/doctype/school_fee_component_rate
git commit -m "feat(accounting): doctype School Fee Component Rate (child per-tingkat harga)"
```

---

### Task A2: Parent doctype `School Fee Component` + validation

**Files:**
- Create: `accounting/doctype/school_fee_component/school_fee_component.json`
- Create: `accounting/doctype/school_fee_component/__init__.py` (empty)
- Create: `accounting/doctype/school_fee_component/school_fee_component.py`
- Test: `accounting/doctype/school_fee_component/test_school_fee_component.py`

- [ ] **Step 1: Write the doctype JSON**

`school_fee_component.json`:
```json
{
 "actions": [],
 "allow_import": 1,
 "autoname": "format:FEE-{company}-{tahun_ajaran}-{nama_komponen}",
 "creation": "2026-06-15 00:00:00.000000",
 "doctype": "DocType",
 "engine": "InnoDB",
 "field_order": [
  "company", "tahun_ajaran", "jenjang", "col_break_1",
  "nama_komponen", "ritme", "is_active",
  "section_accounts", "receivable_account", "income_account",
  "col_break_2", "due_day", "auto_generate",
  "section_rates", "rates"
 ],
 "fields": [
  {"fieldname": "company", "fieldtype": "Link", "label": "Company", "options": "Company", "reqd": 1, "in_list_view": 1},
  {"fieldname": "tahun_ajaran", "fieldtype": "Link", "label": "Tahun Ajaran", "options": "Tahun Ajaran", "reqd": 1, "in_list_view": 1},
  {"fieldname": "jenjang", "fieldtype": "Link", "label": "Jenjang", "options": "Unit Jenjang"},
  {"fieldname": "col_break_1", "fieldtype": "Column Break"},
  {"fieldname": "nama_komponen", "fieldtype": "Data", "label": "Nama Komponen", "reqd": 1, "in_list_view": 1},
  {"fieldname": "ritme", "fieldtype": "Select", "label": "Ritme", "options": "Bulanan\nPer Semester\nSekali", "reqd": 1, "default": "Bulanan", "in_list_view": 1},
  {"fieldname": "is_active", "fieldtype": "Check", "label": "Aktif", "default": "1"},
  {"fieldname": "section_accounts", "fieldtype": "Section Break", "label": "Akun"},
  {"fieldname": "receivable_account", "fieldtype": "Link", "label": "Akun Piutang", "options": "Account", "reqd": 1},
  {"fieldname": "income_account", "fieldtype": "Link", "label": "Akun Pendapatan", "options": "Account", "reqd": 1},
  {"fieldname": "col_break_2", "fieldtype": "Column Break"},
  {"fieldname": "due_day", "fieldtype": "Int", "label": "Hari Jatuh Tempo", "default": "10", "description": "Tanggal 1-28 untuk ritme Bulanan"},
  {"fieldname": "auto_generate", "fieldtype": "Check", "label": "Generate Otomatis (terjadwal)", "default": "0"},
  {"fieldname": "section_rates", "fieldtype": "Section Break", "label": "Harga per Tingkat"},
  {"fieldname": "rates", "fieldtype": "Table", "label": "Harga", "options": "School Fee Component Rate", "reqd": 1}
 ],
 "links": [],
 "module": "Accounting",
 "name": "School Fee Component",
 "naming_rule": "Expression",
 "owner": "Administrator",
 "permissions": [
  {"role": "Accounts Manager", "read": 1, "write": 1, "create": 1, "delete": 1},
  {"role": "Bendahara", "read": 1, "write": 1, "create": 1, "delete": 1},
  {"role": "Accounts User", "read": 1},
  {"role": "Kasir", "read": 1}
 ],
 "sort_field": "modified",
 "sort_order": "DESC",
 "track_changes": 1
}
```

- [ ] **Step 2: Write the failing test (validation)**

`test_school_fee_component.py`:
```python
# Validation tests for School Fee Component.
import frappe
from frappe.tests.utils import FrappeTestCase

from vernon_accounting.accounting.doctype.school_fee_component.test_fixtures import (
    make_fee_component,
)


class TestSchoolFeeComponent(FrappeTestCase):
    def test_rejects_due_day_out_of_range(self):
        with self.assertRaises(frappe.ValidationError):
            make_fee_component(due_day=31)

    def test_rejects_empty_rates(self):
        with self.assertRaises(frappe.ValidationError):
            make_fee_component(rates=[])

    def test_rejects_duplicate_tingkat(self):
        with self.assertRaises(frappe.ValidationError):
            make_fee_component(rates=[(1, 100000), (1, 120000)])

    def test_valid_component_saves(self):
        doc = make_fee_component(rates=[(1, 100000), (2, 120000)])
        self.assertTrue(doc.name)
        self.assertEqual(len(doc.rates), 2)
```

- [ ] **Step 3: Write the shared test fixtures helper**

`accounting/doctype/school_fee_component/test_fixtures.py`:
```python
# Reusable builders for fee-structure tests. Creates the minimum cross-app
# graph (Company/Sekolah/Tahun Ajaran/Rombel/Siswa) the generator needs.
import frappe

TEST_SEKOLAH = "sd-test-fee"          # Company.name == Sekolah.name
TEST_TA_NAMA = "2025/2026"
TEST_TA = f"{TEST_SEKOLAH}-{TEST_TA_NAMA}"


def _ensure(doctype, name, **fields):
    if frappe.db.exists(doctype, name):
        return frappe.get_doc(doctype, name)
    return frappe.get_doc({"doctype": doctype, **fields}).insert(ignore_permissions=True)


def ensure_base_graph():
    """Create Company, Sekolah, Tahun Ajaran shared by fee tests (idempotent)."""
    _ensure("Sekolah", TEST_SEKOLAH, nama="SD Test Fee", kode_pendek="sdtf")
    _ensure("Company", TEST_SEKOLAH, company_name="SD Test Fee", default_currency="IDR")
    if not frappe.db.exists("Tahun Ajaran", TEST_TA):
        frappe.get_doc({
            "doctype": "Tahun Ajaran", "sekolah": TEST_SEKOLAH,
            "nama": TEST_TA_NAMA, "aktif": 1,
        }).insert(ignore_permissions=True)


def make_rombel(tingkat, siswa_nis, nama_rombel=None, jenjang=None, status="Aktif"):
    """Create an active Rombel at `tingkat` with the given active student NIS list."""
    ensure_base_graph()
    for nis in siswa_nis:
        _ensure("Siswa", nis, nis=nis, nama_lengkap=f"Siswa {nis}", sekolah=TEST_SEKOLAH)
    doc = frappe.get_doc({
        "doctype": "Rombongan Belajar",
        "nama_rombel": nama_rombel or f"Kelas {tingkat}",
        "tahun_ajaran": TEST_TA, "tingkat": tingkat, "sekolah": TEST_SEKOLAH,
        "status": status,
        "anggota": [{"siswa": nis, "status": "Aktif"} for nis in siswa_nis],
    })
    if jenjang:
        doc.jenjang = jenjang
    return doc.insert(ignore_permissions=True)


def make_fee_component(nama_komponen="SPP", ritme="Bulanan", due_day=10,
                       rates=((1, 100000),), auto_generate=0, is_active=1):
    """Build + insert a School Fee Component with dummy IDR accounts."""
    ensure_base_graph()
    recv = _ensure("Account", f"Piutang Siswa - {TEST_SEKOLAH}",
                   account_name="Piutang Siswa", company=TEST_SEKOLAH,
                   root_type="Asset", report_type="Balance Sheet").name
    inc = _ensure("Account", f"Pendapatan SPP - {TEST_SEKOLAH}",
                  account_name="Pendapatan SPP", company=TEST_SEKOLAH,
                  root_type="Income", report_type="Profit and Loss").name
    return frappe.get_doc({
        "doctype": "School Fee Component", "company": TEST_SEKOLAH,
        "tahun_ajaran": TEST_TA, "nama_komponen": nama_komponen, "ritme": ritme,
        "due_day": due_day, "auto_generate": auto_generate, "is_active": is_active,
        "receivable_account": recv, "income_account": inc,
        "rates": [{"tingkat": t, "nominal": n} for t, n in rates],
    }).insert(ignore_permissions=True)
```

> NOTE during execution: the `Account` / `Company` / `Sekolah` minimal field sets above are best-effort. If insert fails on a missing reqd field, add it — do not silence with `ignore_mandatory`. Inspect each doctype's reqd fields once and pin the helper.

- [ ] **Step 4: Run test to verify it fails**
```bash
docker exec frappe-backend-1 bench --site sekolahpro.localhost migrate
docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests \
  --module vernon_accounting.accounting.doctype.school_fee_component.test_school_fee_component
```
Expected: FAIL — `test_rejects_due_day_out_of_range` etc. fail because no validation yet (component saves).

- [ ] **Step 5: Write the controller validation**

`school_fee_component.py`:
```python
# Config doctype: one priced fee component (e.g. SPP) per company+TA.
# Validation only; the period→invoice fan-out lives in the generator module.
import frappe
from frappe import _
from frappe.model.document import Document

DUE_DAY_MIN = 1
DUE_DAY_MAX = 28  # cap at 28 so every month has the day


class SchoolFeeComponent(Document):
    def validate(self):
        self._validate_due_day()
        self._validate_rates()

    def _validate_due_day(self):
        if self.ritme == "Bulanan" and not (DUE_DAY_MIN <= (self.due_day or 0) <= DUE_DAY_MAX):
            frappe.throw(_("Hari Jatuh Tempo harus antara {0}-{1}").format(DUE_DAY_MIN, DUE_DAY_MAX))

    def _validate_rates(self):
        if not self.rates:
            frappe.throw(_("Minimal satu baris Harga per Tingkat"))
        seen = set()
        for row in self.rates:
            if row.tingkat in seen:
                frappe.throw(_("Tingkat {0} duplikat").format(row.tingkat))
            seen.add(row.tingkat)
```

- [ ] **Step 6: Run test to verify it passes**
```bash
docker exec frappe-backend-1 bench --site sekolahpro.localhost migrate
docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests \
  --module vernon_accounting.accounting.doctype.school_fee_component.test_school_fee_component
```
Expected: PASS (4 tests).

- [ ] **Step 7: Commit**
```bash
git add accounting/doctype/school_fee_component
git commit -m "feat(accounting): doctype School Fee Component + validasi (rates, due_day)"
```

---

### Task A3: Additive fields on `School Fee Invoice`

**Files:**
- Modify: `accounting/doctype/school_fee_invoice/school_fee_invoice.json` (add to `field_order` + `fields`)

- [ ] **Step 1: Add `fee_component` + `periode` fields**

In `field_order`, after `"remarks"`, append `"section_provenance"`, `"fee_component"`, `"periode"`. In `fields`, append:
```json
  {"fieldname": "section_provenance", "fieldtype": "Section Break", "label": "Asal (Generator)"},
  {"fieldname": "fee_component", "fieldtype": "Data", "label": "Komponen Biaya", "read_only": 1},
  {"fieldname": "periode", "fieldtype": "Data", "label": "Periode", "read_only": 1}
```

- [ ] **Step 2: Migrate to apply schema**
```bash
docker exec frappe-backend-1 bench --site sekolahpro.localhost migrate
```
Expected: migrate succeeds; existing invoices keep both fields null.

- [ ] **Step 3: Commit**
```bash
git add accounting/doctype/school_fee_invoice/school_fee_invoice.json
git commit -m "feat(accounting): field fee_component + periode di School Fee Invoice (dedupe)"
```

---

### Task A4: Period normalization helper

**Files:**
- Create: `accounting/api/__init__.py` (empty, if missing)
- Create: `accounting/api/fee_period.py`
- Test: `accounting/api/test_fee_period.py`

- [ ] **Step 1: Write the failing test**

`test_fee_period.py`:
```python
import frappe
from frappe.tests.utils import FrappeTestCase

from vernon_accounting.accounting.api.fee_period import normalize_period


class TestFeePeriod(FrappeTestCase):
    def test_bulanan(self):
        p = normalize_period("Bulanan", "2026-05", "2025/2026", "SPP", due_day=10)
        self.assertEqual(p.marker, "2026-05")
        self.assertEqual(p.label, "SPP Mei 2026")
        self.assertEqual(str(p.posting_date), "2026-05-01")
        self.assertEqual(str(p.due_date), "2026-05-10")

    def test_per_semester(self):
        p = normalize_period("Per Semester", "2026-Ganjil", "2025/2026", "Daftar Ulang", due_day=10)
        self.assertEqual(p.marker, "2026-Ganjil")
        self.assertEqual(p.label, "Daftar Ulang Ganjil 2026")

    def test_sekali(self):
        p = normalize_period("Sekali", "", "2025/2026", "Uang Pangkal", due_day=10)
        self.assertEqual(p.marker, "2025/2026-Sekali")
        self.assertEqual(p.label, "Uang Pangkal 2025/2026")
```

- [ ] **Step 2: Run test to verify it fails**
```bash
docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests \
  --module vernon_accounting.accounting.api.test_fee_period
```
Expected: FAIL — `ModuleNotFoundError: fee_period`.

- [ ] **Step 3: Write the implementation**

`fee_period.py`:
```python
# Pure period normalization for the fee generator. Maps (ritme, period arg)
# onto a dedupe marker, a human label, and posting/due dates. No DB access.
from dataclasses import dataclass
from datetime import date

BULAN_ID = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"]


@dataclass(frozen=True)
class Period:
    marker: str
    label: str
    posting_date: date
    due_date: date


def normalize_period(ritme: str, arg: str, ta_nama: str, nama_komponen: str,
                     due_day: int) -> Period:
    if ritme == "Bulanan":
        year, month = (int(x) for x in arg.split("-"))
        posting = date(year, month, 1)
        due = date(year, month, min(max(due_day, 1), 28))
        return Period(f"{year:04d}-{month:02d}",
                      f"{nama_komponen} {BULAN_ID[month]} {year}", posting, due)
    if ritme == "Per Semester":
        year, semester = arg.split("-", 1)
        posting = date(int(year), 1 if semester == "Ganjil" else 7, 1)
        due = date(posting.year, posting.month, min(max(due_day, 1), 28))
        return Period(arg, f"{nama_komponen} {semester} {year}", posting, due)
    # Sekali: tied to the TA, period arg ignored.
    today = date.today()
    return Period(f"{ta_nama}-Sekali", f"{nama_komponen} {ta_nama}", today, today)
```

- [ ] **Step 4: Run test to verify it passes**
```bash
docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests \
  --module vernon_accounting.accounting.api.test_fee_period
```
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**
```bash
git add accounting/api/__init__.py accounting/api/fee_period.py accounting/api/test_fee_period.py
git commit -m "feat(accounting): helper normalize_period untuk generator biaya"
```

---

### Task A5: Generator `generate_fee_invoices` + whitelisted endpoint

**Files:**
- Create: `accounting/api/fee_generation.py`
- Test: `accounting/api/test_fee_generation.py`

- [ ] **Step 1: Write the failing tests**

`test_fee_generation.py`:
```python
import frappe
from frappe.tests.utils import FrappeTestCase

from vernon_accounting.accounting.doctype.school_fee_component.test_fixtures import (
    TEST_SEKOLAH, TEST_TA, TEST_TA_NAMA, make_fee_component, make_rombel,
)
from vernon_accounting.accounting.api.fee_generation import generate_fee_invoices


def _invoice_count(periode):
    return frappe.db.count("School Fee Invoice", {"periode": periode, "company": TEST_SEKOLAH})


class TestFeeGeneration(FrappeTestCase):
    def setUp(self):
        frappe.db.delete("School Fee Invoice", {"company": TEST_SEKOLAH})
        make_rombel(tingkat=1, siswa_nis=["FEE-001", "FEE-002"])
        make_rombel(tingkat=2, siswa_nis=["FEE-003"])
        make_fee_component(nama_komponen="SPP", ritme="Bulanan", due_day=10,
                           rates=[(1, 100000), (2, 150000)])

    def test_dry_run_counts_without_insert(self):
        s = generate_fee_invoices(TEST_SEKOLAH, TEST_TA, "2026-05", dry_run=True)
        self.assertEqual(s["created"], 3)        # 2 at tingkat 1 + 1 at tingkat 2
        self.assertEqual(s["total_amount"], 100000 * 2 + 150000)
        self.assertEqual(_invoice_count("2026-05"), 0)

    def test_real_run_inserts_per_student(self):
        s = generate_fee_invoices(TEST_SEKOLAH, TEST_TA, "2026-05", dry_run=False)
        self.assertEqual(s["created"], 3)
        self.assertEqual(_invoice_count("2026-05"), 3)
        inv = frappe.get_all("School Fee Invoice",
                             {"periode": "2026-05", "student": "FEE-001"},
                             ["judul", "jumlah", "student_name", "kelas", "tahun_ajaran"])[0]
        self.assertEqual(inv.judul, "SPP Mei 2026")
        self.assertEqual(inv.jumlah, 100000)
        self.assertEqual(inv.student_name, "Siswa FEE-001")
        self.assertEqual(inv.tahun_ajaran, TEST_TA_NAMA)

    def test_idempotent_rerun_creates_nothing(self):
        generate_fee_invoices(TEST_SEKOLAH, TEST_TA, "2026-05", dry_run=False)
        s = generate_fee_invoices(TEST_SEKOLAH, TEST_TA, "2026-05", dry_run=False)
        self.assertEqual(s["created"], 0)
        self.assertEqual(s["skipped"], 3)
        self.assertEqual(_invoice_count("2026-05"), 3)

    def test_inactive_component_skipped(self):
        make_fee_component(nama_komponen="Seragam", ritme="Sekali",
                           rates=[(1, 500000)], is_active=0)
        s = generate_fee_invoices(TEST_SEKOLAH, TEST_TA, "2026-05",
                                  ritme="Bulanan", dry_run=True)
        self.assertEqual(s["created"], 3)  # Seragam excluded (inactive + ritme filter)

    def test_no_students_is_warning_not_error(self):
        make_fee_component(nama_komponen="SPP SMP", ritme="Bulanan", due_day=10,
                           rates=[(9, 200000)])  # no rombel at tingkat 9
        s = generate_fee_invoices(TEST_SEKOLAH, TEST_TA, "2026-05", dry_run=True)
        self.assertTrue(any("tingkat 9" in w.lower() for w in s["warnings"]))
```

- [ ] **Step 2: Run tests to verify they fail**
```bash
docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests \
  --module vernon_accounting.accounting.api.test_fee_generation
```
Expected: FAIL — `ModuleNotFoundError: fee_generation`.

- [ ] **Step 3: Write the generator**

`fee_generation.py`:
```python
# Fee-invoice generator: fans a School Fee Component's per-tingkat rates out
# into School Fee Invoice rows for one period. Module-level (not an instance
# method) because it orchestrates ACROSS components and is called by two
# callers: the whitelisted manual endpoint and the daily scheduler.
import frappe
from frappe import _

from vernon_accounting.accounting.api.fee_period import normalize_period

INVOICE = "School Fee Invoice"
COMPONENT = "School Fee Component"
GENERATED_STATUS = "Belum Dibayar"


def _resolve_sekolah(company: str) -> str:
    """Company.name mirrors Sekolah.name by convention; verify it exists."""
    if not frappe.db.exists("Sekolah", company):
        frappe.throw(_("Sekolah untuk Company {0} tidak ditemukan").format(company))
    return company


def _active_students(sekolah, tahun_ajaran, tingkat, jenjang):
    """Return [(nis, nama_lengkap, nama_rombel)] active in the given tingkat."""
    filters = {"sekolah": sekolah, "tahun_ajaran": tahun_ajaran,
               "tingkat": tingkat, "status": "Aktif"}
    if jenjang:
        filters["jenjang"] = jenjang
    rombels = frappe.get_all("Rombongan Belajar", filters=filters,
                             fields=["name", "nama_rombel"])
    out = []
    for r in rombels:
        members = frappe.get_all("Anggota Rombel",
                                 {"parent": r.name, "status": "Aktif"}, ["siswa"])
        for m in members:
            nama = frappe.db.get_value("Siswa", m.siswa, "nama_lengkap") or m.siswa
            out.append((m.siswa, nama, r.nama_rombel))
    return out


def _exists(student, fee_component, periode, company) -> bool:
    return bool(frappe.db.exists(INVOICE, {
        "student": student, "fee_component": fee_component,
        "periode": periode, "company": company,
    }))


def generate_fee_invoices(company, tahun_ajaran, periode, ritme=None,
                          components=None, dry_run=False):
    """Generate School Fee Invoices from active components for one period.

    Returns {created, skipped, total_amount, by_component, warnings, errors}.
    Idempotent: an existing (student, fee_component, periode, company) is skipped.
    """
    sekolah = _resolve_sekolah(company)
    ta_nama = frappe.db.get_value("Tahun Ajaran", tahun_ajaran, "nama") or tahun_ajaran

    filters = {"company": company, "tahun_ajaran": tahun_ajaran, "is_active": 1}
    if ritme:
        filters["ritme"] = ritme
    if components:
        filters["name"] = ["in", components]
    comp_names = [c.name for c in frappe.get_all(COMPONENT, filters=filters, fields=["name"])]

    summary = {"created": 0, "skipped": 0, "total_amount": 0,
               "by_component": [], "warnings": [], "errors": []}

    for cname in comp_names:
        comp = frappe.get_doc(COMPONENT, cname)
        period = normalize_period(comp.ritme, periode, ta_nama, comp.nama_komponen,
                                  comp.due_day or 10)
        c_created = c_amount = 0
        for rate in comp.rates:
            students = _active_students(sekolah, tahun_ajaran, rate.tingkat, comp.jenjang)
            if not students:
                summary["warnings"].append(
                    _("Tidak ada siswa aktif di tingkat {0} ({1})").format(
                        rate.tingkat, comp.nama_komponen))
                continue
            for nis, nama, nama_rombel in students:
                if _exists(nis, comp.name, period.marker, company):
                    summary["skipped"] += 1
                    continue
                if not dry_run:
                    try:
                        _build_invoice(comp, period, nis, nama, nama_rombel, ta_nama)
                    except Exception as exc:  # collect, do not abort the batch
                        summary["errors"].append(f"{nis}: {exc}")
                        continue
                c_created += 1
                c_amount += rate.nominal
        summary["created"] += c_created
        summary["total_amount"] += c_amount
        summary["by_component"].append(
            {"nama": comp.nama_komponen, "count": c_created, "amount": c_amount})

    return summary


def _build_invoice(comp, period, nis, nama, nama_rombel, ta_nama):
    nominal = next(r.nominal for r in comp.rates
                   if r.tingkat == _tingkat_of(nama_rombel, comp))
    frappe.get_doc({
        "doctype": INVOICE, "posting_date": period.posting_date,
        "due_date": period.due_date, "company": comp.company,
        "student": nis, "student_name": nama, "kelas": nama_rombel,
        "judul": period.label, "tahun_ajaran": ta_nama,
        "jumlah": nominal, "status": GENERATED_STATUS,
        "receivable_account": comp.receivable_account,
        "income_account": comp.income_account,
        "fee_component": comp.name, "periode": period.marker,
        "remarks": f"Auto-generate dari {comp.name} periode {period.marker}",
    }).insert(ignore_permissions=True)
```

> The `_build_invoice` helper above re-derives nominal awkwardly. Replace with passing `nominal` explicitly from the caller loop — adjust the call to `_build_invoice(comp, period, nis, nama, nama_rombel, ta_nama, rate.nominal)` and drop `_tingkat_of`. (Kept the loop's `rate.nominal` in scope — pass it through.)

- [ ] **Step 3b: Fix the nominal pass-through (apply during impl)**

Change the loop call to `_build_invoice(comp, period, nis, nama, nama_rombel, ta_nama, rate.nominal)` and the signature to accept `nominal` and use it directly:
```python
def _build_invoice(comp, period, nis, nama, nama_rombel, ta_nama, nominal):
    frappe.get_doc({
        "doctype": INVOICE, "posting_date": period.posting_date,
        "due_date": period.due_date, "company": comp.company,
        "student": nis, "student_name": nama, "kelas": nama_rombel,
        "judul": period.label, "tahun_ajaran": ta_nama,
        "jumlah": nominal, "status": GENERATED_STATUS,
        "receivable_account": comp.receivable_account,
        "income_account": comp.income_account,
        "fee_component": comp.name, "periode": period.marker,
        "remarks": f"Auto-generate dari {comp.name} periode {period.marker}",
    }).insert(ignore_permissions=True)
```

- [ ] **Step 4: Add the whitelisted endpoint** (append to `fee_generation.py`)
```python
@frappe.whitelist()
def generate(company, tahun_ajaran, periode, ritme=None, components=None, dry_run=0):
    """HTTP entry: validate access then delegate to generate_fee_invoices."""
    if not frappe.has_permission(INVOICE, "create"):
        frappe.throw(_("Tidak punya izin membuat tagihan"), frappe.PermissionError)
    comps = frappe.parse_json(components) if isinstance(components, str) else components
    return generate_fee_invoices(company, tahun_ajaran, periode, ritme=ritme,
                                 components=comps, dry_run=bool(int(dry_run)))
```

- [ ] **Step 5: Run tests to verify they pass**
```bash
docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests \
  --module vernon_accounting.accounting.api.test_fee_generation
```
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**
```bash
git add accounting/api/fee_generation.py accounting/api/test_fee_generation.py
git commit -m "feat(accounting): generator tagihan biaya (fan-out per tingkat, idempoten) + endpoint"
```

---

### Task A6: Daily scheduler for auto-generate components

**Files:**
- Create: `accounting/api/fee_scheduler.py`
- Modify: `vernon_accounting/hooks.py` (`scheduler_events`)
- Test: `accounting/api/test_fee_scheduler.py`

- [ ] **Step 1: Write the failing test**

`test_fee_scheduler.py`:
```python
import frappe
from datetime import date
from frappe.tests.utils import FrappeTestCase

from vernon_accounting.accounting.doctype.school_fee_component.test_fixtures import (
    TEST_SEKOLAH, TEST_TA, make_fee_component, make_rombel,
)
from vernon_accounting.accounting.api import fee_scheduler


class TestFeeScheduler(FrappeTestCase):
    def setUp(self):
        frappe.db.delete("School Fee Invoice", {"company": TEST_SEKOLAH})
        make_rombel(tingkat=1, siswa_nis=["SCH-001"])

    def test_runs_only_matching_due_day(self):
        make_fee_component(nama_komponen="SPP", ritme="Bulanan", due_day=15,
                           rates=[(1, 100000)], auto_generate=1)
        fee_scheduler.run_for_date(date(2026, 5, 15))
        self.assertEqual(
            frappe.db.count("School Fee Invoice",
                            {"company": TEST_SEKOLAH, "periode": "2026-05"}), 1)

    def test_skips_non_due_day(self):
        make_fee_component(nama_komponen="SPP", ritme="Bulanan", due_day=15,
                           rates=[(1, 100000)], auto_generate=1)
        fee_scheduler.run_for_date(date(2026, 5, 14))
        self.assertEqual(
            frappe.db.count("School Fee Invoice", {"company": TEST_SEKOLAH}), 0)

    def test_skips_when_auto_generate_off(self):
        make_fee_component(nama_komponen="SPP", ritme="Bulanan", due_day=15,
                           rates=[(1, 100000)], auto_generate=0)
        fee_scheduler.run_for_date(date(2026, 5, 15))
        self.assertEqual(
            frappe.db.count("School Fee Invoice", {"company": TEST_SEKOLAH}), 0)
```

- [ ] **Step 2: Run test to verify it fails**
```bash
docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests \
  --module vernon_accounting.accounting.api.test_fee_scheduler
```
Expected: FAIL — `ModuleNotFoundError: fee_scheduler`.

- [ ] **Step 3: Write the scheduler**

`fee_scheduler.py`:
```python
# Daily scheduler entry: auto-generate monthly fee invoices for components
# flagged auto_generate=1 whose due_day matches today. Idempotent via the
# generator's dedupe, so a missed/retried day never double-bills.
import frappe
from datetime import date

from vernon_accounting.accounting.api.fee_generation import generate_fee_invoices


def daily():
    """hooks.py scheduler_events['daily'] entry."""
    run_for_date(date.today())


def run_for_date(today: date):
    periode = f"{today.year:04d}-{today.month:02d}"
    components = frappe.get_all(
        "School Fee Component",
        filters={"auto_generate": 1, "ritme": "Bulanan", "is_active": 1,
                 "due_day": today.day},
        fields=["name", "company", "tahun_ajaran"])
    for c in components:
        generate_fee_invoices(c.company, c.tahun_ajaran, periode,
                              ritme="Bulanan", components=[c.name], dry_run=False)
```

- [ ] **Step 4: Wire `hooks.py`**

Replace the commented `scheduler_events` block with:
```python
scheduler_events = {
    "daily": [
        "vernon_accounting.accounting.api.fee_scheduler.daily",
    ],
}
```

- [ ] **Step 5: Run test to verify it passes**
```bash
docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests \
  --module vernon_accounting.accounting.api.test_fee_scheduler
```
Expected: PASS (3 tests).

- [ ] **Step 6: Run the full app test suite**
```bash
docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --app vernon_accounting
```
Expected: all green (existing + new).

- [ ] **Step 7: Commit + open BE PR**
```bash
git add accounting/api/fee_scheduler.py accounting/api/test_fee_scheduler.py vernon_accounting/hooks.py
git commit -m "feat(accounting): scheduler harian auto-generate SPP bulanan"
git push -u origin feat/struktur-biaya
gh pr create --fill --base main
```

---

# PHASE B — Frontend (`apps/sekolahpro-web/apps/school`)

Branch `feat/keuangan-struktur-biaya`. Run all FE commands from `apps/sekolahpro-web`.

### Task B1: UI types + mock fixtures

**Files:**
- Create: `apps/school/src/data/fee-structure.ts`
- Test: `apps/school/src/data/fee-structure.test.ts`

- [ ] **Step 1: Write the failing test**

`fee-structure.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { summarizePreview, type GenerateSummary } from "./fee-structure";

describe("summarizePreview", () => {
  it("totals count and amount across components", () => {
    const s: GenerateSummary = {
      created: 3, skipped: 1, total_amount: 350000,
      by_component: [
        { nama: "SPP", count: 2, amount: 200000 },
        { nama: "Seragam", count: 1, amount: 150000 },
      ],
      warnings: [], errors: [],
    };
    const r = summarizePreview(s);
    expect(r.totalSiswa).toBe(3);
    expect(r.totalRupiah).toBe(350000);
    expect(r.lines).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter school test -- fee-structure`
Expected: FAIL — cannot resolve `./fee-structure`.

- [ ] **Step 3: Write the types + helper + mock**

`fee-structure.ts`:
```ts
/**
 * UI types + pure helpers for the Struktur Biaya (fee structure) screen.
 * Mirrors the vernon_accounting `School Fee Component` doctype shape and the
 * generator summary contract. Mock fixtures keep the page alive offline/demo,
 * matching the pattern in `data/keuangan.ts`.
 */
export type Ritme = "Bulanan" | "Per Semester" | "Sekali";

export interface FeeRate {
  tingkat: number;
  nominal: number;
}

export interface FeeComponent {
  name: string;
  nama_komponen: string;
  ritme: Ritme;
  tahun_ajaran: string;
  jenjang?: string;
  due_day: number;
  auto_generate: boolean;
  is_active: boolean;
  rates: FeeRate[];
}

export interface GenerateSummaryLine {
  nama: string;
  count: number;
  amount: number;
}

export interface GenerateSummary {
  created: number;
  skipped: number;
  total_amount: number;
  by_component: GenerateSummaryLine[];
  warnings: string[];
  errors: string[];
}

/** Reduce a generator summary into the figures the preview modal shows. */
export function summarizePreview(s: GenerateSummary): {
  totalSiswa: number;
  totalRupiah: number;
  lines: GenerateSummaryLine[];
} {
  return { totalSiswa: s.created, totalRupiah: s.total_amount, lines: s.by_component };
}

export const MOCK_FEE_COMPONENTS: FeeComponent[] = [
  {
    name: "FEE-demo-SPP", nama_komponen: "SPP", ritme: "Bulanan",
    tahun_ajaran: "2025/2026", due_day: 10, auto_generate: true, is_active: true,
    rates: [{ tingkat: 1, nominal: 250000 }, { tingkat: 2, nominal: 275000 }],
  },
  {
    name: "FEE-demo-Pangkal", nama_komponen: "Uang Pangkal", ritme: "Sekali",
    tahun_ajaran: "2025/2026", due_day: 10, auto_generate: false, is_active: true,
    rates: [{ tingkat: 1, nominal: 2500000 }],
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter school test -- fee-structure`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add apps/school/src/data/fee-structure.ts apps/school/src/data/fee-structure.test.ts
git commit -m "feat(keuangan): tipe + mock + summarizePreview struktur biaya"
```

---

### Task B2: Live data layer (list + generate)

**Files:**
- Create: `apps/school/src/data/fee-structure-live.ts`
- Test: `apps/school/src/data/fee-structure-live.test.ts`

- [ ] **Step 1: Write the failing test (doc → UI mapping)**

`fee-structure-live.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mapComponentDoc, type FeeComponentDoc } from "./fee-structure-live";

describe("mapComponentDoc", () => {
  it("maps doc + child rates and coerces checks to boolean", () => {
    const doc: FeeComponentDoc = {
      name: "FEE-x", nama_komponen: "SPP", ritme: "Bulanan",
      tahun_ajaran: "sd-x-2025/2026", due_day: 10, auto_generate: 1, is_active: 1,
      rates: [{ tingkat: 1, nominal: 100000 }],
    };
    const ui = mapComponentDoc(doc);
    expect(ui.auto_generate).toBe(true);
    expect(ui.is_active).toBe(true);
    expect(ui.rates[0].nominal).toBe(100000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter school test -- fee-structure-live`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Write the live layer**

`fee-structure-live.ts`:
```ts
/**
 * Live (Frappe-backed) data for Struktur Biaya. Lists School Fee Component
 * scoped to the active company, and calls the whitelisted generator endpoint.
 * Mirrors `data/keuangan-live.ts` (useResourceList + useActiveCompany).
 */
import { useResourceList, useFrappeMutation } from "@sekolahpro/api-client";
import { useActiveCompany } from "../lib/akuntansi-scope";
import type { FeeComponent, GenerateSummary, Ritme } from "./fee-structure";

const SCHOOL_FEE_COMPONENT = "School Fee Component";
const GENERATE_METHOD =
  "vernon_accounting.accounting.api.fee_generation.generate";

export interface FeeRateDoc {
  tingkat: number;
  nominal: number;
}

export interface FeeComponentDoc {
  name: string;
  nama_komponen: string;
  ritme: Ritme;
  tahun_ajaran: string;
  jenjang?: string;
  due_day: number;
  auto_generate: 0 | 1;
  is_active: 0 | 1;
  rates: FeeRateDoc[];
}

const COMPONENT_FIELDS = [
  "name", "nama_komponen", "ritme", "tahun_ajaran", "jenjang",
  "due_day", "auto_generate", "is_active",
];

/** Map a School Fee Component doc onto the UI FeeComponent shape. */
export function mapComponentDoc(doc: FeeComponentDoc): FeeComponent {
  return {
    name: doc.name,
    nama_komponen: doc.nama_komponen,
    ritme: doc.ritme,
    tahun_ajaran: doc.tahun_ajaran,
    ...(doc.jenjang ? { jenjang: doc.jenjang } : {}),
    due_day: doc.due_day,
    auto_generate: Boolean(doc.auto_generate),
    is_active: Boolean(doc.is_active),
    rates: (doc.rates ?? []).map((r) => ({ tingkat: r.tingkat, nominal: r.nominal })),
  };
}

/** Live list of fee components for the active company. */
export function useFeeComponentsLive() {
  const company = useActiveCompany();
  const q = useResourceList<FeeComponentDoc>(SCHOOL_FEE_COMPONENT, {
    fields: COMPONENT_FIELDS,
    filters: company ? [["company", "=", company]] : [],
    order_by: "nama_komponen asc",
    limit_page_length: 0,
  });
  return {
    components: (q.data ?? []).map(mapComponentDoc),
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: () => void q.refetch(),
  };
}

export interface GenerateArgs extends Record<string, unknown> {
  company: string;
  tahun_ajaran: string;
  periode: string;
  ritme?: string;
  components?: string[];
  dry_run: 0 | 1;
}

/** Mutation hook to call the generator (dry-run preview or real). */
export function useGenerateInvoices() {
  return useFrappeMutation<GenerateArgs, GenerateSummary>(GENERATE_METHOD);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter school test -- fee-structure-live`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add apps/school/src/data/fee-structure-live.ts apps/school/src/data/fee-structure-live.test.ts
git commit -m "feat(keuangan): live layer komponen biaya + hook generate"
```

---

### Task B3: `GenerateTagihanModal` component

**Files:**
- Create: `apps/school/src/components/keuangan/GenerateTagihanModal.tsx`
- Test: `apps/school/src/components/keuangan/__tests__/GenerateTagihanModal.test.tsx`

- [ ] **Step 1: Write the failing test**

`GenerateTagihanModal.test.tsx`:
```tsx
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { GenerateTagihanModal } from "../GenerateTagihanModal";
import type { GenerateSummary } from "../../../data/fee-structure";

afterEach(cleanup);

const SUMMARY: GenerateSummary = {
  created: 3, skipped: 0, total_amount: 750000,
  by_component: [{ nama: "SPP", count: 3, amount: 750000 }],
  warnings: [], errors: [],
};

describe("GenerateTagihanModal", () => {
  it("shows preview figures after dry-run, then confirms", async () => {
    const onGenerate = vi.fn().mockResolvedValue(SUMMARY);
    const onConfirmed = vi.fn();
    render(
      <GenerateTagihanModal
        open periode="2026-05" onClose={() => {}}
        onGenerate={onGenerate} onConfirmed={onConfirmed}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /pratinjau/i }));
    expect(await screen.findByText(/3 siswa/i)).toBeTruthy();
    expect(onGenerate).toHaveBeenCalledWith(expect.objectContaining({ dry_run: 1 }));

    fireEvent.click(screen.getByRole("button", { name: /buat tagihan/i }));
    expect(await screen.findByText(/3 siswa/i)).toBeTruthy();
    expect(onGenerate).toHaveBeenLastCalledWith(expect.objectContaining({ dry_run: 0 }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter school test -- GenerateTagihanModal`
Expected: FAIL — cannot resolve `../GenerateTagihanModal`.

- [ ] **Step 3: Write the component**

`GenerateTagihanModal.tsx`:
```tsx
/**
 * Modal: pick a period, preview (dry-run) the affected students + total per
 * component, then confirm to create the invoices. `onGenerate` is injected so
 * the component is pure-testable; the route wires it to useGenerateInvoices.
 */
import { useState } from "react";
import { Modal, Button } from "@sekolahpro/ui";
import { summarizePreview, type GenerateSummary } from "../../data/fee-structure";

interface GenerateArgsLite extends Record<string, unknown> {
  periode: string;
  dry_run: 0 | 1;
}

interface Props {
  open: boolean;
  periode: string;
  onClose: () => void;
  onGenerate: (args: GenerateArgsLite) => Promise<GenerateSummary>;
  onConfirmed: (summary: GenerateSummary) => void;
}

const RUPIAH = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export function GenerateTagihanModal({ open, periode, onClose, onGenerate, onConfirmed }: Props) {
  const [preview, setPreview] = useState<GenerateSummary | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(dry: 0 | 1) {
    setBusy(true);
    try {
      const summary = await onGenerate({ periode, dry_run: dry });
      setPreview(summary);
      if (dry === 0) onConfirmed(summary);
    } finally {
      setBusy(false);
    }
  }

  const p = preview ? summarizePreview(preview) : null;

  return (
    <Modal open={open} onClose={onClose} title={`Generate Tagihan — ${periode}`}>
      <div className="space-y-4">
        {p && (
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="font-medium">{p.totalSiswa} siswa · {RUPIAH.format(p.totalRupiah)}</p>
            <ul className="mt-2 space-y-1 text-slate-600">
              {p.lines.map((l) => (
                <li key={l.nama}>{l.nama}: {l.count} siswa · {RUPIAH.format(l.amount)}</li>
              ))}
            </ul>
            {preview!.warnings.length > 0 && (
              <ul className="mt-2 text-amber-600">
                {preview!.warnings.map((w) => <li key={w}>⚠ {w}</li>)}
              </ul>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => void run(1)} disabled={busy}>Pratinjau</Button>
          <Button onClick={() => void run(0)} disabled={busy || !preview}>Buat Tagihan</Button>
        </div>
      </div>
    </Modal>
  );
}
```

> Verify `Modal` + `Button` prop names against `@sekolahpro/ui` exports during impl (the keuangan routes already import both — copy their usage). Adjust `variant`/`title` props if the lib differs.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter school test -- GenerateTagihanModal`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add apps/school/src/components/keuangan/GenerateTagihanModal.tsx \
        apps/school/src/components/keuangan/__tests__/GenerateTagihanModal.test.tsx
git commit -m "feat(keuangan): GenerateTagihanModal pratinjau + konfirmasi"
```

---

### Task B4: Route `keuangan/biaya` (Struktur Biaya screen)

**Files:**
- Create: `apps/school/src/routes/sch.$sekolah.keuangan.biaya.tsx`
- Test: `apps/school/src/routes/__tests__/keuangan-biaya.test.tsx`

- [ ] **Step 1: Write the failing test**

`keuangan-biaya.test.tsx`:
```tsx
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StrukturBiayaView } from "../sch.$sekolah.keuangan.biaya";
import type { FeeComponent } from "../../data/fee-structure";

afterEach(cleanup);

const COMPONENTS: FeeComponent[] = [
  { name: "FEE-SPP", nama_komponen: "SPP", ritme: "Bulanan", tahun_ajaran: "2025/2026",
    due_day: 10, auto_generate: true, is_active: true,
    rates: [{ tingkat: 1, nominal: 250000 }] },
];

describe("StrukturBiayaView", () => {
  it("lists components with ritme + per-tingkat rates", () => {
    render(<StrukturBiayaView components={COMPONENTS} canManage onGenerate={() => {}} />);
    expect(screen.getByText("SPP")).toBeTruthy();
    expect(screen.getByText(/Bulanan/)).toBeTruthy();
    expect(screen.getByText(/Tingkat 1/)).toBeTruthy();
  });

  it("hides manage actions when canManage is false", () => {
    render(<StrukturBiayaView components={COMPONENTS} canManage={false} onGenerate={() => {}} />);
    expect(screen.queryByRole("button", { name: /generate tagihan/i })).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter school test -- keuangan-biaya`
Expected: FAIL — cannot resolve route module / `StrukturBiayaView`.

- [ ] **Step 3: Write the route + named view export**

`sch.$sekolah.keuangan.biaya.tsx`:
```tsx
/**
 * Struktur Biaya — define fee components priced per tingkat and launch the
 * generator. Route wires live data + role gating; StrukturBiayaView is a pure,
 * test-friendly presentation component (named export so vitest can mount it
 * without the TanStack Route shell).
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@sekolahpro/ui";
import { ModuleShell } from "../components/shell/ModuleShell";
import { GenerateTagihanModal } from "../components/keuangan/GenerateTagihanModal";
import { useFeeComponentsLive, useGenerateInvoices } from "../data/fee-structure-live";
import { useActiveCompany } from "../lib/akuntansi-scope";
import type { FeeComponent, GenerateSummary } from "../data/fee-structure";
import { useKeuanganRole } from "../lib/keuanganRole";

const RUPIAH = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export function StrukturBiayaView(props: {
  components: FeeComponent[];
  canManage: boolean;
  onGenerate: () => void;
}) {
  const { components, canManage, onGenerate } = props;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Struktur Biaya</h2>
        {canManage && <Button onClick={onGenerate}>Generate Tagihan</Button>}
      </div>
      <ul className="space-y-3">
        {components.map((c) => (
          <li key={c.name} className="rounded-lg border border-slate-200 p-3">
            <div className="flex justify-between">
              <span className="font-medium">{c.nama_komponen}</span>
              <span className="text-sm text-slate-500">{c.ritme}{c.is_active ? "" : " · nonaktif"}</span>
            </div>
            <ul className="mt-2 text-sm text-slate-600">
              {c.rates.map((r) => (
                <li key={r.tingkat}>Tingkat {r.tingkat}: {RUPIAH.format(r.nominal)}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StrukturBiayaRoute() {
  const company = useActiveCompany();
  const { components } = useFeeComponentsLive();
  const generate = useGenerateInvoices();
  const role = useKeuanganRole();
  const [modalOpen, setModalOpen] = useState(false);
  const periode = new Date().toISOString().slice(0, 7); // current YYYY-MM

  function onConfirmed(_s: GenerateSummary) {
    setModalOpen(false);
  }

  return (
    <ModuleShell>
      <StrukturBiayaView
        components={components}
        canManage={role.canManage}
        onGenerate={() => setModalOpen(true)}
      />
      <GenerateTagihanModal
        open={modalOpen}
        periode={periode}
        onClose={() => setModalOpen(false)}
        onGenerate={(args) =>
          generate.mutateAsync({
            ...args, company, tahun_ajaran: "", ritme: "Bulanan",
          } as Parameters<typeof generate.mutateAsync>[0])}
        onConfirmed={onConfirmed}
      />
    </ModuleShell>
  );
}

export const Route = createFileRoute("/sch/$sekolah/keuangan/biaya")({
  component: StrukturBiayaRoute,
});
```

> During impl, verify against the existing `keuangan.*.tsx` routes: (a) the exact `ModuleShell` import path + required props, (b) `useKeuanganRole` location/shape (or substitute the established keuangan role helper — grep `KeuanganRoleChips` for the source), (c) that `tahun_ajaran` is sourced from the active TA (the modal needs a real TA; thread it from a TA picker or the active-TA hook rather than `""`). Fix these three before the route is functional — the unit test covers `StrukturBiayaView` only.

- [ ] **Step 4: Generate the route tree + run test**
```bash
pnpm --filter school generate   # regenerate routeTree.gen.ts (gitignored)
pnpm --filter school test -- keuangan-biaya
```
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**
```bash
git add apps/school/src/routes/sch.\$sekolah.keuangan.biaya.tsx \
        apps/school/src/routes/__tests__/keuangan-biaya.test.tsx
git commit -m "feat(keuangan): route Struktur Biaya + view list komponen"
```

---

### Task B5: Wire onboarding + hub nav + global search

**Files:**
- Modify: `apps/school/src/data/onboarding.ts` (`id:"spp"` step)
- Modify: `apps/school/src/components/keuangan/KeuanganHubNav.tsx`
- Modify: `apps/school/src/lib/global-search.ts`
- Test: `apps/school/src/data/onboarding.test.ts` (extend or create)

- [ ] **Step 1: Write the failing test (onboarding step points to /keuangan/biaya and reflects component count)**

Add to `apps/school/src/data/onboarding.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildSppStep } from "./onboarding";

describe("buildSppStep", () => {
  it("links to struktur biaya and is done when components exist", () => {
    expect(buildSppStep(0)).toMatchObject({ href: "/keuangan/biaya", done: false });
    expect(buildSppStep(2).done).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter school test -- onboarding`
Expected: FAIL — `buildSppStep` not exported.

- [ ] **Step 3: Refactor the SPP step into `buildSppStep` + wire count**

In `onboarding.ts`, replace the inline `id:"spp"` object with a call to a new exported helper, and feed it a live component count (query `School Fee Component` length where the onboarding data is assembled — mirror how `jadwalQ` is used):
```ts
/** Onboarding step for fee setup; `done` once any fee component exists. */
export function buildSppStep(componentCount: number) {
  return {
    id: "spp",
    label: "Konfigurasi SPP",
    description: "Komponen biaya & harga per tingkat.",
    href: "/keuangan/biaya",
    done: componentCount > 0,
  };
}
```
Then at the call site: `buildSppStep(feeComponentQ.data?.length ?? 0)` (add a `useResourceList("School Fee Component", { fields:["name"], limit_page_length: 0 })` alongside the existing onboarding queries).

- [ ] **Step 4: Add hub nav entry + global-search synonym**

In `KeuanganHubNav.tsx`, add a nav item `{ label: "Struktur Biaya", href: "/keuangan/biaya" }` next to Tagihan (match the existing item shape).

In `global-search.ts`, add:
```ts
  { label: "Struktur Biaya", href: "/keuangan/biaya", synonyms: ["struktur biaya", "komponen biaya", "setup spp", "konfigurasi spp", "generate tagihan"] },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter school test -- onboarding`
Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add apps/school/src/data/onboarding.ts apps/school/src/data/onboarding.test.ts \
        apps/school/src/components/keuangan/KeuanganHubNav.tsx apps/school/src/lib/global-search.ts
git commit -m "feat(keuangan): wiring onboarding SPP + hub nav + global search ke Struktur Biaya"
```

---

### Task B6: Full FE verification + PR

- [ ] **Step 1: Typecheck**

Run: `pnpm --filter school generate && pnpm --filter school typecheck`
Expected: 0 errors. (If routeTree.gen.ts errors appear, re-run `generate` first — see memory.)

- [ ] **Step 2: Lint**

Run: `pnpm --filter school lint`
Expected: 0 errors. (Confirm new hooks sit above any early-return guards — see `useKoperasiMode-hook-above-guards` memory; applies to any route/component with session guards.)

- [ ] **Step 3: Full test suite**

Run: `pnpm --filter school test`
Expected: all pass (prior count + the new files).

- [ ] **Step 4: Build**

Run: `pnpm --filter school build`
Expected: success.

- [ ] **Step 5: Commit any fixups + open FE PR**
```bash
git push -u origin feat/keuangan-struktur-biaya
gh pr create --fill --base main
```

---

## Documentation (vernon mandatory — do before final PR review)

- [ ] **D1:** Update `docs/domains/keuangan/README.html` (or create) — new doctypes/fields/rules + Cross-Domain Events (generator → "fee invoices generated").
- [ ] **D2:** Update `docs/implementation-tracker.md` — add PRD/TRD rows for struktur biaya with Tests + Test-Data columns; recalc the Summary table.
- [ ] **D3:** Write an ADR recording the component-centric model + the `Company.name == Sekolah.name` identity resolver decision.
- [ ] **D4:** Mark the spec implemented: append a status note to `docs/superpowers/specs/2026-06-15-keuangan-struktur-biaya-design.md`.

---

## Deploy notes

- BE: `bench migrate` installs the two new doctypes + invoice fields; `bench restart` to load the scheduler hook. Backfill not required (new feature).
- The `auto_generate` scheduler runs daily; verify `scheduler_enabled` on the site, else it never fires.
- Per memory: vernon_accounting is bind-mounted from the MAIN checkout — ensure the merged code is on the path docker bench sees before relying on the live scheduler.

---

## Self-review notes (author)

- Spec §5 model → Tasks A1/A2/A3. §6 generator → A4 (period) + A5 (fan-out, idempotency, dry_run, ritme filter, scope). §7 scheduler → A6. §8 FE → B1–B5. §9 errors/perms → A2 validation + A5 whitelist permission + warnings. §10 tests → each task's TDD steps. §11 docs → D1–D4. §12 open items → resolved in "Verified codebase facts" (resolver=identity, TA join by name, autoname format set, scoping mirrors School Fee Invoice).
- Type consistency: `GenerateSummary`/`summarizePreview`/`by_component[].{nama,count,amount}` consistent across `fee-structure.ts`, the modal, the live layer, and the BE summary dict keys.
- Known impl-time verifications flagged inline (Modal/Button props, ModuleShell path, useKeuanganRole source, active-TA threading, Account/Company reqd fields, docker bind-mount visibility) — these need a 1-line grep each, not a redesign.
