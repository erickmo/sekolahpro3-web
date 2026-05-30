import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

const updateMut = vi.fn().mockResolvedValue({ name: "FF-1" });
const invalidate = vi.fn();
vi.mock("@sekolahpro/api-client", () => ({
  useResourceUpdate: () => ({ mutateAsync: updateMut, isPending: false }),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: invalidate }),
}));

import { InlineToggle } from "./InlineToggle";

describe("InlineToggle", () => {
  beforeEach(() => {
    updateMut.mockClear();
    updateMut.mockResolvedValue({ name: "FF-1" });
    invalidate.mockClear();
  });
  afterEach(() => cleanup());

  it("off→on mengirim patch {field:1} lalu invalidate list", async () => {
    render(<InlineToggle doctype="Feature Flag" name="FF-1" field="enabled" value={0} />);
    const sw = screen.getByRole("switch");
    expect(sw.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(sw);
    await waitFor(() => expect(updateMut).toHaveBeenCalled());
    expect(updateMut.mock.calls[0][0]).toEqual({ name: "FF-1", patch: { enabled: 1 } });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["resource:list", "Feature Flag"] });
  });

  it("on→off mengirim patch {field:0}", async () => {
    render(<InlineToggle doctype="Modul Aktif" name="M-1" field="aktif" value={1} />);
    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() => expect(updateMut).toHaveBeenCalled());
    expect(updateMut.mock.calls[0][0]).toEqual({ name: "M-1", patch: { aktif: 0 } });
  });

  it("optimistic langsung flip aria-checked sebelum mutate selesai", () => {
    render(<InlineToggle doctype="Feature Flag" name="FF-1" field="enabled" value={0} />);
    const sw = screen.getByRole("switch");
    fireEvent.click(sw);
    expect(sw.getAttribute("aria-checked")).toBe("true");
  });

  it("revert optimistic saat mutate gagal", async () => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
    updateMut.mockRejectedValueOnce(new Error("403"));
    render(<InlineToggle doctype="Feature Flag" name="FF-1" field="enabled" value={0} />);
    const sw = screen.getByRole("switch");
    fireEvent.click(sw);
    await waitFor(() => expect(sw.getAttribute("aria-checked")).toBe("false"));
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("klik toggle tidak men-trigger onRowClick (stopPropagation)", () => {
    const rowClick = vi.fn();
    render(
      <div onClick={rowClick}>
        <InlineToggle doctype="Feature Flag" name="FF-1" field="enabled" value={0} />
      </div>,
    );
    fireEvent.click(screen.getByRole("switch"));
    expect(rowClick).not.toHaveBeenCalled();
  });
});
