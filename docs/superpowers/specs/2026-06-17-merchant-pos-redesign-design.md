# Design — Merchant POS Core Redesign (POS-optimized)

- **Date:** 2026-06-17
- **App:** `apps/merchant` (`@sekolahpro/app-merchant`) — school POS terminal (canteen/store: tap-to-pay, catalog, cart, receipt)
- **Scope:** POS core (login + catalog → cart → pay → receipt). NOT transaksi/laporan/pengaturan.
- **Approach:** A — two-pane tablet layout + adopt `@sekolahpro/ui` design system.
- **Status:** Approved design — pending implementation plan.

## 1. Problem

The merchant app works but is visually unstyled: raw `<input>`/`<button className="border">`,
tiny bare `−/+/✕` glyph buttons (poor touch targets), weak TOTAL/CTA hierarchy, plain
text category filters and bottom tabs, no login identity. The shared design system
(`@sekolahpro/ui` + `tailwind.preset.js` tokens) is available but only `Button` is used.
For a POS terminal used at speed on a tablet, this hurts usability.

## 2. Goals / Non-goals

**Goals**
- POS-optimized ergonomics: large touch targets (≥44px), prominent TOTAL + tap CTA,
  tablet two-pane (catalog + persistent cart), fast one-handed use.
- Adopt design-system tokens + components (Button/Input/Card/Alert/Badge/EmptyState).
- Branded login.
- **Zero behavior change**: pure presentational restyle + responsive layout.

**Non-goals (YAGNI)**
- No route/logic/API changes. Tap-pay flow, cart math, MSW handlers, session/auth unchanged.
- Transaksi / Laporan / Pengaturan screens (deferred — separate pass).
- No new merchant brand theme layer (use existing SekolahPro preset tokens).
- No structural component splits beyond what styling needs.

## 3. Verified existing state

- `apps/merchant/src/styles.css`: 5 lines (tailwind directives + height). No theme.
- `tailwind.config.js`: `presets: [@sekolahpro/ui/tailwind.preset.js]` → tokens available.
- Preset color tokens (CSS-var HSL): `brand`, `bg`, `fg`, `muted`, `muted-fg`, `border`,
  `danger`, `warning` (+ `borderRadius`). No `success`/`accent` token — use `brand` for positive.
- `@sekolahpro/ui` exports: `Button`, `Input`, `Select`, `Textarea`, `Checkbox`, `Switch`,
  `Card`, `Skeleton`, `Alert`, `AppShell`, `PageHeader`, `EmptyState`, `SidebarNav`, `StatCard`,
  `SectionCard`, `Avatar`, `Badge`, `DashboardTemplate`, `PlaceholderPage`.
- Only `Button` currently imported (6 files); everything else is raw HTML.
- POS-core files:
  - `routes/login.tsx` — bare form, raw inputs, `text-red-600` errors.
  - `routes/_app.tsx` — shell: OfflineBanner + `<Outlet/>` + plain-text bottom tab nav
    (`/pos /catalog /transaksi /laporan /pengaturan`); guard redirects to `/login` when
    `session.status !== "authenticated"`.
  - `routes/_app.pos.index.tsx` — AdBanner + CatalogGrid + "Manual amount" border button +
    Cart + error alert + CardReaderSheet + QuickAmountPad sheet.
  - `routes/_app.pos.confirm.$txnId.tsx` — receipt/confirm.
  - `components/CatalogGrid.tsx` — text-button category filter + `rounded-lg border` tiles.
  - `components/Cart.tsx` — line list with bare `−/+/✕`, total row, `Button` tap CTA;
    preserves `data-testid="cart-total"` + aria-labels (`tambah/kurangi/hapus {nama}`).
  - `components/QuickAmountPad.tsx`, `CardReaderSheet.tsx`, `ReceiptSheet.tsx`, `OfflineBanner.tsx`.
- Dev/e2e: `VITE_USE_MOCKS=true` → MSW + `?stub_session=1` injects an authenticated session in
  `main.tsx` bootstrap. **Currently the stub does not reach POS** — `/pos?stub_session=1`
  redirects to `/login` (session re-initializes to guest after the stub setState). Must be
  fixed (dev-only) so the redesign is visually verifiable via Playwright.
- Tests (must stay green): `__tests__/pos-flow.test.tsx`, `components/__tests__/{Cart,CatalogGrid,QuickAmountPad,CardReaderSheet,OfflineBanner}.test.tsx`.

## 4. Layout

- **Responsive, tablet-first.**
  - `lg` and up (landscape tablet): **two-pane** inside `/pos` — left column = catalog
    (sticky category chip row + scrollable product grid); right column = **persistent cart
    panel**, fixed width ~360–400px, full height, TOTAL + CTA pinned at its bottom.
  - below `lg` (phone/portrait): single column — catalog scrolls, cart is a sticky bottom
    section (current behavior), CTA full-width.
- **App shell** (`_app.tsx`): slim top header (merchant/terminal label + online dot +
  operator), main `<Outlet/>`, **bottom tab bar with icons** (use `@sekolahpro/ui` icons if
  exported, else inline SVG), active tab = `brand`. Tab targets ≥44px.
