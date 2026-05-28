# Attendance Station — Phase 1 (Backend Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `sekolahpro/attendance` Frappe module: doctypes, Ed25519 JWT mint/verify, station pairing, online `record_tap`, JWKS, and tests. No PWA, no offline, no derivation, no notifications in this phase.

**Architecture:** New module inside the existing `sekolahpro` Frappe app at `sekolahpro/attendance/`. Standard Frappe doctype + whitelisted-method pattern. JWT signing via PyNaCl (Ed25519). Replay cache via Redis (`frappe.cache()`). Pairing codes via short-lived doctype rows.

**Tech Stack:** Frappe v15 (Python 3.10+), PyNaCl for Ed25519, pytest via `bench run-tests`, Redis (already a Frappe dependency).

---

## Pre-Flight Audit (must complete before Task 1)

`sekolahpro/akademik/doctype/` already contains `absensi_guru`, `absensi_harian`, `absensi_pelajaran`. These are the existing summary tables. This plan does NOT touch them. Phase 7 (Derivation) will wire `Attendance Event` into them. Phase 1 only creates the new doctypes listed below.

## File Structure

**New files (created in this plan):**

- `sekolahpro/attendance/__init__.py` — module marker
- `sekolahpro/attendance/doctype/attendance_station/attendance_station.json` — doctype schema
- `sekolahpro/attendance/doctype/attendance_station/attendance_station.py` — controller
- `sekolahpro/attendance/doctype/attendance_station_pairing/attendance_station_pairing.json`
- `sekolahpro/attendance/doctype/attendance_station_pairing/attendance_station_pairing.py`
- `sekolahpro/attendance/doctype/attendance_card/attendance_card.json`
- `sekolahpro/attendance/doctype/attendance_card/attendance_card.py`
- `sekolahpro/attendance/doctype/attendance_event/attendance_event.json`
- `sekolahpro/attendance/doctype/attendance_event/attendance_event.py`
- `sekolahpro/attendance/services/__init__.py`
- `sekolahpro/attendance/services/jwt_service.py` — Ed25519 mint + verify + JWKS
- `sekolahpro/attendance/services/replay_cache.py` — Redis-backed jti dedup
- `sekolahpro/attendance/services/pairing_service.py` — code gen + claim
- `sekolahpro/attendance/services/tap_service.py` — record_tap business logic
- `sekolahpro/attendance/api/__init__.py`
- `sekolahpro/attendance/api/qr.py` — `mint_qr`, `jwks` whitelisted methods
- `sekolahpro/attendance/api/pairing.py` — `start_pairing`, `claim_pairing`
- `sekolahpro/attendance/api/station.py` — `record_tap`, `heartbeat`, `cards_delta`, `station_config`
- `sekolahpro/attendance/auth.py` — station api_key auth decorator
- `sekolahpro/attendance/constants.py` — named constants (no magic numbers)
- `sekolahpro/attendance/tests/__init__.py`
- `sekolahpro/attendance/tests/test_jwt_service.py`
- `sekolahpro/attendance/tests/test_replay_cache.py`
- `sekolahpro/attendance/tests/test_pairing_service.py`
- `sekolahpro/attendance/tests/test_tap_service.py`
- `sekolahpro/attendance/tests/test_api_qr.py`
- `sekolahpro/attendance/tests/test_api_pairing.py`
- `sekolahpro/attendance/tests/test_api_station.py`
- `sekolahpro/attendance/tests/conftest.py` — fixtures

**Modified files:**

- `sekolahpro/modules.txt` — append `Attendance`
- `sekolahpro/hooks.py` — register scheduler job for pairing-code cleanup
- `pyproject.toml` (sekolahpro) — add `pynacl>=1.5.0` dependency

## Constants (`sekolahpro/attendance/constants.py`)

These must be defined in Task 1 and referenced everywhere. No magic numbers anywhere else.

```python
# JWT
JWT_ISSUER = "sekolahpro"
JWT_AUDIENCE = "attendance-station"
JWT_TTL_SECONDS = 30
JWT_CLOCK_SKEW_SECONDS = 60
JWT_SCHEMA_VERSION = 1
JWT_ALG = "EdDSA"

# Replay cache
REPLAY_CACHE_PREFIX = "att:jti:"
REPLAY_CACHE_TTL_SECONDS = 10 * 60  # 10 minutes

# Pairing
PAIRING_CODE_LENGTH = 8
PAIRING_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no 0/O/1/I
PAIRING_CODE_TTL_SECONDS = 10 * 60

# Tap
TAP_TIMESTAMP_PAST_LIMIT_SECONDS = 24 * 60 * 60  # 24h
TAP_TIMESTAMP_FUTURE_LIMIT_SECONDS = 5 * 60  # 5min
TAP_BATCH_MAX_SIZE = 100

# Station modes
STATION_MODE_GATE = "gate"
STATION_MODE_CLASSROOM = "classroom"
STATION_MODE_EVENT = "event"
STATION_MODES = (STATION_MODE_GATE, STATION_MODE_CLASSROOM, STATION_MODE_EVENT)

# Event types / directions
EVENT_TYPE_GATE = "gate"
EVENT_TYPE_CLASS = "class"
EVENT_TYPE_EVENT = "event"
DIRECTION_IN = "in"
DIRECTION_OUT = "out"

# Methods
METHOD_CARD = "card"
METHOD_QR = "qr"
METHOD_MANUAL = "manual"

# Subjects
SUBJECT_TYPE_SISWA = "Siswa"
SUBJECT_TYPE_GURU = "Guru"
SUBJECT_TYPE_STAFF = "Staff"
SUBJECT_TYPES = (SUBJECT_TYPE_SISWA, SUBJECT_TYPE_GURU, SUBJECT_TYPE_STAFF)

# Tap status
TAP_STATUS_ACCEPTED = "accepted"
TAP_STATUS_REJECTED = "rejected"
TAP_STATUS_DUPLICATE = "duplicate"

# Reject reasons
REJECT_INVALID_SIGNATURE = "invalid_signature"
REJECT_EXPIRED = "expired"
REJECT_REPLAY = "replay"
REJECT_UNKNOWN_CARD = "unknown_card"
REJECT_REVOKED_CARD = "revoked_card"
REJECT_CROSS_SEKOLAH = "cross_sekolah"
REJECT_BAD_TIMESTAMP = "bad_timestamp"
REJECT_NO_ACTIVE_JADWAL = "no_active_jadwal"
```

---

## Task 1: Module skeleton + constants + dependency

**Files:**
- Create: `sekolahpro/attendance/__init__.py` (empty)
- Create: `sekolahpro/attendance/constants.py` (full contents above)
- Create: `sekolahpro/attendance/tests/__init__.py` (empty)
- Modify: `sekolahpro/modules.txt` — append `Attendance` (one line at end)
- Modify: `pyproject.toml` — add `pynacl>=1.5.0` to `[project] dependencies`

- [ ] **Step 1: Create empty `__init__.py` files**

```bash
mkdir -p sekolahpro/attendance/tests sekolahpro/attendance/services sekolahpro/attendance/api sekolahpro/attendance/doctype
touch sekolahpro/attendance/__init__.py sekolahpro/attendance/tests/__init__.py sekolahpro/attendance/services/__init__.py sekolahpro/attendance/api/__init__.py
```

- [ ] **Step 2: Write `sekolahpro/attendance/constants.py`**

Copy the full Constants block from this plan verbatim.

- [ ] **Step 3: Append module entry**

Open `sekolahpro/modules.txt`, append a new line containing exactly `Attendance`.

- [ ] **Step 4: Add PyNaCl dependency**

Open `pyproject.toml`, find `dependencies = [...]` under `[project]`, add `"pynacl>=1.5.0",` to the list.

- [ ] **Step 5: Install + verify**

Run: `bench setup requirements && bench --site test_site migrate`
Expected: no errors; module list shows `Attendance`.

- [ ] **Step 6: Commit**

```bash
git add sekolahpro/attendance sekolahpro/modules.txt pyproject.toml
git commit -m "feat(attendance): module skeleton + constants + pynacl dep"
```

---

## Task 2: JWT service — failing test for mint

**Files:**
- Test: `sekolahpro/attendance/tests/test_jwt_service.py`
- Create (next task): `sekolahpro/attendance/services/jwt_service.py`

- [ ] **Step 1: Write the failing test**

```python
# sekolahpro/attendance/tests/test_jwt_service.py
import time

from sekolahpro.attendance.constants import (
    JWT_AUDIENCE,
    JWT_ISSUER,
    JWT_SCHEMA_VERSION,
    JWT_TTL_SECONDS,
)
from sekolahpro.attendance.services.jwt_service import (
    JwtService,
    generate_keypair,
)


def test_mint_qr_returns_valid_jwt_with_expected_claims():
    private_key, public_key = generate_keypair()
    svc = JwtService(private_key=private_key, key_id="k1")

    before = int(time.time())
    token, exp = svc.mint_qr(subject_type="Siswa", subject_id="STD-0001", sekolah="SEK-001")
    after = int(time.time())

    claims = svc.decode_unverified(token)

    assert claims["iss"] == JWT_ISSUER
    assert claims["aud"] == JWT_AUDIENCE
    assert claims["sub"] == "siswa:STD-0001"
    assert claims["sch"] == "SEK-001"
    assert claims["ver"] == JWT_SCHEMA_VERSION
    assert before <= claims["iat"] <= after
    assert claims["exp"] == claims["iat"] + JWT_TTL_SECONDS
    assert exp == claims["exp"]
    assert "jti" in claims and len(claims["jti"]) >= 16
```

