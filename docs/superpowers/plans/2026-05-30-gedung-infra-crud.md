# Manajemen Inline Lantai/Ruangan/Fasilitas/Utilitas di Detail Gedung — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ubah tab read-only (Lantai, Ruangan+Fasilitas, Utilitas) di halaman detail Gedung jadi CRUD penuh, langsung dari satu halaman.

**Architecture:** FE-only (repo `sekolahpro-web`, app `apps/school`). Reuse `GenericFormModal` (config-driven) untuk Lantai; dua modal khusus (`RuanganFormModal`, `UtilitasFormModal`) untuk entitas dengan child-table grid; satu komponen `ChildRowsEditor` generik untuk baris child (Fasilitas, Riwayat). Mutasi via hooks `@sekolahpro/api-client`. Konfirmasi hapus via `Modal` tone `danger`.

**Tech Stack:** React 18, TanStack Router/Query, `@sekolahpro/ui`, `@sekolahpro/api-client`, `@sekolahpro/auth`, Vitest + @testing-library/react (jsdom).

**Spec:** `docs/superpowers/specs/2026-05-30-gedung-infra-crud-design.md`

**Branch:** `feat/gedung-infra-crud` (sudah dibuat, spec sudah di-commit).

---

## Refinement vs Spec

Spec menyebut `LantaiFormModal` dedicated. Tetap dipakai. Catatan: ada
`GenericFormModal` config-driven di `apps/school/src/components/koperasi-master/`,
tapi **terkopel** ke `MasterField`/`onSuccess` dan dipakai modul koperasi —
meng-extend-nya menambah risiko regresi koperasi tanpa manfaat. Karena itu
Lantai pakai **modal dedicated** `LantaiFormModal` yang mirror `GedungFormModal`
(`apps/school/src/components/infrastruktur/GedungFormModal.tsx`) — self-contained,
tanpa menyentuh komponen bersama. Ruangan & Utilitas tetap modal khusus karena
butuh dynamic Lantai-select + child-table grid.

## File Structure

- **Create** `apps/school/src/components/infrastruktur/ChildRowsEditor.tsx` — grid baris child-table generik.
- **Create** `apps/school/src/components/infrastruktur/ChildRowsEditor.test.tsx`
- **Create** `apps/school/src/components/infrastruktur/LantaiFormModal.tsx` — modal create/edit Lantai.
- **Create** `apps/school/src/components/infrastruktur/LantaiFormModal.test.tsx`
- **Create** `apps/school/src/components/infrastruktur/RuanganFormModal.tsx` — modal Ruangan + grid Fasilitas.
- **Create** `apps/school/src/components/infrastruktur/RuanganFormModal.test.tsx`
- **Create** `apps/school/src/components/infrastruktur/UtilitasFormModal.tsx` — modal Utilitas + grid Riwayat.
- **Create** `apps/school/src/components/infrastruktur/UtilitasFormModal.test.tsx`
- **Create** `apps/school/src/components/infrastruktur/ConfirmDeleteDialog.tsx` — dialog konfirmasi hapus reusable.
- **Modify** `apps/school/src/routes/$sekolah.infrastruktur.daftar-gedung.$gedungId.tsx` — tombol Tambah, kolom Aksi (Edit/Hapus), wiring modal.

## Konvensi Test

- Jalankan test app school: `pnpm --filter @sekolahpro/app-school test`
- Satu file: `pnpm --filter @sekolahpro/app-school test -- ChildRowsEditor`
- Mock hooks data dgn `vi.mock("@sekolahpro/api-client", ...)` dan
  `vi.mock("@sekolahpro/auth", ...)` (lihat Task 1 untuk pola lengkap).
- Lint: `pnpm --filter @sekolahpro/app-school lint`

---

## Task 1: ChildRowsEditor (grid baris child-table generik)

Komponen render daftar baris; tiap baris = beberapa input sesuai deskripsi kolom.
Tombol "+ Tambah baris" menambah baris kosong; tombol "Hapus" per baris.
Controlled: `rows` + `onChange`.

**Files:**
- Create: `apps/school/src/components/infrastruktur/ChildRowsEditor.tsx`
- Test: `apps/school/src/components/infrastruktur/ChildRowsEditor.test.tsx`

- [ ] **Step 1: Tulis test gagal**

```tsx
// apps/school/src/components/infrastruktur/ChildRowsEditor.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChildRowsEditor, type ChildColumn } from "./ChildRowsEditor";

type Row = { nama_fasilitas?: string; jumlah?: number; kondisi?: string };

const COLS: ChildColumn<Row>[] = [
  { key: "nama_fasilitas", label: "Nama", type: "text", required: true },
  { key: "jumlah", label: "Jumlah", type: "number" },
  { key: "kondisi", label: "Kondisi", type: "select", options: ["Baik", "Rusak"] },
];

describe("ChildRowsEditor", () => {
  it("tambah baris memanggil onChange dgn baris kosong baru", () => {
    const onChange = vi.fn();
    render(<ChildRowsEditor<Row> rows={[]} columns={COLS} onChange={onChange} addLabel="Tambah Fasilitas" />);
    fireEvent.click(screen.getByText("Tambah Fasilitas"));
    expect(onChange).toHaveBeenCalledWith([{}]);
  });

  it("edit nilai baris memanggil onChange dgn nilai ter-update", () => {
    const onChange = vi.fn();
    render(<ChildRowsEditor<Row> rows={[{}]} columns={COLS} onChange={onChange} addLabel="Tambah" />);
    fireEvent.change(screen.getByLabelText("Nama baris 1"), { target: { value: "Kursi" } });
    expect(onChange).toHaveBeenCalledWith([{ nama_fasilitas: "Kursi" }]);
  });

  it("hapus baris memanggil onChange tanpa baris itu", () => {
    const onChange = vi.fn();
    render(<ChildRowsEditor<Row> rows={[{ nama_fasilitas: "A" }, { nama_fasilitas: "B" }]} columns={COLS} onChange={onChange} addLabel="Tambah" />);
    fireEvent.click(screen.getByLabelText("Hapus baris 1"));
    expect(onChange).toHaveBeenCalledWith([{ nama_fasilitas: "B" }]);
  });

  it("number input mengirim Number, bukan string", () => {
    const onChange = vi.fn();
    render(<ChildRowsEditor<Row> rows={[{}]} columns={COLS} onChange={onChange} addLabel="Tambah" />);
    fireEvent.change(screen.getByLabelText("Jumlah baris 1"), { target: { value: "5" } });
    expect(onChange).toHaveBeenCalledWith([{ jumlah: 5 }]);
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @sekolahpro/app-school test -- ChildRowsEditor`
Expected: FAIL — `Cannot find module './ChildRowsEditor'`.

