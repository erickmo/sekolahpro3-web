# Attendance Station — Design Spec

**Date:** 2026-05-29
**Status:** Approved (brainstorm), pending implementation
**Owner:** mo@intinusa.id

## Summary

A two-part attendance system for sekolahpro:

1. **`sekolahpro/attendance`** — new Frappe module inside the existing `sekolahpro` app. Provides doctypes, JWT signing for student-facing dynamic QR, station pairing, tap recording API, derivation jobs, and notification dispatch.
2. **`sekolahpro-web/apps/attendance_station`** — new PWA package in the `sekolahpro-web` monorepo. Runs on tablets/kiosks/teacher devices. Accepts taps from RFID/NFC cards (HID readers, Web NFC, or external bridge) and from dynamic QR codes displayed in the student app. Supports offline operation.

Three station modes (set at pairing):

- **`gate`** — fixed kiosk at school entry, paired via device-code flow, records gate-in/gate-out.
- **`classroom`** — teacher's personal device, teacher logs in, scoped to their `Jadwal Pelajaran`.
- **`event`** — gate-mode variant, bound to a specific event/ekskul/exam.

## Goals

- Reliable attendance capture at gate and inside classroom from one codebase.
- Card tap (HID, Web NFC, external reader) AND dynamic QR from student app, unified handler.
- Offline-capable card and QR taps with signature verification and replay protection.
- Tracks siswa, guru, and staff.
- Parent/wali push notification on gate events, gated by paid subscription tier.
- Raw event log preserved for audit; summaries derived for reports/UI.

## Non-Goals (this spec)

- Visitor / tamu attendance flow — deferred.
- Geo-fencing or face recognition — deferred.
- Replacing existing `Student Attendance` (if any) — will audit and either extend or supersede during implementation, not redesign here.

## Architecture

```
[Student app] --displays--> [QR JWT] --scan--> [Station PWA] --POST--> [Backend]
[ID Card]     --tap-->      [HID/NFC/ext]   --queue/online-->          [Backend]
                                                                          |
                                                              [Attendance Event] (raw)
                                                                          |
                                                              [Daily Attendance] (summary, derived)
                                                              [Class Attendance] (summary, derived)
                                                                          |
                                                              [Notification dispatch] (if wali tier paid)
```

### Components

- **`sekolahpro/attendance` (Python, Frappe module)**
  - Doctypes (see Data Model)
  - Whitelisted API methods (see API Surface)
  - JWT signing service (Ed25519)
  - JWKS endpoint + key rotation
  - jti replay cache (Redis or doctype-backed)
  - Derivation background jobs (after_insert + scheduled)
  - Notification dispatcher (delegates to existing notification service)

- **`sekolahpro-web/apps/attendance_station` (PWA)**
  - Pairing UI (device-code flow)
  - Teacher login (classroom mode)
  - Tap screen with name + photo + sound confirmation
  - Card adapters: HID keyboard listener, Web NFC, external bridge client
  - QR scanner (camera)
  - Local JWT verifier (Ed25519, cached JWKS)
  - IndexedDB queue (Dexie) + sync worker
  - Service worker for offline shell
  - Admin/diagnostics view (queue inspector, station status)

## Data Model

New doctypes inside `sekolahpro/attendance`:

| Doctype | Purpose | Key fields |
|---|---|---|
| `Attendance Station` | Registered device | name, mode (gate/classroom/event), location/ruang, sekolah, device_fingerprint, station_pubkey, paired_by, paired_at, status (active/revoked), last_seen |
| `Attendance Station Pairing` | One-shot device-code | code (8-char), expires_at, consumed_by_station (nullable), scope (mode + location + sekolah) |
| `Attendance Card` | Card UID → subject mapping | uid (unique), subject_type (Siswa/Guru/Staff), subject_id, issued_at, revoked_at (nullable), sekolah |
| `Attendance Event` | Raw tap log (audit trail) | station, subject_type, subject_id, method (card/qr/manual), direction (in/out), event_type (gate/class/event), tapped_at (client wall clock), received_at (server clock), jti (nullable), raw_payload, jadwal_pelajaran (nullable), event_ref (nullable), status (accepted/rejected/duplicate), reject_reason (nullable) |
| `Daily Attendance` | Derived summary per person/day | subject_type, subject_id, date, sekolah, first_in (nullable), last_out (nullable), gate_status (hadir/terlambat/alpha) |
| `Class Attendance` | Derived per jadwal session | jadwal_pelajaran, date, subject_id, status (hadir/izin/sakit/alpha), in_at (nullable), source (station/manual) |
| `QR Replay Cache` | jti dedup, short retention (~10 min sliding) | jti, exp, consumed_at — may be Redis instead of doctype for perf |

