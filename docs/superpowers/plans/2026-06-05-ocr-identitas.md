# OCR Identitas (KTP/KK/SIM) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let staff/applicants snap a KTP/KK/SIM photo and auto-fill person forms (siswa, wali, pegawai, PPDB calon siswa, pickup person) via on-prem Tesseract OCR, with user review before save.

**Architecture:** Backend (`sekolahpro` app) gets a new `OCR` module: pure engine utilities (preprocess/tesseract/parser), a tenant-scoped `Pindai Identitas` doctype that stores the private image + consent + 30-day retention and runs OCR in its controller, and two thin whitelist endpoints (authed + guest). Frontend gets an API-agnostic `<IdScanField>` in `@sekolahpro/ui` plus per-form mapping functions wired into each app.

**Tech Stack:** Frappe (Python), Tesseract + `tesseract-ocr-ind`, `pytesseract`, `Pillow`; React + TypeScript, pnpm monorepo, `@sekolahpro/ui`, vitest, TanStack.

**Repos / worktrees:**
- Backend: `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro` (branch `feat/ocr-identitas` off origin/main — create at execution).
- Frontend: worktree `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web/.worktrees/ocr-identitas` (branch `feat/ocr-identitas`, already created).

**Test commands (memory: bench runs in docker):**
- Pure engine (no frappe import, no DB): `docker exec frappe-backend-1 bash -lc "cd /home/frappe/frappe-bench/apps/sekolahpro && python -m unittest sekolahpro.ocr.engine.tests.<module> -v"`
- Frappe-dependent: `docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --module sekolahpro.ocr.<path>`
- FE: `pnpm --filter <pkg> test` / `pnpm --filter <pkg> exec tsc --noEmit` / `pnpm lint`

---

## Phase A — Backend (`sekolahpro`)

### Task A0: Install OCR dependencies + verify

**Files:**
- Modify: `sekolahpro/pyproject.toml` (add deps)

- [ ] **Step 1: Add Python deps to pyproject.toml**

In `[project] dependencies` add:
```toml
"pytesseract>=0.3.10",
"Pillow>=10.0.0",
```

- [ ] **Step 2: Install python deps into the bench env**

Run:
```bash
docker exec frappe-backend-1 bash -lc "/home/frappe/frappe-bench/env/bin/pip install pytesseract 'Pillow>=10'"
```
Expected: `Successfully installed Pillow-... pytesseract-...`

- [ ] **Step 3: Install the tesseract binary + Indonesian language data**

Run (container is Debian-based, may need root):
```bash
docker exec -u root frappe-backend-1 bash -lc "apt-get update && apt-get install -y tesseract-ocr tesseract-ocr-ind"
```
Expected: installs without error.

- [ ] **Step 4: Verify binary + `ind` langdata present**

Run:
```bash
docker exec frappe-backend-1 bash -lc "tesseract --version | head -1 && tesseract --list-langs"
```
Expected: a version line AND `ind` present in the language list. If `ind` missing, STOP — parsers will be useless.

- [ ] **Step 5: Document the durable image change**