- [ ] **Step 3: Implementasi minimal**

```tsx
// apps/school/src/components/infrastruktur/ChildRowsEditor.tsx
/**
 * ChildRowsEditor — editor baris untuk child table Frappe (controlled).
 * Dipakai di RuanganFormModal (Fasilitas) & UtilitasFormModal (Riwayat).
 * Tidak menyimpan state sendiri: parent pegang `rows`, terima update via onChange.
 */
import { Button, FormField, Input, Select } from "@sekolahpro/ui";

export interface ChildColumn<T> {
  key: keyof T & string;
  label: string;
  type?: "text" | "number" | "date";
  required?: boolean;
  options?: string[]; // jika ada → render select
}

interface ChildRowsEditorProps<T> {
  rows: T[];
  columns: ChildColumn<T>[];
  onChange: (rows: T[]) => void;
  addLabel: string;
}

export function ChildRowsEditor<T extends Record<string, unknown>>({
  rows,
  columns,
  onChange,
  addLabel,
}: ChildRowsEditorProps<T>) {
  const setCell = (rowIdx: number, col: ChildColumn<T>, raw: string) => {
    const next = rows.map((r, i) => {
      if (i !== rowIdx) return r;
      const copy: Record<string, unknown> = { ...r };
      if (raw === "") delete copy[col.key];
      else copy[col.key] = col.type === "number" ? Number(raw) : raw;
      return copy as T;
    });
    onChange(next);
  };

  const addRow = () => onChange([...rows, {} as T]);
  const removeRow = (idx: number) => onChange(rows.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="text-xs text-muted-fg">Belum ada baris. Klik "{addLabel}".</p>
      )}
      {rows.map((row, idx) => (
        <div key={idx} className="flex items-end gap-2 rounded-md border border-line p-2">
          {columns.map((col) => {
            const id = `${col.label} baris ${idx + 1}`;
            const value = `${row[col.key] ?? ""}`;
            return (
              <div key={col.key} className="flex-1">
                <FormField label={col.label} required={col.required}>
                  {col.options ? (
                    <Select aria-label={id} value={value} onChange={(e) => setCell(idx, col, e.target.value)}>
                      <option value="">— pilih —</option>
                      {col.options.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      aria-label={id}
                      type={col.type === "number" ? "number" : col.type === "date" ? "date" : "text"}
                      value={value}
                      onChange={(e) => setCell(idx, col, e.target.value)}
                    />
                  )}
                </FormField>
              </div>
            );
          })}
          <Button variant="outline" aria-label={`Hapus baris ${idx + 1}`} onClick={() => removeRow(idx)}>
            Hapus
          </Button>
        </div>
      ))}
      <Button variant="outline" onClick={addRow}>{addLabel}</Button>
    </div>
  );
}
```

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm --filter @sekolahpro/app-school test -- ChildRowsEditor`
Expected: PASS (4 test).

- [ ] **Step 5: Commit**

```bash
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web add apps/school/src/components/infrastruktur/ChildRowsEditor.tsx apps/school/src/components/infrastruktur/ChildRowsEditor.test.tsx
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web commit -m "feat(infrastruktur): ChildRowsEditor grid baris child-table"
```

---

## Task 2: LantaiFormModal (modal create/edit Lantai)

Modal dedicated mirror `GedungFormModal`. Field: `nama`, `nomor_lantai`.
Create: set `gedung = gedungId` + `sekolah` dari session. Edit: muat via
`useResourceDoc`, simpan via `useResourceUpdate` (gedung/sekolah tdk dikirim
ulang saat edit).

**Files:**
- Create: `apps/school/src/components/infrastruktur/LantaiFormModal.tsx`
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

  it("create kirim nama + nomor_lantai + gedung + sekolah", async () => {
    render(<LantaiFormModal open gedungId="SEK-1-GA" onClose={() => {}} onSaved={() => {}} />);
    fireEvent.change(screen.getByLabelText("Nama Lantai"), { target: { value: "Lantai Dasar" } });
    fireEvent.change(screen.getByLabelText("Nomor Lantai"), { target: { value: "1" } });
    fireEvent.click(screen.getByText("Simpan"));
    await waitFor(() => expect(createMut).toHaveBeenCalled());
    expect(createMut.mock.calls[0][0]).toEqual({ nama: "Lantai Dasar", nomor_lantai: 1, gedung: "SEK-1-GA", sekolah: "SEK-1" });
  });

  it("disable Simpan saat field wajib kosong", () => {
    render(<LantaiFormModal open gedungId="SEK-1-GA" onClose={() => {}} onSaved={() => {}} />);
    expect((screen.getByText("Simpan") as HTMLButtonElement).disabled).toBe(true);
  });

  it("edit memuat data & memanggil update tanpa gedung/sekolah", async () => {
    docData = { name: "GA-L1", nama: "Lantai Dasar", nomor_lantai: 1 };
    render(<LantaiFormModal open gedungId="SEK-1-GA" editName="GA-L1" onClose={() => {}} onSaved={() => {}} />);
    await screen.findByDisplayValue("Lantai Dasar");
    fireEvent.click(screen.getByText("Simpan"));
    await waitFor(() => expect(updateMut).toHaveBeenCalled());
    const arg = updateMut.mock.calls[0][0];
    expect(arg.name).toBe("GA-L1");
    expect(arg.patch.gedung).toBeUndefined();
    expect(arg.patch.sekolah).toBeUndefined();
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @sekolahpro/app-school test -- LantaiFormModal`
Expected: FAIL — module belum ada.

