/**
 * Render smoke test for GenerateRaportModal.
 *
 * Covers AKA-24: the modal renders and gates the Generate button until the
 * required fields are set. The Entri Nilai pre-flight logic itself is covered
 * functionally by the GenerateRaportModal changes (AKA-15/31).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { GenerateRaportModal } from "./GenerateRaportModal";

vi.mock("@sekolahpro/api-client", () => ({
  useFrappeMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  listResource: vi.fn().mockResolvedValue([]),
  FrappeError: class FrappeError extends Error {},
}));

afterEach(() => cleanup());

// The modal calls useQueryClient for cache invalidation, so a provider is needed.
function renderModal(ui: ReactNode) {
  const client = new QueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("GenerateRaportModal", () => {
  it("renders the modal title when open", () => {
    renderModal(<GenerateRaportModal open onClose={vi.fn()} />);
    expect(screen.getByText("Generate Raport")).toBeTruthy();
  });

  it("disables the Generate button until siswa/semester/TA are chosen", () => {
    renderModal(<GenerateRaportModal open onClose={vi.fn()} />);
    const btn = screen.getByRole("button", { name: /Generate/i });
    expect(btn).toBeDisabled();
  });
});
