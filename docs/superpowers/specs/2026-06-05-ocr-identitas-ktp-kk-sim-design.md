# Design: OCR Identitas (KTP / KK / SIM) for Person Input Forms

- **Date:** 2026-06-05
- **Status:** Approved (brainstorm) — pending spec review
- **Repos:** `sekolahpro` (backend, Frappe) + `sekolahpro-web` (frontend, pnpm monorepo)
- **Task size:** L (new backend module + new doctype + system dependency + cross-app frontend)

## 1. Goal

Let staff/applicants snap a photo of an Indonesian ID document (KTP, Kartu
Keluarga, SIM) and auto-fill person-input forms (student, guardian/wali,
teacher/staff, PPDB applicant, pickup person). User always reviews and edits
the extracted fields before saving.

## 2. Decisions (from brainstorm)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| OCR engine | Self-hosted Tesseract on Frappe backend (`pytesseract`) | $0/scan, image never leaves on-prem server — strongest UU PDP posture for multi-tenant SaaS |
| Image retention | Store private + consent, auto-purge after 30 days | Allows re-verify/audit; retention window bounds PII exposure |
| Forms in scope | Siswa, Wali, Pegawai/Guru, PPDB Calon Siswa, PickupPerson | Full "student / wali / teacher / any person" ask |
| Capture UX | Camera (mobile `getUserMedia`) + file picker (desktop), canvas downscale | Best mobile UX; reuses existing downscale pattern |
| Retention window | `RETENTION_DAYS = 30` | Audit/re-verify window, then auto-delete |
| Module | New Frappe module `OCR` | Cross-cutting; used by siswa/akademik/ppdb |
| Preprocessing deps | Pillow only (no opencv) | Fewer deps; binarize/grayscale/resize sufficient for first cut |

## 3. Privacy / UU PDP

KTP/KK/SIM carry sensitive PII (NIK, alamat, no_kk). Controls:

- Image processed on-prem (Tesseract in backend container); never sent to a
  third party.
- `Pindai Identitas` doctype stores the image as a **private** file
  (`is_private=1`), tenant-scoped (`sekolah` + `organisasi`).
- Sensitive fields (`raw_text`, `hasil_json`, `nik_terdeteksi`) are
  `permlevel: 2` (same level as existing `Siswa.nik` / `Siswa.no_kk`).
- Explicit consent checkbox required in the UI before any scan; consent
  timestamp recorded on the doctype.
- Auto-purge scheduler deletes records (and their private image) after
  `RETENTION_DAYS`.
- Extracted fields land in **editable** form inputs; nothing is persisted to a
  person record without the operator reviewing and saving the form.

## 4. Architecture

### 4.1 Backend — `sekolahpro` app, new module `OCR`

```
sekolahpro/ocr/
  __init__.py
  api.py                         # whitelist HTTP entrypoints (each <= 10 lines)
  doctype/pindai_identitas/      # audit + consent + retention record
    pindai_identitas.json
    pindai_identitas.py          # controller: proses_ocr(), validate()
  engine/
    __init__.py
    preprocess.py                # Pillow: grayscale / autocontrast / resize / binarize (pure)
    tesseract.py                 # pytesseract wrapper: image bytes -> (text, confidence) (pure)
    parser.py                    # parse_ktp / parse_kk / parse_sim : text -> dict (pure)
    constants.py                 # RETENTION_DAYS, regex patterns, field maps, doc-type keys
```

Hooks-first compliance:
- OCR orchestration is a **controller method** on `Pindai Identitas`
  (`proses_ocr`) — Priority 1, not a standalone service module.
- `engine/*` modules are **pure utilities** (bytes/text -> dict, no DB, no
  session) — Priority 6; reused by the controller + unit tests, doc-commented
  why they are not controller methods (pure, testable without DB).
- Retention is a `scheduler_events` hook — Priority 3.

### 4.2 Doctype `Pindai Identitas` (Identity Scan)

Anchored, tenant-scoped doctype.

