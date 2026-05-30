# Manajemen Inline Lantai/Ruangan/Fasilitas/Utilitas di Detail Gedung — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ubah tab read-only (Lantai, Ruangan, Fasilitas, Utilitas) di halaman detail Gedung jadi CRUD penuh (Tambah/Edit/Hapus), dengan **reuse + extend** 4 modal yang sudah ada.

**Architecture:** FE-only (`sekolahpro-web`, app `apps/school`). 4 modal infrastruktur sudah ada tapi **create-only & tanpa konteks default**. Tiap modal di-extend dua hal: (a) **prop default-context** (`defaultGedung`/`defaultRuangan`) utk pre-fill+lock konteks dari halaman gedung; (b) **mode edit** (`editName` + `useResourceDoc` + `useResourceUpdate`). Backward-compatible (caller lama tanpa prop baru = perilaku create lama). Tambah `ConfirmDeleteDialog` + `useResourceDelete`. Wire ke route detail Gedung.

**Tech Stack:** React 18, TanStack Router/Query, `@sekolahpro/ui`, `@sekolahpro/api-client`, Vitest + @testing-library/react (jsdom, `globals:false`).

**Spec:** `docs/superpowers/specs/2026-05-30-gedung-infra-crud-design.md` (lihat Addendum 2026-05-30).

**Branch:** `feat/gedung-infra-crud` (spec + plan sudah di-commit).

---

## Temuan Kunci (state aktual tiap modal — WAJIB dipakai saat edit)

Semua di `apps/school/src/components/infrastruktur/`. Props saat ini hanya
`{ open, onClose, onCreated? }`. **Prop default belum ada** — ditambah di plan ini.

| Modal | doctype | Bentuk state | Catatan create |
|---|---|---|---|
| `LantaiFormModal` | Lantai | useState individual: `nama`, `nomorLantai`, `gedung` | payload `{nama,nomor_lantai,gedung}` — **TIDAK kirim sekolah** (hook BE `auto_set_sekolah` yg set) |
| `RuanganFormModal` | Ruangan | useState individual: `nama,kode,lantai,gedung,sekolah,jenisRuangan,kapasitas,luasM2,status` | gedung/sekolah opsional di payload |
| `FasilitasRuanganFormModal` | Fasilitas Ruangan | useState individual: `parent,namaFasilitas,jumlah,kondisi` | payload sertakan `parent/parenttype/parentfield` |
| `UtilitasGedungFormModal` | Utilitas Gedung | objek `form` + `set(k,v)` + `EMPTY_FORM` | payload `{gedung,jenis,status,...}` |

Semua punya `useResourceList` utk select (Gedung/Lantai/Ruangan/Sekolah), `reset()`,
dan callback `onCreated`. Dipakai juga di route modul terpisah → perubahan HARUS
backward-compatible.

## File Structure

- **Create** `…/infrastruktur/ConfirmDeleteDialog.tsx` + `.test.tsx`
- **Modify** `…/infrastruktur/LantaiFormModal.tsx` (+ `defaultGedung`, edit) + **Create** `.test.tsx`
- **Modify** `…/infrastruktur/RuanganFormModal.tsx` (+ `defaultGedung` filter lantai, edit) + **Create** `.test.tsx`
- **Modify** `…/infrastruktur/FasilitasRuanganFormModal.tsx` (+ `defaultGedung` filter ruangan, edit) + **Create** `.test.tsx`
- **Modify** `…/infrastruktur/UtilitasGedungFormModal.tsx` (+ `defaultGedung`, edit) + **Create** `.test.tsx`
- **Modify** `…/routes/$sekolah.infrastruktur.daftar-gedung.$gedungId.tsx` (Tambah/Edit/Hapus + wiring)

## Konvensi Test

- Jalankan: `pnpm --filter @sekolahpro/app-school test -- <namaFile>`
- vitest `globals:false` → WAJIB import `{ describe, it, expect, vi }` dari `"vitest"`.
- Mock SEMUA hook api-client yg dipakai modal: `useResourceCreate`,
  `useResourceUpdate`, `useResourceDoc`, `useResourceList` (select butuh ini).
- Lint: `pnpm --filter @sekolahpro/app-school lint`

