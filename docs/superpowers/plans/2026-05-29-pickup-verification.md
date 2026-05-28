# Pickup Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add pickup verification feature across parent app (`/pickup` — rotating QR + delegate management) and school staff app (`/pickup-verify` — scanner + PIN fallback + release confirmation). Backend contract documented; frontend uses mock fallback gated by `VITE_USE_MOCKS=true` until backend ships.

**Architecture:** Backend signs short-lived (30s) opaque tokens (HMAC) shown as QR by parent app, scanned by school staff app. PIN fallback per `Pickup Person`. Tier-gated parent confirmation: paid tier creates `pending` events that require parent approval before staff can release; free tier auto-approves. All attempts logged as `Pickup Event` rows for audit.

**Tech Stack:** React 18, TanStack Router v1, TanStack Query v5, Vite 5, Tailwind 3, TypeScript 5, `qrcode.react` (display), `@zxing/browser` (scan). Vitest + jest-dom. Workspace packages `@sekolahpro/{api-client,auth,config,tenant,ui}`.

**Spec:** `docs/superpowers/specs/2026-05-29-pickup-verification-design.md`

**Base branch:** Extend the existing `feat/parent-app` worktree (`.worktrees/feat-parent-app`). Both parent + school apps live in the same monorepo so a single branch can ship both surfaces.

---

## File Structure

Created:

```
apps/parent/src/
  data/
    pickup.ts                           # all parent-side hooks
    pickup-types.ts                     # PickupPerson, PickupEvent, IssuedToken
    mock/pickup.ts                      # extends existing mock barrel
  components/
    QRCountdown.tsx                     # QR canvas + auto-refresh + countdown
    PickupPersonForm.tsx                # add/edit dialog form
    PickupPersonList.tsx                # list rows + actions
    PickupEventBanner.tsx               # paid-tier pending banner
    __tests__/QRCountdown.test.tsx
    __tests__/PickupPersonForm.test.tsx
  routes/
    pickup.tsx                          # /pickup route (tabs)

apps/school/src/
  data/
    pickup.ts                           # staff-side hooks
    pickup-types.ts                     # mirrors parent types (read-only on staff)
    mock/pickup.ts
  components/
    QrScanner.tsx                       # @zxing/browser wrapper
    PinFallbackForm.tsx                 # nis → person → pin
    PickupReleaseCard.tsx               # child + person + Lepaskan/Tolak buttons
    __tests__/PinFallbackForm.test.tsx
    __tests__/QrScanner.test.tsx
  routes/
    $sekolah.pickup-verify.tsx          # /<sekolah>/pickup-verify route
```

Modified:

- `apps/parent/package.json` — add `qrcode.react`
- `apps/school/package.json` — add `@zxing/browser`
- `apps/parent/src/routes/__root.tsx` — add `Penjemputan` sidebar item
- `apps/school/src/routes/$sekolah.tsx` — add `Verifikasi Penjemputan` sidebar item (role-gated)

---

## Task 1: Install QR libraries

**Files:**
- Modify: `apps/parent/package.json` (add dep `qrcode.react`)
- Modify: `apps/school/package.json` (add dep `@zxing/browser`)

- [ ] **Step 1: Add deps**

Edit `apps/parent/package.json` — add to `dependencies`:
```json
"qrcode.react": "^3.1.0"
```

Edit `apps/school/package.json` — add to `dependencies`:
```json
"@zxing/browser": "^0.1.5"
```

- [ ] **Step 2: Install**

```bash
cd /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web/.worktrees/feat-parent-app
pnpm install
```

Expected: clean install, no peer-dep errors.

- [ ] **Step 3: Commit**

```bash
git add apps/parent/package.json apps/school/package.json pnpm-lock.yaml
git commit -m "chore(pickup): add qrcode.react and @zxing/browser"
```

---

## Task 2: Parent — pickup types

**Files:**
- Create: `apps/parent/src/data/pickup-types.ts`

- [ ] **Step 1: Write types**

```ts
export type PickupHubungan =
  | "Wali"
  | "Orang Tua"
  | "Kakek-Nenek"
  | "Driver"
  | "Lainnya";

export interface PickupPerson {
  id: string;
  nis: string;
  nama: string;
  hubungan: PickupHubungan;
  phone: string;
  photoUrl: string | null;
  isActive: boolean;
  createdBy: string;
}

export type PickupMethod = "qr" | "pin";
export type PickupEventStatus =
  | "pending"
  | "approved"
  | "declined"
  | "completed"
  | "expired";

export interface PickupEvent {
  id: string;
  nis: string;
  pickupPersonId: string;
  pickupPersonNama: string;
  pickupPersonHubungan: PickupHubungan;
  method: PickupMethod;
  status: PickupEventStatus;
  requestedAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
  verifiedBy: string | null;
  gate: string | null;
  note: string | null;
}

export interface IssuedToken {
  token: string;
  expIso: string;
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @sekolahpro/app-parent typecheck
```

Expected: PASS (no errors from this file).

- [ ] **Step 3: Commit**

```bash
git add apps/parent/src/data/pickup-types.ts
git commit -m "feat(parent/pickup): add pickup domain types"
```

---

## Task 3: Parent — mock fixtures

**Files:**
- Create: `apps/parent/src/data/mock/pickup.ts`

- [ ] **Step 1: Write fixtures**

```ts
import type { PickupPerson, PickupEvent } from "../pickup-types";

export const mockPickupPersons: Record<string, PickupPerson[]> = {
  "1001": [
    {
      id: "pp-self-1001",
      nis: "1001",
      nama: "Saya (Orang Tua)",
      hubungan: "Orang Tua",
      phone: "+6281234567890",
      photoUrl: null,
      isActive: true,
      createdBy: "parent@example.com",
    },
    {
      id: "pp-1001-driver",
      nis: "1001",
      nama: "Pak Budi (Driver)",
      hubungan: "Driver",
      phone: "+6285600001111",
      photoUrl: null,
      isActive: true,
      createdBy: "parent@example.com",
    },
  ],
  "1002": [
    {
      id: "pp-self-1002",
      nis: "1002",
      nama: "Saya (Orang Tua)",
      hubungan: "Orang Tua",
      phone: "+6281234567890",
      photoUrl: null,
      isActive: true,
      createdBy: "parent@example.com",
    },
  ],
};

export const mockPickupEvents: PickupEvent[] = [
  {
    id: "ev-1",
    nis: "1001",
    pickupPersonId: "pp-1001-driver",
    pickupPersonNama: "Pak Budi (Driver)",
    pickupPersonHubungan: "Driver",
    method: "qr",
    status: "completed",
    requestedAt: "2026-05-28T07:25:00Z",
    confirmedAt: "2026-05-28T07:25:05Z",
    completedAt: "2026-05-28T07:26:00Z",
    verifiedBy: "satpam01",
    gate: "Gerbang Utama",
    note: null,
  },
];

export function mockIssueToken(nis: string, personId: string): { token: string; expIso: string } {
  const now = Date.now();
  const exp = new Date(now + 30_000).toISOString();
  const fake = btoa(`${nis}.${personId}.${now}`).replace(/=/g, "");
  return { token: `mock.${fake}`, expIso: exp };
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm --filter @sekolahpro/app-parent typecheck
git add apps/parent/src/data/mock/pickup.ts
git commit -m "feat(parent/pickup): mock fixtures and token generator"
```

---

## Task 4: Parent — data hooks

**Files:**
- Create: `apps/parent/src/data/pickup.ts`

- [ ] **Step 1: Write hooks**

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFrappeMethod, frappeFetch } from "@sekolahpro/api-client";
import type {
  PickupPerson,
  PickupEvent,
  IssuedToken,
  PickupHubungan,
} from "./pickup-types";
import {
  mockPickupPersons,
  mockPickupEvents,
  mockIssueToken,
} from "./mock/pickup";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

