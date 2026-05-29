# Merchant App — Design Spec

- **Date**: 2026-05-29
- **Owner**: @intinusa
- **Status**: Draft → pending review
- **Slug**: `merchant-app-v1`
- **Related**:
  - Existing koperasi module (`apps/school/src/routes/$sekolah.koperasi.*`)
  - `docs/superpowers/plans/2026-05-26-koperasi-ux-redesign-foundation.md`
  - Parent app spec (`2026-05-29-parent-app-design.md`)

## 1. Problem & Goal

Kantin sekolah, koperasi, dan vendor merchant lain butuh POS yang menerima pembayaran via **kartu siswa (tap NFC) atau QR fallback**, terhubung ke saldo emoney koperasi yang sudah ada. Ortu butuh kontrol (limit harian, blokir kategori, notifikasi realtime, riwayat).

Goal: app POS terisolasi (`apps/merchant`) untuk operator merchant — internal sekolah maupun vendor pihak ke-3 — yang me-reuse backend koperasi emoney + jurnal yang sudah berjalan.

## 2. Scope

### In scope (v1)
- Standalone PWA `apps/merchant` (mobile-first, installable).
- Login per-merchant w/ pairing code. Role `Merchant Admin` + `Merchant Operator`.
- Catalog CRUD (item, harga, kategori, foto, stok opsional).
- POS checkout: katalog + quick-amount → cart → tap NFC / scan QR → confirm → receipt.
- Online-only enforcement (tap diblokir saat offline; banner clear).
- Daily report per terminal/merchant; transaksi list; void dalam window.
- Settlement & vendor master tetap di `apps/school` koperasi screens (existing).

### Out of scope (v1)
- Offline queue, multi-currency, fee/commission split.
- Receipt printer hardware integration (PDF + share fallback only).
- Inventory PO/restock workflow.
- Parent control UI screens — di `apps/student` / parent surface (lihat `parent-app-design.md`).

## 3. Approach (selected: A)

Approach A — standalone deployable `apps/merchant` PWA. Vendor isolation, reuse koperasi backend penuh.

Approaches rejected:
- **B** — routes di `apps/school`: vendor login ke admin sekolah = surface area attack & branding bocor.
- **C** — POS embed di `apps/student`: salah model otorisasi; device siswa tidak boleh authorize debit sendiri.

## 4. Architecture

### Deployable
`apps/merchant` — Vite + TanStack Router + React Query + PWA plugin.

### Shared packages reused
- `@sekolahpro/ui`
- `@sekolahpro/auth`
- `@sekolahpro/api-client`
- `@sekolahpro/tenant`
- `@sekolahpro/config`

### New shared package `@sekolahpro/card` (`packages/card/`)
- `useNfcReader()` — Web NFC API wrapper, fallback "unavailable" on iOS/desktop.
- `useQrScanner()` — camera + zxing.
- `parseCardToken(payload): { kartu_id, signature, exp, nonce }`.
- Reusable; perpustakaan terminal dapat migrate later.

### App-internal modules (`apps/merchant/src/`)
- `routes/`
  - `__root.tsx`, `login.tsx`
  - `_app.tsx` — auth-guarded shell w/ bottom-nav
  - `_app.pos.index.tsx`
  - `_app.pos.confirm.$txnId.tsx`
  - `_app.catalog.index.tsx`, `_app.catalog.$name.tsx`
  - `_app.transaksi.index.tsx`, `_app.transaksi.$name.tsx`
  - `_app.laporan.tsx`
  - `_app.pengaturan.tsx`
- `lib/`
  - `merchant-session.ts`
  - `tap-pay.ts` — orchestrator (ports: api, nfc, qr, idempotency)
  - `connectivity.ts`
  - `catalog-cache.ts`
  - `error-codes.ts`
- `components/` — `CatalogGrid`, `Cart`, `TapPad`, `OfflineBanner`, `ReceiptSheet`, `CardReaderSheet`.