- [ ] **Step 2: Run test, verify it fails**

Run: `bench --site test_site run-tests --module sekolahpro.attendance.tests.test_jwt_service`
Expected: ImportError or ModuleNotFoundError on `jwt_service`.

- [ ] **Step 3: Commit failing test**

```bash
git add sekolahpro/attendance/tests/test_jwt_service.py
git commit -m "test(attendance): failing test for JWT mint"
```

---

## Task 3: JWT service — implement mint

**Files:**
- Create: `sekolahpro/attendance/services/jwt_service.py`

- [ ] **Step 1: Write minimal implementation**

```python
# sekolahpro/attendance/services/jwt_service.py
import base64
import json
import time
import uuid
from dataclasses import dataclass
from typing import Tuple

import nacl.signing

from sekolahpro.attendance.constants import (
    JWT_ALG,
    JWT_AUDIENCE,
    JWT_ISSUER,
    JWT_SCHEMA_VERSION,
    JWT_TTL_SECONDS,
)


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def generate_keypair() -> Tuple[bytes, bytes]:
    signing_key = nacl.signing.SigningKey.generate()
    private_bytes = bytes(signing_key)
    public_bytes = bytes(signing_key.verify_key)
    return private_bytes, public_bytes


@dataclass
class JwtService:
    private_key: bytes
    key_id: str

    def mint_qr(self, subject_type: str, subject_id: str, sekolah: str) -> Tuple[str, int]:
        now = int(time.time())
        claims = {
            "iss": JWT_ISSUER,
            "aud": JWT_AUDIENCE,
            "sub": f"{subject_type.lower()}:{subject_id}",
            "iat": now,
            "exp": now + JWT_TTL_SECONDS,
            "jti": uuid.uuid4().hex,
            "ver": JWT_SCHEMA_VERSION,
            "sch": sekolah,
        }
        header = {"alg": JWT_ALG, "typ": "JWT", "kid": self.key_id}
        signing_input = (
            _b64url(json.dumps(header, separators=(",", ":"), sort_keys=True).encode())
            + "."
            + _b64url(json.dumps(claims, separators=(",", ":"), sort_keys=True).encode())
        )
        sig = nacl.signing.SigningKey(self.private_key).sign(signing_input.encode()).signature
        return signing_input + "." + _b64url(sig), claims["exp"]

    @staticmethod
    def decode_unverified(token: str) -> dict:
        _, payload_b64, _ = token.split(".")
        return json.loads(_b64url_decode(payload_b64))
```

- [ ] **Step 2: Run test, verify it passes**

Run: `bench --site test_site run-tests --module sekolahpro.attendance.tests.test_jwt_service`
Expected: 1 test passing.

- [ ] **Step 3: Commit**

```bash
git add sekolahpro/attendance/services/jwt_service.py
git commit -m "feat(attendance): JWT mint with Ed25519"
```

---

## Task 4: JWT service — failing test for verify

**Files:**
- Modify: `sekolahpro/attendance/tests/test_jwt_service.py`

- [ ] **Step 1: Append tests**

```python
# Append to sekolahpro/attendance/tests/test_jwt_service.py
import pytest

from sekolahpro.attendance.services.jwt_service import (
    InvalidSignatureError,
    TokenExpiredError,
    Verifier,
)


def test_verify_accepts_valid_token():
    priv, pub = generate_keypair()
    svc = JwtService(private_key=priv, key_id="k1")
    token, _ = svc.mint_qr("Siswa", "STD-0001", "SEK-001")

    verifier = Verifier(jwks={"k1": pub})
    claims = verifier.verify(token, now=int(time.time()))

    assert claims["sub"] == "siswa:STD-0001"


def test_verify_rejects_tampered_signature():
    priv, pub = generate_keypair()
    svc = JwtService(private_key=priv, key_id="k1")
    token, _ = svc.mint_qr("Siswa", "STD-0001", "SEK-001")

    head, payload, sig = token.split(".")
    bad_token = ".".join([head, payload, sig[:-2] + "AA"])

    verifier = Verifier(jwks={"k1": pub})
    with pytest.raises(InvalidSignatureError):
        verifier.verify(bad_token, now=int(time.time()))


def test_verify_rejects_expired_token():
    priv, pub = generate_keypair()
    svc = JwtService(private_key=priv, key_id="k1")
    token, exp = svc.mint_qr("Siswa", "STD-0001", "SEK-001")

    verifier = Verifier(jwks={"k1": pub})
    with pytest.raises(TokenExpiredError):
        verifier.verify(token, now=exp + 120)


def test_verify_accepts_within_skew():
    priv, pub = generate_keypair()
    svc = JwtService(private_key=priv, key_id="k1")
    token, exp = svc.mint_qr("Siswa", "STD-0001", "SEK-001")

    verifier = Verifier(jwks={"k1": pub})
    claims = verifier.verify(token, now=exp + 30)  # within 60s skew
    assert claims["sub"] == "siswa:STD-0001"


def test_verify_rejects_unknown_kid():
    priv, _pub = generate_keypair()
    svc = JwtService(private_key=priv, key_id="k1")
    token, _ = svc.mint_qr("Siswa", "STD-0001", "SEK-001")

    _, other_pub = generate_keypair()
    verifier = Verifier(jwks={"k2": other_pub})
    with pytest.raises(InvalidSignatureError):
        verifier.verify(token, now=int(time.time()))
```

- [ ] **Step 2: Run, verify it fails**

Run: `bench --site test_site run-tests --module sekolahpro.attendance.tests.test_jwt_service`
Expected: ImportError on `Verifier`, `InvalidSignatureError`, `TokenExpiredError`.

- [ ] **Step 3: Commit failing test**

```bash
git add sekolahpro/attendance/tests/test_jwt_service.py
git commit -m "test(attendance): failing tests for JWT verify"
```

---

## Task 5: JWT service — implement verify

**Files:**
- Modify: `sekolahpro/attendance/services/jwt_service.py`

- [ ] **Step 1: Append to `jwt_service.py`**

```python
# Append to sekolahpro/attendance/services/jwt_service.py
from dataclasses import field
from typing import Dict

import nacl.exceptions

from sekolahpro.attendance.constants import (
    JWT_AUDIENCE,
    JWT_CLOCK_SKEW_SECONDS,
    JWT_ISSUER,
)


class JwtError(Exception):
    pass


class InvalidSignatureError(JwtError):
    pass


class TokenExpiredError(JwtError):
    pass


class InvalidClaimsError(JwtError):
    pass


@dataclass
class Verifier:
    jwks: Dict[str, bytes] = field(default_factory=dict)
    skew_seconds: int = JWT_CLOCK_SKEW_SECONDS

    def verify(self, token: str, now: int) -> dict:
        try:
            header_b64, payload_b64, sig_b64 = token.split(".")
        except ValueError as e:
            raise InvalidSignatureError("malformed token") from e

        header = json.loads(_b64url_decode(header_b64))
        kid = header.get("kid")
        pubkey = self.jwks.get(kid)
        if pubkey is None:
            raise InvalidSignatureError(f"unknown kid: {kid}")

        signing_input = (header_b64 + "." + payload_b64).encode()
        try:
            nacl.signing.VerifyKey(pubkey).verify(signing_input, _b64url_decode(sig_b64))
        except nacl.exceptions.BadSignatureError as e:
            raise InvalidSignatureError("bad signature") from e

        claims = json.loads(_b64url_decode(payload_b64))

        if claims.get("iss") != JWT_ISSUER:
            raise InvalidClaimsError("bad iss")
        if claims.get("aud") != JWT_AUDIENCE:
            raise InvalidClaimsError("bad aud")
        if now > claims["exp"] + self.skew_seconds:
            raise TokenExpiredError("token expired")

        return claims
```

- [ ] **Step 2: Run tests, verify all pass**

Run: `bench --site test_site run-tests --module sekolahpro.attendance.tests.test_jwt_service`
Expected: 6 tests passing.

- [ ] **Step 3: Commit**

```bash
git add sekolahpro/attendance/services/jwt_service.py
git commit -m "feat(attendance): JWT Ed25519 verify with skew + JWKS"
```

---

## Task 6: Replay cache — failing test

**Files:**
- Test: `sekolahpro/attendance/tests/test_replay_cache.py`

- [ ] **Step 1: Write the failing test**

```python
# sekolahpro/attendance/tests/test_replay_cache.py
import time

from sekolahpro.attendance.services.replay_cache import ReplayCache


def test_first_consume_returns_true():
    cache = ReplayCache()
    assert cache.consume("jti-001", exp=int(time.time()) + 30) is True


def test_second_consume_returns_false():
    cache = ReplayCache()
    cache.consume("jti-002", exp=int(time.time()) + 30)
    assert cache.consume("jti-002", exp=int(time.time()) + 30) is False


def test_distinct_jtis_independent():
    cache = ReplayCache()
    assert cache.consume("jti-a", exp=int(time.time()) + 30) is True
    assert cache.consume("jti-b", exp=int(time.time()) + 30) is True
```