Append to `docs/superpowers/plans/2026-06-05-ocr-identitas.md` deployment note (or the project's docker README) that the backend image build must include `apt-get install -y tesseract-ocr tesseract-ocr-ind` and the two pip deps. Runtime install above is dev-only and lost on container rebuild.

- [ ] **Step 6: Commit**
```bash
git add sekolahpro/pyproject.toml
git commit -m "chore(ocr): tambah dependency tesseract + pytesseract + Pillow"
```

---

### Task A1: Engine constants

**Files:**
- Create: `sekolahpro/ocr/__init__.py` (empty)
- Create: `sekolahpro/ocr/engine/__init__.py` (empty)
- Create: `sekolahpro/ocr/engine/constants.py`

- [ ] **Step 1: Create the constants module**

`sekolahpro/ocr/engine/constants.py`:
```python
"""OCR engine constants: retention, doc-type keys, regex, Tesseract config.

Pure module (no frappe import) so it is importable by both controller code and
plain-unittest engine tests without a Frappe site / DB.
"""

import re

# Retention window for stored ID scans (UU PDP). See spec section 3.
RETENTION_DAYS = 30

# Document type keys (must match Pindai Identitas.jenis_dokumen Select options).
DOC_KTP = "KTP"
DOC_KK = "KK"
DOC_SIM = "SIM"
DOC_TYPES = (DOC_KTP, DOC_KK, DOC_SIM)

# Tesseract: Indonesian language, assume a single uniform block of text.
TESSERACT_LANG = "ind"
TESSERACT_CONFIG = "--psm 6"

# 16-digit NIK / No. KK.
RE_NIK = re.compile(r"\b(\d{16})\b")
# Date dd-mm-yyyy or dd/mm/yyyy (KTP "Tempat/Tgl Lahir").
RE_TGL = re.compile(r"(\d{1,2})[-/](\d{1,2})[-/](\d{4})")
# RT/RW like 005/010.
RE_RTRW = re.compile(r"(\d{1,3})\s*/\s*(\d{1,3})")

# Map normalized KTP labels -> output field name.
KTP_LABELS = {
    "nik": "nik",
    "nama": "nama",
    "tempat/tgl lahir": "_ttl",
    "tempat tgl lahir": "_ttl",
    "jenis kelamin": "jenis_kelamin",
    "alamat": "alamat",
    "rt/rw": "_rtrw",
    "kel/desa": "kel_desa",
    "desa/kelurahan": "kel_desa",
    "kecamatan": "kecamatan",
    "agama": "agama",
    "status perkawinan": "status_perkawinan",
    "pekerjaan": "pekerjaan",
    "kewarganegaraan": "kewarganegaraan",
}

# Map normalized KK header labels -> output field name.
KK_LABELS = {
    "no": "no_kk",
    "nomor": "no_kk",
    "nama kepala keluarga": "nama_kepala_keluarga",
    "alamat": "alamat",
    "rt/rw": "_rtrw",
    "desa/kelurahan": "desa_kelurahan",
    "kecamatan": "kecamatan",
    "kabupaten/kota": "kabupaten_kota",
    "provinsi": "provinsi",
    "kode pos": "kode_pos",
}
```

- [ ] **Step 2: Commit**
```bash
git add sekolahpro/ocr/__init__.py sekolahpro/ocr/engine/__init__.py sekolahpro/ocr/engine/constants.py
git commit -m "feat(ocr): konstanta engine OCR (retensi, label, regex)"
```

---

### Task A2: KTP parser (TDD)

**Files:**
- Create: `sekolahpro/ocr/engine/parser.py`
- Create: `sekolahpro/ocr/engine/tests/__init__.py` (empty)
- Create: `sekolahpro/ocr/engine/tests/test_parser.py`
- Create: `tests/testdata/ocr/ktp_sample.txt`

- [ ] **Step 1: Create the synthetic KTP raw-text fixture**

`tests/testdata/ocr/ktp_sample.txt` (synthetic — NOT a real person):
```
PROVINSI DKI JAKARTA
JAKARTA SELATAN
NIK : 3171234567890123
Nama : BUDI SANTOSO
Tempat/Tgl Lahir : JAKARTA, 17-08-1985
Jenis Kelamin : LAKI-LAKI Gol. Darah : O
Alamat : JL. MERDEKA NO 10
RT/RW : 005/010
Kel/Desa : GAMBIR
Kecamatan : GAMBIR
Agama : ISLAM
Status Perkawinan : KAWIN
Pekerjaan : KARYAWAN SWASTA
Kewarganegaraan : WNI
Berlaku Hingga : SEUMUR HIDUP
```

- [ ] **Step 2: Write the failing test**

`sekolahpro/ocr/engine/tests/test_parser.py`:
```python
"""Unit tests for OCR field parsers. Pure: feed raw text, assert dict.

Run: python -m unittest sekolahpro.ocr.engine.tests.test_parser -v
"""

import os
import unittest

from sekolahpro.ocr.engine import parser

_HERE = os.path.dirname(__file__)
_DATA = os.path.normpath(os.path.join(_HERE, "..", "..", "..", "..", "tests", "testdata", "ocr"))


def _load(name):
    with open(os.path.join(_DATA, name), encoding="utf-8") as f:
        return f.read()


class TestParseKtp(unittest.TestCase):
    def setUp(self):
        self.result = parser.parse_ktp(_load("ktp_sample.txt"))

    def test_nik(self):
        self.assertEqual(self.result["nik"], "3171234567890123")

    def test_nama(self):
        self.assertEqual(self.result["nama"], "BUDI SANTOSO")

    def test_tempat_lahir(self):
        self.assertEqual(self.result["tempat_lahir"], "JAKARTA")

    def test_tanggal_lahir_normalized(self):
        self.assertEqual(self.result["tanggal_lahir"], "1985-08-17")

    def test_jenis_kelamin(self):
        self.assertEqual(self.result["jenis_kelamin"], "Laki-laki")

    def test_rt_rw(self):
        self.assertEqual(self.result["rt_rw"], "005/010")

    def test_agama_title_case(self):
        self.assertEqual(self.result["agama"], "Islam")

    def test_missing_field_omitted(self):
        # No NISN on a KTP -> key absent, never guessed.
        self.assertNotIn("nisn", self.result)
```

- [ ] **Step 3: Run test, verify it fails**

Run:
```bash
docker exec frappe-backend-1 bash -lc "cd /home/frappe/frappe-bench/apps/sekolahpro && python -m unittest sekolahpro.ocr.engine.tests.test_parser -v"
```
Expected: FAIL — `module 'parser' has no attribute 'parse_ktp'`.

- [ ] **Step 4: Implement parser.py (KTP + shared helpers)**

`sekolahpro/ocr/engine/parser.py`:
```python
"""Parse OCR text from Indonesian ID documents into structured dicts.

Pure module (no frappe / no DB) — Priority 6 utility: reused by the
Pindai Identitas controller and by plain-unittest engine tests, kept separate
from the controller so parsing is testable without a Frappe site.

Each parser returns a dict with only the fields it confidently found; uncertain
fields are omitted rather than guessed.
"""

from sekolahpro.ocr.engine import constants as c


def _norm_label(raw: str) -> str:
    """Lowercase + collapse spaces for label matching."""
    return " ".join(raw.lower().split())


def _split_label_value(line: str):
    """Split a 'Label : value' line. Return (label, value) or (None, None)."""
    if ":" not in line:
        return None, None
    label, _, value = line.partition(":")
    return _norm_label(label), value.strip()


def _normalize_date(value: str):
    """dd-mm-yyyy / dd/mm/yyyy -> yyyy-mm-dd. None if no match."""
    m = c.RE_TGL.search(value)
    if not m:
        return None
    day, month, year = m.groups()
    return f"{year}-{int(month):02d}-{int(day):02d}"


def _normalize_gender(value: str):
    """KTP gender text -> Frappe Select value (Laki-laki / Perempuan)."""
    v = value.upper()
    if "LAKI" in v:
        return "Laki-laki"
    if "PEREMPUAN" in v:
        return "Perempuan"
    return None


def parse_ktp(text: str) -> dict:
    """Parse KTP OCR text. Returns dict of detected fields (see spec 4.5)."""
    out = {}
    for line in text.splitlines():
        label, value = _split_label_value(line)
        if not label or label not in c.KTP_LABELS:
            continue
        field = c.KTP_LABELS[label]
        if field == "_ttl":
            # "JAKARTA, 17-08-1985" -> tempat_lahir + tanggal_lahir
            place = value.split(",")[0].strip()
            if place:
                out["tempat_lahir"] = place
            tgl = _normalize_date(value)
            if tgl:
                out["tanggal_lahir"] = tgl
        elif field == "_rtrw":
            m = c.RE_RTRW.search(value)
            if m:
                out["rt_rw"] = f"{m.group(1)}/{m.group(2)}"
        elif field == "jenis_kelamin":
            g = _normalize_gender(value)
            if g:
                out["jenis_kelamin"] = g
        elif field == "nik":
            m = c.RE_NIK.search(value)
            if m:
                out["nik"] = m.group(1)
        elif field == "agama":
            out["agama"] = value.title()
        else:
            if value:
                out[field] = value
    return out
```

- [ ] **Step 5: Run test, verify it passes**

Run the Step 3 command. Expected: PASS (8 tests).

- [ ] **Step 6: Commit**
```bash
git add sekolahpro/ocr/engine/parser.py sekolahpro/ocr/engine/tests/ tests/testdata/ocr/ktp_sample.txt
git commit -m "feat(ocr): parser KTP + test"
```

---

### Task A3: KK parser with member extraction (TDD)

**Files:**
- Modify: `sekolahpro/ocr/engine/parser.py` (add `parse_kk`)
- Modify: `sekolahpro/ocr/engine/tests/test_parser.py` (add `TestParseKk`)
- Create: `tests/testdata/ocr/kk_sample.txt`

- [ ] **Step 1: Create the synthetic KK fixture**

`tests/testdata/ocr/kk_sample.txt`:
```
KARTU KELUARGA
No. : 3171234567890001
Nama Kepala Keluarga : BUDI SANTOSO
Alamat : JL. MERDEKA NO 10
RT/RW : 005/010
Desa/Kelurahan : GAMBIR
Kecamatan : GAMBIR
Kabupaten/Kota : JAKARTA PUSAT
Provinsi : DKI JAKARTA
Kode Pos : 10110

BUDI SANTOSO 3171234567890123 LAKI-LAKI
SITI AMINAH 3171234567890124 PEREMPUAN
ANDI SANTOSO 3171234567890125 LAKI-LAKI
```

- [ ] **Step 2: Write the failing test (append to test_parser.py)**

```python
class TestParseKk(unittest.TestCase):
    def setUp(self):
        self.result = parser.parse_kk(_load("kk_sample.txt"))

    def test_no_kk(self):
        self.assertEqual(self.result["no_kk"], "3171234567890001")

    def test_header_fields(self):
        self.assertEqual(self.result["desa_kelurahan"], "GAMBIR")
        self.assertEqual(self.result["kabupaten_kota"], "JAKARTA PUSAT")
        self.assertEqual(self.result["kode_pos"], "10110")

    def test_three_members(self):
        self.assertEqual(len(self.result["anggota"]), 3)

    def test_member_nik_and_name(self):
        kepala = self.result["anggota"][0]
        self.assertEqual(kepala["nik"], "3171234567890123")
        self.assertEqual(kepala["nama"], "BUDI SANTOSO")
        self.assertEqual(kepala["jenis_kelamin"], "Laki-laki")
```

- [ ] **Step 3: Run test, verify it fails**

Run:
```bash
docker exec frappe-backend-1 bash -lc "cd /home/frappe/frappe-bench/apps/sekolahpro && python -m unittest sekolahpro.ocr.engine.tests.test_parser.TestParseKk -v"
```
Expected: FAIL — `module 'parser' has no attribute 'parse_kk'`.

- [ ] **Step 4: Implement parse_kk (append to parser.py)**

```python
def _parse_kk_member(line: str):
    """Best-effort: a member row has a 16-digit NIK; name = text before it,
    gender keyword after. Returns dict or None if no NIK on the line.

    KK member tables OCR poorly; we anchor on the NIK and keep only what is
    unambiguous, leaving the rest for the operator to fill.
    """
    m = c.RE_NIK.search(line)
    if not m:
        return None
    nik = m.group(1)
    before = line[: m.start()].strip()
    after = line[m.end():].strip()
    member = {"nik": nik}
    if before:
        member["nama"] = before
    g = _normalize_gender(after)
    if g:
        member["jenis_kelamin"] = g
    return member


def parse_kk(text: str) -> dict:
    """Parse Kartu Keluarga OCR text: header fields + anggota[] (see spec 4.5)."""
    out = {"anggota": []}
    for line in text.splitlines():
        member = _parse_kk_member(line)
        if member:
            out["anggota"].append(member)
            continue
        label, value = _split_label_value(line)
        if not label or label not in c.KK_LABELS:
            continue
        field = c.KK_LABELS[label]
        if field == "no_kk":
            m = c.RE_NIK.search(value)
            if m:
                out["no_kk"] = m.group(1)
        elif field == "_rtrw":
            m = c.RE_RTRW.search(value)
            if m:
                out["rt_rw"] = f"{m.group(1)}/{m.group(2)}"
        elif value:
            out[field] = value
    return out
```

- [ ] **Step 5: Run test, verify it passes**

Run the Step 3 command (full class). Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add sekolahpro/ocr/engine/parser.py sekolahpro/ocr/engine/tests/test_parser.py tests/testdata/ocr/kk_sample.txt
git commit -m "feat(ocr): parser KK + ekstraksi anggota keluarga"
```

---

### Task A4: SIM parser (TDD)

**Files:**
- Modify: `sekolahpro/ocr/engine/parser.py` (add `parse_sim` + `SIM_LABELS` in constants)
- Modify: `sekolahpro/ocr/engine/constants.py` (add `SIM_LABELS`, `RE_NO_SIM`)
- Modify: `sekolahpro/ocr/engine/tests/test_parser.py` (add `TestParseSim`)
- Create: `tests/testdata/ocr/sim_sample.txt`

- [ ] **Step 1: Add SIM constants**

Append to `constants.py`:
```python
# SIM number e.g. 9201-1234-567890 or a 12-14 digit run.
RE_NO_SIM = re.compile(r"\b(\d{4}-\d{4}-\d{6}|\d{12,14})\b")

SIM_LABELS = {
    "nama": "nama",
    "tempat/tgl lahir": "_ttl",
    "tempat tgl lahir": "_ttl",
    "alamat": "alamat",
}
```

- [ ] **Step 2: Create SIM fixture**

`tests/testdata/ocr/sim_sample.txt`:
```
SURAT IZIN MENGEMUDI
SIM A
9201-2345-678901
Nama : BUDI SANTOSO
Tempat/Tgl Lahir : JAKARTA, 17-08-1985
Alamat : JL. MERDEKA NO 10
```

- [ ] **Step 3: Write the failing test (append)**

```python
class TestParseSim(unittest.TestCase):
    def setUp(self):
        self.result = parser.parse_sim(_load("sim_sample.txt"))

    def test_nama(self):
        self.assertEqual(self.result["nama"], "BUDI SANTOSO")

    def test_no_sim(self):
        self.assertEqual(self.result["no_sim"], "9201-2345-678901")

    def test_ttl(self):
        self.assertEqual(self.result["tempat_lahir"], "JAKARTA")
        self.assertEqual(self.result["tanggal_lahir"], "1985-08-17")
```

- [ ] **Step 4: Run, verify fail**
```bash
docker exec frappe-backend-1 bash -lc "cd /home/frappe/frappe-bench/apps/sekolahpro && python -m unittest sekolahpro.ocr.engine.tests.test_parser.TestParseSim -v"
```
Expected: FAIL — no `parse_sim`.

- [ ] **Step 5: Implement parse_sim (append to parser.py)**

```python
def parse_sim(text: str) -> dict:
    """Parse SIM OCR text. Older SIM omit NIK; only confident fields returned."""
    out = {}
    no_sim = c.RE_NO_SIM.search(text)
    if no_sim:
        out["no_sim"] = no_sim.group(1)
    nik = c.RE_NIK.search(text)
    if nik:
        out["nik"] = nik.group(1)
    for line in text.splitlines():
        label, value = _split_label_value(line)
        if not label or label not in c.SIM_LABELS:
            continue
        field = c.SIM_LABELS[label]
        if field == "_ttl":
            place = value.split(",")[0].strip()
            if place:
                out["tempat_lahir"] = place
            tgl = _normalize_date(value)
            if tgl:
                out["tanggal_lahir"] = tgl
        elif value:
            out[field] = value
    return out
```
NOTE: `no_sim` is a 4-4-6 grouped number; `RE_NIK` (16 digits) will not match it, so the two regexes do not collide.

- [ ] **Step 6: Run, verify pass.** Same command as Step 4.

- [ ] **Step 7: Add a dispatch helper + commit**

Append to `parser.py`:
```python
def parse(jenis: str, text: str) -> dict:
    """Dispatch to the parser for the given document type."""
    if jenis == c.DOC_KTP:
        return parse_ktp(text)
    if jenis == c.DOC_KK:
        return parse_kk(text)
    if jenis == c.DOC_SIM:
        return parse_sim(text)
    raise ValueError(f"Unknown document type: {jenis}")
```
```bash
git add sekolahpro/ocr/engine/parser.py sekolahpro/ocr/engine/constants.py sekolahpro/ocr/engine/tests/test_parser.py tests/testdata/ocr/sim_sample.txt
git commit -m "feat(ocr): parser SIM + dispatcher parse()"
```

---

### Task A5: Image preprocessing (Pillow)

**Files:**
- Create: `sekolahpro/ocr/engine/preprocess.py`
- Modify: `sekolahpro/ocr/engine/tests/test_engine.py` (create)

- [ ] **Step 1: Write the failing test**

`sekolahpro/ocr/engine/tests/test_engine.py`:
```python
"""Tests for preprocess (Pillow). Pure: build an in-memory image, assert output.

Run: python -m unittest sekolahpro.ocr.engine.tests.test_engine -v
"""

import io
import unittest

from PIL import Image

from sekolahpro.ocr.engine import preprocess


def _png_bytes(size=(1200, 800), color=(180, 180, 180)):
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format="PNG")
    return buf.getvalue()


