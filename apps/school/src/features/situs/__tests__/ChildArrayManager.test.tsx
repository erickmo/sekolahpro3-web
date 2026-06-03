// ChildArrayManager: add/reorder/delete rows then save the whole array under `field`.
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const saveMock = vi.fn(async (_method: string, _args: unknown) => ({}));
vi.mock("@sekolahpro/api-client", async () => {
  const actual = await vi.importActual<typeof import("@sekolahpro/api-client")>("@sekolahpro/api-client");
  return { ...actual, frappeFetch: vi.fn((method: string, args: unknown) => saveMock(method, args)) };
});

import { ChildArrayManager } from "../ChildArrayManager";
import type { ChildSchema } from "../schemas";
import type { KeunggulanRow } from "../../../data/situs";

const SCHEMA: ChildSchema = {
  field: "keunggulan",
  singular: "Keunggulan",
  titleField: "judul",
  fields: [
    { name: "ikon", label: "Ikon", type: "text" },
    { name: "judul", label: "Judul", type: "text", required: true, listColumn: true },
    { name: "deskripsi", label: "Deskripsi", type: "textarea" },
  ],
};

afterEach(() => { cleanup(); saveMock.mockClear(); });

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}

const rows: Record<string, unknown>[] = [
  { ikon: "a", judul: "Pertama", deskripsi: "x" } satisfies KeunggulanRow,
  { ikon: "b", judul: "Kedua", deskripsi: "y" } satisfies KeunggulanRow,
];

describe("ChildArrayManager", () => {
  it("renders existing rows by title", () => {
    render(wrap(<ChildArrayManager sekolah="SMP Demo" schema={SCHEMA} rows={rows} />));
    expect(screen.getByText("Pertama")).toBeInTheDocument();
    expect(screen.getByText("Kedua")).toBeInTheDocument();
  });

  it("reorder up sends the swapped order under the field key", async () => {
    render(wrap(<ChildArrayManager sekolah="SMP Demo" schema={SCHEMA} rows={rows} />));
    // Naikkan baris kedua → menjadi urutan pertama.
    fireEvent.click(screen.getAllByRole("button", { name: /Naikkan/i })[1]!);
    fireEvent.click(screen.getByRole("button", { name: /Simpan/i }));
    await waitFor(() => expect(saveMock).toHaveBeenCalled());
    const [method, args] = saveMock.mock.calls[0]!;
    expect(method).toBe("sekolahpro.api.situs_admin.save_situs");
    expect((args as { values: { keunggulan: KeunggulanRow[] } }).values.keunggulan.map((r) => r.judul))
      .toEqual(["Kedua", "Pertama"]);
  });

  it("reorder down moves the first row below the second", async () => {
    render(wrap(<ChildArrayManager sekolah="SMP Demo" schema={SCHEMA} rows={rows} />));
    fireEvent.click(screen.getAllByRole("button", { name: /Turunkan/i })[0]!);
    fireEvent.click(screen.getByRole("button", { name: /^Simpan$/i }));
    await waitFor(() => expect(saveMock).toHaveBeenCalled());
    const [, args] = saveMock.mock.calls[0]!;
    expect((args as { values: { keunggulan: KeunggulanRow[] } }).values.keunggulan.map((r) => r.judul))
      .toEqual(["Kedua", "Pertama"]);
  });

  it("disables up on the first row and down on the last row", () => {
    render(wrap(<ChildArrayManager sekolah="SMP Demo" schema={SCHEMA} rows={rows} />));
    expect(screen.getAllByRole("button", { name: /Naikkan/i })[0]).toBeDisabled();
    const turun = screen.getAllByRole("button", { name: /Turunkan/i });
    expect(turun[turun.length - 1]).toBeDisabled();
  });

  it("disables both reorder buttons when there is only one row", () => {
    render(wrap(<ChildArrayManager sekolah="SMP Demo" schema={SCHEMA} rows={[rows[0]!]} />));
    expect(screen.getByRole("button", { name: /Naikkan/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Turunkan/i })).toBeDisabled();
  });

  it("delete removes the row from the saved payload", async () => {
    render(wrap(<ChildArrayManager sekolah="SMP Demo" schema={SCHEMA} rows={rows} />));
    fireEvent.click(screen.getAllByRole("button", { name: /Hapus/i })[0]!);
    fireEvent.click(screen.getByRole("button", { name: /Simpan/i }));
    await waitFor(() => expect(saveMock).toHaveBeenCalled());
    const [, args] = saveMock.mock.calls[0]!;
    expect((args as { values: { keunggulan: KeunggulanRow[] } }).values.keunggulan.map((r) => r.judul))
      .toEqual(["Kedua"]);
  });

  it("add row then save includes the new row's edited title", async () => {
    render(wrap(<ChildArrayManager sekolah="SMP Demo" schema={SCHEMA} rows={[]} />));
    fireEvent.click(screen.getByRole("button", { name: /Tambah Keunggulan/i }));
    const judul = await screen.findByLabelText(/Judul/);
    fireEvent.change(judul, { target: { value: "Baru" } });
    fireEvent.click(screen.getByRole("button", { name: /^Simpan baris$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Simpan$/i }));
    await waitFor(() => expect(saveMock).toHaveBeenCalled());
    const [, args] = saveMock.mock.calls[0]!;
    expect((args as { values: { keunggulan: KeunggulanRow[] } }).values.keunggulan[0]!.judul).toBe("Baru");
  });

  it("keeps unsaved edits when the parent re-supplies the same server rows", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const tree = (rowsProp: Record<string, unknown>[]) => (
      <QueryClientProvider client={qc}>
        <ChildArrayManager sekolah="SMP Demo" schema={SCHEMA} rows={rowsProp} />
      </QueryClientProvider>
    );
    const { rerender } = render(tree(rows));
    // Edit row 0's title locally (commit the modal draft, but do NOT click Simpan).
    fireEvent.click(screen.getAllByRole("button", { name: /^Ubah$/i })[0]!);
    fireEvent.change(await screen.findByLabelText(/Judul/), { target: { value: "Diedit" } });
    fireEvent.click(screen.getByRole("button", { name: /^Simpan baris$/i }));
    expect(screen.getByText("Diedit")).toBeInTheDocument();
    // A background refetch hands back a fresh array with identical server values.
    rerender(tree(rows.map((r) => ({ ...r }))));
    // The unsaved local edit must survive (no clobber from the re-sync effect).
    expect(screen.getByText("Diedit")).toBeInTheDocument();
    expect(screen.queryByText("Pertama")).toBeNull();
  });
});
