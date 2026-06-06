# Absensi Phases 2/3/4 (PWA + QR + Derivation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close ABS-002/003/004 — derive Attendance Event taps into akademik Absensi Harian/Pelajaran (BE), add a student dynamic-QR screen, and build the attendance_station PWA.

**Architecture:** Three independent workstreams across two repos, executed C → B → A. C (backend `sekolahpro`) adds a derivation service triggered on `Attendance Event.after_insert` plus a 23:00 reconciliation cron, writing into the EXISTING akademik summary doctypes (decision D1). B and A (web `sekolahpro-web`) add the student Show-QR route and a new PWA package whose pure logic is fully unit-tested while hardware adapters stay thin.

**Tech Stack:** Frappe/Python + pytest (BE); React 18 + Vite 5 + TanStack Router + vitest + `@zxing/browser` + `@noble/curves` + `qrcode` + vite-plugin-pwa (web).

**Spec:** `docs/superpowers/specs/2026-06-07-absensi-phase234-implementation-design.md` (+ base `2026-05-29-attendance-station-design.md`).

**Confirmed field facts (do not re-discover):**
- `Attendance Event`: subject_type (`Siswa|Guru|Staff`), subject_id (Dynamic Link), sekolah, method (`card|qr|manual`), direction (`in|out`), event_type (`gate|class|event`), tapped_at (Datetime), status (`accepted|rejected|duplicate`), `jadwal_pelajaran` = the **Slot Jadwal** child name (Data).
- `Absensi Harian` (`sekolahpro/akademik/doctype/absensi_harian`): rombel (Link Rombongan Belajar), tanggal (Date), dibuat_oleh, detail (Table → Detail Absensi Harian), sekolah, organisasi. autoname `ABH-.####`.
- `Detail Absensi Harian` (istable): siswa (Link), status (`Hadir|Izin|Sakit|Alpha`, default Hadir), keterangan.
- `Absensi Pelajaran`: rombel, mata_pelajaran (Link), tanggal, guru (Link Pegawai), slot (Link Slot Jadwal), sumber_input (`Manual|FaceRec|NFC|QR`, default Manual), detail (Table → Detail Absensi Pelajaran), sekolah. autoname `ABP-.####`.
- `Detail Absensi Pelajaran` (istable): siswa, status (`Hadir|Izin|Sakit|Alpha|Terlambat`, default Hadir), timestamp (Datetime), keterangan.
- `Anggota Rombel` (istable, child of Rombongan Belajar): siswa (Link), status (`Aktif|Keluar`). Resolve siswa→rombel: `frappe.get_all("Anggota Rombel", {"siswa":..,"status":"Aktif"}, ["parent"])`.
- `Slot Jadwal` (istable, child of Jadwal Pelajaran via `slots`): hari, jam_mulai (Time), jam_selesai (Time), mata_pelajaran (Link), guru (Link Pegawai), ruangan. `.parent` = Jadwal Pelajaran name.
- `Jadwal Pelajaran`: rombel (Link), semester, tahun_ajaran, is_aktif (Check), slots (Table), sekolah.
- `Sekolah` doctype JSON: `sekolahpro/pengaturan/doctype/sekolah/sekolah.json`.

**bench command (BE tests, docker):**
`docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --app sekolahpro --module sekolahpro.attendance.tests.test_derivation_service`
(coreutils in `/usr/bin`; see memory `bench-runs-in-docker`).

---

## PHASE C — Backend derivation (repo `sekolahpro`, branch `feat/absensi-derivation`)

> Base off BE `origin/main`. Worktree is invisible to docker-bench (it reads the main checkout) — see memory `ocr-identitas-feature`. Implement on the branch in the **main checkout** so `bench run-tests` sees it, or copy the module into the bind-mounted checkout before each bench-run. Confirm the running container name with `docker ps` first.

### Task C0: Schema + constants

**Files:**
- Modify: `sekolahpro/pengaturan/doctype/sekolah/sekolah.json`
- Modify: `sekolahpro/akademik/doctype/absensi_harian/absensi_harian.json`
- Modify: `sekolahpro/akademik/doctype/detail_absensi_harian/detail_absensi_harian.json`
- Create: `sekolahpro/attendance/derivation_constants.py`

- [ ] **Step 1: Add school-time fields to Sekolah**

Add to the Sekolah `fields` array (place near other config fields):

```json
{"fieldname": "jam_masuk", "fieldtype": "Time", "label": "Jam Masuk Sekolah", "default": "07:00:00"},
{"fieldname": "toleransi_terlambat", "fieldtype": "Int", "label": "Toleransi Terlambat (menit)", "default": 0}
```

- [ ] **Step 2: Add override-guard field to Absensi Harian**

Add to Absensi Harian `fields` array:

```json
{"fieldname": "sumber_input", "fieldtype": "Select", "label": "Sumber Input", "options": "Manual\nOtomatis", "default": "Manual"}
```

- [ ] **Step 3: Add `Terlambat` to Detail Absensi Harian status**

Change the `status` field `options` in `detail_absensi_harian.json` from `"Hadir\nIzin\nSakit\nAlpha"` to:

```json
"options": "Hadir\nIzin\nSakit\nAlpha\nTerlambat"
```

- [ ] **Step 4: Create derivation constants**

```python
# sekolahpro/attendance/derivation_constants.py
"""Constants for deriving akademik attendance summaries from raw Attendance Events.

Source of truth: docs/superpowers/specs/2026-06-07-absensi-phase234-implementation-design.md (D1-D3).
"""

# Status values written into akademik Detail rows.
STATUS_HADIR = "Hadir"
STATUS_TERLAMBAT = "Terlambat"
STATUS_ALPHA = "Alpha"

# Absensi Harian header source marker (override guard).
SUMBER_MANUAL = "Manual"
SUMBER_OTOMATIS = "Otomatis"

# Absensi Pelajaran sumber_input value per raw tap method.
SUMBER_BY_METHOD = {"qr": "QR", "card": "NFC", "manual": "Manual"}

# Default school open time when Sekolah.jam_masuk is unset.
DEFAULT_JAM_MASUK = "07:00:00"

# Only accepted events derive.
EVENT_STATUS_ACCEPTED = "accepted"
```

- [ ] **Step 5: Commit**

```bash
git add sekolahpro/pengaturan/doctype/sekolah/sekolah.json \
        sekolahpro/akademik/doctype/absensi_harian/absensi_harian.json \
        sekolahpro/akademik/doctype/detail_absensi_harian/detail_absensi_harian.json \
        sekolahpro/attendance/derivation_constants.py
git commit -m "feat(absensi): skema derivasi (jam_masuk, sumber_input, status Terlambat)"
```

---

### Task C1: Gate derivation → Absensi Harian (status logic)