---

## Task 1: ConfirmDeleteDialog

**Files:** Create `…/infrastruktur/ConfirmDeleteDialog.tsx` + `.test.tsx`

- [ ] **Step 1: Tulis test gagal**

```tsx
// apps/school/src/components/infrastruktur/ConfirmDeleteDialog.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

describe("ConfirmDeleteDialog", () => {
  it("tombol Hapus memanggil onConfirm", () => {
    const onConfirm = vi.fn();
    render(<ConfirmDeleteDialog open label="Lantai GA-L1" onConfirm={onConfirm} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    expect(onConfirm).toHaveBeenCalled();
  });
  it("menampilkan error bila ada", () => {
    render(<ConfirmDeleteDialog open label="X" error="masih ada data turunan" onConfirm={() => {}} onClose={() => {}} />);
    expect(screen.getByText("masih ada data turunan")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run → FAIL**

Run: `pnpm --filter @sekolahpro/app-school test -- ConfirmDeleteDialog` → FAIL (module belum ada).

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
    <Modal open={open} onClose={onClose} size="sm" tone="rose" title="Hapus data?"
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

- [ ] **Step 4: Run → PASS** (2 test)
- [ ] **Step 5: Commit**

```bash
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web add apps/school/src/components/infrastruktur/ConfirmDeleteDialog.tsx apps/school/src/components/infrastruktur/ConfirmDeleteDialog.test.tsx
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web commit -m "feat(infrastruktur): ConfirmDeleteDialog konfirmasi hapus"
```

---

## Task 2: LantaiFormModal — defaultGedung + mode edit

State aktual: `nama`, `nomorLantai`, `gedung` (individual useState). Tambah prop
`defaultGedung` (pre-fill + sembunyikan select gedung) dan `editName`.

**Files:** Modify `LantaiFormModal.tsx` + Create `LantaiFormModal.test.tsx`

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
  useResourceList: () => ({ data: [{ name: "SEK-1-GA", nama: "Gedung A" }], isLoading: false }),
}));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));

import { LantaiFormModal } from "./LantaiFormModal";

describe("LantaiFormModal", () => {
  beforeEach(() => { createMut.mockClear(); updateMut.mockClear(); docData = undefined; });

  it("create dgn defaultGedung mengirim gedung tanpa pilih manual", async () => {
    render(<LantaiFormModal open defaultGedung="SEK-1-GA" onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText("Nama"), { target: { value: "Lantai Dasar" } });
    fireEvent.change(screen.getByLabelText("Nomor Lantai"), { target: { value: "1" } });
    fireEvent.click(screen.getByText("Simpan"));
    await waitFor(() => expect(createMut).toHaveBeenCalled());
    expect(createMut.mock.calls[0][0]).toEqual({ nama: "Lantai Dasar", nomor_lantai: 1, gedung: "SEK-1-GA" });
  });

  it("edit memuat data & update {nama,nomor_lantai}", async () => {
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

> Catatan: tambahkan `aria-label="Nama"` & `aria-label="Nomor Lantai"` pada Input
> terkait saat implementasi agar `getByLabelText` cocok (FormField label belum
> terhubung `htmlFor`).

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implementasi** (edit `LantaiFormModal.tsx`)

3a. Import:
```tsx
import { useEffect, useState } from "react";
import { useResourceCreate, useResourceDoc, useResourceList, useResourceUpdate } from "@sekolahpro/api-client";
```
3b. Props:
```tsx
interface LantaiFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
  defaultGedung?: string;
  editName?: string;
}
export function LantaiFormModal({ open, onClose, onCreated, defaultGedung, editName }: LantaiFormModalProps) {
```
3c. State init gedung dari defaultGedung:
```tsx
  const [gedung, setGedung] = useState(defaultGedung ?? "");
```
3d. Hooks tambahan setelah `create`:
```tsx
  const update = useResourceUpdate<{ name: string }>("Lantai");
  const docQ = useResourceDoc<Record<string, unknown>>("Lantai", editName, { enabled: !!editName });
```
3e. Effect populate (edit) + sinkron defaultGedung (create):
```tsx
  useEffect(() => {
    if (docQ.data) {
      const d = docQ.data as Record<string, unknown>;
      setNama(`${d.nama ?? ""}`);
      setNomorLantai(`${d.nomor_lantai ?? ""}`);
      setGedung(`${d.gedung ?? defaultGedung ?? ""}`);
    } else if (!editName && defaultGedung) {
      setGedung(defaultGedung);
    }
  }, [docQ.data, defaultGedung, editName]);
```
3f. `canSubmit`: tambahkan `&& !update.isPending`.
3g. `submit`:
```tsx
  const submit = async () => {
    setErr(null);
    try {
      let name: string;
      if (editName) {
        name = (await update.mutateAsync({ name: editName, patch: { nama: nama.trim(), nomor_lantai: Number(nomorLantai) } })).name;
      } else {
        name = (await create.mutateAsync({ nama: nama.trim(), nomor_lantai: Number(nomorLantai), gedung })).name;
      }
      await qc.invalidateQueries({ queryKey: ["resource:list", "Lantai"] });
      onCreated?.(name);
      reset();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal menyimpan lantai.");
    }
  };
```
3h. `reset()`: ganti `setGedung("")` → `setGedung(defaultGedung ?? "")`.
3i. Title: `title={editName ? "Edit Lantai" : "Tambah Lantai"}`; tombol pending `{create.isPending || update.isPending ? "Menyimpan..." : "Simpan"}`.
3j. Field Gedung: bila `defaultGedung` ada, JANGAN render select (terkunci). Bungkus:
```tsx
{!defaultGedung && (
  <FormField label="Gedung" required> … SearchableSelect existing … </FormField>
)}
```
3k. Tambah `aria-label="Nama"` pada Input nama, `aria-label="Nomor Lantai"` pada Input nomor.

- [ ] **Step 4: Run → PASS** (2 test)
- [ ] **Step 5: Commit**

```bash
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web add apps/school/src/components/infrastruktur/LantaiFormModal.tsx apps/school/src/components/infrastruktur/LantaiFormModal.test.tsx
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web commit -m "feat(infrastruktur): LantaiFormModal defaultGedung + mode edit"
```

---

## Task 3: RuanganFormModal — defaultGedung (filter lantai) + mode edit

State aktual individual. Tambah `defaultGedung` (filter list lantai per gedung +
sembunyikan select Gedung/Sekolah karena denorm BE) dan `editName`.

**Files:** Modify `RuanganFormModal.tsx` + Create `RuanganFormModal.test.tsx`

- [ ] **Step 1: Tulis test gagal**

```tsx
// apps/school/src/components/infrastruktur/RuanganFormModal.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const createMut = vi.fn().mockResolvedValue({ name: "GA-L1-R1" });
const updateMut = vi.fn().mockResolvedValue({ name: "GA-L1-R1" });
let docData: Record<string, unknown> | undefined;
vi.mock("@sekolahpro/api-client", () => ({
  useResourceCreate: () => ({ mutateAsync: createMut, isPending: false }),
  useResourceUpdate: () => ({ mutateAsync: updateMut, isPending: false }),
  useResourceDoc: () => ({ data: docData }),
  useResourceList: () => ({ data: [{ name: "GA-L1", nomor_lantai: 1 }] }),
}));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));