### Backend (Frappe — extend koperasi module)
New whitelisted methods under `sekolahpro.koperasi.merchant.*`:
- `POST charge` — input `{terminal_id, card_token, items[], amount, idempotency_key}` → `{txn_name, balance_after, receipt_url}`.
- `POST void` — input `{txn_name, reason}`.
- `GET catalog`, `POST catalog item`.
- `GET daily-report`.

## 5. Data Model

### Reuse (no schema change)
- `Koperasi Emoney Kartu`
- `Koperasi Emoney Transaksi` (`kartu`, `tipe`, `nominal`, `merchant`, `terminal_id`, `tanggal`, `journal_entry`)
- `Koperasi Anggota`

### Extend `Merchant`
- `tipe`: Select `Internal | Vendor`
- `kategori`: Link `Merchant Kategori`
- `vendor_account`: Link `Account` (settlement payable, vendor-only)
- `settlement_schedule`: Select `Weekly Mon | Biweekly | Monthly`
- `void_window_minutes`: Int (default 10)
- `is_postpaid_enabled`: Check

### Extend `Koperasi Pengaturan` (tenant)
- `enable_postpaid_default`: Check
- `default_void_window_minutes`: Int
- `postpaid_daily_cap`: Currency

### New doctypes
1. **`Merchant Terminal`** — parent `Merchant`. Fields: `terminal_id` (autoname `TERM-{merchant}-#####`), `nama`, `device_fingerprint`, `last_seen`, `status`, `operator_user`.
2. **`Merchant Kategori`** — `kode`, `nama`, `deskripsi`.
3. **`Merchant Catalog Item`** — parent `Merchant`. Fields: `kode`, `nama`, `harga`, `kategori_item`, `foto`, `aktif`, `track_stok`, `stok_qty`.
4. **`Student Spending Control`** (extend `Koperasi Anggota` if simpler) — `daily_limit`, `blocked_merchant_kategori` (table → MerchantKategori), `postpaid_enabled_override` (Inherit/On/Off), `parent_notify_enabled`.
5. **`Merchant Transaction Idempotency`** — `idempotency_key` (unique), `merchant`, `terminal_id`, `txn_name`, `created`; TTL cron 7 hari.

### Roles
- `Merchant Admin`, `Merchant Operator`. User-Permission scoped to `Merchant`. JWT claims add `merchant_id`, `terminal_id`.

## 6. Payment Source Logic

Hybrid: wallet-first → postpaid fallback (toggleable).

1. Wallet ≥ amount → debit wallet only.
2. Else if postpaid enabled (`Koperasi Pengaturan.enable_postpaid_default` OR `Merchant.is_postpaid_enabled` OR `Student Spending Control.postpaid_enabled_override=On`, w/ Override winning) AND `amount - saldo ≤ postpaid_daily_cap` → debit wallet to 0 + create postpaid receivable journal.
3. Else reject `INSUFFICIENT_FUNDS`.

## 7. Card Token Security

- NFC NDEF payload signed by server: `{kartu_id, nonce, exp(60s), hmac}`. Tenant secret rotates.
- QR fallback = same signed payload, student app rotates every 30s.
- Server stores nonce → reject reuse within `exp` window (replay guard).
- iOS Web NFC unsupported → QR-only mode, no silent degraded fallback.

## 8. Authn/Authz & Pairing

- Login = username + password + 6-digit pairing code (single-use, issued via school admin koperasi screen). On pair, server binds `device_fingerprint` to terminal.
- JWT 15m + refresh. Auto-logout idle 30m (configurable).
- `/charge` & `/void` require JWT `terminal_id` claim match body.
- Rate-limit per terminal: 60 charge/min.

## 9. Charge Endpoint — Server Validation Order

1. Validate JWT + terminal active.
2. Verify card token sig + nonce not seen + not expired.
3. Resolve `kartu` → student → `Student Spending Control`.
4. Reject if merchant kategori in student blocklist.
5. Compute today spending; reject if `daily_limit` exceeded.
6. Apply payment source logic (§6).
7. Insert idempotency row (unique constraint = race protection).
8. Single DB transaction: `Koperasi Emoney Transaksi` (tipe=Bayar) + Journal Entry.
9. Enqueue parent notification (if `parent_notify_enabled`).
10. Return receipt payload.

