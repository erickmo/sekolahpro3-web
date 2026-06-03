import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
  useParams: () => ({ sekolah: "smp-demo" }),
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));

const saveMock = vi.fn(async (_method: string, _args: unknown) => ({}));
const defaultFetch = (method: string, args: unknown): Promise<unknown> => {
  if (method.endsWith("get_situs")) {
    return Promise.resolve({
      sekolah: "smp-demo",
      layout_blocks: [
        { tipe: "hero", variant: "split", aktif: 1, judul: "Selamat Datang" },
        { tipe: "berita", variant: "default", aktif: 1, judul: "Kabar" },
      ],
    });
  }
  return saveMock(method, args);
};
const fetchMock = vi.fn(defaultFetch);
vi.mock("@sekolahpro/api-client", async () => {
  const actual = await vi.importActual<typeof import("@sekolahpro/api-client")>("@sekolahpro/api-client");
  return { ...actual, frappeFetch: vi.fn((method: string, args: unknown) => fetchMock(method, args)) };
});

import { TataLetakPage } from "../sch.$sekolah.situs.tataletak";
import type { LayoutBlockRow } from "../../data/situs";

afterEach(() => { cleanup(); saveMock.mockClear(); fetchMock.mockImplementation(defaultFetch); });

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}

function saved(): LayoutBlockRow[] {
  const call = saveMock.mock.calls[0] as unknown as [string, { values: { layout_blocks: LayoutBlockRow[] } }];
  return call[1].values.layout_blocks;
}

describe("TataLetakPage", () => {
  it("lists current blocks in order", async () => {
    render(wrap(<TataLetakPage sekolah="smp-demo" />));
    await waitFor(() => expect(screen.getByDisplayValue("Selamat Datang")).toBeInTheDocument());
    expect(screen.getByDisplayValue("Kabar")).toBeInTheDocument();
  });

  it("reorder down then save swaps block order", async () => {
    render(wrap(<TataLetakPage sekolah="smp-demo" />));
    await waitFor(() => expect(screen.getByDisplayValue("Selamat Datang")).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole("button", { name: /Turunkan/i })[0]!);
    fireEvent.click(screen.getByRole("button", { name: /^Simpan Tata Letak$/i }));
    await waitFor(() => expect(saveMock).toHaveBeenCalled());
    expect(saved().map((b) => b.tipe)).toEqual(["berita", "hero"]);
  });

  it("toggling aktif flips the saved flag", async () => {
    render(wrap(<TataLetakPage sekolah="smp-demo" />));
    await waitFor(() => expect(screen.getByDisplayValue("Selamat Datang")).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole("switch")[0]!);
    fireEvent.click(screen.getByRole("button", { name: /^Simpan Tata Letak$/i }));
    await waitFor(() => expect(saveMock).toHaveBeenCalled());
    expect(saved()[0]!.aktif).toBe(0);
  });

  it("adding a block appends the chosen tipe", async () => {
    render(wrap(<TataLetakPage sekolah="smp-demo" />));
    await waitFor(() => expect(screen.getByDisplayValue("Selamat Datang")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Tambah blok"), { target: { value: "kontak" } });
    fireEvent.click(screen.getByRole("button", { name: /^\+ Tambah Blok$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Simpan Tata Letak$/i }));
    await waitFor(() => expect(saveMock).toHaveBeenCalled());
    expect(saved().map((b) => b.tipe)).toEqual(["hero", "berita", "kontak"]);
  });

  it("changing a block variant persists the picked value", async () => {
    render(wrap(<TataLetakPage sekolah="smp-demo" />));
    await waitFor(() => expect(screen.getByDisplayValue("Selamat Datang")).toBeInTheDocument());
    fireEvent.change(screen.getAllByLabelText("Varian")[0]!, { target: { value: "playful" } });
    fireEvent.click(screen.getByRole("button", { name: /^Simpan Tata Letak$/i }));
    await waitFor(() => expect(saveMock).toHaveBeenCalled());
    expect(saved()[0]!.variant).toBe("playful");
  });

  it("shows a loading skeleton while the layout is fetching", () => {
    fetchMock.mockImplementation(() => new Promise<unknown>(() => {})); // get_situs never resolves
    render(wrap(<TataLetakPage sekolah="smp-demo" />));
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
  });

  it("shows an error state when the layout fails to load", async () => {
    fetchMock.mockImplementation(() => Promise.reject(new Error("boom")));
    render(wrap(<TataLetakPage sekolah="smp-demo" />));
    await waitFor(() => expect(screen.getByText(/gagal memuat/i)).toBeInTheDocument());
  });
});