- [ ] **Step 2: Run, verify it fails**

Run: `bench --site test_site run-tests --module sekolahpro.attendance.tests.test_replay_cache`
Expected: ImportError.

- [ ] **Step 3: Commit**

```bash
git add sekolahpro/attendance/tests/test_replay_cache.py
git commit -m "test(attendance): failing tests for jti replay cache"
```

---

## Task 7: Replay cache — implement

**Files:**
- Create: `sekolahpro/attendance/services/replay_cache.py`

- [ ] **Step 1: Write implementation**

```python
# sekolahpro/attendance/services/replay_cache.py
import time

import frappe

from sekolahpro.attendance.constants import (
    REPLAY_CACHE_PREFIX,
    REPLAY_CACHE_TTL_SECONDS,
)


class ReplayCache:
    """Redis-backed first-write-wins jti dedup. SET NX semantics."""

    def __init__(self, prefix: str = REPLAY_CACHE_PREFIX, ttl: int = REPLAY_CACHE_TTL_SECONDS):
        self._prefix = prefix
        self._default_ttl = ttl

    def consume(self, jti: str, exp: int) -> bool:
        key = self._prefix + jti
        ttl = max(self._default_ttl, exp - int(time.time()))
        redis = frappe.cache()
        # set_value uses SETEX; need raw client for NX
        client = redis.connection_pool.connection_kwargs and redis  # frappe.cache() is RedisWrapper
        was_set = redis.set_value(key, "1", expires_in_sec=ttl) if False else None
        # use raw redis client for NX
        raw = frappe.cache().redis if hasattr(frappe.cache(), "redis") else frappe.cache()
        ok = raw.set(name=key, value="1", ex=ttl, nx=True)
        return bool(ok)
```

NOTE: Frappe's `frappe.cache()` returns a `RedisWrapper` which exposes the underlying `redis-py` client. The above is conservative; if `frappe.cache()` directly supports `.set(..., nx=True)`, use it. The test below isolates so impl can be tightened.

- [ ] **Step 2: Simplify implementation to use `frappe.cache()` directly**

Rewrite `consume` body to:

```python
    def consume(self, jti: str, exp: int) -> bool:
        key = self._prefix + jti
        ttl = max(self._default_ttl, exp - int(time.time()))
        client = frappe.cache()
        ok = client.set(name=key, value="1", ex=ttl, nx=True)
        return bool(ok)
```

If `frappe.cache().set(...)` does not accept `nx=`, switch to `client.connection.set(...)` or `client.get_value`/`set_value` with a GET-then-SET guarded by a Lua script. Acceptable fallback: use `redis.Redis` directly from `frappe.conf` config.

- [ ] **Step 3: Run tests, verify pass**

Run: `bench --site test_site run-tests --module sekolahpro.attendance.tests.test_replay_cache`
Expected: 3 tests passing.

- [ ] **Step 4: Commit**

```bash
git add sekolahpro/attendance/services/replay_cache.py
git commit -m "feat(attendance): Redis-backed jti replay cache"
```

---

## Task 8: `Attendance Station` doctype

**Files:**
- Create: `sekolahpro/attendance/doctype/attendance_station/__init__.py` (empty)
- Create: `sekolahpro/attendance/doctype/attendance_station/attendance_station.json`
- Create: `sekolahpro/attendance/doctype/attendance_station/attendance_station.py`

- [ ] **Step 1: Create `attendance_station.json`**

```json
{
 "actions": [],
 "autoname": "format:STN-{####}",
 "creation": "2026-05-29 00:00:00",
 "doctype": "DocType",
 "engine": "InnoDB",
 "field_order": [
  "station_name","mode","location","sekolah","device_fingerprint","station_pubkey",
  "api_key_hash","paired_by","paired_at","status","last_seen"
 ],
 "fields": [
  {"fieldname":"station_name","fieldtype":"Data","label":"Nama Station","reqd":1},
  {"fieldname":"mode","fieldtype":"Select","label":"Mode","options":"gate\nclassroom\nevent","reqd":1},
  {"fieldname":"location","fieldtype":"Data","label":"Lokasi"},
  {"fieldname":"sekolah","fieldtype":"Link","options":"Sekolah","label":"Sekolah","reqd":1},
  {"fieldname":"device_fingerprint","fieldtype":"Data","label":"Device Fingerprint","reqd":1,"unique":1},
  {"fieldname":"station_pubkey","fieldtype":"Long Text","label":"Station Public Key (base64)"},
  {"fieldname":"api_key_hash","fieldtype":"Data","label":"API Key Hash","read_only":1},
  {"fieldname":"paired_by","fieldtype":"Link","options":"User","label":"Paired By","read_only":1},
  {"fieldname":"paired_at","fieldtype":"Datetime","label":"Paired At","read_only":1},
  {"fieldname":"status","fieldtype":"Select","label":"Status","options":"active\nrevoked","default":"active"},
  {"fieldname":"last_seen","fieldtype":"Datetime","label":"Last Seen","read_only":1}
 ],
 "links": [],
 "modified": "2026-05-29 00:00:00",
 "modified_by": "Administrator",
 "module": "Attendance",
 "name": "Attendance Station",
 "owner": "Administrator",
 "permissions": [
  {"role":"System Manager","read":1,"write":1,"create":1,"delete":1,"report":1}
 ],
 "sort_field": "modified",
 "sort_order": "DESC"
}
```

- [ ] **Step 2: Create `attendance_station.py` controller**

```python
# sekolahpro/attendance/doctype/attendance_station/attendance_station.py
from frappe.model.document import Document


class AttendanceStation(Document):
    pass
```

- [ ] **Step 3: Migrate**

Run: `bench --site test_site migrate`
Expected: doctype `Attendance Station` created.

- [ ] **Step 4: Commit**

```bash
git add sekolahpro/attendance/doctype/attendance_station
git commit -m "feat(attendance): Attendance Station doctype"
```

---

## Task 9: `Attendance Station Pairing` doctype

**Files:**
- Create: `sekolahpro/attendance/doctype/attendance_station_pairing/__init__.py` (empty)
- Create: `sekolahpro/attendance/doctype/attendance_station_pairing/attendance_station_pairing.json`
- Create: `sekolahpro/attendance/doctype/attendance_station_pairing/attendance_station_pairing.py`

- [ ] **Step 1: JSON**

```json
{
 "actions": [],
 "autoname": "format:PRG-{####}",
 "creation": "2026-05-29 00:00:00",
 "doctype": "DocType",
 "engine": "InnoDB",
 "field_order": ["code","mode","location","sekolah","expires_at","consumed_by_station","created_by_user"],
 "fields": [
  {"fieldname":"code","fieldtype":"Data","label":"Code","reqd":1,"unique":1},
  {"fieldname":"mode","fieldtype":"Select","label":"Mode","options":"gate\nclassroom\nevent","reqd":1},
  {"fieldname":"location","fieldtype":"Data","label":"Lokasi"},
  {"fieldname":"sekolah","fieldtype":"Link","options":"Sekolah","reqd":1},
  {"fieldname":"expires_at","fieldtype":"Datetime","reqd":1},
  {"fieldname":"consumed_by_station","fieldtype":"Link","options":"Attendance Station"},
  {"fieldname":"created_by_user","fieldtype":"Link","options":"User","reqd":1}
 ],
 "links": [],
 "modified": "2026-05-29 00:00:00",
 "modified_by": "Administrator",
 "module": "Attendance",
 "name": "Attendance Station Pairing",
 "owner": "Administrator",
 "permissions": [{"role":"System Manager","read":1,"write":1,"create":1,"delete":1}],
 "sort_field": "modified",
 "sort_order": "DESC"
}
```

- [ ] **Step 2: Controller**

```python
# sekolahpro/attendance/doctype/attendance_station_pairing/attendance_station_pairing.py
from frappe.model.document import Document


class AttendanceStationPairing(Document):
    pass
```

- [ ] **Step 3: Migrate**

Run: `bench --site test_site migrate`

- [ ] **Step 4: Commit**

```bash
git add sekolahpro/attendance/doctype/attendance_station_pairing
git commit -m "feat(attendance): Attendance Station Pairing doctype"
```

---

## Task 10: `Attendance Card` doctype

**Files:**
- Create: `sekolahpro/attendance/doctype/attendance_card/__init__.py`
- Create: `sekolahpro/attendance/doctype/attendance_card/attendance_card.json`
- Create: `sekolahpro/attendance/doctype/attendance_card/attendance_card.py`

- [ ] **Step 1: JSON**

```json
{
 "actions": [],
 "autoname": "field:uid",
 "creation": "2026-05-29 00:00:00",
 "doctype": "DocType",
 "engine": "InnoDB",
 "field_order": ["uid","subject_type","subject_id","sekolah","issued_at","revoked_at"],
 "fields": [
  {"fieldname":"uid","fieldtype":"Data","label":"Card UID","reqd":1,"unique":1},
  {"fieldname":"subject_type","fieldtype":"Select","label":"Subject Type","options":"Siswa\nGuru\nStaff","reqd":1},
  {"fieldname":"subject_id","fieldtype":"Dynamic Link","options":"subject_type","reqd":1},
  {"fieldname":"sekolah","fieldtype":"Link","options":"Sekolah","reqd":1},
  {"fieldname":"issued_at","fieldtype":"Datetime","default":"now"},
  {"fieldname":"revoked_at","fieldtype":"Datetime"}
 ],
 "links": [],
 "modified": "2026-05-29 00:00:00",
 "modified_by": "Administrator",
 "module": "Attendance",
 "name": "Attendance Card",
 "owner": "Administrator",
 "permissions": [{"role":"System Manager","read":1,"write":1,"create":1,"delete":1}],
 "sort_field": "modified",
 "sort_order": "DESC"
}
```

