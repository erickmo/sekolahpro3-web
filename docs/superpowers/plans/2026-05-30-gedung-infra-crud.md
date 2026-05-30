# Manajemen Inline Lantai/Ruangan/Fasilitas/Utilitas di Detail Gedung — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ubah tab read-only (Lantai, Ruangan, Fasilitas, Utilitas) di halaman detail Gedung jadi CRUD penuh (Tambah/Edit/Hapus), dengan **reuse** 4 modal create yang sudah ada.

**Architecture:** FE-only (repo `sekolahpro-web`, app `apps/school`). 4 modal infrastruktur sudah ada tapi **create-only** — extend masing-masing dgn mode edit (`editName` + `useResourceDoc` + `useResourceUpdate`), backward-compatible (caller lama tanpa `editName` tetap create). Tambah `ConfirmDeleteDialog` reusable + `useResourceDelete`. Wire semua ke route detail Gedung dgn konteks default (defaultGedung/defaultLantai/defaultRuangan).

**Tech Stack:** React 18, TanStack Router/Query, `@sekolahpro/ui`, `@sekolahpro/api-client`, `@sekolahpro/auth`, Vitest + @testing-library/react (jsdom, `globals:false`).

**Spec:** `docs/superpowers/specs/2026-05-30-gedung-infra-crud-design.md` (lihat Addendum 2026-05-30).

**Branch:** `feat/gedung-infra-crud` (sudah dibuat; spec + plan sudah di-commit).

---

## Temuan Kunci (komponen sudah ada)

Keempat modal ADA di `apps/school/src/components/infrastruktur/` — **create-only**:

| Modal | Konteks default | Catatan |
|---|---|---|
| `LantaiFormModal` | `defaultGedung` (sembunyikan input gedung) | doctype Lantai |
| `RuanganFormModal` | `defaultLantai` | select lantai load SEMUA (tdk difilter gedung) |
| `FasilitasRuanganFormModal` | `defaultRuangan` | child via `parent`/`parenttype`/`parentfield` |
| `UtilitasGedungFormModal` | `defaultGedung` | input gedung selalu tampil |

Semua callback `onCreated?(name)`. Tidak ada: edit, delete. Dipakai juga di route
modul terpisah (mis. `fasilitas.tsx`) — perubahan HARUS backward-compatible.

## File Structure

- **Create** `apps/school/src/components/infrastruktur/ConfirmDeleteDialog.tsx` — dialog konfirmasi hapus.
- **Create** `apps/school/src/components/infrastruktur/ConfirmDeleteDialog.test.tsx`
- **Modify** `apps/school/src/components/infrastruktur/LantaiFormModal.tsx` — + mode edit.
- **Create** `apps/school/src/components/infrastruktur/LantaiFormModal.test.tsx`
- **Modify** `apps/school/src/components/infrastruktur/RuanganFormModal.tsx` — + mode edit (+ filter lantai per gedung opsional).
- **Create** `apps/school/src/components/infrastruktur/RuanganFormModal.test.tsx`
- **Modify** `apps/school/src/components/infrastruktur/FasilitasRuanganFormModal.tsx` — + mode edit.
- **Create** `apps/school/src/components/infrastruktur/FasilitasRuanganFormModal.test.tsx`
- **Modify** `apps/school/src/components/infrastruktur/UtilitasGedungFormModal.tsx` — + mode edit.
- **Create** `apps/school/src/components/infrastruktur/UtilitasGedungFormModal.test.tsx`
- **Modify** `apps/school/src/routes/$sekolah.infrastruktur.daftar-gedung.$gedungId.tsx` — tombol Tambah, kolom Aksi (Edit/Hapus), wiring modal + ConfirmDeleteDialog.

## Konvensi Test

- Jalankan: `pnpm --filter @sekolahpro/app-school test -- <namaFile>`
- vitest `globals:false` → WAJIB import `{ describe, it, expect, vi }` dari `"vitest"`.
- Mock: `vi.mock("@sekolahpro/api-client", ...)`, `vi.mock("@sekolahpro/auth", ...)`,
  `vi.mock("@tanstack/react-query", ...)` (pola di Task 2).
- Lint: `pnpm --filter @sekolahpro/app-school lint`

## Pola Edit-Mode (acuan semua modal)

Tiap modal saat ini init `form` via `useState` initializer + reset on close.
Tambahan edit-mode (backward-compatible):

1. Prop baru: `editName?: string;`
2. Hooks: `const update = useResourceUpdate<{name:string}>(DOCTYPE);`
   dan `const docQ = useResourceDoc<Record<string,unknown>>(DOCTYPE, editName, { enabled: !!editName });`
3. `useEffect` isi `form` dari `docQ.data` saat edit.
4. `canSubmit`: tambahkan `&& !update.isPending`.
5. `submit`: `if (editName) await update.mutateAsync({ name: editName, patch })` else create.
6. Title: `editName ? "Edit X" : "Tambah X"`; label tombol pending mengikut.
7. `onCreated` tetap dipanggil utk create & edit (semantik "tersimpan").

---

