import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { cleanup } from "@testing-library/react";

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
  afterEach(() => cleanup());
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