**Files:**
- Create: `sekolahpro/attendance/services/derivation_service.py`
- Test: `sekolahpro/attendance/tests/test_derivation_service.py`

- [ ] **Step 1: Write the failing test for the pure status helper**

```python
# sekolahpro/attendance/tests/test_derivation_service.py
"""ABS-004 | spec: 2026-06-07-absensi-phase234-implementation-design.md"""
import frappe  # noqa: F401  (imported by sibling tests; kept for parity)
from sekolahpro.attendance.services.derivation_service import gate_status_for


def test_gate_status_hadir_when_before_jam_masuk():
    # ABS-004 | tapped 06:55, school opens 07:00, no tolerance -> Hadir
    assert gate_status_for("06:55:00", "07:00:00", 0) == "Hadir"


def test_gate_status_terlambat_when_after_jam_masuk():
    assert gate_status_for("07:10:00", "07:00:00", 0) == "Terlambat"


def test_gate_status_hadir_within_tolerance():
    # 07:05 with 10-min tolerance -> still Hadir
    assert gate_status_for("07:05:00", "07:00:00", 10) == "Hadir"


def test_gate_status_terlambat_past_tolerance():
    assert gate_status_for("07:11:00", "07:00:00", 10) == "Terlambat"
```

- [ ] **Step 2: Run test, verify it fails**

Run: `docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --app sekolahpro --module sekolahpro.attendance.tests.test_derivation_service`
Expected: FAIL — `ImportError: cannot import name 'gate_status_for'`.

- [ ] **Step 3: Implement the pure helper**

```python
# sekolahpro/attendance/services/derivation_service.py
"""Derive akademik attendance summaries from raw Attendance Events.

ABS-004. Reuses existing akademik doctypes (decision D1): gate events -> Absensi
Harian, class events -> Absensi Pelajaran. Idempotent; honors manual override.
"""
from datetime import datetime, timedelta

import frappe

from sekolahpro.attendance.derivation_constants import (
    DEFAULT_JAM_MASUK,
    EVENT_STATUS_ACCEPTED,
    STATUS_HADIR,
    STATUS_TERLAMBAT,
    SUMBER_BY_METHOD,
    SUMBER_MANUAL,
    SUMBER_OTOMATIS,
)


def _to_time(value) -> datetime:
    """Parse an HH:MM:SS string (or timedelta from frappe Time) into a datetime on a fixed day."""
    if isinstance(value, timedelta):
        total = int(value.total_seconds())
        h, rem = divmod(total, 3600)
        m, s = divmod(rem, 60)
        return datetime(2000, 1, 1, h, m, s)
    return datetime.strptime(str(value)[:8], "%H:%M:%S").replace(year=2000, month=1, day=1)


def gate_status_for(tapped_time: str, jam_masuk: str, toleransi_menit: int) -> str:
    """Return 'Hadir' if the tap time is at/before jam_masuk + tolerance, else 'Terlambat'.

    tapped_time / jam_masuk: 'HH:MM:SS'. toleransi_menit: grace minutes.
    """
    tapped = _to_time(tapped_time)
    threshold = _to_time(jam_masuk or DEFAULT_JAM_MASUK) + timedelta(minutes=toleransi_menit or 0)
    return STATUS_HADIR if tapped <= threshold else STATUS_TERLAMBAT
```

- [ ] **Step 4: Run test, verify it passes**

Run the same bench command. Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add sekolahpro/attendance/services/derivation_service.py sekolahpro/attendance/tests/test_derivation_service.py
git commit -m "feat(absensi): helper status gate hadir/terlambat"
```

---

### Task C2: siswa→rombel resolution + Absensi Harian upsert

**Files:**
- Modify: `sekolahpro/attendance/services/derivation_service.py`
- Test: `sekolahpro/attendance/tests/test_derivation_service.py`

- [ ] **Step 1: Write the failing integration test**

Add a fixture-backed test. Reuse conftest helpers where present; otherwise create the minimal docs inline.

```python
def test_derive_daily_creates_absensi_harian_hadir(db_transaction_rollback):
    # ABS-004 | gate tap by an active siswa before jam_masuk -> Absensi Harian Detail Hadir
    from sekolahpro.attendance.tests.derivation_fixtures import make_gate_event
    from sekolahpro.attendance.services.derivation_service import derive_summaries

    ev = make_gate_event(tapped_at="2026-06-07 06:50:00", jam_masuk="07:00:00")
    derive_summaries(ev.name)

    harian = frappe.get_all(
        "Absensi Harian",
        filters={"rombel": ev._rombel, "tanggal": "2026-06-07"},
        fields=["name", "sumber_input"],
    )
    assert len(harian) == 1
    assert harian[0].sumber_input == "Otomatis"
    detail = frappe.get_all(
        "Detail Absensi Harian",
        filters={"parent": harian[0].name, "siswa": ev.subject_id},
        fields=["status"],
    )
    assert detail[0].status == "Hadir"
```

Create the fixture helper:

```python
# sekolahpro/attendance/tests/derivation_fixtures.py
"""Test fixtures for derivation_service. ABS-004."""
import frappe


def make_gate_event(*, tapped_at, jam_masuk="07:00:00"):
    """Create a Sekolah, Rombongan Belajar w/ one active siswa, and an accepted gate Attendance Event."""
    sekolah = frappe.get_doc({
        "doctype": "Sekolah", "nama_sekolah": "SDN Derivasi Test",
        "jam_masuk": jam_masuk, "toleransi_terlambat": 0,
    }).insert(ignore_permissions=True)
    siswa = frappe.get_doc({
        "doctype": "Siswa", "nama_lengkap": "Budi Test", "sekolah": sekolah.name,
    }).insert(ignore_permissions=True)
    rombel = frappe.get_doc({
        "doctype": "Rombongan Belajar", "nama_rombel": "6A Test", "sekolah": sekolah.name,
        "anggota": [{"siswa": siswa.name, "status": "Aktif"}],
    }).insert(ignore_permissions=True)
    station = frappe.get_doc({
        "doctype": "Attendance Station", "station_name": "Gate Test", "mode": "gate",
        "sekolah": sekolah.name, "device_fingerprint": frappe.generate_hash(length=12),
    }).insert(ignore_permissions=True)
    ev = frappe.get_doc({
        "doctype": "Attendance Event", "station": station.name,
        "subject_type": "Siswa", "subject_id": siswa.name, "sekolah": sekolah.name,
        "method": "card", "direction": "in", "event_type": "gate",
        "tapped_at": tapped_at, "received_at": tapped_at, "status": "accepted",
    }).insert(ignore_permissions=True)
    ev._rombel = rombel.name  # convenience handle for assertions
    return ev