## Task 1: ConfirmDeleteDialog

Dialog konfirmasi hapus reusable (tdk ada Toast global di `@sekolahpro/ui`).

**Files:**
- Create: `apps/school/src/components/infrastruktur/ConfirmDeleteDialog.tsx`
- Test: `apps/school/src/components/infrastruktur/ConfirmDeleteDialog.test.tsx`

- [ ] **Step 1: Tulis test gagal**

```tsx
// apps/school/src/components/infrastruktur/ConfirmDeleteDialog.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

describe("ConfirmDeleteDialog", () => {
  it("tombol Hapus memanggil onConfirm", () => {
    const onConfirm = vi.fn();
    render(<ConfirmDeleteDialog open label="Lantai 1" onConfirm={onConfirm} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("menampilkan error bila ada", () => {
    render(<ConfirmDeleteDialog open label="X" error="masih ada data turunan" onConfirm={() => {}} onClose={() => {}} />);
    expect(screen.getByText("masih ada data turunan")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @sekolahpro/app-school test -- ConfirmDeleteDialog`
Expected: FAIL — module belum ada.

- [ ] **Step 3: Implementasi**

```tsx
// apps/school/src/components/infrastruktur/ConfirmDeleteDialog.tsx
/** Dialog konfirmasi hapus generik (tone rose). */
import { Button, Modal } from "@sekolahpro/ui";

interface ConfirmDeleteDialogProps {
  open: boolean;
  label: string;
  error?: string | null;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDeleteDialog({ open, label, error, pending, onConfirm, onClose }: ConfirmDeleteDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      tone="rose"
      title="Hapus data?"
      description={`"${label}" akan dihapus permanen.`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={onConfirm} disabled={pending}>{pending ? "Menghapus..." : "Hapus"}</Button>
        </div>
      }
    >
      {error ? (
        <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</div>
      ) : (
        <p className="text-sm text-muted-fg">Tindakan ini tidak bisa dibatalkan.</p>
      )}
    </Modal>
  );
}
```

Catatan: `tone` valid di Modal = brand|violet|emerald|amber|rose|neutral (lihat `packages/ui/src/components/Modal.tsx`). Pakai `rose`.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm --filter @sekolahpro/app-school test -- ConfirmDeleteDialog`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web add apps/school/src/components/infrastruktur/ConfirmDeleteDialog.tsx apps/school/src/components/infrastruktur/ConfirmDeleteDialog.test.tsx
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web commit -m "feat(infrastruktur): ConfirmDeleteDialog konfirmasi hapus"
```

---

## Task 2: LantaiFormModal — tambah mode edit

**Files:**
- Modify: `apps/school/src/components/infrastruktur/LantaiFormModal.tsx`
- Test: `apps/school/src/components/infrastruktur/LantaiFormModal.test.tsx`

- [ ] **Step 1: Tulis test gagal**

```tsx
// apps/school/src/components/infrastruktur/LantaiFormModal.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const createMut = vi.fn().mockResolvedValue({ name: "GA-L1" });
const updateMut = vi.fn().mockResolvedValue({ name: "GA-L1" });
let docData: Record<string, unknown> | undefined;
vi.mock("@sekolahpro/api-client", () => ({
  useResourceCreate: () => ({ mutateAsync: createMut, isPending: false }),
  useResourceUpdate: () => ({ mutateAsync: updateMut, isPending: false }),
  useResourceDoc: () => ({ data: docData }),
}));
vi.mock("@sekolahpro/auth", () => ({
  useSessionStore: (sel: (s: unknown) => unknown) => sel({ activeSekolah: { name: "SEK-1" } }),
}));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));

import { LantaiFormModal } from "./LantaiFormModal";

describe("LantaiFormModal", () => {
  beforeEach(() => { createMut.mockClear(); updateMut.mockClear(); docData = undefined; });

  it("create dgn defaultGedung mengirim gedung + sekolah", async () => {
    render(<LantaiFormModal open defaultGedung="SEK-1-GA" onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText("Lantai 1"), { target: { value: "Lantai Dasar" } });
    fireEvent.change(screen.getByPlaceholderText("1"), { target: { value: "1" } });
    fireEvent.click(screen.getByText("Simpan"));
    await waitFor(() => expect(createMut).toHaveBeenCalled());
    expect(createMut.mock.calls[0][0]).toMatchObject({ nama: "Lantai Dasar", nomor_lantai: 1, gedung: "SEK-1-GA", sekolah: "SEK-1" });
  });

  it("edit memuat data & memanggil update (tanpa gedung/sekolah)", async () => {
    docData = { name: "GA-L1", nama: "Lantai Dasar", nomor_lantai: 1, gedung: "SEK-1-GA" };
    render(<LantaiFormModal open editName="GA-L1" defaultGedung="SEK-1-GA" onClose={() => {}} />);
    await screen.findByDisplayValue("Lantai Dasar");
    expect(screen.getByText("Edit Lantai")).toBeTruthy();
    fireEvent.click(screen.getByText("Simpan"));
    await waitFor(() => expect(updateMut).toHaveBeenCalled());
    const arg = updateMut.mock.calls[0][0];
    expect(arg.name).toBe("GA-L1");
    expect(arg.patch).toEqual({ nama: "Lantai Dasar", nomor_lantai: 1 });
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @sekolahpro/app-school test -- LantaiFormModal`
Expected: FAIL — `useResourceUpdate`/`useResourceDoc` belum dipakai, "Edit Lantai" tdk ada.

