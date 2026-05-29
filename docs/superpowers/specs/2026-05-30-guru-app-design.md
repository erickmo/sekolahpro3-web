# Guru App — Design Spec

> Status: Draft for review
> Date: 2026-05-30
> Scope: New mobile app for teachers (guru) and staff in the SekolahPro monorepo
> Approach: A — Mobile-API-first (all features through `api/mobile/v1`, single device-key auth)

## 1. Purpose

Mobile app (`apps/guru`) for teachers and staff. Four core features in v1:

1. **Absensi** — class attendance entry, offline-first.
2. **Jadwal** — daily/weekly teaching schedule.
3. **Nilai** — grade entry (write) per class/subject/component.
4. **Komunikasi** — two-way chat (via `vernon_chat`) + announcements (pengumuman).

Target user: guru and pegawai (staff). NOT admin/TU — that stays in the heavy `school` dashboard app.

## 2. Why a new app, not extending `school`

- `school` = 175-route desktop-style admin dashboard, scope-prefixed `$sekolah`. Wrong shape for mobile.
- `student` / `parent` = lightweight flat-route mobile apps (8–10 routes). `guru` follows this pattern.
- Decision: new `apps/guru` sibling to student/parent. `school` remains admin/TU.

## 3. Architecture

### 3.1 Stack

Identical to student/parent, plus Capacitor:

- React 18.3 + TanStack Router + TanStack Query
- Tailwind CSS 3.4
- Vitest + MSW (unit/integration), Playwright (e2e)
- **Capacitor** (new to monorepo) — Android/iOS native wrap

Reuse shared packages: `@sekolahpro/{auth,api-client,ui,tenant,config}`. No new shared package in v1 (chat-realtime helper inline first).

### 3.2 App structure

```
apps/guru/
├── capacitor.config.ts        # appId id.sekolahpro.guru, webDir dist
├── android/  ios/             # native shells committed, build artifacts gitignored
├── index.html  vite.config.ts  tailwind.config.js
├── src/
│   ├── main.tsx  styles.css
│   ├── routes/                # flat, student/parent pattern
│   │   ├── __root.tsx         # shell + bottom-nav
│   │   ├── login.tsx          # device-key login (pegawai)
│   │   ├── index.tsx          # dashboard: today schedule + summary
│   │   ├── jadwal.tsx         # teaching schedule daily/weekly
│   │   ├── absensi.tsx        # pick class → attendance entry (offline)
│   │   ├── nilai.tsx          # pick class/subject/component → grade entry
│   │   ├── pesan.tsx          # chat channel list
│   │   ├── pesan.$channel.tsx # chat room + realtime
│   │   └── profil.tsx         # pegawai profile + logout + device
│   ├── data/                  # per-domain: jadwal, absensi, nilai, chat, profil
│   ├── lib/
│   │   ├── outbox.ts          # offline queue (absensi+nilai)
│   │   ├── realtime.ts        # socketio client for chat
│   │   └── native.ts          # Capacitor wrapper (push, network, storage)
│   ├── components/            # AbsensiGrid, NilaiGrid, ChatBubble, OfflineBanner, etc.
│   └── mocks/                 # MSW handlers (dev/test, merchant pattern)
```

### 3.3 Auth

Single session via device-key. Login through `mobile/v1/auth.login` (pegawai). Device-key header `X-Device-Key` on all requests, sourced from `@sekolahpro/auth` store. Chat rides on a backend adapter (§5.3) — no separate cookie session.

## 4. Data Flow & Offline

Two operation classes: read (online, cached) vs write (offline-first via outbox).

### 4.1 Read (jadwal, roster, existing nilai, channel list)

TanStack Query → `@sekolahpro/api-client` `frappeFetch` → `mobile/v1/*`. Per-domain `staleTime` aligned to backend TTL (jadwal 5m, roster 1m).

### 4.2 Write offline-first (absensi batch, nilai entry)

```
UI submit → enqueue outbox (IndexedDB) → optimistic UI "saved, queued"
                                        ↓
   network online → drain outbox → POST mobile/v1 with idempotency_key (UUID v4)
                                        ↓
   200 → mark synced | 409 conflict → conflict envelope → resolve UI
```

- **Outbox** = `lib/outbox.ts`, IndexedDB (idb-keyval), sekolahpro PWA pattern. Channels: `absensi`, `nilai`. Entry: `{id, channel, endpoint, payload, idempotency_key, status, attempts}`.
- **Idempotency** — UUID v4 generated once per entry, resent identical on retry. Backend `with_idempotency` (Redis 7d TTL) dedups. Absensi already uses it; new nilai endpoint MUST use the same primitive.
- **Conflict** — backend returns conflict envelope (`conflict.py` exists). UI shows "data changed on server" → teacher chooses overwrite/cancel.
- **Drain trigger** — Capacitor `Network` listener + on-app-resume + retry backoff.

### 4.3 Chat (realtime, not outbox)

Send = online-only (failure → manual retry, no outbox). Inbound realtime via socketio room `channel_{id}`. See §5.3.

### 4.4 Sync status

Offline banner (merchant `OfflineBanner` pattern) + queued-count badge on relevant tab.

## 5. Backend (new modules in `sekolahpro/api/mobile/v1/`)

All: device-key auth, role check (Guru/Pegawai), existing `_common.py` envelope.

### 5.1 `guru_nilai.py` (NEW)