const M = {
  list: "sekolahpro.api.pickup.list_pickup_persons",
  create: "sekolahpro.api.pickup.create_pickup_person",
  update: "sekolahpro.api.pickup.update_pickup_person",
  revoke: "sekolahpro.api.pickup.revoke_pickup_person",
  issue: "sekolahpro.api.pickup.issue_pickup_token",
  events: "sekolahpro.api.pickup.list_pickup_events",
  respond: "sekolahpro.api.pickup.parent_respond_pickup",
};

interface WirePickupPerson {
  id: string;
  nis: string;
  nama: string;
  hubungan: PickupHubungan;
  phone: string;
  photo_url: string | null;
  is_active: boolean;
  created_by: string;
}

function fromWirePerson(w: WirePickupPerson): PickupPerson {
  return {
    id: w.id,
    nis: w.nis,
    nama: w.nama,
    hubungan: w.hubungan,
    phone: w.phone,
    photoUrl: w.photo_url,
    isActive: w.is_active,
    createdBy: w.created_by,
  };
}

interface WirePickupEvent {
  id: string;
  nis: string;
  pickup_person_id: string;
  pickup_person_nama: string;
  pickup_person_hubungan: PickupHubungan;
  method: "qr" | "pin";
  status: "pending" | "approved" | "declined" | "completed" | "expired";
  requested_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  verified_by: string | null;
  gate: string | null;
  note: string | null;
}

function fromWireEvent(w: WirePickupEvent): PickupEvent {
  return {
    id: w.id,
    nis: w.nis,
    pickupPersonId: w.pickup_person_id,
    pickupPersonNama: w.pickup_person_nama,
    pickupPersonHubungan: w.pickup_person_hubungan,
    method: w.method,
    status: w.status,
    requestedAt: w.requested_at,
    confirmedAt: w.confirmed_at,
    completedAt: w.completed_at,
    verifiedBy: w.verified_by,
    gate: w.gate,
    note: w.note,
  };
}

export function useListPickupPersons(nis: string | null) {
  const real = useFrappeMethod<WirePickupPerson[]>(
    M.list,
    { nis },
    { enabled: !USE_MOCKS && !!nis },
  );
  const mock = useQuery<PickupPerson[]>({
    queryKey: [M.list, { nis }, "mock"],
    queryFn: async () => (nis ? mockPickupPersons[nis] ?? [] : []),
    enabled: USE_MOCKS && !!nis,
    staleTime: Infinity,
  });
  if (USE_MOCKS) return mock;
  return { ...real, data: real.data?.map(fromWirePerson) } as unknown as typeof mock;
}

export interface CreatePickupPersonInput {
  nis: string;
  nama: string;
  hubungan: PickupHubungan;
  phone: string;
  photoUrl?: string | null;
  pin: string;
}

export function useCreatePickupPerson() {
  const qc = useQueryClient();
  return useMutation<PickupPerson, Error, CreatePickupPersonInput>({
    mutationFn: async (input) => {
      if (USE_MOCKS) {
        const newP: PickupPerson = {
          id: `pp-${Date.now()}`,
          nis: input.nis,
          nama: input.nama,
          hubungan: input.hubungan,
          phone: input.phone,
          photoUrl: input.photoUrl ?? null,
          isActive: true,
          createdBy: "mock-parent",
        };
        const list = mockPickupPersons[input.nis] ?? [];
        mockPickupPersons[input.nis] = [...list, newP];
        return newP;
      }
      const raw = await frappeFetch<WirePickupPerson>(M.create, {
        nis: input.nis,
        nama: input.nama,
        hubungan: input.hubungan,
        phone: input.phone,
        photo_url: input.photoUrl ?? null,
        pin: input.pin,
      });
      return fromWirePerson(raw);
    },
    onSuccess: (_p, vars) => {
      qc.invalidateQueries({ queryKey: [M.list, { nis: vars.nis }] });
    },
  });
}

export interface UpdatePickupPersonInput {
  id: string;
  nis: string;
  nama?: string;
  hubungan?: PickupHubungan;
  phone?: string;
  photoUrl?: string | null;
  pin?: string;
}

export function useUpdatePickupPerson() {
  const qc = useQueryClient();
  return useMutation<PickupPerson, Error, UpdatePickupPersonInput>({
    mutationFn: async (input) => {
      if (USE_MOCKS) {
        const list = mockPickupPersons[input.nis] ?? [];
        const idx = list.findIndex((p) => p.id === input.id);
        if (idx < 0) throw new Error("not_found");
        const merged: PickupPerson = {
          ...list[idx]!,
          nama: input.nama ?? list[idx]!.nama,
          hubungan: input.hubungan ?? list[idx]!.hubungan,
          phone: input.phone ?? list[idx]!.phone,
          photoUrl: input.photoUrl ?? list[idx]!.photoUrl,
        };
        list[idx] = merged;
        mockPickupPersons[input.nis] = [...list];
        return merged;
      }
      const raw = await frappeFetch<WirePickupPerson>(M.update, {
        id: input.id,
        nama: input.nama,
        hubungan: input.hubungan,
        phone: input.phone,
        photo_url: input.photoUrl,
        pin: input.pin,
      });
      return fromWirePerson(raw);
    },
    onSuccess: (_p, vars) => {
      qc.invalidateQueries({ queryKey: [M.list, { nis: vars.nis }] });
    },
  });
}

export function useRevokePickupPerson() {
  const qc = useQueryClient();
  return useMutation<{ ok: true }, Error, { id: string; nis: string }>({
    mutationFn: async (input) => {
      if (USE_MOCKS) {
        const list = mockPickupPersons[input.nis] ?? [];
        mockPickupPersons[input.nis] = list.map((p) =>
          p.id === input.id ? { ...p, isActive: false } : p,
        );
        return { ok: true };
      }
      return frappeFetch<{ ok: true }>(M.revoke, { id: input.id });
    },
    onSuccess: (_o, vars) => {
      qc.invalidateQueries({ queryKey: [M.list, { nis: vars.nis }] });
    },
  });
}

export function useIssuePickupToken() {
  return useMutation<IssuedToken, Error, { nis: string; pickupPersonId: string }>({
    mutationFn: async (input) => {
      if (USE_MOCKS) return mockIssueToken(input.nis, input.pickupPersonId);
      const raw = await frappeFetch<{ token: string; exp_iso: string }>(
        M.issue,
        { nis: input.nis, pickup_person_id: input.pickupPersonId },
      );
      return { token: raw.token, expIso: raw.exp_iso };
    },
  });
}

export function useListPickupEvents(nis: string | null, sinceIso?: string) {
  const real = useFrappeMethod<WirePickupEvent[]>(
    M.events,
    { nis, since_iso: sinceIso },
    { enabled: !USE_MOCKS && !!nis, refetchInterval: 3000 },
  );
  const mock = useQuery<PickupEvent[]>({
    queryKey: [M.events, { nis, sinceIso }, "mock"],
    queryFn: async () =>
      nis ? mockPickupEvents.filter((e) => e.nis === nis) : [],
    enabled: USE_MOCKS && !!nis,
    refetchInterval: USE_MOCKS ? 3000 : false,
    staleTime: 0,
  });
  if (USE_MOCKS) return mock;
  return { ...real, data: real.data?.map(fromWireEvent) } as unknown as typeof mock;
}