**Existing doctypes referenced (not created):**
`Siswa`, `Guru`, `Staff`, `Jadwal Pelajaran`, `Sekolah`, parent/wali subscription doctype (name TBD during implementation audit).

**Audit pending:** if `sekolahpro/akademik` already has a `Student Attendance` doctype, `Class Attendance` will extend or supersede it rather than duplicate.

## Dynamic QR (JWT) Design

**Issuer:** sekolahpro backend.
**Audience:** `attendance-station`.
**Algorithm:** EdDSA (Ed25519) — fast verify, small keys, station caches public key.

**Claims:**

```json
{
  "iss": "sekolahpro",
  "aud": "attendance-station",
  "sub": "siswa:STD-0001",
  "iat": 1730000000,
  "exp": 1730000030,
  "jti": "uuid-v7",
  "ver": 1,
  "sch": "SEK-001"
}
```

**Lifetime:** `exp - iat = 30s`.

**Student app flow:**

1. Student app already holds long-lived refresh token (existing auth).
2. On the "Show QR" screen, app calls `POST /api/method/sekolahpro.attendance.api.mint_qr` every 25 seconds.
3. Backend mints JWT, invalidates the student's prior live jti, returns `{token, exp}`.
4. App renders `token` as a QR code.

**Station online verify:**

1. Camera decodes QR → JWT string.
2. Station verifies Ed25519 signature using cached JWKS pubkey.
3. Station checks `exp` against local clock with ±60s skew tolerance.
4. Station POSTs tap to `record_tap` with the token.
5. Backend re-verifies signature, re-checks `exp` against `tapped_at`, checks jti not in replay cache, inserts `Attendance Event`, enqueues derivation + notification.

**Station offline verify (mode B3):**

1. Steps 1–3 same — sig + exp checked locally against station clock with ±60s skew.
2. Tap queued to IndexedDB with `tapped_at` (station wall clock).
3. On reconnect, station POSTs queued batch; backend accepts `tapped_at` if within `[now-24h, now+5min]` and signature is valid; jti replay check still enforced server-side.

**Key rotation:** Quarterly. Old keypair kept in JWKS until all live JWTs expire (max `exp + skew`).

## Card Tap Design

**UID sources, all converge on one handler:**

1. **HID reader** — PWA listens to keyboard events on a focused tap screen. Reader types UID + Enter. Inter-keystroke timing is used to distinguish reader (fast) from human (slow); debounce 50ms between chars.
2. **Web NFC** — `NDEFReader.scan()` on Android Chrome reads card serial. One permission prompt per session.
3. **External reader** — PWA accepts UID via a local bridge. Concrete mechanism (loopback HTTP via SW, companion process, or WebSocket to bridge) is deferred to a spike in Phase 5.

**Unified PWA tap handler:**

```
on_card_uid(uid):
  1. lookup uid in local IndexedDB cache (Attendance Card snapshot, synced hourly)
     - hit: get subject_type, subject_id, name, photo
     - miss: if online, query backend; if offline, queue as "unknown_uid" event
  2. determine direction from station mode + last event for subject today
     - gate: toggle in/out based on last gate event
     - classroom: always "in" (out implied at period end)
     - event: always "in"
  3. enqueue Attendance Event {method:card, station, subject, direction, event_type, tapped_at, status:pending}
  4. UI feedback: name + photo + "MASUK" / "PULANG" + sound
  5. flush queue → backend (online) or persist (offline)
```

**Card revocation:** PWA syncs `Attendance Card` deltas every 5 min via `cards/delta?since=`. Revoked cards are rejected at the station with "Kartu dinonaktifkan".

**Anti-spam:** Same UID within 5s on same station = ignored (no event recorded).

## PWA Structure

Path: `sekolahpro-web/apps/attendance_station`.
Stack assumption: React + Vite + TypeScript + Workbox. Will be revised at the start of Phase 2 to match existing `sekolahpro-web/apps/*` packages.