- [ ] **Step 3: Implementasi**

Edit `LantaiFormModal.tsx`:

3a. Import: ganti baris import api-client jadi
```tsx
import { useResourceCreate, useResourceDoc, useResourceUpdate } from "@sekolahpro/api-client";
```
dan tambah `useEffect` ke import react:
```tsx
import { useEffect, useState } from "react";
```

3b. Prop interface tambah `editName?: string;`. Destructure: `{ open, onClose, onCreated, defaultGedung, editName }`.

3c. Tambah hooks setelah `const create = ...`:
```tsx
  const update = useResourceUpdate<{ name: string }>("Lantai");
  const docQ = useResourceDoc<Record<string, unknown>>("Lantai", editName, { enabled: !!editName });
```

3d. Tambah effect setelah deklarasi `set`:
```tsx
  useEffect(() => {
    if (docQ.data) {
      const d = docQ.data as Record<string, unknown>;
      setForm({ nama: `${d.nama ?? ""}`, nomor_lantai: `${d.nomor_lantai ?? ""}`, gedung: `${d.gedung ?? defaultGedung ?? ""}` });
    }
  }, [docQ.data, defaultGedung]);
```

3e. `canSubmit`: tambahkan `&& !update.isPending` di akhir rantai.

3f. Ganti isi `submit` (try block) jadi:
```tsx
    try {
      let name: string;
      if (editName) {
        name = (await update.mutateAsync({ name: editName, patch: { nama: form.nama.trim(), nomor_lantai: Number(form.nomor_lantai) } })).name;
      } else {
        name = (await create.mutateAsync({ nama: form.nama.trim(), nomor_lantai: Number(form.nomor_lantai), gedung: form.gedung.trim(), sekolah })).name;
      }
      await qc.invalidateQueries({ queryKey: ["resource:list", "Lantai"] });
      reset();
      if (onCreated) onCreated(name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal menyimpan lantai.");
    }
```

3g. Title Modal: `title={editName ? "Edit Lantai" : "Tambah Lantai"}`.
Label tombol: `{create.isPending || update.isPending ? "Menyimpan..." : "Simpan"}`.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm --filter @sekolahpro/app-school test -- LantaiFormModal`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web add apps/school/src/components/infrastruktur/LantaiFormModal.tsx apps/school/src/components/infrastruktur/LantaiFormModal.test.tsx
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web commit -m "feat(infrastruktur): LantaiFormModal mode edit"
```

---

## Task 3: RuanganFormModal — tambah mode edit (+ filter lantai per gedung)

**Files:**
- Modify: `apps/school/src/components/infrastruktur/RuanganFormModal.tsx`
- Test: `apps/school/src/components/infrastruktur/RuanganFormModal.test.tsx`

- [ ] **Step 1: Tulis test gagal**

```tsx
// apps/school/src/components/infrastruktur/RuanganFormModal.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const createMut = vi.fn().mockResolvedValue({ name: "GA-L1-R1" });
const updateMut = vi.fn().mockResolvedValue({ name: "GA-L1-R1" });
let docData: Record<string, unknown> | undefined;
const lantaiList = [{ name: "GA-L1", nama: "Lantai 1" }];
vi.mock("@sekolahpro/api-client", () => ({
  useResourceCreate: () => ({ mutateAsync: createMut, isPending: false }),
  useResourceUpdate: () => ({ mutateAsync: updateMut, isPending: false }),
  useResourceDoc: () => ({ data: docData }),
  useResourceList: () => ({ data: lantaiList }),
}));
vi.mock("@sekolahpro/auth", () => ({
  useSessionStore: (sel: (s: unknown) => unknown) => sel({ activeSekolah: { name: "SEK-1" } }),
}));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));

import { RuanganFormModal } from "./RuanganFormModal";

describe("RuanganFormModal", () => {
  beforeEach(() => { createMut.mockClear(); updateMut.mockClear(); docData = undefined; });

  it("create mengirim field wajib", async () => {
    render(<RuanganFormModal open defaultLantai="GA-L1" onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText("Ruang Kelas 1A"), { target: { value: "Kelas 1A" } });
    fireEvent.change(screen.getByPlaceholderText("R1A"), { target: { value: "R1" } });
    fireEvent.click(screen.getByText("Simpan"));
    await waitFor(() => expect(createMut).toHaveBeenCalled());
    expect(createMut.mock.calls[0][0]).toMatchObject({ nama: "Kelas 1A", kode: "R1", lantai: "GA-L1", jenis_ruangan: "Kelas", status: "Tersedia" });
  });

  it("edit memuat data & update (tanpa sekolah/gedung)", async () => {
    docData = { name: "GA-L1-R1", nama: "Kelas 1A", kode: "R1", lantai: "GA-L1", jenis_ruangan: "Kelas", status: "Tersedia", kapasitas: 30 };
    render(<RuanganFormModal open editName="GA-L1-R1" onClose={() => {}} />);
    await screen.findByDisplayValue("Kelas 1A");
    expect(screen.getByText("Edit Ruangan")).toBeTruthy();
    fireEvent.click(screen.getByText("Simpan"));
    await waitFor(() => expect(updateMut).toHaveBeenCalled());
    const arg = updateMut.mock.calls[0][0];
    expect(arg.name).toBe("GA-L1-R1");
    expect(arg.patch).toMatchObject({ nama: "Kelas 1A", kode: "R1", lantai: "GA-L1", jenis_ruangan: "Kelas", status: "Tersedia", kapasitas: 30 });
    expect(arg.patch.sekolah).toBeUndefined();
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @sekolahpro/app-school test -- RuanganFormModal`
Expected: FAIL — update/doc belum dipakai, "Edit Ruangan" tdk ada.