class TestPreprocess(unittest.TestCase):
    def test_returns_grayscale_pil_image(self):
        img = preprocess.prepare(_png_bytes())
        self.assertEqual(img.mode, "L")

    def test_downscales_when_too_wide(self):
        img = preprocess.prepare(_png_bytes(size=(4000, 3000)))
        self.assertLessEqual(img.width, preprocess.MAX_WIDTH)
```

- [ ] **Step 2: Run, verify fail**
```bash
docker exec frappe-backend-1 bash -lc "cd /home/frappe/frappe-bench/apps/sekolahpro && python -m unittest sekolahpro.ocr.engine.tests.test_engine -v"
```
Expected: FAIL — no module `preprocess`.

- [ ] **Step 3: Implement preprocess.py**

```python
"""Image preprocessing for OCR using Pillow (no opencv — see spec 2).

Pure module: bytes -> PIL.Image. Grayscale + autocontrast + downscale improves
Tesseract accuracy on phone photos without heavy dependencies.
"""

import io

from PIL import Image, ImageOps

MAX_WIDTH = 1600  # cap width; larger images waste OCR time without accuracy gain


def prepare(image_bytes: bytes) -> "Image.Image":
    """Decode bytes -> grayscale, autocontrast, downscale. Returns PIL Image."""
    img = Image.open(io.BytesIO(image_bytes))
    img = ImageOps.exif_transpose(img)  # honor phone orientation
    img = img.convert("L")              # grayscale
    img = ImageOps.autocontrast(img)    # normalize lighting
    if img.width > MAX_WIDTH:
        ratio = MAX_WIDTH / img.width
        img = img.resize((MAX_WIDTH, int(img.height * ratio)))
    return img
```

- [ ] **Step 4: Run, verify pass.** Same command as Step 2.

- [ ] **Step 5: Commit**
```bash
git add sekolahpro/ocr/engine/preprocess.py sekolahpro/ocr/engine/tests/test_engine.py
git commit -m "feat(ocr): preprocessing gambar Pillow"
```

---

### Task A6: Tesseract wrapper

**Files:**
- Create: `sekolahpro/ocr/engine/tesseract.py`
- Modify: `sekolahpro/ocr/engine/tests/test_engine.py` (add a mocked test)

- [ ] **Step 1: Write the failing test (append to test_engine.py)**

```python
from unittest import mock


class TestTesseract(unittest.TestCase):
    def test_extract_returns_text_and_confidence(self):
        fake_data = {"text": ["NIK", "3171234567890123", ""], "conf": ["90", "88", "-1"]}
        with mock.patch("sekolahpro.ocr.engine.tesseract.pytesseract") as pt:
            pt.image_to_string.return_value = "NIK 3171234567890123"
            pt.image_to_data.return_value = fake_data
            pt.Output.DICT = "dict"
            from sekolahpro.ocr.engine import tesseract
            text, conf = tesseract.extract(Image.new("L", (10, 10)))
        self.assertIn("3171234567890123", text)
        self.assertAlmostEqual(conf, 89.0, places=0)  # mean of 90, 88 (skip -1)
