# Pickup Verification — Design Spec

**Date:** 2026-05-29
**Status:** Approved
**Owner:** Frontend (parent + school apps); backend contract documented for backend team

## Goal

Prevent unauthorized pickup of students. Verify that whoever collects a child at the school gate is on the parent-approved pickup list, with cryptographic assurance (rotating QR) and a PIN fallback. Audit every attempt.

## Scope

In:
- Parent app surface (`/pickup`) for rotating QR display + delegate management.
- School staff app surface (`/pickup-verify`) for scanning QR / PIN entry / release confirmation.
- Backend contract under `sekolahpro.api.pickup.*` plus two new Frappe doctypes (`Pickup Person`, `Pickup Event`).
- Tier-gated real-time parent confirmation (paid tier only); free tier auto-approves but still logs.

Out (MVP):
- Native push notifications (rely on app foreground + polling).
- Face recognition / liveness detection.
- Geofencing.
- Multi-parent shared delegate management.
- Desk override flow for locked-out PIN attempts.

## Trust Model

Server-signed short-lived tokens. The parent app never has signing material — every QR comes from the backend. Backend stores a `jti` for every minted token; consuming a token records the `jti` so replay within the 30s window fails with `token_consumed`.

PIN: bcrypt-hashed per `Pickup Person`. Rate limited per person: 3 attempts per 15 minutes; further attempts return `pin_locked`. PIN reset goes through parent-only flow (parent re-sets, never reads existing hash).

Authorization on every method derives parent from `frappe.session.user`. Staff methods check `Sekolah Staff` or `Satpam` role on `frappe.session.user`. The app never passes parent IDs.

## Data Model

### Doctype: `Pickup Person`

| Field | Type | Notes |
|---|---|---|
| `name` | string | Frappe primary key |
| `nis` | Link → `Siswa` | child this person is authorized for |
| `nama` | Data | display name |
| `hubungan` | Select | `Wali`, `Orang Tua`, `Kakek-Nenek`, `Driver`, `Lainnya` |
| `phone` | Phone | required |
| `photo_url` | Attach Image | optional |
| `pin_hash` | Password | bcrypt hash; never returned by API |
| `is_active` | Check | soft delete via `is_active=false` |
| `created_by` | Link → User | parent who registered |

One `Pickup Person` is automatically created for each parent on first `list_children` call: `nama = parent.full_name`, `hubungan = "Orang Tua"`, `is_active = true`, `pin_hash = null` (parent uses QR — PIN optional, settable later).

### Doctype: `Pickup Event`

| Field | Type | Notes |
|---|---|---|
| `name` | string | Frappe PK |
| `nis` | Link → `Siswa` | |
| `pickup_person` | Link → `Pickup Person` | |
| `method` | Select | `qr` \| `pin` |
| `status` | Select | `pending` \| `approved` \| `declined` \| `completed` \| `expired` |
| `requested_at` | Datetime | server time of scan/verify |
| `confirmed_at` | Datetime | when parent approved (or auto on free tier) |
| `completed_at` | Datetime | when staff hit Lepaskan |
| `verified_by` | Link → User | staff session user |
| `gate` | Data | optional gate label staff selects |
| `note` | Text | required when `declined` |

### Token shape

HMAC-SHA256 over canonical JSON `{nis, pickup_person_id, jti, exp}` with server secret `PICKUP_TOKEN_SECRET`. `exp` = `now + 30s`. Encoded as base64url(`payload.signature`). QR contents = raw token string.

## Backend API

All methods whitelisted under `sekolahpro.api.pickup.*`.

| Method | Args | Returns | Authorization |
|---|---|---|---|
| `list_pickup_persons` | `{nis}` | `Array<PickupPerson>` (no `pin_hash`) | parent of `nis` |
| `create_pickup_person` | `{nis, nama, hubungan, phone, photo_url?, pin}` | `PickupPerson` | parent of `nis`; bcrypts PIN |
| `update_pickup_person` | `{id, nama?, hubungan?, phone?, photo_url?, pin?}` | `PickupPerson` | `created_by == session.user` |
| `revoke_pickup_person` | `{id}` | `{ok: true}` | `created_by == session.user`; soft delete |
| `issue_pickup_token` | `{nis, pickup_person_id}` | `{token, exp_iso}` | parent of `nis`; `pickup_person.is_active` |
| `staff_scan_token` | `{token, gate?}` | `PickupEvent` | staff role; verifies HMAC + exp + jti unused |
| `staff_verify_pin` | `{nis, pickup_person_id, pin, gate?}` | `PickupEvent` | staff role; bcrypt compare + rate limit |
| `staff_complete_pickup` | `{event_id, note?}` | `PickupEvent` | staff role; event must be `approved` (or `pending` on free tier) |
| `staff_decline_pickup` | `{event_id, note}` | `PickupEvent` | staff role; sets `status=declined` |
| `parent_respond_pickup` | `{event_id, decision: "approve" \| "decline"}` | `PickupEvent` | parent of event.nis; event must be `pending`; sets `confirmed_at` |
| `list_pickup_events` | `{nis?, since_iso?}` | `Array<PickupEvent>` | parent of nis |