- [ ] **Step 2: Controller**

```python
# sekolahpro/attendance/doctype/attendance_card/attendance_card.py
from frappe.model.document import Document


class AttendanceCard(Document):
    pass
```

- [ ] **Step 3: Migrate + commit**

```bash
bench --site test_site migrate
git add sekolahpro/attendance/doctype/attendance_card
git commit -m "feat(attendance): Attendance Card doctype"
```

---

## Task 11: `Attendance Event` doctype

**Files:**
- Create: `sekolahpro/attendance/doctype/attendance_event/__init__.py`
- Create: `sekolahpro/attendance/doctype/attendance_event/attendance_event.json`
- Create: `sekolahpro/attendance/doctype/attendance_event/attendance_event.py`

- [ ] **Step 1: JSON**

```json
{
 "actions": [],
 "autoname": "format:AE-{YYYY}-{#######}",
 "creation": "2026-05-29 00:00:00",
 "doctype": "DocType",
 "engine": "InnoDB",
 "field_order": [
  "station","subject_type","subject_id","sekolah","method","direction","event_type",
  "tapped_at","received_at","jti","jadwal_pelajaran","event_ref","status","reject_reason","raw_payload"
 ],
 "fields": [
  {"fieldname":"station","fieldtype":"Link","options":"Attendance Station","reqd":1},
  {"fieldname":"subject_type","fieldtype":"Select","options":"Siswa\nGuru\nStaff"},
  {"fieldname":"subject_id","fieldtype":"Dynamic Link","options":"subject_type"},
  {"fieldname":"sekolah","fieldtype":"Link","options":"Sekolah"},
  {"fieldname":"method","fieldtype":"Select","options":"card\nqr\nmanual","reqd":1},
  {"fieldname":"direction","fieldtype":"Select","options":"in\nout","reqd":1},
  {"fieldname":"event_type","fieldtype":"Select","options":"gate\nclass\nevent","reqd":1},
  {"fieldname":"tapped_at","fieldtype":"Datetime","reqd":1},
  {"fieldname":"received_at","fieldtype":"Datetime","reqd":1},
  {"fieldname":"jti","fieldtype":"Data"},
  {"fieldname":"jadwal_pelajaran","fieldtype":"Data"},
  {"fieldname":"event_ref","fieldtype":"Data"},
  {"fieldname":"status","fieldtype":"Select","options":"accepted\nrejected\nduplicate","reqd":1},
  {"fieldname":"reject_reason","fieldtype":"Data"},
  {"fieldname":"raw_payload","fieldtype":"Long Text"}
 ],
 "links": [],
 "modified": "2026-05-29 00:00:00",
 "modified_by": "Administrator",
 "module": "Attendance",
 "name": "Attendance Event",
 "owner": "Administrator",
 "permissions": [{"role":"System Manager","read":1,"write":1,"create":1,"delete":1,"report":1}],
 "sort_field": "tapped_at",
 "sort_order": "DESC"
}
```

- [ ] **Step 2: Controller**

```python
# sekolahpro/attendance/doctype/attendance_event/attendance_event.py
from frappe.model.document import Document


class AttendanceEvent(Document):
    pass
```

- [ ] **Step 3: Migrate + commit**

```bash
bench --site test_site migrate
git add sekolahpro/attendance/doctype/attendance_event
git commit -m "feat(attendance): Attendance Event raw-log doctype"
```

---

## Task 12: Pairing service — failing test

**Files:**
- Test: `sekolahpro/attendance/tests/test_pairing_service.py`
- Create (next task): `sekolahpro/attendance/services/pairing_service.py`

- [ ] **Step 1: Write tests**

```python
# sekolahpro/attendance/tests/test_pairing_service.py
import time

import frappe
import pytest

from sekolahpro.attendance.constants import (
    PAIRING_CODE_ALPHABET,
    PAIRING_CODE_LENGTH,
    PAIRING_CODE_TTL_SECONDS,
)
from sekolahpro.attendance.services.pairing_service import (
    PairingError,
    PairingService,
)


@pytest.fixture
def sekolah():
    if not frappe.db.exists("Sekolah", "SEK-TEST"):
        frappe.get_doc({"doctype": "Sekolah", "name": "SEK-TEST", "school_name": "Test"}).insert(ignore_permissions=True)
    yield "SEK-TEST"


def test_start_returns_well_formed_code(sekolah):
    svc = PairingService()
    code, expires_at, _scope = svc.start(mode="gate", location="Gerbang Utama", sekolah=sekolah, user="Administrator")
    assert len(code) == PAIRING_CODE_LENGTH
    assert all(c in PAIRING_CODE_ALPHABET for c in code)
    assert expires_at > int(time.time())
    assert expires_at <= int(time.time()) + PAIRING_CODE_TTL_SECONDS + 5


def test_claim_success_returns_station_and_api_key(sekolah):
    svc = PairingService()
    code, _, _ = svc.start(mode="gate", location="Gerbang", sekolah=sekolah, user="Administrator")
    result = svc.claim(code=code, device_fingerprint="fp-001", station_pubkey="base64keyhere")
    assert result["station_id"].startswith("STN-")
    assert len(result["api_key"]) >= 32


def test_claim_rejects_wrong_code(sekolah):
    svc = PairingService()
    with pytest.raises(PairingError):
        svc.claim(code="ZZZZZZZZ", device_fingerprint="fp-002", station_pubkey="x")


def test_claim_rejects_already_consumed(sekolah):
    svc = PairingService()
    code, _, _ = svc.start(mode="gate", location="Gerbang", sekolah=sekolah, user="Administrator")
    svc.claim(code=code, device_fingerprint="fp-003", station_pubkey="x")
    with pytest.raises(PairingError):
        svc.claim(code=code, device_fingerprint="fp-004", station_pubkey="y")


def test_claim_rejects_expired_code(sekolah, monkeypatch):
    svc = PairingService()
    code, _, _ = svc.start(mode="gate", location="Gerbang", sekolah=sekolah, user="Administrator")
    # rewind expires_at
    frappe.db.set_value("Attendance Station Pairing", {"code": code}, "expires_at", "2000-01-01 00:00:00")
    frappe.db.commit()
    with pytest.raises(PairingError):
        svc.claim(code=code, device_fingerprint="fp-005", station_pubkey="x")
```

- [ ] **Step 2: Run, verify fails**

Run: `bench --site test_site run-tests --module sekolahpro.attendance.tests.test_pairing_service`
Expected: ImportError.

- [ ] **Step 3: Commit**

```bash
git add sekolahpro/attendance/tests/test_pairing_service.py
git commit -m "test(attendance): failing tests for pairing service"
```

---

## Task 13: Pairing service — implement

**Files:**
- Create: `sekolahpro/attendance/services/pairing_service.py`

- [ ] **Step 1: Write implementation**

```python
# sekolahpro/attendance/services/pairing_service.py
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Dict, Tuple

import frappe

from sekolahpro.attendance.constants import (
    PAIRING_CODE_ALPHABET,
    PAIRING_CODE_LENGTH,
    PAIRING_CODE_TTL_SECONDS,
    STATION_MODES,
)


class PairingError(Exception):
    pass


def _generate_code() -> str:
    return "".join(secrets.choice(PAIRING_CODE_ALPHABET) for _ in range(PAIRING_CODE_LENGTH))


def _now_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _hash_api_key(api_key: str) -> str:
    return hashlib.sha256(api_key.encode()).hexdigest()


class PairingService:
    def start(self, mode: str, location: str, sekolah: str, user: str) -> Tuple[str, int, Dict]:
        if mode not in STATION_MODES:
            raise PairingError(f"invalid mode: {mode}")
        code = _generate_code()
        expires_at = _now_utc() + timedelta(seconds=PAIRING_CODE_TTL_SECONDS)
        doc = frappe.get_doc({
            "doctype": "Attendance Station Pairing",
            "code": code,
            "mode": mode,
            "location": location,
            "sekolah": sekolah,
            "expires_at": expires_at,
            "created_by_user": user,
        })
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
        return code, int(expires_at.timestamp()), {"mode": mode, "location": location, "sekolah": sekolah}

    def claim(self, code: str, device_fingerprint: str, station_pubkey: str) -> Dict:
        row = frappe.db.get_value(
            "Attendance Station Pairing",
            {"code": code},
            ["name", "mode", "location", "sekolah", "expires_at", "consumed_by_station"],
            as_dict=True,
        )
        if row is None:
            raise PairingError("invalid code")
        if row.consumed_by_station:
            raise PairingError("code already consumed")
        if row.expires_at and row.expires_at < _now_utc():
            raise PairingError("code expired")

        api_key = secrets.token_urlsafe(32)
        station = frappe.get_doc({
            "doctype": "Attendance Station",
            "station_name": f"{row.mode}@{row.location or row.sekolah}",
            "mode": row.mode,
            "location": row.location,
            "sekolah": row.sekolah,
            "device_fingerprint": device_fingerprint,
            "station_pubkey": station_pubkey,
            "api_key_hash": _hash_api_key(api_key),
            "paired_by": row.get("created_by_user") or frappe.session.user,
            "paired_at": _now_utc(),
            "status": "active",
        })
        station.insert(ignore_permissions=True)
        frappe.db.set_value("Attendance Station Pairing", row.name, "consumed_by_station", station.name)
        frappe.db.commit()
        return {"station_id": station.name, "api_key": api_key}
```

