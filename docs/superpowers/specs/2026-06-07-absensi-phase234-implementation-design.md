# Absensi Phases 2/3/4 (PWA + QR + Derivation) — Implementation Design

**Date:** 2026-06-07
**Status:** Approved (brainstorm), pending plan
**Owner:** mo@intinusa.id
**Base spec:** `docs/superpowers/specs/2026-05-29-attendance-station-design.md` (read first)
**ADR:** `docs/domains/absensi/ADR/ABS-ADR-0001-attendance-station.md`
**Tracker IDs:** ABS-002 (PWA core), ABS-003 (QR flow), ABS-004 (derivation + reconciliation)

This document is an **implementation-scope addendum** to the approved 2026-05-29
design spec. It does not restate the full architecture — it records the concrete
decisions, repo boundaries, and this-session scope agreed during the 2026-06-07
brainstorm. Where this doc and the base spec differ, this doc wins for these phases.

---

## Decisions taken (delta vs base spec)

### D1 — Derive into EXISTING akademik doctypes (not new Daily/Class Attendance)

The base spec proposed new `Daily Attendance` and `Class Attendance` doctypes.
Decision: **reuse the existing akademik summary doctypes** to avoid duplication and
integrate with the existing school-side absensi UI (`apps/school` `absensi.*` routes
already read these).

| Raw event | Derives into | Detail child |
|---|---|---|
| `event_type=gate` | `Absensi Harian` (rombel, tanggal) | `Detail Absensi Harian` (siswa, status) |
| `event_type=class` | `Absensi Pelajaran` (rombel, mapel, slot, tanggal) | `Detail Absensi Pelajaran` (siswa, status, timestamp) |

Impedance handled in the derivation service:
- gate events are person-centric → resolve `siswa → active rombel` via `Anggota Rombel`.
- `attendance_event.jadwal_pelajaran` is a free `Data` field → resolve to `Slot Jadwal`
  (Link) → derive rombel / mata_pelajaran / guru for the `Absensi Pelajaran` header.
- **Manual-override guard:** never overwrite rows whose header `sumber_input = Manual`.

### D2 — School start time lives on the Sekolah doctype

`jam_masuk` does not exist on `Sekolah` today. Decision: **add two fields to `Sekolah`**,
exported as fixtures:
- `jam_masuk` (Time, default `07:00:00`)
- `toleransi_terlambat` (Int, default `0`, minutes)

`gate_status = hadir` if `first_in <= jam_masuk + toleransi_terlambat`, else `terlambat`;
`alpha` if no `in` event.

### D3 — Reconciliation is light (YAGNI)

Base spec §Reconciliation vs README §YAGNI conflict. Decision: the 23:00 cron only
**finalizes existing derived rows** — derived `Absensi Harian` rows (`sumber_input=Otomatis`)
for today with no `in` event get status `Alpha`. It does NOT auto-create rows for every
enrolled student who never tapped (that heavier roster sweep stays deferred).

---

## Repo boundaries & order

Two repos. Implementation order **C → B → A**, one branch per workstream.

| # | Workstream | Repo | Branch |
|---|---|---|---|
| C | BE derivation (ABS-004) | `sekolahpro` (backend) | `feat/absensi-derivation` |
| B | Student Show-QR (ABS-003) | `sekolahpro-web` | `feat/absensi-student-qr` |
| A | Attendance station PWA (ABS-002 + ABS-003 station) | `sekolahpro-web` | `feat/absensi-pwa-station` |

Both checkouts are shared and stale-prone (concurrent sessions) → use git worktrees
off the respective `origin/main`. ⚠ BE docker-bench reads the **main** checkout, so a
BE worktree is invisible to `bench` — bench-run of pytest is handled at execution time
(implement on a branch reachable by the main checkout, or copy before bench-run).

---

## Workstream C — Backend derivation (`sekolahpro/attendance`)

**New:** `sekolahpro/attendance/services/derivation_service.py`

```
derive_summaries(event_name):
  ev = get Attendance Event
  if ev.status != "accepted": return
  if ev.event_type == "gate":  _derive_daily(ev)
  if ev.event_type == "class": _derive_class(ev)

_derive_daily(ev):                       # gate
  rombel = active rombel of (ev.subject_type, ev.subject_id)   # Anggota Rombel
  if not rombel: return                  # staff/guru at gate → no daily class row (skip)
  header = upsert Absensi Harian(rombel, date(ev.tapped_at))
  if header.sumber_input == "Manual": return            # override guard
  header.sumber_input = "Otomatis"
  row = upsert Detail by siswa
  if ev.direction == "in":
     row.status = "Hadir" if time(ev.tapped_at) <= jam_masuk+toleransi else "Terlambat"
  save (idempotent on (rombel, date, siswa))

_derive_class(ev):                       # class
  slot = resolve Slot Jadwal from ev.jadwal_pelajaran
  if not slot: return
  header = upsert Absensi Pelajaran(slot.rombel, slot.mapel, slot, date)
  if header.sumber_input == "Manual": return
  header.sumber_input = method→{qr:"QR", card:"NFC", manual:"Manual"}
  row = upsert Detail by siswa: status="Hadir", timestamp=ev.tapped_at
  save (idempotent on (slot, date, siswa))
```

