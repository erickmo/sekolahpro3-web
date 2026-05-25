# Perpustakaan Sirkulasi Merge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge perpustakaan peminjaman, pengembalian, dan denda routes jadi satu hub Peminjaman. Hapus rute pengembalian + denda. Return flow lewat doctype `Pengembalian Buku.submit()` agar backend auto-generate denda. Denda dilunasi inline dari konteks peminjaman.

**Architecture:** Frontend-heavy refactor di `apps/school` (TanStack Router + React Query + `@sekolahpro/ui` Modal). Backend (Frappe Python) menambah satu field denormalized `peminjaman` di `Denda Perpustakaan` + backfill patch + satu whitelisted method `get_denda_summary`. Docs HTML diperbarui di `apps/sekolahpro/docs/domains/perpustakaan/`.

**Tech Stack:** TanStack Router file routes, TanStack Query, Vitest, `@sekolahpro/api-client` (`useResourceDoc`, `useResourceList`, `frappeFetch`, `updateResource`), `@sekolahpro/ui` (`Modal`, `Button`, `Badge`, `FormField`, `Input`, `Select`, `Textarea`), Frappe doctype + patches.txt.

**Spec:** `docs/superpowers/specs/2026-05-25-perpustakaan-sirkulasi-merge-design.md`

---

## File Structure

### New files

- `apps/school/src/components/perpustakaan/ReturnModal.tsx` — modal POST + submit `Pengembalian Buku`
- `apps/school/src/components/perpustakaan/DendaDrawer.tsx` — inline denda viewer + payment action
- `apps/school/src/components/perpustakaan/dendaSummary.ts` — typed helper around whitelisted method
- `apps/school/src/components/perpustakaan/__tests__/ReturnModal.test.tsx`
- `apps/school/src/components/perpustakaan/__tests__/DendaDrawer.test.tsx`
- `apps/school/src/components/perpustakaan/__tests__/dendaSummary.test.ts`
- `apps/sekolahpro/sekolahpro/perpustakaan/api/__init__.py` (jika belum ada)
- `apps/sekolahpro/sekolahpro/perpustakaan/api/denda.py` — `get_denda_summary` whitelisted method
- `apps/sekolahpro/sekolahpro/perpustakaan/api/test_denda.py`
- `apps/sekolahpro/sekolahpro/patches/v0_6_0/backfill_denda_peminjaman.py` — backfill field denormalized

### Modified

- `apps/sekolahpro/sekolahpro/perpustakaan/doctype/denda_perpustakaan/denda_perpustakaan.json` — tambah Link field `peminjaman`
- `apps/sekolahpro/sekolahpro/perpustakaan/doctype/pengembalian_buku/pengembalian_buku.py` — populate `peminjaman` saat create denda
- `apps/sekolahpro/sekolahpro/patches.txt` — daftarkan patch
- `apps/school/src/routes/perpustakaan.tsx` — drop tabs pengembalian/denda
- `apps/school/src/routes/perpustakaan.peminjaman.tsx` — list + filter + row actions
- `apps/school/src/routes/perpustakaan.peminjaman.$name.tsx` — pakai ReturnModal, tambah section pengembalian + denda
- `apps/school/src/routes/perpustakaan.anggota.$name.tsx` — section "Peminjaman Aktif" + trigger return
- `apps/school/src/routes/perpustakaan.$isbn.tsx` — section "Sedang Dipinjam" + trigger return
- `apps/sekolahpro/docs/domains/perpustakaan/spec.html` — section alur sirkulasi
- `apps/sekolahpro/docs/domains/perpustakaan/README.html` — sinkronisasi narasi

### Deleted

- `apps/school/src/routes/perpustakaan.pengembalian.tsx`
- `apps/school/src/routes/perpustakaan.pengembalian.$name.tsx`
- `apps/school/src/routes/perpustakaan.denda.tsx`
- `apps/school/src/routes/perpustakaan.denda.$name.tsx`

### Replaced with redirect stubs

- `apps/school/src/routes/perpustakaan.pengembalian.tsx` (new minimal redirect)
- `apps/school/src/routes/perpustakaan.pengembalian.$name.tsx` (redirect)
- `apps/school/src/routes/perpustakaan.denda.tsx` (redirect)
- `apps/school/src/routes/perpustakaan.denda.$name.tsx` (redirect)

---

## Task 1: Backend — tambah field `peminjaman` di Denda Perpustakaan

**Files:**
- Modify: `apps/sekolahpro/sekolahpro/perpustakaan/doctype/denda_perpustakaan/denda_perpustakaan.json`

- [ ] **Step 1: Buka JSON doctype**

Read `apps/sekolahpro/sekolahpro/perpustakaan/doctype/denda_perpustakaan/denda_perpustakaan.json`. Confirm `field_order` array and `fields` array shape.

- [ ] **Step 2: Tambah field `peminjaman` setelah `pengembalian`**

Sisipkan ke `fields` (setelah entry `pengembalian`):

```json
{
  "fieldname": "peminjaman",
  "fieldtype": "Link",
  "label": "Peminjaman",
  "options": "Peminjaman Buku",
  "read_only": 1,
  "in_standard_filter": 1
}
```

Tambah `"peminjaman"` di `field_order` setelah `"pengembalian"`. Bump `modified` timestamp ke now ISO.

- [ ] **Step 3: Migrate dev site**

Run dari bench dir:
```bash
bench --site sekolahpro.localhost migrate
```
Expected: success, no errors. Verifikasi field exists:
```bash
bench --site sekolahpro.localhost console <<< "import frappe; print(frappe.get_meta('Denda Perpustakaan').get_field('peminjaman'))"
```
Expected: prints DocField object (not None).

- [ ] **Step 4: Commit**

```bash
git add apps/sekolahpro/sekolahpro/perpustakaan/doctype/denda_perpustakaan/denda_perpustakaan.json
git commit -m "feat(perpustakaan): add denormalized peminjaman link on Denda Perpustakaan"
```

---

## Task 2: Backend — populate `peminjaman` di `_buat_denda_jika_terlambat`

**Files:**
- Modify: `apps/sekolahpro/sekolahpro/perpustakaan/doctype/pengembalian_buku/pengembalian_buku.py`
- Test: `apps/sekolahpro/sekolahpro/perpustakaan/doctype/pengembalian_buku/test_pengembalian_buku.py` (atau buat baru kalau belum ada)

- [ ] **Step 1: Check existing tests**

Run:
```bash
ls apps/sekolahpro/sekolahpro/perpustakaan/doctype/pengembalian_buku/
```
Jika tidak ada `test_pengembalian_buku.py`, buat file baru.

- [ ] **Step 2: Tulis failing test**