import { RuanganFormModal } from "./RuanganFormModal";

describe("RuanganFormModal", () => {
  beforeEach(() => { createMut.mockClear(); updateMut.mockClear(); docData = undefined; });

  it("create kirim field wajib (jenis default Kelas, status Tersedia)", async () => {
    render(<RuanganFormModal open defaultGedung="SEK-1-GA" onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText("Nama"), { target: { value: "Kelas 1A" } });
    fireEvent.change(screen.getByLabelText("Kode"), { target: { value: "R1" } });
    fireEvent.change(screen.getByLabelText("Lantai"), { target: { value: "GA-L1" } });
    fireEvent.click(screen.getByText("Simpan"));
    await waitFor(() => expect(createMut).toHaveBeenCalled());
    expect(createMut.mock.calls[0][0]).toMatchObject({ nama: "Kelas 1A", kode: "R1", lantai: "GA-L1", jenis_ruangan: "Kelas", status: "Tersedia" });
  });

  it("edit memuat & update (tanpa sekolah/gedung)", async () => {
    docData = { name: "GA-L1-R1", nama: "Kelas 1A", kode: "R1", lantai: "GA-L1", jenis_ruangan: "Kelas", status: "Tersedia", kapasitas: 30 };
    render(<RuanganFormModal open editName="GA-L1-R1" defaultGedung="SEK-1-GA" onClose={() => {}} />);
    await screen.findByDisplayValue("Kelas 1A");
    expect(screen.getByText("Edit Ruangan")).toBeTruthy();
    fireEvent.click(screen.getByText("Simpan"));
    await waitFor(() => expect(updateMut).toHaveBeenCalled());
    const arg = updateMut.mock.calls[0][0];
    expect(arg.name).toBe("GA-L1-R1");
    expect(arg.patch).toMatchObject({ nama: "Kelas 1A", kode: "R1", lantai: "GA-L1", kapasitas: 30 });
    expect(arg.patch.sekolah).toBeUndefined();
    expect(arg.patch.gedung).toBeUndefined();
  });
});
```

> Untuk test pakai `<select>` polos (Lantai) gunakan `aria-label="Lantai"`. Jika
> tetap `SearchableSelect`, sesuaikan query (lihat catatan implementasi 3g).

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implementasi** (edit `RuanganFormModal.tsx`)

3a. Import:
```tsx
import { useEffect, useState } from "react";
import { useResourceCreate, useResourceDoc, useResourceList, useResourceUpdate } from "@sekolahpro/api-client";
```
3b. Props (interface `Props`): tambah `defaultGedung?: string; editName?: string;`. Destructure ikut.
3c. Hooks setelah `create`:
```tsx
  const update = useResourceUpdate<{ name: string }>("Ruangan");
  const docQ = useResourceDoc<Record<string, unknown>>("Ruangan", editName, { enabled: !!editName });