Tier gating: backend reads `tenant.features` (existing array on tenant doctype). If `pickup_realtime_notify` present **and** parent's subscription tier is `paid` (existing flag on parent user — confirm with backend team), the scan/verify methods create event as `status=pending`. Otherwise immediately `status=approved` with `confirmed_at = now`.

Errors (HTTP 400 with payload `{error_code, message}`):
- `token_expired`, `token_invalid`, `token_consumed`
- `pin_invalid`, `pin_locked`
- `person_revoked`, `person_not_found`
- `not_authorized`, `event_not_pending`

## Parent App

### Route: `apps/parent/src/routes/pickup.tsx`

Tabs (top-level): **QR** | **Daftar Penjemput**

#### Tab: QR

- `PageHeader` title `"Penjemputan"`, subtitle child name + kelas.
- Delegate selector — `<select>` of active `Pickup Person` for the child; default = the auto-created self entry.
- QR display:
  - Backend call: `useIssuePickupToken(nis, personId)` mutation.
  - Auto-refresh: when token expires in <5s, re-issue. Implementation: `useEffect` with `setTimeout` keyed by `exp_iso`.
  - Render with `qrcode.react` (or `qrcode` npm package + `<canvas>`).
  - Below QR: monospace last-6 chars of token + countdown (e.g., `Kode: A4F2 · 23 detik`).
- Tier banner: if a `Pickup Event` for the active child is `status=pending`, show top card with **Setujui** / **Tolak** buttons calling `parentRespondPickup`. Polling: `useQuery` on `list_pickup_events({nis, since_iso})` with `refetchInterval: 3000` while screen mounted.

#### Tab: Daftar Penjemput

- List from `useListPickupPersons(nis)`.
- Each row: name, hubungan, phone, photo thumbnail, `[Edit]` `[Cabut]`.
- `+ Tambah penjemput` button → `<Dialog>` form (use existing UI Dialog or build inline modal):
  - `nama` (required)
  - `hubungan` (Select with the 5 options)
  - `phone` (required)
  - `photo_url` (Frappe File upload — see existing patterns in school app)
  - `pin` (6 digit numeric, masked, with strength hint: prevent `000000`/`123456`)
  - Submit → `createPickupPerson`
- Edit dialog same shape; PIN field optional (leaves existing hash if blank).
- `Cabut` → confirm dialog → `revokePickupPerson`.

### Hooks (`apps/parent/src/data/`)

```ts
useListPickupPersons(nis)             // GET-equivalent + mock fallback
useCreatePickupPerson()                // mutation
useUpdatePickupPerson()                // mutation
useRevokePickupPerson()                // mutation
useIssuePickupToken(nis, personId)     // mutation, returns {token, expIso}
useListPickupEvents(nis, sinceIso?)    // useFrappeMethod with refetchInterval option
useParentRespondPickup()               // mutation
```

Mock fallback: gated by `VITE_USE_MOCKS=true` consistent with rest of parent app. Mock token: fake HMAC string, `exp = now + 30s`.

### Sidebar

Add `Penjemputan` item in `__root.tsx` SidebarNav, icon `IconShield` (or `IconCheck` if no shield).

## School Staff App

### Route: `apps/school/src/routes/$sekolah.pickup-verify.tsx`

Single-screen station UI.

- `PageHeader` `"Verifikasi Penjemputan"` + tenant brand.
- Camera scanner panel (left half):
  - `<video>` element with `navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })`.
  - Use `BarcodeDetector` if available, else fallback to `@zxing/browser` (`BrowserQRCodeReader`).
  - When QR detected → call `useStaffScanToken({ token, gate })` where `gate` taken from a `<select>` of preset gates (`"Gerbang Utama"`, `"Gerbang Belakang"`, `"Lobi"`).