```

> NOTE before writing this fixture: open `sekolahpro/akademik/doctype/rombongan_belajar/rombongan_belajar.json` and confirm the child-table fieldname for members (the plan assumes `anggota`) and the Rombel name field (`nama_rombel`). Adjust the fixture to the real fieldnames. Also confirm `Siswa` minimal required fields; add any reqd fields the insert complains about.

- [ ] **Step 2: Run test, verify it fails**

Expected: FAIL — `derive_summaries` does not yet resolve/insert (AttributeError or empty result).

- [ ] **Step 3: Implement resolution + upsert + dispatcher stub**

Append to `derivation_service.py`:

```python
def _active_rombel_for_siswa(siswa_id: str):
    """Return the Rombongan Belajar name the siswa is an active member of, or None."""
    rows = frappe.get_all(
        "Anggota Rombel",
        filters={"siswa": siswa_id, "status": "Aktif"},
        fields=["parent"],
        limit=1,
    )
    return rows[0].parent if rows else None


def _upsert_harian(*, rombel: str, tanggal: str, sekolah: str):
    """Find-or-create the Absensi Harian header for (rombel, tanggal). Idempotent."""
    name = frappe.db.get_value("Absensi Harian", {"rombel": rombel, "tanggal": tanggal})
    if name:
        return frappe.get_doc("Absensi Harian", name)
    return frappe.get_doc({
        "doctype": "Absensi Harian", "rombel": rombel, "tanggal": tanggal,
        "sekolah": sekolah, "sumber_input": SUMBER_OTOMATIS,
    }).insert(ignore_permissions=True)


def _derive_daily(ev) -> None:
    """Derive a gate event into Absensi Harian. Skips non-siswa subjects and manual headers."""
    if ev.subject_type != "Siswa":
        return  # gate taps by guru/staff have no daily class row
    rombel = _active_rombel_for_siswa(ev.subject_id)
    if not rombel:
        return
    tanggal = str(ev.tapped_at)[:10]
    header = _upsert_harian(rombel=rombel, tanggal=tanggal, sekolah=ev.sekolah)
    if header.sumber_input == SUMBER_MANUAL:
        return  # override guard: never clobber manually-entered rows
    sekolah = frappe.db.get_value(
        "Sekolah", ev.sekolah, ["jam_masuk", "toleransi_terlambat"], as_dict=True
    ) or {}
    status = gate_status_for(
        str(ev.tapped_at)[11:19],
        sekolah.get("jam_masuk") or DEFAULT_JAM_MASUK,
        sekolah.get("toleransi_terlambat") or 0,
    ) if ev.direction == "in" else STATUS_HADIR
    _upsert_detail_row(header, child_dt="Detail Absensi Harian",
                       siswa=ev.subject_id, fields={"status": status})
    header.sumber_input = SUMBER_OTOMATIS
    header.save(ignore_permissions=True)


def _upsert_detail_row(header, *, child_dt: str, siswa: str, fields: dict) -> None:
    """Idempotently set a child row for `siswa` on `header.detail` to `fields`."""
    for row in header.detail:
        if row.siswa == siswa:
            row.update(fields)
            return
    header.append("detail", {"siswa": siswa, **fields})


def derive_summaries(event_name: str) -> None:
    """Entry point (enqueued on Attendance Event.after_insert). Idempotent."""
    ev = frappe.get_doc("Attendance Event", event_name)
    if ev.status != EVENT_STATUS_ACCEPTED:
        return
    if ev.event_type == "gate":
        _derive_daily(ev)
    elif ev.event_type == "class":
        _derive_class(ev)  # defined in Task C3


def _derive_class(ev) -> None:  # placeholder, completed in Task C3
    return
```

- [ ] **Step 4: Run test, verify it passes** (1 new test green; status helper tests still green).

- [ ] **Step 5: Commit**

```bash
git add sekolahpro/attendance/services/derivation_service.py \
        sekolahpro/attendance/tests/test_derivation_service.py \
        sekolahpro/attendance/tests/derivation_fixtures.py
git commit -m "feat(absensi): derivasi gate -> Absensi Harian (siswa->rombel, upsert)"
```

---

### Task C3: Class derivation → Absensi Pelajaran

**Files:**
- Modify: `sekolahpro/attendance/services/derivation_service.py`
- Modify: `sekolahpro/attendance/tests/test_derivation_service.py`, `derivation_fixtures.py`

- [ ] **Step 1: Write the failing test**

```python
def test_derive_class_creates_absensi_pelajaran_hadir(db_transaction_rollback):
    # ABS-004 | class tap (qr) -> Absensi Pelajaran Detail Hadir + timestamp + sumber_input QR
    from sekolahpro.attendance.tests.derivation_fixtures import make_class_event
    from sekolahpro.attendance.services.derivation_service import derive_summaries

    ev = make_class_event(tapped_at="2026-06-07 08:05:00", method="qr")
    derive_summaries(ev.name)

    pelajaran = frappe.get_all(
        "Absensi Pelajaran",
        filters={"slot": ev.jadwal_pelajaran, "tanggal": "2026-06-07"},
        fields=["name", "sumber_input", "rombel", "mata_pelajaran", "guru"],
    )
    assert len(pelajaran) == 1
    assert pelajaran[0].sumber_input == "QR"
    detail = frappe.get_all(
        "Detail Absensi Pelajaran",
        filters={"parent": pelajaran[0].name, "siswa": ev.subject_id},
        fields=["status"],
    )
    assert detail[0].status == "Hadir"
```

Add fixture `make_class_event` (creates Jadwal Pelajaran with one Slot Jadwal, an accepted `class` event whose `jadwal_pelajaran` = the slot child name):

```python
def make_class_event(*, tapped_at, method="qr"):
    sekolah = frappe.get_doc({"doctype": "Sekolah", "nama_sekolah": "SMP Kelas Test"}).insert(ignore_permissions=True)
    siswa = frappe.get_doc({"doctype": "Siswa", "nama_lengkap": "Siti Test", "sekolah": sekolah.name}).insert(ignore_permissions=True)
    rombel = frappe.get_doc({"doctype": "Rombongan Belajar", "nama_rombel": "7B Test", "sekolah": sekolah.name,
                             "anggota": [{"siswa": siswa.name, "status": "Aktif"}]}).insert(ignore_permissions=True)
    mapel = frappe.get_doc({"doctype": "Mata Pelajaran", "nama_mapel": "Matematika Test", "sekolah": sekolah.name}).insert(ignore_permissions=True)
    guru = frappe.get_doc({"doctype": "Pegawai", "nama_lengkap": "Pak Guru Test", "sekolah": sekolah.name}).insert(ignore_permissions=True)
    jadwal = frappe.get_doc({"doctype": "Jadwal Pelajaran", "rombel": rombel.name, "sekolah": sekolah.name, "is_aktif": 1,
                             "slots": [{"hari": "Senin", "jam_mulai": "08:00:00", "jam_selesai": "09:00:00",
                                        "mata_pelajaran": mapel.name, "guru": guru.name}]}).insert(ignore_permissions=True)
    slot_name = jadwal.slots[0].name
    station = frappe.get_doc({"doctype": "Attendance Station", "station_name": "Kelas Test", "mode": "classroom",
                             "sekolah": sekolah.name, "device_fingerprint": frappe.generate_hash(length=12)}).insert(ignore_permissions=True)
    ev = frappe.get_doc({"doctype": "Attendance Event", "station": station.name, "subject_type": "Siswa",
                         "subject_id": siswa.name, "sekolah": sekolah.name, "method": method, "direction": "in",
                         "event_type": "class", "tapped_at": tapped_at, "received_at": tapped_at,
                         "status": "accepted", "jadwal_pelajaran": slot_name}).insert(ignore_permissions=True)
    return ev
