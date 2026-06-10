/**
 * PesanWaliComposer — the Guru roster-inline composer (hosted by StudentSheet).
 * Covers: send gating (blank draft / pending), the inserted doc payload (authoring
 * fields only — the BE controller owns guru/thread/phone/status + Outbox fan-out),
 * channel honesty (WA vs InApp by wali phone), and the post-send success label.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { PesanWaliComposer } from "./PesanWaliComposer";

const mutateAsync = vi.fn().mockResolvedValue({ name: "PW-1" });
let isPending = false;

vi.mock("@sekolahpro/api-client", () => ({
  useResourceCreate: vi.fn(() => ({ mutateAsync, get isPending() { return isPending; } })),
}));

afterEach(() => cleanup());
beforeEach(() => {
  mutateAsync.mockClear();
  isPending = false;
});

function renderComposer(ui: ReactNode) {
  const client = new QueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("PesanWaliComposer", () => {
  it("disables Kirim while the draft is blank", () => {
    renderComposer(<PesanWaliComposer siswa="SIS-7" rombel="ROM-1A" waliPhone="08123" />);
    expect(screen.getByRole("button", { name: /Kirim/i })).toBeDisabled();
  });

  it("inserts a Pesan Wali doc with the authoring fields and WA channel", async () => {
    renderComposer(<PesanWaliComposer siswa="SIS-7" rombel="ROM-1A" waliPhone="08123" />);
    fireEvent.change(screen.getByPlaceholderText(/Tulis pesan/i), {
      target: { value: "Ananda alpa 3 hari" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Kirim/i }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync).toHaveBeenCalledWith({
      siswa: "SIS-7",
      rombel: "ROM-1A",
      kategori: "Umum",
      isi: "Ananda alpa 3 hari",
      arah: "keluar",
      channel: "WA",
    });
  });

  it("falls back to InApp when the wali has no phone and says so", async () => {
    renderComposer(<PesanWaliComposer siswa="SIS-7" rombel="ROM-1A" waliPhone={null} />);
    expect(screen.getByText(/aplikasi wali/i)).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText(/Tulis pesan/i), { target: { value: "halo" } });
    fireEvent.click(screen.getByRole("button", { name: /Kirim/i }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync.mock.calls[0][0]).toMatchObject({ channel: "InApp" });
  });

  it("shows the honest queued label and clears the draft after a WA send", async () => {
    renderComposer(<PesanWaliComposer siswa="SIS-7" rombel="ROM-1A" waliPhone="08123" />);
    const draft = screen.getByPlaceholderText(/Tulis pesan/i) as HTMLTextAreaElement;
    fireEvent.change(draft, { target: { value: "halo bu" } });
    fireEvent.click(screen.getByRole("button", { name: /Kirim/i }));
    await waitFor(() => expect(screen.getByText(/Antre — via WhatsApp/i)).toBeTruthy());
    expect(draft.value).toBe("");
  });

  it("disables Kirim while the mutation is pending (double-send guard)", () => {
    isPending = true;
    renderComposer(<PesanWaliComposer siswa="SIS-7" rombel="ROM-1A" waliPhone="08123" />);
    fireEvent.change(screen.getByPlaceholderText(/Tulis pesan/i), { target: { value: "halo" } });
    expect(screen.getByRole("button", { name: /Mengirim|Kirim/i })).toBeDisabled();
  });

  it("surfaces the insert error instead of pretending success", async () => {
    mutateAsync.mockRejectedValueOnce(new Error("Gagal menyimpan"));
    renderComposer(<PesanWaliComposer siswa="SIS-7" rombel="ROM-1A" waliPhone="08123" />);
    fireEvent.change(screen.getByPlaceholderText(/Tulis pesan/i), { target: { value: "halo" } });
    fireEvent.click(screen.getByRole("button", { name: /Kirim/i }));
    await waitFor(() => expect(screen.getByText(/Gagal menyimpan/i)).toBeTruthy());
  });
});