export function useParentRespondPickup() {
  const qc = useQueryClient();
  return useMutation<
    PickupEvent,
    Error,
    { eventId: string; nis: string; decision: "approve" | "decline" }
  >({
    mutationFn: async (input) => {
      if (USE_MOCKS) {
        const idx = mockPickupEvents.findIndex((e) => e.id === input.eventId);
        if (idx < 0) throw new Error("not_found");
        const next: PickupEvent = {
          ...mockPickupEvents[idx]!,
          status: input.decision === "approve" ? "approved" : "declined",
          confirmedAt: new Date().toISOString(),
        };
        mockPickupEvents[idx] = next;
        return next;
      }
      const raw = await frappeFetch<WirePickupEvent>(M.respond, {
        event_id: input.eventId,
        decision: input.decision,
      });
      return fromWireEvent(raw);
    },
    onSuccess: (_e, vars) => {
      qc.invalidateQueries({ queryKey: [M.events, { nis: vars.nis }] });
    },
  });
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @sekolahpro/app-parent typecheck
```

If `noUncheckedIndexedAccess` complains on `list[idx]`, add `!` non-null assertions where shown. Behavior identical.

- [ ] **Step 3: Commit**

```bash
git add apps/parent/src/data/pickup.ts
git commit -m "feat(parent/pickup): add data hooks with mock fallback"
```

---

## Task 5: Parent — QRCountdown component (TDD)

**Files:**
- Test: `apps/parent/src/components/__tests__/QRCountdown.test.tsx`
- Create: `apps/parent/src/components/QRCountdown.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { QRCountdown } from "../QRCountdown";

function secondsFromNow(s: number) {
  return new Date(Date.now() + s * 1000).toISOString();
}

describe("QRCountdown", () => {
  it("renders QR canvas with token", () => {
    render(<QRCountdown token="abc.def.xyz" expIso={secondsFromNow(30)} onRefreshNeeded={() => {}} />);
    expect(screen.getByTestId("pickup-qr")).toBeInTheDocument();
  });

  it("shows last 6 chars of token", () => {
    render(<QRCountdown token="abc.def.ABCDEF" expIso={secondsFromNow(30)} onRefreshNeeded={() => {}} />);
    expect(screen.getByText(/ABCDEF/)).toBeInTheDocument();
  });

  it("calls onRefreshNeeded when countdown crosses 5s", () => {
    vi.useFakeTimers();
    const onRefresh = vi.fn();
    render(<QRCountdown token="t" expIso={secondsFromNow(8)} onRefreshNeeded={onRefresh} />);
    act(() => { vi.advanceTimersByTime(3500); });
    expect(onRefresh).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run — FAIL**

```bash
pnpm --filter @sekolahpro/app-parent test -- components/__tests__/QRCountdown
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```tsx
import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

interface Props {
  token: string;
  expIso: string;
  onRefreshNeeded: () => void;
}

const REFRESH_LEAD_MS = 5_000;

export function QRCountdown({ token, expIso, onRefreshNeeded }: Props) {
  const expMs = new Date(expIso).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const remainingMs = Math.max(0, expMs - now);
  const remainingSec = Math.ceil(remainingMs / 1000);

  useEffect(() => {
    if (remainingMs <= REFRESH_LEAD_MS) onRefreshNeeded();
  }, [remainingMs, onRefreshNeeded]);

  const short = token.slice(-6).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-3">
      <div data-testid="pickup-qr" className="rounded-lg border border-border bg-white p-4">
        <QRCodeCanvas value={token} size={256} includeMargin={false} />
      </div>
      <div className="text-center">
        <div className="font-mono text-sm text-fg">Kode: {short}</div>
        <div className="text-[11px] text-muted-fg">Berlaku {remainingSec} detik</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run — PASS**

```bash
pnpm --filter @sekolahpro/app-parent test -- components/__tests__/QRCountdown
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/parent/src/components/QRCountdown.tsx apps/parent/src/components/__tests__/QRCountdown.test.tsx
git commit -m "feat(parent/pickup): QRCountdown component with auto-refresh"
```

---

## Task 6: Parent — PickupPersonForm (TDD)

**Files:**
- Test: `apps/parent/src/components/__tests__/PickupPersonForm.test.tsx`
- Create: `apps/parent/src/components/PickupPersonForm.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PickupPersonForm } from "../PickupPersonForm";

const WEAK_PIN = "123456";

describe("PickupPersonForm", () => {
  it("rejects PIN shorter than 6 digits", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PickupPersonForm onSubmit={onSubmit} onCancel={() => {}} />);
    await user.type(screen.getByLabelText(/nama/i), "Pak Budi");
    await user.type(screen.getByLabelText(/phone/i), "+62812000");
    await user.type(screen.getByLabelText(/^pin/i), "12345");
    await user.click(screen.getByRole("button", { name: /simpan/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/6 digit/i)).toBeInTheDocument();
  });

  it("rejects weak PIN 123456", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PickupPersonForm onSubmit={onSubmit} onCancel={() => {}} />);
    await user.type(screen.getByLabelText(/nama/i), "Pak Budi");
    await user.type(screen.getByLabelText(/phone/i), "+62812000");
    await user.type(screen.getByLabelText(/^pin/i), WEAK_PIN);
    await user.click(screen.getByRole("button", { name: /simpan/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/PIN terlalu lemah/i)).toBeInTheDocument();
  });

  it("submits valid values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PickupPersonForm onSubmit={onSubmit} onCancel={() => {}} />);
    await user.type(screen.getByLabelText(/nama/i), "Pak Budi");
    await user.type(screen.getByLabelText(/phone/i), "+62812000");
    await user.type(screen.getByLabelText(/^pin/i), "479216");
    await user.click(screen.getByRole("button", { name: /simpan/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      nama: "Pak Budi",
      hubungan: "Wali",
      phone: "+62812000",
      photoUrl: null,
      pin: "479216",
    });
  });
});
```

- [ ] **Step 2: Run — FAIL**

```bash
pnpm --filter @sekolahpro/app-parent test -- components/__tests__/PickupPersonForm
```

- [ ] **Step 3: Implement**

```tsx
import { useState } from "react";
import { Button, Input } from "@sekolahpro/ui";
import type { PickupHubungan } from "../data/pickup-types";

const WEAK_PINS = new Set(["000000", "111111", "123456", "654321", "123123"]);

const HUBUNGAN: PickupHubungan[] = ["Wali", "Orang Tua", "Kakek-Nenek", "Driver", "Lainnya"];

export interface PickupPersonFormValues {
  nama: string;
  hubungan: PickupHubungan;
  phone: string;
  photoUrl: string | null;
  pin: string;
}

interface Props {
  initial?: Partial<PickupPersonFormValues>;
  pinOptional?: boolean;
  onSubmit: (v: PickupPersonFormValues) => void;
  onCancel: () => void;
}

export function PickupPersonForm({ initial, pinOptional, onSubmit, onCancel }: Props) {
  const [nama, setNama] = useState(initial?.nama ?? "");
  const [hubungan, setHubungan] = useState<PickupHubungan>(initial?.hubungan ?? "Wali");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial?.photoUrl ?? null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!nama.trim()) return "Nama wajib diisi";
    if (!phone.trim()) return "Phone wajib diisi";
    if (!pinOptional || pin.length > 0) {
      if (!/^[0-9]{6}$/.test(pin)) return "PIN harus 6 digit angka";
      if (WEAK_PINS.has(pin)) return "PIN terlalu lemah, pilih yang lain";
    }
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    onSubmit({ nama: nama.trim(), hubungan, phone: phone.trim(), photoUrl, pin });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor="pp-nama" className="text-sm font-medium text-fg">Nama</label>
        <Input id="pp-nama" value={nama} onChange={(e) => setNama(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="pp-hubungan" className="text-sm font-medium text-fg">Hubungan</label>
        <select
          id="pp-hubungan"
          value={hubungan}
          onChange={(e) => setHubungan(e.target.value as PickupHubungan)}
          className="w-full rounded-md border border-border bg-bg px-2 py-1.5 text-sm"
        >
          {HUBUNGAN.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="pp-phone" className="text-sm font-medium text-fg">Phone</label>
        <Input id="pp-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="pp-photo" className="text-sm font-medium text-fg">URL Foto (opsional)</label>
        <Input id="pp-photo" value={photoUrl ?? ""} onChange={(e) => setPhotoUrl(e.target.value || null)} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="pp-pin" className="text-sm font-medium text-fg">PIN {pinOptional ? "(kosongkan jika tidak diubah)" : ""}</label>
        <Input id="pp-pin" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} />
      </div>
      {error ? (
        <div role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" onClick={onCancel} className="bg-muted text-fg">Batal</Button>
        <Button type="submit">Simpan</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Run — PASS**

```bash
pnpm --filter @sekolahpro/app-parent test -- components/__tests__/PickupPersonForm
```

- [ ] **Step 5: Commit**

```bash
git add apps/parent/src/components/PickupPersonForm.tsx apps/parent/src/components/__tests__/PickupPersonForm.test.tsx
git commit -m "feat(parent/pickup): PickupPersonForm with validation"
```

---

## Task 7: Parent — PickupPersonList + PickupEventBanner

**Files:**
- Create: `apps/parent/src/components/PickupPersonList.tsx`
- Create: `apps/parent/src/components/PickupEventBanner.tsx`

- [ ] **Step 1: PickupPersonList**

```tsx
import type { PickupPerson } from "../data/pickup-types";

interface Props {
  items: PickupPerson[];
  onEdit: (p: PickupPerson) => void;
  onRevoke: (p: PickupPerson) => void;
}

export function PickupPersonList({ items, onEdit, onRevoke }: Props) {
  if (items.length === 0) return <div className="text-sm text-muted-fg">Belum ada penjemput.</div>;
  return (
    <ul className="divide-y divide-border">
      {items.map((p) => (
        <li key={p.id} className="flex items-center justify-between py-3 text-sm">
          <div className="flex items-center gap-3">
            {p.photoUrl ? (
              <img src={p.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand/15 text-xs font-semibold text-brand">
                {p.nama.charAt(0)}
              </span>
            )}
            <div>
              <div className={`font-medium ${p.isActive ? "text-fg" : "text-muted-fg line-through"}`}>{p.nama}</div>
              <div className="text-[11px] text-muted-fg">{p.hubungan} · {p.phone}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" className="text-xs text-brand hover:underline" onClick={() => onEdit(p)}>Edit</button>
            {p.isActive ? (
              <button type="button" className="text-xs text-danger hover:underline" onClick={() => onRevoke(p)}>Cabut</button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: PickupEventBanner**

```tsx
import type { PickupEvent } from "../data/pickup-types";

interface Props {
  event: PickupEvent;
  onApprove: () => void;
  onDecline: () => void;
  isResponding: boolean;
}

export function PickupEventBanner({ event, onApprove, onDecline, isResponding }: Props) {
  const at = new Date(event.requestedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  return (
    <div role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm">
      <div className="font-medium text-amber-900">Penjemputan menunggu konfirmasi</div>
      <div className="text-amber-800">
        {event.pickupPersonNama} ({event.pickupPersonHubungan}) di {event.gate ?? "gerbang"} pukul {at}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={isResponding}
          onClick={onApprove}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          Setujui
        </button>
        <button
          type="button"
          disabled={isResponding}
          onClick={onDecline}
          className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-60"
        >
          Tolak
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/parent/src/components/PickupPersonList.tsx apps/parent/src/components/PickupEventBanner.tsx
git commit -m "feat(parent/pickup): list and pending event banner components"
```

---

## Task 8: Parent — `/pickup` route

**Files:**
- Create: `apps/parent/src/routes/pickup.tsx`

- [ ] **Step 1: Write route**

```tsx
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@sekolahpro/auth";
import { PageHeader, SectionCard } from "@sekolahpro/ui";
import { useActiveChild } from "../lib/activeChild";
import {
  useListPickupPersons,
  useCreatePickupPerson,
  useUpdatePickupPerson,
  useRevokePickupPerson,
  useIssuePickupToken,
  useListPickupEvents,
  useParentRespondPickup,
} from "../data/pickup";
import type { PickupPerson } from "../data/pickup-types";
import { QRCountdown } from "../components/QRCountdown";
import { PickupPersonForm, type PickupPersonFormValues } from "../components/PickupPersonForm";
import { PickupPersonList } from "../components/PickupPersonList";
import { PickupEventBanner } from "../components/PickupEventBanner";

type Tab = "qr" | "list";

function PickupPage() {
  const { activeNis, children } = useActiveChild();
  const active = children.find((c) => c.nis === activeNis);
  const [tab, setTab] = useState<Tab>("qr");
  const [editing, setEditing] = useState<PickupPerson | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const persons = useListPickupPersons(activeNis);
  const activePersons = useMemo(() => (persons.data ?? []).filter((p) => p.isActive), [persons.data]);

  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedPersonId && activePersons.length > 0) setSelectedPersonId(activePersons[0]!.id);
  }, [activePersons, selectedPersonId]);

  const issue = useIssuePickupToken();
  const [token, setToken] = useState<{ token: string; expIso: string } | null>(null);

  async function refresh() {
    if (!activeNis || !selectedPersonId) return;
    const t = await issue.mutateAsync({ nis: activeNis, pickupPersonId: selectedPersonId });
    setToken(t);
  }

  useEffect(() => { void refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [activeNis, selectedPersonId]);

  const events = useListPickupEvents(activeNis);
  const pending = (events.data ?? []).find((e) => e.status === "pending");
  const respond = useParentRespondPickup();

  const create = useCreatePickupPerson();
  const update = useUpdatePickupPerson();
  const revoke = useRevokePickupPerson();

  function handleCreate(v: PickupPersonFormValues) {
    if (!activeNis) return;
    create.mutate({ nis: activeNis, ...v, photoUrl: v.photoUrl }, { onSuccess: () => setShowAdd(false) });
  }

  function handleUpdate(v: PickupPersonFormValues) {
    if (!editing) return;
    update.mutate({ id: editing.id, nis: editing.nis, ...v }, { onSuccess: () => setEditing(null) });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Penjemputan" subtitle={active ? `${active.nama} · ${active.kelas}` : ""} />

      {pending ? (
        <PickupEventBanner
          event={pending}
          isResponding={respond.isPending}
          onApprove={() => respond.mutate({ eventId: pending.id, nis: pending.nis, decision: "approve" })}
          onDecline={() => respond.mutate({ eventId: pending.id, nis: pending.nis, decision: "decline" })}
        />
      ) : null}

      <div className="flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("qr")}
          className={`px-3 py-2 text-sm ${tab === "qr" ? "border-b-2 border-brand font-medium text-fg" : "text-muted-fg"}`}
        >QR</button>
        <button
          type="button"
          onClick={() => setTab("list")}
          className={`px-3 py-2 text-sm ${tab === "list" ? "border-b-2 border-brand font-medium text-fg" : "text-muted-fg"}`}
        >Daftar Penjemput</button>
      </div>

      {tab === "qr" ? (
        <SectionCard title="Tunjukkan QR ke petugas">
          {activePersons.length === 0 ? (
            <div className="text-sm text-muted-fg">Belum ada penjemput aktif. Tambah di tab Daftar Penjemput.</div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5 max-w-xs">
                <label htmlFor="pp-select" className="text-sm font-medium text-fg">Penjemput</label>
                <select
                  id="pp-select"
                  value={selectedPersonId ?? ""}
                  onChange={(e) => setSelectedPersonId(e.target.value)}
                  className="w-full rounded-md border border-border bg-bg px-2 py-1.5 text-sm"
                >
                  {activePersons.map((p) => (
                    <option key={p.id} value={p.id}>{p.nama} · {p.hubungan}</option>
                  ))}
                </select>
              </div>
              {token ? (
                <QRCountdown token={token.token} expIso={token.expIso} onRefreshNeeded={() => void refresh()} />
              ) : (
                <div className="text-sm text-muted-fg">Memuat QR…</div>
              )}
            </div>
          )}
        </SectionCard>
      ) : (
        <SectionCard
          title="Daftar penjemput"
          actions={
            <button type="button" onClick={() => setShowAdd(true)} className="text-xs text-brand hover:underline">+ Tambah</button>
          }
        >
          {persons.isLoading ? (
            <div className="text-sm text-muted-fg">Memuat…</div>
          ) : (
            <PickupPersonList
              items={persons.data ?? []}
              onEdit={(p) => setEditing(p)}
              onRevoke={(p) => revoke.mutate({ id: p.id, nis: p.nis })}
            />
          )}
        </SectionCard>
      )}

      {showAdd ? (
        <SectionCard title="Tambah penjemput">
          <PickupPersonForm onSubmit={handleCreate} onCancel={() => setShowAdd(false)} />
        </SectionCard>
      ) : null}

      {editing ? (
        <SectionCard title={`Edit ${editing.nama}`}>
          <PickupPersonForm
            initial={{
              nama: editing.nama,
              hubungan: editing.hubungan,
              phone: editing.phone,
              photoUrl: editing.photoUrl,
            }}
            pinOptional
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        </SectionCard>
      ) : null}
    </div>
  );
}

export const Route = createFileRoute("/pickup")({
  component: () => (<RequireAuth><PickupPage /></RequireAuth>),
});
```

- [ ] **Step 2: Note on `SectionCard.actions`**

If `SectionCard` does not accept an `actions` prop, refactor: put the `+ Tambah` button outside the card or inside its body. Check `packages/ui/src/index.ts` for actual props.

- [ ] **Step 3: Commit**

```bash
git add apps/parent/src/routes/pickup.tsx
git commit -m "feat(parent/pickup): /pickup route with QR + delegate management"
```

---

## Task 9: Parent — sidebar entry

**Files:**
- Modify: `apps/parent/src/routes/__root.tsx`

- [ ] **Step 1: Add nav item**

In the `SidebarNav` items array, add an entry for `Penjemputan` between `Pesan` and `Pembayaran` (use whatever icon is exported by `@sekolahpro/ui` — `IconShield` if present, else `IconCheck`):

```ts
{ label: "Penjemputan", to: "/pickup", icon: <IconShield /> },
```

If `IconShield` is not exported, fall back to `IconCheck` and add it to the imports.

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm --filter @sekolahpro/app-parent typecheck
git add apps/parent/src/routes/__root.tsx
git commit -m "feat(parent/pickup): add Penjemputan sidebar entry"
```

---

## Task 10: School — pickup types + mock fixtures

**Files:**
- Create: `apps/school/src/data/pickup-types.ts`
- Create: `apps/school/src/data/mock/pickup.ts`

- [ ] **Step 1: pickup-types.ts**

```ts
export type PickupHubungan =
  | "Wali"
  | "Orang Tua"
  | "Kakek-Nenek"
  | "Driver"
  | "Lainnya";

export type PickupEventStatus =
  | "pending"
  | "approved"
  | "declined"
  | "completed"
  | "expired";

export interface PickupPersonSummary {
  id: string;
  nis: string;
  nama: string;
  hubungan: PickupHubungan;
  phone: string;
  photoUrl: string | null;
}

export interface ChildSummaryForStaff {
  nis: string;
  nama: string;
  kelas: string;
  photoUrl: string | null;
}

export interface PickupEvent {
  id: string;
  nis: string;
  childNama: string;
  childKelas: string;
  childPhotoUrl: string | null;
  pickupPersonId: string;
  pickupPersonNama: string;
  pickupPersonHubungan: PickupHubungan;
  pickupPersonPhotoUrl: string | null;
  pickupPersonPhone: string;
  method: "qr" | "pin";
  status: PickupEventStatus;
  requestedAt: string;
  gate: string | null;
  note: string | null;
}

export interface PickupError {
  errorCode: string;
  message: string;
}
```

- [ ] **Step 2: mock/pickup.ts**

```ts
import type { PickupEvent, PickupPersonSummary, PickupError } from "../pickup-types";

const childPhoto = null;

export function mockScanToken(token: string, gate: string | null): PickupEvent | PickupError {
  if (!token.startsWith("mock.")) return { errorCode: "token_invalid", message: "Token tidak valid" };
  return {
    id: `ev-${Date.now()}`,
    nis: "1001",
    childNama: "Andi Pratama",
    childKelas: "XI IPA 2",
    childPhotoUrl: childPhoto,
    pickupPersonId: "pp-1001-driver",
    pickupPersonNama: "Pak Budi (Driver)",
    pickupPersonHubungan: "Driver",
    pickupPersonPhotoUrl: null,
    pickupPersonPhone: "+6285600001111",
    method: "qr",
    status: "approved",
    requestedAt: new Date().toISOString(),
    gate,
    note: null,
  };
}

export function mockListPersonsForNis(nis: string): PickupPersonSummary[] {
  if (nis !== "1001") return [];
  return [
    { id: "pp-1001-driver", nis: "1001", nama: "Pak Budi (Driver)", hubungan: "Driver", phone: "+6285600001111", photoUrl: null },
    { id: "pp-self-1001", nis: "1001", nama: "Bpk Ahmad", hubungan: "Orang Tua", phone: "+6281234567890", photoUrl: null },
  ];
}

export function mockVerifyPin(
  nis: string,
  pickupPersonId: string,
  pin: string,
  gate: string | null,
): PickupEvent | PickupError {
  if (nis !== "1001" || pickupPersonId !== "pp-1001-driver") {
    return { errorCode: "person_not_found", message: "Penjemput tidak ditemukan" };
  }
  if (pin !== "479216") return { errorCode: "pin_invalid", message: "PIN salah" };
  return {
    id: `ev-${Date.now()}`,
    nis,
    childNama: "Andi Pratama",
    childKelas: "XI IPA 2",
    childPhotoUrl: childPhoto,
    pickupPersonId,
    pickupPersonNama: "Pak Budi (Driver)",
    pickupPersonHubungan: "Driver",
    pickupPersonPhotoUrl: null,
    pickupPersonPhone: "+6285600001111",
    method: "pin",
    status: "approved",
    requestedAt: new Date().toISOString(),
    gate,
    note: null,
  };
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm --filter @sekolahpro/app-school typecheck
git add apps/school/src/data/pickup-types.ts apps/school/src/data/mock/pickup.ts
git commit -m "feat(school/pickup): types and mock fixtures"
```

---

## Task 11: School — data hooks

**Files:**
- Create: `apps/school/src/data/pickup.ts`

- [ ] **Step 1: Write hooks**

```ts
import { useMutation, useQuery } from "@tanstack/react-query";
import { frappeFetch, useFrappeMethod } from "@sekolahpro/api-client";
import type {
  PickupEvent,
  PickupError,
  PickupPersonSummary,
  PickupHubungan,
  PickupEventStatus,
} from "./pickup-types";
import {
  mockScanToken,
  mockVerifyPin,
  mockListPersonsForNis,
} from "./mock/pickup";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

const M = {
  scan: "sekolahpro.api.pickup.staff_scan_token",
  verify: "sekolahpro.api.pickup.staff_verify_pin",
  complete: "sekolahpro.api.pickup.staff_complete_pickup",
  decline: "sekolahpro.api.pickup.staff_decline_pickup",
  watch: "sekolahpro.api.pickup.staff_watch_event",
  listPersons: "sekolahpro.api.pickup.staff_list_persons_for_nis",
};

interface WireEvent {
  id: string;
  nis: string;
  child_nama: string;
  child_kelas: string;
  child_photo_url: string | null;
  pickup_person_id: string;
  pickup_person_nama: string;
  pickup_person_hubungan: PickupHubungan;
  pickup_person_photo_url: string | null;
  pickup_person_phone: string;
  method: "qr" | "pin";
  status: PickupEventStatus;
  requested_at: string;
  gate: string | null;
  note: string | null;
}

function fromWireEvent(w: WireEvent): PickupEvent {
  return {
    id: w.id,
    nis: w.nis,
    childNama: w.child_nama,
    childKelas: w.child_kelas,
    childPhotoUrl: w.child_photo_url,
    pickupPersonId: w.pickup_person_id,
    pickupPersonNama: w.pickup_person_nama,
    pickupPersonHubungan: w.pickup_person_hubungan,
    pickupPersonPhotoUrl: w.pickup_person_photo_url,
    pickupPersonPhone: w.pickup_person_phone,
    method: w.method,
    status: w.status,
    requestedAt: w.requested_at,
    gate: w.gate,
    note: w.note,
  };
}

function isError(x: PickupEvent | PickupError): x is PickupError {
  return (x as PickupError).errorCode !== undefined;
}

export function useStaffScanToken() {
  return useMutation<PickupEvent, PickupError, { token: string; gate: string | null }>({
    mutationFn: async (input) => {
      if (USE_MOCKS) {
        const r = mockScanToken(input.token, input.gate);
        if (isError(r)) throw r;
        return r;
      }
      try {
        const raw = await frappeFetch<WireEvent>(M.scan, { token: input.token, gate: input.gate });
        return fromWireEvent(raw);
      } catch (e) {
        throw { errorCode: "unknown", message: (e as Error).message } satisfies PickupError;
      }
    },
  });
}

export function useStaffListPersonsForNis(nis: string | null) {
  const real = useFrappeMethod<PickupPersonSummary[]>(
    M.listPersons,
    { nis },
    { enabled: !USE_MOCKS && !!nis },
  );
  const mock = useQuery<PickupPersonSummary[]>({
    queryKey: [M.listPersons, { nis }, "mock"],
    queryFn: async () => (nis ? mockListPersonsForNis(nis) : []),
    enabled: USE_MOCKS && !!nis,
    staleTime: Infinity,
  });
  return USE_MOCKS ? mock : real;
}

export function useStaffVerifyPin() {
  return useMutation<
    PickupEvent,
    PickupError,
    { nis: string; pickupPersonId: string; pin: string; gate: string | null }
  >({
    mutationFn: async (input) => {
      if (USE_MOCKS) {
        const r = mockVerifyPin(input.nis, input.pickupPersonId, input.pin, input.gate);
        if (isError(r)) throw r;
        return r;
      }
      try {
        const raw = await frappeFetch<WireEvent>(M.verify, {
          nis: input.nis,
          pickup_person_id: input.pickupPersonId,
          pin: input.pin,
          gate: input.gate,
        });
        return fromWireEvent(raw);
      } catch (e) {
        throw { errorCode: "unknown", message: (e as Error).message } satisfies PickupError;
      }
    },
  });
}

export function useStaffCompletePickup() {
  return useMutation<PickupEvent, PickupError, { eventId: string; note?: string }>({
    mutationFn: async (input) => {
      if (USE_MOCKS) {
        return {
          id: input.eventId,
          nis: "1001",
          childNama: "Andi Pratama",
          childKelas: "XI IPA 2",
          childPhotoUrl: null,
          pickupPersonId: "pp-1001-driver",
          pickupPersonNama: "Pak Budi (Driver)",
          pickupPersonHubungan: "Driver",
          pickupPersonPhotoUrl: null,
          pickupPersonPhone: "+6285600001111",
          method: "qr",
          status: "completed",
          requestedAt: new Date().toISOString(),
          gate: null,
          note: input.note ?? null,
        };
      }
      const raw = await frappeFetch<WireEvent>(M.complete, { event_id: input.eventId, note: input.note });
      return fromWireEvent(raw);
    },
  });
}

export function useStaffDeclinePickup() {
  return useMutation<PickupEvent, PickupError, { eventId: string; note: string }>({
    mutationFn: async (input) => {
      if (USE_MOCKS) {
        return {
          id: input.eventId,
          nis: "1001",
          childNama: "Andi Pratama",
          childKelas: "XI IPA 2",
          childPhotoUrl: null,
          pickupPersonId: "pp-1001-driver",
          pickupPersonNama: "Pak Budi (Driver)",
          pickupPersonHubungan: "Driver",
          pickupPersonPhotoUrl: null,
          pickupPersonPhone: "+6285600001111",
          method: "qr",
          status: "declined",
          requestedAt: new Date().toISOString(),
          gate: null,
          note: input.note,
        };
      }
      const raw = await frappeFetch<WireEvent>(M.decline, { event_id: input.eventId, note: input.note });
      return fromWireEvent(raw);
    },
  });
}

export function useStaffWatchEvent(eventId: string | null) {
  const real = useFrappeMethod<WireEvent>(
    M.watch,
    { event_id: eventId },
    { enabled: !USE_MOCKS && !!eventId, refetchInterval: 2000 },
  );
  const mock = useQuery<PickupEvent | null>({
    queryKey: [M.watch, { eventId }, "mock"],
    queryFn: async () => null,
    enabled: USE_MOCKS && !!eventId,
    staleTime: Infinity,
  });
  if (USE_MOCKS) return mock;
  return { ...real, data: real.data ? fromWireEvent(real.data) : undefined } as unknown as typeof mock;
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm --filter @sekolahpro/app-school typecheck
git add apps/school/src/data/pickup.ts
git commit -m "feat(school/pickup): staff data hooks"
```

---

## Task 12: School — PinFallbackForm (TDD)

**Files:**
- Test: `apps/school/src/components/__tests__/PinFallbackForm.test.tsx`
- Create: `apps/school/src/components/PinFallbackForm.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PinFallbackForm } from "../PinFallbackForm";

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("PinFallbackForm", () => {
  it("loads persons after nis search and submits with chosen person + pin", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    wrap(<PinFallbackForm gate="Gerbang Utama" onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/nis/i), "1001");
    await user.click(screen.getByRole("button", { name: /cari/i }));
    const personSelect = await screen.findByLabelText(/penjemput/i);
    await user.selectOptions(personSelect, "pp-1001-driver");
    await user.type(screen.getByLabelText(/pin/i), "479216");
    await user.click(screen.getByRole("button", { name: /verifikasi/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      nis: "1001",
      pickupPersonId: "pp-1001-driver",
      pin: "479216",
      gate: "Gerbang Utama",
    });
  });
});
```

- [ ] **Step 2: Run — FAIL**

```bash
pnpm --filter @sekolahpro/app-school test -- components/__tests__/PinFallbackForm
```

If vitest env / VITE_USE_MOCKS not configured in school app, mirror the parent app pattern: add to `apps/school/vite.config.ts`:

```ts
define: process.env.NODE_ENV === "test"
  ? { "import.meta.env.VITE_USE_MOCKS": JSON.stringify("true") }
  : undefined,
test: { environment: "jsdom", globals: true, setupFiles: ["./src/test-setup.ts"] },
```

And create `apps/school/src/test-setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

Add `@testing-library/jest-dom`, `@testing-library/react`, `@testing-library/user-event`, `jsdom` to `apps/school/package.json` devDeps if not present; `pnpm install`.

- [ ] **Step 3: Implement**

```tsx
import { useState } from "react";
import { Button, Input } from "@sekolahpro/ui";
import { useStaffListPersonsForNis } from "../data/pickup";

export interface PinFallbackValues {
  nis: string;
  pickupPersonId: string;
  pin: string;
  gate: string | null;
}

interface Props {
  gate: string | null;
  onSubmit: (v: PinFallbackValues) => void;
}

export function PinFallbackForm({ gate, onSubmit }: Props) {
  const [nis, setNis] = useState("");
  const [submittedNis, setSubmittedNis] = useState<string | null>(null);
  const persons = useStaffListPersonsForNis(submittedNis);
  const [personId, setPersonId] = useState("");
  const [pin, setPin] = useState("");

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 space-y-1.5">
          <label htmlFor="pin-nis" className="text-sm font-medium text-fg">NIS</label>
          <Input id="pin-nis" value={nis} onChange={(e) => setNis(e.target.value)} />
        </div>
        <div className="self-end">
          <Button type="button" onClick={() => setSubmittedNis(nis.trim() || null)}>Cari</Button>
        </div>
      </div>

      {submittedNis ? (
        persons.isLoading ? (
          <div className="text-sm text-muted-fg">Memuat penjemput…</div>
        ) : (persons.data ?? []).length === 0 ? (
          <div className="text-sm text-danger">Tidak ada penjemput terdaftar untuk NIS ini.</div>
        ) : (
          <>
            <div className="space-y-1.5">
              <label htmlFor="pin-person" className="text-sm font-medium text-fg">Penjemput</label>
              <select
                id="pin-person"
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                className="w-full rounded-md border border-border bg-bg px-2 py-1.5 text-sm"
              >
                <option value="">Pilih penjemput</option>
                {(persons.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.nama} · {p.hubungan}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="pin-pin" className="text-sm font-medium text-fg">PIN</label>
              <Input id="pin-pin" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} />
            </div>
            <Button
              type="button"
              disabled={!personId || pin.length !== 6}
              onClick={() => onSubmit({ nis: submittedNis, pickupPersonId: personId, pin, gate })}
            >Verifikasi</Button>
          </>
        )
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Run — PASS**

```bash
pnpm --filter @sekolahpro/app-school test -- components/__tests__/PinFallbackForm
```

- [ ] **Step 5: Commit**

```bash
git add apps/school/src/components/PinFallbackForm.tsx apps/school/src/components/__tests__/PinFallbackForm.test.tsx apps/school/src/test-setup.ts apps/school/vite.config.ts apps/school/package.json pnpm-lock.yaml
git commit -m "feat(school/pickup): PinFallbackForm with NIS lookup"
```

---

## Task 13: School — QrScanner (TDD with mock)

**Files:**
- Test: `apps/school/src/components/__tests__/QrScanner.test.tsx`
- Create: `apps/school/src/components/QrScanner.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { QrScanner } from "../QrScanner";

vi.mock("@zxing/browser", () => {
  return {
    BrowserQRCodeReader: class {
      async decodeFromVideoDevice(_id: string | null, _video: HTMLVideoElement, cb: (res: { getText(): string } | null, err: unknown) => void) {
        setTimeout(() => cb({ getText: () => "mock.payload.ABC" }, null), 10);
        return { stop: () => {} };
      }
    },
  };
});

describe("QrScanner", () => {
  it("invokes onDecode with token text when a QR is detected", async () => {
    const onDecode = vi.fn();
    render(<QrScanner onDecode={onDecode} />);
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    expect(onDecode).toHaveBeenCalledWith("mock.payload.ABC");
  });
});
```

- [ ] **Step 2: Run — FAIL**

```bash
pnpm --filter @sekolahpro/app-school test -- components/__tests__/QrScanner
```

- [ ] **Step 3: Implement**

```tsx
import { useEffect, useRef } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";

interface Props {
  onDecode: (text: string) => void;
}

export function QrScanner({ onDecode }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stopped = false;
    const reader = new BrowserQRCodeReader();
    let controls: { stop: () => void } | null = null;
    (async () => {
      if (!videoRef.current) return;
      controls = await reader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
        if (stopped) return;
        if (result) onDecode(result.getText());
        // ignore err — every frame without a code surfaces an error in zxing
        void err;
      });
    })();
    return () => {
      stopped = true;
      controls?.stop();
    };
  }, [onDecode]);

  return (
    <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-lg border border-border bg-black">
      <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
    </div>
  );
}
```

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git add apps/school/src/components/QrScanner.tsx apps/school/src/components/__tests__/QrScanner.test.tsx
git commit -m "feat(school/pickup): QrScanner wrapping @zxing/browser"
```

---

## Task 14: School — PickupReleaseCard

**Files:**
- Create: `apps/school/src/components/PickupReleaseCard.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useState } from "react";
import { Button } from "@sekolahpro/ui";
import type { PickupEvent } from "../data/pickup-types";

interface Props {
  event: PickupEvent;
  isWaitingParent: boolean;
  isCompleting: boolean;
  isDeclining: boolean;
  onComplete: () => void;
  onDecline: (note: string) => void;
}

export function PickupReleaseCard({
  event, isWaitingParent, isCompleting, isDeclining, onComplete, onDecline,
}: Props) {
  const [showDecline, setShowDecline] = useState(false);
  const [note, setNote] = useState("");

  return (
    <div className="space-y-4 rounded-lg border border-border bg-bg p-4">
      <div className="flex items-center gap-4">
        {event.childPhotoUrl ? (
          <img src={event.childPhotoUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand/15 text-xl font-semibold text-brand">
            {event.childNama.charAt(0)}
          </span>
        )}
        <div>
          <div className="font-semibold text-fg">{event.childNama}</div>
          <div className="text-xs text-muted-fg">{event.childKelas} · NIS {event.nis}</div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
        <div className="text-muted-fg text-xs">Penjemput</div>
        <div className="font-medium text-fg">
          {event.pickupPersonNama} <span className="text-muted-fg">· {event.pickupPersonHubungan}</span>
        </div>
        <div className="text-xs text-muted-fg">{event.pickupPersonPhone}</div>
      </div>

      {isWaitingParent ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Menunggu konfirmasi orang tua…
        </div>
      ) : null}

      {showDecline ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-fg" htmlFor="decline-note">Catatan insiden</label>
          <textarea
            id="decline-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-md border border-border bg-bg px-2 py-1.5 text-sm"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" onClick={() => setShowDecline(false)} className="bg-muted text-fg">Batal</Button>
            <Button type="button" disabled={!note.trim() || isDeclining} onClick={() => onDecline(note.trim())} className="bg-rose-600">Catat & Tolak</Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={() => setShowDecline(true)} className="bg-muted text-fg">Tahan / Ragu</Button>
          <Button type="button" disabled={isWaitingParent || isCompleting} onClick={onComplete}>Lepaskan Siswa</Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/school/src/components/PickupReleaseCard.tsx
git commit -m "feat(school/pickup): release card UI"
```

---

## Task 15: School — `/$sekolah/pickup-verify` route

**Files:**
- Create: `apps/school/src/routes/$sekolah.pickup-verify.tsx`

- [ ] **Step 1: Write route**

```tsx
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@sekolahpro/ui";
import {
  useStaffScanToken,
  useStaffVerifyPin,
  useStaffCompletePickup,
  useStaffDeclinePickup,
  useStaffWatchEvent,
} from "../data/pickup";
import type { PickupEvent, PickupError } from "../data/pickup-types";
import { QrScanner } from "../components/QrScanner";
import { PinFallbackForm } from "../components/PinFallbackForm";
import { PickupReleaseCard } from "../components/PickupReleaseCard";

const GATES = ["Gerbang Utama", "Gerbang Belakang", "Lobi"];

function PickupVerifyPage() {
  const [gate, setGate] = useState<string>(GATES[0]!);
  const [event, setEvent] = useState<PickupEvent | null>(null);
  const [error, setError] = useState<PickupError | null>(null);

  const scan = useStaffScanToken();
  const pinVerify = useStaffVerifyPin();
  const complete = useStaffCompletePickup();
  const decline = useStaffDeclinePickup();

  const watch = useStaffWatchEvent(event?.status === "pending" ? event.id : null);
  const liveStatus = watch.data?.status ?? event?.status ?? null;
  const isWaitingParent = liveStatus === "pending";

  function reset() {
    setEvent(null);
    setError(null);
  }

  async function handleScanText(token: string) {
    setError(null);
    try {
      const ev = await scan.mutateAsync({ token, gate });
      setEvent(ev);
    } catch (e) {
      setError(e as PickupError);
    }
  }

  async function handlePinSubmit(v: { nis: string; pickupPersonId: string; pin: string; gate: string | null }) {
    setError(null);
    try {
      const ev = await pinVerify.mutateAsync(v);
      setEvent(ev);
    } catch (e) {
      setError(e as PickupError);
    }
  }

  async function handleComplete() {
    if (!event) return;
    await complete.mutateAsync({ eventId: event.id });
    setTimeout(reset, 3000);
  }

  async function handleDecline(note: string) {
    if (!event) return;
    await decline.mutateAsync({ eventId: event.id, note });
    setTimeout(reset, 3000);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Verifikasi Penjemputan" subtitle="Scan QR atau gunakan PIN" />

      <div className="flex items-center gap-2 text-sm">
        <label className="text-muted-fg">Gerbang:</label>
        <select
          value={gate}
          onChange={(e) => setGate(e.target.value)}
          className="rounded-md border border-border bg-bg px-2 py-1 text-sm"
        >
          {GATES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {error ? (
        <div role="alert" className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          [{error.errorCode}] {error.message}
        </div>
      ) : null}

      {event ? (
        <PickupReleaseCard
          event={event}
          isWaitingParent={isWaitingParent}
          isCompleting={complete.isPending}
          isDeclining={decline.isPending}
          onComplete={handleComplete}
          onDecline={handleDecline}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Scan QR">
            <QrScanner onDecode={handleScanText} />
          </SectionCard>
          <SectionCard title="Fallback PIN">
            <PinFallbackForm gate={gate} onSubmit={handlePinSubmit} />
          </SectionCard>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/pickup-verify")({
  component: PickupVerifyPage,
});
```

If the school app already has a `RequireRole` wrapper for staff routes, wrap `<PickupVerifyPage />` in it. Otherwise leave the route open (Frappe backend still enforces role on every call).

- [ ] **Step 2: Commit**

```bash
git add apps/school/src/routes/$sekolah.pickup-verify.tsx
git commit -m "feat(school/pickup): /pickup-verify route"
```

---

## Task 16: School — sidebar entry (role-gated)

**Files:**
- Modify: `apps/school/src/routes/$sekolah.tsx`

- [ ] **Step 1: Add entry**

In the school sidebar definition, add:

```tsx
{ label: "Verifikasi Penjemputan", to: "/$sekolah/pickup-verify", icon: <IconCheck /> }
```

If the existing sidebar already filters items by role, add a `roles: ["Sekolah Staff", "Satpam"]` field matching that filter convention. If no such filter exists yet, simply add the item — Frappe backend still enforces role on every call. If `to` requires the active `$sekolah` slug, mirror what other school sidebar items use (likely a function or `useParams`).

Verify by running `pnpm --filter @sekolahpro/app-school dev` briefly — sidebar should show the new entry and clicking it should not 404. Stop dev server after verifying.

- [ ] **Step 2: Commit**

```bash
git add apps/school/src/routes/$sekolah.tsx
git commit -m "feat(school/pickup): add sidebar entry"
```

---

## Task 17: Full verification

- [ ] **Step 1: Typecheck both apps**

```bash
cd /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web/.worktrees/feat-parent-app
pnpm --filter @sekolahpro/app-parent typecheck
pnpm --filter @sekolahpro/app-school typecheck
```

Expected: only the pre-existing `packages/ui/Modal.tsx` `react-dom` types error (monorepo-wide). No new parent/school errors.

- [ ] **Step 2: Test both apps**

```bash
pnpm --filter @sekolahpro/app-parent test
pnpm --filter @sekolahpro/app-school test
```

Expected: all tests PASS. Parent count grows by 6 (3 QRCountdown + 3 PickupPersonForm). School count grows by 2 (1 PinFallback + 1 QrScanner).

- [ ] **Step 3: Lint**

```bash
pnpm --filter @sekolahpro/app-parent lint
pnpm --filter @sekolahpro/app-school lint
```

Fix any errors **introduced by the new files**. Do not touch errors in files outside parent/school routes/components/data.

- [ ] **Step 4: Build with mocks**

```bash
VITE_USE_MOCKS=true pnpm --filter @sekolahpro/app-parent build
VITE_USE_MOCKS=true pnpm --filter @sekolahpro/app-school build
```

Expected: both succeed (the `tsc --noEmit` step may fail due to the pre-existing packages/ui issue; the Vite bundle should succeed).

- [ ] **Step 5: Final commit if lint fixes**

```bash
git status --short
git add apps/parent apps/school
git commit -m "chore(pickup): final lint pass"
```

If nothing dirty, skip.

---

## Self-Review

**Spec coverage:**

- Rotating QR display → Task 5 (`QRCountdown`) + Task 8 (`/pickup` issues + refreshes).
- Delegate management (CRUD) → Tasks 4 (hooks), 6 (form), 7 (list), 8 (route).
- Staff QR scan → Task 13 (`QrScanner`) + Task 15 (route handler).
- Staff PIN fallback → Task 12 (`PinFallbackForm`) + Task 15.
- Release confirmation → Task 14 (`PickupReleaseCard`) + Task 15.
- Tier-gated pending confirmation → Task 7 (`PickupEventBanner`) + Task 8 polling + Task 11 (`useStaffWatchEvent`) + Task 15 wait state.
- Backend contract → documented in Tasks 4 and 11 (`M.*` constants name every method; wire ↔ UI mappers prove the shape).
- Audit log → spec covers it via `list_pickup_events`; events list rendered in pending banner (Task 7). MVP does NOT include a full history viewer — out of scope, consistent with spec which only mandates banner + log in backend.
- Error codes (`token_expired`, `pin_invalid`, etc.) → surfaced in Task 15 via `error` state.
- Role gating in school app → Task 16 (best-effort given existing patterns; backend still enforces).

**Placeholder scan:** None. Each step contains actual code or commands.

**Type consistency:** `PickupPerson.id` used across hooks; `PickupEvent.pickupPersonId` consistently camelCase; `PickupPersonFormValues` shape matches what Task 8 passes to `useCreatePickupPerson`. `PickupError` thrown from school hooks matches what `Task 15` catches.

**Gap:** Audit log viewer for parent (list of past `Pickup Event` rows beyond just the pending banner) is not implemented in MVP. Spec notes this as "Audit log (collapsible)" — flagged but deferred to avoid scope creep. If user wants it now, add a small task: render `events.data` filtered by `status !== "pending"` in a collapsible `SectionCard` on `/pickup`. **Recommendation:** defer; surface as follow-up.

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-29-pickup-verification.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