- `get_komponen(rombel, mapel)` → nilai components + KKM for class/subject (read).
- `get_entri(rombel, mapel, komponen)` → existing student grades (read, grid prefill).
- `submit_batch(rombel, mapel, komponen, rows, idempotency_key)` → write/update Entri Nilai batch. MUST use `with_idempotency` (Redis 7d). Validate: teacher teaches the subject (`mapel_pengampu_guru`), grade ≤ scale. Conflict envelope if server `modified` differs.
- Scope guard: teacher only accesses rombel/mapel in their `penugasan_guru`.

### 5.2 `pengumuman.py` (NEW)

- `list_(since="")` → announcements for guru/staff (delta-sync, 60s cache).
- `send(target, judul, isi, idempotency_key)` → teacher sends to their class/homeroom. `target` = rombel id. Guard: teacher is homeroom/subject teacher of that rombel. Idempotent.
- DocType: verify whether a `Pengumuman` DocType exists; if not, create a minimal one in plan phase (`judul, isi, target_rombel, pengirim, tanggal`).

### 5.3 `chat.py` (THIN ADAPTER to vernon_chat)

vernon_chat already provides full chat (Chat Channel/Member/Thread/Message, send/get/mark-read, socketio realtime, session auth, REST-callable).

- Translate device-key → resolve `frappe.session.user` (pegawai user), call vernon_chat functions in-process.
- `list_channels()` → proxy `channel.get_channels`.
- `get_messages(channel, since)` → proxy `message.get_messages`.
- `send_message(channel, content, idempotency_key)` → proxy `message.send_message`. Idempotent.
- `mark_read(channel, message_id)` → proxy `mark_as_read`.
- **Realtime** — app subscribes socketio directly (room `channel_{id}`, event `chat:new_message`). Adapter does not proxy realtime.

**Auth bridge (key to approach A)**: mobile middleware resolves device-key → `frappe.set_user(pegawai_user)` for the request, so vernon_chat (reads `frappe.session.user`) runs unmodified. Review safe scoping in plan phase.

### 5.4 Backend risks (flag for planning)

1. Socketio chat realtime with device-key (may need short-lived session token).
2. `Pengumuman` DocType existence — verify.
3. `set_user` within mobile request — security scoping.

## 6. Capacitor / Native + Push

### 6.1 Setup

`@capacitor/core` + `@capacitor/cli` in `apps/guru`. `capacitor.config.ts`: `appId id.sekolahpro.guru`, `appName "SekolahPro Guru"`, `webDir dist`. Build: `vite build` → `npx cap sync` → `android/`/`ios/`. Native shells committed, build artifacts gitignored. Dev port 5185 (avoid merchant 5184), `server.url` for live-reload.

### 6.2 Plugins (minimal)

- `@capacitor/network` → trigger outbox drain.
- `@capacitor/preferences` → secure device-key store (replaces localStorage on native).
- `@capacitor/push-notifications` (FCM) → pengumuman + new chat.
- `@capacitor/app` → on-resume drain + deep-link to chat.
- No NFC/camera in v1 (teacher does not tap cards — that is merchant domain).

### 6.3 Push

- Backend sends FCM on: new pengumuman (target teacher) + new chat message (offline recipient).
- Register: app sends FCM token to `mobile/v1/auth` (extend: store `fcm_token` on device record). Backend hooks `chat:new_message` + pengumuman `send` → push.
- Tap → deep-link `pesan/$channel` or `index`.
- Backend FCM sender = new work (flag for planning). iOS APNs needs Apple Developer account — Android-first.

### 6.4 Web/PWA fallback

`lib/native.ts` detects `Capacitor.isNativePlatform()`. Web → service-worker push (limited iOS), IndexedDB storage. One codebase, two targets.

### 6.5 Native risks (flag for planning)

1. Backend FCM sender does not exist — new work.
2. iOS APNs needs Apple Developer account — confirm with user, likely Android-first v1.

## 7. Testing & Rollout

### 7.1 Testing

- **Unit/integration**: Vitest + MSW. Mock `mobile/v1/*` in `src/mocks/`. Cover: outbox enqueue/drain/retry, idempotency-key stable on retry, conflict-resolve UI, absensi/nilai grid, auth guard.
- **E2E**: Playwright. Happy path: login → jadwal → offline absensi → online → sync. Merchant e2e pattern.
- **Backend**: pytest Frappe for `guru_nilai`/`pengumuman`/`chat` adapter. Test idempotency (double submit → one record), scope guard (foreign rombel → 403), conflict envelope. Pattern: `test_auth_api.py`/`test_sync_api.py`.
- **Native smoke**: manual `cap run android` — login, push received, drain on-resume. Manual checklist (Capacitor hard in CI).

### 7.2 Feature flags (existing `config.feature_flags()` pattern)

`guru_app_enabled`, `guru_nilai_enabled`, `guru_chat_enabled`, `guru_pengumuman_enabled`. Per-feature staged rollout without redeploy.

### 7.3 Rollout phases (all 4 features built; shipping order)

1. Scaffold app + Capacitor + device-key login + jadwal/absensi (reuse existing backend).
2. Backend `guru_nilai` + grade-entry UI.
3. Backend `pengumuman` + FCM sender + UI.
4. Chat adapter + socketio realtime + chat push.
5. iOS (after Apple Developer account) — Android-first first.

### 7.4 CI

`turbo run lint/typecheck/test` covers the new app automatically (workspace glob `apps/*`).

## 8. Open Questions / Risks Summary

| # | Risk | Phase to resolve |
|---|------|------------------|
| 1 | Socketio realtime auth with device-key | Planning spike |
| 2 | `Pengumuman` DocType exists? | Planning verify |
| 3 | `set_user` safe scoping in mobile request | Planning |
| 4 | Backend FCM sender (new) | Phase 3 |
| 5 | iOS APNs / Apple Developer account | Phase 5, confirm with user |