```
3d. Ubah `lantaiQ` agar bisa difilter per gedung:
```tsx
  const lantaiQ = useResourceList<LantaiRow>("Lantai", {
    fields: ["name", "gedung", "nomor_lantai"],
    filters: defaultGedung ? [["gedung", "=", defaultGedung]] : [],
    limit_page_length: 0,
  });
```
3e. Effect populate saat edit:
```tsx
  useEffect(() => {
    if (!docQ.data) return;
    const d = docQ.data as Record<string, unknown>;
    setNama(`${d.nama ?? ""}`); setKode(`${d.kode ?? ""}`); setLantai(`${d.lantai ?? ""}`);
    setJenisRuangan(`${d.jenis_ruangan ?? "Kelas"}`); setStatus(`${d.status ?? "Tersedia"}`);
    setKapasitas(`${d.kapasitas ?? ""}`); setLuasM2(`${d.luas_m2 ?? ""}`);
  }, [docQ.data]);
```
3f. `submit`: bangun `patch` lalu cabang create/update; saat `defaultGedung` ada,
JANGAN kirim gedung/sekolah (denorm BE):
```tsx
  const submit = async () => {
    setErr(null);
    const patch: Record<string, unknown> = {
      nama: nama.trim(), kode: kode.trim(), lantai,
      jenis_ruangan: jenisRuangan, status,
    };
    if (!defaultGedung && gedung) patch.gedung = gedung;
    if (!defaultGedung && sekolah) patch.sekolah = sekolah;
    if (kapasitas.trim()) { const n = parseInt(kapasitas, 10); if (!Number.isNaN(n)) patch.kapasitas = n; }
    if (luasM2.trim()) { const n = parseFloat(luasM2); if (!Number.isNaN(n)) patch.luas_m2 = n; }
    try {
      const name = editName
        ? (await update.mutateAsync({ name: editName, patch })).name
        : (await create.mutateAsync(patch)).name;
      await qc.invalidateQueries({ queryKey: ["resource:list", "Ruangan"] });
      onCreated?.(name); reset(); onClose();
    } catch (e) { setErr((e as Error)?.message ?? "Gagal menyimpan ruangan."); }
  };