Append/create di `test_pengembalian_buku.py`:

```python
import frappe
import unittest
from frappe.utils import add_days, today


class TestPengembalianBuku(unittest.TestCase):
    def test_denda_terlambat_links_peminjaman(self):
        # Asumsikan helper fixtures sudah ada di module ini. Jika tidak, buat
        # anggota + buku + eksemplar minimal via frappe.get_doc inline.
        peminjaman_name = _make_peminjaman_terlambat()
        pengembalian = frappe.get_doc({
            "doctype": "Pengembalian Buku",
            "peminjaman": peminjaman_name,
            "tanggal_kembali_aktual": today(),
        })
        pengembalian.insert()
        pengembalian.submit()

        denda = frappe.get_all(
            "Denda Perpustakaan",
            filters={"pengembalian": pengembalian.name},
            fields=["name", "peminjaman"],
        )
        self.assertEqual(len(denda), 1)
        self.assertEqual(denda[0].peminjaman, peminjaman_name)
```

Tambah helper `_make_peminjaman_terlambat()` di file yang sama (gunakan pattern dari test peminjaman existing kalau ada).

- [ ] **Step 3: Run test, expect failure**

```bash
bench --site sekolahpro.localhost run-tests --module sekolahpro.perpustakaan.doctype.pengembalian_buku.test_pengembalian_buku
```
Expected: FAIL — `denda[0].peminjaman` is `None` karena field belum di-populate.

- [ ] **Step 4: Patch `_buat_denda_jika_terlambat`**

Di `pengembalian_buku.py` method `_buat_denda_jika_terlambat`, tambah `"peminjaman": peminjaman.name` di dict insert:

```python
frappe.get_doc({
    "doctype": "Denda Perpustakaan",
    "pengembalian": self.name,
    "peminjaman": peminjaman.name,
    "anggota": peminjaman.anggota,
    "hari_terlambat": hari,
    "denda_per_hari": pengaturan.denda_per_hari,
    "total_denda": self.total_denda,
    "status_bayar": _STATUS_BELUM_LUNAS,
}).insert(ignore_permissions=True)
```

- [ ] **Step 5: Run test, expect pass**

```bash
bench --site sekolahpro.localhost run-tests --module sekolahpro.perpustakaan.doctype.pengembalian_buku.test_pengembalian_buku
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/sekolahpro/sekolahpro/perpustakaan/doctype/pengembalian_buku/
git commit -m "feat(perpustakaan): populate Denda.peminjaman on auto-generate"
```

---

## Task 3: Backend — backfill patch untuk denda lama

**Files:**
- Create: `apps/sekolahpro/sekolahpro/patches/v0_6_0/backfill_denda_peminjaman.py`
- Modify: `apps/sekolahpro/sekolahpro/patches.txt`

- [ ] **Step 1: Buat patch file**

```python
# apps/sekolahpro/sekolahpro/patches/v0_6_0/backfill_denda_peminjaman.py
"""Backfill Denda Perpustakaan.peminjaman dari Pengembalian Buku.peminjaman.

Idempotent: skip baris yang sudah punya peminjaman.
"""
import frappe


def execute():
    rows = frappe.db.sql(
        """
        SELECT d.name AS denda, p.peminjaman AS peminjaman
        FROM `tabDenda Perpustakaan` d
        JOIN `tabPengembalian Buku` p ON p.name = d.pengembalian
        WHERE (d.peminjaman IS NULL OR d.peminjaman = '')
          AND p.peminjaman IS NOT NULL
        """,
        as_dict=True,
    )
    for row in rows:
        frappe.db.set_value(
            "Denda Perpustakaan",
            row["denda"],
            "peminjaman",
            row["peminjaman"],
            update_modified=False,
        )
    frappe.db.commit()
```

- [ ] **Step 2: Registrasi patch**

Tambah baris di `apps/sekolahpro/sekolahpro/patches.txt` (paling bawah, dalam blok v0.6.0):

```
sekolahpro.patches.v0_6_0.backfill_denda_peminjaman
```

- [ ] **Step 3: Run patch**

```bash
bench --site sekolahpro.localhost migrate
```
Expected: patch executed, no errors.

- [ ] **Step 4: Verifikasi**

```bash
bench --site sekolahpro.localhost console <<< "import frappe; print(frappe.db.count('Denda Perpustakaan', {'peminjaman': ['is', 'not set']}))"
```
Expected: 0 (atau hanya denda yang `pengembalian` nya juga kosong, yang harusnya tidak ada).

- [ ] **Step 5: Re-run patch (idempotency check)**

```bash
bench --site sekolahpro.localhost execute sekolahpro.patches.v0_6_0.backfill_denda_peminjaman.execute
```
Expected: success, no rows updated.

- [ ] **Step 6: Commit**

```bash
git add apps/sekolahpro/sekolahpro/patches/v0_6_0/backfill_denda_peminjaman.py apps/sekolahpro/sekolahpro/patches.txt
git commit -m "feat(perpustakaan): backfill Denda.peminjaman from Pengembalian"
```

---

## Task 4: Backend — whitelisted method `get_denda_summary`

**Files:**
- Create: `apps/sekolahpro/sekolahpro/perpustakaan/api/__init__.py` (kosong jika belum ada)
- Create: `apps/sekolahpro/sekolahpro/perpustakaan/api/denda.py`
- Create: `apps/sekolahpro/sekolahpro/perpustakaan/api/test_denda.py`

- [ ] **Step 1: Tulis failing test**

```python
# apps/sekolahpro/sekolahpro/perpustakaan/api/test_denda.py
import frappe
import unittest

from sekolahpro.perpustakaan.api.denda import get_denda_summary


class TestGetDendaSummary(unittest.TestCase):
    def test_returns_aggregate_per_peminjaman(self):
        peminjaman_name = _make_peminjaman_with_denda(total=15000, status="Belum Lunas")
        result = get_denda_summary([peminjaman_name])
        self.assertIn(peminjaman_name, result)
        self.assertEqual(result[peminjaman_name]["total"], 15000)
        self.assertEqual(result[peminjaman_name]["status_bayar"], "Belum Lunas")

    def test_empty_input_returns_empty_dict(self):
        self.assertEqual(get_denda_summary([]), {})

    def test_caps_at_100_inputs(self):
        with self.assertRaises(frappe.ValidationError):
            get_denda_summary(["x"] * 101)
```

Helper `_make_peminjaman_with_denda` mirror dari test Task 2 (reuse via import kalau bisa).

- [ ] **Step 2: Run, expect import failure**

```bash
bench --site sekolahpro.localhost run-tests --module sekolahpro.perpustakaan.api.test_denda
```
Expected: ImportError — module belum ada.