- [ ] **Step 3: Implementasi**

```tsx
// apps/school/src/components/infrastruktur/LantaiFormModal.tsx
/**
 * LantaiFormModal — create/edit Lantai. Mirror GedungFormModal.
 * Create: gedung di-set dari gedungId, sekolah dari session aktif.
 * Edit: hanya nama + nomor_lantai dikirim (gedung/sekolah tetap).
 */
import { useEffect, useState } from "react";
import { Button, FormField, FormGrid, Input, Modal } from "@sekolahpro/ui";
import { useResourceCreate, useResourceDoc, useResourceUpdate } from "@sekolahpro/api-client";
import { useSessionStore } from "@sekolahpro/auth";
import { useQueryClient } from "@tanstack/react-query";

interface LantaiFormModalProps {
  open: boolean;
  onClose: () => void;
  gedungId: string;
  editName?: string;
  onSaved?: (name: string) => void;
}

interface FormState { nama: string; nomor_lantai: string; }
const INITIAL: FormState = { nama: "", nomor_lantai: "" };

export function LantaiFormModal({ open, onClose, gedungId, editName, onSaved }: LantaiFormModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Lantai");
  const update = useResourceUpdate<{ name: string }>("Lantai");
  const docQ = useResourceDoc<Record<string, unknown>>("Lantai", editName, { enabled: !!editName });
  const sekolah = useSessionStore((s) => s.activeSekolah?.name);

  useEffect(() => {
    if (docQ.data) {
      const d = docQ.data as Record<string, unknown>;
      setForm({ nama: `${d.nama ?? ""}`, nomor_lantai: `${d.nomor_lantai ?? ""}` });
    } else if (!editName) setForm(INITIAL);
  }, [docQ.data, editName]);

  const set = <K extends keyof FormState>(k: K, v: string) => setForm((c) => ({ ...c, [k]: v }));
  const canSubmit = !!form.nama.trim() && form.nomor_lantai.trim() !== "" && !create.isPending && !update.isPending;

  const submit = async () => {
    setErr(null);
    try {
      let name: string;
      if (editName) {
        name = (await update.mutateAsync({ name: editName, patch: { nama: form.nama.trim(), nomor_lantai: Number(form.nomor_lantai) } })).name;
      } else {
        if (!sekolah) { setErr("Sekolah aktif tidak ditemukan."); return; }
        name = (await create.mutateAsync({ nama: form.nama.trim(), nomor_lantai: Number(form.nomor_lantai), gedung: gedungId, sekolah })).name;
      }
      await qc.invalidateQueries({ queryKey: ["resource:list", "Lantai"] });
      if (onSaved) onSaved(name);
      onClose();
    } catch (e) { setErr((e as Error)?.message ?? "Gagal menyimpan lantai."); }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" tone="brand" title={editName ? "Edit Lantai" : "Tambah Lantai"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={submit} disabled={!canSubmit}>{create.isPending || update.isPending ? "Menyimpan..." : "Simpan"}</Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormGrid cols={2}>
          <FormField label="Nama Lantai" required><Input aria-label="Nama Lantai" value={form.nama} onChange={(e) => set("nama", e.target.value)} placeholder="Lantai Dasar" /></FormField>
          <FormField label="Nomor Lantai" required><Input aria-label="Nomor Lantai" type="number" value={form.nomor_lantai} onChange={(e) => set("nomor_lantai", e.target.value)} placeholder="1" /></FormField>
        </FormGrid>
        {err && <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">{err}</div>}
      </div>
    </Modal>
  );
}
```

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm --filter @sekolahpro/app-school test -- LantaiFormModal`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web add apps/school/src/components/infrastruktur/LantaiFormModal.tsx apps/school/src/components/infrastruktur/LantaiFormModal.test.tsx
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web commit -m "feat(infrastruktur): LantaiFormModal create/edit Lantai"
```

---