```

- [ ] **Step 2: Run, verify fail** (same test_engine command).

- [ ] **Step 3: Implement tesseract.py**

```python
"""Thin pytesseract wrapper: PIL.Image -> (text, mean_confidence).

Pure utility (no frappe / no DB). Isolated so the controller can call it and
tests can mock pytesseract without the binary installed.
"""

import pytesseract

from sekolahpro.ocr.engine import constants as c


def extract(image) -> tuple[str, float]:
    """Run Tesseract (lang=ind). Returns (full_text, mean_word_confidence 0-100)."""
    text = pytesseract.image_to_string(image, lang=c.TESSERACT_LANG, config=c.TESSERACT_CONFIG)
    data = pytesseract.image_to_data(
        image, lang=c.TESSERACT_LANG, config=c.TESSERACT_CONFIG, output_type=pytesseract.Output.DICT
    )
    confs = [float(x) for x in data.get("conf", []) if x not in ("-1", -1, "")]
    mean_conf = round(sum(confs) / len(confs), 1) if confs else 0.0
    return text, mean_conf
```

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Commit**
```bash
git add sekolahpro/ocr/engine/tesseract.py sekolahpro/ocr/engine/tests/test_engine.py
git commit -m "feat(ocr): wrapper pytesseract extract()"
```

---

### Task A7: Extract shared upload guard (refactor)

**Files:**
- Create: `sekolahpro/utils/upload_guard.py`
- Modify: `sekolahpro/ppdb/api/ppdb.py` (import from new util, remove local defs)

- [ ] **Step 1: Create upload_guard.py**

Move the exact bodies of `_check_rate_limit`, `_validate_turnstile`, plus
`TURNSTILE_VERIFY_URL`, `RATE_LIMIT_WINDOW_SECONDS`, `ALLOWED_UPLOAD_MIME`,
`MAX_UPLOAD_BYTES` from `ppdb.py` into `sekolahpro/utils/upload_guard.py`.
Rename the two functions to public: `check_rate_limit`, `validate_turnstile`.
Add module docstring:
```python
"""Shared guards for guest-callable upload endpoints (rate-limit, Turnstile,
MIME/size). Extracted from ppdb.api so OCR + PPDB share one implementation.
"""
```

- [ ] **Step 2: Update ppdb.py to import from the util**

In `sekolahpro/ppdb/api/ppdb.py`:
- Delete the local `_check_rate_limit`, `_validate_turnstile`, the four constants, and the `TURNSTILE_VERIFY_URL` line.
- Add:
```python
from sekolahpro.utils.upload_guard import (
    ALLOWED_UPLOAD_MIME,
    MAX_UPLOAD_BYTES,
    check_rate_limit,
    validate_turnstile,
)
```
- Replace internal calls `_check_rate_limit(...)` -> `check_rate_limit(...)` and `_validate_turnstile(...)` -> `validate_turnstile(...)`.

- [ ] **Step 3: Run existing PPDB tests, verify still green**

Run:
```bash
docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --module sekolahpro.ppdb.api.test_ppdb
```
Expected: same pass count as before the refactor (no regressions). If the module path differs, locate with `grep -rl "def test" sekolahpro/ppdb`.

- [ ] **Step 4: Commit**
```bash
git add sekolahpro/utils/upload_guard.py sekolahpro/ppdb/api/ppdb.py
git commit -m "refactor(ppdb): ekstrak guard upload ke utils bersama"
```

---

### Task A8: Doctype `Pindai Identitas` + controller (TDD)

**Files:**
- Create: `sekolahpro/ocr/doctype/__init__.py` (empty)
- Create: `sekolahpro/ocr/doctype/pindai_identitas/__init__.py` (empty)
- Create: `sekolahpro/ocr/doctype/pindai_identitas/pindai_identitas.json`
- Create: `sekolahpro/ocr/doctype/pindai_identitas/pindai_identitas.py`
- Create: `sekolahpro/ocr/doctype/pindai_identitas/test_pindai_identitas.py`

- [ ] **Step 1: Create the doctype JSON**

`pindai_identitas.json` — fields per spec 4.2. Key attributes: `"module": "OCR"`, `"naming_rule": "Expression (old style)"`, `"autoname": "PINDAI-.YYYY.-.#####"`, `"is_submittable": 0`. Fields (each with `fieldname`/`label`/`fieldtype`):
- `jenis_dokumen` Select options `KTP\nKK\nSIM`, reqd 1
- `file_dokumen` Attach Image
- `status` Select `Diproses\nBerhasil\nGagal`, default `Diproses`
- `confidence` Float
- `raw_text` Long Text, `permlevel` 2
- `hasil_json` Code (options `JSON`), `permlevel` 2
- `nik_terdeteksi` Data, `permlevel` 2
- `consent_diberikan` Check, reqd 1
- `consent_timestamp` Datetime, read_only 1
- `hapus_setelah` Date, read_only 1
- `uploaded_by` Link `User`, read_only 1
- `sekolah` Link `Sekolah`
- `organisasi` Link `Organisasi`, read_only 1, `fetch_from` `sekolah.organisasi`

Permissions block: System Manager + relevant school admin roles read/write at permlevel 0; a restricted set (e.g. School Admin) at permlevel 1/2 for the sensitive fields (mirror how `Siswa` grants permlevel 2 on `nik`/`no_kk` — open `siswa.json` permissions and copy the same role set).

- [ ] **Step 2: Write the failing controller test**

`test_pindai_identitas.py`:
```python
"""Tests for Pindai Identitas controller (proses_ocr, validate, retention).

Run: bench --site sekolahpro.localhost run-tests --module \
  sekolahpro.ocr.doctype.pindai_identitas.test_pindai_identitas
"""

import unittest
from unittest import mock

import frappe
from frappe.utils import add_days, nowdate


class TestPindaiIdentitas(unittest.TestCase):
    def tearDown(self):
        frappe.db.rollback()

    def _make(self, jenis="KTP"):
        doc = frappe.new_doc("Pindai Identitas")
        doc.jenis_dokumen = jenis
        doc.consent_diberikan = 1
        return doc

    def test_validate_sets_retention_date(self):
        doc = self._make()
        doc.run_method("validate")
        self.assertEqual(doc.hapus_setelah, add_days(nowdate(), 30))

    def test_validate_requires_consent(self):
        doc = self._make()
        doc.consent_diberikan = 0
        with self.assertRaises(frappe.ValidationError):
            doc.run_method("validate")

    def test_proses_ocr_fills_fields_from_engine(self):
        doc = self._make("KTP")
        with mock.patch(
            "sekolahpro.ocr.doctype.pindai_identitas.pindai_identitas._read_image_bytes",
            return_value=b"x",
        ), mock.patch(
            "sekolahpro.ocr.engine.preprocess.prepare", return_value=object()
        ), mock.patch(
            "sekolahpro.ocr.engine.tesseract.extract",
            return_value=("NIK : 3171234567890123\nNama : BUDI", 87.5),
        ):
            fields = doc.proses_ocr()
        self.assertEqual(fields["nik"], "3171234567890123")
        self.assertEqual(doc.nik_terdeteksi, "3171234567890123")
        self.assertEqual(doc.confidence, 87.5)
        self.assertEqual(doc.status, "Berhasil")
```

- [ ] **Step 3: Run, verify fail**
```bash
docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --module sekolahpro.ocr.doctype.pindai_identitas.test_pindai_identitas
```
Expected: FAIL — doctype/controller missing. (After creating JSON, run `bench --site sekolahpro.localhost migrate` so the table exists.)

- [ ] **Step 4: Implement the controller**

`pindai_identitas.py`:
```python
"""Pindai Identitas: stores an uploaded ID image (private) + consent + OCR
result, with a retention date for auto-purge. OCR runs in proses_ocr() —
Priority 1 controller method (logic tied to this doctype's lifecycle).
"""

import json