```
3g. Saat `defaultGedung` ada, sembunyikan FormField "Gedung" & "Sekolah".
Untuk testability, render Lantai sbg `<select aria-label="Lantai">` ATAU
pertahankan `SearchableSelect` dan ubah test pakai mekanisme komponennya. Plan
ini pilih: **ganti Lantai+Jenis+Status ke `Select` polos `@sekolahpro/ui`** dgn
`aria-label`, agar test sederhana & konsisten. Tambah `aria-label="Nama"`,
`aria-label="Kode"` pada Input.
3h. `canSubmit`/`requiredMissing`: pakai `requiredMissing || create.isPending || update.isPending`.
3i. Title: `editName ? "Edit Ruangan" : "Tambah Ruangan"`.

- [ ] **Step 4: Run → PASS** (2 test)
- [ ] **Step 5: Commit**

```bash
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web add apps/school/src/components/infrastruktur/RuanganFormModal.tsx apps/school/src/components/infrastruktur/RuanganFormModal.test.tsx
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web commit -m "feat(infrastruktur): RuanganFormModal defaultGedung + mode edit"
```

---

## Task 4: FasilitasRuanganFormModal — defaultGedung (filter ruangan) + mode edit

State aktual: `parent, namaFasilitas, jumlah, kondisi`.

**Files:** Modify `FasilitasRuanganFormModal.tsx` + Create `.test.tsx`

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
    render(<FasilitasRuanganFormModal open onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText("Ruangan"), { target: { value: "GA-L1-R1" } });
    fireEvent.change(screen.getByLabelText("Nama Fasilitas"), { target: { value: "Kursi" } });
    fireEvent.click(screen.getByText("Simpan"));
    await waitFor(() => expect(createMut).toHaveBeenCalled());
    expect(createMut.mock.calls[0][0]).toMatchObject({ nama_fasilitas: "Kursi", parent: "GA-L1-R1", parenttype: "Ruangan", parentfield: "fasilitas" });
  });

  it("edit memuat & update tanpa parent", async () => {
    docData = { name: "fas-1", nama_fasilitas: "Kursi", jumlah: 10, kondisi: "Baik", parent: "GA-L1-R1" };
    render(<FasilitasRuanganFormModal open editName="fas-1" onClose={() => {}} />);
    await screen.findByDisplayValue("Kursi");
    expect(screen.getByText("Edit Fasilitas")).toBeTruthy();
    fireEvent.click(screen.getByText("Simpan"));
    await waitFor(() => expect(updateMut).toHaveBeenCalled());
    const arg = updateMut.mock.calls[0][0];
    expect(arg.name).toBe("fas-1");
    expect(arg.patch).toMatchObject({ nama_fasilitas: "Kursi", jumlah: 10, kondisi: "Baik" });
    expect(arg.patch.parent).toBeUndefined();
  });
});
```

> Render Ruangan sbg `Select aria-label="Ruangan"`, Nama sbg Input `aria-label="Nama Fasilitas"`.

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implementasi** (edit `FasilitasRuanganFormModal.tsx`)

3a. Import: tambah `useEffect`; `useResourceDoc, useResourceUpdate` dari api-client.
3b. Props (`Props`): tambah `defaultGedung?: string; editName?: string;`. Destructure ikut.
3c. Hooks setelah `create`:
```tsx
  const update = useResourceUpdate<{ name: string }>("Fasilitas Ruangan");
  const docQ = useResourceDoc<Record<string, unknown>>("Fasilitas Ruangan", editName, { enabled: !!editName });
```
3d. `ruanganQ` filter per gedung (denorm Ruangan.gedung ada):
```tsx
  const ruanganQ = useResourceList<RuanganRow>("Ruangan", {
    fields: ["name", "nama"],
    filters: defaultGedung ? [["gedung", "=", defaultGedung]] : [],
    limit_page_length: 0,
  });
```
3e. Effect:
```tsx
  useEffect(() => {
    if (!docQ.data) return;
    const d = docQ.data as Record<string, unknown>;
    setNamaFasilitas(`${d.nama_fasilitas ?? ""}`);
    setJumlah(`${d.jumlah ?? ""}`); setKondisi(`${d.kondisi ?? ""}`);
    if (d.parent) setParent(`${d.parent}`);
  }, [docQ.data]);
```
3f. `submit`:
```tsx
  const submit = async () => {
    setErr(null);
    const patch: Record<string, unknown> = { nama_fasilitas: namaFasilitas.trim() };
    if (jumlah.trim()) { const n = Number(jumlah); if (!Number.isNaN(n)) patch.jumlah = n; }
    if (kondisi) patch.kondisi = kondisi;
    try {
      const name = editName
        ? (await update.mutateAsync({ name: editName, patch })).name
        : (await create.mutateAsync({ ...patch, parent, parenttype: "Ruangan", parentfield: "fasilitas" })).name;
      await qc.invalidateQueries({ queryKey: ["resource:list", "Fasilitas Ruangan"] });
      onCreated?.(name); reset(); onClose();
    } catch (e) { setErr((e as Error)?.message ?? "Gagal menyimpan fasilitas."); }
  };
```
3g. `requiredMissing` saat edit: `parent` tdk wajib → `const requiredMissing = !namaFasilitas.trim() || (!editName && !parent);`
3h. Render Ruangan sbg `Select aria-label="Ruangan"`, Nama Input `aria-label="Nama Fasilitas"`. Title `editName ? "Edit Fasilitas" : "Tambah Fasilitas"`. Tombol disabled `requiredMissing || create.isPending || update.isPending`.