## Task 3: ConfirmDeleteDialog

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
/** Dialog konfirmasi hapus generik (tone danger). */
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
      tone="danger"
      title="Hapus data?"
      description={`"${label}" akan dihapus permanen.`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={onConfirm} disabled={pending}>{pending ? "Menghapus..." : "Hapus"}</Button>
        </div>
      }
    >
      {error && (
        <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</div>
      )}
    </Modal>
  );
}
```

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm --filter @sekolahpro/app-school test -- ConfirmDeleteDialog`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web add apps/school/src/components/infrastruktur/ConfirmDeleteDialog.tsx apps/school/src/components/infrastruktur/ConfirmDeleteDialog.test.tsx
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web commit -m "feat(infrastruktur): ConfirmDeleteDialog konfirmasi hapus"
```

---

## Task 4: RuanganFormModal (modal Ruangan + grid Fasilitas)

Modal create/edit Ruangan. Lantai-select opsi = daftar Lantai dalam gedung
(prop `lantaiOptions`). Child grid Fasilitas pakai `ChildRowsEditor`.
`gedung`/`sekolah` denorm di BE — tidak dikirim. Saat edit, muat doc + fasilitas.

**Files:**
- Create: `apps/school/src/components/infrastruktur/RuanganFormModal.tsx`
- Test: `apps/school/src/components/infrastruktur/RuanganFormModal.test.tsx`

- [ ] **Step 1: Tulis test gagal**

```tsx
// apps/school/src/components/infrastruktur/RuanganFormModal.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const createMut = vi.fn().mockResolvedValue({ name: "L1-R1" });
const updateMut = vi.fn().mockResolvedValue({ name: "L1-R1" });
let docData: Record<string, unknown> | undefined;
vi.mock("@sekolahpro/api-client", () => ({
  useResourceCreate: () => ({ mutateAsync: createMut, isPending: false }),
  useResourceUpdate: () => ({ mutateAsync: updateMut, isPending: false }),
  useResourceDoc: () => ({ data: docData }),
}));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));

import { RuanganFormModal } from "./RuanganFormModal";

const LANTAI = [{ name: "GA-L1", label: "Lantai 1" }];