```

> NOTE: confirm `Mata Pelajaran` name field (`nama_mapel`?) and `Pegawai` required fields before running; adjust inserts to satisfy reqd validation.

- [ ] **Step 2: Run test, verify it fails** (Absensi Pelajaran not created — `_derive_class` is a stub).

- [ ] **Step 3: Implement `_derive_class`** (replace the stub)

```python
def _upsert_pelajaran(*, slot_name: str, tanggal: str):
    """Find-or-create Absensi Pelajaran header for (slot, tanggal) from a Slot Jadwal child."""
    name = frappe.db.get_value("Absensi Pelajaran", {"slot": slot_name, "tanggal": tanggal})
    if name:
        return frappe.get_doc("Absensi Pelajaran", name)
    slot = frappe.get_doc("Slot Jadwal", slot_name)
    jadwal = frappe.get_doc("Jadwal Pelajaran", slot.parent)
    return frappe.get_doc({
        "doctype": "Absensi Pelajaran", "rombel": jadwal.rombel,
        "mata_pelajaran": slot.mata_pelajaran, "guru": slot.guru, "slot": slot_name,
        "tanggal": tanggal, "sekolah": jadwal.sekolah,
    }).insert(ignore_permissions=True)


def _derive_class(ev) -> None:
    """Derive a class event into Absensi Pelajaran. Skips manual headers."""
    if ev.subject_type != "Siswa" or not ev.jadwal_pelajaran:
        return
    tanggal = str(ev.tapped_at)[:10]
    header = _upsert_pelajaran(slot_name=ev.jadwal_pelajaran, tanggal=tanggal)
    if header.sumber_input == SUMBER_MANUAL:
        return
    _upsert_detail_row(header, child_dt="Detail Absensi Pelajaran", siswa=ev.subject_id,
                       fields={"status": STATUS_HADIR, "timestamp": ev.tapped_at})
    header.sumber_input = SUMBER_BY_METHOD.get(ev.method, "QR")
    header.save(ignore_permissions=True)
```

> Note: a freshly-inserted Absensi Pelajaran has `sumber_input` default `Manual`; the guard `if header.sumber_input == SUMBER_MANUAL: return` would wrongly skip a brand-new derived header. Fix: in `_upsert_pelajaran`, create with `sumber_input` left default, and in `_derive_class` only treat it as manual when the header **already existed** before this call. Implement by returning a `(header, created)` tuple from `_upsert_pelajaran` and skipping only when `not created and header.sumber_input == SUMBER_MANUAL`. Apply the same `created` pattern to `_upsert_harian`/`_derive_daily`.

- [ ] **Step 4: Run tests, verify pass** (gate + class + helpers all green).

- [ ] **Step 5: Commit**

```bash
git add sekolahpro/attendance/services/derivation_service.py \
        sekolahpro/attendance/tests/test_derivation_service.py \
        sekolahpro/attendance/tests/derivation_fixtures.py
git commit -m "feat(absensi): derivasi class -> Absensi Pelajaran (slot->rombel/mapel/guru)"
```

---

### Task C4: Idempotency + manual-override guard tests

**Files:** Modify `test_derivation_service.py`.

- [ ] **Step 1: Write failing tests**

```python
def test_derive_is_idempotent(db_transaction_rollback):
    # ABS-004 | running twice on same event = no duplicate detail row
    from sekolahpro.attendance.tests.derivation_fixtures import make_gate_event
    from sekolahpro.attendance.services.derivation_service import derive_summaries
    ev = make_gate_event(tapped_at="2026-06-07 06:50:00")
    derive_summaries(ev.name)
    derive_summaries(ev.name)
    header = frappe.db.get_value("Absensi Harian", {"rombel": ev._rombel, "tanggal": "2026-06-07"})
    rows = frappe.get_all("Detail Absensi Harian", filters={"parent": header, "siswa": ev.subject_id})
    assert len(rows) == 1


def test_manual_header_not_overwritten(db_transaction_rollback):
    # ABS-004 | a manual Absensi Harian header is left untouched by derivation
    from sekolahpro.attendance.tests.derivation_fixtures import make_gate_event
    from sekolahpro.attendance.services.derivation_service import derive_summaries
    ev = make_gate_event(tapped_at="2026-06-07 06:50:00")
    frappe.get_doc({"doctype": "Absensi Harian", "rombel": ev._rombel, "tanggal": "2026-06-07",
                    "sekolah": ev.sekolah, "sumber_input": "Manual",
                    "detail": [{"siswa": ev.subject_id, "status": "Izin"}]}).insert(ignore_permissions=True)
    derive_summaries(ev.name)
    header = frappe.db.get_value("Absensi Harian", {"rombel": ev._rombel, "tanggal": "2026-06-07"})
    row = frappe.get_all("Detail Absensi Harian", filters={"parent": header, "siswa": ev.subject_id}, fields=["status"])
    assert row[0].status == "Izin"  # unchanged
```

- [ ] **Step 2: Run, verify pass** (the C2/C3 `created` guard already satisfies these — if a test fails, fix the guard, not the test).

- [ ] **Step 3: Commit**

```bash
git add sekolahpro/attendance/tests/test_derivation_service.py
git commit -m "test(absensi): idempotensi + guard override manual derivasi"
```

---

### Task C5: Reconciliation (light, D3)

**Files:** Modify `derivation_service.py`, `test_derivation_service.py`.

- [ ] **Step 1: Write failing test**

```python
def test_reconcile_marks_no_in_rows_alpha(db_transaction_rollback):
    # ABS-004 | a derived (Otomatis) Absensi Harian detail with no status set -> Alpha after reconcile
    from sekolahpro.attendance.tests.derivation_fixtures import make_gate_event
    from sekolahpro.attendance.services.derivation_service import reconcile_daily
    ev = make_gate_event(tapped_at="2026-06-07 06:50:00")
    # create a derived header with a blank-status detail (simulating an enrolled student who never tapped)
    frappe.get_doc({"doctype": "Absensi Harian", "rombel": ev._rombel, "tanggal": "2026-06-07",
                    "sekolah": ev.sekolah, "sumber_input": "Otomatis",
                    "detail": [{"siswa": ev.subject_id, "status": ""}]}).insert(ignore_permissions=True)
    reconcile_daily("2026-06-07")
    header = frappe.db.get_value("Absensi Harian", {"rombel": ev._rombel, "tanggal": "2026-06-07"})
    row = frappe.get_all("Detail Absensi Harian", filters={"parent": header, "siswa": ev.subject_id}, fields=["status"])
    assert row[0].status == "Alpha"