- [ ] **Step 2: Run tests, verify pass**

Run: `bench --site test_site run-tests --module sekolahpro.attendance.tests.test_pairing_service`
Expected: 5 tests passing.

- [ ] **Step 3: Commit**

```bash
git add sekolahpro/attendance/services/pairing_service.py
git commit -m "feat(attendance): pairing service (start + claim)"
```

---

## Task 14: Station auth decorator + helper

**Files:**
- Create: `sekolahpro/attendance/auth.py`
- Test: `sekolahpro/attendance/tests/test_auth.py`

- [ ] **Step 1: Write failing test**

```python
# sekolahpro/attendance/tests/test_auth.py
import pytest

from sekolahpro.attendance.auth import (
    AuthError,
    authenticate_station,
)
from sekolahpro.attendance.services.pairing_service import PairingService


@pytest.fixture
def paired_station():
    svc = PairingService()
    code, _, _ = svc.start(mode="gate", location="Gerbang", sekolah="SEK-TEST", user="Administrator")
    result = svc.claim(code=code, device_fingerprint="fp-auth", station_pubkey="pk")
    return result["station_id"], result["api_key"]


def test_authenticate_station_accepts_valid_key(paired_station):
    station_id, api_key = paired_station
    station = authenticate_station(api_key=api_key)
    assert station.name == station_id


def test_authenticate_station_rejects_bad_key():
    with pytest.raises(AuthError):
        authenticate_station(api_key="not-a-real-key")


def test_authenticate_station_rejects_revoked(paired_station):
    import frappe
    station_id, api_key = paired_station
    frappe.db.set_value("Attendance Station", station_id, "status", "revoked")
    frappe.db.commit()
    with pytest.raises(AuthError):
        authenticate_station(api_key=api_key)
```

- [ ] **Step 2: Run, verify fails.**

- [ ] **Step 3: Write implementation**

```python
# sekolahpro/attendance/auth.py
import hashlib
from typing import Any

import frappe


class AuthError(Exception):
    pass


def _hash_api_key(api_key: str) -> str:
    return hashlib.sha256(api_key.encode()).hexdigest()


def authenticate_station(api_key: str) -> Any:
    api_key_hash = _hash_api_key(api_key)
    row = frappe.db.get_value(
        "Attendance Station",
        {"api_key_hash": api_key_hash},
        ["name", "status"],
        as_dict=True,
    )
    if row is None:
        raise AuthError("invalid api key")
    if row.status != "active":
        raise AuthError("station revoked")
    return frappe.get_doc("Attendance Station", row.name)
```

- [ ] **Step 4: Run tests, verify pass. Commit.**

```bash
git add sekolahpro/attendance/auth.py sekolahpro/attendance/tests/test_auth.py
git commit -m "feat(attendance): station api_key auth"
```

---

## Task 15: Test fixtures (`conftest.py`)

**Files:**
- Create: `sekolahpro/attendance/tests/conftest.py`

- [ ] **Step 1: Write fixtures**

```python
# sekolahpro/attendance/tests/conftest.py
import pytest

import frappe


@pytest.fixture(autouse=True, scope="session")
def _frappe_test_site():
    frappe.init(site="test_site")
    frappe.connect()
    yield
    frappe.destroy()


@pytest.fixture
def sekolah():
    name = "SEK-TEST"
    if not frappe.db.exists("Sekolah", name):
        frappe.get_doc({"doctype": "Sekolah", "name": name, "school_name": "Test School"}).insert(ignore_permissions=True)
    frappe.db.commit()
    yield name


@pytest.fixture
def siswa(sekolah):
    name = "STD-TEST-001"
    if not frappe.db.exists("Siswa", name):
        frappe.get_doc({
            "doctype": "Siswa",
            "name": name,
            "nama": "Tes Siswa",
            "sekolah": sekolah,
        }).insert(ignore_permissions=True)
    frappe.db.commit()
    yield name


@pytest.fixture
def attendance_card(siswa, sekolah):
    uid = "CARD-001"
    if not frappe.db.exists("Attendance Card", uid):
        frappe.get_doc({
            "doctype": "Attendance Card",
            "uid": uid,
            "subject_type": "Siswa",
            "subject_id": siswa,
            "sekolah": sekolah,
        }).insert(ignore_permissions=True)
    frappe.db.commit()
    yield uid


@pytest.fixture
def jwt_keypair():
    from sekolahpro.attendance.services.jwt_service import generate_keypair
    yield generate_keypair()
```

- [ ] **Step 2: Run all tests so far, verify still pass.**

```bash
bench --site test_site run-tests --module sekolahpro.attendance.tests
```

- [ ] **Step 3: Commit.**

```bash
git add sekolahpro/attendance/tests/conftest.py
git commit -m "test(attendance): shared fixtures"
```

---

## Task 16: Tap service — failing test (card method)

**Files:**
- Test: `sekolahpro/attendance/tests/test_tap_service.py`
- Create (next task): `sekolahpro/attendance/services/tap_service.py`

- [ ] **Step 1: Write test**

```python
# sekolahpro/attendance/tests/test_tap_service.py
import time

import frappe
import pytest

from sekolahpro.attendance.constants import (
    DIRECTION_IN,
    EVENT_TYPE_GATE,
    METHOD_CARD,
    REJECT_CROSS_SEKOLAH,
    REJECT_REVOKED_CARD,
    REJECT_UNKNOWN_CARD,
    TAP_STATUS_ACCEPTED,
    TAP_STATUS_REJECTED,
)
from sekolahpro.attendance.services.pairing_service import PairingService
from sekolahpro.attendance.services.tap_service import TapService


@pytest.fixture
def gate_station(sekolah):
    svc = PairingService()
    code, _, _ = svc.start(mode="gate", location="Gate", sekolah=sekolah, user="Administrator")
    r = svc.claim(code=code, device_fingerprint="fp-tap", station_pubkey="pk")
    yield frappe.get_doc("Attendance Station", r["station_id"])


def test_card_tap_accepted(gate_station, attendance_card):
    tap = {
        "client_nonce": "n1",
        "method": METHOD_CARD,
        "identifier": attendance_card,
        "direction": DIRECTION_IN,
        "event_type": EVENT_TYPE_GATE,
        "tapped_at": int(time.time()),
    }
    svc = TapService()
    [result] = svc.record_batch(station=gate_station, taps=[tap])
    assert result["status"] == TAP_STATUS_ACCEPTED
    assert result["client_nonce"] == "n1"
    assert frappe.db.exists("Attendance Event", result["attendance_event_id"])


def test_card_tap_unknown_uid_rejected(gate_station):
    tap = {
        "client_nonce": "n2",
        "method": METHOD_CARD,
        "identifier": "DOES-NOT-EXIST",
        "direction": DIRECTION_IN,
        "event_type": EVENT_TYPE_GATE,
        "tapped_at": int(time.time()),
    }
    svc = TapService()
    [result] = svc.record_batch(station=gate_station, taps=[tap])
    assert result["status"] == TAP_STATUS_REJECTED
    assert result["error"] == REJECT_UNKNOWN_CARD


def test_card_tap_revoked_rejected(gate_station, attendance_card):
    frappe.db.set_value("Attendance Card", attendance_card, "revoked_at", "2020-01-01 00:00:00")
    frappe.db.commit()
    tap = {
        "client_nonce": "n3",
        "method": METHOD_CARD,
        "identifier": attendance_card,
        "direction": DIRECTION_IN,
        "event_type": EVENT_TYPE_GATE,
        "tapped_at": int(time.time()),
    }
    svc = TapService()
    [result] = svc.record_batch(station=gate_station, taps=[tap])
    assert result["status"] == TAP_STATUS_REJECTED
    assert result["error"] == REJECT_REVOKED_CARD


def test_cross_sekolah_card_rejected(sekolah, attendance_card):
    # station in different sekolah
    other = "SEK-OTHER"
    if not frappe.db.exists("Sekolah", other):
        frappe.get_doc({"doctype": "Sekolah", "name": other, "school_name": "Other"}).insert(ignore_permissions=True)
        frappe.db.commit()
    svc_p = PairingService()
    code, _, _ = svc_p.start(mode="gate", location="Gate", sekolah=other, user="Administrator")
    r = svc_p.claim(code=code, device_fingerprint="fp-other", station_pubkey="pk")
    station = frappe.get_doc("Attendance Station", r["station_id"])

    tap = {
        "client_nonce": "n4",
        "method": METHOD_CARD,
        "identifier": attendance_card,
        "direction": DIRECTION_IN,
        "event_type": EVENT_TYPE_GATE,
        "tapped_at": int(time.time()),
    }
    svc = TapService()
    [result] = svc.record_batch(station=station, taps=[tap])
    assert result["status"] == TAP_STATUS_REJECTED
    assert result["error"] == REJECT_CROSS_SEKOLAH
```

