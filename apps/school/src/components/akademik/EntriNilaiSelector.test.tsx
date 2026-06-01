/**
 * Unit tests for EntriNilaiSelector.
 *
 * Covers AKA-25 (readiness guard drives submit) and AKA-13 (pre-flight
 * Komponen Nilai check blocks opening an empty grid).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { listResource } from "@sekolahpro/api-client";
import { EntriNilaiSelector } from "./EntriNilaiSelector";

vi.mock("@sekolahpro/api-client", () => ({ listResource: vi.fn() }));
const mockedList = vi.mocked(listResource);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const complete = { rombel: "R1", mapel: "M1", semester: "Ganjil", tahunAjaran: "S-2025" };

describe("EntriNilaiSelector", () => {
  it("emits the selection once the mapel is confirmed to have komponen", async () => {
    mockedList.mockResolvedValue([{ name: "K1" }] as never);
    const onStart = vi.fn();
    render(<EntriNilaiSelector initial={complete} onStart={onStart} />);
    fireEvent.click(screen.getByRole("button", { name: /Buka Editor Nilai/i }));
    await waitFor(() => expect(onStart).toHaveBeenCalledWith(complete));
  });

  it("blocks and warns when the mapel has no Komponen Nilai", async () => {
    mockedList.mockResolvedValue([] as never);
    const onStart = vi.fn();
    render(<EntriNilaiSelector initial={complete} onStart={onStart} />);
    fireEvent.click(screen.getByRole("button", { name: /Buka Editor Nilai/i }));
    await waitFor(() => expect(screen.getByText(/belum punya Komponen Nilai/i)).toBeTruthy());
    expect(onStart).not.toHaveBeenCalled();
  });

  it("disables submit while any field is missing", () => {
    const onStart = vi.fn();
    render(<EntriNilaiSelector initial={{ rombel: "R1", mapel: "M1" }} onStart={onStart} />);
    expect(screen.getByRole("button", { name: /Buka Editor Nilai/i })).toBeDisabled();
    expect(onStart).not.toHaveBeenCalled();
  });
});