- [ ] **Step 3: Implementasi**

Edit `RuanganFormModal.tsx`:

3a. Import:
```tsx
import { useEffect, useState } from "react";
import { useResourceCreate, useResourceDoc, useResourceList, useResourceUpdate } from "@sekolahpro/api-client";
```

3b. Props tambah `editName?: string;` + opsional `gedung?: string;` (filter lantai). Destructure: `{ open, onClose, onCreated, defaultLantai, editName, gedung }`.

3c. Hooks setelah `create`:
```tsx
  const update = useResourceUpdate<{ name: string }>("Ruangan");
  const docQ = useResourceDoc<Record<string, unknown>>("Ruangan", editName, { enabled: !!editName });
```
Ubah `lantaiList` filter agar bisa scope per gedung:
```tsx
  const lantaiList = useResourceList<{ name: string; nama?: string }>("Lantai", {
    fields: ["name", "nama"],
    filters: gedung ? [["gedung", "=", gedung]] : [],
    limit_page_length: 0,
  });
```

3d. Effect:
```tsx
  useEffect(() => {
    if (docQ.data) {
      const d = docQ.data as Record<string, unknown>;
      setForm({
        nama: `${d.nama ?? ""}`, kode: `${d.kode ?? ""}`, lantai: `${d.lantai ?? ""}`,
        jenis_ruangan: `${d.jenis_ruangan ?? "Kelas"}`, kapasitas: `${d.kapasitas ?? ""}`,
        luas_m2: `${d.luas_m2 ?? ""}`, status: `${d.status ?? "Tersedia"}`,
      });
    }
  }, [docQ.data]);
```

3e. `canSubmit`: tambahkan `&& !update.isPending`.

3f. Ganti isi `submit` try block:
```tsx
    try {
      const patch: Record<string, unknown> = {
        nama: form.nama.trim(), kode: form.kode.trim(), lantai: form.lantai.trim(),
        jenis_ruangan: form.jenis_ruangan, status: form.status,
      };
      if (form.kapasitas.trim()) patch.kapasitas = Number(form.kapasitas);
      if (form.luas_m2.trim()) patch.luas_m2 = Number(form.luas_m2);
      const name = editName
        ? (await update.mutateAsync({ name: editName, patch })).name
        : (await create.mutateAsync(patch)).name;
      await qc.invalidateQueries({ queryKey: ["resource:list", "Ruangan"] });
      reset();
      if (onCreated) onCreated(name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal menyimpan ruangan.");
    }
```
(Catatan: `sekolah` tetap dipakai di `canSubmit` guard create; di payload tidak dikirim karena denorm BE. Validasi `!sekolah` di awal submit tetap dipertahankan utk create — saat edit `sekolah` boleh undefined, jadi pindahkan guard: `if (!editName && !sekolah) { setErr(...); return; }`.)

3g. Title: `title={editName ? "Edit Ruangan" : "Tambah Ruangan"}`. Label pending mengikut `create.isPending || update.isPending`.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm --filter @sekolahpro/app-school test -- RuanganFormModal`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web add apps/school/src/components/infrastruktur/RuanganFormModal.tsx apps/school/src/components/infrastruktur/RuanganFormModal.test.tsx
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web commit -m "feat(infrastruktur): RuanganFormModal mode edit + filter lantai per gedung"
```

---

## Task 4: FasilitasRuanganFormModal — tambah mode edit

**Files:**
- Modify: `apps/school/src/components/infrastruktur/FasilitasRuanganFormModal.tsx`
- Test: `apps/school/src/components/infrastruktur/FasilitasRuanganFormModal.test.tsx`

- [ ] **Step 1: Tulis test gagal**

