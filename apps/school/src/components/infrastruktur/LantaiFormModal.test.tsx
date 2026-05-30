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