- PIN fallback form (right half):
  - `nis` input → triggers `useFrappeMethod("sekolahpro.api.pickup.staff_list_persons_for_nis", { nis })` (alt: reuse `list_pickup_persons` with staff role and explicit nis).
  - person dropdown
  - PIN input
  - Submit → `useStaffVerifyPin`

- On event returned from either path:
  - If `status === "pending"` (paid tier): show "Menunggu konfirmasi orang tua…" with spinner. Poll `list_pickup_events({nis: event.nis, since_iso: event.requested_at})` every 2s; when same event flips to `approved`, enable Lepaskan; if `declined`, show red banner.
  - If `status === "approved"`: show release card immediately.
  - Release card shows: child photo + name + kelas; pickup person nama + hubungan + photo + phone.
  - Actions: `[Lepaskan Siswa]` → `staffCompletePickup`; `[Tolak / Catat insiden]` → opens note dialog → `staffDeclinePickup`.
- After complete: success toast, auto-reset to scanner state after 5s.

### Hooks (`apps/school/src/data/pickup.ts`)

```ts
useStaffScanToken()        // mutation
useStaffVerifyPin()        // mutation
useStaffCompletePickup()   // mutation
useStaffDeclinePickup()    // mutation
useStaffWatchEvent(eventId) // useQuery refetchInterval 2000 while pending
```

### Sidebar / nav

Add `Verifikasi Penjemputan` to school app sidebar — visible only when session has role `Sekolah Staff` or `Satpam`.

## Error Handling

| App | Error code | UX |
|---|---|---|
| Both | `token_expired` | "Kode sudah kedaluwarsa. Minta orang tua segarkan QR." |
| School | `token_consumed` | "Kode sudah pernah dipakai. Gunakan PIN sebagai cadangan." |
| School | `pin_invalid` | "PIN salah. Sisa percobaan: N." |
| School | `pin_locked` | "PIN terkunci. Hubungi orang tua atau gunakan QR." |
| School | `person_revoked` | "Penjemput sudah dicabut hak aksesnya. Tolak pelepasan." |
| Parent | `event_not_pending` | "Penjemputan sudah ditangani. Cek log." |

All other errors → generic "Terjadi kesalahan, coba lagi." with the error code in dev console.

## Security Notes

- Server secret `PICKUP_TOKEN_SECRET` lives in Frappe site config, never on client.
- QR token includes nothing parseable by client — opaque base64url. Even if leaked, expires in 30s and is single-use via `jti`.
- PIN never returned by any API. Storage: bcrypt cost 12.
- All staff methods require role check; missing role → 403.
- Audit: every `staff_scan_token` / `staff_verify_pin` creates a `Pickup Event` row, even on failure (fail rows have `status=declined` and `note` describes the failure reason). Backend team confirms this is acceptable; if not, log failed attempts to separate `Pickup Audit` row instead. **Decision deferred to backend team.**

## Testing

### Parent app

- Unit: `PickupPersonForm` validates required fields + PIN length (6 digits, not common weak codes).
- Unit: `QRCountdown` correctly schedules refresh at exp - 5s.
- Integration: clicking Setujui on pending event calls `parent_respond_pickup` and clears banner.

### School app

- Unit: `PinFallbackForm` shows correct error per `error_code`.
- Integration (mock-backed): scan path → pending → poll flips to approved → Lepaskan enables → complete toast shows.
- Integration: decline flow requires note before submit.

### Backend (out of scope for plan, list contract)

Backend team writes unit tests for: HMAC sign/verify, jti replay rejection, PIN bcrypt + lockout, role authorization, tier gating branch.

## Open Questions (non-blocking)

- Exact parent-tier field on backend — confirm with backend team. Frontend reads `tenant.features.includes("pickup_realtime_notify")` for now.
- Whether to store failed attempts as `Pickup Event` rows or separate audit doctype.
- Whether the camera-scanning lib (`@zxing/browser` vs native `BarcodeDetector`) needs a feature-detect fallback chain across iOS Safari + Android Chrome — verify in QA.

## Future (not MVP)

- Native push notifications (Web Push API + Frappe broker).
- Liveness check on staff app via camera.
- Geofencing — only allow scan when GPS within school boundary.
- Multi-parent collaborative delegate list with role permissions (e.g., mother adds delegate, father can view only).
- Bulk import of authorized pickup persons via CSV (for class-wide drivers).