**Wiring (`hooks.py`):**
- `doc_events["Attendance Event"]["after_insert"]` → enqueue background job
  `derive_summaries` (Frappe `frappe.enqueue`, idempotent so safe to retry).
- `scheduler_events` cron `"0 23 * * *"` → `reconcile_daily()` (light, per D3).

**Schema (fixtures):**
- `Sekolah`: + `jam_masuk` (Time), + `toleransi_terlambat` (Int).
- `Absensi Harian`: + `sumber_input` (Select `Manual\nOtomatis`, default `Manual`).
- `Detail Absensi Harian`: `status` options gain `Terlambat`.

**Tests (pytest, bench-run via docker):**
- gate → Absensi Harian: hadir / terlambat (threshold) / alpha.
- class → Absensi Pelajaran: hadir + timestamp + sumber_input mapping.
- idempotency: re-running `derive_summaries` on same event = no dup detail.
- manual-override: header `sumber_input=Manual` left untouched.
- `siswa → active rombel` resolution; gate tap by guru/staff → skipped.
- reconcile_daily marks no-in derived rows `Alpha`, leaves Manual rows alone.

**Layering:** logic in `services/derivation_service.py` (pure-ish, deps injected via
`frappe` calls); `hooks.py` only wires events; no business logic in API layer.

---

## Workstream B — Student Show-QR (`apps/student`)

**New:** `apps/student/src/routes/qr.tsx` + nav entry in `__root.tsx`.
- Calls `mint_qr` (whitelisted, already exists) on mount and every **25s**; renders the
  returned JWT as a QR via new dep `qrcode` (encoder; `@zxing/browser` is decode-only).
- Countdown UI to next refresh; handles loading/error.
- **Component test (vitest):** mock the `mint_qr` mutation → assert QR renders, refresh
  timer re-mints, error state shows.

---

## Workstream A — Attendance station PWA (`apps/attendance_station`, NEW package)

Mirrors `apps/merchant` (vite-plugin-pwa) + `apps/student` structure. Port 5185.
Deps: `workspace:*` (ui/api-client/auth/config), `@zxing/browser`, **new** `@noble/curves`
+ `@noble/hashes` (Ed25519 verify), `qrcode` not needed here.

**Pure logic (TDD vitest):**
- `lib/tapHandler.ts` — 5s same-subject debounce; direction (gate toggle in/out from last
  event today; classroom/event always `in`).
- `lib/jwt.ts` — Ed25519 verify via `@noble/curves`, `exp` check with ±60s skew, claim
  validation (iss/aud/sch). No network, no storage.
- `lib/time.ts` — clock-skew calc.
- `lib/api.ts` — station client over `frappeFetch` (record_tap, heartbeat, station_config,
  cards_delta, jwks).
- `lib/cardCache.ts` — uid→subject snapshot in localStorage (IndexedDB queue deferred).

**Thin adapters (manual-tested):**
- `features/card/hidListener.ts` — keystroke inter-key timing → distinguish reader vs human.
- `features/qr/scanner.tsx` — `@zxing/browser` camera decode → `lib/jwt` verify → `tapHandler`.

**Screens (component tests):**
- `routes/pair.tsx` (device-code claim_pairing → store api_key),
- `routes/login.tsx` (teacher classroom session),
- `routes/station.tsx` (tap screen: name + photo + MASUK/PULANG + sound).

**Scope cut (deferred, NOT in 002/003):** IndexedDB offline queue + sync (Phase 4),
Web NFC, external reader bridge, wali notifications (Phase 8). Online-only tap flow.

---

## This-session boundaries

- **Automated coverage:** BE derivation (pytest), student QR (component), PWA pure-logic
  + screens (vitest/component).
- **Manual-only (cannot automate here):** physical HID reader, camera hardware, full
  pairing/tap E2E against live backend.
- **Out of scope:** everything in "Scope cut" above + the akademik↔derived integration
  beyond writing into akademik directly (already covered by D1).

## Doc updates on completion

- `docs/domains/absensi/README.html` — derivation now targets akademik Absensi
  Harian/Pelajaran; note `Sekolah.jam_masuk`.
- `docs/implementation-tracker.md` — ABS-002/003 → Done; ABS-004 → Done (or Partial until
  bench-run green).
- ADR `ABS-ADR-0001` implementation status note.