import frappe
from frappe.model.document import Document
from frappe.utils import add_days, now_datetime, nowdate

from sekolahpro.ocr.engine import parser, preprocess, tesseract
from sekolahpro.ocr.engine.constants import RETENTION_DAYS


def _read_image_bytes(file_url: str) -> bytes:
    """Load the private file content for a given file_url. Isolated for tests."""
    from frappe.utils.file_manager import get_file
    return get_file(file_url)[1]


class PindaiIdentitas(Document):
    def validate(self):
        """Require consent; stamp consent time + retention purge date."""
        if not self.consent_diberikan:
            frappe.throw("Persetujuan pemilik dokumen wajib diberikan", frappe.ValidationError)
        if not self.consent_timestamp:
            self.consent_timestamp = now_datetime()
        self.hapus_setelah = add_days(nowdate(), RETENTION_DAYS)

    def proses_ocr(self) -> dict:
        """Run preprocess -> tesseract -> parse for jenis_dokumen. Persist
        raw_text / hasil_json / confidence / nik_terdeteksi / status. Return dict.
        """
        try:
            raw = _read_image_bytes(self.file_dokumen)
            image = preprocess.prepare(raw)
            text, conf = tesseract.extract(image)
            fields = parser.parse(self.jenis_dokumen, text)
            self.raw_text = text
            self.hasil_json = json.dumps(fields, ensure_ascii=False)
            self.confidence = conf
            self.nik_terdeteksi = fields.get("nik")
            self.status = "Berhasil"
            return fields
        except Exception:
            self.status = "Gagal"
            frappe.log_error(title="OCR Pindai Identitas gagal")
            raise
```

- [ ] **Step 5: Migrate + run, verify pass**
```bash
docker exec frappe-backend-1 bench --site sekolahpro.localhost migrate
docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --module sekolahpro.ocr.doctype.pindai_identitas.test_pindai_identitas
```
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**
```bash
git add sekolahpro/ocr/doctype/
git commit -m "feat(ocr): doctype Pindai Identitas + controller proses_ocr"
```

---

### Task A9: Tenant registry registration

**Files:**
- Modify: `sekolahpro/.../tenant_registry.py` (locate via grep)

- [ ] **Step 1: Locate the registry**
```bash
grep -rn "DOCTYPES" $(grep -rl "tenant_registry" sekolahpro --include=*.py | head -1)
```

- [ ] **Step 2: Add `"Pindai Identitas"` to `DOCTYPES['SCHOOL']`**

Add the string to the SCHOOL list (alphabetical or end), matching surrounding style. This anchors tenant scoping (KNOWN GOTCHA: omission silently leaks across tenants).

- [ ] **Step 3: Verify scoping test**

If the project has a tenant-scoping test suite, run it:
```bash
docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --module sekolahpro.tests.test_tenant_scoping
```
(Locate the actual module with `grep -rl "tenant" sekolahpro --include=test_*.py`.) Expected: green, includes the new doctype.

- [ ] **Step 4: Commit**
```bash
git add -A
git commit -m "feat(ocr): daftarkan Pindai Identitas ke tenant registry"
```

---

### Task A10: Endpoints `scan_identitas` + `scan_identitas_publik` (TDD)

**Files:**
- Create: `sekolahpro/ocr/api.py`
- Create: `sekolahpro/ocr/test_api.py`

- [ ] **Step 1: Write the failing endpoint test**

`sekolahpro/ocr/test_api.py`:
```python
"""Tests for OCR API endpoints (MIME/size/consent + delegation).

Run: bench --site sekolahpro.localhost run-tests --module sekolahpro.ocr.test_api
"""

import base64
import unittest
from unittest import mock

import frappe

from sekolahpro.ocr import api


class TestScanIdentitas(unittest.TestCase):
    def tearDown(self):
        frappe.db.rollback()

    def test_rejects_bad_mime(self):
        with self.assertRaises(frappe.ValidationError):
            api.scan_identitas("KTP", "x.txt", base64.b64encode(b"hi").decode(), "text/plain")

    def test_delegates_to_controller(self):
        with mock.patch("sekolahpro.ocr.api._save_private", return_value="/files/x.png"), \
             mock.patch("sekolahpro.ocr.doctype.pindai_identitas.pindai_identitas.PindaiIdentitas.proses_ocr",
                        return_value={"nik": "3171234567890123"}):
            res = api.scan_identitas("KTP", "x.png", base64.b64encode(b"img").decode(), "image/png")
        self.assertEqual(res["fields"]["nik"], "3171234567890123")
        self.assertIn("scan_id", res)
```

- [ ] **Step 2: Run, verify fail**
```bash
docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --module sekolahpro.ocr.test_api
```
Expected: FAIL — no `sekolahpro.ocr.api`.

- [ ] **Step 3: Implement api.py**

```python
"""HTTP entrypoints for ID OCR. Each whitelist fn stays thin (<= 10 lines) and
delegates validation to upload_guard and OCR to the Pindai Identitas controller.
"""

import base64

import frappe

from sekolahpro.utils.upload_guard import (
    ALLOWED_UPLOAD_MIME,
    MAX_UPLOAD_BYTES,
    check_rate_limit,
    validate_turnstile,
)


def _decode_and_check(filedata, mime_type) -> bytes:
    """Validate MIME + size, return raw bytes."""
    if mime_type not in ALLOWED_UPLOAD_MIME:
        frappe.throw(f"Tipe file {mime_type} tidak diizinkan", frappe.ValidationError)
    data = base64.b64decode(filedata) if isinstance(filedata, str) else filedata
    if len(data) > MAX_UPLOAD_BYTES:
        frappe.throw("Ukuran file melebihi 5 MB", frappe.ValidationError)
    return data


def _save_private(filename, content) -> str:
    """Save the ID image as a private file. Returns file_url."""
    from frappe.utils.file_manager import save_file
    return save_file(fname=filename, content=content, dt="Pindai Identitas", dn=None, is_private=1).file_url


def _run_scan(jenis, filename, data, sekolah=None) -> dict:
    """Create Pindai Identitas, run OCR, return result envelope."""
    doc = frappe.new_doc("Pindai Identitas")
    doc.jenis_dokumen = jenis
    doc.consent_diberikan = 1
    doc.sekolah = sekolah
    doc.uploaded_by = frappe.session.user
    doc.file_dokumen = _save_private(filename, data)
    doc.insert(ignore_permissions=True)
    fields = doc.proses_ocr()
    doc.save(ignore_permissions=True)
    frappe.db.commit()
    return {"scan_id": doc.name, "jenis": jenis, "confidence": doc.confidence, "fields": fields}


@frappe.whitelist()
def scan_identitas(jenis, filename, filedata, mime_type, sekolah=None):
    """Authenticated scan (school/parent apps)."""
    data = _decode_and_check(filedata, mime_type)
    return _run_scan(jenis, filename, data, sekolah)


@frappe.whitelist(allow_guest=True)
def scan_identitas_publik(turnstile_token, jenis, filename, filedata, mime_type, sekolah=None):
    """Guest scan for public PPDB forms: rate-limit + Turnstile, then scan."""
    check_rate_limit("ocr", "rate_limit_upload_per_hour")
    validate_turnstile(turnstile_token)
    data = _decode_and_check(filedata, mime_type)
    return _run_scan(jenis, filename, data, sekolah)


def purge_kadaluarsa():
    """Daily scheduler: delete Pindai Identitas past its retention date."""
    from frappe.utils import nowdate
    stale = frappe.get_all("Pindai Identitas", filters={"hapus_setelah": ["<", nowdate()]}, pluck="name")
    for name in stale:
        frappe.delete_doc("Pindai Identitas", name, delete_permanently=True, ignore_permissions=True)
    if stale:
        frappe.db.commit()