```
apps/attendance_station/
├── src/
│   ├── main.tsx
│   ├── app/
│   │   └── routes/
│   │       ├── pair.tsx           # device-code pairing screen
│   │       ├── login.tsx          # teacher login (classroom mode)
│   │       ├── station.tsx        # main tap screen
│   │       └── admin.tsx          # local diagnostics, queue inspector
│   ├── features/
│   │   ├── auth/                  # pairing + teacher session
│   │   ├── tap/                   # unified tap handler, dedup, direction logic
│   │   ├── card/                  # HID listener, Web NFC reader, external bridge client
│   │   ├── qr/                    # camera scanner + JWT verify (Ed25519 via @noble/curves)
│   │   ├── sync/                  # IndexedDB queue, online detection, flush worker
│   │   ├── cache/                 # card UID → subject snapshot, JWKS cache
│   │   └── ui/                    # name+photo confirm, sounds, sekolah branding
│   ├── lib/
│   │   ├── api.ts                 # backend client
│   │   ├── jwt.ts                 # Ed25519 verify, jti tracking
│   │   ├── db.ts                  # IndexedDB (Dexie)
│   │   └── time.ts                # clock-skew, monotonic clock
│   └── sw.ts                      # service worker, offline shell
└── package.json
```

**Boundaries:**

- `features/tap` does not know HOW the UID arrived. Pure handler over `{source, identifier, payload}`.
- `features/card` and `features/qr` are independent adapters that emit to `tap`.
- `features/sync` owns queue + flush; other features only enqueue.
- `lib/jwt` verifies signatures only — no network, no storage.

## Backend API Surface

All Frappe-whitelisted methods under `sekolahpro.attendance.api.*`.

**Pairing:**

- `POST start_pairing` (admin auth) → `{code, expires_at, scope}`. Admin enters station mode/location to bind the code.
- `POST claim_pairing` (anonymous) `{code, device_fingerprint, station_pubkey}` → `{station_id, api_key, jwks}`. Code is single-use.

**QR mint (student app):**

- `POST mint_qr` (siswa session) → `{token, exp}`. Mints Ed25519 JWT; invalidates student's prior live jti.
- `GET jwks` (anonymous) → public keys list. Cached by station for ~24h.

**Tap recording:**

- `POST record_tap` (station api_key) — batch endpoint
  - Body: `{taps:[{client_nonce, method, identifier|token, direction, event_type, tapped_at, jadwal_id?, event_ref?}, ...]}`
  - Response: `{results:[{client_nonce, status, attendance_event_id?, error?}, ...]}`
  - Server flow per tap: verify JWT (if qr) → lookup card (if card) → check sekolah scope → check jti replay → insert `Attendance Event` → enqueue derivation job

**Station sync:**

- `GET cards/delta?since=<ts>` (station) → `{cards:[...], revoked:[...], cursor}`
- `GET station/config` (station) → mode, location, sekolah, allowed_event_types, schedule policy
- `POST heartbeat` (station) → updates `last_seen`

**Reads:**

Standard Frappe list views / reports over `Attendance Event`, `Daily Attendance`, `Class Attendance`.

**Notification dispatch (internal):**

`Attendance Event.after_insert` → enqueue background job → check subject's wali → check wali subscription tier → if paid AND `event_type=gate` → send push via existing notification service. Service choice (`sekolahpro/notifications` vs `notifikasi`) is decided during Phase 8 audit.

## Derivation Logic

**Trigger:** `Attendance Event.after_insert` enqueues `derive_summaries(event_id)` — Frappe background job, idempotent.

**Daily Attendance (gate events):**

```
on gate event:
  row = upsert(subject, date, sekolah)
  if direction == "in":  row.first_in = min(row.first_in, event.tapped_at)
  if direction == "out": row.last_out = max(row.last_out, event.tapped_at)
  row.gate_status =
    "alpha"     if row.first_in is None
    "hadir"     if row.first_in <= sekolah.jam_masuk
    "terlambat" otherwise
  save
```

**Class Attendance (class events, direction=in):**

```
on class event (direction == "in"):
  jadwal = event.jadwal_pelajaran
  upsert(jadwal, date, subject_id):
    status = "hadir"
    in_at  = event.tapped_at
    source = "station"
```

**Reconciliation (scheduled daily 23:00):**

- `Daily Attendance` rows with no `in` event → mark `alpha`.
- `Class Attendance` rows expected (per jadwal roster) with no station event → mark `alpha`, unless `source == manual`.

**Idempotency:** Keyed on `(subject, date)` for daily, `(jadwal, subject_id)` for class. Re-running derivation on the same event is safe.

**Manual override:** Admin edits `Daily/Class Attendance` directly → `source` flips to `manual`. Subsequent automated derivation skips `manual` rows.

## Security