- [ ] **Step 3: Implementasi**

```python
# apps/sekolahpro/sekolahpro/perpustakaan/api/denda.py
"""Aggregate denda per peminjaman untuk list view sirkulasi."""
from typing import Dict, List

import frappe

_MAX_BATCH = 100


@frappe.whitelist()
def get_denda_summary(peminjaman_names: List[str]) -> Dict[str, Dict]:
    if not peminjaman_names:
        return {}
    if len(peminjaman_names) > _MAX_BATCH:
        frappe.throw(f"Maksimum {_MAX_BATCH} peminjaman per request.")

    rows = frappe.db.sql(
        """
        SELECT
            peminjaman,
            SUM(total_denda) AS total,
            MAX(
                CASE status_bayar
                    WHEN 'Belum Lunas' THEN 2
                    WHEN 'Lunas'       THEN 1
                    ELSE 0
                END
            ) AS worst_rank
        FROM `tabDenda Perpustakaan`
        WHERE peminjaman IN %(names)s
        GROUP BY peminjaman
        """,
        {"names": tuple(peminjaman_names)},
        as_dict=True,
    )

    rank_to_label = {2: "Belum Lunas", 1: "Lunas", 0: ""}
    return {
        r["peminjaman"]: {
            "total": float(r["total"] or 0),
            "status_bayar": rank_to_label[int(r["worst_rank"])],
        }
        for r in rows
    }
```

- [ ] **Step 4: Run, expect pass**

```bash
bench --site sekolahpro.localhost run-tests --module sekolahpro.perpustakaan.api.test_denda
```
Expected: 3 passed.

- [ ] **Step 5: Smoke test via API**

```bash
curl -s -X POST http://localhost:5181/api/method/sekolahpro.perpustakaan.api.denda.get_denda_summary \
  -H "X-Frappe-CSRF-Token: ..." -b sid=... \
  -d 'peminjaman_names=["LOAN-0001"]'
```
Expected: 200 dengan body `{"message": {...}}`.

- [ ] **Step 6: Commit**

```bash
git add apps/sekolahpro/sekolahpro/perpustakaan/api/
git commit -m "feat(perpustakaan): get_denda_summary whitelisted method"
```

---

## Task 5: FE — helper `dendaSummary.ts`

**Files:**
- Create: `apps/school/src/components/perpustakaan/dendaSummary.ts`
- Test: `apps/school/src/components/perpustakaan/__tests__/dendaSummary.test.ts`

- [ ] **Step 1: Failing test**

```typescript
// apps/school/src/components/perpustakaan/__tests__/dendaSummary.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchDendaSummary, type DendaSummary } from "../dendaSummary";

vi.mock("@sekolahpro/api-client", () => ({
  frappeFetch: vi.fn(),
}));

import { frappeFetch } from "@sekolahpro/api-client";

describe("fetchDendaSummary", () => {
  beforeEach(() => vi.mocked(frappeFetch).mockReset());

  it("returns empty object for empty input", async () => {
    expect(await fetchDendaSummary([])).toEqual({});
    expect(frappeFetch).not.toHaveBeenCalled();
  });

  it("calls whitelisted method and returns mapping", async () => {
    vi.mocked(frappeFetch).mockResolvedValue({
      "LOAN-1": { total: 15000, status_bayar: "Belum Lunas" },
    } as DendaSummary);
    const res = await fetchDendaSummary(["LOAN-1"]);
    expect(frappeFetch).toHaveBeenCalledWith(
      "sekolahpro.perpustakaan.api.denda.get_denda_summary",
      { peminjaman_names: ["LOAN-1"] },
    );
    expect(res["LOAN-1"].total).toBe(15000);
  });
});
```

- [ ] **Step 2: Run, expect failure**

```bash
cd apps/school && pnpm vitest run src/components/perpustakaan/__tests__/dendaSummary.test.ts
```
Expected: FAIL (module not found).

- [ ] **Step 3: Implementasi**

```typescript
// apps/school/src/components/perpustakaan/dendaSummary.ts
import { frappeFetch } from "@sekolahpro/api-client";

export type DendaStatus = "Belum Lunas" | "Lunas" | "";

export interface DendaSummaryEntry {
  total: number;
  status_bayar: DendaStatus;
}

export type DendaSummary = Record<string, DendaSummaryEntry>;

export async function fetchDendaSummary(peminjamanNames: string[]): Promise<DendaSummary> {
  if (peminjamanNames.length === 0) return {};
  return frappeFetch<DendaSummary>(
    "sekolahpro.perpustakaan.api.denda.get_denda_summary",
    { peminjaman_names: peminjamanNames },
  );
}
```

- [ ] **Step 4: Run, expect pass**

```bash
cd apps/school && pnpm vitest run src/components/perpustakaan/__tests__/dendaSummary.test.ts
```
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add apps/school/src/components/perpustakaan/dendaSummary.ts apps/school/src/components/perpustakaan/__tests__/dendaSummary.test.ts
git commit -m "feat(school): fetchDendaSummary helper"
```

---

## Task 6: FE — `ReturnModal` komponen

**Files:**
- Create: `apps/school/src/components/perpustakaan/ReturnModal.tsx`
- Test: `apps/school/src/components/perpustakaan/__tests__/ReturnModal.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
// apps/school/src/components/perpustakaan/__tests__/ReturnModal.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReturnModal } from "../ReturnModal";

vi.mock("@sekolahpro/api-client", () => ({
  frappeFetch: vi.fn(),
}));

import { frappeFetch } from "@sekolahpro/api-client";

function wrap(ui: React.ReactNode) {
  return <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>;
}

describe("ReturnModal", () => {
  beforeEach(() => vi.mocked(frappeFetch).mockReset());

  it("inserts then submits Pengembalian Buku and calls onSuccess", async () => {
    vi.mocked(frappeFetch)
      .mockResolvedValueOnce({ name: "RET-1" }) // insert
      .mockResolvedValueOnce({ name: "RET-1", docstatus: 1, total_denda: 5000 }); // submit

    const onSuccess = vi.fn();
    render(wrap(
      <ReturnModal open peminjaman="LOAN-1" onClose={() => {}} onSuccess={onSuccess} />,
    ));

    fireEvent.click(screen.getByRole("button", { name: /simpan/i }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ name: "RET-1", total_denda: 5000 }));

    expect(frappeFetch).toHaveBeenNthCalledWith(
      1,
      "frappe.client.insert",
      expect.objectContaining({
        doc: expect.objectContaining({
          doctype: "Pengembalian Buku",
          peminjaman: "LOAN-1",
        }),
      }),
    );
    expect(frappeFetch).toHaveBeenNthCalledWith(
      2,
      "frappe.client.submit",
      expect.objectContaining({ doc: expect.objectContaining({ name: "RET-1" }) }),
    );
  });

  it("shows error from Frappe when peminjaman already returned", async () => {
    vi.mocked(frappeFetch).mockRejectedValueOnce(
      new Error("Peminjaman LOAN-1 sudah selesai."),
    );
    render(wrap(<ReturnModal open peminjaman="LOAN-1" onClose={() => {}} onSuccess={() => {}} />));
    fireEvent.click(screen.getByRole("button", { name: /simpan/i }));
    await waitFor(() =>
      expect(screen.getByText(/sudah selesai/i)).toBeInTheDocument(),
    );
  });
});
```

- [ ] **Step 2: Run, expect failure**

```bash
cd apps/school && pnpm vitest run src/components/perpustakaan/__tests__/ReturnModal.test.tsx
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implementasi**