```

- [ ] **Step 4: Run, verify pass.** Same as Step 2.

- [ ] **Step 5: Commit**
```bash
git add sekolahpro/ocr/api.py sekolahpro/ocr/test_api.py
git commit -m "feat(ocr): endpoint scan_identitas (authed + guest) + purge"
```

---

### Task A11: Wire scheduler + module registration

**Files:**
- Modify: `sekolahpro/hooks.py` (scheduler_events daily)
- Modify: `sekolahpro/modules.txt` (add `OCR`)

- [ ] **Step 1: Register the module**

Append `OCR` to `sekolahpro/modules.txt`.

- [ ] **Step 2: Add the daily purge to hooks.py**

In `scheduler_events["daily"]` list, add:
```python
"sekolahpro.ocr.api.purge_kadaluarsa",
```

- [ ] **Step 3: Write a retention test (append to test_api.py)**

```python
class TestPurge(unittest.TestCase):
    def tearDown(self):
        frappe.db.rollback()

    def test_purge_deletes_expired(self):
        from frappe.utils import add_days, nowdate
        doc = frappe.new_doc("Pindai Identitas")
        doc.jenis_dokumen = "KTP"
        doc.consent_diberikan = 1
        doc.insert(ignore_permissions=True)
        frappe.db.set_value("Pindai Identitas", doc.name, "hapus_setelah", add_days(nowdate(), -1))
        api.purge_kadaluarsa()
        self.assertFalse(frappe.db.exists("Pindai Identitas", doc.name))
```

- [ ] **Step 4: Run, verify pass**
```bash
docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --module sekolahpro.ocr.test_api
```
Expected: PASS (all classes).

- [ ] **Step 5: Commit**
```bash
git add sekolahpro/hooks.py sekolahpro/modules.txt
git commit -m "feat(ocr): jadwalkan purge harian + registrasi modul OCR"
```

---

### Task A12: Permissions fixture for sensitive fields

**Files:**
- Modify: `sekolahpro/hooks.py` fixtures (Custom DocPerm filter) OR doctype JSON permissions (already in A8)

- [ ] **Step 1: Confirm permlevel coverage**

Open `pindai_identitas.json` permissions. Ensure there is a `permlevel: 0` block for create/read/write by the operating roles, AND a `permlevel: 1` (or 2) block granting read to only the privileged role set (copy the exact roles `Siswa` uses for its permlevel-2 `nik`). Sensitive fields (`raw_text`, `hasil_json`, `nik_terdeteksi`) must NOT be readable at permlevel 0.

- [ ] **Step 2: Reload + sanity check**
```bash
docker exec frappe-backend-1 bench --site sekolahpro.localhost reload-doctype "Pindai Identitas"
docker exec frappe-backend-1 bench --site sekolahpro.localhost console <<'PY'
import frappe
print([p.role for p in frappe.get_meta("Pindai Identitas").permissions if p.permlevel >= 1])
PY
```
Expected: prints the privileged role(s) only.

- [ ] **Step 3: Commit**
```bash
git add sekolahpro/ocr/doctype/pindai_identitas/pindai_identitas.json
git commit -m "feat(ocr): batasi field sensitif Pindai Identitas via permlevel"
```

- [ ] **Step 4: Run the full backend OCR suite green**
```bash
docker exec frappe-backend-1 bash -lc "cd /home/frappe/frappe-bench/apps/sekolahpro && python -m unittest sekolahpro.ocr.engine.tests.test_parser sekolahpro.ocr.engine.tests.test_engine -v"
docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --module sekolahpro.ocr.doctype.pindai_identitas.test_pindai_identitas
docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --module sekolahpro.ocr.test_api
```
Expected: all green.

---

## Phase B — Frontend (`sekolahpro-web`, worktree `.worktrees/ocr-identitas`)

> Run all FE commands from `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web/.worktrees/ocr-identitas`.

### Task B0: Worktree deps

- [ ] **Step 1: Install**
```bash
pnpm install
```
Expected: completes; `react-dom` present in apps that consume `@sekolahpro/ui` (KNOWN GOTCHA — `Modal` uses `createPortal`).

---

### Task B1: `<IdScanField>` component in `@sekolahpro/ui` (TDD)

**Files:**
- Create: `packages/ui/src/components/IdScanField.tsx`
- Modify: `packages/ui/src/index.ts` (export it)
- Create: `packages/ui/src/components/IdScanField.test.tsx`

- [ ] **Step 1: Confirm test harness**

`grep -n "test" packages/ui/package.json` — confirm a `test` script + vitest. Note whether `globals` is on; if off, each test file needs `afterEach(cleanup)` (KNOWN GOTCHA: RTL cleanup leak).

- [ ] **Step 2: Write the failing test**

`packages/ui/src/components/IdScanField.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { IdScanField } from "./IdScanField";

afterEach(cleanup);

describe("IdScanField", () => {
  it("disables scan until consent is checked", () => {
    render(<IdScanField jenis="KTP" onScan={vi.fn()} onApply={vi.fn()} />);
    expect(screen.getByRole("button", { name: /pilih file/i })).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/setuju/i));
    expect(screen.getByRole("button", { name: /pilih file/i })).not.toBeDisabled();
  });

  it("calls onScan then shows fields and applies them", async () => {
    const onScan = vi.fn().mockResolvedValue({ nik: "3171234567890123", nama: "BUDI" });
    const onApply = vi.fn();
    render(<IdScanField jenis="KTP" onScan={onScan} onApply={onApply} />);
    fireEvent.click(screen.getByLabelText(/setuju/i));
    const file = new File([new Uint8Array([1, 2, 3])], "ktp.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("id-scan-file"), { target: { files: [file] } });
    await waitFor(() => expect(onScan).toHaveBeenCalled());
    await screen.findByText(/3171234567890123/);
    fireEvent.click(screen.getByRole("button", { name: /terapkan/i }));
    expect(onApply).toHaveBeenCalledWith({ nik: "3171234567890123", nama: "BUDI" });
  });
});
```

- [ ] **Step 3: Run, verify fail**
```bash
pnpm --filter @sekolahpro/ui test -- IdScanField
```
Expected: FAIL — module not found.

- [ ] **Step 4: Implement IdScanField.tsx**

```tsx
import { useRef, useState } from "react";
import { Button } from "./Button";

const MAX_DIM = 1600; // match backend MAX_WIDTH; downscale before upload
const JPEG_QUALITY = 0.8;

export type JenisDokumen = "KTP" | "KK" | "SIM";

export interface IdScanFieldProps {
  jenis: JenisDokumen;
  /** Upload the blob + run OCR. Injected per app (each app's api client). */
  onScan: (blob: Blob, jenis: JenisDokumen) => Promise<Record<string, unknown>>;
  /** Receive the reviewed fields to map into the host form. */
  onApply: (fields: Record<string, unknown>) => void;
  confidence?: number;
}

/** Downscale an image File to a JPEG Blob under MAX_DIM. */
async function downscale(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", JPEG_QUALITY));
}

