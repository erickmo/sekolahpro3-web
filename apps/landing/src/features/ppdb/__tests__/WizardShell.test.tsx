import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WizardShell } from "../WizardShell";

vi.mock("../api", () => ({
  useGelombangAktif: () => ({
    data: [
      {
        name: "G-1",
        nama: "Gel 1",
        tingkat: "10",
        kuota: 10,
        sisa_kuota: 8,
        tanggal_buka: "2026-01-01",
        tanggal_tutup: "2026-12-31",
        biaya_pendaftaran: 100000,
      },
    ],
    isLoading: false,
    error: null,
  }),
  useDaftarCalonSiswa: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  }),
  useUploadDokumen: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  }),
}));

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => sessionStorage.clear());

describe("WizardShell", () => {
  it("renders Step 1 by default", () => {
    render(wrap(<WizardShell />));
    expect(screen.getByText(/Jalur & Gelombang/i)).toBeInTheDocument();
  });

  it("blocks Next when gelombang not chosen", async () => {
    render(wrap(<WizardShell />));
    fireEvent.click(screen.getByText("Selanjutnya"));
    await waitFor(() => {
      expect(screen.getByText(/Jalur & Gelombang/i)).toBeInTheDocument();
    });
  });

  it("advances to Step 2 with valid gelombang", async () => {
    render(wrap(<WizardShell />));
    const selects = screen.getAllByRole("combobox");
    // selects[0]=jalur (default Reguler), selects[1]=gelombang
    fireEvent.change(selects[1]!, { target: { value: "G-1" } });
    fireEvent.click(screen.getByText("Selanjutnya"));
    await waitFor(() => {
      expect(screen.getByText("Data Diri")).toBeInTheDocument();
    });
  });
});