```tsx
// apps/school/src/components/perpustakaan/ReturnModal.tsx
import { useState } from "react";
import { Button, FormField, Input, Modal, Textarea } from "@sekolahpro/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { frappeFetch } from "@sekolahpro/api-client";
import { perpToday } from "./perpFormatters";

const DOCTYPE = "Pengembalian Buku";

interface ReturnDoc {
  name: string;
  total_denda?: number;
}

interface Props {
  open: boolean;
  peminjaman: string;
  onClose: () => void;
  onSuccess: (doc: ReturnDoc) => void;
}

export function ReturnModal({ open, peminjaman, onClose, onSuccess }: Props) {
  const qc = useQueryClient();
  const [tanggal, setTanggal] = useState(perpToday());
  const [catatan, setCatatan] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation<ReturnDoc, Error>({
    mutationFn: async () => {
      const inserted = await frappeFetch<{ name: string }>("frappe.client.insert", {
        doc: {
          doctype: DOCTYPE,
          peminjaman,
          tanggal_kembali_aktual: tanggal,
          catatan: catatan || undefined,
        },
      });
      const submitted = await frappeFetch<ReturnDoc>("frappe.client.submit", {
        doc: { doctype: DOCTYPE, name: inserted.name },
      });
      return submitted;
    },
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: ["resource:list", "Peminjaman Buku"] });
      qc.invalidateQueries({ queryKey: ["resource:doc", "Peminjaman Buku", peminjaman] });
      qc.invalidateQueries({ queryKey: ["resource:list", "Denda Perpustakaan"] });
      onSuccess(doc);
      onClose();
    },
    onError: (e) => setError(e.message),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Kembalikan Buku"
      description={`Catat pengembalian untuk ${peminjaman}.`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>Batal</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>Simpan</Button>
        </>
      }
    >
      {error && <div role="alert" className="mb-3 text-sm text-danger">{error}</div>}
      <FormField label="Tanggal Kembali" required htmlFor="ret-date">
        <Input id="ret-date" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
      </FormField>
      <FormField label="Catatan" htmlFor="ret-note">
        <Textarea id="ret-note" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
      </FormField>
    </Modal>
  );
}
```

- [ ] **Step 4: Run, expect pass**

```bash
cd apps/school && pnpm vitest run src/components/perpustakaan/__tests__/ReturnModal.test.tsx
```
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add apps/school/src/components/perpustakaan/ReturnModal.tsx apps/school/src/components/perpustakaan/__tests__/ReturnModal.test.tsx
git commit -m "feat(school): ReturnModal posts + submits Pengembalian Buku"
```

---

## Task 7: FE — `DendaDrawer` komponen

**Files:**
- Create: `apps/school/src/components/perpustakaan/DendaDrawer.tsx`
- Test: `apps/school/src/components/perpustakaan/__tests__/DendaDrawer.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
// apps/school/src/components/perpustakaan/__tests__/DendaDrawer.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DendaDrawer } from "../DendaDrawer";

vi.mock("@sekolahpro/api-client", async () => {
  const actual = await vi.importActual<typeof import("@sekolahpro/api-client")>("@sekolahpro/api-client");
  return {
    ...actual,
    useResourceList: () => ({
      data: [
        {
          name: "FINE-1",
          peminjaman: "LOAN-1",
          hari_terlambat: 3,
          denda_per_hari: 1000,
          total_denda: 3000,
          status_bayar: "Belum Lunas",
        },
      ],
      isLoading: false,
    }),
    updateResource: vi.fn().mockResolvedValue({}),
  };
});

import { updateResource } from "@sekolahpro/api-client";

function wrap(ui: React.ReactNode) {
  return <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>;
}

describe("DendaDrawer", () => {
  beforeEach(() => vi.mocked(updateResource).mockClear());

  it("lists denda and marks lunas", async () => {
    render(wrap(<DendaDrawer open peminjaman="LOAN-1" onClose={() => {}} />));
    expect(screen.getByText("Rp 3.000")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /tandai lunas/i }));
    await waitFor(() =>
      expect(updateResource).toHaveBeenCalledWith(
        "Denda Perpustakaan",
        "FINE-1",
        expect.objectContaining({ status_bayar: "Lunas" }),
      ),
    );
  });
});
```

- [ ] **Step 2: Run, expect failure**

```bash
cd apps/school && pnpm vitest run src/components/perpustakaan/__tests__/DendaDrawer.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: Implementasi**

```tsx
// apps/school/src/components/perpustakaan/DendaDrawer.tsx
import { Badge, Button, Modal } from "@sekolahpro/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useResourceList, updateResource } from "@sekolahpro/api-client";
import { perpToday } from "./perpFormatters";

const DOCTYPE = "Denda Perpustakaan";

interface DendaRow {
  name: string;
  peminjaman?: string;
  hari_terlambat?: number;
  denda_per_hari?: number;
  total_denda?: number;
  status_bayar?: "Belum Lunas" | "Lunas";
}

interface Props {
  open: boolean;
  peminjaman: string;
  onClose: () => void;
}

function fmtRp(n?: number) {
  return n === undefined ? "—" : `Rp ${n.toLocaleString("id-ID")}`;
}

export function DendaDrawer({ open, peminjaman, onClose }: Props) {
  const qc = useQueryClient();
  const { data = [], isLoading } = useResourceList<DendaRow>(DOCTYPE, {
    filters: [["peminjaman", "=", peminjaman]],
    fields: ["name", "peminjaman", "hari_terlambat", "denda_per_hari", "total_denda", "status_bayar"],
    limit: 50,
  });

  const lunasMut = useMutation<unknown, Error, string>({
    mutationFn: (name) =>
      updateResource(DOCTYPE, name, {
        status_bayar: "Lunas",
        tanggal_lunas: perpToday(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resource:list", DOCTYPE] });
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Denda Peminjaman" size="md">
      {isLoading && <p className="text-sm text-muted-fg">Memuat…</p>}
      {!isLoading && data.length === 0 && (
        <p className="text-sm text-muted-fg">Tidak ada denda untuk peminjaman ini.</p>
      )}
      <ul className="divide-y divide-border">
        {data.map((d) => (
          <li key={d.name} className="py-3 flex items-center justify-between gap-4">
            <div className="text-sm space-y-1">
              <div className="font-mono text-xs text-muted-fg">{d.name}</div>
              <div>
                {d.hari_terlambat ?? 0} hari × {fmtRp(d.denda_per_hari)} = <strong>{fmtRp(d.total_denda)}</strong>
              </div>
              <Badge tone={d.status_bayar === "Lunas" ? "success" : "warning"} dot>
                {d.status_bayar ?? "—"}
              </Badge>
            </div>
            {d.status_bayar === "Belum Lunas" && (
              <Button size="sm" onClick={() => lunasMut.mutate(d.name)} disabled={lunasMut.isPending}>
                Tandai Lunas
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Modal>
  );
}
```

