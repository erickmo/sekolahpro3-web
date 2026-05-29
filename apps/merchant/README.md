# @sekolahpro/app-merchant

Mobile-first PWA POS untuk kantin / koperasi / vendor merchant sekolah. Pembayaran via tap kartu siswa (Web NFC) atau scan QR fallback, terhubung ke ledger emoney koperasi yang sudah ada.

## Dev

```bash
pnpm -C apps/merchant dev
```

Server di `http://localhost:5184`. Default pakai MSW handlers (`VITE_USE_MOCKS=true` di `.env.development`).

Dev seam untuk e2e / debugging:

- `?stub_session=1` — masuk POS tanpa login (set claims merchant via `useSessionStore`).
- `window.__devInjectCardToken(raw)` — inject token kartu saat CardReaderSheet terbuka, bypass NFC hardware.

## Test

```bash
pnpm -C apps/merchant test          # vitest (unit + integration via MSW)
pnpm -C apps/merchant exec playwright test   # e2e POS happy path
```

## Build

```bash
pnpm -C apps/merchant build
```

Output: `dist/` dengan `sw.js`, `manifest.webmanifest`, `pwa-*.png`.

## Arsitektur

- `src/routes/` — TanStack file-routes; `_app` shell pembungkus auth + bottom-nav.
- `src/lib/` — `tap-pay.ts` orchestrator (DI ports), `merchant-api.ts`, `connectivity.ts`, `error-codes.ts`, `merchant-session.ts`.
- `src/components/` — UI: `CatalogGrid`, `Cart`, `CardReaderSheet`, `ReceiptSheet`, `OfflineBanner`, `QuickAmountPad`, `OperatorPinModal`.
- `src/mocks/` — MSW handlers + in-memory db fixtures.
- `e2e/` — Playwright spec.

## Backend

Frontend ini ship terhadap kontrak RPC yang didokumentasikan. Implementasi backend Frappe (doctype + whitelisted methods) ditrack di plan terpisah. Lihat `docs/superpowers/specs/2026-05-29-merchant-app-design.md` §5–§9.