```tsx
// apps/school/src/components/infrastruktur/FasilitasRuanganFormModal.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const createMut = vi.fn().mockResolvedValue({ name: "fas-1" });
const updateMut = vi.fn().mockResolvedValue({ name: "fas-1" });
let docData: Record<string, unknown> | undefined;
vi.mock("@sekolahpro/api-client", () => ({
  useResourceCreate: () => ({ mutateAsync: createMut, isPending: false }),
  useResourceUpdate: () => ({ mutateAsync: updateMut, isPending: false }),
  useResourceDoc: () => ({ data: docData }),
  useResourceList: () => ({ data: [{ name: "GA-L1-R1", nama: "Kelas 1A" }] }),
}));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));

import { FasilitasRuanganFormModal } from "./FasilitasRuanganFormModal";

describe("FasilitasRuanganFormModal", () => {
  beforeEach(() => { createMut.mockClear(); updateMut.mockClear(); docData = undefined; });

  it("create child dgn parent reference", async () => {
    render(<FasilitasRuanganFormModal open defaultRuangan="GA-L1-R1" onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText("Proyektor"), { target: { value: "Kursi" } });
    fireEvent.click(screen.getByText("Simpan"));
    await waitFor(() => expect(createMut).toHaveBeenCalled());
    expect(createMut.mock.calls[0][0]).toMatchObject({ nama_fasilitas: "Kursi", parent: "GA-L1-R1", parenttype: "Ruangan", parentfield: "fasilitas" });
  });

  it("edit memuat & update tanpa parent", async () => {
    docData = { name: "fas-1", nama_fasilitas: "Kursi", jumlah: 10, kondisi: "Baik", parent: "GA-L1-R1" };
    render(<FasilitasRuanganFormModal open editName="fas-1" defaultRuangan="GA-L1-R1" onClose={() => {}} />);
    await screen.findByDisplayValue("Kursi");
    expect(screen.getByText("Edit Fasilitas")).toBeTruthy();
    fireEvent.click(screen.getByText("Simpan"));
    await waitFor(() => expect(updateMut).toHaveBeenCalled());
    const arg = updateMut.mock.calls[0][0];
    expect(arg.name).toBe("fas-1");
    expect(arg.patch).toEqual({ nama_fasilitas: "Kursi", jumlah: 10, kondisi: "Baik" });
    expect(arg.patch.parent).toBeUndefined();
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @sekolahpro/app-school test -- FasilitasRuanganFormModal`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

Edit `FasilitasRuanganFormModal.tsx`:

3a. Import:
```tsx
import { useEffect, useState } from "react";
import { useResourceCreate, useResourceDoc, useResourceList, useResourceUpdate } from "@sekolahpro/api-client";
```

3b. Props tambah `editName?: string;`. Destructure ikut.

3c. Hooks setelah `create`:
```tsx
  const update = useResourceUpdate<{ name: string }>("Fasilitas Ruangan");
  const docQ = useResourceDoc<Record<string, unknown>>("Fasilitas Ruangan", editName, { enabled: !!editName });
```

3d. Effect:
```tsx
  useEffect(() => {
    if (docQ.data) {
      const d = docQ.data as Record<string, unknown>;
      setForm({ nama_fasilitas: `${d.nama_fasilitas ?? ""}`, jumlah: `${d.jumlah ?? "1"}`, kondisi: `${d.kondisi ?? "Baik"}` });
      if (d.parent) setRuangan(`${d.parent}`);
    }
  }, [docQ.data]);
```

3e. `canSubmit`: tambahkan `&& !update.isPending`.

3f. Ganti `submit` try block:
```tsx
    try {
      const patch: Record<string, unknown> = {
        nama_fasilitas: form.nama_fasilitas.trim(),
        jumlah: Number(form.jumlah) || 1,
        kondisi: form.kondisi,
      };
      let name: string;
      if (editName) {
        name = (await update.mutateAsync({ name: editName, patch })).name;
      } else {
        name = (await create.mutateAsync({ ...patch, parent: ruangan.trim(), parenttype: "Ruangan", parentfield: "fasilitas" })).name;
      }
      await qc.invalidateQueries({ queryKey: ["resource:list", "Fasilitas Ruangan"] });
      reset();
      if (onCreated) onCreated(name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal menyimpan fasilitas.");
    }
```

3g. Title: `title={editName ? "Edit Fasilitas" : "Tambah Fasilitas"}`. Label pending mengikut.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm --filter @sekolahpro/app-school test -- FasilitasRuanganFormModal`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web add apps/school/src/components/infrastruktur/FasilitasRuanganFormModal.tsx apps/school/src/components/infrastruktur/FasilitasRuanganFormModal.test.tsx
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web commit -m "feat(infrastruktur): FasilitasRuanganFormModal mode edit"
```

---

## Task 5: UtilitasGedungFormModal — tambah mode edit

**Files:**
- Modify: `apps/school/src/components/infrastruktur/UtilitasGedungFormModal.tsx`
- Test: `apps/school/src/components/infrastruktur/UtilitasGedungFormModal.test.tsx`

- [ ] **Step 1: Tulis test gagal**