| Field | Type | Notes |
|-------|------|-------|
| `naming_series` | Data | `PINDAI-.YYYY.-.#####` |
| `jenis_dokumen` | Select | `KTP` / `KK` / `SIM`; required |
| `file_dokumen` | Attach Image | private (`is_private=1`) |
| `status` | Select | `Diproses` / `Berhasil` / `Gagal` |
| `confidence` | Float | mean Tesseract word confidence 0–100 |
| `raw_text` | Long Text | permlevel 2 |
| `hasil_json` | Code (JSON) | parsed dict; permlevel 2 |
| `nik_terdeteksi` | Data | permlevel 2 |
| `consent_diberikan` | Check | required = 1 before processing |
| `consent_timestamp` | Datetime | set when consent given |
| `hapus_setelah` | Date | retention purge date |
| `uploaded_by` | Link User | read-only, = session user |
| `sekolah` | Link Sekolah | tenant anchor |
| `organisasi` | Link Organisasi | tenant anchor (fetch from sekolah) |

Controller `pindai_identitas.py`:
- `proses_ocr()` — load `file_dokumen` bytes -> `preprocess` -> `tesseract` ->
  `parser.parse_<jenis>` -> store `raw_text` / `hasil_json` / `confidence` /
  `nik_terdeteksi`, set `status`, return parsed dict.
- `validate()` — set `hapus_setelah = nowdate() + RETENTION_DAYS`; require
  `consent_diberikan`.

Registration:
- Add `Pindai Identitas` to `tenant_registry.py DOCTYPES['SCHOOL']`
  (KNOWN GOTCHA: new anchored doctypes silently leak across tenants if omitted).
- `before_insert` global hook already auto-sets tenant fields.

### 4.3 Endpoints — `sekolahpro/ocr/api.py`

- `scan_identitas(jenis, filename, filedata, mime_type)` — `@frappe.whitelist()`,
  authenticated (school/parent apps). Validate MIME + size -> create
  `Pindai Identitas` -> `doc.proses_ocr()` -> return
  `{scan_id, fields, confidence, jenis}`.
- `scan_identitas_publik(turnstile_token, jenis, filename, filedata, mime_type)`
  — `@frappe.whitelist(allow_guest=True)` for the public PPDB forms; adds
  rate-limit + Turnstile, otherwise identical.

Each entrypoint stays <= 10 lines, delegating to the controller.

### 4.4 Shared upload guard refactor (in-scope)

`_check_rate_limit`, `_validate_turnstile`, `ALLOWED_UPLOAD_MIME`,
`MAX_UPLOAD_BYTES` currently live in `ppdb/api/ppdb.py`. Extract to
`sekolahpro/utils/upload_guard.py`; `ppdb.py` and `ocr/api.py` both import from
there. Targeted improvement justified because the new guest endpoint reuses
them — no unrelated refactoring.

### 4.5 Parsers (`engine/parser.py`)

Indonesian ID layouts, regex + label-anchored line parsing:

- **KTP** -> `nik`, `nama`, `tempat_lahir`, `tanggal_lahir`, `jenis_kelamin`,
  `alamat`, `rt_rw`, `kel_desa`, `kecamatan`, `agama`, `status_perkawinan`,
  `pekerjaan`, `kewarganegaraan`.
- **KK** -> `no_kk`, `alamat`, `rt_rw`, `desa_kelurahan`, `kecamatan`,
  `kabupaten_kota`, `provinsi`, `kode_pos`, **`anggota[]`** (each: `nik`,
  `nama`, `jenis_kelamin`, `tempat_lahir`, `tanggal_lahir`, `agama`,
  `pendidikan`, `pekerjaan`, `status_hubungan`). A KK scan can fill the student
  plus both parents in a single pass.
- **SIM** -> `nama`, `alamat`, `tempat_lahir`, `tanggal_lahir`, `no_sim`,
  `nik` (only newer SIM print NIK).

Each parser returns a `dict`; missing fields are omitted (never guessed).
NIK validated as 16 digits; dates normalized to `YYYY-MM-DD`.

### 4.6 Retention scheduler

`hooks.py scheduler_events["daily"]` -> `sekolahpro.ocr.api.purge_kadaluarsa`:
delete `Pindai Identitas` where `hapus_setelah < today` (Frappe deletes the
linked private file with the doc).

### 4.7 Frontend — shared scanner + per-form mapping