describe("RuanganFormModal", () => {
  beforeEach(() => { createMut.mockClear(); updateMut.mockClear(); docData = undefined; });

  it("disable submit saat tdk ada lantai", () => {
    render(<RuanganFormModal open lantaiOptions={[]} onClose={() => {}} onSaved={() => {}} />);
    expect((screen.getByText("Simpan") as HTMLButtonElement).disabled).toBe(true);
  });

  it("create kirim field wajib + fasilitas array", async () => {
    render(<RuanganFormModal open lantaiOptions={LANTAI} onClose={() => {}} onSaved={() => {}} />);
    fireEvent.change(screen.getByLabelText("Nama Ruangan"), { target: { value: "Kelas 1A" } });
    fireEvent.change(screen.getByLabelText("Kode Ruangan"), { target: { value: "R1" } });
    fireEvent.change(screen.getByLabelText("Lantai"), { target: { value: "GA-L1" } });
    fireEvent.change(screen.getByLabelText("Jenis Ruangan"), { target: { value: "Kelas" } });
    fireEvent.click(screen.getByText("Tambah Fasilitas"));
    fireEvent.change(screen.getByLabelText("Nama baris 1"), { target: { value: "Kursi" } });
    fireEvent.click(screen.getByText("Simpan"));
    await waitFor(() => expect(createMut).toHaveBeenCalled());
    const payload = createMut.mock.calls[0][0];
    expect(payload).toMatchObject({ nama: "Kelas 1A", kode: "R1", lantai: "GA-L1", jenis_ruangan: "Kelas" });
    expect(payload.fasilitas).toEqual([{ nama_fasilitas: "Kursi" }]);
    expect(payload.gedung).toBeUndefined();
  });

  it("edit memuat data & memanggil update", async () => {
    docData = { name: "L1-R1", nama: "Kelas 1A", kode: "R1", lantai: "GA-L1", jenis_ruangan: "Kelas", status: "Tersedia", fasilitas: [] };
    render(<RuanganFormModal open editName="L1-R1" lantaiOptions={LANTAI} onClose={() => {}} onSaved={() => {}} />);
    await screen.findByDisplayValue("Kelas 1A");
    fireEvent.click(screen.getByText("Simpan"));
    await waitFor(() => expect(updateMut).toHaveBeenCalled());
    expect(updateMut.mock.calls[0][0].name).toBe("L1-R1");
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @sekolahpro/app-school test -- RuanganFormModal`
Expected: FAIL — module belum ada.

- [ ] **Step 3: Implementasi**

```tsx
// apps/school/src/components/infrastruktur/RuanganFormModal.tsx
/**
 * RuanganFormModal — create/edit Ruangan + child grid Fasilitas.
 * gedung & sekolah denorm otomatis dari `lantai` di backend → tidak dikirim.
 * Child table `fasilitas` dikirim penuh (Frappe full-replace).
 */
import { useEffect, useState } from "react";
import { Button, FormField, FormGrid, Input, Modal, Select } from "@sekolahpro/ui";
import { useResourceCreate, useResourceDoc, useResourceUpdate } from "@sekolahpro/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { ChildRowsEditor, type ChildColumn } from "./ChildRowsEditor";

export interface LantaiOption { name: string; label: string; }
interface Fasilitas extends Record<string, unknown> { nama_fasilitas?: string; jumlah?: number; kondisi?: string; }

interface RuanganFormModalProps {
  open: boolean;
  onClose: () => void;
  lantaiOptions: LantaiOption[];
  editName?: string;
  onSaved?: (name: string) => void;
}

const JENIS = ["Kelas", "Lab", "Perpustakaan", "Aula", "Kamar Asrama", "Musholla", "Kantor", "Gudang", "Lainnya"];
const STATUS = ["Tersedia", "Dipakai", "Maintenance"];
const FASILITAS_COLS: ChildColumn<Fasilitas>[] = [
  { key: "nama_fasilitas", label: "Nama", type: "text", required: true },
  { key: "jumlah", label: "Jumlah", type: "number" },
  { key: "kondisi", label: "Kondisi", options: ["Baik", "Rusak"] },
];

interface FormState { nama: string; kode: string; lantai: string; jenis_ruangan: string; kapasitas: string; luas_m2: string; status: string; }
const INITIAL: FormState = { nama: "", kode: "", lantai: "", jenis_ruangan: "", kapasitas: "", luas_m2: "", status: "Tersedia" };

export function RuanganFormModal({ open, onClose, lantaiOptions, editName, onSaved }: RuanganFormModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [fasilitas, setFasilitas] = useState<Fasilitas[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Ruangan");
  const update = useResourceUpdate<{ name: string }>("Ruangan");
  const docQ = useResourceDoc<Record<string, unknown>>("Ruangan", editName, { enabled: !!editName });

  useEffect(() => {
    if (docQ.data) {
      const d = docQ.data as Record<string, unknown>;
      setForm({
        nama: `${d.nama ?? ""}`, kode: `${d.kode ?? ""}`, lantai: `${d.lantai ?? ""}`,
        jenis_ruangan: `${d.jenis_ruangan ?? ""}`, kapasitas: `${d.kapasitas ?? ""}`,
        luas_m2: `${d.luas_m2 ?? ""}`, status: `${d.status ?? "Tersedia"}`,
      });
      setFasilitas(((d.fasilitas as Fasilitas[]) ?? []).map((f) => ({ nama_fasilitas: f.nama_fasilitas, jumlah: f.jumlah, kondisi: f.kondisi })));
    } else if (!editName) { setForm(INITIAL); setFasilitas([]); }
  }, [docQ.data, editName]);

  const set = <K extends keyof FormState>(k: K, v: string) => setForm((c) => ({ ...c, [k]: v }));

  const noLantai = lantaiOptions.length === 0 && !editName;
  const canSubmit = !!form.nama.trim() && !!form.kode.trim() && !!form.lantai && !!form.jenis_ruangan && !noLantai && !create.isPending && !update.isPending;

  const submit = async () => {
    setErr(null);
    try {
      const payload: Record<string, unknown> = {
        nama: form.nama.trim(), kode: form.kode.trim(), lantai: form.lantai,
        jenis_ruangan: form.jenis_ruangan, status: form.status, fasilitas,
      };
      if (form.kapasitas.trim()) payload.kapasitas = Number(form.kapasitas);
      if (form.luas_m2.trim()) payload.luas_m2 = Number(form.luas_m2);
      let name: string;
      if (editName) name = (await update.mutateAsync({ name: editName, patch: payload })).name;
      else name = (await create.mutateAsync(payload)).name;
      await qc.invalidateQueries({ queryKey: ["resource:list", "Ruangan"] });
      await qc.invalidateQueries({ queryKey: ["resource:list", "Fasilitas Ruangan"] });
      if (onSaved) onSaved(name);
      onClose();
    } catch (e) { setErr((e as Error)?.message ?? "Gagal menyimpan ruangan."); }
  };

  return (
    <Modal open={open} onClose={onClose} size="xl" tone="brand" title={editName ? "Edit Ruangan" : "Tambah Ruangan"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={submit} disabled={!canSubmit}>{create.isPending || update.isPending ? "Menyimpan..." : "Simpan"}</Button>
        </div>
      }
    >
      <div className="space-y-5">
        {noLantai && <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">Buat Lantai dulu sebelum menambah Ruangan.</div>}
        <FormGrid cols={2}>
          <FormField label="Nama Ruangan" required><Input aria-label="Nama Ruangan" value={form.nama} onChange={(e) => set("nama", e.target.value)} /></FormField>
          <FormField label="Kode Ruangan" required><Input aria-label="Kode Ruangan" value={form.kode} onChange={(e) => set("kode", e.target.value)} /></FormField>
          <FormField label="Lantai" required>
            <Select aria-label="Lantai" value={form.lantai} onChange={(e) => set("lantai", e.target.value)}>
              <option value="">— pilih —</option>
              {lantaiOptions.map((l) => <option key={l.name} value={l.name}>{l.label}</option>)}
            </Select>
          </FormField>
          <FormField label="Jenis Ruangan" required>
            <Select aria-label="Jenis Ruangan" value={form.jenis_ruangan} onChange={(e) => set("jenis_ruangan", e.target.value)}>
              <option value="">— pilih —</option>
              {JENIS.map((j) => <option key={j} value={j}>{j}</option>)}
            </Select>
          </FormField>
          <FormField label="Kapasitas"><Input aria-label="Kapasitas" type="number" value={form.kapasitas} onChange={(e) => set("kapasitas", e.target.value)} /></FormField>
          <FormField label="Luas (m²)"><Input aria-label="Luas" type="number" value={form.luas_m2} onChange={(e) => set("luas_m2", e.target.value)} /></FormField>
          <FormField label="Status">
            <Select aria-label="Status" value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FormField>
        </FormGrid>
        <div>
          <div className="mb-2 text-sm font-medium text-fg">Fasilitas</div>
          <ChildRowsEditor<Fasilitas> rows={fasilitas} columns={FASILITAS_COLS} onChange={setFasilitas} addLabel="Tambah Fasilitas" />
        </div>
        {err && <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">{err}</div>}
      </div>
    </Modal>
  );
}
```

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm --filter @sekolahpro/app-school test -- RuanganFormModal`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web add apps/school/src/components/infrastruktur/RuanganFormModal.tsx apps/school/src/components/infrastruktur/RuanganFormModal.test.tsx
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web commit -m "feat(infrastruktur): RuanganFormModal CRUD + grid Fasilitas"
```

---

## Task 5: UtilitasFormModal (modal Utilitas + grid Riwayat)

Sama pola dgn Ruangan. `gedung` di-set fixed dari prop `gedungId` saat create;
`sekolah` denorm otomatis. Child grid Riwayat.

**Files:**
- Create: `apps/school/src/components/infrastruktur/UtilitasFormModal.tsx`
- Test: `apps/school/src/components/infrastruktur/UtilitasFormModal.test.tsx`

- [ ] **Step 1: Tulis test gagal**

```tsx
// apps/school/src/components/infrastruktur/UtilitasFormModal.test.tsx
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
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));

import { UtilitasFormModal } from "./UtilitasFormModal";

describe("UtilitasFormModal", () => {
  beforeEach(() => { createMut.mockClear(); updateMut.mockClear(); docData = undefined; });

  it("create kirim gedung fixed + jenis + riwayat", async () => {
    render(<UtilitasFormModal open gedungId="SEK-1-GA" onClose={() => {}} onSaved={() => {}} />);
    fireEvent.change(screen.getByLabelText("Jenis Utilitas"), { target: { value: "Listrik" } });
    fireEvent.click(screen.getByText("Tambah Riwayat"));
    fireEvent.change(screen.getByLabelText("Tanggal Catat baris 1"), { target: { value: "2026-05-01" } });
    fireEvent.click(screen.getByText("Simpan"));
    await waitFor(() => expect(createMut).toHaveBeenCalled());
    const payload = createMut.mock.calls[0][0];
    expect(payload.gedung).toBe("SEK-1-GA");
    expect(payload.jenis).toBe("Listrik");
    expect(payload.riwayat).toEqual([{ tanggal_catat: "2026-05-01" }]);
  });

  it("edit memuat & update tanpa menimpa gedung", async () => {
    docData = { name: "GA-Listrik", gedung: "SEK-1-GA", jenis: "Listrik", status: "Aktif", riwayat: [] };
    render(<UtilitasFormModal open gedungId="SEK-1-GA" editName="GA-Listrik" onClose={() => {}} onSaved={() => {}} />);
    await screen.findByDisplayValue("Listrik");
    fireEvent.click(screen.getByText("Simpan"));
    await waitFor(() => expect(updateMut).toHaveBeenCalled());
    expect(updateMut.mock.calls[0][0].name).toBe("GA-Listrik");
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @sekolahpro/app-school test -- UtilitasFormModal`
Expected: FAIL — module belum ada.

- [ ] **Step 3: Implementasi**

```tsx
// apps/school/src/components/infrastruktur/UtilitasFormModal.tsx
/**
 * UtilitasFormModal — create/edit Utilitas Gedung + child grid Riwayat.
 * gedung di-set dari gedungId saat create; sekolah denorm otomatis di backend.
 */
import { useEffect, useState } from "react";
import { Button, FormField, FormGrid, Input, Modal, Select } from "@sekolahpro/ui";
import { useResourceCreate, useResourceDoc, useResourceUpdate } from "@sekolahpro/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { ChildRowsEditor, type ChildColumn } from "./ChildRowsEditor";

interface Riwayat extends Record<string, unknown> { tanggal_catat?: string; nilai_meteran?: number; keterangan?: string; }

interface UtilitasFormModalProps {
  open: boolean;
  onClose: () => void;
  gedungId: string;
  editName?: string;
  onSaved?: (name: string) => void;
}

const JENIS = ["Listrik", "Air", "Internet", "Gas", "Lainnya"];
const STATUS = ["Aktif", "Nonaktif"];
const RIWAYAT_COLS: ChildColumn<Riwayat>[] = [
  { key: "tanggal_catat", label: "Tanggal Catat", type: "date", required: true },
  { key: "nilai_meteran", label: "Nilai Meteran", type: "number" },
  { key: "keterangan", label: "Keterangan", type: "text" },
];

interface FormState { jenis: string; provider: string; kapasitas: string; satuan: string; nomor_pelanggan: string; status: string; }
const INITIAL: FormState = { jenis: "", provider: "", kapasitas: "", satuan: "", nomor_pelanggan: "", status: "Aktif" };

export function UtilitasFormModal({ open, onClose, gedungId, editName, onSaved }: UtilitasFormModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [riwayat, setRiwayat] = useState<Riwayat[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Utilitas Gedung");
  const update = useResourceUpdate<{ name: string }>("Utilitas Gedung");
  const docQ = useResourceDoc<Record<string, unknown>>("Utilitas Gedung", editName, { enabled: !!editName });

  useEffect(() => {
    if (docQ.data) {
      const d = docQ.data as Record<string, unknown>;
      setForm({
        jenis: `${d.jenis ?? ""}`, provider: `${d.provider ?? ""}`, kapasitas: `${d.kapasitas ?? ""}`,
        satuan: `${d.satuan ?? ""}`, nomor_pelanggan: `${d.nomor_pelanggan ?? ""}`, status: `${d.status ?? "Aktif"}`,
      });
      setRiwayat(((d.riwayat as Riwayat[]) ?? []).map((r) => ({ tanggal_catat: r.tanggal_catat, nilai_meteran: r.nilai_meteran, keterangan: r.keterangan })));
    } else if (!editName) { setForm(INITIAL); setRiwayat([]); }
  }, [docQ.data, editName]);

  const set = <K extends keyof FormState>(k: K, v: string) => setForm((c) => ({ ...c, [k]: v }));
  const canSubmit = !!form.jenis && !create.isPending && !update.isPending;

  const submit = async () => {
    setErr(null);
    try {
      const payload: Record<string, unknown> = {
        jenis: form.jenis, status: form.status, riwayat,
        provider: form.provider.trim(), kapasitas: form.kapasitas.trim(),
        satuan: form.satuan.trim(), nomor_pelanggan: form.nomor_pelanggan.trim(),
      };
      if (!editName) payload.gedung = gedungId;
      let name: string;
      if (editName) name = (await update.mutateAsync({ name: editName, patch: payload })).name;
      else name = (await create.mutateAsync(payload)).name;
      await qc.invalidateQueries({ queryKey: ["resource:list", "Utilitas Gedung"] });
      if (onSaved) onSaved(name);
      onClose();
    } catch (e) { setErr((e as Error)?.message ?? "Gagal menyimpan utilitas."); }
  };

  return (
    <Modal open={open} onClose={onClose} size="xl" tone="brand" title={editName ? "Edit Utilitas" : "Tambah Utilitas"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={submit} disabled={!canSubmit}>{create.isPending || update.isPending ? "Menyimpan..." : "Simpan"}</Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormGrid cols={2}>
          <FormField label="Jenis Utilitas" required>
            <Select aria-label="Jenis Utilitas" value={form.jenis} onChange={(e) => set("jenis", e.target.value)}>
              <option value="">— pilih —</option>
              {JENIS.map((j) => <option key={j} value={j}>{j}</option>)}
            </Select>
          </FormField>
          <FormField label="Provider"><Input aria-label="Provider" value={form.provider} onChange={(e) => set("provider", e.target.value)} /></FormField>
          <FormField label="Kapasitas"><Input aria-label="Kapasitas" value={form.kapasitas} onChange={(e) => set("kapasitas", e.target.value)} /></FormField>
          <FormField label="Satuan"><Input aria-label="Satuan" value={form.satuan} onChange={(e) => set("satuan", e.target.value)} /></FormField>
          <FormField label="Nomor Pelanggan"><Input aria-label="Nomor Pelanggan" value={form.nomor_pelanggan} onChange={(e) => set("nomor_pelanggan", e.target.value)} /></FormField>
          <FormField label="Status">
            <Select aria-label="Status" value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FormField>
        </FormGrid>
        <div>
          <div className="mb-2 text-sm font-medium text-fg">Riwayat Pencatatan</div>
          <ChildRowsEditor<Riwayat> rows={riwayat} columns={RIWAYAT_COLS} onChange={setRiwayat} addLabel="Tambah Riwayat" />
        </div>
        {err && <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">{err}</div>}
      </div>
    </Modal>
  );
}
```

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm --filter @sekolahpro/app-school test -- UtilitasFormModal`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web add apps/school/src/components/infrastruktur/UtilitasFormModal.tsx apps/school/src/components/infrastruktur/UtilitasFormModal.test.tsx
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web commit -m "feat(infrastruktur): UtilitasFormModal CRUD + grid Riwayat"
```

---

## Task 6: Wiring ke route detail Gedung

Tambah ke `$sekolah.infrastruktur.daftar-gedung.$gedungId.tsx`:
tombol "Tambah" di tiap SectionCard, kolom "Aksi" (Edit/Hapus) di tabel Lantai,
Ruangan, Utilitas, state modal, dan `ConfirmDeleteDialog`. Lantai pakai
`LantaiFormModal`. Tabel Fasilitas tetap read-only.

**Files:**
- Modify: `apps/school/src/routes/$sekolah.infrastruktur.daftar-gedung.$gedungId.tsx`
- Test: `apps/school/src/routes/gedung-detail-crud.test.tsx` (Create — uji helper murni)

- [ ] **Step 1: Tulis test gagal (helper aksi + opsi lantai)**

Ekstrak logika non-UI agar bisa diuji tanpa router. Buat helper di file route
(di-export) `buildLantaiOptions`.

```tsx
// apps/school/src/routes/gedung-detail-crud.test.tsx
import { describe, it, expect } from "vitest";
import { buildLantaiOptions } from "./$sekolah.infrastruktur.daftar-gedung.$gedungId";

describe("buildLantaiOptions", () => {
  it("memetakan Lantai ke {name,label} dgn nomor + nama", () => {
    const opts = buildLantaiOptions([
      { name: "GA-L1", nama: "Lantai Dasar", nomor_lantai: 1 },
      { name: "GA-L2", nama: "Lantai 2", nomor_lantai: 2 },
    ]);
    expect(opts).toEqual([
      { name: "GA-L1", label: "L1 — Lantai Dasar" },
      { name: "GA-L2", label: "L2 — Lantai 2" },
    ]);
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @sekolahpro/app-school test -- gedung-detail-crud`
Expected: FAIL — `buildLantaiOptions` belum di-export.

- [ ] **Step 3: Implementasi wiring**

Di `$sekolah.infrastruktur.daftar-gedung.$gedungId.tsx`:

3a. Tambah import:
```tsx
import { LantaiFormModal } from "../components/infrastruktur/LantaiFormModal";
import { RuanganFormModal, type LantaiOption } from "../components/infrastruktur/RuanganFormModal";
import { UtilitasFormModal } from "../components/infrastruktur/UtilitasFormModal";
import { ConfirmDeleteDialog } from "../components/infrastruktur/ConfirmDeleteDialog";
import { useResourceDelete } from "@sekolahpro/api-client";
```

3b. Tambahkan helper sebelum komponen (di-export untuk test):
```tsx
export function buildLantaiOptions(lantai: Lantai[]): LantaiOption[] {
  return lantai.map((l) => ({ name: l.name, label: `L${l.nomor_lantai ?? "?"} — ${l.nama ?? l.name}` }));
}
```

3c. Di dalam `GedungDetailPage`, tambah state CRUD:
```tsx
  const [lantaiModal, setLantaiModal] = useState<{ open: boolean; editName?: string }>({ open: false });
  const [ruanganModal, setRuanganModal] = useState<{ open: boolean; editName?: string }>({ open: false });
  const [utilitasModal, setUtilitasModal] = useState<{ open: boolean; editName?: string }>({ open: false });
  const [del, setDel] = useState<{ doctype: string; name: string } | null>(null);
  const [delErr, setDelErr] = useState<string | null>(null);
  const delMut = useResourceDelete(del?.doctype ?? "Lantai");
  const lantaiOptions = useMemo(() => buildLantaiOptions(lantaiQ.data ?? []), [lantaiQ.data]);

  const confirmDelete = async () => {
    if (!del) return;
    setDelErr(null);
    try {
      await delMut.mutateAsync(del.name);
      await Promise.all([lantaiQ.refetch(), ruanganQ.refetch(), utilitasQ.refetch(), fasilitasQ.refetch()]);
      setDel(null);
    } catch (e) { setDelErr((e as Error)?.message ?? "Gagal menghapus."); }
  };
```

3d. Tambah kolom Aksi reusable (sebelum return atau sbg fungsi dlm komponen):
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

3e. Pada tiap `SectionCard` Lantai/Ruangan/Utilitas, beri prop `action` tombol Tambah, dan tambahkan `actionCol` ke `columns`:
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
(Idem untuk Ruangan → `setRuanganModal`, doctype "Ruangan"; Utilitas → `setUtilitasModal`, doctype "Utilitas Gedung". Tabel Fasilitas TIDAK diberi aksi — tetap read-only.)

3f. Render modal + dialog sebelum penutup `</>` di `primary`:
```tsx
<LantaiFormModal
  open={lantaiModal.open}
  onClose={() => setLantaiModal({ open: false })}
  gedungId={gedungId}
  {...(lantaiModal.editName ? { editName: lantaiModal.editName } : {})}
  onSaved={() => { void lantaiQ.refetch(); }}
/>
<RuanganFormModal
  open={ruanganModal.open}
  onClose={() => setRuanganModal({ open: false })}
  lantaiOptions={lantaiOptions}
  {...(ruanganModal.editName ? { editName: ruanganModal.editName } : {})}
  onSaved={() => { void ruanganQ.refetch(); void fasilitasQ.refetch(); }}
/>
<UtilitasFormModal
  open={utilitasModal.open}
  onClose={() => setUtilitasModal({ open: false })}
  gedungId={gedungId}
  {...(utilitasModal.editName ? { editName: utilitasModal.editName } : {})}
  onSaved={() => { void utilitasQ.refetch(); }}
/>
<ConfirmDeleteDialog
  open={!!del}
  label={del?.name ?? ""}
  error={delErr}
  pending={delMut.isPending}
  onConfirm={confirmDelete}
  onClose={() => { setDel(null); setDelErr(null); }}
/>
```

3g. Pastikan `Button` & `type Column` sudah di-import dari `@sekolahpro/ui` (Button sudah; `Column` sudah ada). Update comment header file (hapus klaim "read-only").

- [ ] **Step 4: Jalankan test + lint + typecheck**

Run: `pnpm --filter @sekolahpro/app-school test -- gedung-detail-crud`
Expected: PASS.
Run: `pnpm --filter @sekolahpro/app-school test`
Expected: semua test app lulus.
Run: `pnpm --filter @sekolahpro/app-school lint`
Expected: 0 error.

- [ ] **Step 5: Commit**

```bash
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web add apps/school/src/routes/$sekolah.infrastruktur.daftar-gedung.$gedungId.tsx apps/school/src/routes/gedung-detail-crud.test.tsx
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web commit -m "feat(infrastruktur): CRUD inline Lantai/Ruangan/Utilitas di detail Gedung"
```

---

## Task 7: Verifikasi manual + dokumentasi OpenWolf

- [ ] **Step 1: Jalankan dev server & cek UI**

Run: `pnpm --filter @sekolahpro/app-school dev`
Buka `/{sekolah}/infrastruktur/daftar-gedung/{gedungId}`. Verifikasi:
Tambah/Edit/Hapus Lantai; Tambah Ruangan dgn grid Fasilitas; Tambah Utilitas dgn
grid Riwayat; konfirmasi hapus muncul; tabel refresh tanpa reload.
Catatan R1: jika login bukan System Manager → create gagal 403 (sesuai spec).

- [ ] **Step 2: Update OpenWolf**

Update `apps/school/.wolf/anatomy.md` (5 file baru + 2 modifikasi) dan append
`apps/school/.wolf/memory.md`. Jika ada bug saat run, log ke `.wolf/buglog.json`.

- [ ] **Step 3: Commit dokumentasi**

```bash
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web add apps/school/.wolf
git -C /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web commit -m "docs(infrastruktur): update anatomy + memory utk CRUD Gedung"
```

---

## Self-Review (penulis plan)

- **Spec coverage:** Lantai CRUD (T2+T6), Ruangan CRUD+Fasilitas (T4+T6),
  Utilitas CRUD+Riwayat (T5+T6), konfirmasi hapus (T3+T6), child grid (T1),
  banner error in-modal (tiap modal), R1 perm didokumentasikan (T7 step1). ✓
- **GenericFormModal:** TIDAK disentuh — Lantai pakai modal dedicated
  `LantaiFormModal` (hindari regresi koperasi). ✓
- **Test infra terverifikasi:** vitest `globals:false` → import {describe,it,expect}
  dari "vitest" (sudah). jsdom + @testing-library/react + jest-dom ada.
  Command: `pnpm --filter @sekolahpro/app-school test -- <namaFile>`. ✓
- **Placeholder scan:** tdk ada TBD/TODO; semua step berisi kode nyata. ✓
- **Type consistency:** `ChildColumn`/`LantaiOption` didefinisikan T1/T4 dan
  dipakai konsisten; `useResource*` signatures sesuai `frappeResource.ts`
  (`update` = `{name, patch}`, `delete` = `name`). ✓
- **Catatan runner:** command pakai `pnpm --filter @sekolahpro/app-school test`
  (script `test: vitest run` terverifikasi di package.json). Jika monorepo pakai
  turbo, `pnpm --filter` tetap valid.
```