- [ ] **Step 4: Run → PASS** (2 test)
- [ ] **Step 5: Commit**

```bash
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web add apps/school/src/components/infrastruktur/FasilitasRuanganFormModal.tsx apps/school/src/components/infrastruktur/FasilitasRuanganFormModal.test.tsx
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web commit -m "feat(infrastruktur): FasilitasRuanganFormModal defaultGedung + mode edit"
```

---

## Task 5: UtilitasGedungFormModal — defaultGedung + mode edit

State aktual: objek `form` + `set(k,v)` + `EMPTY_FORM`.

**Files:** Modify `UtilitasGedungFormModal.tsx` + Create `.test.tsx`

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
  useResourceList: () => ({ data: [{ name: "SEK-1-GA", nama: "Gedung A" }] }),
}));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));

import { UtilitasGedungFormModal } from "./UtilitasGedungFormModal";

describe("UtilitasGedungFormModal", () => {
  beforeEach(() => { createMut.mockClear(); updateMut.mockClear(); docData = undefined; });

  it("create dgn defaultGedung + jenis", async () => {
    render(<UtilitasGedungFormModal open defaultGedung="SEK-1-GA" onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText("Jenis"), { target: { value: "Listrik" } });
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

> Render Jenis sbg `Select aria-label="Jenis"`.

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implementasi** (edit `UtilitasGedungFormModal.tsx`)

3a. Import: tambah `useEffect`; `useResourceDoc, useResourceUpdate`.
3b. Props `Props`: tambah `defaultGedung?: string; editName?: string;`. Destructure ikut.
3c. Init form gedung dari default:
```tsx
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, gedung: defaultGedung ?? "" });
```
3d. Hooks setelah `create`:
```tsx
  const update = useResourceUpdate<{ name: string }>("Utilitas Gedung");
  const docQ = useResourceDoc<Record<string, unknown>>("Utilitas Gedung", editName, { enabled: !!editName });
```
3e. Effect:
```tsx
  useEffect(() => {
    if (docQ.data) {
      const d = docQ.data as Record<string, unknown>;
      setForm({
        gedung: `${d.gedung ?? defaultGedung ?? ""}`, sekolah: `${d.sekolah ?? ""}`,
        jenis: `${d.jenis ?? ""}`, provider: `${d.provider ?? ""}`, kapasitas: `${d.kapasitas ?? ""}`,
        satuan: `${d.satuan ?? ""}`, nomor_pelanggan: `${d.nomor_pelanggan ?? ""}`, status: `${d.status ?? "Aktif"}`,
      });
    } else if (!editName && defaultGedung) {
      setForm((c) => ({ ...c, gedung: defaultGedung }));
    }
  }, [docQ.data, defaultGedung, editName]);
```
3f. `requiredOk` saat edit: gedung tdk wajib → `const requiredOk = (!!form.gedung || !!editName) && !!form.jenis && !!form.status;` dan `submitDisabled = !requiredOk || create.isPending || update.isPending;`
3g. `submit`:
```tsx
  const submit = async () => {
    setErr(null);
    const patch: Record<string, string> = { jenis: form.jenis, status: form.status };
    if (form.provider) patch.provider = form.provider;
    if (form.kapasitas) patch.kapasitas = form.kapasitas;
    if (form.satuan) patch.satuan = form.satuan;
    if (form.nomor_pelanggan) patch.nomor_pelanggan = form.nomor_pelanggan;
    try {
      let name: string;
      if (editName) {
        name = (await update.mutateAsync({ name: editName, patch })).name;
      } else {
        const createPayload: Record<string, string> = { ...patch, gedung: form.gedung };
        if (form.sekolah) createPayload.sekolah = form.sekolah;
        name = (await create.mutateAsync(createPayload)).name;
      }
      await qc.invalidateQueries({ queryKey: ["resource:list", "Utilitas Gedung"] });
      reset(); onCreated?.(name); onClose();
    } catch (e) { setErr((e as Error)?.message ?? "Gagal menyimpan utilitas."); }
  };
```
3h. `reset()`: `setForm({ ...EMPTY_FORM, gedung: defaultGedung ?? "" })`.
3i. Bila `defaultGedung` ada → sembunyikan FormField "Gedung" & "Sekolah". Render Jenis sbg `Select aria-label="Jenis"`. Title `editName ? "Edit Utilitas" : "Tambah Utilitas"`.

- [ ] **Step 4: Run → PASS** (2 test)
- [ ] **Step 5: Commit**

```bash
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web add apps/school/src/components/infrastruktur/UtilitasGedungFormModal.tsx apps/school/src/components/infrastruktur/UtilitasGedungFormModal.test.tsx
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web commit -m "feat(infrastruktur): UtilitasGedungFormModal defaultGedung + mode edit"
```

---

## Task 6: Wiring ke route detail Gedung

**Files:** Modify `$sekolah.infrastruktur.daftar-gedung.$gedungId.tsx` +
Create `apps/school/src/routes/__tests__/gedungDetailDelete.test.tsx`

- [ ] **Step 1: Tulis test gagal (helper)**

```tsx
// apps/school/src/routes/__tests__/gedungDetailDelete.test.tsx
import { describe, it, expect } from "vitest";
import { deleteTargetLabel } from "../$sekolah.infrastruktur.daftar-gedung.$gedungId";

describe("deleteTargetLabel", () => {
  it("format label hapus", () => {
    expect(deleteTargetLabel({ doctype: "Lantai", name: "GA-L1" })).toBe("Lantai GA-L1");
  });
});
```

- [ ] **Step 2: Run → FAIL** (`deleteTargetLabel` belum di-export)

- [ ] **Step 3: Implementasi wiring**

3a. Import tambahan:
```tsx
import { Button } from "@sekolahpro/ui"; // tambahkan ke import @sekolahpro/ui yg ada
import { useResourceDelete } from "@sekolahpro/api-client";
import { LantaiFormModal } from "../components/infrastruktur/LantaiFormModal";
import { RuanganFormModal } from "../components/infrastruktur/RuanganFormModal";
import { FasilitasRuanganFormModal } from "../components/infrastruktur/FasilitasRuanganFormModal";
import { UtilitasGedungFormModal } from "../components/infrastruktur/UtilitasGedungFormModal";
import { ConfirmDeleteDialog } from "../components/infrastruktur/ConfirmDeleteDialog";
```

3b. Helper export sebelum komponen:
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

3d. Kolom Aksi reusable:
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

3e. Tiap SectionCard: prop `action` tombol Tambah + `columns` += actionCol. Contoh Lantai:
```tsx
<SectionCard title="Lantai" padded={false}
  action={<Button onClick={() => setLantaiModal({ open: true })}>Tambah Lantai</Button>}>
  <DataTable<Lantai>
    data={lantaiQ.data ?? []}
    columns={[...LANTAI_COLS, actionCol<Lantai>((r) => setLantaiModal({ open: true, editName: r.name }), "Lantai")]}
    rowKey={(r) => r.name} empty={emptyRows("lantai")}
  />
</SectionCard>
```
Idem: Ruangan → `setRuanganModal`/"Ruangan"; Fasilitas → `setFasilitasModal`/"Fasilitas Ruangan" (tombol "Tambah Fasilitas"); Utilitas → `setUtilitasModal`/"Utilitas Gedung".

3f. Render modal + dialog sebelum penutup fragment `primary`:
```tsx
<LantaiFormModal open={lantaiModal.open} onClose={() => setLantaiModal({ open: false })}
  defaultGedung={gedungId} {...(lantaiModal.editName ? { editName: lantaiModal.editName } : {})}
  onCreated={() => { void lantaiQ.refetch(); }} />
<RuanganFormModal open={ruanganModal.open} onClose={() => setRuanganModal({ open: false })}
  defaultGedung={gedungId} {...(ruanganModal.editName ? { editName: ruanganModal.editName } : {})}
  onCreated={() => { void ruanganQ.refetch(); }} />
<FasilitasRuanganFormModal open={fasilitasModal.open} onClose={() => setFasilitasModal({ open: false })}
  defaultGedung={gedungId} {...(fasilitasModal.editName ? { editName: fasilitasModal.editName } : {})}
  onCreated={() => { void fasilitasQ.refetch(); }} />
<UtilitasGedungFormModal open={utilitasModal.open} onClose={() => setUtilitasModal({ open: false })}
  defaultGedung={gedungId} {...(utilitasModal.editName ? { editName: utilitasModal.editName } : {})}
  onCreated={() => { void utilitasQ.refetch(); }} />
<ConfirmDeleteDialog open={!!del} label={del ? deleteTargetLabel(del) : ""} error={delErr}
  pending={delMut.isPending} onConfirm={confirmDelete}
  onClose={() => { setDel(null); setDelErr(null); }} />
```

3g. Update comment header file: hapus klaim "read-only"; ganti "CRUD inline per tab".

- [ ] **Step 4: Test + typecheck + lint**

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

- [ ] **Step 1:** `pnpm --filter @sekolahpro/app-school dev`, buka
  `/{sekolah}/infrastruktur/daftar-gedung/{gedungId}`, verifikasi Tambah/Edit/Hapus
  tiap tab + refresh tabel. R1: non-System-Manager → 403 (lihat spec).
- [ ] **Step 2:** Update `apps/school/.wolf/anatomy.md` (1 file baru + 4 modal +
  route) & append `.wolf/memory.md`; bug → `.wolf/buglog.json`.
- [ ] **Step 3:** Commit:
```bash
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web add apps/school/.wolf
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web commit -m "docs(infrastruktur): update anatomy + memory utk CRUD Gedung"
```

---

## Self-Review (penulis plan)

- **Spec coverage (Addendum):** Lantai (T2+T6), Ruangan (T3+T6), Fasilitas (T4+T6),
  Utilitas (T5+T6), konfirmasi hapus (T1+T6), R1 perm (T7). ✓
- **Akurasi vs kode aktual:** state shape tiap modal sudah dicocokkan (Lantai/
  Ruangan/Fasilitas = useState individual; Utilitas = objek `form`). Lantai create
  TIDAK kirim sekolah (hook BE). Prop default & editName = penambahan baru
  (sebelumnya tdk ada). ✓
- **Reuse, bukan rebuild:** extend 4 modal; `ChildRowsEditor`/grid-in-parent
  DIBATALKAN; Fasilitas = modal standalone via parent ref. ✓
- **Backward-compat:** `defaultGedung`/`editName` opsional; caller lama tetap jalan;
  `onCreated` dipakai create & edit. ✓
- **Type/signature:** `useResourceUpdate`={name,patch}, `useResourceDelete`=name,
  `useResourceDoc(dt,name,{enabled})`, `useResourceList(dt,{filters,...})` sesuai
  `frappeResource.ts`. Modal `tone="rose"` valid. ✓
- **Catatan a11y/test:** beberapa Input/Select diberi `aria-label` agar
  `getByLabelText` di test cocok (FormField label belum `htmlFor`-linked). Untuk
  Lantai/Jenis/Status/Ruangan, plan mengganti `SearchableSelect`→`Select` polos
  demi test deterministik. ✓
- **Placeholder scan:** tidak ada TBD/TODO. ✓
```