```

- [ ] **Step 2: Run, verify fails** (`reconcile_daily` undefined).

- [ ] **Step 3: Implement**

```python
def reconcile_daily(tanggal: str | None = None) -> None:
    """23:00 cron: finalize derived (Otomatis) Absensi Harian rows with no status -> Alpha.

    Light reconciliation (D3): only touches existing auto-derived headers; never
    creates rows for students who have no detail entry, never touches Manual headers.
    """
    tanggal = tanggal or frappe.utils.today()
    headers = frappe.get_all(
        "Absensi Harian",
        filters={"tanggal": tanggal, "sumber_input": SUMBER_OTOMATIS},
        fields=["name"],
    )
    for h in headers:
        doc = frappe.get_doc("Absensi Harian", h.name)
        changed = False
        for row in doc.detail:
            if not row.status:
                row.status = STATUS_ALPHA
                changed = True
        if changed:
            doc.save(ignore_permissions=True)
```

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Commit**

```bash
git add sekolahpro/attendance/services/derivation_service.py sekolahpro/attendance/tests/test_derivation_service.py
git commit -m "feat(absensi): rekonsiliasi harian 23:00 (no-in -> Alpha, light)"
```

---

### Task C6: Wire hooks (after_insert enqueue + cron)

**Files:** Modify `sekolahpro/hooks.py`.

- [ ] **Step 1: Add doc_events for Attendance Event**

Find the `doc_events = { ... }` dict. Add (or merge if an `"Attendance Event"` key exists):

```python
    "Attendance Event": {
        "after_insert": "sekolahpro.attendance.services.derivation_service.enqueue_derive",
    },
```

- [ ] **Step 2: Add the enqueue wrapper**

Append to `derivation_service.py`:

```python
def enqueue_derive(doc, method=None) -> None:
    """doc_events hook: enqueue derivation as a background job (idempotent, retry-safe)."""
    frappe.enqueue(
        "sekolahpro.attendance.services.derivation_service.derive_summaries",
        queue="short", event_name=doc.name,
    )
```

- [ ] **Step 3: Add scheduler cron**

In `hooks.py` `scheduler_events`, under a `"cron"` key (create if absent):

```python
    "cron": {
        "0 23 * * *": [
            "sekolahpro.attendance.services.derivation_service.reconcile_daily",
        ],
    },
```

> If `scheduler_events` already has a `"cron"` dict, add the `"0 23 * * *"` entry to it rather than redefining.

- [ ] **Step 4: Commit**

```bash
git add sekolahpro/hooks.py sekolahpro/attendance/services/derivation_service.py
git commit -m "feat(absensi): wire after_insert derivasi + cron rekonsiliasi 23:00"
```

---

### Task C7: Migrate, full test run, fixtures, docs, merge

- [ ] **Step 1: Apply schema + run module tests in docker bench**

```bash
docker ps   # confirm backend container name
docker exec frappe-backend-1 bench --site sekolahpro.localhost migrate
docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --app sekolahpro --module sekolahpro.attendance.tests.test_derivation_service
```
Expected: all derivation tests pass. Then run the existing attendance suite to confirm no regression:
```bash
docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --app sekolahpro --module sekolahpro.attendance.tests.test_tap_service
```

- [ ] **Step 2: Export Sekolah custom-field fixture if applicable**

If `jam_masuk`/`toleransi_terlambat`/`sumber_input` were added as schema fields in the doctype JSON (not Custom Fields), no fixture export is needed — they ship with the doctype. If the repo manages them as Custom Field fixtures, run `bench export-fixtures` and stage the changed fixture file. Confirm which by checking whether other Sekolah config fields live in the JSON or in `fixtures/custom_field.json`.

- [ ] **Step 3: Update backend docs** (if the BE repo has domain docs for attendance, note the derivation entrypoint + cron).

- [ ] **Step 4: Merge to BE main**

```bash
git checkout main && git pull && git merge --no-ff feat/absensi-derivation -m "feat(absensi): derivasi event -> akademik + rekonsiliasi (ABS-004)"
git push origin main
git branch -d feat/absensi-derivation
```

> Use the temp-worktree merge recipe (memory `temp-worktree-merge-when-checkout-busy`) if the BE main checkout is occupied by another session. Push via PR if direct push to main is blocked (memory `direct-push-main-blocked-use-pr`).

---

## PHASE B — Student dynamic-QR screen (repo `sekolahpro-web`, branch `feat/absensi-student-qr`)

> Worktree off web `origin/main`. Symlink node_modules + copy `routeTree.gen.ts` (memory `worktree-typecheck-recipe`), or run `pnpm install` in the worktree.

### Task B0: Add the `qrcode` dependency

**Files:** Modify `apps/student/package.json`.

- [ ] **Step 1: Add deps**

Add to `dependencies`: `"qrcode": "^1.5.4"`. Add to `devDependencies`: `"@types/qrcode": "^1.5.5"`.

- [ ] **Step 2: Install**

Run: `pnpm install` (from repo root). Verify `apps/student/node_modules/qrcode` resolves.

- [ ] **Step 3: Commit**

```bash
git add apps/student/package.json pnpm-lock.yaml
git commit -m "chore(student): tambah dependency qrcode untuk kartu QR"
```

### Task B1: QR route (mint loop + render)

**Files:**
- Create: `apps/student/src/routes/qr.tsx`
- Create: `apps/student/src/routes/__tests__/qr.test.tsx`

- [ ] **Step 1: Write the failing component test**

```tsx
// apps/student/src/routes/__tests__/qr.test.tsx
// ABS-003 | spec: 2026-06-07-absensi-phase234-implementation-design.md
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QrCardView } from "../qr";

afterEach(() => cleanup());

