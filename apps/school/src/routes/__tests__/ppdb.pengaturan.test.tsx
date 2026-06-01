/**
 * Tests untuk halaman Pengaturan PPDB (redesain berbasis SectionCard).
 *
 * Memverifikasi bahwa:
 *  - Tiga seksi pengaturan (Formulir, Biaya, Alur) ter-render dengan field
 *    yang dipertahankan dari versi lama (min bayar, gateway, format no).
 *  - OnboardingChecklist setup pertama ter-render dengan status done/undone
 *    yang diturunkan dari settings (fixture sengaja menyisakan langkah belum
 *    selesai agar checklist tidak ter-collapse pada 100%).
 *
 * Router/auth/api-client di-stub penuh agar test murni terhadap UI tanpa
 * RouterProvider maupun backend Frappe.
 */

// vitest.config sets globals:false → import test API explicitly.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// --- Router stub: Link → anchor, useParams → fixed sekolah, createFileRoute noop. ---
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useParams: () => ({ sekolah: "sekolah-uji" }),
  Link: ({ children }: { children: ReactNode }) => <a href="#stub">{children}</a>,
}));

// --- Auth stub: peran manajer agar guidance konsisten (tidak menggate UI). ---
vi.mock("@sekolahpro/auth", () => ({
  useSession: () => ({ roles: ["kepala_sekolah"] }),
}));

// --- api-client stub: doc setengah terisi → onboarding belum 100%. ---
// format_no_pendaftaran terisi, gateway provider terisi, TAPI min_bayar_persen
// dan wajib_daftar_ulang sengaja kosong agar minimal satu langkah onboarding
// "belum selesai" sehingga OnboardingChecklist tetap dirender.
const PENGATURAN_DOC = {
  name: "Pengaturan PPDB",
  format_no_pendaftaran: "PPDB-.YYYY.-.####.",
  payment_gateway_provider: "Midtrans",
  wajib_seleksi_default: 1,
};

const updateMutate = vi.fn();

vi.mock("@sekolahpro/api-client", () => ({
  useResourceDoc: () => ({
    data: PENGATURAN_DOC,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useResourceUpdate: () => ({ mutateAsync: updateMutate, isPending: false }),
  frappeFetch: vi.fn(),
}));

import { Route } from "../sch.$sekolah.ppdb.pengaturan";

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

function renderPage() {
  // Route adalah object dari createFileRoute stub: { component }.
  const Page = (Route as unknown as { component: () => ReactNode }).component;
  return wrap(<Page />);
}

describe("Halaman Pengaturan PPDB", () => {
  beforeEach(() => {
    updateMutate.mockReset();
  });
  afterEach(() => cleanup());

  it("merender header Pengaturan PPDB", () => {
    renderPage();
    expect(screen.getAllByText(/Pengaturan PPDB/i).length).toBeGreaterThan(0);
  });

  it("merender tiga seksi pengaturan: Formulir, Biaya, Alur", () => {
    renderPage();
    // Judul SectionCard adalah heading; pakai exact agar tidak bentrok dengan
    // teks deskripsi yang juga menyebut "formulir pendaftaran".
    expect(
      screen.getByRole("heading", { name: "Formulir Pendaftaran" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Biaya & Pembayaran" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Alur & Seleksi" })).toBeInTheDocument();
  });

  it("mempertahankan field inti dari versi lama", () => {
    renderPage();
    // Field labels yang harus tetap ada (exact agar tidak match deskripsi).
    expect(screen.getByText("Minimum Bayar (%)")).toBeInTheDocument();
    expect(screen.getByText("Format No. Pendaftaran")).toBeInTheDocument();
    expect(screen.getByText("Provider")).toBeInTheDocument();
    // Nilai tersimpan tetap muncul di input (controlled).
    expect(screen.getByDisplayValue("PPDB-.YYYY.-.####.")).toBeInTheDocument();
  });

  it("merender OnboardingChecklist langkah setup pertama", () => {
    renderPage();
    // Judul checklist (exact, bukan langkah guide yang juga menyebut "langkah setup").
    expect(screen.getByText("Langkah setup PPDB")).toBeInTheDocument();
    // Progress fraction (mis. "x/y selesai").
    expect(screen.getByText(/\d+\/\d+ selesai/i)).toBeInTheDocument();
    // Progressbar dari OnboardingChecklist hadir.
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("merender PageGuide tutorial halaman", () => {
    renderPage();
    expect(screen.getByText(/Cara pakai halaman ini/i)).toBeInTheDocument();
  });
});
