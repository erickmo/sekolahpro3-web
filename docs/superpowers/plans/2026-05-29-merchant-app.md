# Merchant App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `apps/merchant` PWA + `@sekolahpro/card` package so kasir kantin/koperasi/vendor can tap-pay (NFC) atau scan-QR kartu siswa, terhubung ke koperasi emoney existing.

**Architecture:** Standalone Vite + TanStack Router + React Query PWA, mobile-first. New shared package `@sekolahpro/card` (NFC + QR + token parser). Backend = extend Frappe koperasi module (separate backend plan); frontend uses MSW for dev + integration tests. Online-only enforcement, idempotent charge POST.

**Tech Stack:** TypeScript, React 18, Vite 5, TanStack Router/Query, Tailwind, Vitest + RTL, MSW, Playwright, zxing-js, Web NFC API, vite-plugin-pwa.

**Scope boundary:** Frontend monorepo only. Real Frappe backend (doctypes + whitelisted endpoints) tracked in separate plan `2026-05-29-merchant-backend.md` (to be written by backend team). This plan ships against MSW + a documented RPC contract; switching to real backend = swap MSW off via env flag.

**Spec:** `docs/superpowers/specs/2026-05-29-merchant-app-design.md`

---

## File Structure

### New deployable `apps/merchant/`
- `package.json` — workspace package `@sekolahpro/app-merchant`.
- `vite.config.ts` — Vite + TanStack router plugin + PWA plugin + proxy to backend.
- `index.html`, `src/main.tsx`, `src/styles.css`.
- `src/routes/`
  - `__root.tsx` — boot shell.
  - `login.tsx` — username + password + pairing code form.
  - `_app.tsx` — auth guard + bottom-nav layout.
  - `_app.pos.index.tsx` — POS main screen.
  - `_app.pos.confirm.$txnId.tsx` — receipt + auto-clear.
  - `_app.catalog.index.tsx`, `_app.catalog.$name.tsx` — catalog CRUD.
  - `_app.transaksi.index.tsx`, `_app.transaksi.$name.tsx` — list + detail + void.
  - `_app.laporan.tsx` — daily report.
  - `_app.pengaturan.tsx` — terminal info, ganti operator, logout.
- `src/lib/`
  - `merchant-session.ts` — JWT claims accessor (merchant_id, terminal_id, operator).
  - `tap-pay.ts` — pure orchestrator (DI: api, nfc, qr, idempotency).
  - `connectivity.ts` — online heartbeat hook.
  - `catalog-cache.ts` — React Query keys + helpers.
  - `error-codes.ts` — canonical enum + message map.
  - `merchant-api.ts` — typed wrappers over `@sekolahpro/api-client`.
- `src/components/`
  - `CatalogGrid.tsx`, `Cart.tsx`, `TapPad.tsx`, `OfflineBanner.tsx`, `ReceiptSheet.tsx`, `CardReaderSheet.tsx`, `QuickAmountPad.tsx`, `OperatorPinModal.tsx`.
- `src/mocks/` — MSW handlers for dev + tests.
- `src/__tests__/` — unit + integration.
- `e2e/merchant.spec.ts` — Playwright happy path.

### New shared package `packages/card/`
- `package.json` — `@sekolahpro/card`.
- `src/index.ts` — exports.
- `src/parse-card-token.ts` — pure decoder.
- `src/use-nfc-reader.ts` — Web NFC hook.
- `src/use-qr-scanner.ts` — zxing hook.
- `src/types.ts` — `CardToken`, `CardReaderError`.
- `src/__tests__/`.

### Edits
- `pnpm-workspace.yaml` — already globs `apps/*` + `packages/*`, no change.
- `package.json` (root) — no change (turbo picks up new package).
- `tools/` — none.

---

## Task 1: Scaffold `apps/merchant` skeleton

**Files:**
- Create: `apps/merchant/package.json`
- Create: `apps/merchant/tsconfig.json`
- Create: `apps/merchant/vite.config.ts`
- Create: `apps/merchant/index.html`
- Create: `apps/merchant/postcss.config.js`
- Create: `apps/merchant/tailwind.config.js`
- Create: `apps/merchant/.env.development`
- Create: `apps/merchant/src/main.tsx`
- Create: `apps/merchant/src/styles.css`
- Create: `apps/merchant/src/routes/__root.tsx`

- [ ] **Step 1: Write `apps/merchant/package.json`**

```json
{
  "name": "@sekolahpro/app-merchant",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "lint": "ESLINT_USE_FLAT_CONFIG=true eslint 'src/**/*.{ts,tsx}'",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@sekolahpro/api-client": "workspace:*",
    "@sekolahpro/auth": "workspace:*",
    "@sekolahpro/card": "workspace:*",
    "@sekolahpro/config": "workspace:*",
    "@sekolahpro/tenant": "workspace:*",
    "@sekolahpro/ui": "workspace:*",
    "@tanstack/react-query": "^5.51.0",
    "@tanstack/react-router": "^1.45.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@sekolahpro/tsconfig": "workspace:*",
    "@tanstack/router-vite-plugin": "^1.45.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "jsdom": "^25.0.0",
    "msw": "^2.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "vite": "^5.3.0",
    "vite-plugin-pwa": "^0.20.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Write `apps/merchant/tsconfig.json`**

```json
{
  "extends": "@sekolahpro/tsconfig/react.json",
  "include": ["src", "src/routeTree.gen.ts"],
  "compilerOptions": {
    "types": ["vite/client", "vitest/globals", "@types/web-bluetooth"]
  }
}
```

(If `@sekolahpro/tsconfig/react.json` does not exist, copy from `apps/student/tsconfig.json`.)

- [ ] **Step 3: Write `apps/merchant/vite.config.ts`**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "SekolahPro Merchant",
        short_name: "Merchant",
        description: "Kasir tap-pay kartu siswa",
        theme_color: "#0f172a",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  base: process.env.VITE_BASE_PATH ?? "/",
  server: {
    port: 5184,
    host: "0.0.0.0",
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        headers: { Host: "sekolahpro.localhost" },
        cookieDomainRewrite: { "*": "" },
        cookiePathRewrite: { "*": "/" },
      },
    },
  },
  build: { outDir: "dist", sourcemap: true },
});
```

- [ ] **Step 4: Write `apps/merchant/index.html`**

```html
<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#0f172a" />
    <title>SekolahPro Merchant</title>
  </head>
  <body class="bg-bg text-fg">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Write `apps/merchant/tailwind.config.js`**

Copy from `apps/student/tailwind.config.js` verbatim (same shared UI tokens).

- [ ] **Step 6: Write `apps/merchant/postcss.config.js`**

```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

- [ ] **Step 7: Write `apps/merchant/.env.development`**

```
VITE_API_BASE=/api
VITE_USE_MOCKS=true
```

- [ ] **Step 8: Write `apps/merchant/src/styles.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; overscroll-behavior-y: contain; }
```

- [ ] **Step 9: Write `apps/merchant/src/routes/__root.tsx`**

```tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({ component: () => <Outlet /> });
```

- [ ] **Step 10: Write `apps/merchant/src/main.tsx`**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { configure, createQueryClient } from "@sekolahpro/api-client";
import { parseEnv } from "@sekolahpro/config";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

const env = parseEnv(import.meta.env);
configure({ baseUrl: env.VITE_API_BASE });

if (import.meta.env.VITE_USE_MOCKS === "true") {
  const { startMocks } = await import("./mocks/browser");
  await startMocks();
}

const qc = createQueryClient();
const router = createRouter({ routeTree, context: {} });

declare module "@tanstack/react-router" {
  interface Register { router: typeof router; }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
```

Note: `./mocks/browser` is created in Task 9. Make `startMocks` a no-op stub for now so build passes:

```tsx
// apps/merchant/src/mocks/browser.ts (temp stub)
export async function startMocks() {}
```

- [ ] **Step 11: Run dev server, verify boots**

```bash
pnpm -C apps/merchant dev
```

Expected: server starts on `:5184`, blank page renders, no console errors.

- [ ] **Step 12: Commit**

```bash
git add apps/merchant pnpm-lock.yaml
git commit -m "feat(merchant): scaffold apps/merchant Vite + TanStack + PWA skeleton"
```

---

## Task 2: Scaffold `packages/card` shared package

**Files:**
- Create: `packages/card/package.json`
- Create: `packages/card/tsconfig.json`
- Create: `packages/card/src/index.ts`
- Create: `packages/card/src/types.ts`

- [ ] **Step 1: Write `packages/card/package.json`**

```json
{
  "name": "@sekolahpro/card",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "lint": "ESLINT_USE_FLAT_CONFIG=true eslint 'src/**/*.{ts,tsx}'",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --passWithNoTests"
  },
  "dependencies": {
    "@zxing/browser": "^0.1.5",
    "@zxing/library": "^0.21.0",
    "react": "^18.3.0"
  },
  "devDependencies": {
    "@sekolahpro/tsconfig": "workspace:*",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^18.3.0",
    "jsdom": "^25.0.0",
    "vitest": "^1.6.0"
  },
  "peerDependencies": { "react": "^18.3.0" }
}
```

- [ ] **Step 2: Write `packages/card/tsconfig.json`**

```json
{
  "extends": "@sekolahpro/tsconfig/react.json",
  "include": ["src"],
  "compilerOptions": { "types": ["vitest/globals"] }
}
```

- [ ] **Step 3: Write `packages/card/src/types.ts`**

```ts
export interface CardToken {
  kartu_id: string;
  nonce: string;
  exp: number;
  hmac: string;
  raw: string;
}

export type CardReaderErrorCode =
  | "UNSUPPORTED"
  | "PERMISSION_DENIED"
  | "READ_FAILED"
  | "PARSE_FAILED"
  | "TIMEOUT"
  | "ABORTED";

export class CardReaderError extends Error {
  readonly code: CardReaderErrorCode;
  constructor(code: CardReaderErrorCode, message?: string) {
    super(message ?? code);
    this.name = "CardReaderError";
    this.code = code;
  }
}
```

- [ ] **Step 4: Write `packages/card/src/index.ts`**

```ts
export * from "./types";
export { parseCardToken } from "./parse-card-token";
export { useNfcReader } from "./use-nfc-reader";
export { useQrScanner } from "./use-qr-scanner";
```

(Files referenced are created in Tasks 3–5; this index will fail typecheck until then. That is expected — typecheck after Task 5.)

- [ ] **Step 5: Add to `apps/merchant/package.json` dependencies if not already**

Already added in Task 1.

- [ ] **Step 6: Run install**

```bash
pnpm install
```

- [ ] **Step 7: Commit**

```bash
git add packages/card
git commit -m "feat(card): scaffold @sekolahpro/card shared package"
```

---

## Task 3: `parseCardToken` w/ tests

**Files:**
- Test: `packages/card/src/__tests__/parse-card-token.test.ts`
- Create: `packages/card/src/parse-card-token.ts`

Token wire format: base64url-encoded JSON `{kartu_id, nonce, exp, hmac}`. Client does no signature verify — server does. Client only structural validity + exp check.

- [ ] **Step 1: Write the failing test**

```ts
// packages/card/src/__tests__/parse-card-token.test.ts
import { describe, it, expect } from "vitest";
import { parseCardToken } from "../parse-card-token";
import { CardReaderError } from "../types";