**Shared component** (`packages/ui`) `<IdScanField>` — API-agnostic:
- Buttons: "📷 Foto KTP" (mobile `getUserMedia` live capture) + "📁 Pilih file"
  (desktop file picker; `accept=image/*`).
- Canvas downscale before upload (reuse the existing 1 MB / JPEG-0.8 pattern
  from `BeritaAcaraPhotoCapture`).
- Consent checkbox shown before scan is enabled.
- Review panel after scan: parsed fields list + confidence badge +
  "Terapkan ke formulir" button.
- Props: `jenis`, `onScan(blob, jenis) => Promise<fields>` (injected per app),
  `onApply(fields)` (parent maps to its form state). Keeps the component free
  of any app's API client. Uses `Modal` / `Button` from `@sekolahpro/ui`.
  - NOTE: any package consuming `@sekolahpro/ui` source must declare `react-dom`
    (Modal uses `createPortal`) — KNOWN GOTCHA; verify each app's deps.

**Per-app API wiring** (each app's own api-client):
- `apps/school` (Siswa, Wali, Pegawai/Staff) + `apps/parent` (PickupPerson) ->
  `scan_identitas` (authenticated).
- `apps/situs` (PPDB `PpdbForm`) + `apps/landing` PPDB wizard ->
  `scan_identitas_publik` (guest + Turnstile).

**Per-form mapping functions** (parsed dict -> that form's field names):
- `SiswaForm` (KTP of adult student or KK row) -> nama_lengkap, nik, jenis
  kelamin, tempat/tanggal lahir, agama, alamat.
- `WaliModal` (KTP of parent / KK rows) -> nama, nik_ayah/nik_ibu, pekerjaan,
  pendidikan, alamat. A KK scan offers "isi data wali dari KK".
- `PegawaiFormModal` / `StaffFormModal` (KTP/SIM) -> nama_lengkap, nik,
  tempat/tanggal lahir, jenis kelamin, agama, alamat.
- `PpdbForm` / landing steps (KK/KTP) -> applicant + parent fields.
- `PickupPersonForm` (KTP/SIM) -> nama, (phone left manual).

## 5. Deployment dependency (BLOCKER)

The backend container currently has **no** `tesseract` binary and **no**
`pytesseract` / `Pillow`. Both are required.

- Python deps -> add `pytesseract` + `Pillow` to `sekolahpro` packaging
  (`pyproject.toml` / `requirements.txt`) so `bench setup requirements`
  installs them.
- System binary -> add to the backend Docker image build:
  `apt-get install -y tesseract-ocr tesseract-ocr-ind` (durable, in
  Dockerfile / compose override per existing docker setup).
- Dev bootstrap -> provide a one-time runtime install command so the current
  dev container works before the image is rebuilt.

The feature is non-functional until the binary + `ind` language data are
present. Plan must verify `tesseract --list-langs` includes `ind`.

## 6. Testing (L: unit + integration + acceptance)

- **BE parser unit tests** — synthetic KTP/KK/SIM **raw-text** fixtures (NOT
  real ID images — privacy) under `tests/testdata/ocr/`; assert parsed dicts,
  NIK validation, date normalization, KK multi-member extraction.
- **BE controller + endpoint tests** — MIME/size rejection, rate-limit,
  Turnstile, guest vs authed, tenant scoping, consent-required, retention
  purge.
- **FE vitest** — `<IdScanField>` (mock `onScan`), each per-form mapping
  function, RTL render + consent-gate behavior.
- **Acceptance** — manual scan of a real KTP in dev (documented in the plan,
  image not committed).

## 7. Out of scope (YAGNI)

- Third-party / cloud OCR providers.
- Face-match / liveness / KTP authenticity verification.
- Passport / KIA / Akta Kelahiran parsing (KTP/KK/SIM only this cut).
- Bulk multi-document scanning.

## 8. Open risks

- Tesseract accuracy on low-quality phone photos -> mitigated by preprocessing
  + mandatory user review; confidence badge flags low-confidence scans.
- KK layout variance across Dukcapil templates -> parser tolerant, omits
  uncertain fields rather than guessing.
- Docker image rebuild required to ship the binary durably.