- [ ] **Step 2: Run, verify fails.**

- [ ] **Step 3: Commit failing tests.**

```bash
git add sekolahpro/attendance/tests/test_tap_service.py
git commit -m "test(attendance): failing tests for tap service (card)"
```

---

## Task 17: Tap service — implement card path

**Files:**
- Create: `sekolahpro/attendance/services/tap_service.py`

- [ ] **Step 1: Write implementation**

```python
# sekolahpro/attendance/services/tap_service.py
import json
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List, Optional

import frappe

from sekolahpro.attendance.constants import (
    METHOD_CARD,
    METHOD_QR,
    REJECT_BAD_TIMESTAMP,
    REJECT_CROSS_SEKOLAH,
    REJECT_EXPIRED,
    REJECT_INVALID_SIGNATURE,
    REJECT_NO_ACTIVE_JADWAL,
    REJECT_REPLAY,
    REJECT_REVOKED_CARD,
    REJECT_UNKNOWN_CARD,
    STATION_MODE_CLASSROOM,
    TAP_BATCH_MAX_SIZE,
    TAP_STATUS_ACCEPTED,
    TAP_STATUS_DUPLICATE,
    TAP_STATUS_REJECTED,
    TAP_TIMESTAMP_FUTURE_LIMIT_SECONDS,
    TAP_TIMESTAMP_PAST_LIMIT_SECONDS,
)


def _now_ts() -> int:
    return int(time.time())


def _from_unix(ts: int) -> datetime:
    return datetime.fromtimestamp(ts, tz=timezone.utc).replace(tzinfo=None)


@dataclass
class TapService:
    def record_batch(self, station, taps: List[Dict]) -> List[Dict]:
        if len(taps) > TAP_BATCH_MAX_SIZE:
            frappe.throw(f"batch too large (max {TAP_BATCH_MAX_SIZE})")
        results = []
        for tap in taps:
            results.append(self._record_one(station, tap))
        frappe.db.commit()
        return results

    def _record_one(self, station, tap: Dict) -> Dict:
        client_nonce = tap.get("client_nonce")
        tapped_at = int(tap["tapped_at"])
        now = _now_ts()
        if tapped_at < now - TAP_TIMESTAMP_PAST_LIMIT_SECONDS or tapped_at > now + TAP_TIMESTAMP_FUTURE_LIMIT_SECONDS:
            return self._reject(station, tap, REJECT_BAD_TIMESTAMP, client_nonce)

        method = tap["method"]
        if method == METHOD_CARD:
            return self._record_card(station, tap, client_nonce)
        if method == METHOD_QR:
            return self._record_qr(station, tap, client_nonce)
        return self._reject(station, tap, f"unknown_method:{method}", client_nonce)

    def _record_card(self, station, tap, client_nonce) -> Dict:
        uid = tap["identifier"]
        card = frappe.db.get_value(
            "Attendance Card",
            {"uid": uid},
            ["subject_type", "subject_id", "sekolah", "revoked_at"],
            as_dict=True,
        )
        if card is None:
            return self._reject(station, tap, REJECT_UNKNOWN_CARD, client_nonce)
        if card.revoked_at:
            return self._reject(station, tap, REJECT_REVOKED_CARD, client_nonce)
        if card.sekolah != station.sekolah:
            return self._reject(station, tap, REJECT_CROSS_SEKOLAH, client_nonce)
        if station.mode == STATION_MODE_CLASSROOM and not tap.get("jadwal_id"):
            return self._reject(station, tap, REJECT_NO_ACTIVE_JADWAL, client_nonce)

        event = self._insert_event(
            station=station,
            subject_type=card.subject_type,
            subject_id=card.subject_id,
            sekolah=card.sekolah,
            tap=tap,
            jti=None,
            status=TAP_STATUS_ACCEPTED,
            reject_reason=None,
        )
        return {"client_nonce": client_nonce, "status": TAP_STATUS_ACCEPTED, "attendance_event_id": event.name}

    def _record_qr(self, station, tap, client_nonce) -> Dict:
        # full QR path implemented in Task 19 (depends on Verifier + ReplayCache)
        return self._reject(station, tap, "qr_not_implemented", client_nonce)

    def _reject(self, station, tap, reason, client_nonce) -> Dict:
        event = self._insert_event(
            station=station,
            subject_type=None,
            subject_id=None,
            sekolah=station.sekolah,
            tap=tap,
            jti=None,
            status=TAP_STATUS_REJECTED,
            reject_reason=reason,
        )
        return {"client_nonce": client_nonce, "status": TAP_STATUS_REJECTED, "attendance_event_id": event.name, "error": reason}

    def _insert_event(self, *, station, subject_type, subject_id, sekolah, tap, jti, status, reject_reason):
        doc = frappe.get_doc({
            "doctype": "Attendance Event",
            "station": station.name,
            "subject_type": subject_type,
            "subject_id": subject_id,
            "sekolah": sekolah,
            "method": tap["method"],
            "direction": tap["direction"],
            "event_type": tap["event_type"],
            "tapped_at": _from_unix(int(tap["tapped_at"])),
            "received_at": _from_unix(_now_ts()),
            "jti": jti,
            "jadwal_pelajaran": tap.get("jadwal_id"),
            "event_ref": tap.get("event_ref"),
            "status": status,
            "reject_reason": reject_reason,
            "raw_payload": json.dumps(tap),
        })
        doc.insert(ignore_permissions=True)
        return doc
```

- [ ] **Step 2: Run tests, verify all card tests pass.**

```bash
bench --site test_site run-tests --module sekolahpro.attendance.tests.test_tap_service
```

- [ ] **Step 3: Commit.**

```bash
git add sekolahpro/attendance/services/tap_service.py
git commit -m "feat(attendance): tap service (card path online)"
```

---

## Task 18: Tap service — failing tests for QR path

**Files:**
- Modify: `sekolahpro/attendance/tests/test_tap_service.py`

- [ ] **Step 1: Append QR tests**

```python
# Append to sekolahpro/attendance/tests/test_tap_service.py
from sekolahpro.attendance.constants import METHOD_QR, REJECT_REPLAY, REJECT_EXPIRED, REJECT_INVALID_SIGNATURE
from sekolahpro.attendance.services.jwt_service import JwtService


def _mint(siswa, sekolah, jwt_keypair, key_id="k1"):
    priv, _ = jwt_keypair
    svc = JwtService(private_key=priv, key_id=key_id)
    return svc.mint_qr("Siswa", siswa, sekolah)


def test_qr_tap_accepted(gate_station, sekolah, siswa, jwt_keypair, monkeypatch):
    _priv, pub = jwt_keypair
    monkeypatch.setattr(
        "sekolahpro.attendance.services.tap_service._get_jwks",
        lambda: {"k1": pub},
    )
    token, _ = _mint(siswa, sekolah, jwt_keypair)
    tap = {
        "client_nonce": "q1",
        "method": METHOD_QR,
        "token": token,
        "direction": "in",
        "event_type": "gate",
        "tapped_at": int(time.time()),
    }
    [result] = TapService().record_batch(station=gate_station, taps=[tap])
    assert result["status"] == TAP_STATUS_ACCEPTED


def test_qr_replay_rejected(gate_station, sekolah, siswa, jwt_keypair, monkeypatch):
    _priv, pub = jwt_keypair
    monkeypatch.setattr(
        "sekolahpro.attendance.services.tap_service._get_jwks",
        lambda: {"k1": pub},
    )
    token, _ = _mint(siswa, sekolah, jwt_keypair)
    tap = {
        "client_nonce": "q2",
        "method": METHOD_QR,
        "token": token,
        "direction": "in",
        "event_type": "gate",
        "tapped_at": int(time.time()),
    }
    svc = TapService()
    [_first] = svc.record_batch(station=gate_station, taps=[tap])
    [second] = svc.record_batch(station=gate_station, taps=[dict(tap, client_nonce="q2b")])
    assert second["status"] == TAP_STATUS_REJECTED
    assert second["error"] == REJECT_REPLAY


def test_qr_expired_rejected(gate_station, sekolah, siswa, jwt_keypair, monkeypatch):
    _priv, pub = jwt_keypair
    monkeypatch.setattr(
        "sekolahpro.attendance.services.tap_service._get_jwks",
        lambda: {"k1": pub},
    )
    token, exp = _mint(siswa, sekolah, jwt_keypair)
    tap = {
        "client_nonce": "q3",
        "method": METHOD_QR,
        "token": token,
        "direction": "in",
        "event_type": "gate",
        "tapped_at": exp + 600,
    }
    # tapped_at within bad-timestamp limits but well past exp+skew
    [result] = TapService().record_batch(station=gate_station, taps=[tap])
    assert result["status"] == TAP_STATUS_REJECTED
    assert result["error"] == REJECT_EXPIRED


def test_qr_bad_signature_rejected(gate_station, sekolah, siswa, jwt_keypair, monkeypatch):
    _priv, _pub = jwt_keypair
    from sekolahpro.attendance.services.jwt_service import generate_keypair
    _, other_pub = generate_keypair()
    monkeypatch.setattr(
        "sekolahpro.attendance.services.tap_service._get_jwks",
        lambda: {"k1": other_pub},
    )
    token, _ = _mint(siswa, sekolah, jwt_keypair)
    tap = {
        "client_nonce": "q4",
        "method": METHOD_QR,
        "token": token,
        "direction": "in",
        "event_type": "gate",
        "tapped_at": int(time.time()),
    }
    [result] = TapService().record_batch(station=gate_station, taps=[tap])
    assert result["status"] == TAP_STATUS_REJECTED
    assert result["error"] == REJECT_INVALID_SIGNATURE
```

