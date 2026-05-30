/**
 * Tests untuk PpdbActionPanel — verifikasi visibility matrix berbasis status
 * pendaftaran + endpoint call yang benar saat aksi dipicu.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { PpdbActionPanel } from "../PpdbActionPanel";

vi.mock("@sekolahpro/api-client", () => ({
  frappeFetch: vi.fn(),
}));

import { frappeFetch } from "@sekolahpro/api-client";

function wrap(ui: ReactNode) {
  return <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>;
}

describe("PpdbActionPanel", () => {
  beforeEach(() => {
    vi.mocked(frappeFetch).mockReset();
  });
  afterEach(() => cleanup());

  it("Draft status menampilkan tombol Ajukan", () => {
    render(wrap(<PpdbActionPanel pendaftaranName="PPDB-1" currentStatus="Draft" />));
    expect(screen.getByRole("button", { name: /ajukan pendaftaran/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /finalisasi/i })).not.toBeInTheDocument();
  });

  it("Diajukan status menampilkan tombol Ubah Status, bukan Ajukan", () => {
    render(wrap(<PpdbActionPanel pendaftaranName="PPDB-1" currentStatus="Diajukan" />));
    expect(screen.queryByRole("button", { name: /ajukan pendaftaran/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ubah status/i })).toBeInTheDocument();
  });

  it("Diterima status menampilkan tombol Finalisasi", () => {
    render(wrap(<PpdbActionPanel pendaftaranName="PPDB-1" currentStatus="Diterima" />));
    expect(screen.getByRole("button", { name: /finalisasi/i })).toBeInTheDocument();
  });

  it("Selesai status menyembunyikan semua aksi destruktif", () => {
    render(wrap(<PpdbActionPanel pendaftaranName="PPDB-1" currentStatus="Selesai" />));
    expect(screen.queryByRole("button", { name: /ajukan/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ubah status/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /finalisasi/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /buat order/i })).not.toBeInTheDocument();
  });

  it("klik Ajukan memanggil endpoint ajukan_pendaftaran", async () => {
    vi.mocked(frappeFetch).mockResolvedValue({ name: "PPDB-1" });
    render(wrap(<PpdbActionPanel pendaftaranName="PPDB-1" currentStatus="Draft" />));
    fireEvent.click(screen.getByRole("button", { name: /ajukan pendaftaran/i }));
    await waitFor(() =>
      expect(frappeFetch).toHaveBeenCalledWith(
        "sekolahpro.ppdb.api.ppdb.ajukan_pendaftaran",
        { pendaftaran_ppdb: "PPDB-1" },
      ),
    );
  });

  it("konfirmasi verifikasi memanggil endpoint verifikasi_pendaftaran", async () => {
    vi.mocked(frappeFetch).mockResolvedValue({ name: "PPDB-1" });
    render(wrap(<PpdbActionPanel pendaftaranName="PPDB-1" currentStatus="Diajukan" />));
    fireEvent.click(screen.getByRole("button", { name: /ubah status/i }));
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.click(dialog.getByRole("button", { name: /konfirmasi/i }));
    await waitFor(() =>
      expect(frappeFetch).toHaveBeenCalledWith(
        "sekolahpro.ppdb.api.ppdb.verifikasi_pendaftaran",
        expect.objectContaining({
          pendaftaran_ppdb: "PPDB-1",
          status: "Diverifikasi",
        }),
      ),
    );
  });

  it("konfirmasi finalisasi memanggil endpoint finalisasi_pendaftaran", async () => {
    vi.mocked(frappeFetch).mockResolvedValue({ siswa: "SISWA-001", created: true });
    render(wrap(<PpdbActionPanel pendaftaranName="PPDB-1" currentStatus="Diterima" />));
    fireEvent.click(screen.getByRole("button", { name: /finalisasi → buat siswa/i }));
    const dialog = within(screen.getByRole("dialog"));
    // Dialog footer button: "Finalisasi" (atau "Memproses...") — pakai exact agar tidak match Cancel.
    fireEvent.click(dialog.getByRole("button", { name: "Finalisasi" }));
    await waitFor(() =>
      expect(frappeFetch).toHaveBeenCalledWith(
        "sekolahpro.ppdb.api.ppdb.finalisasi_pendaftaran",
        { pendaftaran_ppdb: "PPDB-1" },
      ),
    );
  });
});
