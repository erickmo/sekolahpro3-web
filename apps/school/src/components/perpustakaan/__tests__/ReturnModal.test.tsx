// Tests for ReturnModal — POST + SUBMIT Pengembalian Buku flow (PERP-ADR-0001).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ReturnModal } from "../ReturnModal";

vi.mock("@sekolahpro/api-client", () => ({
  frappeFetch: vi.fn(),
}));

import { frappeFetch } from "@sekolahpro/api-client";

function wrap(ui: ReactNode) {
  return <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>;
}

describe("ReturnModal", () => {
  beforeEach(() => {
    vi.mocked(frappeFetch).mockReset();
  });
  // RTL auto-cleanup is disabled when vitest globals=false; Modal renders via
  // portal to document.body, so without explicit cleanup the previous test's
  // Simpan button leaks into the next test's DOM. Clean up between tests and
  // scope queries to the current dialog for extra safety.
  afterEach(() => cleanup());

  it("inserts then submits Pengembalian Buku and calls onSuccess", async () => {
    vi.mocked(frappeFetch)
      .mockResolvedValueOnce({ name: "RET-1" })
      .mockResolvedValueOnce({ name: "RET-1", docstatus: 1, total_denda: 5000 });

    const onSuccess = vi.fn();
    render(
      wrap(
        <ReturnModal open peminjaman="LOAN-1" onClose={() => {}} onSuccess={onSuccess} />,
      ),
    );

    const dialog = within(screen.getByRole("dialog"));
    fireEvent.click(dialog.getByRole("button", { name: /simpan/i }));
    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ name: "RET-1", total_denda: 5000 }),
      ),
    );

    expect(frappeFetch).toHaveBeenNthCalledWith(
      1,
      "frappe.client.insert",
      expect.objectContaining({
        doc: expect.objectContaining({
          doctype: "Pengembalian Buku",
          peminjaman: "LOAN-1",
        }),
      }),
    );
    expect(frappeFetch).toHaveBeenNthCalledWith(
      2,
      "frappe.client.submit",
      expect.objectContaining({
        doc: expect.objectContaining({ name: "RET-1" }),
      }),
    );
  });

  it("shows error from Frappe when peminjaman already returned", async () => {
    vi.mocked(frappeFetch).mockRejectedValueOnce(
      new Error("Peminjaman LOAN-1 sudah selesai."),
    );
    render(
      wrap(
        <ReturnModal open peminjaman="LOAN-1" onClose={() => {}} onSuccess={() => {}} />,
      ),
    );
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.click(dialog.getByRole("button", { name: /simpan/i }));
    await waitFor(() =>
      expect(screen.getByText(/sudah selesai/i)).toBeInTheDocument(),
    );
  });
});