- [ ] **Step 2: Run, verify fails (qr_not_implemented).**

- [ ] **Step 3: Commit failing tests.**

```bash
git add sekolahpro/attendance/tests/test_tap_service.py
git commit -m "test(attendance): failing tests for tap service (qr)"
```

---

## Task 19: Tap service — implement QR path

**Files:**
- Modify: `sekolahpro/attendance/services/tap_service.py`

- [ ] **Step 1: Replace `_record_qr` and add `_get_jwks` module-level helper + replay cache**

```python
# Add near top of sekolahpro/attendance/services/tap_service.py
from sekolahpro.attendance.services.jwt_service import (
    InvalidClaimsError,
    InvalidSignatureError,
    TokenExpiredError,
    Verifier,
)
from sekolahpro.attendance.services.replay_cache import ReplayCache


def _get_jwks():
    # Phase 1 default: read keypair from site config (single key id "k1").
    # Real key rotation introduced in later phase.
    import base64
    import frappe
    pub_b64 = frappe.conf.get("attendance_jwt_public_key_b64")
    if not pub_b64:
        return {}
    return {"k1": base64.b64decode(pub_b64)}
```

- [ ] **Step 2: Replace `_record_qr`**

```python
    def _record_qr(self, station, tap, client_nonce) -> Dict:
        token = tap["token"]
        verifier = Verifier(jwks=_get_jwks())
        try:
            claims = verifier.verify(token, now=int(tap["tapped_at"]))
        except InvalidSignatureError:
            return self._reject(station, tap, REJECT_INVALID_SIGNATURE, client_nonce)
        except TokenExpiredError:
            return self._reject(station, tap, REJECT_EXPIRED, client_nonce)
        except InvalidClaimsError:
            return self._reject(station, tap, REJECT_INVALID_SIGNATURE, client_nonce)

        if claims.get("sch") != station.sekolah:
            return self._reject(station, tap, REJECT_CROSS_SEKOLAH, client_nonce)

        cache = ReplayCache()
        if not cache.consume(claims["jti"], exp=int(claims["exp"])):
            return self._reject(station, tap, REJECT_REPLAY, client_nonce)

        subject_kind, subject_id = claims["sub"].split(":", 1)
        subject_type = subject_kind.capitalize()  # siswa -> Siswa

        event = self._insert_event(
            station=station,
            subject_type=subject_type,
            subject_id=subject_id,
            sekolah=station.sekolah,
            tap=tap,
            jti=claims["jti"],
            status=TAP_STATUS_ACCEPTED,
            reject_reason=None,
        )
        return {"client_nonce": client_nonce, "status": TAP_STATUS_ACCEPTED, "attendance_event_id": event.name}
```

- [ ] **Step 3: Test setup — inject a public key for fixtures**

In `conftest.py`, add a session-scoped autouse fixture that sets `frappe.conf["attendance_jwt_public_key_b64"]` to a generated public key, then patch `JwtService` instances to share that key.

Append to `sekolahpro/attendance/tests/conftest.py`:

```python
import base64

import frappe as _frappe
from sekolahpro.attendance.services.jwt_service import generate_keypair as _generate_keypair


@pytest.fixture(scope="session")
def site_jwt_keypair():
    priv, pub = _generate_keypair()
    _frappe.conf["attendance_jwt_public_key_b64"] = base64.b64encode(pub).decode()
    yield priv, pub
```

Update `jwt_keypair` fixture to alias the session one:

```python
@pytest.fixture
def jwt_keypair(site_jwt_keypair):
    yield site_jwt_keypair
```

- [ ] **Step 4: Run tests, verify all pass.**

```bash
bench --site test_site run-tests --module sekolahpro.attendance.tests.test_tap_service
```

- [ ] **Step 5: Commit.**

```bash
git add sekolahpro/attendance/services/tap_service.py sekolahpro/attendance/tests/conftest.py
git commit -m "feat(attendance): tap service QR path (verify + replay)"
```

---

## Task 20: API — `mint_qr` + `jwks` whitelisted methods

**Files:**
- Create: `sekolahpro/attendance/api/qr.py`
- Test: `sekolahpro/attendance/tests/test_api_qr.py`

- [ ] **Step 1: Failing test**

```python
# sekolahpro/attendance/tests/test_api_qr.py
import base64

import frappe
import pytest

from sekolahpro.attendance.api.qr import jwks, mint_qr


def test_mint_qr_returns_token_for_siswa_session(siswa, sekolah, site_jwt_keypair, monkeypatch):
    monkeypatch.setattr(frappe.session, "user", "Administrator")
    # mint_qr is intended for the student session; we pass subject explicitly for tests
    result = mint_qr(subject_type="Siswa", subject_id=siswa)
    assert "token" in result and "exp" in result


def test_jwks_returns_known_kid(site_jwt_keypair):
    out = jwks()
    assert "k1" in out["keys"]
    assert out["keys"]["k1"]["kty"] == "OKP"
```

- [ ] **Step 2: Implement**

```python
# sekolahpro/attendance/api/qr.py
import base64

import frappe

from sekolahpro.attendance.services.jwt_service import JwtService


def _load_private_key() -> bytes:
    priv_b64 = frappe.conf.get("attendance_jwt_private_key_b64")
    if not priv_b64:
        frappe.throw("attendance_jwt_private_key_b64 not configured")
    return base64.b64decode(priv_b64)


def _resolve_subject(subject_type: str | None, subject_id: str | None):
    if subject_type and subject_id:
        return subject_type, subject_id
    # fall back to session user → Siswa link (siswa portal user)
    user = frappe.session.user
    siswa = frappe.db.get_value("Siswa", {"user": user}, "name")
    if siswa:
        return "Siswa", siswa
    frappe.throw("cannot resolve subject from session")


@frappe.whitelist()
def mint_qr(subject_type: str | None = None, subject_id: str | None = None) -> dict:
    s_type, s_id = _resolve_subject(subject_type, subject_id)
    sekolah = frappe.db.get_value(s_type, s_id, "sekolah")
    if not sekolah:
        frappe.throw("subject has no sekolah")
    svc = JwtService(private_key=_load_private_key(), key_id="k1")
    token, exp = svc.mint_qr(subject_type=s_type, subject_id=s_id, sekolah=sekolah)
    return {"token": token, "exp": exp}


@frappe.whitelist(allow_guest=True)
def jwks() -> dict:
    pub_b64 = frappe.conf.get("attendance_jwt_public_key_b64")
    if not pub_b64:
        return {"keys": {}}
    return {
        "keys": {
            "k1": {
                "kty": "OKP",
                "crv": "Ed25519",
                "x": pub_b64,
            }
        }
    }
```

- [ ] **Step 3: Update test `site_jwt_keypair` fixture to also set the private key**

Edit `conftest.py` `site_jwt_keypair` fixture:

```python
@pytest.fixture(scope="session")
def site_jwt_keypair():
    priv, pub = _generate_keypair()
    _frappe.conf["attendance_jwt_private_key_b64"] = base64.b64encode(priv).decode()
    _frappe.conf["attendance_jwt_public_key_b64"] = base64.b64encode(pub).decode()
    yield priv, pub
```

- [ ] **Step 4: Run, verify pass. Commit.**

```bash
git add sekolahpro/attendance/api/qr.py sekolahpro/attendance/tests/test_api_qr.py sekolahpro/attendance/tests/conftest.py
git commit -m "feat(attendance): mint_qr + jwks whitelisted methods"
```

---

## Task 21: API — pairing endpoints

**Files:**
- Create: `sekolahpro/attendance/api/pairing.py`
- Test: `sekolahpro/attendance/tests/test_api_pairing.py`

- [ ] **Step 1: Failing test**

```python
# sekolahpro/attendance/tests/test_api_pairing.py
import frappe

from sekolahpro.attendance.api.pairing import claim_pairing, start_pairing


def test_start_pairing_returns_code(sekolah, monkeypatch):
    monkeypatch.setattr(frappe.session, "user", "Administrator")
    out = start_pairing(mode="gate", location="Gerbang", sekolah=sekolah)
    assert "code" in out and "expires_at" in out


def test_claim_pairing_returns_station_and_key(sekolah, monkeypatch):
    monkeypatch.setattr(frappe.session, "user", "Administrator")
    started = start_pairing(mode="gate", location="Gerbang", sekolah=sekolah)
    out = claim_pairing(code=started["code"], device_fingerprint="fp-api", station_pubkey="pk")
    assert out["station_id"].startswith("STN-")
    assert len(out["api_key"]) >= 32
```