```tsx
// apps/school/src/components/infrastruktur/UtilitasGedungFormModal.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const createMut = vi.fn().mockResolvedValue({ name: "GA-Listrik" });
const updateMut = vi.fn().mockResolvedValue({ name: "GA-Listrik" });
let docData: Record<string, unknown> | undefined;
vi.mock("@sekolahpro/api-client", () => ({
  useResourceCreate: () => ({ mutateAsync: createMut, isPending: false }),
  useResourceUpdate: () => ({ mutateAsync: updateMut, isPending: false }),
  useResourceDoc: () => ({ data: docData }),
}));
vi.mock("@sekolahpro/auth", () => ({
  useSessionStore: (sel: (s: unknown) => unknown) => sel({ activeSekolah: { name: "SEK-1" } }),
}));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));

import { UtilitasGedungFormModal } from "./UtilitasGedungFormModal";

describe("UtilitasGedungFormModal", () => {
  beforeEach(() => { createMut.mockClear(); updateMut.mockClear(); docData = undefined; });

  it("create mengirim gedung + jenis + status", async () => {
    render(<UtilitasGedungFormModal open defaultGedung="SEK-1-GA" onClose={() => {}} />);
    fireEvent.click(screen.getByText("Simpan"));
    await waitFor(() => expect(createMut).toHaveBeenCalled());
    expect(createMut.mock.calls[0][0]).toMatchObject({ gedung: "SEK-1-GA", jenis: "Listrik", status: "Aktif" });
  });

  it("edit memuat & update tanpa gedung", async () => {
    docData = { name: "GA-Listrik", gedung: "SEK-1-GA", jenis: "Listrik", status: "Aktif", provider: "PLN" };
    render(<UtilitasGedungFormModal open editName="GA-Listrik" defaultGedung="SEK-1-GA" onClose={() => {}} />);
    await screen.findByDisplayValue("PLN");
    expect(screen.getByText("Edit Utilitas")).toBeTruthy();
    fireEvent.click(screen.getByText("Simpan"));
    await waitFor(() => expect(updateMut).toHaveBeenCalled());
    const arg = updateMut.mock.calls[0][0];
    expect(arg.name).toBe("GA-Listrik");
    expect(arg.patch).toMatchObject({ jenis: "Listrik", status: "Aktif", provider: "PLN" });
    expect(arg.patch.gedung).toBeUndefined();
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @sekolahpro/app-school test -- UtilitasGedungFormModal`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

Edit `UtilitasGedungFormModal.tsx`:

3a. Import:
```tsx
import { useEffect, useState } from "react";
import { useResourceCreate, useResourceDoc, useResourceUpdate } from "@sekolahpro/api-client";
```

3b. Props tambah `editName?: string;`. Destructure ikut.

3c. Hooks setelah `create`:
```tsx
  const update = useResourceUpdate<{ name: string }>("Utilitas Gedung");
  const docQ = useResourceDoc<Record<string, unknown>>("Utilitas Gedung", editName, { enabled: !!editName });
```

3d. Effect:
```tsx
  useEffect(() => {
    if (docQ.data) {
      const d = docQ.data as Record<string, unknown>;
      setForm({
        gedung: `${d.gedung ?? defaultGedung ?? ""}`, jenis: `${d.jenis ?? "Listrik"}`,
        provider: `${d.provider ?? ""}`, nomor_pelanggan: `${d.nomor_pelanggan ?? ""}`,
        kapasitas: `${d.kapasitas ?? ""}`, satuan: `${d.satuan ?? ""}`, status: `${d.status ?? "Aktif"}`,
      });
    }
  }, [docQ.data, defaultGedung]);
```

3e. `canSubmit`: tambahkan `&& !update.isPending`. Guard `!sekolah` di submit jadi `if (!editName && !sekolah)`.

3f. Ganti `submit` try block:
```tsx
    try {
      const patch: Record<string, unknown> = { jenis: form.jenis, status: form.status };
      if (form.provider.trim()) patch.provider = form.provider.trim();
      if (form.nomor_pelanggan.trim()) patch.nomor_pelanggan = form.nomor_pelanggan.trim();
      if (form.kapasitas.trim()) patch.kapasitas = form.kapasitas.trim();
      if (form.satuan.trim()) patch.satuan = form.satuan.trim();
      let name: string;
      if (editName) {
        name = (await update.mutateAsync({ name: editName, patch })).name;
      } else {
        name = (await create.mutateAsync({ ...patch, gedung: form.gedung.trim() })).name;
      }
      await qc.invalidateQueries({ queryKey: ["resource:list", "Utilitas Gedung"] });
      reset();
      if (onCreated) onCreated(name);
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal menyimpan utilitas.");
    }
```

3g. Title: `title={editName ? "Edit Utilitas" : "Tambah Utilitas"}`. Label pending mengikut.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm --filter @sekolahpro/app-school test -- UtilitasGedungFormModal`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web add apps/school/src/components/infrastruktur/UtilitasGedungFormModal.tsx apps/school/src/components/infrastruktur/UtilitasGedungFormModal.test.tsx
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web commit -m "feat(infrastruktur): UtilitasGedungFormModal mode edit"
```

---

## Task 6: Wiring ke route detail Gedung

