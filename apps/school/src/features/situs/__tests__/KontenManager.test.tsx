// PRD: web-situs-sekolah — KontenManager: lists content + opens the add modal.
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const fetchMock = vi.fn(async (method: string, _args?: unknown) => {
  if (method.endsWith("list_konten")) {
    return [
      { name: "BS-1", judul: "Halal Bihalal 2026", kategori: "Berita", status: "Terbit", tanggal_terbit: "2026-05-01" },
    ];
  }
  return { ok: true, name: "BS-2" };
});
vi.mock("@sekolahpro/api-client", async () => {
  const actual = await vi.importActual<typeof import("@sekolahpro/api-client")>("@sekolahpro/api-client");
  return { ...actual, frappeFetch: vi.fn((method: string, args: unknown) => fetchMock(method, args as never)) };
});

import { KontenManager } from "../KontenManager";
import { BERITA_SCHEMA } from "../schemas";

afterEach(() => { cleanup(); fetchMock.mockClear(); });

const savedCalls = () => fetchMock.mock.calls.filter((c) => String(c[0]).endsWith("save_konten"));

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}

describe("KontenManager", () => {
  it("lists existing content rows", async () => {
    render(wrap(<KontenManager sekolah="SMP Demo" schema={BERITA_SCHEMA} />));
    await waitFor(() => expect(screen.getByText("Halal Bihalal 2026")).toBeInTheDocument());
    expect(screen.getByText("Terbit")).toBeInTheDocument();
  });

  it("opens the add modal with the schema fields", async () => {
    render(wrap(<KontenManager sekolah="SMP Demo" schema={BERITA_SCHEMA} />));
    fireEvent.click(screen.getByRole("button", { name: /Tambah Berita/i }));
    await waitFor(() => expect(screen.getByText("Tambah Berita")).toBeInTheDocument());
    // Assert on modal-only field labels (not list-column headers) to avoid ambiguity.
    expect(screen.getByText("Isi (HTML)")).toBeInTheDocument();
    expect(screen.getByText("Ringkasan")).toBeInTheDocument();
    expect(screen.getByText("Penulis")).toBeInTheDocument();
  });

  it("blocks save and flags required fields left empty", async () => {
    render(wrap(<KontenManager sekolah="SMP Demo" schema={BERITA_SCHEMA} />));
    fireEvent.click(screen.getByRole("button", { name: /Tambah Berita/i }));
    await waitFor(() => expect(screen.getByText("Tambah Berita")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /^Simpan$/ }));
    // judul + konten are required and empty → no save call, inline errors shown.
    expect(savedCalls()).toHaveLength(0);
    expect(screen.getAllByText(/wajib diisi/i).length).toBeGreaterThanOrEqual(2);
  });

  it("saves once all required fields are filled", async () => {
    render(wrap(<KontenManager sekolah="SMP Demo" schema={BERITA_SCHEMA} />));
    fireEvent.click(screen.getByRole("button", { name: /Tambah Berita/i }));
    await waitFor(() => expect(screen.getByText("Tambah Berita")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/^Judul/), { target: { value: "Berita Baru" } });
    fireEvent.change(screen.getByLabelText(/^Isi \(HTML\)/), { target: { value: "<p>x</p>" } });
    fireEvent.click(screen.getByRole("button", { name: /^Simpan$/ }));
    await waitFor(() => expect(savedCalls()).toHaveLength(1));
    const [, args] = savedCalls()[0]!;
    expect((args as { values: { judul: string } }).values.judul).toBe("Berita Baru");
  });

  it("shows a loading skeleton while the list is fetching", () => {
    fetchMock.mockImplementationOnce(() => new Promise(() => {})); // list_konten never resolves
    render(wrap(<KontenManager sekolah="SMP Demo" schema={BERITA_SCHEMA} />));
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
  });

  it("shows an error state when the list fails to load", async () => {
    fetchMock.mockImplementationOnce(async () => { throw new Error("boom"); });
    render(wrap(<KontenManager sekolah="SMP Demo" schema={BERITA_SCHEMA} />));
    await waitFor(() => expect(screen.getByText(/gagal memuat/i)).toBeInTheDocument());
  });
});