- [ ] **Step 2: Implement**

```python
# sekolahpro/attendance/api/pairing.py
import frappe

from sekolahpro.attendance.services.pairing_service import PairingError, PairingService


@frappe.whitelist()
def start_pairing(mode: str, location: str, sekolah: str) -> dict:
    svc = PairingService()
    try:
        code, expires_at, scope = svc.start(
            mode=mode,
            location=location,
            sekolah=sekolah,
            user=frappe.session.user,
        )
    except PairingError as e:
        frappe.throw(str(e))
    return {"code": code, "expires_at": expires_at, "scope": scope}


@frappe.whitelist(allow_guest=True)
def claim_pairing(code: str, device_fingerprint: str, station_pubkey: str) -> dict:
    svc = PairingService()
    try:
        return svc.claim(code=code, device_fingerprint=device_fingerprint, station_pubkey=station_pubkey)
    except PairingError as e:
        frappe.throw(str(e))
```

- [ ] **Step 3: Run, verify pass. Commit.**

```bash
git add sekolahpro/attendance/api/pairing.py sekolahpro/attendance/tests/test_api_pairing.py
git commit -m "feat(attendance): pairing whitelisted methods"
```

---

## Task 22: API — `record_tap` + `heartbeat` + `station_config` + `cards_delta`

**Files:**
- Create: `sekolahpro/attendance/api/station.py`
- Test: `sekolahpro/attendance/tests/test_api_station.py`

- [ ] **Step 1: Failing test**

```python
# sekolahpro/attendance/tests/test_api_station.py
import time

import frappe
import pytest

from sekolahpro.attendance.api.pairing import claim_pairing, start_pairing
from sekolahpro.attendance.api.station import (
    cards_delta,
    heartbeat,
    record_tap,
    station_config,
)


@pytest.fixture
def paired(sekolah, monkeypatch):
    monkeypatch.setattr(frappe.session, "user", "Administrator")
    started = start_pairing(mode="gate", location="Gate", sekolah=sekolah)
    claim = claim_pairing(code=started["code"], device_fingerprint="fp-api-station", station_pubkey="pk")
    yield claim


def test_record_tap_accepts_card(paired, attendance_card):
    out = record_tap(
        api_key=paired["api_key"],
        taps=[{
            "client_nonce": "x1",
            "method": "card",
            "identifier": attendance_card,
            "direction": "in",
            "event_type": "gate",
            "tapped_at": int(time.time()),
        }],
    )
    assert out["results"][0]["status"] == "accepted"


def test_record_tap_rejects_bad_api_key():
    with pytest.raises(Exception):
        record_tap(api_key="garbage", taps=[])


def test_heartbeat_updates_last_seen(paired):
    heartbeat(api_key=paired["api_key"])
    last = frappe.db.get_value("Attendance Station", paired["station_id"], "last_seen")
    assert last is not None


def test_station_config_returns_scope(paired, sekolah):
    cfg = station_config(api_key=paired["api_key"])
    assert cfg["mode"] == "gate"
    assert cfg["sekolah"] == sekolah


def test_cards_delta_returns_cards(paired, attendance_card):
    out = cards_delta(api_key=paired["api_key"], since=0)
    uids = [c["uid"] for c in out["cards"]]
    assert attendance_card in uids
```

- [ ] **Step 2: Implement**

```python
# sekolahpro/attendance/api/station.py
import json
import time
from typing import List

import frappe

from sekolahpro.attendance.auth import AuthError, authenticate_station
from sekolahpro.attendance.services.tap_service import TapService


def _auth_or_throw(api_key: str):
    try:
        return authenticate_station(api_key=api_key)
    except AuthError as e:
        frappe.throw(str(e), frappe.AuthenticationError)


@frappe.whitelist(allow_guest=True)
def record_tap(api_key: str, taps: List[dict]) -> dict:
    station = _auth_or_throw(api_key)
    if isinstance(taps, str):
        taps = json.loads(taps)
    results = TapService().record_batch(station=station, taps=taps)
    frappe.db.set_value("Attendance Station", station.name, "last_seen", frappe.utils.now_datetime())
    return {"results": results}


@frappe.whitelist(allow_guest=True)
def heartbeat(api_key: str) -> dict:
    station = _auth_or_throw(api_key)
    frappe.db.set_value("Attendance Station", station.name, "last_seen", frappe.utils.now_datetime())
    frappe.db.commit()
    return {"ok": True}


@frappe.whitelist(allow_guest=True)
def station_config(api_key: str) -> dict:
    station = _auth_or_throw(api_key)
    return {
        "station_id": station.name,
        "mode": station.mode,
        "location": station.location,
        "sekolah": station.sekolah,
    }


@frappe.whitelist(allow_guest=True)
def cards_delta(api_key: str, since: int = 0) -> dict:
    station = _auth_or_throw(api_key)
    since_dt = frappe.utils.get_datetime_str(
        frappe.utils.add_to_date(None, seconds=int(since), as_datetime=True)
    ) if since else "1970-01-01 00:00:00"

    cards = frappe.db.get_all(
        "Attendance Card",
        filters={"sekolah": station.sekolah, "modified": [">=", since_dt]},
        fields=["uid", "subject_type", "subject_id", "revoked_at", "modified"],
    )
    return {
        "cards": [c for c in cards if not c["revoked_at"]],
        "revoked": [c["uid"] for c in cards if c["revoked_at"]],
        "cursor": int(time.time()),
    }
```

- [ ] **Step 3: Run, verify pass. Commit.**

```bash
git add sekolahpro/attendance/api/station.py sekolahpro/attendance/tests/test_api_station.py
git commit -m "feat(attendance): station API (record_tap, heartbeat, config, cards_delta)"
```

---

## Task 23: Hooks — scheduled cleanup of expired pairings

**Files:**
- Modify: `sekolahpro/hooks.py`

- [ ] **Step 1: Locate `scheduler_events` in `sekolahpro/hooks.py`**

Find the existing `scheduler_events = {...}` dict. If absent, add it.

- [ ] **Step 2: Add hourly cleanup**

```python
# In sekolahpro/hooks.py — under scheduler_events
scheduler_events = {
    # ... existing entries ...
    "hourly": [
        # ... existing hourly tasks ...
        "sekolahpro.attendance.services.pairing_service.cleanup_expired_pairings",
    ],
}
```

- [ ] **Step 3: Add cleanup function to pairing service**

Append to `sekolahpro/attendance/services/pairing_service.py`:

```python
def cleanup_expired_pairings():
    """Delete pairing rows where expires_at < now AND consumed_by_station is null."""
    frappe.db.delete("Attendance Station Pairing", {
        "expires_at": ["<", _now_utc()],
        "consumed_by_station": ["is", "not set"],
    })
    frappe.db.commit()
```

- [ ] **Step 4: Add test**

Append to `sekolahpro/attendance/tests/test_pairing_service.py`:

```python
def test_cleanup_removes_expired_unconsumed(sekolah):
    from sekolahpro.attendance.services.pairing_service import cleanup_expired_pairings
    svc = PairingService()
    code, _, _ = svc.start(mode="gate", location="X", sekolah=sekolah, user="Administrator")
    frappe.db.set_value("Attendance Station Pairing", {"code": code}, "expires_at", "2000-01-01 00:00:00")
    frappe.db.commit()
    cleanup_expired_pairings()
    assert not frappe.db.exists("Attendance Station Pairing", {"code": code})
```

- [ ] **Step 5: Run, verify pass. Commit.**

```bash
git add sekolahpro/hooks.py sekolahpro/attendance/services/pairing_service.py sekolahpro/attendance/tests/test_pairing_service.py
git commit -m "feat(attendance): hourly cleanup of expired pairings"
```

---

## Task 24: Full-suite run + coverage check

- [ ] **Step 1: Run all attendance tests**

```bash
bench --site test_site run-tests --module sekolahpro.attendance.tests
```

Expected: all green.

- [ ] **Step 2: Linter pass**

```bash
ruff check sekolahpro/attendance
ruff format --check sekolahpro/attendance
```

Fix all reported issues. No lint errors allowed.

- [ ] **Step 3: Coverage**

```bash
bench --site test_site run-tests --module sekolahpro.attendance.tests --coverage
```

Expected: ≥85% on `sekolahpro/attendance/`. If below, add tests for uncovered branches before proceeding.

- [ ] **Step 4: Commit any fix-ups, then tag phase complete**

```bash
git add -A
git commit -m "chore(attendance): phase 1 lint + coverage cleanup" || true
git tag attendance-phase1-complete
```

---

## Done Criteria

- All doctypes created and migrated cleanly.
- `mint_qr`, `jwks`, `start_pairing`, `claim_pairing`, `record_tap`, `heartbeat`, `station_config`, `cards_delta` all whitelisted and tested.
- Card tap path: accepted / unknown / revoked / cross-school cases all covered.
- QR tap path: accepted / replay / expired / invalid-signature cases all covered.
- Pairing: start / claim / consume / expire / cleanup all covered.
- jti replay cache backed by Redis, NX semantics verified.
- ≥85% coverage on `sekolahpro/attendance/`.
- All ruff lint passes.
- No PWA, no offline-batch acceptance window beyond bounds check, no derivation, no notifications — those are Phases 2+.
