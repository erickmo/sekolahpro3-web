import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { cleanup } from "@testing-library/react";

const createMut = vi.fn().mockResolvedValue({ name: "GA-Listrik" });
const updateMut = vi.fn().mockResolvedValue({ name: "GA-Listrik" });
let docData: Record<string, unknown> | undefined;
vi.mock("@sekolahpro/api-client", () => ({
  useResourceCreate: () => ({ mutateAsync: createMut, isPending: false }),
  useResourceUpdate: () => ({ mutateAsync: updateMut, isPending: false }),
  useResourceDoc: () => ({ data: docData }),
  listResource: vi.fn().mockResolvedValue([{ name: "SEK-1-GA", nama: "Gedung A" }]),
}));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));

import { UtilitasGedungFormModal } from "./UtilitasGedungFormModal";

/** Drive a static SearchableSelect: open via its label, click matching option. */
function pickOption(label: string, value: string) {
  fireEvent.focus(screen.getByLabelText(label, { exact: false }));
  const opt = screen.getAllByRole("option").find((o) => o.textContent === value);
  if (!opt) throw new Error(`Opsi "${value}" untuk "${label}" tidak ditemukan`);
  fireEvent.mouseDown(opt);
}

describe("UtilitasGedungFormModal", () => {
  afterEach(() => cleanup());
  beforeEach(() => { createMut.mockClear(); updateMut.mockClear(); docData = undefined; });

  it("create dgn defaultGedung + jenis", async () => {
    render(<UtilitasGedungFormModal open defaultGedung="SEK-1-GA" onClose={() => {}} />);
    pickOption("Jenis", "Listrik");
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