## 10. Data Flow — POS Happy Path

1. Operator login, terminal active, online check OK.
2. Pilih item dari katalog OR ketik quick-amount → cart total.
3. Tekan "Tap kartu" → sheet: NFC listener arm + QR scanner ready (tabs).
4. Siswa tap kartu → reader emit `card_token`.
5. App POST `/charge` w/ `idempotency_key` (UUID per cart).
6. Server validate + debit + notify → respond w/ receipt.
7. ReceiptSheet shows nama siswa, sisa saldo, share/print. Auto-clear cart 3s.

## 11. Edge Cases

- **Double tap (NFC bounce)**: client dedupe 1.5s + same idempotency_key; server returns cached response.
- **Network drop mid-request**: client retry 3× w/ same key; if still fail, show "status unknown, cek riwayat" + force refresh.
- **Kartu hilang mid-transaction**: fallback QR scan tanpa reset cart.
- **Stok habis** (`track_stok=on`): block add to cart, banner.
- **Void window expired**: button hidden, redirect to "ajukan pembatalan" → posting to `koperasi.persetujuan`.
- **Clock skew device**: server uses own clock for token exp.
- **Shift change**: "ganti operator" PIN screen w/o full re-login.
- **iOS device**: QR-only mode; tampilkan banner edukasi.

## 12. Settlement Flow (Vendor)

Existing `koperasi.kas-teller` + `koperasi.period-close` handle settlement.

- Cron per `settlement_schedule` aggregates Bayar transaksi `where merchant.tipe=Vendor`.
- Creates Journal Entry: DR `Clearing - Merchant Wallet`, CR `Vendor Payable` per vendor.
- Payout = Payment Entry manual via existing `pembayaran.new`.
- **No new screens in `apps/merchant`** untuk settlement.

## 13. Notifications

- Server-side hook on `Koperasi Emoney Transaksi.after_insert` (tipe=Bayar) → enqueue push to parent user via existing notif channel (jumlah, merchant, sisa saldo) when `parent_notify_enabled`.

## 14. Quality Rules (CLAUDE.md compliance)

- No business logic in route handlers — pure `lib/tap-pay.ts`.
- No magic strings — error codes centralized in `lib/error-codes.ts`.
- All API via `@sekolahpro/api-client` (no raw fetch).
- DI: `tap-pay` accepts `{api, nfc, qr, idempotency}` ports.
- Functions ≤ 40 lines, files ≤ 300 lines.

## 15. Testing Strategy

- **Unit (Vitest)**: `tap-pay.ts`, `parseCardToken`, `connectivity.ts`, idempotency client.
- **Component (Vitest + RTL)**: `CatalogGrid` filter, `Cart` math, `ReceiptSheet` rendering.
- **Integration (MSW)**: full charge flow happy path + each error code path.
- **E2E (Playwright)**: login → catalog add → mock NFC tap → success receipt; QR fallback; insufficient funds.
- **Backend (Frappe pytest)**: charge validation order, idempotency uniqueness race, void window enforcement.

## 16. Observability

- Client: telemetry log per charge attempt (terminal_id, status, latency).
- Server: structured log per charge w/ `idempotency_key` + decision reason on reject.

## 17. Rollout

- **Phase 1**: 1 pilot sekolah, 1 vendor kantin, 1 internal koperasi. Postpaid OFF.
- **Phase 2**: enable postpaid w/ low cap; multi-merchant.
- **Phase 3**: open to all tenants via feature flag `merchant_app_v1`.

## 18. Open Questions (defer to plan phase)

- Pairing code issuance UI — extend existing `koperasi.pengaturan` atau buat sub-screen di `koperasi.persetujuan`?
- Receipt format — siapa final reviewer (compliance / pajak)?
- Telemetry sink — apakah existing audit module (`$sekolah.audit`) cukup atau butuh new sink?
