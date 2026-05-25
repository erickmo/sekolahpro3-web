// PERP-ADR-0001 — Test DendaDrawer: lists denda + mark-lunas action.
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DendaDrawer } from "../DendaDrawer";

vi.mock("@sekolahpro/api-client", async () => {
  const actual = await vi.importActual<typeof import("@sekolahpro/api-client")>("@sekolahpro/api-client");
  return {
    ...actual,
    useResourceList: () => ({
      data: [
        {
          name: "FINE-1",
          peminjaman: "LOAN-1",
          hari_terlambat: 3,
          denda_per_hari: 1000,
          total_denda: 3000,
          status_bayar: "Belum Lunas",
        },
      ],
      isLoading: false,
    }),
    updateResource: vi.fn().mockResolvedValue({}),
  };
});

import { updateResource } from "@sekolahpro/api-client";

function wrap(ui: React.ReactNode) {
  return <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>;
}

describe("DendaDrawer", () => {
  beforeEach(() => vi.mocked(updateResource).mockClear());

  it("lists denda and marks lunas", async () => {
    render(wrap(<DendaDrawer open peminjaman="LOAN-1" onClose={() => {}} />));
    expect(screen.getByText("Rp 3.000")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /tandai lunas/i }));
    await waitFor(() =>
      expect(updateResource).toHaveBeenCalledWith(
        "Denda Perpustakaan",
        "FINE-1",
        expect.objectContaining({ status_bayar: "Lunas" }),
      ),
    );
  });
});