export function IdScanField({ jenis, onScan, onApply }: IdScanFieldProps) {
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState<Record<string, unknown> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const blob = await downscale(file);
      setFields(await onScan(blob, jenis));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 p-3">
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>Saya setuju dokumen identitas dipindai untuk mengisi formulir ini.</span>
      </label>
      <div className="flex gap-2">
        <Button type="button" disabled={!consent || busy} onClick={() => fileRef.current?.click()}>
          {busy ? "Memindai…" : `📁 Pilih file ${jenis}`}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!consent || busy}
          onClick={() => fileRef.current?.click()}
        >
          📷 Foto {jenis}
        </Button>
      </div>
      <input
        ref={fileRef}
        data-testid="id-scan-file"
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      {fields && (
        <div className="space-y-2 rounded bg-slate-50 p-2 text-sm">
          <ul className="space-y-1">
            {Object.entries(fields)
              .filter(([k]) => k !== "anggota")
              .map(([k, v]) => (
                <li key={k}>
                  <span className="text-slate-500">{k}:</span> {String(v)}
                </li>
              ))}
          </ul>
          <Button type="button" onClick={() => onApply(fields)}>
            Terapkan ke formulir
          </Button>
        </div>
      )}
    </div>
  );
}
```
NOTE: `capture="environment"` makes mobile browsers offer the rear camera directly from the file input — satisfies the "camera + file" UX without a separate `getUserMedia` flow, fewer permission edge cases. If a live-preview overlay is later wanted, add a `getUserMedia` modal; not needed for first cut.

- [ ] **Step 5: Export from the package index**

In `packages/ui/src/index.ts` add:
```ts
export { IdScanField } from "./components/IdScanField";
export type { IdScanFieldProps, JenisDokumen } from "./components/IdScanField";
```

- [ ] **Step 6: Run, verify pass + typecheck**
```bash
pnpm --filter @sekolahpro/ui test -- IdScanField
pnpm --filter @sekolahpro/ui exec tsc --noEmit
```
Expected: tests PASS, tsc 0 errors.

- [ ] **Step 7: Commit**
```bash
git add packages/ui/src/components/IdScanField.tsx packages/ui/src/components/IdScanField.test.tsx packages/ui/src/index.ts
git commit -m "feat(ui): komponen IdScanField (scan KTP/KK/SIM + consent + review)"
```

---

### Task B2: school api-client method (TDD)

**Files:**
- Modify: `apps/school/src/lib/api*.ts` (locate the api client) — add `scanIdentitas`
- Create/Modify: matching test

- [ ] **Step 1: Locate the school api client**
```bash
grep -rn "api/method" apps/school/src/lib | head
```
Identify the function that POSTs to `sekolahpro.*` whitelist methods.

- [ ] **Step 2: Write the failing test**

In the api client's test file (mirror an existing one), add:
```ts
it("scanIdentitas posts blob as base64 to ocr endpoint", async () => {
  const post = vi.fn().mockResolvedValue({ message: { fields: { nik: "x" } } });
  const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" });
  const res = await scanIdentitas(post, blob, "KTP");
  expect(post).toHaveBeenCalledWith(
    "sekolahpro.ocr.api.scan_identitas",
    expect.objectContaining({ jenis: "KTP", mime_type: "image/png" }),
  );
  expect(res.fields.nik).toBe("x");
});
```

- [ ] **Step 3: Run, verify fail.** `pnpm --filter @sekolahpro/school test -- <file>` → FAIL.

- [ ] **Step 4: Implement scanIdentitas**

Add to the school api lib:
```ts
/** Read a Blob as base64 (no data: prefix). */
async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (const b of buf) bin += String.fromCharCode(b);
  return btoa(bin);
}

export interface ScanResult {
  scan_id: string;
  jenis: string;
  confidence: number;
  fields: Record<string, unknown>;
}

/** Upload an ID image + run backend OCR. `post` = the app's frappe POST helper. */
export async function scanIdentitas(
  post: (method: string, args: unknown) => Promise<{ message: ScanResult }>,
  blob: Blob,
  jenis: "KTP" | "KK" | "SIM",
  sekolah?: string,
): Promise<ScanResult> {
  const filedata = await blobToBase64(blob);
  const res = await post("sekolahpro.ocr.api.scan_identitas", {
    jenis,
    filename: `${jenis.toLowerCase()}.jpg`,
    filedata,
    mime_type: blob.type || "image/jpeg",
    sekolah,
  });
  return res.message;
}
```

- [ ] **Step 5: Run, verify pass + tsc.**
```bash
pnpm --filter @sekolahpro/school test -- <file>
pnpm --filter @sekolahpro/school exec tsc --noEmit
```

- [ ] **Step 6: Commit**
```bash
git add apps/school/src/lib/
git commit -m "feat(school): api client scanIdentitas"
```

---

### Task B3: Mapping helpers + wire SiswaForm & WaliModal (TDD)

**Files:**
- Create: `apps/school/src/lib/ocrMapping.ts`
- Create: `apps/school/src/lib/ocrMapping.test.ts`
- Modify: `apps/school/src/components/SiswaForm.tsx` (insert `<IdScanField>`)
- Modify: `apps/school/src/components/SiswaModals.tsx` (WaliModal)

- [ ] **Step 1: Write the failing mapping test**

`apps/school/src/lib/ocrMapping.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { mapKtpToSiswa, mapKtpToWali } from "./ocrMapping";

describe("ocrMapping", () => {
  it("maps KTP fields to Siswa form keys", () => {
    const out = mapKtpToSiswa({
      nik: "3171234567890123",
      nama: "BUDI SANTOSO",
      jenis_kelamin: "Laki-laki",
      tempat_lahir: "JAKARTA",
      tanggal_lahir: "1985-08-17",
      agama: "Islam",
      alamat: "JL MERDEKA",
    });
    expect(out).toMatchObject({
      nik: "3171234567890123",
      nama_lengkap: "BUDI SANTOSO",
      jenisKelamin: "Laki-laki",
      tempatLahir: "JAKARTA",
      tanggalLahir: "1985-08-17",
      agama: "Islam",
      alamat: "JL MERDEKA",
    });
  });

  it("maps KTP to wali by relation (Ayah -> nikAyah)", () => {
    const out = mapKtpToWali({ nik: "3171234567890124", nama: "BUDI" }, "Ayah");
    expect(out).toMatchObject({ nama: "BUDI", nikAyah: "3171234567890124" });
  });
});
```

- [ ] **Step 2: Run, verify fail.** `pnpm --filter @sekolahpro/school test -- ocrMapping` → FAIL.

- [ ] **Step 3: Implement ocrMapping.ts**

Build the mapping using the EXACT field names from `SiswaForm.tsx` and `WaliModal`
(confirm by reading those components first; the keys below match the Explore map
— verify before relying):
```ts
/** Map parsed OCR dicts to each form's field names. Only sets present keys. */

type Parsed = Record<string, unknown>;

function pick(src: Parsed, key: string): string | undefined {
  const v = src[key];
  return typeof v === "string" && v ? v : undefined;
}

export function mapKtpToSiswa(p: Parsed) {
  const out: Record<string, string> = {};
  const m: Record<string, string> = {
    nik: "nik",
    nama: "nama_lengkap",
    jenis_kelamin: "jenisKelamin",
    tempat_lahir: "tempatLahir",
    tanggal_lahir: "tanggalLahir",
    agama: "agama",
    alamat: "alamat",
  };
  for (const [from, to] of Object.entries(m)) {
    const v = pick(p, from);
    if (v) out[to] = v;
  }
  return out;
}

export function mapKtpToWali(p: Parsed, hubungan: "Ayah" | "Ibu" | "Wali") {
  const out: Record<string, string> = {};
  const nama = pick(p, "nama");
  if (nama) out.nama = nama;
  const nik = pick(p, "nik");
  if (nik) out[hubungan === "Ayah" ? "nikAyah" : hubungan === "Ibu" ? "nikIbu" : "nik"] = nik;
  const alamat = pick(p, "alamat");
  if (alamat) out.alamat = alamat;
  return out;
}
```

- [ ] **Step 4: Run, verify pass.** Same as Step 2.

- [ ] **Step 5: Wire into SiswaForm.tsx**

Read `apps/school/src/components/SiswaForm.tsx:155-460`. Above the identity
fields, insert (using the form's existing state setter — match its actual API,
e.g. `setForm`/`setValue`):
```tsx
import { IdScanField } from "@sekolahpro/ui";
import { scanIdentitas } from "../lib/api"; // actual path from B2
import { mapKtpToSiswa } from "../lib/ocrMapping";
import { post } from "../lib/api"; // the app's POST helper

// inside the form, before identity inputs:
<IdScanField
  jenis="KTP"
  onScan={(blob, jenis) => scanIdentitas(post, blob, jenis).then((r) => r.fields)}
  onApply={(fields) => {
    const mapped = mapKtpToSiswa(fields);
    Object.entries(mapped).forEach(([k, v]) => setField(k as keyof FormState, v));
  }}