describe("QrCardView", () => {
  it("mints a token on mount and renders a QR canvas", async () => {
    const mint = vi.fn().mockResolvedValue({ token: "header.payload.sig", exp: 9999999999 });
    render(<QrCardView mintQr={mint} refreshMs={60_000} />);
    await waitFor(() => expect(mint).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("qr-canvas")).toBeInTheDocument();
  });

  it("shows an error message when minting fails", async () => {
    const mint = vi.fn().mockRejectedValue(new Error("offline"));
    render(<QrCardView mintQr={mint} refreshMs={60_000} />);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/gagal/i));
  });
});
```

- [ ] **Step 2: Run, verify fails**

Run: `pnpm --filter @sekolahpro/app-student test`
Expected: FAIL — cannot import `QrCardView`.

- [ ] **Step 3: Implement the view (pure, prop-injected) + route wrapper**

```tsx
// apps/student/src/routes/qr.tsx
// ABS-003: student dynamic QR. Mints a short-lived JWT every refreshMs and renders it as a QR.
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Alert, PageHeader, SectionCard } from "@sekolahpro/ui";
import { frappeFetch } from "@sekolahpro/api-client";

type MintResult = { token: string; exp: number };
type MintFn = () => Promise<MintResult>;

const DEFAULT_REFRESH_MS = 25_000; // re-mint before the 30s JWT TTL expires

/** Pure, testable view. `mintQr` is injected so tests can mock the network. */
export function QrCardView({ mintQr, refreshMs = DEFAULT_REFRESH_MS }: { mintQr: MintFn; refreshMs?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function tick() {
      try {
        const { token } = await mintQr();
        if (!active || !canvasRef.current) return;
        await QRCode.toCanvas(canvasRef.current, token, { width: 256 });
        setError(null);
      } catch {
        if (active) setError("Gagal membuat kode QR. Coba lagi.");
      }
    }
    void tick();
    const id = setInterval(tick, refreshMs);
    return () => { active = false; clearInterval(id); };
  }, [mintQr, refreshMs]);

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Kartu" title="Kartu QR Absensi"
        description="Tunjukkan kode ini ke stasiun absensi. Kode berganti otomatis." />
      <SectionCard title="Kode QR Kamu" padded>
        {error && <Alert role="alert" variant="error">{error}</Alert>}
        <div className="flex justify-center py-4">
          <canvas ref={canvasRef} data-testid="qr-canvas" aria-label="Kode QR absensi" />
        </div>
      </SectionCard>
    </div>
  );
}

function QrRoute() {
  const mintQr: MintFn = () => frappeFetch<MintResult>("sekolahpro.attendance.api.qr.mint_qr", {});
  return <QrCardView mintQr={mintQr} />;
}

export const Route = createFileRoute("/qr")({ component: QrRoute });
```

> Confirm `Alert` accepts a `variant`/`role` prop in `@sekolahpro/ui` (check its export signature); if not, use the available error styling and keep `role="alert"` on a wrapping element so the test's `getByRole("alert")` passes.

- [ ] **Step 4: Generate routes + run test**

```bash
pnpm --filter @sekolahpro/app-student generate
pnpm --filter @sekolahpro/app-student test
```
Expected: both QR tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/student/src/routes/qr.tsx apps/student/src/routes/__tests__/qr.test.tsx
git commit -m "feat(student): layar Kartu QR absensi (mint loop + render)"
```

### Task B2: Sidebar nav entry

**Files:** Modify `apps/student/src/routes/__root.tsx`.

- [ ] **Step 1:** Add a nav item to the existing sidebar sections array, mirroring the existing `mk(...)` entries:

```tsx
mk("/qr", "Kartu QR", <IconId />),
```
Ensure `IconId` is imported from `@sekolahpro/ui` (it is exported per the UI package).

- [ ] **Step 2:** Run typecheck + tests.

```bash
pnpm --filter @sekolahpro/app-student typecheck
pnpm --filter @sekolahpro/app-student test
```

- [ ] **Step 3: Commit**

```bash
git add apps/student/src/routes/__root.tsx
git commit -m "feat(student): tambah menu Kartu QR di sidebar"
```

### Task B3: Verify + merge

- [ ] **Step 1:** `pnpm --filter @sekolahpro/app-student typecheck && pnpm --filter @sekolahpro/app-student lint && pnpm --filter @sekolahpro/app-student test && pnpm --filter @sekolahpro/app-student build` — all green.
- [ ] **Step 2:** Merge `feat/absensi-student-qr` → main (`--no-ff`), push (PR if blocked), delete branch.

---

## PHASE A — Attendance station PWA (repo `sekolahpro-web`, branch `feat/absensi-pwa-station`)

### Task A0: Scaffold the package

**Files (create):**
- `apps/attendance_station/package.json`
- `apps/attendance_station/vite.config.ts`
- `apps/attendance_station/tsconfig.json`
- `apps/attendance_station/index.html`
- `apps/attendance_station/src/main.tsx`
- `apps/attendance_station/src/styles.css`
- `apps/attendance_station/src/test-setup.ts`
- `apps/attendance_station/src/routes/__root.tsx`
- `apps/attendance_station/src/routes/index.tsx`
- `apps/attendance_station/public/pwa-192.png`, `pwa-512.png` (copy from `apps/merchant/public`)

- [ ] **Step 1: package.json** (mirror `apps/student` + add `@noble/curves`, `@noble/hashes`, `@zxing/browser`, `vite-plugin-pwa`)

```json
{
  "name": "@sekolahpro/app-attendance-station",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "generate": "tsr generate",
    "build": "tsc --noEmit && vite build",
    "lint": "ESLINT_USE_FLAT_CONFIG=true eslint 'src/**/*.{ts,tsx}'",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --passWithNoTests"
  },
  "dependencies": {
    "@noble/curves": "^1.6.0",
    "@noble/hashes": "^1.5.0",
    "@sekolahpro/api-client": "workspace:*",
    "@sekolahpro/auth": "workspace:*",
    "@sekolahpro/config": "workspace:*",
    "@sekolahpro/ui": "workspace:*",
    "@tanstack/react-query": "^5.51.0",
    "@tanstack/react-router": "^1.45.0",
    "@zxing/browser": "^0.1.5",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@sekolahpro/tsconfig": "workspace:*",
    "@tanstack/router-vite-plugin": "^1.45.0",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "jsdom": "^24.0.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "vite": "^5.3.0",
    "vite-plugin-pwa": "^0.20.0",
    "vitest": "^1.6.0"
  }
}
```

> `react-dom` + `@types/react-dom` ARE declared above — required because `@sekolahpro/ui` Modal imports `createPortal` (memory `ui-consumer-needs-react-dom`); omitting them passes locally but fails strict CI.

- [ ] **Step 2: vite.config.ts** (copy `apps/merchant/vite.config.ts`; port 5185; same `/api` + `/assets` proxy as `apps/school`; add `test` block with `globals:true, environment:"jsdom", setupFiles:["./src/test-setup.ts"]`).

