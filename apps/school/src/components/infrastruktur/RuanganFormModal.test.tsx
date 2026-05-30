import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { cleanup } from "@testing-library/react";

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
  afterEach(() => cleanup());
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