| Threat | Mitigation |
|---|---|
| QR screenshot replay | Single-use jti; server-side replay cache 10min; exp 30s |
| QR shared between students | exp 30s + only one live jti per siswa (mint invalidates prior) |
| Cloned RFID card | Revocation list synced every 5min; tap screen shows subject photo for operator visual check at gate |
| Stolen station device | api_key bound to device_fingerprint; admin revokes via `Attendance Station` list; station polls config and self-disables on revoke |
| Offline tap forgery | Card path: only known UIDs accepted; QR path: signature still required; server enforces exp + skew on sync |
| Clock skew abuse | `tapped_at` rejected if outside `[now-24h, now+5min]`; live tap skew tolerance 60s |
| Replay attack on offline batch | jti dedup global, first-write-wins |
| Teacher session privilege escalation | classroom-mode taps hard-bound to teacher's `Jadwal Pelajaran` for `now`; cross-class taps rejected |
| HID keylogger spoof | Card input only accepted on focused tap screen; teacher login requires password, not card |
| JWT key compromise | Quarterly rotation; emergency revoke via JWKS removal; max blast radius = 30s + skew |

**Edge cases handled:**

- Card UID matches multiple subjects → reject + log data-integrity error.
- Same UID within 5s on same station → debounce, no event.
- Student forgot card → operator enters manual tap (`method=manual`, `created_by` = operator session).
- Classroom mode + no active jadwal for `now` → reject "Tidak ada jadwal aktif".
- Sekolah scoping → station's `sekolah` claim must match subject's `sekolah`; cross-school rejected.

## Testing Strategy

**Backend (pytest, Frappe test runner):**

- Unit: JWT mint/verify, jti replay, key rotation, card lookup, derivation idempotency, sekolah scoping, classroom-jadwal binding.
- Integration: pairing flow end-to-end, `record_tap` single + batch, offline-batch with skew, manual override + reconciliation.
- Fixtures: 1 sekolah, 3 siswa, 1 guru, 1 staff, 2 stations (gate + classroom), one jadwal active "now".
- Coverage target: >85% on `sekolahpro/attendance/`.

**PWA (vitest + Playwright):**

- Unit: tap handler dedup, direction logic, JWT verify via `@noble/curves`, IndexedDB queue order, clock-skew calc.
- Component: tap confirmation UI (name+photo+sound), pairing screen, teacher login.
- E2E: pairing → tap card → confirmation → backend `Attendance Event` exists; offline → tap → reconnect → flush → server receives correct `tapped_at`.
- Manual test grid: real HID reader, Android device with Web NFC, mocked external bridge.

**Security tests:**

- Replay attack: same JWT twice → second rejected.
- Expired JWT → rejected.
- Cross-school tap → rejected.
- Revoked card → rejected.
- Stolen api_key replay after revoke → rejected.

**Non-functional:**

- Tap-to-confirmation latency target: <500ms online, <100ms offline.
- Backend `record_tap` throughput target: 50 taps/sec/sekolah sustained.

## Phasing

Each phase is its own implementation plan and PR set. `writing-plans` will be invoked for Phase 1 immediately after this spec is approved by the user; later phases are brainstormed in their own sessions.

1. **Backend foundation** — doctypes, JWT mint/verify, pairing, `record_tap` (online only), tests.
2. **PWA core** — pairing screen, HID tap, online flow, tap confirmation UI.
3. **QR flow** — student app `mint_qr` integration, PWA camera scanner + Ed25519 verify.
4. **Offline mode** — IndexedDB queue, sync, clock-skew, jti server-side enforcement on batch.
5. **Web NFC + external bridge** — Android tablet path, loopback HTTP/WebSocket spike.
6. **Classroom mode** — teacher login, jadwal binding, `Class Attendance` derivation.
7. **Derivation + reconciliation** — `Daily/Class Attendance` summaries, scheduled jobs, manual override.
8. **Notifications** — wali tier check, push integration, gate-only triggers.
9. **Event mode + admin polish** — event check-in, station admin list, reports.

## Open Items (resolve during implementation)

- Confirm web stack in `sekolahpro-web/apps/*` (React vs Nuxt vs other) — adjust PWA layout in Phase 2.
- Existing notification service — pick between `sekolahpro/notifications` and `sekolahpro/notifikasi` after audit (Phase 8).
- Confirm wali subscription doctype name (Phase 8).
- Existing `Student Attendance` doctype in `sekolahpro/akademik` — audit; decide whether to extend or supersede with `Class Attendance` (Phase 6/7).
- External reader bridge mechanism — spike in Phase 5 (loopback HTTP via SW vs companion process vs WebSocket).
- Push notification transport (FCM, OneSignal, custom) — match existing wali app (Phase 8).