- Two-pane applies to the POS route only; other tabs keep single column.

## 5. Screens / components

1. **Login** (`login.tsx`): centered branded `Card` on `bg` — wordmark/title "Masuk Merchant",
   labelled `Input`s (username, password, pairing code), full-width primary `Button` "Masuk",
   `Alert` (danger) for errors. Keep the same form fields + submit logic + nav to `/pos`.
2. **CatalogGrid** (`CatalogGrid.tsx`): category filter → horizontal **chip row** (pill buttons;
   active = `brand` fill, inactive = `muted`/border). Product **tiles** = `Card`-styled buttons:
   name (`fg`, medium), price (`brand`/`fg`, tabular, prominent), out-of-stock `Badge` (danger),
   disabled+dimmed when out of stock, visible press/active feedback (ring/scale), min height ~88px.
   Preserve `aria-label={it.nama}` + `onAdd`.
3. **Cart** (`Cart.tsx`): line rows — name (truncate) + line subtotal (tabular); **large stepper**
   (− qty +) buttons ≥44px (`brand` outline), remove `✕` as an icon button ≥44px. **TOTAL row**
   large + bold (`fg`, `brand` accent). CTA "Tap kartu siswa" full-width, tall (≥56px), `Button`.
   **EmptyState** when no lines ("Keranjang kosong"). Preserve `data-testid="cart-total"` +
   aria-labels (`tambah/kurangi/hapus {nama}`) + disabled rule (`disabled || lines.length===0`).
4. **Manual amount + QuickAmountPad** (`QuickAmountPad.tsx`): trigger = styled secondary `Button`.
   Pad = large numeric keypad (big keys ≥56px), clear amount display (tabular, large),
   confirm/cancel `Button`s. Preserve `onConfirm(amount)` / `onCancel`.
5. **CardReaderSheet** (`CardReaderSheet.tsx`): polished bottom sheet — card icon, "Tap kartu
   siswa…", reader/spinner state, cancel `Button`. Preserve `onToken` / `onClose` / `nfcSupported`.
6. **Receipt** (`_app.pos.confirm.$txnId.tsx` + `ReceiptSheet.tsx`): success state — check icon,
   amount (large tabular), txn id, "Transaksi baru" `Button` back to `/pos`. Preserve data flow.
7. **OfflineBanner** (`OfflineBanner.tsx`): use `warning` token, clear "Mode luring" copy.

## 6. Design system usage

- Tokens only (no hardcoded hex): `brand` (CTA, active, price emphasis), `bg`/`fg`
  (surface/text), `muted`/`muted-fg` (secondary surfaces/text), `border`, `danger`
  (errors, out-of-stock — replace every `text-red-600`), `warning` (offline).
- Replace raw `<input>` → `Input`; raw `<button className="border">` → `Button`
  (variant `outline`/`ghost`/`default`) or `Card`-styled tappable where it's a tile.
- Errors → `Alert` (role="alert" preserved).
- Empty states → `EmptyState`.
- Touch: every interactive element ≥44px; primary CTA + keypad keys larger.

## 7. Dev stub fix (verification enabler)

`?stub_session=1` must land on `/pos` so the redesign can be screenshotted. Investigate why the
bootstrap stub is overridden (session store re-init to guest after setState) and make the stub
durable for the dev/mock path **only** (gated by `import.meta.env.VITE_USE_MOCKS === "true"`).
No change to real auth. If the fix is non-trivial, fall back to driving `/login` + asserting the
authed components in isolation via their existing tests + a small harness, but prefer fixing the stub.

## 8. Testing

- All existing tests stay green — the redesign preserves every queried hook
  (`data-testid="cart-total"`, aria-labels, `role="alert"`, button names). Adjust a test only if
  a label legitimately changes; document why.
- Add light render assertions: Cart empty state renders EmptyState; POS shows two panes at `lg`
  (e.g. cart panel present alongside catalog).
- Visual: Playwright screenshots of `/login` and `/pos` at tablet (1280×800) and phone (390×844);
  eyeball for hierarchy + touch sizing. Keep a temp drive script, delete after.
- `tsc` 0, `eslint` 0, full merchant vitest green, `build` ok.

## 9. Files touched

Restyle: `login.tsx`, `_app.tsx`, `_app.pos.index.tsx`, `_app.pos.confirm.$txnId.tsx`,
`components/{CatalogGrid,Cart,QuickAmountPad,CardReaderSheet,ReceiptSheet,OfflineBanner}.tsx`,
maybe `styles.css` (base bg/fg). Dev-only: `main.tsx` (stub durability, gated).
New (optional): small `components/PosLayout` or inline two-pane in `_app.pos.index.tsx`.

## 10. Open items for planning

1. Confirm `@sekolahpro/ui` icon exports (for tab bar / receipt check / card icon) vs inline SVG.
2. Root cause of `stub_session` override (read `@sekolahpro/auth` session store init).
3. Whether the bottom tab bar stays on tablet or becomes a side rail — default: keep bottom tab
   (touch-friendly), revisit if it crowds the two-pane.