/>
```
Adapt `setField`/`FormState` to the form's real state shape.

- [ ] **Step 6: Wire into WaliModal** (`SiswaModals.tsx:51-192`)

Same pattern with `mapKtpToWali(fields, form.hubungan)`; place `<IdScanField jenis="KTP">` near the top of the modal body.

- [ ] **Step 7: Typecheck + existing tests + the new ones**
```bash
pnpm --filter @sekolahpro/school exec tsc --noEmit
pnpm --filter @sekolahpro/school test
```
Expected: tsc 0, all tests green.

- [ ] **Step 8: Commit**
```bash
git add apps/school/src/lib/ocrMapping.ts apps/school/src/lib/ocrMapping.test.ts apps/school/src/components/SiswaForm.tsx apps/school/src/components/SiswaModals.tsx
git commit -m "feat(school): scan KTP/KK pada form Siswa + Wali"
```

---

### Task B4: Wire Pegawai / Staff forms

**Files:**
- Modify: `apps/school/src/lib/ocrMapping.ts` (add `mapKtpToPegawai`)
- Modify: `apps/school/src/lib/ocrMapping.test.ts` (add a case)
- Modify: `apps/school/src/features/pegawai/PegawaiFormModal.tsx`
- Modify: `apps/school/src/components/staff/StaffFormModal.tsx`

- [ ] **Step 1: Add the mapping test**
```ts
it("maps KTP to Pegawai keys", () => {
  const out = mapKtpToPegawai({
    nik: "3171234567890123", nama: "BUDI", jenis_kelamin: "Laki-laki",
    tempat_lahir: "JAKARTA", tanggal_lahir: "1985-08-17", agama: "Islam", alamat: "JL X",
  });
  expect(out).toMatchObject({
    nik: "3171234567890123", nama_lengkap: "BUDI", jenisKelamin: "Laki-laki",
    tempatLahir: "JAKARTA", tanggalLahir: "1985-08-17", agama: "Islam", alamat: "JL X",
  });
});
```

- [ ] **Step 2: Run → fail. Implement `mapKtpToPegawai`** (mirror `mapKtpToSiswa`; field names from `PegawaiFormModal.tsx:190-236` — `nama_lengkap`, `nik`, `tempatLahir`, `tanggalLahir`, `jenisKelamin`, `agama`, `alamat`). Verify against the file.

- [ ] **Step 3: Run → pass.**

- [ ] **Step 4: Insert `<IdScanField jenis="KTP">`** into both `PegawaiFormModal.tsx` and `StaffFormModal.tsx` near identity fields, `onApply` → `mapKtpToPegawai` → set form state (match each form's setter).

- [ ] **Step 5: Typecheck + tests**
```bash
pnpm --filter @sekolahpro/school exec tsc --noEmit && pnpm --filter @sekolahpro/school test
```

- [ ] **Step 6: Commit**
```bash
git add apps/school/src/lib/ocrMapping.ts apps/school/src/lib/ocrMapping.test.ts apps/school/src/features/pegawai/PegawaiFormModal.tsx apps/school/src/components/staff/StaffFormModal.tsx
git commit -m "feat(school): scan KTP/SIM pada form Pegawai & Staff"
```

---

### Task B5: Wire PPDB (situs, guest)

**Files:**
- Locate + modify situs api client (add `scanIdentitasPublik` → `sekolahpro.ocr.api.scan_identitas_publik`)
- Create: `apps/situs/src/lib/ocrMapping.ts` (+ test) — map to PPDB calon siswa keys
- Modify: `apps/situs/src/features/ppdb/PpdbForm.tsx`

- [ ] **Step 1: Add `scanIdentitasPublik`** in the situs api client (mirror B2 but method = `scan_identitas_publik` and include `turnstile_token`; reuse the form's existing Turnstile token like `upload_dokumen_ppdb` does).

- [ ] **Step 2: Mapping test + impl** — `mapKkToCalonSiswa` and `mapKtpToCalonSiswa` using `PpdbForm.tsx:40-133` field names (`nama_lengkap`, `nik`, `nisn`, `jenisKelamin`, `tempatLahir`, `tanggalLahir`, `alamat`, parent names/phones). For KK, fill applicant from the first `anggota` row that is a child + parents from `KEPALA KELUARGA`/`ISTRI` rows where determinable; otherwise leave for manual edit.

- [ ] **Step 3: Insert `<IdScanField>`** in `PpdbForm.tsx`. Offer `jenis="KK"` (fills applicant + parents) and `jenis="KTP"`.

- [ ] **Step 4: Typecheck + tests**
```bash
pnpm --filter @sekolahpro/situs exec tsc --noEmit && pnpm --filter @sekolahpro/situs test
```

- [ ] **Step 5: Commit**
```bash
git add apps/situs/src/
git commit -m "feat(situs): scan KK/KTP pada form PPDB (guest + Turnstile)"
```

---

### Task B6: Wire PickupPerson (parent portal)

**Files:**
- Locate + modify parent api client (add `scanIdentitas`)
- Create: `apps/parent/src/lib/ocrMapping.ts` (+ test) — `mapKtpToPickup`
- Modify: `apps/parent/src/components/PickupPersonForm.tsx`

- [ ] **Step 1: Mapping test + impl** — `mapKtpToPickup({nik,nama,...})` → `{ nama }` (phone/pin stay manual; PickupPerson has no NIK field — only fill `nama`). Confirm against `PickupPersonForm.tsx:79-147`.

- [ ] **Step 2: Add `scanIdentitas`** to the parent api client (mirror B2; authenticated).

- [ ] **Step 3: Insert `<IdScanField jenis="KTP">`** in `PickupPersonForm.tsx`, `onApply` → set `nama`.

- [ ] **Step 4: Typecheck + tests**
```bash
pnpm --filter @sekolahpro/parent exec tsc --noEmit && pnpm --filter @sekolahpro/parent test
```

- [ ] **Step 5: Commit**
```bash
git add apps/parent/src/
git commit -m "feat(parent): scan KTP pada form penjemput"
```

---

### Task B7: Full FE verification

- [ ] **Step 1: Generate routes (TanStack) before tsc** (KNOWN GOTCHA: routeTree.gen gitignored)
```bash
pnpm generate || pnpm --filter @sekolahpro/school exec tanstack-router generate
```

- [ ] **Step 2: Monorepo typecheck + lint + tests + build**
```bash
pnpm -r exec tsc --noEmit
pnpm lint
pnpm -r test
pnpm -r build
```
Expected: tsc 0, eslint 0, all vitest green, build ok. (Run sequentially — KNOWN GOTCHA: concurrent builds stall/OOM.)

---

## Phase C — Docs + ship

### Task C1: Update docs

**Files:**
- Modify (BE repo): `docs/implementation-tracker.md` (add OCR feature rows + recalc Summary)
- Create/Modify (BE repo): `docs/domains/ocr/README.html` (fields, rules, Cross-Domain Events: listens — fills siswa/wali/pegawai/calon siswa)
- Modify spec status -> Implemented.

- [ ] **Step 1: Write the domain README + tracker rows** per vernon-dev documentation-standard. Commit:
```bash
git add docs/
git commit -m "docs(ocr): domain README + tracker untuk OCR identitas"
```

### Task C2: PRs (per memory: push branch + gh pr create/merge; main push blocked)

- [ ] **Step 1: BE** — push `feat/ocr-identitas` (sekolahpro), open PR, run `gh pr merge`.
- [ ] **Step 2: Web** — push `feat/ocr-identitas` (sekolahpro-web), open PR, merge.
- [ ] **Step 3: Deploy note** — backend image must include `tesseract-ocr tesseract-ocr-ind` + pip deps; restart backend after merge; verify `tesseract --list-langs` has `ind` in the live container.
- [ ] **Step 4: Cleanup** — delete branches + worktree (`git worktree remove .worktrees/ocr-identitas`).

---

## Self-Review (done)

- **Spec coverage:** engine (A1–A6), doctype+consent+retention (A8,A11), tenant (A9), endpoints authed+guest (A10), upload-guard refactor (A7), deps/blocker (A0), shared component (B1), all 5 forms (B3–B6), tests at every task, docs (C1), deploy (A0,C2). All spec sections mapped.
- **Placeholders:** none — code given for every code step; `<file>`/`<path>` markers are "locate then confirm" instructions, not code placeholders.
- **Type consistency:** `parser.parse(jenis,text)` (A4) used by controller (A8); `proses_ocr()` returns dict used by `api._run_scan` (A10); `IdScanField` props (B1) match `onScan`/`onApply` call sites (B3–B6); `scanIdentitas(post,blob,jenis)` signature consistent across apps.
- **Caveat:** FE field-name maps (B3–B6) assume the Explore-reported form keys; each task says verify against the actual component before relying.