- [ ] **Step 4: Run, expect pass**

```bash
cd apps/school && pnpm vitest run src/components/perpustakaan/__tests__/DendaDrawer.test.tsx
```
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add apps/school/src/components/perpustakaan/DendaDrawer.tsx apps/school/src/components/perpustakaan/__tests__/DendaDrawer.test.tsx
git commit -m "feat(school): DendaDrawer with inline mark-lunas action"
```

---

## Task 8: FE — rewrite list `perpustakaan.peminjaman.tsx`

**Files:**
- Modify: `apps/school/src/routes/perpustakaan.peminjaman.tsx`

- [ ] **Step 1: Replace full file**

```tsx
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { PerpCreateModal, type PerpFieldDef } from "../components/perpustakaan/PerpCreateModal";
import { ReturnModal } from "../components/perpustakaan/ReturnModal";
import { DendaDrawer } from "../components/perpustakaan/DendaDrawer";
import { fetchDendaSummary, type DendaSummary } from "../components/perpustakaan/dendaSummary";
import { perpToday } from "../components/perpustakaan/perpFormatters";

type Row = {
  name: string;
  anggota: string;
  tanggal_pinjam: string;
  tanggal_kembali_rencana?: string;
  status: string;
};

const STATUS_TONE: Record<string, "success" | "brand" | "warning" | "danger" | "neutral"> = {
  Aktif: "brand",
  Selesai: "success",
  Terlambat: "warning",
  Hilang: "danger",
  Batal: "neutral",
};

const STATUS_OPTIONS = ["Semua", "BelumKembali", "Aktif", "Terlambat", "Selesai", "Hilang", "Batal"];

const CREATE_FIELDS: PerpFieldDef[] = [
  { name: "anggota", label: "Anggota (ID)", type: "text", required: true },
  { name: "tanggal_pinjam", label: "Tgl Pinjam", type: "date", required: true, defaultValue: perpToday() },
  { name: "tanggal_kembali_rencana", label: "Rencana Kembali", type: "date", required: true },
  { name: "catatan", label: "Catatan", type: "textarea" },
];

interface Search {
  status?: string;
  denda?: "ada";
}

function PeminjamanPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/perpustakaan/peminjaman" }) as Search;
  const [createOpen, setCreateOpen] = useState(false);
  const [returnFor, setReturnFor] = useState<string | null>(null);
  const [dendaFor, setDendaFor] = useState<string | null>(null);

  const activeStatus = search.status ?? "BelumKembali";

  const baseFilters = useMemo<Array<[string, string, unknown]>>(() => {
    if (activeStatus === "BelumKembali") return [["status", "in", ["Aktif", "Terlambat"]]];
    if (activeStatus === "Semua") return [];
    return [["status", "=", activeStatus]];
  }, [activeStatus]);

  const columns: Column<Row & { _denda?: DendaSummary[string] }>[] = [
    { key: "name", header: "No. Peminjaman", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
    { key: "anggota", header: "Anggota", sortable: true, cell: (r) => r.anggota },
    { key: "tanggal_pinjam", header: "Tgl Pinjam", sortable: true, cell: (r) => r.tanggal_pinjam },
    { key: "tanggal_kembali_rencana", header: "Rencana Kembali", sortable: true, cell: (r) => r.tanggal_kembali_rencana ?? "—" },
    { key: "status", header: "Status", cell: (r) => <Badge tone={STATUS_TONE[r.status] ?? "neutral"} dot>{r.status}</Badge> },
    {
      key: "_denda",
      header: "Denda",
      align: "right",
      cell: (r) => (r._denda?.total ? `Rp ${r._denda.total.toLocaleString("id-ID")}` : "—"),
    },
    {
      key: "_actions" as never,
      header: "",
      cell: (r) => (
        <div className="flex gap-2 justify-end">
          {(r.status === "Aktif" || r.status === "Terlambat") && (
            <Button size="sm" onClick={(e) => { e.stopPropagation(); setReturnFor(r.name); }}>Kembalikan</Button>
          )}
          {r._denda?.status_bayar === "Belum Lunas" && (
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setDendaFor(r.name); }}>Bayar Denda</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Perpustakaan"
        title="Peminjaman & Sirkulasi"
        description="Pinjam, kembalikan, dan denda dalam satu tempat."
        doctype="Peminjaman Buku"
        fields={["name", "anggota", "tanggal_pinjam", "tanggal_kembali_rencana", "status"]}
        rowKey={(r) => r.name}
        columns={columns as Column<Row>[]}
        defaultSort={{ key: "tanggal_pinjam", dir: "desc" }}
        searchFields={["name", "anggota"]}
        baseFilters={baseFilters}
        selectFilters={[
          {
            key: "status",
            label: "Status",
            field: "status",
            options: STATUS_OPTIONS.map((v) => ({ value: v, label: v === "BelumKembali" ? "Belum Kembali" : v })),
            value: activeStatus,
            onChange: (v) => navigate({ to: "/perpustakaan/peminjaman", search: { ...search, status: v } }),
          },
        ]}
        addLabel="Pinjam Baru"
        onAdd={() => setCreateOpen(true)}
        onRowClick={(r) => navigate({ to: "/perpustakaan/peminjaman/$name", params: { name: r.name } })}
        decorateRows={async (rows) => {
          const names = rows.map((r) => r.name);
          let summary: DendaSummary = {};
          try {
            summary = await fetchDendaSummary(names);
          } catch {
            // toleransi: tampil tanpa kolom denda
          }
          return rows
            .map((r) => ({ ...r, _denda: summary[r.name] }))
            .filter((r) => (search.denda === "ada" ? r._denda?.status_bayar === "Belum Lunas" : true));
        }}
      />

      <PerpCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        doctype="Peminjaman Buku"
        title="Pinjam Buku Baru"
        fields={CREATE_FIELDS}
        submitLabel="Pinjamkan"
        onCreated={(doc) => {
          const name = (doc as { name?: string }).name;
          if (name) navigate({ to: "/perpustakaan/peminjaman/$name", params: { name } });
        }}
      />

      {returnFor && (
        <ReturnModal
          open
          peminjaman={returnFor}
          onClose={() => setReturnFor(null)}
          onSuccess={() => setReturnFor(null)}
        />
      )}

      {dendaFor && (
        <DendaDrawer open peminjaman={dendaFor} onClose={() => setDendaFor(null)} />
      )}
    </>
  );
}

export const Route = createFileRoute("/perpustakaan/peminjaman")({
  component: PeminjamanPage,
  validateSearch: (s: Record<string, unknown>): Search => ({
    status: typeof s.status === "string" ? s.status : undefined,
    denda: s.denda === "ada" ? "ada" : undefined,
  }),
});
```

**Note:** Plan asumsi `ResourceListPage` punya prop `baseFilters`, `decorateRows`, dan `selectFilters[].value/onChange`. Jika belum:

- [ ] **Step 2: Verifikasi `ResourceListPage` API**

```bash
grep -n "baseFilters\|decorateRows\|selectFilters" apps/school/src/components/ResourceListPage.tsx
```
Jika prop tidak ada, tambah dulu (small modification) sebelum lanjut. Pattern:
- `baseFilters?: Array<[string, string, unknown]>` — append ke filters array yang dikirim ke `useResourceList`.
- `decorateRows?: (rows: T[]) => Promise<T[]>` — wrap `data` dengan `useQuery` derived state.
- `selectFilters[].value` + `onChange` — controlled mode opsional, fallback ke internal state existing.

Jika modifikasi diperlukan, lakukan, jalankan test ResourceListPage existing, commit terpisah dgn pesan `refactor(school): controllable filters + row decoration on ResourceListPage`.

- [ ] **Step 3: Run app, manual smoke**

```bash
pnpm --filter @sekolahpro/school dev
```
Buka `http://localhost:5181/perpustakaan/peminjaman`. Verifikasi:
- Filter default tampil hanya Aktif/Terlambat.
- Ganti filter ke "Selesai" → URL update + list refresh.
- Tombol "Kembalikan" hanya muncul di row Aktif/Terlambat.
- Klik tombol → ReturnModal terbuka.

- [ ] **Step 4: Commit**

```bash
git add apps/school/src/routes/perpustakaan.peminjaman.tsx apps/school/src/components/ResourceListPage.tsx
git commit -m "feat(school): unify perpustakaan circulation into peminjaman list"
```

---

## Task 9: FE — update detail `perpustakaan.peminjaman.$name.tsx`

**Files:**
- Modify: `apps/school/src/routes/perpustakaan.peminjaman.$name.tsx`

- [ ] **Step 1: Ganti handler `handleKembalikan`**

Hapus pemanggilan `workflowMut` untuk return. Tambah state `returnOpen` + render `<ReturnModal>`. Tombol "Kembalikan" jadi `onClick={() => setReturnOpen(true)}`.

```tsx
import { ReturnModal } from "../components/perpustakaan/ReturnModal";
import { DendaDrawer } from "../components/perpustakaan/DendaDrawer";
// ... existing imports

const [returnOpen, setReturnOpen] = useState(false);
const [dendaOpen, setDendaOpen] = useState(false);

// di actions:
{status === "Aktif" || status === "Terlambat" ? (
  <Button size="sm" onClick={() => setReturnOpen(true)}>Kembalikan</Button>
) : null}
<Button size="sm" variant="outline" onClick={() => setDendaOpen(true)}>Lihat Denda</Button>

// di JSX setelah PerpDetailScaffold:
{returnOpen && (
  <ReturnModal open peminjaman={name} onClose={() => setReturnOpen(false)} onSuccess={() => setReturnOpen(false)} />
)}
{dendaOpen && <DendaDrawer open peminjaman={name} onClose={() => setDendaOpen(false)} />}
```

- [ ] **Step 2: Tambah section Pengembalian inline**

Query Pengembalian Buku terkait via `useResourceList`:

```tsx
const { data: returnDocs = [] } = useResourceList<{ name: string; tanggal_kembali_aktual?: string; catatan?: string }>(
  "Pengembalian Buku",
  { filters: [["peminjaman", "=", name]], fields: ["name", "tanggal_kembali_aktual", "catatan"], limit: 5 },
);
```

Tambah `primaryInfo` entry kalau `returnDocs.length > 0`:
```tsx
{ label: "Tgl Kembali Aktual", value: returnDocs[0].tanggal_kembali_aktual ?? "—" },
```

- [ ] **Step 3: Manual smoke**

```bash
pnpm --filter @sekolahpro/school dev
```
Buka detail peminjaman aktif. Klik "Kembalikan" → modal. Submit → list invalidated, status berubah jadi "Selesai", section Pengembalian muncul.

- [ ] **Step 4: Commit**

```bash
git add apps/school/src/routes/perpustakaan.peminjaman.$name.tsx
git commit -m "feat(school): peminjaman detail uses ReturnModal + DendaDrawer"
```

---

## Task 10: FE — cross-context return trigger di detail anggota

**Files:**
- Modify: `apps/school/src/routes/perpustakaan.anggota.$name.tsx`

- [ ] **Step 1: Tambah section "Peminjaman Aktif"**

```tsx
import { useState } from "react";
import { useResourceList } from "@sekolahpro/api-client";
import { Button } from "@sekolahpro/ui";
import { ReturnModal } from "../components/perpustakaan/ReturnModal";

// di komponen:
const [returnFor, setReturnFor] = useState<string | null>(null);
const { data: aktif = [] } = useResourceList<{ name: string; tanggal_kembali_rencana?: string; status: string }>(
  "Peminjaman Buku",
  {
    filters: [["anggota", "=", name], ["status", "in", ["Aktif", "Terlambat"]]],
    fields: ["name", "tanggal_kembali_rencana", "status"],
    limit: 50,
  },
);

// di JSX tambahkan section:
<section className="mt-6">
  <h3 className="text-sm font-semibold mb-2">Peminjaman Aktif ({aktif.length})</h3>
  <ul className="divide-y divide-border">
    {aktif.map((p) => (
      <li key={p.name} className="py-2 flex items-center justify-between">
        <span className="font-mono text-xs">{p.name} — rencana {p.tanggal_kembali_rencana ?? "—"}</span>
        <Button size="sm" onClick={() => setReturnFor(p.name)}>Kembalikan</Button>
      </li>
    ))}
  </ul>
</section>
{returnFor && (
  <ReturnModal open peminjaman={returnFor} onClose={() => setReturnFor(null)} onSuccess={() => setReturnFor(null)} />
)}
```

- [ ] **Step 2: Smoke**

Buka `/perpustakaan/anggota/{nama}`. Verifikasi section muncul, button "Kembalikan" buka modal.

- [ ] **Step 3: Commit**

```bash
git add apps/school/src/routes/perpustakaan.anggota.$name.tsx
git commit -m "feat(school): return trigger from anggota detail"
```

---

## Task 11: FE — cross-context return trigger di detail buku

**Files:**
- Modify: `apps/school/src/routes/perpustakaan.$isbn.tsx`

- [ ] **Step 1: Tambah section "Sedang Dipinjam"**

Query mirip Task 10 tapi filter via eksemplar atau via child table `items.buku = {isbn}`. Frappe biasanya butuh query lewat parent:

```tsx
const { data: aktif = [] } = useResourceList<{ name: string; anggota: string; tanggal_kembali_rencana?: string }>(
  "Peminjaman Buku",
  {
    filters: [
      ["status", "in", ["Aktif", "Terlambat"]],
      ["Item Peminjaman", "buku", "=", isbn], // child table filter
    ],
    fields: ["name", "anggota", "tanggal_kembali_rencana"],
    limit: 50,
  },
);
```

Tambah `<ReturnModal>` toggle sama seperti Task 10.

- [ ] **Step 2: Verifikasi child-table filter**

Tes via curl untuk konfirmasi sintaks Frappe `["Item Peminjaman", "buku", "=", ...]`:
```bash
curl -s -G http://localhost:5181/api/method/frappe.client.get_list \
  --data-urlencode 'doctype=Peminjaman Buku' \
  --data-urlencode 'filters=[["Item Peminjaman","buku","=","BOOK-1"]]' \
  --data-urlencode 'fields=["name"]'
```
Jika gagal, fallback: query `Item Peminjaman` dulu untuk dapatkan `parent` names, lalu query parent.

- [ ] **Step 3: Smoke + commit**

```bash
git add apps/school/src/routes/perpustakaan.$isbn.tsx
git commit -m "feat(school): return trigger from buku detail"
```

---

## Task 12: FE — redirect stubs untuk URL lama

**Files:**
- Replace: `apps/school/src/routes/perpustakaan.pengembalian.tsx`
- Replace: `apps/school/src/routes/perpustakaan.pengembalian.$name.tsx`
- Replace: `apps/school/src/routes/perpustakaan.denda.tsx`
- Replace: `apps/school/src/routes/perpustakaan.denda.$name.tsx`

- [ ] **Step 1: Tulis stub `perpustakaan.pengembalian.tsx`**

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/perpustakaan/pengembalian")({
  beforeLoad: () => {
    throw redirect({ to: "/perpustakaan/peminjaman", search: { status: "Selesai" } });
  },
});
```

- [ ] **Step 2: Tulis stub `perpustakaan.pengembalian.$name.tsx`**

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";
import { frappeFetch } from "@sekolahpro/api-client";

export const Route = createFileRoute("/perpustakaan/pengembalian/$name")({
  beforeLoad: async ({ params }) => {
    try {
      const doc = await frappeFetch<{ peminjaman?: string }>("frappe.client.get_value", {
        doctype: "Pengembalian Buku",
        filters: { name: params.name },
        fieldname: "peminjaman",
      });
      if (doc?.peminjaman) {
        throw redirect({ to: "/perpustakaan/peminjaman/$name", params: { name: doc.peminjaman } });
      }
    } catch (e) {
      if ((e as { status?: number }).status === 302) throw e; // re-throw redirect
    }
    throw redirect({ to: "/perpustakaan/peminjaman", search: { status: "Selesai" } });
  },
});
```