Tambah ke `$sekolah.infrastruktur.daftar-gedung.$gedungId.tsx`: tombol "Tambah"
per SectionCard, kolom "Aksi" (Edit/Hapus) di tabel Lantai, Ruangan, Fasilitas,
Utilitas, state modal + `ConfirmDeleteDialog`.

**Files:**
- Modify: `apps/school/src/routes/$sekolah.infrastruktur.daftar-gedung.$gedungId.tsx`
- Test: `apps/school/src/routes/__tests__/gedungDetailDelete.test.tsx` (Create — helper murni)

- [ ] **Step 1: Tulis test gagal (helper deskripsi hapus)**

Ekstrak helper kecil agar teruji tanpa router.

```tsx
// apps/school/src/routes/__tests__/gedungDetailDelete.test.tsx
import { describe, it, expect } from "vitest";
import { deleteTargetLabel } from "../$sekolah.infrastruktur.daftar-gedung.$gedungId";

describe("deleteTargetLabel", () => {
  it("format label hapus dgn doctype + name", () => {
    expect(deleteTargetLabel({ doctype: "Lantai", name: "GA-L1" })).toBe("Lantai GA-L1");
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @sekolahpro/app-school test -- gedungDetailDelete`
Expected: FAIL — `deleteTargetLabel` belum di-export.

- [ ] **Step 3: Implementasi wiring**

3a. Import baru (tambah ke import existing):
```tsx
import { Button } from "@sekolahpro/ui"; // pastikan Button termasuk
import { useResourceDelete } from "@sekolahpro/api-client";
import { LantaiFormModal } from "../components/infrastruktur/LantaiFormModal";
import { RuanganFormModal } from "../components/infrastruktur/RuanganFormModal";
import { FasilitasRuanganFormModal } from "../components/infrastruktur/FasilitasRuanganFormModal";
import { UtilitasGedungFormModal } from "../components/infrastruktur/UtilitasGedungFormModal";
import { ConfirmDeleteDialog } from "../components/infrastruktur/ConfirmDeleteDialog";
```

3b. Helper di-export sebelum komponen:
```tsx
export function deleteTargetLabel(t: { doctype: string; name: string }): string {
  return `${t.doctype} ${t.name}`;
}
```

3c. State CRUD dalam `GedungDetailPage` (setelah `const [tab, setTab] = ...`):
```tsx
  const [lantaiModal, setLantaiModal] = useState<{ open: boolean; editName?: string }>({ open: false });
  const [ruanganModal, setRuanganModal] = useState<{ open: boolean; editName?: string }>({ open: false });
  const [fasilitasModal, setFasilitasModal] = useState<{ open: boolean; editName?: string }>({ open: false });
  const [utilitasModal, setUtilitasModal] = useState<{ open: boolean; editName?: string }>({ open: false });
  const [del, setDel] = useState<{ doctype: string; name: string } | null>(null);
  const [delErr, setDelErr] = useState<string | null>(null);
  const delMut = useResourceDelete(del?.doctype ?? "Lantai");

  const refetchAll = () => Promise.all([lantaiQ.refetch(), ruanganQ.refetch(), utilitasQ.refetch(), fasilitasQ.refetch()]);
  const confirmDelete = async () => {
    if (!del) return;
    setDelErr(null);
    try { await delMut.mutateAsync(del.name); await refetchAll(); setDel(null); }
    catch (e) { setDelErr((e as Error)?.message ?? "Gagal menghapus."); }
  };
```

3d. Kolom Aksi reusable (dalam komponen):
```tsx
  const actionCol = <T extends { name: string }>(onEdit: (r: T) => void, doctype: string): Column<T> => ({
    key: "aksi", header: "Aksi",
    cell: (r) => (
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => onEdit(r)}>Edit</Button>
        <Button variant="outline" onClick={() => { setDelErr(null); setDel({ doctype, name: r.name }); }}>Hapus</Button>
      </div>
    ),
  });
```

3e. Tiap SectionCard: prop `action` = tombol Tambah; columns += actionCol.
Contoh Lantai:
```tsx
<SectionCard title="Lantai" padded={false}
  action={<Button onClick={() => setLantaiModal({ open: true })}>Tambah Lantai</Button>}>
  <DataTable<Lantai>
    data={lantaiQ.data ?? []}
    columns={[...LANTAI_COLS, actionCol<Lantai>((r) => setLantaiModal({ open: true, editName: r.name }), "Lantai")]}
    rowKey={(r) => r.name}
    empty={emptyRows("lantai")}
  />
</SectionCard>
```
Idem:
- Ruangan → `setRuanganModal`, doctype "Ruangan".
- Fasilitas → `setFasilitasModal`, doctype "Fasilitas Ruangan" (beri tombol "Tambah Fasilitas").
- Utilitas → `setUtilitasModal`, doctype "Utilitas Gedung".