function encode(obj: unknown) {
  return btoa(JSON.stringify(obj)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

describe("parseCardToken", () => {
  const future = Math.floor(Date.now() / 1000) + 60;

  it("decodes valid token", () => {
    const raw = encode({ kartu_id: "K-001", nonce: "abc", exp: future, hmac: "sig" });
    const t = parseCardToken(raw);
    expect(t.kartu_id).toBe("K-001");
    expect(t.exp).toBe(future);
    expect(t.raw).toBe(raw);
  });

  it("rejects malformed base64", () => {
    expect(() => parseCardToken("!!!not-base64!!!")).toThrow(CardReaderError);
  });

  it("rejects missing fields", () => {
    const raw = encode({ kartu_id: "K-001" });
    expect(() => parseCardToken(raw)).toThrow(/PARSE_FAILED/);
  });

  it("rejects expired token", () => {
    const past = Math.floor(Date.now() / 1000) - 5;
    const raw = encode({ kartu_id: "K-001", nonce: "abc", exp: past, hmac: "sig" });
    expect(() => parseCardToken(raw)).toThrow(/TIMEOUT/);
  });
});
```

- [ ] **Step 2: Run test — verify fails**

```bash
pnpm -C packages/card test
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement `parse-card-token.ts`**

```ts
// packages/card/src/parse-card-token.ts
import { CardReaderError, type CardToken } from "./types";

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  try {
    return atob(b64);
  } catch {
    throw new CardReaderError("PARSE_FAILED", "invalid base64");
  }
}

export function parseCardToken(raw: string): CardToken {
  let json: unknown;
  try {
    json = JSON.parse(b64urlDecode(raw));
  } catch {
    throw new CardReaderError("PARSE_FAILED", "invalid json");
  }
  if (typeof json !== "object" || json === null) {
    throw new CardReaderError("PARSE_FAILED", "not object");
  }
  const o = json as Record<string, unknown>;
  if (
    typeof o.kartu_id !== "string" ||
    typeof o.nonce !== "string" ||
    typeof o.exp !== "number" ||
    typeof o.hmac !== "string"
  ) {
    throw new CardReaderError("PARSE_FAILED", "missing fields");
  }
  const now = Math.floor(Date.now() / 1000);
  if (o.exp < now) throw new CardReaderError("TIMEOUT", "token expired");
  return { kartu_id: o.kartu_id, nonce: o.nonce, exp: o.exp, hmac: o.hmac, raw };
}
```

- [ ] **Step 4: Run test — verify pass**

```bash
pnpm -C packages/card test
```

Expected: 4/4 PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/card
git commit -m "feat(card): parseCardToken decoder with structural + exp validation"
```

---

## Task 4: `useNfcReader` hook

**Files:**
- Test: `packages/card/src/__tests__/use-nfc-reader.test.tsx`
- Create: `packages/card/src/use-nfc-reader.ts`

Browser API: `window.NDEFReader`. Mock via global.

- [ ] **Step 1: Write the failing test**

```tsx
// packages/card/src/__tests__/use-nfc-reader.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useNfcReader } from "../use-nfc-reader";

class FakeNDEFReader {
  static instances: FakeNDEFReader[] = [];
  onreading: ((e: any) => void) | null = null;
  onreadingerror: ((e: any) => void) | null = null;
  scan = vi.fn().mockResolvedValue(undefined);
  constructor() { FakeNDEFReader.instances.push(this); }
  emit(records: { recordType: string; data: ArrayBuffer }[]) {
    this.onreading?.({ message: { records } });
  }
}

function makeRecord(text: string) {
  return { recordType: "text", data: new TextEncoder().encode(text).buffer };
}

beforeEach(() => {
  FakeNDEFReader.instances = [];
  (globalThis as any).NDEFReader = FakeNDEFReader;
});

describe("useNfcReader", () => {
  it("reports unsupported when NDEFReader absent", () => {
    delete (globalThis as any).NDEFReader;
    const { result } = renderHook(() => useNfcReader({ enabled: false }));
    expect(result.current.supported).toBe(false);
  });

  it("emits onRead with parsed token on tap", async () => {
    const onRead = vi.fn();
    renderHook(() => useNfcReader({ enabled: true, onRead }));
    await waitFor(() => expect(FakeNDEFReader.instances).toHaveLength(1));
    const token = btoa(JSON.stringify({
      kartu_id: "K-1", nonce: "n", exp: Math.floor(Date.now()/1000)+60, hmac: "h",
    })).replace(/=+$/, "");
    act(() => FakeNDEFReader.instances[0].emit([makeRecord(token)]));
    await waitFor(() => expect(onRead).toHaveBeenCalledTimes(1));
    expect(onRead.mock.calls[0][0].kartu_id).toBe("K-1");
  });

  it("does not arm reader when disabled", () => {
    renderHook(() => useNfcReader({ enabled: false }));
    expect(FakeNDEFReader.instances).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test — verify fails**

```bash
pnpm -C packages/card test
```

Expected: FAIL (file not found).

- [ ] **Step 3: Implement `use-nfc-reader.ts`**

```ts
// packages/card/src/use-nfc-reader.ts
import { useEffect, useRef, useState } from "react";
import { parseCardToken } from "./parse-card-token";
import { CardReaderError, type CardToken } from "./types";

interface Options {
  enabled: boolean;
  onRead?: (token: CardToken) => void;
  onError?: (err: CardReaderError) => void;
}

declare global {
  interface Window {
    NDEFReader?: new () => {
      scan(): Promise<void>;
      onreading: ((e: { message: { records: { recordType: string; data: ArrayBuffer }[] } }) => void) | null;
      onreadingerror: ((e: unknown) => void) | null;
    };
  }
}

export function useNfcReader({ enabled, onRead, onError }: Options) {
  const supported = typeof window !== "undefined" && typeof window.NDEFReader === "function";
  const [armed, setArmed] = useState(false);
  const onReadRef = useRef(onRead);
  const onErrorRef = useRef(onError);
  onReadRef.current = onRead;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!enabled || !supported) return;
    const Ctor = window.NDEFReader!;
    const reader = new Ctor();
    let cancelled = false;

    reader.onreading = (e) => {
      const text = e.message.records
        .filter((r) => r.recordType === "text")
        .map((r) => new TextDecoder().decode(r.data))
        .join("");
      try {
        const token = parseCardToken(text);
        onReadRef.current?.(token);
      } catch (err) {
        if (err instanceof CardReaderError) onErrorRef.current?.(err);
      }
    };
    reader.onreadingerror = () => {
      onErrorRef.current?.(new CardReaderError("READ_FAILED"));
    };

    reader.scan()
      .then(() => { if (!cancelled) setArmed(true); })
      .catch((e: unknown) => {
        const code = (e as { name?: string })?.name === "NotAllowedError"
          ? "PERMISSION_DENIED" : "READ_FAILED";
        onErrorRef.current?.(new CardReaderError(code));
      });

    return () => { cancelled = true; setArmed(false); };
  }, [enabled, supported]);

  return { supported, armed };
}
```

- [ ] **Step 4: Run test — verify pass**

```bash
pnpm -C packages/card test
```

Expected: 3/3 PASS for new file (and existing parse-card-token tests still pass).

- [ ] **Step 5: Commit**

```bash
git add packages/card
git commit -m "feat(card): useNfcReader hook with Web NFC + token parse"
```

---

## Task 5: `useQrScanner` hook

**Files:**
- Test: `packages/card/src/__tests__/use-qr-scanner.test.tsx`
- Create: `packages/card/src/use-qr-scanner.ts`

Hook returns `{ videoRef, supported, scanning, start, stop }`. Decoding uses `@zxing/browser` BrowserQRCodeReader. Test injects a fake reader via a `__setQrReaderImpl` test seam.

- [ ] **Step 1: Write the failing test**

```tsx
// packages/card/src/__tests__/use-qr-scanner.test.tsx
import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useQrScanner, __setQrReaderImpl } from "../use-qr-scanner";

describe("useQrScanner", () => {
  it("invokes onRead with parsed token from scan callback", async () => {
    const onRead = vi.fn();
    const token = btoa(JSON.stringify({
      kartu_id: "K-9", nonce: "x", exp: Math.floor(Date.now()/1000)+60, hmac: "h",
    })).replace(/=+$/, "");

    let cb: ((text: string) => void) | null = null;
    __setQrReaderImpl({
      decodeFromVideoDevice: (_dev, _el, fn) => {
        cb = (txt: string) => fn(({ getText: () => txt } as any), undefined);
        return Promise.resolve({ stop: vi.fn() });
      },
    });

    const { result } = renderHook(() => useQrScanner({ onRead }));
    await act(async () => { await result.current.start(); });
    await waitFor(() => expect(cb).not.toBeNull());
    act(() => cb!(token));
    await waitFor(() => expect(onRead).toHaveBeenCalledTimes(1));
    expect(onRead.mock.calls[0][0].kartu_id).toBe("K-9");
  });
});
```

- [ ] **Step 2: Run test — verify fails**

- [ ] **Step 3: Implement `use-qr-scanner.ts`**

```ts
// packages/card/src/use-qr-scanner.ts
import { useCallback, useRef, useState } from "react";
import { parseCardToken } from "./parse-card-token";
import { CardReaderError, type CardToken } from "./types";

interface ReaderControl { stop: () => void }
interface ReaderImpl {
  decodeFromVideoDevice(
    deviceId: string | undefined,
    videoEl: HTMLVideoElement,
    cb: (result: { getText: () => string } | undefined, err: unknown) => void,
  ): Promise<ReaderControl>;
}

let impl: ReaderImpl | null = null;

async function getImpl(): Promise<ReaderImpl> {
  if (impl) return impl;
  const { BrowserQRCodeReader } = await import("@zxing/browser");
  const inst = new BrowserQRCodeReader();
  impl = {
    decodeFromVideoDevice: (dev, el, cb) =>
      inst.decodeFromVideoDevice(dev, el, cb as any) as unknown as Promise<ReaderControl>,
  };
  return impl;
}

/** Test seam — set fake impl before render. */
export function __setQrReaderImpl(fake: ReaderImpl) { impl = fake; }

interface Options {
  onRead?: (token: CardToken) => void;
  onError?: (err: CardReaderError) => void;
}

export function useQrScanner({ onRead, onError }: Options) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ctrlRef = useRef<ReaderControl | null>(null);
  const [scanning, setScanning] = useState(false);
  const supported = typeof navigator !== "undefined" && !!navigator.mediaDevices;

  const start = useCallback(async () => {
    if (!supported) {
      onError?.(new CardReaderError("UNSUPPORTED"));
      return;
    }
    const reader = await getImpl();
    const el = videoRef.current ?? document.createElement("video");
    const ctrl = await reader.decodeFromVideoDevice(undefined, el, (result, err) => {
      if (!result) return;
      try {
        const t = parseCardToken(result.getText());
        onRead?.(t);
      } catch (e) {
        if (e instanceof CardReaderError) onError?.(e);
      }
    });
    ctrlRef.current = ctrl;
    setScanning(true);
  }, [supported, onRead, onError]);

  const stop = useCallback(() => {
    ctrlRef.current?.stop();
    ctrlRef.current = null;
    setScanning(false);
  }, []);

  return { videoRef, supported, scanning, start, stop };
}
```

- [ ] **Step 4: Run tests + typecheck — verify pass**

```bash
pnpm -C packages/card test && pnpm -C packages/card typecheck
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add packages/card
git commit -m "feat(card): useQrScanner hook with zxing + test seam"
```

---

## Task 6: `error-codes.ts`

**Files:**
- Test: `apps/merchant/src/lib/__tests__/error-codes.test.ts`
- Create: `apps/merchant/src/lib/error-codes.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { ChargeErrorCode, chargeErrorMessage } from "../error-codes";

describe("error-codes", () => {
  it("maps each code to user message", () => {
    for (const code of Object.values(ChargeErrorCode)) {
      const msg = chargeErrorMessage(code as ChargeErrorCode);
      expect(msg).toBeTypeOf("string");
      expect(msg.length).toBeGreaterThan(0);
    }
  });

  it("returns fallback for unknown code", () => {
    expect(chargeErrorMessage("WAT" as ChargeErrorCode)).toMatch(/tidak diketahui/i);
  });
});
```

- [ ] **Step 2: Run — fail**

- [ ] **Step 3: Implement**

```ts
// apps/merchant/src/lib/error-codes.ts
export const ChargeErrorCode = {
  INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
  DAILY_LIMIT_EXCEEDED: "DAILY_LIMIT_EXCEEDED",
  KATEGORI_BLOCKED: "KATEGORI_BLOCKED",
  CARD_INVALID: "CARD_INVALID",
  CARD_EXPIRED: "CARD_EXPIRED",
  TERMINAL_INACTIVE: "TERMINAL_INACTIVE",
  RATE_LIMITED: "RATE_LIMITED",
  OFFLINE: "OFFLINE",
  NETWORK: "NETWORK",
  STOCK_EMPTY: "STOCK_EMPTY",
  UNKNOWN: "UNKNOWN",
} as const;
export type ChargeErrorCode = typeof ChargeErrorCode[keyof typeof ChargeErrorCode];

const MESSAGES: Record<ChargeErrorCode, string> = {
  INSUFFICIENT_FUNDS: "Saldo tidak cukup dan postpaid tidak aktif.",
  DAILY_LIMIT_EXCEEDED: "Limit harian siswa terlampaui.",
  KATEGORI_BLOCKED: "Kategori merchant diblokir ortu.",
  CARD_INVALID: "Kartu tidak valid.",
  CARD_EXPIRED: "Token kartu kedaluwarsa, tap ulang.",
  TERMINAL_INACTIVE: "Terminal tidak aktif.",
  RATE_LIMITED: "Terlalu banyak transaksi, tunggu sebentar.",
  OFFLINE: "Tidak ada koneksi internet.",
  NETWORK: "Gagal menghubungi server.",
  STOCK_EMPTY: "Stok produk habis.",
  UNKNOWN: "Kesalahan tidak diketahui.",
};

export function chargeErrorMessage(code: ChargeErrorCode): string {
  return MESSAGES[code] ?? "Kesalahan tidak diketahui.";
}
```

- [ ] **Step 4: Run — pass**

- [ ] **Step 5: Commit**

```bash
git add apps/merchant
git commit -m "feat(merchant): error-codes registry"
```

---

## Task 7: `connectivity.ts` hook

**Files:**
- Test: `apps/merchant/src/lib/__tests__/connectivity.test.tsx`
- Create: `apps/merchant/src/lib/connectivity.ts`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConnectivity } from "../connectivity";

beforeEach(() => {
  Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
});

describe("useConnectivity", () => {
  it("starts online", () => {
    const { result } = renderHook(() => useConnectivity({ pingFn: () => Promise.resolve(true), intervalMs: 1000 }));
    expect(result.current.online).toBe(true);
  });

  it("flips offline on browser event", () => {
    const { result } = renderHook(() => useConnectivity({ pingFn: () => Promise.resolve(true), intervalMs: 1000 }));
    act(() => {
      Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.online).toBe(false);
  });

  it("flips offline when ping fails", async () => {
    vi.useFakeTimers();
    const ping = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const { result } = renderHook(() => useConnectivity({ pingFn: ping, intervalMs: 500 }));
    await act(async () => { await vi.advanceTimersByTimeAsync(600); });
    expect(result.current.online).toBe(false);
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run — fail**

- [ ] **Step 3: Implement**

```ts
// apps/merchant/src/lib/connectivity.ts
import { useEffect, useState } from "react";

interface Options {
  pingFn: () => Promise<boolean>;
  intervalMs: number;
}

export function useConnectivity({ pingFn, intervalMs }: Options) {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const ok = await pingFn();
        if (!cancelled) setOnline(ok);
      } catch {
        if (!cancelled) setOnline(false);
      }
    };
    const id = setInterval(tick, intervalMs);
    return () => { cancelled = true; clearInterval(id); };
  }, [pingFn, intervalMs]);

  return { online };
}
```

- [ ] **Step 4: Run — pass**

- [ ] **Step 5: Commit**

```bash
git add apps/merchant
git commit -m "feat(merchant): connectivity hook with browser + ping fallback"
```

---

## Task 8: `merchant-session.ts`

**Files:**
- Test: `apps/merchant/src/lib/__tests__/merchant-session.test.ts`
- Create: `apps/merchant/src/lib/merchant-session.ts`

Assume `@sekolahpro/auth` exposes `useSession(): { user, claims }`. We adapt.

- [ ] **Step 1: Inspect existing `@sekolahpro/auth` API**

```bash
grep -n "useSession\|export" packages/auth/src/index.ts packages/auth/src/*.ts 2>/dev/null | head -40
```

If `useSession` not present, the implementer adapts to the actual API (e.g., `useAuth`) and updates the test imports accordingly. Document the chosen names in the commit message.

- [ ] **Step 2: Write the failing test**

```ts
import { describe, it, expect, vi } from "vitest";
import { getMerchantContext } from "../merchant-session";

describe("getMerchantContext", () => {
  it("returns merchant + terminal from claims", () => {
    const ctx = getMerchantContext({
      merchant_id: "M-001",
      terminal_id: "TERM-M-001-00001",
      operator_user: "kasir@example.com",
      void_window_minutes: 10,
    });
    expect(ctx).toEqual({
      merchantId: "M-001",
      terminalId: "TERM-M-001-00001",
      operatorUser: "kasir@example.com",
      voidWindowMinutes: 10,
    });
  });

  it("throws when claims missing merchant", () => {
    expect(() => getMerchantContext({} as any)).toThrow(/merchant/i);
  });
});
```

- [ ] **Step 3: Run — fail**

- [ ] **Step 4: Implement**

```ts
// apps/merchant/src/lib/merchant-session.ts
import { useSession } from "@sekolahpro/auth";

export interface MerchantClaims {
  merchant_id: string;
  terminal_id: string;
  operator_user?: string;
  void_window_minutes: number;
}

export interface MerchantContext {
  merchantId: string;
  terminalId: string;
  operatorUser?: string;
  voidWindowMinutes: number;
}

export function getMerchantContext(claims: MerchantClaims): MerchantContext {
  if (!claims?.merchant_id) throw new Error("missing merchant_id in claims");
  if (!claims?.terminal_id) throw new Error("missing terminal_id in claims");
  return {
    merchantId: claims.merchant_id,
    terminalId: claims.terminal_id,
    operatorUser: claims.operator_user,
    voidWindowMinutes: claims.void_window_minutes ?? 10,
  };
}

export function useMerchantContext(): MerchantContext {
  const { claims } = useSession() as { claims: MerchantClaims };
  return getMerchantContext(claims);
}
```

If `useSession` returns a different shape in this repo, adapt the destructuring + cast.

- [ ] **Step 5: Run — pass**

- [ ] **Step 6: Commit**

```bash
git add apps/merchant
git commit -m "feat(merchant): merchant-session helper for JWT claims"
```

---

## Task 9: MSW handlers (`mocks/`)

**Files:**
- Create: `apps/merchant/src/mocks/browser.ts`
- Create: `apps/merchant/src/mocks/server.ts`
- Create: `apps/merchant/src/mocks/handlers.ts`
- Create: `apps/merchant/src/mocks/db.ts`
- Replace stub `mocks/browser.ts` from Task 1.

`db.ts` = in-memory fixtures (one merchant, two operators, three students w/ kartu + saldo, three catalog items, one daily limit student).

- [ ] **Step 1: Write `mocks/db.ts`**

```ts
export interface MockStudent { kartu_id: string; nama: string; saldo: number; daily_limit?: number; today_spent: number; blocked_kategori: string[]; postpaid: boolean; }
export interface MockItem { name: string; nama: string; harga: number; kategori_item: string; aktif: boolean; track_stok: boolean; stok_qty: number | null; }
export interface MockTxn { name: string; kartu: string; nominal: number; items: { name: string; qty: number; price: number }[]; merchant: string; terminal_id: string; tanggal: string; status: "Bayar" | "Void"; void_deadline_iso: string; }

export const db = {
  merchant: { name: "M-001", nama: "Kantin Sekolah A", tipe: "Internal" as const, kategori: "MAKAN" },
  students: [
    { kartu_id: "KARTU-001", nama: "Andi", saldo: 50000, today_spent: 0, blocked_kategori: [], postpaid: false } as MockStudent,
    { kartu_id: "KARTU-002", nama: "Budi", saldo: 5000, today_spent: 0, blocked_kategori: [], postpaid: true } as MockStudent,
    { kartu_id: "KARTU-003", nama: "Citra", saldo: 100000, daily_limit: 20000, today_spent: 18000, blocked_kategori: ["JAJAN"], postpaid: false } as MockStudent,
  ] as MockStudent[],
  items: [
    { name: "I-001", nama: "Nasi Ayam", harga: 15000, kategori_item: "MAKAN", aktif: true, track_stok: false, stok_qty: null },
    { name: "I-002", nama: "Es Teh", harga: 5000, kategori_item: "MINUM", aktif: true, track_stok: true, stok_qty: 3 },
    { name: "I-003", nama: "Snack", harga: 8000, kategori_item: "JAJAN", aktif: true, track_stok: false, stok_qty: null },
  ] as MockItem[],
  transaksi: [] as MockTxn[],
  idempotency: new Map<string, MockTxn>(),
};
```

- [ ] **Step 2: Write `mocks/handlers.ts`**

```ts
import { http, HttpResponse } from "msw";
import { db } from "./db";

const VOID_WINDOW_MIN = 10;

function isoNowPlus(min: number) {
  return new Date(Date.now() + min * 60_000).toISOString();
}

function decodeToken(raw: string): { kartu_id: string; exp: number } | null {
  try {
    const pad = raw.length % 4 === 0 ? "" : "=".repeat(4 - (raw.length % 4));
    const s = raw.replace(/-/g, "+").replace(/_/g, "/") + pad;
    const obj = JSON.parse(atob(s));
    if (typeof obj.kartu_id !== "string" || typeof obj.exp !== "number") return null;
    return { kartu_id: obj.kartu_id, exp: obj.exp };
  } catch { return null; }
}

export const handlers = [
  http.get("/api/method/ping", () => HttpResponse.json({ ok: true })),

  http.get("/api/method/sekolahpro.koperasi.merchant.catalog", () => {
    return HttpResponse.json({ message: db.items.filter((i) => i.aktif) });
  }),

  http.post("/api/method/sekolahpro.koperasi.merchant.charge", async ({ request }) => {
    const body = await request.json() as {
      terminal_id: string;
      card_token: string;
      items: { name: string; qty: number }[];
      amount: number;
      idempotency_key: string;
    };

    if (db.idempotency.has(body.idempotency_key)) {
      const txn = db.idempotency.get(body.idempotency_key)!;
      return HttpResponse.json({ message: { txn_name: txn.name, balance_after: 0, replayed: true } });
    }

    const tok = decodeToken(body.card_token);
    if (!tok) return HttpResponse.json({ message: { error: "CARD_INVALID" } }, { status: 400 });
    if (tok.exp < Math.floor(Date.now() / 1000))
      return HttpResponse.json({ message: { error: "CARD_EXPIRED" } }, { status: 400 });

    const stu = db.students.find((s) => s.kartu_id === tok.kartu_id);
    if (!stu) return HttpResponse.json({ message: { error: "CARD_INVALID" } }, { status: 400 });

    if (stu.blocked_kategori.includes(db.merchant.kategori))
      return HttpResponse.json({ message: { error: "KATEGORI_BLOCKED" } }, { status: 400 });

    if (stu.daily_limit !== undefined && stu.today_spent + body.amount > stu.daily_limit)
      return HttpResponse.json({ message: { error: "DAILY_LIMIT_EXCEEDED" } }, { status: 400 });

    if (stu.saldo < body.amount && !stu.postpaid)
      return HttpResponse.json({ message: { error: "INSUFFICIENT_FUNDS" } }, { status: 400 });

    stu.saldo = Math.max(0, stu.saldo - body.amount);
    stu.today_spent += body.amount;

    const txn = {
      name: `EMT-${Date.now()}`,
      kartu: stu.kartu_id,
      nominal: body.amount,
      items: body.items.map((it) => ({ name: it.name, qty: it.qty, price: db.items.find((i) => i.name === it.name)?.harga ?? 0 })),
      merchant: db.merchant.name,
      terminal_id: body.terminal_id,
      tanggal: new Date().toISOString(),
      status: "Bayar" as const,
      void_deadline_iso: isoNowPlus(VOID_WINDOW_MIN),
    };
    db.transaksi.unshift(txn);
    db.idempotency.set(body.idempotency_key, txn);

    return HttpResponse.json({
      message: {
        txn_name: txn.name,
        nama_siswa: stu.nama,
        balance_after: stu.saldo,
        void_deadline_iso: txn.void_deadline_iso,
      },
    });
  }),

  http.post("/api/method/sekolahpro.koperasi.merchant.void", async ({ request }) => {
    const { txn_name } = await request.json() as { txn_name: string };
    const txn = db.transaksi.find((t) => t.name === txn_name);
    if (!txn) return HttpResponse.json({ message: { error: "NOT_FOUND" } }, { status: 404 });
    if (new Date(txn.void_deadline_iso).getTime() < Date.now())
      return HttpResponse.json({ message: { error: "VOID_WINDOW_EXPIRED" } }, { status: 400 });
    txn.status = "Void";
    const stu = db.students.find((s) => s.kartu_id === txn.kartu);
    if (stu) { stu.saldo += txn.nominal; stu.today_spent = Math.max(0, stu.today_spent - txn.nominal); }
    return HttpResponse.json({ message: { ok: true } });
  }),

  http.get("/api/method/sekolahpro.koperasi.merchant.transaksi", () => {
    return HttpResponse.json({ message: db.transaksi });
  }),

  http.get("/api/method/sekolahpro.koperasi.merchant.daily_report", () => {
    const today = db.transaksi.filter((t) => t.status === "Bayar");
    return HttpResponse.json({ message: {
      total_transaksi: today.length,
      total_nominal: today.reduce((a, t) => a + t.nominal, 0),
      by_item: db.items.map((i) => ({
        name: i.name, nama: i.nama,
        qty: today.flatMap((t) => t.items).filter((it) => it.name === i.name).reduce((a, it) => a + it.qty, 0),
      })),
    } });
  }),
];
```

- [ ] **Step 3: Write `mocks/browser.ts`**

```ts
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export async function startMocks() {
  const worker = setupWorker(...handlers);
  await worker.start({ onUnhandledRequest: "bypass" });
}
```

- [ ] **Step 4: Write `mocks/server.ts`** (for vitest)

```ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

- [ ] **Step 5: Wire vitest setup**

Create `apps/merchant/vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { server } from "./src/mocks/server";
import { beforeAll, afterAll, afterEach } from "vitest";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

Update `vite.config.ts` to add vitest config (append at bottom of defineConfig):

```ts
// inside defineConfig({ ... })
test: {
  globals: true,
  environment: "jsdom",
  setupFiles: ["./vitest.setup.ts"],
},
```

Add `@testing-library/jest-dom` to devDependencies and re-install:

```bash
pnpm -C apps/merchant add -D @testing-library/jest-dom
```

- [ ] **Step 6: Smoke test — start dev, hit `/api/method/sekolahpro.koperasi.merchant.catalog` from browser DevTools**

```bash
pnpm -C apps/merchant dev
```

Then in browser console: `fetch('/api/method/sekolahpro.koperasi.merchant.catalog').then(r=>r.json()).then(console.log)`.

Expected: `{ message: [...3 items] }`.

- [ ] **Step 7: Commit**

```bash
git add apps/merchant
git commit -m "feat(merchant): MSW handlers for charge/void/catalog/report"
```

---

## Task 10: `merchant-api.ts` typed wrappers

**Files:**
- Test: `apps/merchant/src/lib/__tests__/merchant-api.test.ts`
- Create: `apps/merchant/src/lib/merchant-api.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { merchantApi } from "../merchant-api";

describe("merchantApi", () => {
  it("getCatalog returns items", async () => {
    const items = await merchantApi.getCatalog();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toHaveProperty("nama");
  });

  it("charge happy path", async () => {
    const token = btoa(JSON.stringify({
      kartu_id: "KARTU-001", nonce: "n", exp: Math.floor(Date.now()/1000)+60, hmac: "h",
    })).replace(/=+$/, "");
    const res = await merchantApi.charge({
      terminal_id: "T-1",
      card_token: token,
      items: [{ name: "I-001", qty: 1 }],
      amount: 15000,
      idempotency_key: crypto.randomUUID(),
    });
    expect(res.txn_name).toMatch(/^EMT-/);
    expect(res.balance_after).toBeGreaterThanOrEqual(0);
  });

  it("charge rejects insufficient funds", async () => {
    const token = btoa(JSON.stringify({
      kartu_id: "KARTU-002", nonce: "n2", exp: Math.floor(Date.now()/1000)+60, hmac: "h",
    })).replace(/=+$/, "");
    await expect(merchantApi.charge({
      terminal_id: "T-1", card_token: token,
      items: [{ name: "I-001", qty: 1 }], amount: 99999,
      idempotency_key: crypto.randomUUID(),
    })).rejects.toMatchObject({ code: "INSUFFICIENT_FUNDS" });
  });
});
```

Note: Test 3 uses KARTU-002 who has postpaid=true and saldo=5000 — needs adjusting in db. Update db fixture so KARTU-002 has `postpaid: false` to make this test meaningful, OR change the test student. Simplest: change db `KARTU-002.postpaid` to `false`. Apply this edit in Step 3 below.

- [ ] **Step 2: Run — fail**

- [ ] **Step 3: Edit `mocks/db.ts` — set KARTU-002 postpaid=false**

```ts
{ kartu_id: "KARTU-002", nama: "Budi", saldo: 5000, today_spent: 0, blocked_kategori: [], postpaid: false },
```

- [ ] **Step 4: Implement `merchant-api.ts`**

```ts
// apps/merchant/src/lib/merchant-api.ts
import { rpc } from "@sekolahpro/api-client";
import { ChargeErrorCode } from "./error-codes";

export interface CatalogItem {
  name: string; nama: string; harga: number;
  kategori_item: string; aktif: boolean;
  track_stok: boolean; stok_qty: number | null;
}

export interface ChargeInput {
  terminal_id: string;
  card_token: string;
  items: { name: string; qty: number }[];
  amount: number;
  idempotency_key: string;
}

export interface ChargeResult {
  txn_name: string;
  nama_siswa: string;
  balance_after: number;
  void_deadline_iso: string;
  replayed?: boolean;
}

export class ChargeError extends Error {
  readonly code: ChargeErrorCode;
  constructor(code: ChargeErrorCode, message?: string) {
    super(message ?? code);
    this.name = "ChargeError";
    this.code = code;
  }
}

function envelope<T>(p: Promise<{ message: T | { error: string } }>): Promise<T> {
  return p.then((r) => {
    const m = r.message as T & { error?: string };
    if (m && typeof m === "object" && "error" in m && typeof m.error === "string") {
      const code = (ChargeErrorCode as Record<string, string>)[m.error] ?? ChargeErrorCode.UNKNOWN;
      throw new ChargeError(code as ChargeErrorCode);
    }
    return m as T;
  });
}

export const merchantApi = {
  getCatalog: () =>
    envelope(rpc.get<{ message: CatalogItem[] }>("/api/method/sekolahpro.koperasi.merchant.catalog")),
  charge: (input: ChargeInput) =>
    envelope(rpc.post<{ message: ChargeResult }>("/api/method/sekolahpro.koperasi.merchant.charge", input)),
  void: (txn_name: string, reason: string) =>
    envelope(rpc.post<{ message: { ok: true } }>("/api/method/sekolahpro.koperasi.merchant.void", { txn_name, reason })),
  listTransaksi: () =>
    envelope(rpc.get<{ message: any[] }>("/api/method/sekolahpro.koperasi.merchant.transaksi")),
  dailyReport: () =>
    envelope(rpc.get<{ message: { total_transaksi: number; total_nominal: number; by_item: { name: string; nama: string; qty: number }[] } }>("/api/method/sekolahpro.koperasi.merchant.daily_report")),
};
```

Note: `rpc.get`/`rpc.post` are assumed exports on `@sekolahpro/api-client`. Inspect the actual API:

```bash
grep -n "export" packages/api-client/src/index.ts | head -30
```

If the surface differs (e.g., a single `request<T>(method, url, body?)`), adapt the calls. Document the chosen signatures in the commit.

- [ ] **Step 5: Run — pass**

```bash
pnpm -C apps/merchant test
```

- [ ] **Step 6: Commit**

```bash
git add apps/merchant
git commit -m "feat(merchant): typed merchant-api wrappers + ChargeError"
```

---

## Task 11: `tap-pay.ts` orchestrator

**Files:**
- Test: `apps/merchant/src/lib/__tests__/tap-pay.test.ts`
- Create: `apps/merchant/src/lib/tap-pay.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from "vitest";
import { tapPay } from "../tap-pay";
import { ChargeError } from "../merchant-api";
import { ChargeErrorCode } from "../error-codes";

function makeToken(kartu = "KARTU-001") {
  return btoa(JSON.stringify({
    kartu_id: kartu, nonce: "n", exp: Math.floor(Date.now()/1000)+60, hmac: "h",
  })).replace(/=+$/, "");
}

describe("tapPay", () => {
  it("happy path returns receipt", async () => {
    const api = { charge: vi.fn().mockResolvedValue({ txn_name: "T1", nama_siswa: "Andi", balance_after: 35000, void_deadline_iso: "x" }) };
    const idem = { next: vi.fn().mockReturnValue("idem-1") };
    const res = await tapPay({
      api, idempotency: idem,
      input: { terminal_id: "T", card_token: makeToken(), items: [{ name: "I-001", qty: 1 }], amount: 15000 },
    });
    expect(res.kind).toBe("ok");
    expect(api.charge).toHaveBeenCalledWith(expect.objectContaining({ idempotency_key: "idem-1" }));
  });

  it("maps ChargeError to error result", async () => {
    const api = { charge: vi.fn().mockRejectedValue(new ChargeError(ChargeErrorCode.INSUFFICIENT_FUNDS)) };
    const idem = { next: vi.fn().mockReturnValue("idem-2") };
    const res = await tapPay({
      api, idempotency: idem,
      input: { terminal_id: "T", card_token: makeToken(), items: [], amount: 15000 },
    });
    expect(res.kind).toBe("error");
    if (res.kind === "error") expect(res.code).toBe(ChargeErrorCode.INSUFFICIENT_FUNDS);
  });

  it("retries on network error w/ same idempotency_key", async () => {
    const charge = vi.fn()
      .mockRejectedValueOnce(new ChargeError(ChargeErrorCode.NETWORK))
      .mockResolvedValueOnce({ txn_name: "T2", nama_siswa: "X", balance_after: 0, void_deadline_iso: "x" });
    const idem = { next: vi.fn().mockReturnValue("idem-3") };
    const res = await tapPay({
      api: { charge }, idempotency: idem, retryDelayMs: 0,
      input: { terminal_id: "T", card_token: makeToken(), items: [], amount: 1 },
    });
    expect(res.kind).toBe("ok");
    expect(charge).toHaveBeenCalledTimes(2);
    expect(charge.mock.calls[0][0].idempotency_key).toBe("idem-3");
    expect(charge.mock.calls[1][0].idempotency_key).toBe("idem-3");
  });
});
```

- [ ] **Step 2: Run — fail**

- [ ] **Step 3: Implement**

```ts
// apps/merchant/src/lib/tap-pay.ts
import { ChargeError, type ChargeInput, type ChargeResult } from "./merchant-api";
import { ChargeErrorCode } from "./error-codes";

interface ApiPort { charge(input: ChargeInput): Promise<ChargeResult> }
interface IdempotencyPort { next(): string }

interface Deps {
  api: ApiPort;
  idempotency: IdempotencyPort;
  input: Omit<ChargeInput, "idempotency_key">;
  maxRetries?: number;
  retryDelayMs?: number;
}

export type TapPayResult =
  | { kind: "ok"; receipt: ChargeResult }
  | { kind: "error"; code: ChargeErrorCode };

const RETRYABLE: ReadonlySet<ChargeErrorCode> = new Set([
  ChargeErrorCode.NETWORK,
]);

export async function tapPay({
  api, idempotency, input, maxRetries = 3, retryDelayMs = 250,
}: Deps): Promise<TapPayResult> {
  const idempotency_key = idempotency.next();
  let attempt = 0;
  while (true) {
    try {
      const receipt = await api.charge({ ...input, idempotency_key });
      return { kind: "ok", receipt };
    } catch (e) {
      if (e instanceof ChargeError) {
        if (RETRYABLE.has(e.code) && attempt < maxRetries) {
          attempt += 1;
          await new Promise((r) => setTimeout(r, retryDelayMs));
          continue;
        }
        return { kind: "error", code: e.code };
      }
      return { kind: "error", code: ChargeErrorCode.UNKNOWN };
    }
  }
}
```

- [ ] **Step 4: Run — pass**

- [ ] **Step 5: Commit**

```bash
git add apps/merchant
git commit -m "feat(merchant): tap-pay orchestrator with idempotency + retry"
```

---

## Task 12: `OfflineBanner` + connectivity wiring

**Files:**
- Test: `apps/merchant/src/components/__tests__/OfflineBanner.test.tsx`
- Create: `apps/merchant/src/components/OfflineBanner.tsx`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OfflineBanner } from "../OfflineBanner";

describe("OfflineBanner", () => {
  it("renders when offline", () => {
    render(<OfflineBanner online={false} />);
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });
  it("renders nothing when online", () => {
    const { container } = render(<OfflineBanner online={true} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Fail**

- [ ] **Step 3: Implement**

```tsx
// apps/merchant/src/components/OfflineBanner.tsx
export function OfflineBanner({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <div role="status" className="bg-amber-500 text-white text-sm text-center py-2">
      Offline — transaksi tap kartu dinonaktifkan sampai koneksi pulih.
    </div>
  );
}
```

- [ ] **Step 4: Pass**

- [ ] **Step 5: Commit**

```bash
git add apps/merchant
git commit -m "feat(merchant): OfflineBanner component"
```

---

## Task 13: `Cart` component

**Files:**
- Test: `apps/merchant/src/components/__tests__/Cart.test.tsx`
- Create: `apps/merchant/src/components/Cart.tsx`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Cart } from "../Cart";

const items = [
  { name: "I-001", nama: "Nasi", harga: 15000 },
  { name: "I-002", nama: "Es Teh", harga: 5000 },
];

describe("Cart", () => {
  it("computes total", () => {
    render(<Cart lines={[{ item: items[0], qty: 2 }, { item: items[1], qty: 1 }]} onChangeQty={() => {}} onRemove={() => {}} onTap={() => {}} disabled={false} />);
    expect(screen.getByTestId("cart-total").textContent).toContain("35.000");
  });

  it("disables tap when empty", () => {
    render(<Cart lines={[]} onChangeQty={() => {}} onRemove={() => {}} onTap={() => {}} disabled={false} />);
    expect(screen.getByRole("button", { name: /tap kartu/i })).toBeDisabled();
  });

  it("fires onTap when clicked", () => {
    const onTap = vi.fn();
    render(<Cart lines={[{ item: items[0], qty: 1 }]} onChangeQty={() => {}} onRemove={() => {}} onTap={onTap} disabled={false} />);
    fireEvent.click(screen.getByRole("button", { name: /tap kartu/i }));
    expect(onTap).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Fail**

- [ ] **Step 3: Implement**

```tsx
// apps/merchant/src/components/Cart.tsx
import { Button } from "@sekolahpro/ui";

export interface CartLineItem { name: string; nama: string; harga: number }
export interface CartLine { item: CartLineItem; qty: number }

interface Props {
  lines: CartLine[];
  disabled: boolean;
  onChangeQty: (name: string, qty: number) => void;
  onRemove: (name: string) => void;
  onTap: () => void;
}

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export function Cart({ lines, disabled, onChangeQty, onRemove, onTap }: Props) {
  const total = lines.reduce((a, l) => a + l.item.harga * l.qty, 0);
  return (
    <div className="flex flex-col gap-2 p-3 border-t bg-bg">
      <ul className="flex-1 overflow-auto">
        {lines.map((l) => (
          <li key={l.item.name} className="flex items-center gap-2 py-1">
            <span className="flex-1 truncate">{l.item.nama}</span>
            <button aria-label={`kurangi ${l.item.nama}`} onClick={() => onChangeQty(l.item.name, Math.max(0, l.qty - 1))}>−</button>
            <span className="w-6 text-center tabular-nums">{l.qty}</span>
            <button aria-label={`tambah ${l.item.nama}`} onClick={() => onChangeQty(l.item.name, l.qty + 1)}>+</button>
            <span className="w-24 text-right tabular-nums">{formatRp(l.item.harga * l.qty)}</span>
            <button aria-label={`hapus ${l.item.nama}`} onClick={() => onRemove(l.item.name)}>✕</button>
          </li>
        ))}
      </ul>
      <div className="flex justify-between font-semibold">
        <span>Total</span>
        <span data-testid="cart-total" className="tabular-nums">{formatRp(total)}</span>
      </div>
      <Button onClick={onTap} disabled={disabled || lines.length === 0}>
        Tap kartu siswa
      </Button>
    </div>
  );
}
```

If `Button` from `@sekolahpro/ui` accepts different prop names, adapt.

- [ ] **Step 4: Pass**

- [ ] **Step 5: Commit**

```bash
git add apps/merchant
git commit -m "feat(merchant): Cart component with totals + tap action"
```

---

## Task 14: `CatalogGrid` + `QuickAmountPad`

**Files:**
- Test: `apps/merchant/src/components/__tests__/CatalogGrid.test.tsx`
- Create: `apps/merchant/src/components/CatalogGrid.tsx`
- Create: `apps/merchant/src/components/QuickAmountPad.tsx`

- [ ] **Step 1: CatalogGrid test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CatalogGrid } from "../CatalogGrid";

const items = [
  { name: "I-001", nama: "Nasi", harga: 15000, kategori_item: "MAKAN", aktif: true, track_stok: false, stok_qty: null },
  { name: "I-002", nama: "Es Teh", harga: 5000, kategori_item: "MINUM", aktif: true, track_stok: true, stok_qty: 0 },
];

describe("CatalogGrid", () => {
  it("renders items + filters by kategori", () => {
    render(<CatalogGrid items={items} onAdd={() => {}} kategoriFilter="MAKAN" onKategoriChange={() => {}} />);
    expect(screen.getByText("Nasi")).toBeInTheDocument();
    expect(screen.queryByText("Es Teh")).not.toBeInTheDocument();
  });

  it("disables add when stok 0", () => {
    render(<CatalogGrid items={items} onAdd={() => {}} kategoriFilter="ALL" onKategoriChange={() => {}} />);
    expect(screen.getByRole("button", { name: /es teh/i })).toBeDisabled();
  });

  it("fires onAdd", () => {
    const onAdd = vi.fn();
    render(<CatalogGrid items={items} onAdd={onAdd} kategoriFilter="ALL" onKategoriChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /nasi/i }));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ name: "I-001" }));
  });
});
```

- [ ] **Step 2: Fail**

- [ ] **Step 3: Implement `CatalogGrid.tsx`**

```tsx
// apps/merchant/src/components/CatalogGrid.tsx
import type { CatalogItem } from "../lib/merchant-api";

interface Props {
  items: CatalogItem[];
  kategoriFilter: string;
  onKategoriChange: (k: string) => void;
  onAdd: (item: CatalogItem) => void;
}

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export function CatalogGrid({ items, kategoriFilter, onKategoriChange, onAdd }: Props) {
  const kategoriList = Array.from(new Set(items.map((i) => i.kategori_item)));
  const filtered = kategoriFilter === "ALL"
    ? items
    : items.filter((i) => i.kategori_item === kategoriFilter);
  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex gap-2 overflow-x-auto">
        <button className={kategoriFilter === "ALL" ? "font-bold" : ""} onClick={() => onKategoriChange("ALL")}>Semua</button>
        {kategoriList.map((k) => (
          <button key={k} className={kategoriFilter === k ? "font-bold" : ""} onClick={() => onKategoriChange(k)}>{k}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {filtered.map((it) => {
          const outOfStock = it.track_stok && (it.stok_qty ?? 0) <= 0;
          return (
            <button
              key={it.name}
              disabled={outOfStock}
              aria-label={it.nama}
              onClick={() => onAdd(it)}
              className="rounded-lg border p-3 text-left disabled:opacity-50"
            >
              <div className="font-medium">{it.nama}</div>
              <div className="text-sm tabular-nums">{formatRp(it.harga)}</div>
              {outOfStock && <div className="text-xs text-red-600">Stok habis</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Pass**

- [ ] **Step 5: QuickAmountPad test + impl**

```tsx
// apps/merchant/src/components/__tests__/QuickAmountPad.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuickAmountPad } from "../QuickAmountPad";

describe("QuickAmountPad", () => {
  it("fires onConfirm with amount", () => {
    const onConfirm = vi.fn();
    render(<QuickAmountPad onConfirm={onConfirm} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "1" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    fireEvent.click(screen.getByRole("button", { name: /konfirmasi/i }));
    expect(onConfirm).toHaveBeenCalledWith(10000);
  });
});
```

```tsx
// apps/merchant/src/components/QuickAmountPad.tsx
import { useState } from "react";

interface Props { onConfirm: (amount: number) => void; onCancel: () => void }

export function QuickAmountPad({ onConfirm, onCancel }: Props) {
  const [s, setS] = useState("");
  const append = (d: string) => setS((p) => (p + d).slice(0, 9));
  const back = () => setS((p) => p.slice(0, -1));
  const amt = Number(s || "0");
  return (
    <div className="p-3">
      <div className="text-3xl text-right tabular-nums mb-2">Rp {amt.toLocaleString("id-ID")}</div>
      <div className="grid grid-cols-3 gap-2">
        {["1","2","3","4","5","6","7","8","9","⌫","0","✓"].map((k) => {
          const onClick =
            k === "⌫" ? back :
            k === "✓" ? () => onConfirm(amt) :
            () => append(k);
          return <button key={k} onClick={onClick} className="rounded-lg border py-3">{k === "✓" ? "Konfirmasi" : k}</button>;
        })}
      </div>
      <button onClick={onCancel} className="mt-2 w-full text-sm text-muted-fg">Batal</button>
    </div>
  );
}
```

- [ ] **Step 6: Run all tests — pass**

- [ ] **Step 7: Commit**

```bash
git add apps/merchant
git commit -m "feat(merchant): CatalogGrid + QuickAmountPad components"
```

---

## Task 15: `CardReaderSheet`

**Files:**
- Test: `apps/merchant/src/components/__tests__/CardReaderSheet.test.tsx`
- Create: `apps/merchant/src/components/CardReaderSheet.tsx`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CardReaderSheet } from "../CardReaderSheet";

describe("CardReaderSheet", () => {
  it("renders NFC tab by default + QR tab toggle", () => {
    render(<CardReaderSheet open onClose={() => {}} onToken={() => {}} nfcSupported />);
    expect(screen.getByText(/tap kartu/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /qr/i }));
    expect(screen.getByText(/scan qr/i)).toBeInTheDocument();
  });

  it("forces QR when NFC unsupported", () => {
    render(<CardReaderSheet open onClose={() => {}} onToken={() => {}} nfcSupported={false} />);
    expect(screen.queryByRole("button", { name: /nfc/i })).toBeNull();
    expect(screen.getByText(/scan qr/i)).toBeInTheDocument();
  });

  it("fires onClose", () => {
    const onClose = vi.fn();
    render(<CardReaderSheet open onClose={onClose} onToken={() => {}} nfcSupported />);
    fireEvent.click(screen.getByRole("button", { name: /tutup/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Fail**

- [ ] **Step 3: Implement**

```tsx
// apps/merchant/src/components/CardReaderSheet.tsx
import { useState, useEffect } from "react";
import { useNfcReader, useQrScanner, type CardToken } from "@sekolahpro/card";

interface Props {
  open: boolean;
  onClose: () => void;
  onToken: (t: CardToken) => void;
  nfcSupported: boolean;
}

export function CardReaderSheet({ open, onClose, onToken, nfcSupported }: Props) {
  const [tab, setTab] = useState<"nfc" | "qr">(nfcSupported ? "nfc" : "qr");

  useNfcReader({
    enabled: open && tab === "nfc" && nfcSupported,
    onRead: onToken,
  });

  const { videoRef, start, stop } = useQrScanner({ onRead: onToken });

  useEffect(() => {
    if (open && tab === "qr") start();
    return () => stop();
  }, [open, tab, start, stop]);

  if (!open) return null;
  return (
    <div role="dialog" className="fixed inset-0 bg-black/40 flex items-end">
      <div className="w-full bg-bg rounded-t-xl p-4">
        <div className="flex gap-2 mb-3">
          {nfcSupported && (
            <button aria-label="NFC" className={tab === "nfc" ? "font-bold" : ""} onClick={() => setTab("nfc")}>NFC</button>
          )}
          <button aria-label="QR" className={tab === "qr" ? "font-bold" : ""} onClick={() => setTab("qr")}>QR</button>
          <button aria-label="Tutup" className="ml-auto" onClick={onClose}>✕</button>
        </div>
        {tab === "nfc" && (
          <div className="text-center py-8">
            <div className="text-lg font-semibold mb-2">Tap kartu siswa</div>
            <div className="text-sm text-muted-fg">Dekatkan kartu ke belakang HP</div>
          </div>
        )}
        {tab === "qr" && (
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Scan QR siswa</div>
            <video ref={videoRef} className="w-full max-h-64 mx-auto rounded" />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Pass**

- [ ] **Step 5: Commit**

```bash
git add apps/merchant
git commit -m "feat(merchant): CardReaderSheet NFC+QR tabs"
```

---

## Task 16: `_app.tsx` auth-guarded shell

**Files:**
- Create: `apps/merchant/src/routes/_app.tsx`
- Edit: `apps/merchant/src/routes/login.tsx`

- [ ] **Step 1: Write `routes/login.tsx`**

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { login } from "@sekolahpro/auth";
import { Button } from "@sekolahpro/ui";

function LoginPage() {
  const nav = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ username: u, password: p, pairing_code: code, scope: "merchant" } as any);
      nav({ to: "/_app/pos" });
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  return (
    <form onSubmit={submit} className="max-w-sm mx-auto p-6 flex flex-col gap-3">
      <h1 className="text-xl font-semibold">Merchant Login</h1>
      <input className="border p-2 rounded" placeholder="Username" value={u} onChange={(e) => setU(e.target.value)} />
      <input className="border p-2 rounded" type="password" placeholder="Password" value={p} onChange={(e) => setP(e.target.value)} />
      <input className="border p-2 rounded" placeholder="Pairing code (6 digit)" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} />
      <Button type="submit">Masuk</Button>
      {err && <div className="text-red-600 text-sm">{err}</div>}
    </form>
  );
}

export const Route = createFileRoute("/login")({ component: LoginPage });
```

If `@sekolahpro/auth` `login` signature differs, adapt; the `scope: "merchant"` claim hint is forwarded to backend.

- [ ] **Step 2: Write `routes/_app.tsx`**

```tsx
import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useSession } from "@sekolahpro/auth";
import { OfflineBanner } from "../components/OfflineBanner";
import { useConnectivity } from "../lib/connectivity";
import { merchantApi } from "../lib/merchant-api";

function pingFn() {
  return fetch("/api/method/ping").then((r) => r.ok).catch(() => false);
}

function AppShell() {
  const { online } = useConnectivity({ pingFn, intervalMs: 15000 });
  const path = useRouterState({ select: (s) => s.location.pathname });
  const tab = (to: string, label: string) => (
    <Link to={to} className={`flex-1 text-center py-2 ${path.startsWith(to) ? "font-semibold" : ""}`}>{label}</Link>
  );
  return (
    <div className="flex flex-col h-full">
      <OfflineBanner online={online} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <nav className="flex border-t bg-bg">
        {tab("/_app/pos", "POS")}
        {tab("/_app/catalog", "Katalog")}
        {tab("/_app/transaksi", "Transaksi")}
        {tab("/_app/laporan", "Laporan")}
        {tab("/_app/pengaturan", "Setelan")}
      </nav>
    </div>
  );
}

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    const session = useSession.getSnapshot?.() as { authenticated?: boolean } | undefined;
    if (session && session.authenticated === false) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppShell,
});
```

Note: `useSession.getSnapshot` is illustrative — implement against the actual `@sekolahpro/auth` API. If only a hook is available, do the auth check inside the component and call `useNavigate` to redirect.

- [ ] **Step 3: Run dev — visit `/_app/pos`, expect redirect to /login if not logged in**

```bash
pnpm -C apps/merchant dev
```

- [ ] **Step 4: Commit**

```bash
git add apps/merchant
git commit -m "feat(merchant): _app shell + login route"
```

---

## Task 17: POS route

**Files:**
- Create: `apps/merchant/src/routes/_app.pos.index.tsx`

- [ ] **Step 1: Implement**

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { merchantApi, type CatalogItem } from "../lib/merchant-api";
import { CatalogGrid } from "../components/CatalogGrid";
import { Cart, type CartLine } from "../components/Cart";
import { CardReaderSheet } from "../components/CardReaderSheet";
import { QuickAmountPad } from "../components/QuickAmountPad";
import { useMerchantContext } from "../lib/merchant-session";
import { useConnectivity } from "../lib/connectivity";
import { tapPay } from "../lib/tap-pay";
import { chargeErrorMessage } from "../lib/error-codes";
import { useNfcReader } from "@sekolahpro/card";

function pingFn() { return fetch("/api/method/ping").then((r) => r.ok).catch(() => false); }

function PosPage() {
  const nav = useNavigate();
  const ctx = useMerchantContext();
  const { online } = useConnectivity({ pingFn, intervalMs: 10000 });
  const { supported: nfcSupported } = useNfcReader({ enabled: false });
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: merchantApi.getCatalog });
  const [lines, setLines] = useState<CartLine[]>([]);
  const [kategori, setKategori] = useState("ALL");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);

  const addItem = (it: CatalogItem) => {
    setLines((prev) => {
      const exist = prev.find((l) => l.item.name === it.name);
      if (exist) return prev.map((l) => l.item.name === it.name ? { ...l, qty: l.qty + 1 } : l);
      return [...prev, { item: { name: it.name, nama: it.nama, harga: it.harga }, qty: 1 }];
    });
  };
  const changeQty = (n: string, q: number) =>
    setLines((p) => q === 0 ? p.filter((l) => l.item.name !== n) : p.map((l) => l.item.name === n ? { ...l, qty: q } : l));
  const remove = (n: string) => setLines((p) => p.filter((l) => l.item.name !== n));

  const total = pendingAmount ?? lines.reduce((a, l) => a + l.item.harga * l.qty, 0);

  const onTap = () => { setErr(null); setSheetOpen(true); };

  const handleToken = async (token: { raw: string }) => {
    if (busy) return;
    setBusy(true);
    const result = await tapPay({
      api: merchantApi,
      idempotency: { next: () => crypto.randomUUID() },
      input: {
        terminal_id: ctx.terminalId,
        card_token: token.raw,
        items: lines.map((l) => ({ name: l.item.name, qty: l.qty })),
        amount: total,
      },
    });
    setBusy(false);
    setSheetOpen(false);
    if (result.kind === "ok") {
      setLines([]); setPendingAmount(null);
      nav({ to: "/_app/pos/confirm/$txnId", params: { txnId: result.receipt.txn_name } });
    } else {
      setErr(chargeErrorMessage(result.code));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        {catalog.data && (
          <CatalogGrid items={catalog.data} kategoriFilter={kategori} onKategoriChange={setKategori} onAdd={addItem} />
        )}
        <button className="mx-3 my-2 px-3 py-2 border rounded" onClick={() => setQuickOpen(true)}>
          Manual amount
        </button>
      </div>
      <Cart
        lines={lines}
        disabled={!online || busy}
        onChangeQty={changeQty}
        onRemove={remove}
        onTap={onTap}
      />
      {err && <div role="alert" className="text-red-600 text-sm p-2">{err}</div>}
      <CardReaderSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onToken={handleToken}
        nfcSupported={nfcSupported}
      />
      {quickOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end">
          <div className="w-full bg-bg rounded-t-xl">
            <QuickAmountPad
              onCancel={() => setQuickOpen(false)}
              onConfirm={(amt) => { setPendingAmount(amt); setLines([]); setQuickOpen(false); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/_app/pos/")({ component: PosPage });
```

- [ ] **Step 2: Manual smoke test**

```bash
pnpm -C apps/merchant dev
```

Login (bypass for now if auth not wired — temporarily comment out `beforeLoad` in `_app.tsx`), open `/_app/pos`. Add items. Click "Tap kartu siswa". Sheet opens. (No real NFC in dev — task 18 confirm route receives a synthetic token via console for now.)

- [ ] **Step 3: Commit**

```bash
git add apps/merchant
git commit -m "feat(merchant): POS route with catalog + cart + reader sheet"
```

---

## Task 18: Confirm route + `ReceiptSheet`

**Files:**
- Create: `apps/merchant/src/components/ReceiptSheet.tsx`
- Create: `apps/merchant/src/routes/_app.pos.confirm.$txnId.tsx`

- [ ] **Step 1: Implement `ReceiptSheet.tsx`**

```tsx
import { Button } from "@sekolahpro/ui";

interface Props {
  txnId: string;
  namaSiswa: string;
  nominal: number;
  balanceAfter: number;
  voidDeadlineIso: string;
  onClose: () => void;
  onVoid?: () => void;
}

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export function ReceiptSheet({ txnId, namaSiswa, nominal, balanceAfter, voidDeadlineIso, onClose, onVoid }: Props) {
  const canVoid = new Date(voidDeadlineIso).getTime() > Date.now();
  return (
    <div className="p-4 flex flex-col gap-2">
      <div className="text-2xl text-emerald-600 font-semibold">✓ Berhasil</div>
      <div className="text-sm text-muted-fg">{txnId}</div>
      <div className="text-lg">{namaSiswa}</div>
      <div className="text-3xl tabular-nums">{formatRp(nominal)}</div>
      <div className="text-sm">Sisa saldo: <span className="tabular-nums">{formatRp(balanceAfter)}</span></div>
      <div className="flex gap-2 mt-3">
        <Button onClick={onClose}>Selesai</Button>
        {canVoid && onVoid && <Button variant="ghost" onClick={onVoid}>Batalkan</Button>}
      </div>
    </div>
  );
}
```

Adapt `Button.variant` to actual `@sekolahpro/ui` API.

- [ ] **Step 2: Implement confirm route**

```tsx
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { merchantApi } from "../lib/merchant-api";
import { ReceiptSheet } from "../components/ReceiptSheet";

function ConfirmPage() {
  const { txnId } = useParams({ from: "/_app/pos/confirm/$txnId" });
  const nav = useNavigate();
  const qc = useQueryClient();
  const txns = useQuery({ queryKey: ["transaksi"], queryFn: merchantApi.listTransaksi });
  const t = txns.data?.find((x: any) => x.name === txnId);
  const voidMut = useMutation({
    mutationFn: () => merchantApi.void(txnId, "operator request"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transaksi"] }); nav({ to: "/_app/pos" }); },
  });

  useEffect(() => {
    const id = setTimeout(() => nav({ to: "/_app/pos" }), 5000);
    return () => clearTimeout(id);
  }, [nav]);

  if (!t) return <div className="p-4">Memuat…</div>;
  return (
    <ReceiptSheet
      txnId={t.name}
      namaSiswa={t.kartu}
      nominal={t.nominal}
      balanceAfter={0}
      voidDeadlineIso={t.void_deadline_iso}
      onClose={() => nav({ to: "/_app/pos" })}
      onVoid={() => voidMut.mutate()}
    />
  );
}

export const Route = createFileRoute("/_app/pos/confirm/$txnId")({ component: ConfirmPage });
```

- [ ] **Step 3: Commit**

```bash
git add apps/merchant
git commit -m "feat(merchant): confirm/receipt route with auto-clear + void"
```

---

## Task 19: Catalog CRUD routes

**Files:**
- Create: `apps/merchant/src/routes/_app.catalog.index.tsx`
- Create: `apps/merchant/src/routes/_app.catalog.$name.tsx`
- Extend `mocks/handlers.ts` with POST/PUT/DELETE catalog item.

- [ ] **Step 1: Extend handlers**

Append to `handlers.ts`:

```ts
http.post("/api/method/sekolahpro.koperasi.merchant.catalog_upsert", async ({ request }) => {
  const body = await request.json() as { name?: string; nama: string; harga: number; kategori_item: string; aktif: boolean; track_stok: boolean; stok_qty: number | null };
  if (body.name) {
    const idx = db.items.findIndex((i) => i.name === body.name);
    if (idx >= 0) { db.items[idx] = { ...db.items[idx], ...body, name: body.name }; }
  } else {
    db.items.push({ ...body, name: `I-${Date.now()}` });
  }
  return HttpResponse.json({ message: { ok: true } });
}),

http.delete("/api/method/sekolahpro.koperasi.merchant.catalog_delete", async ({ request }) => {
  const { name } = await request.json() as { name: string };
  const idx = db.items.findIndex((i) => i.name === name);
  if (idx >= 0) db.items.splice(idx, 1);
  return HttpResponse.json({ message: { ok: true } });
}),
```

Extend `merchantApi`:

```ts
upsertCatalog: (item: Partial<CatalogItem> & { nama: string; harga: number; kategori_item: string; aktif: boolean; track_stok: boolean; stok_qty: number | null }) =>
  envelope(rpc.post<{ message: { ok: true } }>("/api/method/sekolahpro.koperasi.merchant.catalog_upsert", item)),
deleteCatalog: (name: string) =>
  envelope(rpc.post<{ message: { ok: true } }>("/api/method/sekolahpro.koperasi.merchant.catalog_delete", { name })),
```

- [ ] **Step 2: Implement list + edit pages** (mirror pattern from `apps/school/src/routes/$sekolah.akuntansi.referensi.currency.tsx` ResourceListPage style; show name, harga, kategori, aktif; edit screen has form fields and save/delete buttons)

- [ ] **Step 3: Commit**

```bash
git add apps/merchant
git commit -m "feat(merchant): catalog list + edit routes + upsert/delete API"
```

---

## Task 20: Transaksi list + detail

**Files:**
- Create: `apps/merchant/src/routes/_app.transaksi.index.tsx`
- Create: `apps/merchant/src/routes/_app.transaksi.$name.tsx`

- [ ] **Step 1: Implement list page**

Show table: tanggal, kartu, items count, nominal, status. Click row → detail.

- [ ] **Step 2: Detail page**

Show full breakdown + void button (visible only if `void_deadline_iso > now` && status === "Bayar").

- [ ] **Step 3: Commit**

```bash
git add apps/merchant
git commit -m "feat(merchant): transaksi list + detail routes"
```

---

## Task 21: Laporan harian

**Files:**
- Create: `apps/merchant/src/routes/_app.laporan.tsx`

- [ ] **Step 1: Implement**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { merchantApi } from "../lib/merchant-api";

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

function LaporanPage() {
  const q = useQuery({ queryKey: ["daily"], queryFn: merchantApi.dailyReport });
  if (!q.data) return <div className="p-4">Memuat…</div>;
  return (
    <div className="p-4 flex flex-col gap-3">
      <h1 className="text-xl font-semibold">Laporan Hari Ini</h1>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded border p-3">
          <div className="text-sm text-muted-fg">Total transaksi</div>
          <div className="text-2xl tabular-nums">{q.data.total_transaksi}</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-sm text-muted-fg">Total nominal</div>
          <div className="text-2xl tabular-nums">{formatRp(q.data.total_nominal)}</div>
        </div>
      </div>
      <h2 className="text-lg font-semibold">Per item</h2>
      <table className="w-full text-sm">
        <thead><tr className="text-left"><th>Nama</th><th className="text-right">Qty</th></tr></thead>
        <tbody>
          {q.data.by_item.map((r) => (
            <tr key={r.name}><td>{r.nama}</td><td className="text-right tabular-nums">{r.qty}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Route = createFileRoute("/_app/laporan")({ component: LaporanPage });
```

- [ ] **Step 2: Commit**

```bash
git add apps/merchant
git commit -m "feat(merchant): laporan harian route"
```

---

## Task 22: Pengaturan + logout + ganti operator

**Files:**
- Create: `apps/merchant/src/routes/_app.pengaturan.tsx`
- Create: `apps/merchant/src/components/OperatorPinModal.tsx`

- [ ] **Step 1: OperatorPinModal — 4-digit input + onConfirm**

```tsx
import { useState } from "react";

interface Props { onConfirm: (pin: string) => void; onCancel: () => void }

export function OperatorPinModal({ onConfirm, onCancel }: Props) {
  const [pin, setPin] = useState("");
  return (
    <div role="dialog" className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-bg p-4 rounded-xl w-72">
        <div className="font-semibold mb-2">Ganti operator</div>
        <input
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className="w-full border p-2 rounded text-center text-2xl tracking-widest"
        />
        <div className="flex gap-2 mt-3">
          <button onClick={onCancel} className="flex-1 border rounded py-2">Batal</button>
          <button onClick={() => onConfirm(pin)} disabled={pin.length !== 4} className="flex-1 bg-brand text-white rounded py-2 disabled:opacity-50">OK</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Pengaturan page**

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { logout } from "@sekolahpro/auth";
import { useMerchantContext } from "../lib/merchant-session";
import { OperatorPinModal } from "../components/OperatorPinModal";

function PengaturanPage() {
  const ctx = useMerchantContext();
  const nav = useNavigate();
  const [pinOpen, setPinOpen] = useState(false);
  return (
    <div className="p-4 flex flex-col gap-3">
      <div>
        <div className="text-sm text-muted-fg">Merchant</div>
        <div className="font-semibold">{ctx.merchantId}</div>
      </div>
      <div>
        <div className="text-sm text-muted-fg">Terminal</div>
        <div className="font-mono text-xs">{ctx.terminalId}</div>
      </div>
      <div>
        <div className="text-sm text-muted-fg">Operator</div>
        <div>{ctx.operatorUser ?? "—"}</div>
      </div>
      <button onClick={() => setPinOpen(true)} className="border rounded p-2 text-left">Ganti operator</button>
      <button onClick={async () => { await logout(); nav({ to: "/login" }); }} className="border rounded p-2 text-left text-red-600">Logout</button>
      {pinOpen && <OperatorPinModal onCancel={() => setPinOpen(false)} onConfirm={() => setPinOpen(false)} />}
    </div>
  );
}

export const Route = createFileRoute("/_app/pengaturan")({ component: PengaturanPage });
```

(Operator PIN backend wiring TBD with real backend; for v1 frontend, the PIN modal just closes — wire to a `POST switch_operator` endpoint when backend ready.)

- [ ] **Step 3: Commit**

```bash
git add apps/merchant
git commit -m "feat(merchant): pengaturan + operator switch + logout"
```

---

## Task 23: Integration test — full POS happy path (Vitest + MSW)

**Files:**
- Test: `apps/merchant/src/__tests__/pos-flow.test.tsx`

- [ ] **Step 1: Write**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { merchantApi } from "../lib/merchant-api";

vi.mock("@sekolahpro/auth", () => ({
  useSession: () => ({ authenticated: true, claims: { merchant_id: "M-001", terminal_id: "TERM-M-001-00001", void_window_minutes: 10 } }),
  login: vi.fn(), logout: vi.fn(),
}));

describe("POS flow (MSW)", () => {
  it("catalog → cart → tap synthetic token → charge succeeds", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    // import after mocks
    const { Route } = await import("../routes/_app.pos.index");
    const Component = Route.options.component!;
    render(<QueryClientProvider client={qc}><Component /></QueryClientProvider>);

    // wait catalog
    await waitFor(() => screen.getByRole("button", { name: /nasi/i }));

    // add 1× Nasi (15000)
    fireEvent.click(screen.getByRole("button", { name: /nasi/i }));
    expect(screen.getByTestId("cart-total").textContent).toContain("15.000");

    // synthetic token for KARTU-001
    const token = btoa(JSON.stringify({
      kartu_id: "KARTU-001", nonce: "n", exp: Math.floor(Date.now()/1000)+60, hmac: "h",
    })).replace(/=+$/, "");

    // Direct API call to verify MSW happy path (UI flow tested via E2E in Task 24)
    const res = await merchantApi.charge({
      terminal_id: "TERM-M-001-00001",
      card_token: token,
      items: [{ name: "I-001", qty: 1 }],
      amount: 15000,
      idempotency_key: crypto.randomUUID(),
    });
    expect(res.txn_name).toMatch(/^EMT-/);
  });
});
```

- [ ] **Step 2: Run**

```bash
pnpm -C apps/merchant test
```

Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add apps/merchant
git commit -m "test(merchant): integration test POS flow + charge happy path"
```

---

## Task 24: Playwright E2E happy path

**Files:**
- Create: `apps/merchant/playwright.config.ts`
- Create: `apps/merchant/e2e/merchant.spec.ts`
- Update `apps/merchant/package.json` to add e2e script.

- [ ] **Step 1: Install Playwright**

```bash
pnpm -C apps/merchant add -D @playwright/test
pnpm -C apps/merchant exec playwright install --with-deps chromium
```

- [ ] **Step 2: `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  webServer: { command: "pnpm dev", url: "http://localhost:5184", reuseExistingServer: true, timeout: 60_000 },
  use: { baseURL: "http://localhost:5184", browserName: "chromium" },
});
```

- [ ] **Step 3: Test file**

```ts
import { test, expect } from "@playwright/test";

const TOKEN = Buffer.from(JSON.stringify({
  kartu_id: "KARTU-001",
  nonce: "n",
  exp: Math.floor(Date.now() / 1000) + 60,
  hmac: "h",
})).toString("base64url");

test("POS happy path", async ({ page }) => {
  // bypass login: stub session in localStorage
  await page.addInitScript(() => {
    localStorage.setItem("sekolahpro:session", JSON.stringify({
      authenticated: true,
      claims: { merchant_id: "M-001", terminal_id: "TERM-M-001-00001", void_window_minutes: 10 },
    }));
  });

  await page.goto("/_app/pos");
  await page.getByRole("button", { name: /nasi/i }).click();
  await expect(page.getByTestId("cart-total")).toContainText("15.000");

  // open reader sheet then inject token via window event the app listens to in dev
  await page.getByRole("button", { name: /tap kartu siswa/i }).click();

  // dev-only: app exposes window.__devInjectCardToken when VITE_USE_MOCKS=true
  await page.evaluate((tok) => (window as any).__devInjectCardToken?.(tok), TOKEN);

  await expect(page).toHaveURL(/_app\/pos\/confirm\//, { timeout: 5000 });
  await expect(page.getByText(/Berhasil/i)).toBeVisible();
});
```

- [ ] **Step 4: Add `__devInjectCardToken` hook in `CardReaderSheet`**

Inside `CardReaderSheet`, when `import.meta.env.VITE_USE_MOCKS === "true"` and sheet open, expose:

```tsx
useEffect(() => {
  if (!open || import.meta.env.VITE_USE_MOCKS !== "true") return;
  (window as any).__devInjectCardToken = (raw: string) => {
    import("@sekolahpro/card").then(({ parseCardToken }) => {
      try { onToken(parseCardToken(raw)); } catch {}
    });
  };
  return () => { delete (window as any).__devInjectCardToken; };
}, [open, onToken]);
```

- [ ] **Step 5: Stub session in `@sekolahpro/auth` reading localStorage** (only if not already supported by the package; otherwise skip).

- [ ] **Step 6: Run E2E**

```bash
pnpm -C apps/merchant exec playwright test
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add apps/merchant
git commit -m "test(merchant): Playwright e2e POS happy path + dev token injection seam"
```

---

## Task 25: PWA polish + manifest icons

**Files:**
- Create: `apps/merchant/public/pwa-192.png` (placeholder 1×1 if needed)
- Create: `apps/merchant/public/pwa-512.png`
- Verify `vite-plugin-pwa` output.

- [ ] **Step 1: Add placeholder icons**

Use `apps/student/public/*` icons if present, copy to `apps/merchant/public/`. Otherwise generate minimal PNGs.

- [ ] **Step 2: Build + verify SW emitted**

```bash
pnpm -C apps/merchant build
ls apps/merchant/dist | grep -E "sw|manifest"
```

Expected: `sw.js` + `manifest.webmanifest` present.

- [ ] **Step 3: Commit**

```bash
git add apps/merchant
git commit -m "chore(merchant): add PWA icons + verify build emits sw + manifest"
```

---

## Task 26: README + final integration check

**Files:**
- Create: `apps/merchant/README.md`
- Edit: root `README.md` (append app entry).

- [ ] **Step 1: Write `apps/merchant/README.md`**

```md
# @sekolahpro/app-merchant

Mobile-first PWA for kantin/koperasi/vendor cashiers. Pay-by-tap NFC + QR fallback on existing koperasi emoney ledger.

## Dev

\`\`\`bash
pnpm -C apps/merchant dev
\`\`\`

Runs on http://localhost:5184. Uses MSW handlers by default (`VITE_USE_MOCKS=true`).

## Test

\`\`\`bash
pnpm -C apps/merchant test
pnpm -C apps/merchant exec playwright test
\`\`\`

## Backend

This frontend ships against a documented RPC contract. Backend (Frappe doctypes + whitelisted methods) tracked separately. See `docs/superpowers/specs/2026-05-29-merchant-app-design.md` §5–§9.
```

- [ ] **Step 2: Append to root `README.md`** the new app under "Layout" section.

- [ ] **Step 3: Run full workspace verify**

```bash
pnpm install
pnpm -r typecheck
pnpm -r lint
pnpm -r test
```

Fix any cascading issues (most likely: `@sekolahpro/card` peer satisfied, `apps/merchant` typecheck).

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "docs(merchant): README + workspace integration verified"
```

---

## Final verification

- [ ] All 26 tasks complete.
- [ ] `pnpm -r test` green.
- [ ] `pnpm -r typecheck` green.
- [ ] `pnpm -r lint` green.
- [ ] `pnpm -C apps/merchant dev` boots, POS flow works against MSW.
- [ ] Playwright e2e green.
- [ ] Spec sections §1–§17 each have implementation evidence (Tasks listed above):
  - §2 scope → Tasks 1, 17–22 (all in-scope screens shipped); offline-only banner (Task 12) blocks tap.
  - §4 architecture → Tasks 1–10 (deployable + packages + lib structure).
  - §5 data model → MSW reflects (Task 9); real backend deferred to backend plan.
  - §6 payment logic → MSW (Task 9) + ChargeError mapping (Tasks 10–11).
  - §7 card security → server-side; client only parses (Task 3).
  - §8 auth → login route (Task 16). Pairing code field present; backend enforcement deferred.
  - §9 charge validation order → MSW (Task 9).
  - §10 data flow happy path → POS route (Task 17) + reader sheet (Task 15) + tap-pay (Task 11) + confirm (Task 18).
  - §11 edge cases — covered: double-tap (idempotency_key, Task 11), network retry (Task 11), kartu hilang → QR tab (Task 15), stok habis (Task 14), void window expired (Task 18), iOS QR fallback (Task 15 forces QR when nfcSupported=false).
  - §12 settlement → out of scope here (backend + existing koperasi screens).
  - §13 notifications → backend hook; not in this plan.
  - §14 quality rules → enforced by structure (pure lib modules ≤ 40 lines, DI ports, error codes registry).
  - §15 testing → Tasks 3–11 unit, 23 integration, 24 e2e.
  - §16 observability → telemetry call sites TBD post-backend; add hook in Task 11 if needed.
  - §17 rollout → feature flag wiring deferred to deploy task.

## Open follow-ups (not in this plan)

- Backend plan `2026-05-29-merchant-backend.md` — Frappe doctypes (Merchant Terminal, Merchant Kategori, Merchant Catalog Item, Student Spending Control, Merchant Transaction Idempotency), whitelisted methods, JWT claims extension, NDEF signing endpoint.
- Pairing code issuance UI in `apps/school/src/routes/$sekolah.koperasi.pengaturan.tsx`.
- Parent control UI in `apps/student` (daily_limit + blocked_kategori editors).
- Receipt PDF + share intent.
- Operator switch endpoint integration.
