// PRD: web-situs-sekolah — KontenManager: lists content + opens the add modal.
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@sekolahpro/api-client", async () => {
  const actual = await vi.importActual<typeof import("@sekolahpro/api-client")>("@sekolahpro/api-client");
  return {
    ...actual,
    frappeFetch: vi.fn(async (method: string) => {
      if (method.endsWith("list_konten")) {
        return [
          { name: "BS-1", judul: "Halal Bihalal 2026", kategori: "Berita", status: "Terbit", tanggal_terbit: "2026-05-01" },
        ];
      }
      return { ok: true };
    }),
  };
});

import { KontenManager } from "../KontenManager";
import { BERITA_SCHEMA } from "../schemas";

afterEach(() => cleanup());

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
});