3f. Render modal + dialog sebelum penutup fragment `primary`:
```tsx
<LantaiFormModal
  open={lantaiModal.open}
  onClose={() => setLantaiModal({ open: false })}
  defaultGedung={gedungId}
  {...(lantaiModal.editName ? { editName: lantaiModal.editName } : {})}
  onCreated={() => { void lantaiQ.refetch(); }}
/>
<RuanganFormModal
  open={ruanganModal.open}
  onClose={() => setRuanganModal({ open: false })}
  gedung={gedungId}
  {...(ruanganModal.editName ? { editName: ruanganModal.editName } : {})}
  onCreated={() => { void ruanganQ.refetch(); }}
/>
<FasilitasRuanganFormModal
  open={fasilitasModal.open}
  onClose={() => setFasilitasModal({ open: false })}
  {...(fasilitasModal.editName ? { editName: fasilitasModal.editName } : {})}
  onCreated={() => { void fasilitasQ.refetch(); }}
/>
<UtilitasGedungFormModal
  open={utilitasModal.open}
  onClose={() => setUtilitasModal({ open: false })}
  defaultGedung={gedungId}
  {...(utilitasModal.editName ? { editName: utilitasModal.editName } : {})}
  onCreated={() => { void utilitasQ.refetch(); }}
/>
<ConfirmDeleteDialog
  open={!!del}
  label={del ? deleteTargetLabel(del) : ""}
  error={delErr}
  pending={delMut.isPending}
  onConfirm={confirmDelete}
  onClose={() => { setDel(null); setDelErr(null); }}
/>
```

3g. Update comment header file: hapus klaim "read-only ... pembuatan data dilakukan di modul masing-masing"; ganti jadi "CRUD inline per tab". Pastikan `Button` ada di import `@sekolahpro/ui`.

Catatan: `RuanganFormModal` tdk punya `defaultLantai` di sini (user pilih lantai
dalam gedung; select sudah difilter `gedung={gedungId}` dari Task 3).
`FasilitasRuanganFormModal` user pilih ruangan (select global; pemfilteran per
gedung = peningkatan opsional di luar scope).

- [ ] **Step 4: Test + lint + typecheck**

Run: `pnpm --filter @sekolahpro/app-school test -- gedungDetailDelete` → PASS.
Run: `pnpm --filter @sekolahpro/app-school test` → semua lulus.
Run: `pnpm --filter @sekolahpro/app-school typecheck` → 0 error.
Run: `pnpm --filter @sekolahpro/app-school lint` → 0 error.

- [ ] **Step 5: Commit**

```bash
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web add apps/school/src/routes/$sekolah.infrastruktur.daftar-gedung.$gedungId.tsx apps/school/src/routes/__tests__/gedungDetailDelete.test.tsx
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web commit -m "feat(infrastruktur): CRUD inline Lantai/Ruangan/Fasilitas/Utilitas di detail Gedung"
```

---

## Task 7: Verifikasi manual + dokumentasi OpenWolf

- [ ] **Step 1: Dev server & cek UI**

Run: `pnpm --filter @sekolahpro/app-school dev`
Buka `/{sekolah}/infrastruktur/daftar-gedung/{gedungId}`. Verifikasi tiap tab:
Tambah membuka modal dgn konteks gedung; Edit memuat data; Hapus minta konfirmasi;
tabel refresh tanpa reload.
Catatan R1: jika login bukan System Manager → mutasi gagal 403 (lihat spec R1).

- [ ] **Step 2: Update OpenWolf**

Update `apps/school/.wolf/anatomy.md` (1 file baru ConfirmDeleteDialog + 4 modal
dimodifikasi + route) dan append `apps/school/.wolf/memory.md`. Bila ada bug saat
run, log ke `apps/school/.wolf/buglog.json`.

- [ ] **Step 3: Commit dokumentasi**

```bash
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web add apps/school/.wolf
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web commit -m "docs(infrastruktur): update anatomy + memory utk CRUD Gedung"
```

---

## Self-Review (penulis plan)

- **Spec coverage (Addendum):** Lantai CRUD (T2+T6), Ruangan CRUD (T3+T6),
  Fasilitas CRUD (T4+T6), Utilitas CRUD (T5+T6), konfirmasi hapus (T1+T6),
  R1 perm didokumentasikan (T7). ✓
- **Reuse, bukan rebuild:** 4 modal existing diperluas (edit), tidak dibuat ulang;
  `ChildRowsEditor`/grid-in-parent DIBATALKAN (Fasilitas pakai modal standalone
  sesuai pola codebase). ✓
- **Backward-compat:** `editName` opsional; caller lama (route modul terpisah)
  tanpa `editName` tetap create. `onCreated` dipakai utk create & edit. ✓
- **Type/signature:** `useResourceUpdate` = `{name, patch}`, `useResourceDelete`
  = `name`, `useResourceDoc(doctype, name, {enabled})` — sesuai
  `packages/api-client/src/frappeResource.ts`. Modal `tone="rose"` valid. ✓
- **Placeholder scan:** tdk ada TBD/TODO; tiap step berisi kode nyata. ✓
- **Test infra:** vitest `globals:false` → import dari "vitest"; jsdom + RTL +
  jest-dom ada. Command `pnpm --filter @sekolahpro/app-school test -- <file>`. ✓