- [ ] **Step 3: Tulis stub `perpustakaan.denda.tsx`**

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/perpustakaan/denda")({
  beforeLoad: () => {
    throw redirect({ to: "/perpustakaan/peminjaman", search: { denda: "ada" } });
  },
});
```

- [ ] **Step 4: Tulis stub `perpustakaan.denda.$name.tsx`**

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";
import { frappeFetch } from "@sekolahpro/api-client";

export const Route = createFileRoute("/perpustakaan/denda/$name")({
  beforeLoad: async ({ params }) => {
    try {
      const doc = await frappeFetch<{ peminjaman?: string }>("frappe.client.get_value", {
        doctype: "Denda Perpustakaan",
        filters: { name: params.name },
        fieldname: "peminjaman",
      });
      if (doc?.peminjaman) {
        throw redirect({ to: "/perpustakaan/peminjaman/$name", params: { name: doc.peminjaman } });
      }
    } catch (e) {
      if ((e as { status?: number }).status === 302) throw e;
    }
    throw redirect({ to: "/perpustakaan/peminjaman", search: { denda: "ada" } });
  },
});
```

- [ ] **Step 5: Smoke**

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:5181/perpustakaan/denda
```
TanStack redirect terjadi di client; verifikasi manual: buka URL di browser, harus berakhir di `/perpustakaan/peminjaman?denda=ada`.

- [ ] **Step 6: Commit**

```bash
git add apps/school/src/routes/perpustakaan.pengembalian.tsx apps/school/src/routes/perpustakaan.pengembalian.\$name.tsx apps/school/src/routes/perpustakaan.denda.tsx apps/school/src/routes/perpustakaan.denda.\$name.tsx
git commit -m "feat(school): redirect old pengembalian/denda URLs to peminjaman"
```

---

## Task 13: FE — update tab bar `perpustakaan.tsx`

**Files:**
- Modify: `apps/school/src/routes/perpustakaan.tsx`

- [ ] **Step 1: Hapus tab Pengembalian + Denda**

```tsx
const TABS: { to: string; label: string; exact?: boolean }[] = [
  { to: "/perpustakaan", label: "Dashboard", exact: true },
  { to: "/perpustakaan/daftar", label: "Katalog Buku" },
  { to: "/perpustakaan/peminjaman", label: "Peminjaman" },
  { to: "/perpustakaan/reservasi", label: "Reservasi" },
  { to: "/perpustakaan/anggota", label: "Anggota" },
  { to: "/perpustakaan/laporan", label: "Laporan" },
];
```

- [ ] **Step 2: Smoke**

Buka `/perpustakaan`. Verifikasi tab pengembalian + denda hilang.

- [ ] **Step 3: Commit**

```bash
git add apps/school/src/routes/perpustakaan.tsx
git commit -m "feat(school): drop pengembalian + denda tabs"
```

---

## Task 14: Docs — update domain docs

**Files:**
- Modify: `apps/sekolahpro/docs/domains/perpustakaan/spec.html`
- Modify: `apps/sekolahpro/docs/domains/perpustakaan/README.html`

- [ ] **Step 1: Edit spec.html**

Locate section yang menyebut workflow peminjaman/pengembalian/denda. Tambah/ganti dengan:

```html
<h2>Alur Sirkulasi (v0.6.0)</h2>
<ol>
  <li><strong>Pinjam:</strong> petugas buka <code>/perpustakaan/peminjaman</code>, klik "Pinjam Baru".</li>
  <li><strong>Kembali:</strong> dari row peminjaman aktif (atau dari detail anggota / detail buku), klik "Kembalikan". Modal POST + submit <code>Pengembalian Buku</code>.</li>
  <li><strong>Denda otomatis:</strong> <code>Pengembalian Buku.on_submit</code> menghitung keterlambatan via <code>Pengaturan Perpustakaan.denda_per_hari</code> dan, jika &gt; 0, membuat <code>Denda Perpustakaan</code> dengan link <code>peminjaman</code> (denormalized) + <code>pengembalian</code>.</li>
  <li><strong>Bayar:</strong> tombol "Bayar Denda" pada row peminjaman membuka DendaDrawer; aksi "Tandai Lunas" PATCH <code>status_bayar = "Lunas"</code> + <code>tanggal_lunas = today</code>.</li>
