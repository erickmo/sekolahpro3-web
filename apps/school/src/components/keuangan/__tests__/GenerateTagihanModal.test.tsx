import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { GenerateTagihanModal } from "../GenerateTagihanModal";
import type { GenerateSummary } from "../../../data/fee-structure";

afterEach(cleanup);

const SUMMARY: GenerateSummary = {
  created: 3,
  skipped: 0,
  total_amount: 750000,
  by_component: [{ nama: "SPP", count: 3, amount: 750000 }],
  warnings: [],
  errors: [],
};

describe("GenerateTagihanModal", () => {
  it("shows preview figures after dry-run, then confirms", async () => {
    const onGenerate = vi.fn().mockResolvedValue(SUMMARY);
    const onConfirmed = vi.fn();
    render(
      <GenerateTagihanModal
        open
        periode="2026-05"
        onClose={() => {}}
        onGenerate={onGenerate}
        onConfirmed={onConfirmed}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /pratinjau/i }));
    // `^3 siswa` matches the summary <p> only, not the "SPP: 3 siswa" line.
    expect(await screen.findByText(/^3 siswa/)).toBeTruthy();
    expect(onGenerate).toHaveBeenCalledWith(expect.objectContaining({ dry_run: 1 }));

    fireEvent.click(screen.getByRole("button", { name: /buat tagihan/i }));
    await vi.waitFor(() => expect(onConfirmed).toHaveBeenCalledWith(SUMMARY));
    expect(onGenerate).toHaveBeenLastCalledWith(expect.objectContaining({ dry_run: 0 }));
  });
});