- [ ] **Step 3: tsconfig.json** = `{ "extends": "@sekolahpro/tsconfig/react.json", "include": ["src"] }`.

- [ ] **Step 4: test-setup.ts** = `import "@testing-library/jest-dom/vitest";`.

- [ ] **Step 5: main.tsx / index.html / styles.css / __root.tsx / index.tsx** — copy the minimal shells from `apps/student` (main.tsx with `configure({ baseUrl })`, RouterProvider; `__root.tsx` with AppShell + a simple guard; `index.tsx` a placeholder home). Tailwind `styles.css` same `@tailwind` directives as student.

- [ ] **Step 6: Install + verify build**

```bash
pnpm install
pnpm --filter @sekolahpro/app-attendance-station generate
pnpm --filter @sekolahpro/app-attendance-station build
```
Expected: clean build.

- [ ] **Step 7: Commit**

```bash
git add apps/attendance_station pnpm-lock.yaml
git commit -m "chore(attendance-station): scaffold paket PWA"
```

### Task A1: `lib/time.ts` — clock-skew

**Files:** Create `src/lib/time.ts` + `src/lib/__tests__/time.test.ts`.

- [ ] **Step 1: Failing test**

```ts
import { describe, expect, it } from "vitest";
import { withinSkew } from "../time";

describe("withinSkew", () => {
  it("accepts a timestamp inside the tolerance", () => {
    expect(withinSkew(1000, 1030, 60)).toBe(true);  // 30s drift, 60s tol
  });
  it("rejects a timestamp beyond the tolerance", () => {
    expect(withinSkew(1000, 1100, 60)).toBe(false); // 100s drift
  });
});
```

- [ ] **Step 2: Run, fail.** `pnpm --filter @sekolahpro/app-attendance-station test`

- [ ] **Step 3: Implement**

```ts
// src/lib/time.ts
/** True when |a - b| (seconds) is within tolerance. Used for JWT exp skew checks. */
export function withinSkew(a: number, b: number, toleranceSec: number): boolean {
  return Math.abs(a - b) <= toleranceSec;
}
```

- [ ] **Step 4: Pass. Step 5: Commit** `feat(attendance-station): util clock-skew`.

### Task A2: `lib/jwt.ts` — Ed25519 verify

**Files:** Create `src/lib/jwt.ts` + test.

- [ ] **Step 1: Failing test** — sign a token in the test with `@noble/curves/ed25519`, verify it passes; tamper the signature, verify it fails; expired token fails.

```ts
import { describe, expect, it } from "vitest";
import { ed25519 } from "@noble/curves/ed25519";
import { verifyQrToken } from "../jwt";

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function makeToken(claims: object, priv: Uint8Array): string {
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: "EdDSA", kid: "k1" })));
  const payload = b64url(new TextEncoder().encode(JSON.stringify(claims)));
  const signing = `${header}.${payload}`;
  const sig = ed25519.sign(new TextEncoder().encode(signing), priv);
  return `${signing}.${b64url(sig)}`;
}

describe("verifyQrToken", () => {
  const priv = ed25519.utils.randomPrivateKey();
  const pub = ed25519.getPublicKey(priv);
  const jwks = { k1: pub };
  const now = 1_000_000;

  it("accepts a valid, unexpired token", () => {
    const t = makeToken({ sub: "siswa:STD-1", exp: now + 20, sch: "SEK-1", jti: "j1" }, priv);
    expect(verifyQrToken(t, jwks, now, 60)).toEqual(expect.objectContaining({ sub: "siswa:STD-1" }));
  });
  it("rejects a tampered signature", () => {
    const t = makeToken({ sub: "siswa:STD-1", exp: now + 20, sch: "SEK-1", jti: "j1" }, priv);
    expect(() => verifyQrToken(t.slice(0, -2) + "xx", jwks, now, 60)).toThrow();
  });
  it("rejects an expired token", () => {
    const t = makeToken({ sub: "siswa:STD-1", exp: now - 120, sch: "SEK-1", jti: "j1" }, priv);
    expect(() => verifyQrToken(t, jwks, now, 60)).toThrow(/expired/i);
  });
});
```

- [ ] **Step 2: Run, fail.**

- [ ] **Step 3: Implement**

```ts
// src/lib/jwt.ts
// Local Ed25519 QR-token verification. No network, no storage (per spec boundaries).
import { ed25519 } from "@noble/curves/ed25519";
import { withinSkew } from "./time";

export type Claims = { sub: string; exp: number; sch: string; jti: string; [k: string]: unknown };
type Jwks = Record<string, Uint8Array>; // kid -> raw public key

function fromB64url(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=");
  return Uint8Array.from(atob(pad), (c) => c.charCodeAt(0));
}

/** Verify signature + exp (with skew). Throws on any failure. Returns decoded claims. */
export function verifyQrToken(token: string, jwks: Jwks, nowSec: number, skewSec: number): Claims {
  const [h, p, s] = token.split(".");
  if (!h || !p || !s) throw new Error("malformed token");
  const header = JSON.parse(new TextDecoder().decode(fromB64url(h))) as { kid?: string };
  const pub = jwks[header.kid ?? "k1"];
  if (!pub) throw new Error("unknown kid");
  const ok = ed25519.verify(fromB64url(s), new TextEncoder().encode(`${h}.${p}`), pub);
  if (!ok) throw new Error("invalid signature");
  const claims = JSON.parse(new TextDecoder().decode(fromB64url(p))) as Claims;
  if (!withinSkew(claims.exp, nowSec, skewSec) && claims.exp < nowSec) throw new Error("token expired");
  return claims;
}
```

- [ ] **Step 4: Pass. Step 5: Commit** `feat(attendance-station): verifikasi token QR Ed25519`.

### Task A3: `lib/tapHandler.ts` — dedup + direction

**Files:** Create `src/lib/tapHandler.ts` + test.

- [ ] **Step 1: Failing test**

```ts
import { describe, expect, it } from "vitest";
import { isDuplicate, nextDirection } from "../tapHandler";

describe("tapHandler", () => {
  it("flags same subject within 5s as duplicate", () => {
    expect(isDuplicate({ subjectId: "S1", at: 1000 }, { subjectId: "S1", at: 1003 }, 5)).toBe(true);
  });
  it("allows same subject after the window", () => {
    expect(isDuplicate({ subjectId: "S1", at: 1000 }, { subjectId: "S1", at: 1010 }, 5)).toBe(false);
  });
  it("gate toggles in->out from last direction", () => {
    expect(nextDirection("gate", "in")).toBe("out");
    expect(nextDirection("gate", "out")).toBe("in");
    expect(nextDirection("gate", null)).toBe("in");
  });
  it("classroom and event are always in", () => {
    expect(nextDirection("classroom", "in")).toBe("in");
    expect(nextDirection("event", "out")).toBe("in");
  });
});
```