</ol>
<p>Rute web <code>/perpustakaan/pengembalian</code> dan <code>/perpustakaan/denda</code> dihapus (di-redirect ke <code>/perpustakaan/peminjaman</code>).</p>
```

- [ ] **Step 2: Edit README.html**

Sinkronisasi narasi singkat: ganti penyebutan "tiga tab terpisah" jadi "satu hub Peminjaman dengan return + denda inline". Hapus reference URL `/perpustakaan/pengembalian` dan `/perpustakaan/denda` di prosa.

- [ ] **Step 3: Cek entitas**

```bash
ls apps/sekolahpro/docs/domains/perpustakaan/entities/
```
Untuk setiap file HTML yang menyebut `Denda Perpustakaan`, tambahkan field baru `peminjaman` (Link → Peminjaman Buku). Jika tidak ada diagram explicit, skip.

- [ ] **Step 4: Commit**

```bash
git add apps/sekolahpro/docs/domains/perpustakaan/
git commit -m "docs(perpustakaan): document merged circulation flow"
```

---

## Task 15: Final regression sweep

- [ ] **Step 1: Run all FE tests**

```bash
pnpm --filter @sekolahpro/school test
```
Expected: green.

- [ ] **Step 2: Run backend tests untuk perpustakaan**

```bash
bench --site sekolahpro.localhost run-tests --app sekolahpro --module sekolahpro.perpustakaan
```
Expected: green.

- [ ] **Step 3: Lint**

```bash
pnpm --filter @sekolahpro/school lint
```
Expected: no errors.

- [ ] **Step 4: Type check**

```bash
pnpm --filter @sekolahpro/school typecheck
```
Expected: no errors.

- [ ] **Step 5: Manual end-to-end smoke**

Skenario:
1. Buat peminjaman baru dengan `tanggal_kembali_rencana` 5 hari lalu (atau ubah doc lewat console agar terlambat).
2. Buka list peminjaman, filter "Belum Kembali" → row tampil dengan status Terlambat.
3. Klik "Kembalikan" → modal → Simpan.
4. Verifikasi: row pindah ke filter "Selesai", kolom Denda menunjukkan jumlah, tombol "Bayar Denda" muncul.
5. Klik "Bayar Denda" → drawer → "Tandai Lunas".
6. Verifikasi: badge denda jadi "Lunas".
7. Buka URL lama `/perpustakaan/denda` → redirect ke `/perpustakaan/peminjaman?denda=ada`.

Catatan: jika rute peminjaman mengalami pre-existing error "Rendered more hooks" (lihat verifikasi sebelumnya), debug terpisah sebelum sweep ini.

- [ ] **Step 6: Final commit + PR**

Pastikan working tree bersih. Buka PR.

```bash
git log --oneline @{u}..
gh pr create --title "feat(perpustakaan): merge peminjaman/pengembalian/denda into single circulation hub" \
  --body "$(cat <<'EOF'
## Summary
- Single tab /perpustakaan/peminjaman replaces three (pengembalian + denda dropped, redirects added).
- ReturnModal POST + submits Pengembalian Buku so backend auto-generates Denda (was bypassed before).
- DendaDrawer inline payment from any peminjaman row.
- Denda Perpustakaan gets denormalized peminjaman link + backfill patch + get_denda_summary method.
- Docs updated.

## Test plan
- [ ] pnpm --filter @sekolahpro/school test
- [ ] bench --site sekolahpro.localhost run-tests --app sekolahpro --module sekolahpro.perpustakaan
- [ ] Manual e2e: pinjam terlambat → kembalikan → denda muncul → lunas
- [ ] Old URLs /perpustakaan/denda and /perpustakaan/pengembalian redirect

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review

**Spec coverage:**
- §1 routes drop+keep → Tasks 8, 12, 13. ✓
- §2 list page columns/filters → Task 8. ✓
- §3 return modal flow → Task 6 + Task 9. ✓
- §4 denda drawer + payment → Task 7 + Task 9. ✓
- §5 detail page sections → Task 9. ✓
- §6 backend field + summary method → Tasks 1, 2, 3, 4. ✓
- §7 cross-context triggers → Tasks 10, 11. ✓
- §8 redirects → Task 12. ✓
- §9 component cleanup → Task 8 hapus form pengembalian/denda dari PerpCreateModal usage; PerpCreateModal sendiri tetap dipakai untuk peminjaman create. ✓
- §10 docs → Task 14. ✓

**Placeholder scan:** Task 8 Step 2 marks `ResourceListPage` API verification as conditional — listed concrete properties + fallback plan. Task 11 Step 2 has fallback path documented. Tidak ada "TBD". ✓

**Type consistency:** `fetchDendaSummary` signature dipakai di Task 5 dan dikonsumsi di Task 8 `decorateRows`. `ReturnModal` props (`peminjaman`, `onSuccess`) konsisten Task 6 → Task 8 → Task 9 → Task 10 → Task 11. `DendaDrawer` props (`peminjaman`, `open`, `onClose`) konsisten Task 7 → Task 8 → Task 9. Backend method nama `sekolahpro.perpustakaan.api.denda.get_denda_summary` konsisten Task 4 → Task 5. ✓