- [ ] **Step 2: Run, fail. Step 3: Implement**

```ts
// src/lib/tapHandler.ts
// Pure tap rules: anti-spam debounce + direction inference. Knows nothing about input source.
type Tap = { subjectId: string; at: number }; // at = epoch seconds
type Mode = "gate" | "classroom" | "event";
type Direction = "in" | "out";

/** Same subject re-tapped within `windowSec` on the same station = duplicate (ignore). */
export function isDuplicate(prev: Tap, next: Tap, windowSec: number): boolean {
  return prev.subjectId === next.subjectId && next.at - prev.at <= windowSec;
}

/** Direction for the next tap given station mode + the subject's last gate direction today. */
export function nextDirection(mode: Mode, last: Direction | null): Direction {
  if (mode !== "gate") return "in";
  return last === "in" ? "out" : "in";
}
```

- [ ] **Step 4: Pass. Step 5: Commit** `feat(attendance-station): aturan tap (dedup + arah)`.

### Task A4: `lib/api.ts` — station client

**Files:** Create `src/lib/api.ts` + test (mock global `fetch`).

- [ ] **Step 1: Failing test** — assert `recordTap` POSTs to `/api/method/sekolahpro.attendance.api.station.record_tap` with the api_key + taps and returns `results`.

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { createStationClient } from "../api";

afterEach(() => vi.restoreAllMocks());

describe("station client", () => {
  it("records a tap batch", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ message: { results: [{ client_nonce: "n1", status: "accepted" }] } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const client = createStationClient({ baseUrl: "", apiKey: "KEY" });
    const res = await client.recordTap([{ client_nonce: "n1", method: "card", identifier: "UID1", direction: "in", event_type: "gate", tapped_at: 1000 }]);
    expect(res.results[0].status).toBe("accepted");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("sekolahpro.attendance.api.station.record_tap"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});
```

- [ ] **Step 2: Run, fail. Step 3: Implement** a small typed client wrapping `fetch` (POST JSON, unwrap `message`). Methods: `recordTap(taps)`, `heartbeat()`, `stationConfig()`, `cardsDelta(since)`, `jwks()`. Include `api_key` in each body.

- [ ] **Step 4: Pass. Step 5: Commit** `feat(attendance-station): klien API stasiun`.

### Task A5: `lib/cardCache.ts` — uid→subject snapshot

**Files:** Create `src/lib/cardCache.ts` + test (localStorage-backed; inject a storage shim).

- [ ] **Step 1: Failing test** — `put`/`get` a card mapping; `get` miss returns null; survives via injected storage.
- [ ] **Step 2-4:** Implement a `CardCache` over an injected `Storage`-like interface (`getItem`/`setItem`), serializing a `{uid: {subjectType, subjectId, name, photo}}` map. Test with an in-memory shim.
- [ ] **Step 5: Commit** `feat(attendance-station): cache snapshot kartu`.

### Task A6: `features/pairing` — claim flow

**Files:** Create `src/features/pairing/claim.ts` + test.

- [ ] **Step 1: Failing test** — `claimPairing(code, fingerprint, pubkey, client)` calls the client, returns `{stationId, apiKey}`, and persists apiKey via injected storage.
- [ ] **Step 2-4:** Implement; `client.claim` wraps `frappeFetch("sekolahpro.attendance.api.pairing.claim_pairing", {...})`.
- [ ] **Step 5: Commit** `feat(attendance-station): alur pairing claim`.

### Task A7: Screens (component tests)

**Files:** Create `src/routes/pair.tsx`, `src/routes/login.tsx`, `src/routes/station.tsx` + co-located tests.

- [ ] **pair.tsx**: form with an 8-char code input → calls injected `onPair`; test asserts submit calls it with the trimmed code and shows an error on rejection.
- [ ] **station.tsx**: presentational tap-confirmation — given a `lastTap={name, photo, direction}` prop renders name + photo + `MASUK`/`PULANG`; test asserts the label maps from direction.
- [ ] **login.tsx**: teacher login form (reuse `@sekolahpro/auth` `login`); test asserts the form calls the injected login fn.
- Each screen splits a pure presentational view (prop-injected, tested) from a thin route wrapper (wires real client/auth), mirroring `QrCardView` in Phase B.
- [ ] Commit each screen separately: `feat(attendance-station): layar pair|station|login`.

### Task A8: Thin hardware adapters (manual-tested, typecheck-only)

**Files:** Create `src/features/card/hidListener.ts`, `src/features/qr/scanner.tsx`.

- [ ] **hidListener.ts**: attach a keydown listener that accumulates fast keystrokes (inter-key < 50ms) into a UID, fires `onUid` on Enter. Export a pure `classifyKeystrokeTiming(deltas)` helper and unit-test ONLY that helper (the DOM listener is manual-tested).
- [ ] **scanner.tsx**: `@zxing/browser` `BrowserQRCodeReader` decode-from-video → on decode call injected `onToken`. No unit test (camera hardware); typecheck only. Add a one-line comment documenting manual test steps.
- [ ] Commit: `feat(attendance-station): adapter HID + scanner QR (thin)`.

### Task A9: Verify + merge

- [ ] **Step 1:** `pnpm --filter @sekolahpro/app-attendance-station typecheck && lint && test && build` — all green. Also run root `pnpm test` to confirm no cross-package breakage (CI runs all via Turbo).
- [ ] **Step 2:** Update `docs/domains/absensi/README.html` (derivation path + station PWA exists) and `docs/implementation-tracker.md` (ABS-002/003 → Done; ABS-004 → Done after BE bench green) + ADR impl-status note. Commit `docs(absensi): tracker + README fase 2/3/4`.
- [ ] **Step 3:** Merge `feat/absensi-pwa-station` → main (`--no-ff`), push (PR if blocked), delete branch + worktree.

---

## Self-review notes (author)

- **Spec coverage:** D1 → C1-C3; D2 → C0/C1; D3 → C5; ABS-002 → A0-A8; ABS-003 → B + A2/A7; ABS-004 → C. ✅
- **Open verification points flagged inline** (not placeholders — real reconnaissance the implementer must do against live doctype JSON): Rombongan Belajar member child fieldname, Mata Pelajaran/Pegawai/Siswa reqd fields, `@sekolahpro/ui` `Alert` prop signature, whether Sekolah config fields are JSON-schema vs Custom Field fixtures. Each has a concrete fallback instruction.
- **Type consistency:** `created` tuple pattern applied to both `_upsert_harian` and `_upsert_pelajaran` (Task C3 note). `derive_summaries(event_name)` / `enqueue_derive(doc)` names consistent across C2/C3/C6. `QrCardView`/`verifyQrToken`/`nextDirection`/`isDuplicate` names stable across tasks. ✅
